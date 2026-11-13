export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type ThreatReport = {
  _id: string;
  title: string;
  description: string;
  source_id?: string;
  source_name?: string;
  source_url?: string;
  published_at?: string;
  category?: string;
  severity?: Severity;
  tags?: string[];
  indicators?: string[];
  classification?: {
    method?: string;
    confidence?: number;
    category?: string;
  };
  origin?: string;
  created_at?: string;
};

export type SourceItem = {
  _id: string;
  source_name: string;
  source_url: string;
  source_type: string;
  status?: string;
  last_updated?: string;
  import_count?: number;
};

export type StatsSummary = {
  total_reports: number;
  critical_reports: number;
  high_severity_reports: number;
  malware_reports: number;
  ransomware_reports: number;
  phishing_reports: number;
  sources: number;
};
