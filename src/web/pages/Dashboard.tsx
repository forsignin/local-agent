import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import { DashboardOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import SystemStatus from '../components/system/SystemStatus';
import { fetchDashboardMetrics } from '../services/api';
import type { DashboardMetrics } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetchDashboardMetrics();
        setMetrics(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        message.error('加载仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        暂无数据
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="代理数量"
              value={metrics.agents.total}
              prefix={<TeamOutlined />}
              suffix={`活跃: ${metrics.agents.active}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="任务数量"
              value={metrics.tasks.total}
              prefix={<DashboardOutlined />}
              suffix={`完成率: ${(metrics.tasks.successRate * 100).toFixed(1)}%`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="工具数量"
              value={metrics.tools.total}
              prefix={<ToolOutlined />}
              suffix={`启用: ${metrics.tools.enabled}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <SystemStatus
            metrics={metrics}
            recentEvents={metrics.recentEvents}
            activeAgents={metrics.activeAgents}
            recentTasks={metrics.recentTasks}
            popularTools={metrics.popularTools}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
