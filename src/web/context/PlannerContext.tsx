import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import * as plannerService from '../services/planner';
import type {
  TaskPlan,
  PlanNode,
  PlanningContext,
  PlanExecution,
  PlannerState,
} from '../types/planner';

type PlannerAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_PLANS'; payload: TaskPlan[] }
  | { type: 'SET_SELECTED_PLAN'; payload: TaskPlan | null }
  | { type: 'SET_EXECUTIONS'; payload: PlanExecution[] }
  | { type: 'ADD_EXECUTION'; payload: PlanExecution }
  | { type: 'UPDATE_EXECUTION'; payload: PlanExecution }
  | { type: 'UPDATE_PLAN'; payload: TaskPlan }
  | { type: 'REMOVE_PLAN'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: PlannerState = {
  plans: [],
  selectedPlan: null,
  executions: [],
  loading: false,
  error: null,
};

const PlannerContext = createContext<{
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  generatePlan: typeof plannerService.generatePlan;
  updatePlan: typeof plannerService.updatePlan;
  validatePlan: typeof plannerService.validatePlan;
  optimizePlan: typeof plannerService.optimizePlan;
  executePlan: typeof plannerService.executePlan;
  analyzePlan: typeof plannerService.analyzePlan;
  saveAsTemplate: typeof plannerService.saveAsTemplate;
}>({
  state: initialState,
  dispatch: () => null,
  generatePlan: async () => ({} as TaskPlan),
  updatePlan: async () => ({} as TaskPlan),
  validatePlan: async () => ({
    valid: false,
    errors: [],
    warnings: [],
    metrics: {
      estimatedDuration: 0,
      estimatedCost: 0,
      resourceUsage: {},
      complexity: 0,
    },
  }),
  optimizePlan: async () => ({} as TaskPlan),
  executePlan: async () => ({} as PlanExecution),
  analyzePlan: async () => ({
    complexity: 0,
    bottlenecks: [],
    risks: [],
    recommendations: [],
  }),
  saveAsTemplate: async () => ({
    id: '',
    name: '',
    description: '',
    plan: {} as TaskPlan,
  }),
});

const plannerReducer = (state: PlannerState, action: PlannerAction): PlannerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_PLANS':
      return { ...state, plans: action.payload, loading: false };
    case 'SET_SELECTED_PLAN':
      return { ...state, selectedPlan: action.payload };
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
    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: state.plans.map(plan =>
          plan.id === action.payload.id ? action.payload : plan
        ),
        selectedPlan:
          state.selectedPlan?.id === action.payload.id
            ? action.payload
            : state.selectedPlan,
      };
    case 'REMOVE_PLAN':
      return {
        ...state,
        plans: state.plans.filter(plan => plan.id !== action.payload),
        selectedPlan:
          state.selectedPlan?.id === action.payload ? null : state.selectedPlan,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(plannerReducer, initialState);

  const handleGeneratePlan = async (
    ...args: Parameters<typeof plannerService.generatePlan>
  ) => {
    try {
      const plan = await plannerService.generatePlan(...args);
      dispatch({ type: 'SET_PLANS', payload: [...state.plans, plan] });
      message.success('计划生成成功');
      return plan;
    } catch (error) {
      console.error('Failed to generate plan:', error);
      message.error('计划生成失败');
      throw error;
    }
  };

  const handleUpdatePlan = async (
    ...args: Parameters<typeof plannerService.updatePlan>
  ) => {
    try {
      const plan = await plannerService.updatePlan(...args);
      dispatch({ type: 'UPDATE_PLAN', payload: plan });
      message.success('计划更新成功');
      return plan;
    } catch (error) {
      console.error('Failed to update plan:', error);
      message.error('计划更新失败');
      throw error;
    }
  };

  const handleValidatePlan = async (planId: string) => {
    try {
      const validation = await plannerService.validatePlan(planId);
      if (!validation.valid) {
        message.warning('计划验证未通过，请检查错误');
      }
      return validation;
    } catch (error) {
      console.error('Failed to validate plan:', error);
      message.error('计划验证失败');
      throw error;
    }
  };

  const handleOptimizePlan = async (
    ...args: Parameters<typeof plannerService.optimizePlan>
  ) => {
    try {
      const plan = await plannerService.optimizePlan(...args);
      dispatch({ type: 'UPDATE_PLAN', payload: plan });
      message.success('计划优化成功');
      return plan;
    } catch (error) {
      console.error('Failed to optimize plan:', error);
      message.error('计划优化失败');
      throw error;
    }
  };

  const handleExecutePlan = async (planId: string) => {
    try {
      const execution = await plannerService.executePlan(planId);
      dispatch({ type: 'ADD_EXECUTION', payload: execution });
      message.success('计划执行已启动');
      return execution;
    } catch (error) {
      console.error('Failed to execute plan:', error);
      message.error('计划执行失败');
      throw error;
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        state,
        dispatch,
        generatePlan: handleGeneratePlan,
        updatePlan: handleUpdatePlan,
        validatePlan: handleValidatePlan,
        optimizePlan: handleOptimizePlan,
        executePlan: handleExecutePlan,
        analyzePlan: plannerService.analyzePlan,
        saveAsTemplate: plannerService.saveAsTemplate,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};

export default PlannerContext; 