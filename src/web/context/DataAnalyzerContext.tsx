import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  DatasetInfo,
  AnalysisConfig,
  AnalysisResult,
  DataAnalyzerState,
} from '../types/dataAnalyzer';
import * as dataAnalyzerService from '../services/dataAnalyzer';

type DataAnalyzerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATASETS'; payload: DatasetInfo[] }
  | { type: 'ADD_DATASET'; payload: DatasetInfo }
  | { type: 'REMOVE_DATASET'; payload: string }
  | { type: 'SELECT_DATASET'; payload: string | null }
  | {
      type: 'SET_ANALYSIS';
      payload: {
        id: string;
        analysis: AnalysisResult;
      };
    }
  | { type: 'REMOVE_ANALYSIS'; payload: string };

const initialState: DataAnalyzerState = {
  datasets: new Map(),
  activeAnalyses: new Map(),
  selectedDataset: null,
  loading: false,
  error: null,
};

const DataAnalyzerContext = createContext<{
  state: DataAnalyzerState;
  dispatch: React.Dispatch<DataAnalyzerAction>;
  listDatasets: () => Promise<void>;
  uploadDataset: (
    file: File,
    options?: Parameters<typeof dataAnalyzerService.uploadDataset>[1]
  ) => Promise<DatasetInfo>;
  deleteDataset: (datasetId: string) => Promise<void>;
  startAnalysis: (config: AnalysisConfig) => Promise<string>;
  cancelAnalysis: (analysisId: string) => Promise<void>;
  generateVisualization: (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.generateVisualization>[1]
  ) => Promise<{
    type: string;
    data: any;
    layout: any;
  }>;
  analyzeCorrelation: (
    datasetId: string,
    columns: string[]
  ) => Promise<{
    correlationMatrix: number[][];
    columnNames: string[];
  }>;
  performClustering: (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.performClustering>[1]
  ) => Promise<{
    clusters: number[];
    centroids?: number[][];
    metrics: Record<string, number>;
  }>;
  trainPredictiveModel: (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.trainPredictiveModel>[1]
  ) => Promise<{
    modelId: string;
    metrics: Record<string, number>;
    parameters: Record<string, any>;
  }>;
}>({
  state: initialState,
  dispatch: () => null,
  listDatasets: async () => {},
  uploadDataset: async () => ({
    id: '',
    name: '',
    source: '',
    format: 'csv',
    size: 0,
    rowCount: 0,
    columnCount: 0,
    columns: [],
    createdAt: '',
    updatedAt: '',
  }),
  deleteDataset: async () => {},
  startAnalysis: async () => '',
  cancelAnalysis: async () => {},
  generateVisualization: async () => ({ type: '', data: null, layout: null }),
  analyzeCorrelation: async () => ({ correlationMatrix: [], columnNames: [] }),
  performClustering: async () => ({ clusters: [], metrics: {} }),
  trainPredictiveModel: async () => ({
    modelId: '',
    metrics: {},
    parameters: {},
  }),
});

const dataAnalyzerReducer = (
  state: DataAnalyzerState,
  action: DataAnalyzerAction
): DataAnalyzerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DATASETS': {
      const newDatasets = new Map();
      action.payload.forEach((dataset) => {
        newDatasets.set(dataset.id, dataset);
      });
      return { ...state, datasets: newDatasets };
    }
    case 'ADD_DATASET': {
      const newDatasets = new Map(state.datasets);
      newDatasets.set(action.payload.id, action.payload);
      return { ...state, datasets: newDatasets };
    }
    case 'REMOVE_DATASET': {
      const newDatasets = new Map(state.datasets);
      newDatasets.delete(action.payload);
      return {
        ...state,
        datasets: newDatasets,
        selectedDataset:
          state.selectedDataset === action.payload ? null : state.selectedDataset,
      };
    }
    case 'SELECT_DATASET':
      return { ...state, selectedDataset: action.payload };
    case 'SET_ANALYSIS': {
      const newAnalyses = new Map(state.activeAnalyses);
      newAnalyses.set(action.payload.id, action.payload.analysis);
      return { ...state, activeAnalyses: newAnalyses };
    }
    case 'REMOVE_ANALYSIS': {
      const newAnalyses = new Map(state.activeAnalyses);
      newAnalyses.delete(action.payload);
      return { ...state, activeAnalyses: newAnalyses };
    }
    default:
      return state;
  }
};

export const DataAnalyzerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(dataAnalyzerReducer, initialState);

  const listDatasets = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const datasets = await dataAnalyzerService.listDatasets();
      dispatch({ type: 'SET_DATASETS', payload: datasets });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const uploadDataset = async (
    file: File,
    options?: Parameters<typeof dataAnalyzerService.uploadDataset>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const dataset = await dataAnalyzerService.uploadDataset(file, options);
      dispatch({ type: 'ADD_DATASET', payload: dataset });
      return dataset;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteDataset = async (datasetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataAnalyzerService.deleteDataset(datasetId);
      dispatch({ type: 'REMOVE_DATASET', payload: datasetId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startAnalysis = async (config: AnalysisConfig): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { analysisId } = await dataAnalyzerService.startAnalysis(config);

      const dataset = state.datasets.get(config.datasetId);
      if (dataset) {
        dispatch({
          type: 'SET_ANALYSIS',
          payload: {
            id: analysisId,
            analysis: {
              id: analysisId,
              datasetId: config.datasetId,
              type: config.type,
              status: 'pending',
              progress: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      // 轮询分析状态
      const pollStatus = async () => {
        try {
          const status = await dataAnalyzerService.getAnalysisStatus(analysisId);
          dispatch({
            type: 'SET_ANALYSIS',
            payload: {
              id: analysisId,
              analysis: status,
            },
          });

          if (status.status === 'processing' || status.status === 'pending') {
            setTimeout(pollStatus, 1000);
          }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        }
      };

      setTimeout(pollStatus, 1000);
      return analysisId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelAnalysis = async (analysisId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataAnalyzerService.cancelAnalysis(analysisId);
      dispatch({ type: 'REMOVE_ANALYSIS', payload: analysisId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateVisualization = async (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.generateVisualization>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      return await dataAnalyzerService.generateVisualization(datasetId, config);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const analyzeCorrelation = async (datasetId: string, columns: string[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      return await dataAnalyzerService.analyzeCorrelation(datasetId, columns);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const performClustering = async (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.performClustering>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      return await dataAnalyzerService.performClustering(datasetId, config);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const trainPredictiveModel = async (
    datasetId: string,
    config: Parameters<typeof dataAnalyzerService.trainPredictiveModel>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      return await dataAnalyzerService.trainPredictiveModel(datasetId, config);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    listDatasets();
  }, []);

  return (
    <DataAnalyzerContext.Provider
      value={{
        state,
        dispatch,
        listDatasets,
        uploadDataset,
        deleteDataset,
        startAnalysis,
        cancelAnalysis,
        generateVisualization,
        analyzeCorrelation,
        performClustering,
        trainPredictiveModel,
      }}
    >
      {children}
    </DataAnalyzerContext.Provider>
  );
};

export const useDataAnalyzer = () => {
  const context = useContext(DataAnalyzerContext);
  if (!context) {
    throw new Error(
      'useDataAnalyzer must be used within a DataAnalyzerProvider'
    );
  }
  return context;
}; 