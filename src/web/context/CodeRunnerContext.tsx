import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  RuntimeType,
  RuntimeConfig,
  RuntimeInstance,
  CodeInput,
  CodeOutput,
  ExecutionStatus,
} from '../types/codeRunner';
import * as codeRunnerService from '../services/codeRunner';

interface ExecutionState {
  id: string;
  status: ExecutionStatus;
  output: string;
}

interface CodeRunnerState {
  runtimes: RuntimeInstance[];
  activeRuntime: string | null;
  executions: Map<string, ExecutionState>;
  currentExecution: string | null;
  loading: boolean;
  error: string | null;
}

type CodeRunnerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RUNTIMES'; payload: RuntimeInstance[] }
  | { type: 'ADD_RUNTIME'; payload: RuntimeInstance }
  | { type: 'UPDATE_RUNTIME'; payload: RuntimeInstance }
  | { type: 'REMOVE_RUNTIME'; payload: string }
  | { type: 'SET_ACTIVE_RUNTIME'; payload: string | null }
  | { type: 'SET_EXECUTION_STATUS'; payload: { id: string; status: ExecutionStatus; output: string } }
  | { type: 'SET_CURRENT_EXECUTION'; payload: string }
  | { type: 'CLEAR_EXECUTION'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: CodeRunnerState = {
  runtimes: [],
  activeRuntime: null,
  executions: new Map(),
  currentExecution: null,
  loading: false,
  error: null,
};

const CodeRunnerContext = createContext<{
  state: CodeRunnerState;
  dispatch: React.Dispatch<CodeRunnerAction>;
  createRuntime: (config: RuntimeConfig) => Promise<RuntimeInstance>;
  deleteRuntime: (id: string) => Promise<void>;
  executeCode: (input: CodeInput) => Promise<string>;
  cancelExecution: (executionId: string) => Promise<void>;
  installPackage: (packageName: string, version?: string) => Promise<void>;
  uninstallPackage: (packageName: string) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  createRuntime: async () => ({
    id: '',
    type: 'python',
    status: 'ready',
    config: {
      type: 'python',
      version: '3.9',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  deleteRuntime: async () => {},
  executeCode: async () => '',
  cancelExecution: async () => {},
  installPackage: async () => {},
  uninstallPackage: async () => {},
});

const codeRunnerReducer = (state: CodeRunnerState, action: CodeRunnerAction): CodeRunnerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RUNTIMES':
      return { ...state, runtimes: action.payload };
    case 'ADD_RUNTIME':
      return { ...state, runtimes: [...state.runtimes, action.payload] };
    case 'UPDATE_RUNTIME':
      return {
        ...state,
        runtimes: state.runtimes.map((runtime) =>
          runtime.id === action.payload.id ? action.payload : runtime
        ),
      };
    case 'REMOVE_RUNTIME':
      return {
        ...state,
        runtimes: state.runtimes.filter((runtime) => runtime.id !== action.payload),
        activeRuntime:
          state.activeRuntime === action.payload ? null : state.activeRuntime,
      };
    case 'SET_ACTIVE_RUNTIME':
      return { ...state, activeRuntime: action.payload };
    case 'SET_EXECUTION_STATUS': {
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.id, {
        id: action.payload.id,
        status: action.payload.status,
        output: action.payload.output,
      });
      return { ...state, executions: newExecutions };
    }
    case 'SET_CURRENT_EXECUTION':
      return { ...state, currentExecution: action.payload };
    case 'CLEAR_EXECUTION': {
      const newExecutions = new Map(state.executions);
      newExecutions.delete(action.payload);
      return { ...state, executions: newExecutions };
    }
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const CodeRunnerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(codeRunnerReducer, initialState);

  useEffect(() => {
    const loadRuntimes = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const runtimes = await codeRunnerService.listRuntimes();
        dispatch({ type: 'SET_RUNTIMES', payload: runtimes });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadRuntimes();
  }, []);

  const createRuntime = async (config: RuntimeConfig) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const runtime = await codeRunnerService.createRuntime(config);
      dispatch({ type: 'ADD_RUNTIME', payload: runtime });
      return runtime;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteRuntime = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await codeRunnerService.deleteRuntime(id);
      dispatch({ type: 'REMOVE_RUNTIME', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const executeCode = async (input: CodeInput): Promise<string> => {
    if (!state.activeRuntime) {
      throw new Error('No active runtime selected');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { executionId } = await codeRunnerService.executeCode(
        state.activeRuntime,
        input
      );

      dispatch({
        type: 'SET_EXECUTION_STATUS',
        payload: { id: executionId, status: 'pending', output: '' },
      });

      // 设置输出流监听
      const outputStream = codeRunnerService.streamOutput(executionId);
      outputStream.onmessage = (event) => {
        const output = JSON.parse(event.data);
        dispatch({
          type: 'SET_EXECUTION_STATUS',
          payload: { id: executionId, status: 'running', output: output },
        });
      };

      return executionId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelExecution = async (executionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await codeRunnerService.cancelExecution(executionId);
      dispatch({
        type: 'SET_EXECUTION_STATUS',
        payload: { id: executionId, status: 'cancelled', output: '' },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const installPackage = async (packageName: string, version?: string) => {
    if (!state.activeRuntime) {
      throw new Error('No active runtime selected');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await codeRunnerService.installPackage(
        state.activeRuntime,
        packageName,
        version
      );
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const uninstallPackage = async (packageName: string) => {
    if (!state.activeRuntime) {
      throw new Error('No active runtime selected');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await codeRunnerService.uninstallPackage(state.activeRuntime, packageName);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <CodeRunnerContext.Provider
      value={{
        state,
        dispatch,
        createRuntime,
        deleteRuntime,
        executeCode,
        cancelExecution,
        installPackage,
        uninstallPackage,
      }}
    >
      {children}
    </CodeRunnerContext.Provider>
  );
};

export const useCodeRunner = () => {
  const context = useContext(CodeRunnerContext);
  if (!context) {
    throw new Error('useCodeRunner must be used within a CodeRunnerProvider');
  }
  return context;
}; 