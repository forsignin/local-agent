import React, { useEffect, useRef } from 'react';
import { Layout } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../../pages/Dashboard';
import TaskList from '../../pages/TaskList';
import Settings from '../../pages/Settings';
import Profile from '../../pages/Profile';
import { CodeRunner } from '../code/CodeRunner';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fetchSystemMetrics, fetchAgents, fetchTasks, fetchTools } from '../../services/api';
import type { SystemMetrics } from '../../types/system';
import type { Agent } from '../../types/agent';
import type { Task } from '../../types/task';
import type { Tool } from '../../types/tool';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const loadingRef = useRef(false);

  useEffect(() => {
    // 如果未登录，不加载数据
    if (!authState.isAuthenticated) {
      return;
    }

    const loadSystemData = async () => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      try {
        const results = await Promise.allSettled([
          fetchSystemMetrics(),
          fetchAgents(),
          fetchTasks(),
          fetchTools()
        ]);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const data = result.value.data;
            switch (index) {
              case 0:
                dispatch({ type: 'SET_SYSTEM_METRICS', payload: data as SystemMetrics });
                break;
              case 1:
                dispatch({ type: 'SET_AGENTS', payload: data as Agent[] });
                break;
              case 2:
                dispatch({ type: 'SET_TASKS', payload: data as Task[] });
                break;
              case 3:
                dispatch({ type: 'SET_TOOLS', payload: data as Tool[] });
                break;
            }
          } else {
            console.error(`加载系统数据失败: ${result.reason}`);
          }
        });
      } catch (error) {
        console.error('加载系统数据失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载系统数据失败' });
      } finally {
        loadingRef.current = false;
      }
    };

    loadSystemData();
    
    // 设置定时刷新
    const timer = setInterval(loadSystemData, 30000); // 每30秒刷新一次
    
    return () => {
      clearInterval(timer);
    };
  }, [dispatch, authState.isAuthenticated]);

  // 如果未登录，不渲染内容
  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/code" element={<CodeRunner />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;