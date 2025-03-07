import React, { useEffect } from 'react';
import { Card, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import TaskListComponent from '../components/task/TaskList';
import type { Task } from '../types/task';
import { fetchTasks } from '../services/task';

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch, updateTask, deleteTask } = useTask();

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const tasks = await fetchTasks();
        const tasksMap = tasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {} as Record<string, Task>);
        dispatch({ type: 'SET_TASKS', payload: tasksMap });
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        message.error('加载任务列表失败');
      }
    };

    loadInitialData();
  }, [dispatch]);

  const handleView = (task: Task) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: task });
  };

  const handleStart = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'running' });
      message.success('任务已启动');
    } catch (error) {
      message.error('启动任务失败');
    }
  };

  const handlePause = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'paused' });
      message.success('任务已暂停');
    } catch (error) {
      message.error('暂停任务失败');
    }
  };

  const handleStop = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'stopped' });
      message.success('任务已停止');
    } catch (error) {
      message.error('停止任务失败');
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id);
      message.success('任务已删除');
    } catch (error) {
      message.error('删除任务失败');
    }
  };

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  return (
    <Card
      title="任务列表"
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateTask}
        >
          新建任务
        </Button>
      }
    >
      <TaskListComponent
        tasks={Object.values(state.tasks)}
        loading={state.loading}
        onView={handleView}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default TaskList; 