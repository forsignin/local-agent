import api from './api';
import type {
  DatasetInfo,
  AnalysisConfig,
  AnalysisResult,
  DataColumn,
} from '../types/dataAnalyzer';

// 数据集管理
export const listDatasets = async (): Promise<DatasetInfo[]> => {
  const response = await api.get('/data-analyzer/datasets');
  return response.data;
};

export const uploadDataset = async (
  file: File,
  options?: {
    name?: string;
    description?: string;
    format?: DatasetInfo['format'];
  }
): Promise<DatasetInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });
  }
  const response = await api.post('/data-analyzer/datasets/upload', formData);
  return response.data;
};

export const deleteDataset = async (datasetId: string): Promise<void> => {
  await api.delete(`/data-analyzer/datasets/${datasetId}`);
};

export const getDatasetInfo = async (datasetId: string): Promise<DatasetInfo> => {
  const response = await api.get(`/data-analyzer/datasets/${datasetId}`);
  return response.data;
};

export const updateDatasetInfo = async (
  datasetId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<DatasetInfo> => {
  const response = await api.put(`/data-analyzer/datasets/${datasetId}`, updates);
  return response.data;
};

// 数据分析
export const startAnalysis = async (
  config: AnalysisConfig
): Promise<{
  analysisId: string;
  status: 'pending';
}> => {
  const response = await api.post('/data-analyzer/analyses', config);
  return response.data;
};

export const getAnalysisStatus = async (
  analysisId: string
): Promise<AnalysisResult> => {
  const response = await api.get(`/data-analyzer/analyses/${analysisId}`);
  return response.data;
};

export const cancelAnalysis = async (analysisId: string): Promise<void> => {
  await api.post(`/data-analyzer/analyses/${analysisId}/cancel`);
};

// 数据预览
export const previewDataset = async (
  datasetId: string,
  options?: {
    limit?: number;
    offset?: number;
    columns?: string[];
  }
): Promise<{
  columns: DataColumn[];
  rows: Record<string, any>[];
  total: number;
}> => {
  const response = await api.get(`/data-analyzer/datasets/${datasetId}/preview`, {
    params: options,
  });
  return response.data;
};

// 数据统计
export const getColumnStatistics = async (
  datasetId: string,
  columnName: string
): Promise<DataColumn['statistics']> => {
  const response = await api.get(
    `/data-analyzer/datasets/${datasetId}/columns/${columnName}/statistics`
  );
  return response.data;
};

// 数据可视化
export const generateVisualization = async (
  datasetId: string,
  config: {
    type: AnalysisConfig['options']['chartType'];
    columns: string[];
    groupBy?: string;
    options?: Record<string, any>;
  }
): Promise<{
  type: string;
  data: any;
  layout: any;
}> => {
  const response = await api.post(
    `/data-analyzer/datasets/${datasetId}/visualize`,
    config
  );
  return response.data;
};

// 相关性分析
export const analyzeCorrelation = async (
  datasetId: string,
  columns: string[]
): Promise<{
  correlationMatrix: number[][];
  columnNames: string[];
}> => {
  const response = await api.post(
    `/data-analyzer/datasets/${datasetId}/correlation`,
    { columns }
  );
  return response.data;
};

// 聚类分析
export const performClustering = async (
  datasetId: string,
  config: {
    columns: string[];
    algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
    parameters: Record<string, any>;
  }
): Promise<{
  clusters: number[];
  centroids?: number[][];
  metrics: Record<string, number>;
}> => {
  const response = await api.post(
    `/data-analyzer/datasets/${datasetId}/clustering`,
    config
  );
  return response.data;
};

// 预测分析
export const trainPredictiveModel = async (
  datasetId: string,
  config: {
    targetColumn: string;
    featureColumns: string[];
    algorithm: 'linear' | 'random_forest' | 'xgboost';
    parameters: Record<string, any>;
    validationSplit?: number;
  }
): Promise<{
  modelId: string;
  metrics: Record<string, number>;
  parameters: Record<string, any>;
}> => {
  const response = await api.post(
    `/data-analyzer/datasets/${datasetId}/train`,
    config
  );
  return response.data;
};

// 导出结果
export const exportAnalysisResult = async (
  analysisId: string,
  format: 'csv' | 'json' | 'excel'
): Promise<Blob> => {
  const response = await api.get(
    `/data-analyzer/analyses/${analysisId}/export`,
    {
      params: { format },
      responseType: 'blob',
    }
  );
  return response.data;
}; 