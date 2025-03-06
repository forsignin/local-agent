export type DataType = 'numeric' | 'categorical' | 'temporal' | 'text';

export type ChartType = 'line' | 'bar' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap';

export interface DataColumn {
  name: string;
  type: DataType;
  description?: string;
  statistics?: {
    count: number;
    missing: number;
    unique?: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    median?: number;
    mode?: string | number;
    frequencies?: Record<string | number, number>;
  };
}

export interface DatasetInfo {
  id: string;
  name: string;
  description?: string;
  source: string;
  format: 'csv' | 'json' | 'excel' | 'parquet';
  size: number;
  rowCount: number;
  columnCount: number;
  columns: DataColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisConfig {
  datasetId: string;
  type: 'statistics' | 'visualization' | 'correlation' | 'clustering' | 'prediction';
  options: {
    columns?: string[];
    groupBy?: string;
    chartType?: ChartType;
    parameters?: Record<string, any>;
  };
}

export interface AnalysisResult {
  id: string;
  datasetId: string;
  type: AnalysisConfig['type'];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    summary?: Record<string, any>;
    statistics?: Record<string, any>;
    visualization?: {
      type: ChartType;
      data: any;
      layout: any;
    };
    model?: {
      type: string;
      metrics: Record<string, number>;
      parameters: Record<string, any>;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DataAnalyzerState {
  datasets: Map<string, DatasetInfo>;
  activeAnalyses: Map<string, AnalysisResult>;
  selectedDataset: string | null;
  loading: boolean;
  error: string | null;
} 