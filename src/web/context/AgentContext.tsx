import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import * as agentService from '../services/agent';
import type { Agent, AgentState, AgentStatus, AgentType, AgentCapability } from '../types/agent';

type AgentAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_SELECTED_AGENT'; payload: Agent | null }
  | { type: 'UPDATE_AGENT'; payload: Agent }
  | { type: 'REMOVE_AGENT'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: AgentState = {
  agents: [],
  selectedAgent: null,
  loading: false,
  error: null,
  filters: {
    status: undefined,
    type: undefined,
    capability: undefined,
  },
};

const AgentContext = createContext<{
  state: AgentState;
  dispatch: React.Dispatch<AgentAction>;
  createAgent: typeof agentService.createAgent;
  updateAgent: typeof agentService.updateAgent;
  deleteAgent: typeof agentService.deleteAgent;
  sendMessage: typeof agentService.sendMessage;
  executeAction: typeof agentService.executeAction;
  assignTask: typeof agentService.assignTask;
  transferTask: typeof agentService.transferTask;
}>({
  state: initialState,
  dispatch: () => null,
  createAgent: async () => ({} as Agent),
  updateAgent: async () => ({} as Agent),
  deleteAgent: async () => {},
  sendMessage: async () => ({ id: '', agentId: '', role: 'user', content: '', timestamp: '' }),
  executeAction: async () => ({
    id: '',
    agentId: '',
    taskId: '',
    type: '',
    status: 'pending',
    input: {},
    startTime: '',
  }),
  assignTask: async () => {},
  transferTask: async () => {},
});

const agentReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload, loading: false };
    case 'SET_SELECTED_AGENT':
      return { ...state, selectedAgent: action.payload };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? action.payload : agent
        ),
        selectedAgent:
          state.selectedAgent?.id === action.payload.id
            ? action.payload
            : state.selectedAgent,
      };
    case 'REMOVE_AGENT':
      return {
        ...state,
        agents: state.agents.filter(agent => agent.id !== action.payload),
        selectedAgent:
          state.selectedAgent?.id === action.payload ? null : state.selectedAgent,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  useEffect(() => {
    const loadAgents = async () => {
      dispatch({ type: 'SET_LOADING' });
      try {
        const agents = await agentService.listAgents();
        dispatch({ type: 'SET_AGENTS', payload: agents });
      } catch (error) {
        console.error('Failed to load agents:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载代理列表失败' });
        message.error('加载代理列表失败');
      }
    };

    loadAgents();
  }, []);

  const handleCreateAgent = async (...args: Parameters<typeof agentService.createAgent>) => {
    try {
      const agent = await agentService.createAgent(...args);
      dispatch({ type: 'SET_AGENTS', payload: [...state.agents, agent] });
      message.success('代理创建成功');
      return agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      message.error('创建代理失败');
      throw error;
    }
  };

  const handleUpdateAgent = async (...args: Parameters<typeof agentService.updateAgent>) => {
    try {
      const agent = await agentService.updateAgent(...args);
      dispatch({ type: 'UPDATE_AGENT', payload: agent });
      message.success('代理更新成功');
      return agent;
    } catch (error) {
      console.error('Failed to update agent:', error);
      message.error('更新代理失败');
      throw error;
    }
  };

  const handleDeleteAgent = async (...args: Parameters<typeof agentService.deleteAgent>) => {
    try {
      await agentService.deleteAgent(...args);
      dispatch({ type: 'REMOVE_AGENT', payload: args[0] });
      message.success('代理删除成功');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      message.error('删除代理失败');
      throw error;
    }
  };

  return (
    <AgentContext.Provider
      value={{
        state,
        dispatch,
        createAgent: handleCreateAgent,
        updateAgent: handleUpdateAgent,
        deleteAgent: handleDeleteAgent,
        sendMessage: agentService.sendMessage,
        executeAction: agentService.executeAction,
        assignTask: agentService.assignTask,
        transferTask: agentService.transferTask,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export default AgentContext; 