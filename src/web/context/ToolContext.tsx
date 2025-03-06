import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import * as toolService from '../services/tool';
import type { Tool, ToolState, ToolFilter, ToolExecution } from '../types/tool';

// 添加一个标志来控制是否加载工具列表
interface ToolProviderProps {
  children: React.ReactNode;
  shouldLoad?: boolean; // 控制是否加载工具列表的标志
}

type ToolAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_TOOLS'; payload: Tool[] }
  | { type: 'SET_SELECTED_TOOL'; payload: Tool | null }
  | { type: 'SET_EXECUTIONS'; payload: ToolExecution[] }
  | { type: 'ADD_EXECUTION'; payload: ToolExecution }
  | { type: 'UPDATE_EXECUTION'; payload: ToolExecution }
  | { type: 'UPDATE_TOOL'; payload: Tool }
  | { type: 'REMOVE_TOOL'; payload: string }
  | { type: 'SET_FILTER'; payload: ToolFilter }
  | { type: 'SET_STATS'; payload: ToolState['stats'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: ToolState = {
  tools: [],
  selectedTool: null,
  executions: [],
  filter: {},
  stats: {
    total: 0,
    enabled: 0,
    byCategory: {
      code_execution: 0,
      file_processing: 0,
      data_analysis: 0,
      text_processing: 0,
      custom: 0,
    },
    topUsed: [],
    averageSuccessRate: 0,
  },
  loading: false,
  error: null,
};

// 创建一个空的上下文对象，用于未登录状态
const emptyContextValue = {
  state: initialState,
  dispatch: () => null,
  createTool: async () => ({} as Tool),
  updateTool: async () => ({} as Tool),
  deleteTool: async () => {},
  executeTool: async () => ({} as ToolExecution),
  validateParameters: async () => ({ valid: false }),
  installDependencies: async () => ({} as Tool),
  checkDependencies: async () => ({ satisfied: false, missing: [] }),
};

const ToolContext = createContext<{
  state: ToolState;
  dispatch: React.Dispatch<ToolAction>;
  createTool: typeof toolService.createTool;
  updateTool: typeof toolService.updateTool;
  deleteTool: typeof toolService.deleteTool;
  executeTool: typeof toolService.executeTool;
  validateParameters: typeof toolService.validateParameters;
  installDependencies: typeof toolService.installDependencies;
  checkDependencies: typeof toolService.checkDependencies;
}>(emptyContextValue);

const toolReducer = (state: ToolState, action: ToolAction): ToolState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_TOOLS':
      return { ...state, tools: action.payload, loading: false };
    case 'SET_SELECTED_TOOL':
      return { ...state, selectedTool: action.payload };
    case 'SET_EXECUTIONS':
      return { ...state, executions: action.payload };
    case 'ADD_EXECUTION':
      return {
        ...state,
        executions: [action.payload, ...state.executions],
      };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        executions: state.executions.map(execution =>
          execution.id === action.payload.id ? action.payload : execution
        ),
      };
    case 'UPDATE_TOOL':
      return {
        ...state,
        tools: state.tools.map(tool =>
          tool.id === action.payload.id ? action.payload : tool
        ),
        selectedTool:
          state.selectedTool?.id === action.payload.id
            ? action.payload
            : state.selectedTool,
      };
    case 'REMOVE_TOOL':
      return {
        ...state,
        tools: state.tools.filter(tool => tool.id !== action.payload),
        selectedTool:
          state.selectedTool?.id === action.payload ? null : state.selectedTool,
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// 创建两个不同的 Provider 组件
const ActiveToolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(toolReducer, initialState);

  useEffect(() => {
    const loadTools = async () => {
      dispatch({ type: 'SET_LOADING' });
      try {
        const [tools, stats] = await Promise.all([
          toolService.listTools(state.filter),
          toolService.getToolStats(state.filter),
        ]);
        dispatch({ type: 'SET_TOOLS', payload: tools });
        dispatch({ type: 'SET_STATS', payload: stats });
      } catch (error) {
        console.error('Failed to load tools:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载工具列表失败' });
        message.error('加载工具列表失败');
      }
    };

    loadTools();
  }, [state.filter]);

  const handleCreateTool = async (...args: Parameters<typeof toolService.createTool>) => {
    try {
      const tool = await toolService.createTool(...args);
      dispatch({ type: 'SET_TOOLS', payload: [...state.tools, tool] });
      message.success('工具创建成功');
      return tool;
    } catch (error) {
      console.error('Failed to create tool:', error);
      message.error('创建工具失败');
      throw error;
    }
  };

  const handleUpdateTool = async (...args: Parameters<typeof toolService.updateTool>) => {
    try {
      const tool = await toolService.updateTool(...args);
      dispatch({ type: 'UPDATE_TOOL', payload: tool });
      message.success('工具更新成功');
      return tool;
    } catch (error) {
      console.error('Failed to update tool:', error);
      message.error('更新工具失败');
      throw error;
    }
  };

  const handleDeleteTool = async (...args: Parameters<typeof toolService.deleteTool>) => {
    try {
      await toolService.deleteTool(...args);
      dispatch({ type: 'REMOVE_TOOL', payload: args[0] });
      message.success('工具删除成功');
    } catch (error) {
      console.error('Failed to delete tool:', error);
      message.error('删除工具失败');
      throw error;
    }
  };

  const handleExecuteTool = async (
    ...args: Parameters<typeof toolService.executeTool>
  ) => {
    try {
      const execution = await toolService.executeTool(...args);
      dispatch({ type: 'ADD_EXECUTION', payload: execution });
      message.success('工具执行成功');
      return execution;
    } catch (error) {
      console.error('Failed to execute tool:', error);
      message.error('工具执行失败');
      throw error;
    }
  };

  return (
    <ToolContext.Provider
      value={{
        state,
        dispatch,
        createTool: handleCreateTool,
        updateTool: handleUpdateTool,
        deleteTool: handleDeleteTool,
        executeTool: handleExecuteTool,
        validateParameters: toolService.validateParameters,
        installDependencies: toolService.installDependencies,
        checkDependencies: toolService.checkDependencies,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
};

const InactiveToolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToolContext.Provider value={emptyContextValue}>
      {children}
    </ToolContext.Provider>
  );
};

// 主 Provider 组件，根据 shouldLoad 选择使用哪个 Provider
export const ToolProvider: React.FC<ToolProviderProps> = ({ children, shouldLoad = true }) => {
  if (!shouldLoad) {
    return <InactiveToolProvider>{children}</InactiveToolProvider>;
  }
  
  return <ActiveToolProvider>{children}</ActiveToolProvider>;
};

export const useTool = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
};

export default ToolContext; 