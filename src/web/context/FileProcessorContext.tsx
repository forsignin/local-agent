import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  FileInfo,
  FileOperationConfig,
  FileOperationResult,
  ConversionJob,
  BatchOperation,
  FileProcessorState,
  FileType,
} from '../types/fileProcessor';
import * as fileProcessorService from '../services/fileProcessor';

type FileProcessorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILES'; payload: FileInfo[] }
  | { type: 'ADD_FILE'; payload: FileInfo }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SELECT_FILE'; payload: string }
  | { type: 'DESELECT_FILE'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | {
      type: 'SET_CONVERSION_JOB';
      payload: {
        id: string;
        job: ConversionJob;
      };
    }
  | { type: 'REMOVE_CONVERSION_JOB'; payload: string }
  | {
      type: 'SET_BATCH_OPERATION';
      payload: {
        id: string;
        operation: BatchOperation;
      };
    }
  | { type: 'REMOVE_BATCH_OPERATION'; payload: string };

const initialState: FileProcessorState = {
  files: new Map(),
  activeJobs: new Map(),
  batchOperations: new Map(),
  selectedFiles: new Set(),
  loading: false,
  error: null,
};

const FileProcessorContext = createContext<{
  state: FileProcessorState;
  dispatch: React.Dispatch<FileProcessorAction>;
  listFiles: (directory: string) => Promise<void>;
  uploadFile: (file: File, directory?: string) => Promise<FileInfo>;
  deleteFile: (path: string) => Promise<void>;
  startConversion: (config: FileOperationConfig) => Promise<string>;
  cancelConversion: (jobId: string) => Promise<void>;
  startBatchOperation: (
    type: BatchOperation['type'],
    files: string[],
    config: FileOperationConfig
  ) => Promise<string>;
  cancelBatchOperation: (operationId: string) => Promise<void>;
  compressFiles: (
    files: string[],
    options: Parameters<typeof fileProcessorService.compressFiles>[1]
  ) => Promise<FileOperationResult>;
  extractArchive: (
    path: string,
    options: Parameters<typeof fileProcessorService.extractArchive>[1]
  ) => Promise<FileOperationResult>;
}>({
  state: initialState,
  dispatch: () => null,
  listFiles: async () => {},
  uploadFile: async () => ({ name: '', path: '', type: 'binary', size: 0, mimeType: '', lastModified: '' }),
  deleteFile: async () => {},
  startConversion: async () => '',
  cancelConversion: async () => {},
  startBatchOperation: async () => '',
  cancelBatchOperation: async () => {},
  compressFiles: async () => ({ success: false }),
  extractArchive: async () => ({ success: false }),
});

const fileProcessorReducer = (
  state: FileProcessorState,
  action: FileProcessorAction
): FileProcessorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILES': {
      const newFiles = new Map();
      action.payload.forEach((file) => {
        newFiles.set(file.path, file);
      });
      return { ...state, files: newFiles };
    }
    case 'ADD_FILE': {
      const newFiles = new Map(state.files);
      newFiles.set(action.payload.path, action.payload);
      return { ...state, files: newFiles };
    }
    case 'REMOVE_FILE': {
      const newFiles = new Map(state.files);
      newFiles.delete(action.payload);
      const newSelectedFiles = new Set(state.selectedFiles);
      newSelectedFiles.delete(action.payload);
      return {
        ...state,
        files: newFiles,
        selectedFiles: newSelectedFiles,
      };
    }
    case 'SELECT_FILE': {
      const newSelectedFiles = new Set(state.selectedFiles);
      newSelectedFiles.add(action.payload);
      return { ...state, selectedFiles: newSelectedFiles };
    }
    case 'DESELECT_FILE': {
      const newSelectedFiles = new Set(state.selectedFiles);
      newSelectedFiles.delete(action.payload);
      return { ...state, selectedFiles: newSelectedFiles };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedFiles: new Set() };
    case 'SET_CONVERSION_JOB': {
      const newJobs = new Map(state.activeJobs);
      newJobs.set(action.payload.id, action.payload.job);
      return { ...state, activeJobs: newJobs };
    }
    case 'REMOVE_CONVERSION_JOB': {
      const newJobs = new Map(state.activeJobs);
      newJobs.delete(action.payload);
      return { ...state, activeJobs: newJobs };
    }
    case 'SET_BATCH_OPERATION': {
      const newOperations = new Map(state.batchOperations);
      newOperations.set(action.payload.id, action.payload.operation);
      return { ...state, batchOperations: newOperations };
    }
    case 'REMOVE_BATCH_OPERATION': {
      const newOperations = new Map(state.batchOperations);
      newOperations.delete(action.payload);
      return { ...state, batchOperations: newOperations };
    }
    default:
      return state;
  }
};

export const FileProcessorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(fileProcessorReducer, initialState);

  const listFiles = async (directory: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const files = await fileProcessorService.listFiles(directory);
      dispatch({ type: 'SET_FILES', payload: files });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const uploadFile = async (file: File, directory?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const uploadedFile = await fileProcessorService.uploadFile(file, directory);
      dispatch({ type: 'ADD_FILE', payload: uploadedFile });
      return uploadedFile;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteFile = async (path: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await fileProcessorService.deleteFile(path);
      dispatch({ type: 'REMOVE_FILE', payload: path });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startConversion = async (config: FileOperationConfig): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { jobId } = await fileProcessorService.startConversion(config);

      const sourceFile = typeof config.source === 'string'
        ? state.files.get(config.source)
        : null;

      if (sourceFile) {
        dispatch({
          type: 'SET_CONVERSION_JOB',
          payload: {
            id: jobId,
            job: {
              id: jobId,
              source: sourceFile,
              target: {
                type: config.type || 'binary',
                path: config.target || '',
                options: config.options,
              },
              status: 'pending',
              progress: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      // 轮询转换状态
      const pollStatus = async () => {
        try {
          const status = await fileProcessorService.getConversionStatus(jobId);
          dispatch({
            type: 'SET_CONVERSION_JOB',
            payload: {
              id: jobId,
              job: status,
            },
          });

          if (status.status === 'completed' && status.result?.path) {
            const fileInfo: FileInfo = {
              name: status.result.path.split('/').pop() || '',
              path: status.result.path,
              type: status.result.type as FileType,
              size: status.result.size || 0,
              mimeType: status.result.mimeType || 'application/octet-stream',
              lastModified: status.result.lastModified || new Date().toISOString(),
              metadata: status.result.metadata,
            };
            dispatch({ type: 'ADD_FILE', payload: fileInfo });
          }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        }
      };

      setTimeout(pollStatus, 1000);
      return jobId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelConversion = async (jobId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await fileProcessorService.cancelConversion(jobId);
      dispatch({ type: 'REMOVE_CONVERSION_JOB', payload: jobId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startBatchOperation = async (
    type: BatchOperation['type'],
    files: string[],
    config: FileOperationConfig
  ): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { operationId } = await fileProcessorService.startBatchOperation(
        type,
        files,
        config
      );

      const fileInfos = files
        .map((path) => state.files.get(path))
        .filter((file): file is FileInfo => file !== undefined);

      dispatch({
        type: 'SET_BATCH_OPERATION',
        payload: {
          id: operationId,
          operation: {
            id: operationId,
            type,
            files: fileInfos,
            config,
            status: 'pending',
            progress: 0,
            results: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // 轮询批处理状态
      const pollStatus = async () => {
        try {
          const status = await fileProcessorService.getBatchOperationStatus(operationId);
          dispatch({
            type: 'SET_BATCH_OPERATION',
            payload: {
              id: operationId,
              operation: status,
            },
          });

          if (status.status === 'completed') {
            status.results.forEach((result) => {
              if (result.success && result.path) {
                const fileInfo: FileInfo = {
                  name: result.path.split('/').pop() || '',
                  path: result.path,
                  type: result.type as FileType,
                  size: result.size || 0,
                  mimeType: result.mimeType || 'application/octet-stream',
                  lastModified: result.lastModified || new Date().toISOString(),
                  metadata: result.metadata,
                };
                dispatch({ type: 'ADD_FILE', payload: fileInfo });
              }
            });
          }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        }
      };

      setTimeout(pollStatus, 1000);
      return operationId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelBatchOperation = async (operationId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await fileProcessorService.cancelBatchOperation(operationId);
      dispatch({ type: 'REMOVE_BATCH_OPERATION', payload: operationId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const compressFiles = async (
    files: string[],
    options: Parameters<typeof fileProcessorService.compressFiles>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await fileProcessorService.compressFiles(files, options);
      if (result.success && result.path) {
        const fileInfo: FileInfo = {
          name: result.path.split('/').pop() || '',
          path: result.path,
          type: 'archive',
          size: result.size || 0,
          mimeType: result.mimeType || 'application/octet-stream',
          lastModified: result.lastModified || new Date().toISOString(),
          metadata: result.metadata,
        };
        dispatch({ type: 'ADD_FILE', payload: fileInfo });
      }
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const extractArchive = async (
    path: string,
    options: Parameters<typeof fileProcessorService.extractArchive>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await fileProcessorService.extractArchive(path, options);
      if (result.success) {
        // 刷新目标目录的文件列表
        await listFiles(options.target);
      }
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <FileProcessorContext.Provider
      value={{
        state,
        dispatch,
        listFiles,
        uploadFile,
        deleteFile,
        startConversion,
        cancelConversion,
        startBatchOperation,
        cancelBatchOperation,
        compressFiles,
        extractArchive,
      }}
    >
      {children}
    </FileProcessorContext.Provider>
  );
};

export const useFileProcessor = () => {
  const context = useContext(FileProcessorContext);
  if (!context) {
    throw new Error('useFileProcessor must be used within a FileProcessorProvider');
  }
  return context;
}; 