import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import * as executorService from '../services/executor';
import type {
  Execution,
  ExecutionContext,
  ExecutionEvent,
  ExecutionLog,
  ExecutorState,
} from '../types/executor';

type ExecutorAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_EXECUTIONS'; payload: Record<string, Execution> }
  | { type: 'UPDATE_EXECUTION'; payload: Execution }
  | { type: 'REMOVE_EXECUTION'; payload: string }
  | { type: 'SET_ACTIVE_EXECUTIONS'; payload: string[] }
  | { type: 'SET_EXECUTION_QUEUE'; payload: string[] }
  | { type: 'ADD_EXECUTION_EVENT'; payload: { executionId: string; event: ExecutionEvent } }
  | { type: 'ADD_EXECUTION_LOG'; payload: { executionId: string; log: ExecutionLog } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: ExecutorState = {
  executions: {},
  activeExecutions: [],
  executionQueue: [],
  loading: false,
  error: null,
};

const ExecutorContext = createContext<{
  state: ExecutorState;
  dispatch: React.Dispatch<ExecutorAction>;
  startExecution: typeof executorService.startExecution;
  pauseExecution: typeof executorService.pauseExecution;
  resumeExecution: typeof executorService.resumeExecution;
  cancelExecution: typeof executorService.cancelExecution;
  retryExecution: typeof executorService.retryExecution;
  getExecutionResult: typeof executorService.getExecutionResult;
  getExecutionArtifact: typeof executorService.getExecutionArtifact;
}>({
  state: initialState,
  dispatch: () => null,
  startExecution: async () => ({} as Execution),
  pauseExecution: async () => ({} as Execution),
  resumeExecution: async () => ({} as Execution),
  cancelExecution: async () => ({} as Execution),
  retryExecution: async () => ({} as Execution),
  getExecutionResult: async () => ({
    success: false,
    output: null,
    metrics: {
      startTime: '',
      endTime: '',
      duration: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      networkUsage: 0,
    },
  }),
  getExecutionArtifact: async () => new Blob(),
});

const executorReducer = (
  state: ExecutorState,
  action: ExecutorAction
): ExecutorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_EXECUTIONS':
      return { ...state, executions: action.payload, loading: false };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: action.payload,
        },
      };
    case 'REMOVE_EXECUTION':
      const { [action.payload]: removed, ...remainingExecutions } = state.executions;
      return {
        ...state,
        executions: remainingExecutions,
        activeExecutions: state.activeExecutions.filter(id => id !== action.payload),
        executionQueue: state.executionQueue.filter(id => id !== action.payload),
      };
    case 'SET_ACTIVE_EXECUTIONS':
      return { ...state, activeExecutions: action.payload };
    case 'SET_EXECUTION_QUEUE':
      return { ...state, executionQueue: action.payload };
    case 'ADD_EXECUTION_EVENT':
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.executionId]: {
            ...state.executions[action.payload.executionId],
            events: [
              action.payload.event,
              ...state.executions[action.payload.executionId].events,
            ],
          },
        },
      };
    case 'ADD_EXECUTION_LOG':
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.executionId]: {
            ...state.executions[action.payload.executionId],
            logs: [
              action.payload.log,
              ...state.executions[action.payload.executionId].logs,
            ],
          },
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const ExecutorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(executorReducer, initialState);

  useEffect(() => {
    const loadExecutions = async () => {
      dispatch({ type: 'SET_LOADING' });
      try {
        const executions = await executorService.listExecutions();
        const executionsMap = executions.reduce(
          (acc, execution) => ({
            ...acc,
            [execution.id]: execution,
          }),
          {}
        );
        dispatch({ type: 'SET_EXECUTIONS', payload: executionsMap });

        const activeExecutions = executions
          .filter(e => ['running', 'paused'].includes(e.status))
          .map(e => e.id);
        dispatch({ type: 'SET_ACTIVE_EXECUTIONS', payload: activeExecutions });

        const queue = await executorService.getExecutionQueue();
        dispatch({
          type: 'SET_EXECUTION_QUEUE',
          payload: queue.queue.map(item => item.id),
        });
      } catch (error) {
        console.error('Failed to load executions:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载执行列表失败' });
        message.error('加载执行列表失败');
      }
    };

    loadExecutions();
  }, []);

  const handleStartExecution = async (context: ExecutionContext) => {
    try {
      const execution = await executorService.startExecution(context);
      dispatch({ type: 'UPDATE_EXECUTION', payload: execution });
      dispatch({
        type: 'SET_ACTIVE_EXECUTIONS',
        payload: [...state.activeExecutions, execution.id],
      });
      message.success('执行已启动');
      return execution;
    } catch (error) {
      console.error('Failed to start execution:', error);
      message.error('启动执行失败');
      throw error;
    }
  };

  const handlePauseExecution = async (id: string) => {
    try {
      const execution = await executorService.pauseExecution(id);
      dispatch({ type: 'UPDATE_EXECUTION', payload: execution });
      message.success('执行已暂停');
      return execution;
    } catch (error) {
      console.error('Failed to pause execution:', error);
      message.error('暂停执行失败');
      throw error;
    }
  };

  const handleResumeExecution = async (id: string) => {
    try {
      const execution = await executorService.resumeExecution(id);
      dispatch({ type: 'UPDATE_EXECUTION', payload: execution });
      message.success('执行已恢复');
      return execution;
    } catch (error) {
      console.error('Failed to resume execution:', error);
      message.error('恢复执行失败');
      throw error;
    }
  };

  const handleCancelExecution = async (id: string) => {
    try {
      const execution = await executorService.cancelExecution(id);
      dispatch({ type: 'UPDATE_EXECUTION', payload: execution });
      dispatch({
        type: 'SET_ACTIVE_EXECUTIONS',
        payload: state.activeExecutions.filter(execId => execId !== id),
      });
      message.success('执行已取消');
      return execution;
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      message.error('取消执行失败');
      throw error;
    }
  };

  return (
    <ExecutorContext.Provider
      value={{
        state,
        dispatch,
        startExecution: handleStartExecution,
        pauseExecution: handlePauseExecution,
        resumeExecution: handleResumeExecution,
        cancelExecution: handleCancelExecution,
        retryExecution: executorService.retryExecution,
        getExecutionResult: executorService.getExecutionResult,
        getExecutionArtifact: executorService.getExecutionArtifact,
      }}
    >
      {children}
    </ExecutorContext.Provider>
  );
};

export const useExecutor = () => {
  const context = useContext(ExecutorContext);
  if (!context) {
    throw new Error('useExecutor must be used within an ExecutorProvider');
  }
  return context;
};

export default ExecutorContext; 