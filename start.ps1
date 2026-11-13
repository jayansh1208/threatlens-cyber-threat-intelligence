$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $backendDir)) {
    Write-Error "[ERROR] Backend directory not found: $backendDir"
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Error "[ERROR] Frontend directory not found: $frontendDir"
    exit 1
}

if (-not (Test-Path $backendPython)) {
    Write-Host "[INFO] Creating backend virtual environment..."
    Push-Location $backendDir
    try {
        python -m venv .venv
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $backendPython)) {
    Write-Error "[ERROR] Backend virtual environment could not be created."
    exit 1
}

$backendEnv = Join-Path $backendDir ".env"
if (-not (Test-Path $backendEnv)) {
    @(
        "MONGO_URI=mongodb://localhost:27017",
        "DATABASE_NAME=threatlens",
        "BACKEND_PORT=8000",
        "FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173"
    ) | Set-Content -Path $backendEnv -Encoding UTF8
}

$frontendEnv = Join-Path $frontendDir ".env"
if (-not (Test-Path $frontendEnv)) {
    "VITE_API_URL=http://localhost:8000" | Set-Content -Path $frontendEnv -Encoding UTF8
}

$mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if (-not $mongoCheck.TcpTestSucceeded) {
    Write-Error "[ERROR] MongoDB is not running on localhost:27017. Start MongoDB and try again."
    exit 1
}
Write-Host "[OK] MongoDB connected"

& $backendPython -c "import fastapi, pymongo, pydantic, dotenv; print('ok')" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Installing backend dependencies..."
    Push-Location $backendDir
    try {
        & $backendPython -m pip install -r requirements.txt
    }
    finally {
        Pop-Location
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Backend dependency installation failed."
        exit 1
    }
}
Write-Host "[OK] Backend dependencies ready"

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "[INFO] Installing frontend dependencies..."
    Push-Location $frontendDir
    try {
        npm install --no-fund --no-audit
    }
    finally {
        Pop-Location
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Frontend dependency installation failed."
        exit 1
    }
}
Write-Host "[OK] Frontend dependencies ready"

$backendConnections = @(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue)
$frontendConnections = @(Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)
$ignoredStates = @('TimeWait', 'FinWait1', 'FinWait2', 'CloseWait', 'Closing', 'Closed')

$backendActive = $backendConnections | Where-Object { $_.OwningProcess -gt 0 -and $_.State -notin $ignoredStates }
$frontendActive = $frontendConnections | Where-Object { $_.OwningProcess -gt 0 -and $_.State -notin $ignoredStates }

if ($backendActive) {
    Write-Error "[ERROR] Port 8000 is already in use. Close the existing process before starting the app."
    exit 1
}
if ($frontendActive) {
    Write-Error "[ERROR] Port 5173 is already in use. Close the existing process before starting the app."
    exit 1
}

$backendJob = Start-Job -Name "ThreatLensBackend" -ScriptBlock {
    param($backendDir, $backendPython)
    Set-Location $backendDir
    & $backendPython -m uvicorn app.main:app --host 0.0.0.0 --port 8000
} -ArgumentList $backendDir, $backendPython

$frontendJob = Start-Job -Name "ThreatLensFrontend" -ScriptBlock {
    param($frontendDir)
    Set-Location $frontendDir
    npm run dev -- --host 0.0.0.0 --port 5173
} -ArgumentList $frontendDir

$backendReady = $false
$frontendReady = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1

    if (-not $backendReady) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
            if ($health.status -eq "ok") {
                $backendReady = $true
                Write-Host "[OK] FastAPI running"
            }
        }
        catch {
        }
    }

    if (-not $frontendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                Write-Host "[OK] React frontend running"
            }
        }
        catch {
        }
    }

    if ($backendReady -and $frontendReady) {
        break
    }
}

if (-not $backendReady) {
    Stop-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Error "[ERROR] FastAPI backend did not start successfully."
    exit 1
}

if (-not $frontendReady) {
    Stop-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Error "[ERROR] React frontend did not start successfully."
    exit 1
}

Write-Host ""
Write-Host "Frontend:"
Write-Host "http://localhost:5173"
Write-Host ""
Write-Host "Backend:"
Write-Host "http://localhost:8000"
Write-Host ""
Write-Host "API Documentation:"
Write-Host "http://localhost:8000/docs"
Write-Host ""
Start-Process "http://localhost:5173"
Write-Host "Press Ctrl+C to stop both servers."

try {
    while ($true) {
        Start-Sleep -Seconds 2
        $backendStatus = Receive-Job -Job $backendJob -Keep -ErrorAction SilentlyContinue
        $frontendStatus = Receive-Job -Job $frontendJob -Keep -ErrorAction SilentlyContinue
        if ($backendStatus) { $backendStatus | Write-Host }
        if ($frontendStatus) { $frontendStatus | Write-Host }
    }
}
finally {
    Stop-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "[INFO] Backend and frontend stopped cleanly."
}
