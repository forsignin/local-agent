import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import * as taskService from '../services/task';
import type { Task, TaskState, TaskStats, TaskFilter, TaskType, TaskStatus, TaskPriority, TaskStep, TaskResult } from '../types/task';

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Record<string, Task> }
  | { type: 'SET_SELECTED_TASK'; payload: Task | null }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'SET_FILTER'; payload: TaskFilter }
  | { type: 'SET_STATS'; payload: TaskStats }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TASK'; payload: Task };

const initialStats: TaskStats = {
  total: 0,
  completed: 0,
  failed: 0,
  running: 0,
  pending: 0,
  byType: {
    code_execution: 0,
    file_processing: 0,
    network_access: 0,
    data_analysis: 0,
    text_processing: 0,
    custom: 0,
  },
  byStatus: {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    paused: 0,
    stopped: 0,
  },
  byPriority: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  },
  averageCompletionTime: 0,
  successRate: 0,
};

const initialState: TaskState = {
  tasks: {},
  selectedTask: null,
  filters: {},
  stats: initialStats,
  loading: false,
  error: null,
};

const TaskContext = createContext<{
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  startTask: (id: string) => Promise<Task>;
  pauseTask: (id: string) => Promise<Task>;
  resumeTask: (id: string) => Promise<Task>;
  cancelTask: (id: string) => Promise<Task>;
  addTaskStep: (taskId: string, step: Partial<TaskStep>) => Promise<TaskStep>;
  updateTaskStep: (taskId: string, stepId: string, data: Partial<TaskStep>) => Promise<TaskStep>;
  setTaskResult: (taskId: string, result: TaskResult) => Promise<Task>;
  assignTask: (taskId: string, agentIds: string[]) => Promise<Task>;
}>({
  state: initialState,
  dispatch: () => null,
  createTask: async () => ({} as Task),
  updateTask: async () => ({} as Task),
  deleteTask: async () => {},
  startTask: async () => ({} as Task),
  pauseTask: async () => ({} as Task),
  resumeTask: async () => ({} as Task),
  cancelTask: async () => ({} as Task),
  addTaskStep: async () => ({} as TaskStep),
  updateTaskStep: async () => ({} as TaskStep),
  setTaskResult: async () => ({} as Task),
  assignTask: async () => ({} as Task),
});

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
      };
    case 'SET_SELECTED_TASK':
      return { ...state, selectedTask: action.payload };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: action.payload,
        },
        selectedTask:
          state.selectedTask?.id === action.payload.id
            ? action.payload
            : state.selectedTask,
      };
    case 'REMOVE_TASK':
      const { [action.payload]: removed, ...remainingTasks } = state.tasks;
      return {
        ...state,
        tasks: remainingTasks,
        selectedTask:
          state.selectedTask?.id === action.payload ? null : state.selectedTask,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: action.payload,
        },
        selectedTask: action.payload,
      };
    case 'SET_FILTER':
      return { ...state, filters: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
    const loadTasks = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [tasks, stats] = await Promise.all([
          taskService.listTasks(state.filters),
          taskService.getTaskStats(state.filters),
        ]);
        const tasksMap = tasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {} as Record<string, Task>);
        dispatch({ type: 'SET_TASKS', payload: tasksMap });
        dispatch({ type: 'SET_STATS', payload: stats });
      } catch (error) {
        console.error('Failed to load tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载任务列表失败' });
        message.error('加载任务列表失败');
      }
    };

    loadTasks();
  }, [state.filters]);

  const handleCreateTask = async (...args: Parameters<typeof taskService.createTask>) => {
    try {
      const task = await taskService.createTask(...args);
      dispatch({ type: 'ADD_TASK', payload: task });
      message.success('任务创建成功');
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      message.error('创建任务失败');
      throw error;
    }
  };

  const handleUpdateTask = async (...args: Parameters<typeof taskService.updateTask>) => {
    try {
      const task = await taskService.updateTask(...args);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      message.success('任务更新成功');
      return task;
    } catch (error) {
      console.error('Failed to update task:', error);
      message.error('更新任务失败');
      throw error;
    }
  };

  const handleDeleteTask = async (...args: Parameters<typeof taskService.deleteTask>) => {
    try {
      await taskService.deleteTask(...args);
      dispatch({ type: 'REMOVE_TASK', payload: args[0] });
      message.success('任务删除成功');
    } catch (error) {
      console.error('Failed to delete task:', error);
      message.error('删除任务失败');
      throw error;
    }
  };

  const handleStartTask = async (id: string) => {
    try {
      const task = await taskService.startTask(id);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      message.success('任务已启动');
      return task;
    } catch (error) {
      console.error('Failed to start task:', error);
      message.error('启动任务失败');
      throw error;
    }
  };

  const handlePauseTask = async (id: string) => {
    try {
      const task = await taskService.pauseTask(id);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      message.success('任务已暂停');
      return task;
    } catch (error) {
      console.error('Failed to pause task:', error);
      message.error('暂停任务失败');
      throw error;
    }
  };

  const handleResumeTask = async (id: string) => {
    try {
      const task = await taskService.resumeTask(id);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      message.success('任务已恢复');
      return task;
    } catch (error) {
      console.error('Failed to resume task:', error);
      message.error('恢复任务失败');
      throw error;
    }
  };

  const handleCancelTask = async (id: string) => {
    try {
      const task = await taskService.cancelTask(id);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      message.success('任务已取消');
      return task;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      message.error('取消任务失败');
      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
        createTask: handleCreateTask,
        updateTask: handleUpdateTask,
        deleteTask: handleDeleteTask,
        startTask: handleStartTask,
        pauseTask: handlePauseTask,
        resumeTask: handleResumeTask,
        cancelTask: handleCancelTask,
        addTaskStep: taskService.addTaskStep,
        updateTaskStep: taskService.updateTaskStep,
        setTaskResult: taskService.setTaskResult,
        assignTask: taskService.assignTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export default TaskContext; 