import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  ProcessInfo,
  SystemMetrics,
  FileSystemOperation,
  ServiceInfo,
  SystemOperatorState,
} from '../types/systemOperator';
import * as systemOperatorService from '../services/systemOperator';

type SystemOperatorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROCESSES'; payload: ProcessInfo[] }
  | { type: 'UPDATE_PROCESS'; payload: ProcessInfo }
  | { type: 'REMOVE_PROCESS'; payload: number }
  | { type: 'SELECT_PROCESS'; payload: number | null }
  | { type: 'SET_METRICS'; payload: SystemMetrics }
  | {
      type: 'SET_FILE_OPERATION';
      payload: {
        id: string;
        operation: FileSystemOperation;
      };
    }
  | { type: 'REMOVE_FILE_OPERATION'; payload: string }
  | { type: 'SET_SERVICES'; payload: ServiceInfo[] }
  | {
      type: 'UPDATE_SERVICE';
      payload: {
        name: string;
        service: ServiceInfo;
      };
    };

const initialState: SystemOperatorState = {
  processes: new Map(),
  metrics: null,
  activeOperations: new Map(),
  services: new Map(),
  selectedProcess: null,
  loading: false,
  error: null,
};

const SystemOperatorContext = createContext<{
  state: SystemOperatorState;
  dispatch: React.Dispatch<SystemOperatorAction>;
  listProcesses: () => Promise<void>;
  killProcess: (
    pid: number,
    options?: Parameters<typeof systemOperatorService.killProcess>[1]
  ) => Promise<void>;
  startFileOperation: (
    operation: Parameters<typeof systemOperatorService.startFileOperation>[0]
  ) => Promise<string>;
  cancelFileOperation: (operationId: string) => Promise<void>;
  setFilePermissions: (
    path: string,
    permissions: Parameters<typeof systemOperatorService.setFilePermissions>[1]
  ) => Promise<void>;
  listServices: () => Promise<void>;
  startService: (name: string) => Promise<void>;
  stopService: (name: string) => Promise<void>;
  restartService: (name: string) => Promise<void>;
  enableService: (name: string) => Promise<void>;
  disableService: (name: string) => Promise<void>;
  executeCommand: (
    command: string,
    options?: Parameters<typeof systemOperatorService.executeCommand>[1]
  ) => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
  }>;
}>({
  state: initialState,
  dispatch: () => null,
  listProcesses: async () => {},
  killProcess: async () => {},
  startFileOperation: async () => '',
  cancelFileOperation: async () => {},
  setFilePermissions: async () => {},
  listServices: async () => {},
  startService: async () => {},
  stopService: async () => {},
  restartService: async () => {},
  enableService: async () => {},
  disableService: async () => {},
  executeCommand: async () => ({
    exitCode: 0,
    stdout: '',
    stderr: '',
    duration: 0,
  }),
});

const systemOperatorReducer = (
  state: SystemOperatorState,
  action: SystemOperatorAction
): SystemOperatorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROCESSES': {
      const newProcesses = new Map();
      action.payload.forEach((process) => {
        newProcesses.set(process.pid, process);
      });
      return { ...state, processes: newProcesses };
    }
    case 'UPDATE_PROCESS': {
      const newProcesses = new Map(state.processes);
      newProcesses.set(action.payload.pid, action.payload);
      return { ...state, processes: newProcesses };
    }
    case 'REMOVE_PROCESS': {
      const newProcesses = new Map(state.processes);
      newProcesses.delete(action.payload);
      return {
        ...state,
        processes: newProcesses,
        selectedProcess:
          state.selectedProcess === action.payload ? null : state.selectedProcess,
      };
    }
    case 'SELECT_PROCESS':
      return { ...state, selectedProcess: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_FILE_OPERATION': {
      const newOperations = new Map(state.activeOperations);
      newOperations.set(action.payload.id, action.payload.operation);
      return { ...state, activeOperations: newOperations };
    }
    case 'REMOVE_FILE_OPERATION': {
      const newOperations = new Map(state.activeOperations);
      newOperations.delete(action.payload);
      return { ...state, activeOperations: newOperations };
    }
    case 'SET_SERVICES': {
      const newServices = new Map();
      action.payload.forEach((service) => {
        newServices.set(service.name, service);
      });
      return { ...state, services: newServices };
    }
    case 'UPDATE_SERVICE': {
      const newServices = new Map(state.services);
      newServices.set(action.payload.name, action.payload.service);
      return { ...state, services: newServices };
    }
    default:
      return state;
  }
};

export const SystemOperatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(systemOperatorReducer, initialState);

  const listProcesses = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const processes = await systemOperatorService.listProcesses();
      dispatch({ type: 'SET_PROCESSES', payload: processes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const killProcess = async (
    pid: number,
    options?: Parameters<typeof systemOperatorService.killProcess>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.killProcess(pid, options);
      dispatch({ type: 'REMOVE_PROCESS', payload: pid });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startFileOperation = async (
    operation: Parameters<typeof systemOperatorService.startFileOperation>[0]
  ): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { operationId } = await systemOperatorService.startFileOperation(
        operation
      );

      dispatch({
        type: 'SET_FILE_OPERATION',
        payload: {
          id: operationId,
          operation: {
            id: operationId,
            ...operation,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // 轮询操作状态
      const pollStatus = async () => {
        try {
          const status = await systemOperatorService.getFileOperationStatus(
            operationId
          );
          dispatch({
            type: 'SET_FILE_OPERATION',
            payload: {
              id: operationId,
              operation: status,
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
      return operationId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelFileOperation = async (operationId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.cancelFileOperation(operationId);
      dispatch({ type: 'REMOVE_FILE_OPERATION', payload: operationId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setFilePermissions = async (
    path: string,
    permissions: Parameters<typeof systemOperatorService.setFilePermissions>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.setFilePermissions(path, permissions);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const listServices = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const services = await systemOperatorService.listServices();
      dispatch({ type: 'SET_SERVICES', payload: services });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startService = async (name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.startService(name);
      const service = await systemOperatorService.getServiceInfo(name);
      dispatch({
        type: 'UPDATE_SERVICE',
        payload: { name, service },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const stopService = async (name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.stopService(name);
      const service = await systemOperatorService.getServiceInfo(name);
      dispatch({
        type: 'UPDATE_SERVICE',
        payload: { name, service },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const restartService = async (name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.restartService(name);
      const service = await systemOperatorService.getServiceInfo(name);
      dispatch({
        type: 'UPDATE_SERVICE',
        payload: { name, service },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const enableService = async (name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.enableService(name);
      const service = await systemOperatorService.getServiceInfo(name);
      dispatch({
        type: 'UPDATE_SERVICE',
        payload: { name, service },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disableService = async (name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await systemOperatorService.disableService(name);
      const service = await systemOperatorService.getServiceInfo(name);
      dispatch({
        type: 'UPDATE_SERVICE',
        payload: { name, service },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const executeCommand = async (
    command: string,
    options?: Parameters<typeof systemOperatorService.executeCommand>[1]
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      return await systemOperatorService.executeCommand(command, options);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    listProcesses();
    listServices();

    // 订阅系统指标更新
    const unsubscribe = systemOperatorService.subscribeToMetrics((metrics) => {
      dispatch({ type: 'SET_METRICS', payload: metrics });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SystemOperatorContext.Provider
      value={{
        state,
        dispatch,
        listProcesses,
        killProcess,
        startFileOperation,
        cancelFileOperation,
        setFilePermissions,
        listServices,
        startService,
        stopService,
        restartService,
        enableService,
        disableService,
        executeCommand,
      }}
    >
      {children}
    </SystemOperatorContext.Provider>
  );
};

export const useSystemOperator = () => {
  const context = useContext(SystemOperatorContext);
  if (!context) {
    throw new Error(
      'useSystemOperator must be used within a SystemOperatorProvider'
    );
  }
  return context;
}; 