import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ThreatsPage from './pages/ThreatsPage';
import ThreatDetailPage from './pages/ThreatDetailPage';
import ClassificationPage from './pages/ClassificationPage';
import SourcesPage from './pages/SourcesPage';
import DatabasePage from './pages/DatabasePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/threats" element={<ThreatsPage />} />
          <Route path="/threats/:id" element={<ThreatDetailPage />} />
          <Route path="/classification" element={<ClassificationPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/database" element={<DatabasePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
