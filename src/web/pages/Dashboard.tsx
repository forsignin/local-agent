import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Progress } from 'antd';
import { DashboardOutlined, TeamOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import type { DashboardMetrics } from '../types/dashboard';
import { fetchDashboardData } from '../services/dashboard';

interface SystemMetricsResponse {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    rx_bytes: number;
    tx_bytes: number;
  };
}

interface SystemStatusResponse {
  status: string;
  version: string;
  uptime: number;
  agents: {
    total: number;
    active: number;
  };
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  tools: {
    total: number;
    types: number;
  };
  events: {
    total: number;
    errors: number;
  };
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [systemMetrics, systemStatus] = await Promise.all([
          fetchDashboardData('metrics') as Promise<SystemMetricsResponse>,
          fetchDashboardData('status') as Promise<SystemStatusResponse>
        ]);

        if (!isSubscribed) return;

        // 转换API数据为前端所需格式
        const formattedMetrics: DashboardMetrics = {
          systemStatus: {
            cpu: systemMetrics.cpu_usage,
            memory: systemMetrics.memory_usage,
            disk: systemMetrics.disk_usage,
            uptime: systemStatus.uptime
          },
          taskMetrics: {
            total: systemStatus.tasks.total,
            running: systemStatus.tasks.running,
            completed: systemStatus.tasks.completed,
            failed: systemStatus.tasks.failed,
            pending: systemStatus.tasks.pending
          },
          agentMetrics: {
            total: systemStatus.agents.total,
            active: systemStatus.agents.active,
            idle: systemStatus.agents.total - systemStatus.agents.active
          },
          toolMetrics: {
            total: systemStatus.tools.total,
            enabled: systemStatus.tools.total,
            byCategory: {}
          },
          tasks: {
            total: systemStatus.tasks.total,
            completed: systemStatus.tasks.completed,
            failed: systemStatus.tasks.failed,
            pending: systemStatus.tasks.pending,
            running: systemStatus.tasks.running,
            successRate: systemStatus.tasks.total > 0 
              ? systemStatus.tasks.completed / systemStatus.tasks.total 
              : 0,
            averageCompletionTime: 0
          },
          agents: {
            total: systemStatus.agents.total,
            active: systemStatus.agents.active,
            idle: systemStatus.agents.total - systemStatus.agents.active,
            error: 0,
            utilization: systemStatus.agents.total > 0 
              ? systemStatus.agents.active / systemStatus.agents.total 
              : 0
          },
          tools: {
            total: systemStatus.tools.total,
            enabled: systemStatus.tools.total,
            disabled: 0,
            mostUsed: []
          },
          recentTasks: [],
          recentEvents: [],
          activeAgents: [],
          popularTools: []
        };

        setMetrics(formattedMetrics);
        setError(null);
      } catch (err) {
        if (!isSubscribed) return;
        setError(err instanceof Error ? err.message : '加载数据失败');
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && !metrics) { // 只在首次加载时显示加载状态
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  if (!metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        暂无数据
      </div>
    );
  }

  const getHealthStatusIcon = (value: number) => {
    if (value > 80) {
      return <WarningOutlined style={{ color: '#faad14' }} />;
    }
    return null;
  };

  const getStatusColor = (value: number) => {
    if (value > 80) return '#ff4d4f';
    if (value > 60) return '#faad14';
    return '#52c41a';
  };

  return (
    <div className="dashboard" style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="系统资源" bordered={false}>
            <Row gutter={[48, 24]} justify="center" align="middle">
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={Math.round(metrics.systemStatus.cpu)}
                  format={(percent) => `${percent}%`}
                  strokeColor={getStatusColor(metrics.systemStatus.cpu)}
                />
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '16px' }}>
                  CPU使用率
                </div>
              </Col>
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={Math.round(metrics.systemStatus.memory)}
                  format={(percent) => `${percent}%`}
                  strokeColor={getStatusColor(metrics.systemStatus.memory)}
                />
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '16px' }}>
                  内存使用率
                </div>
              </Col>
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={Math.round(metrics.systemStatus.disk)}
                  format={(percent) => `${percent}%`}
                  strokeColor={getStatusColor(metrics.systemStatus.disk)}
                />
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '16px' }}>
                  磁盘使用率
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="系统状态" bordered={false}>
            <Row gutter={[48, 24]}>
              <Col span={8}>
                <Statistic
                  title="总任务数"
                  value={metrics.tasks.total}
                  prefix={<DashboardOutlined style={{ fontSize: '24px' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="活跃代理"
                  value={metrics.agents.active}
                  prefix={<TeamOutlined style={{ fontSize: '24px' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="可用工具"
                  value={metrics.tools.total}
                  prefix={<ToolOutlined style={{ fontSize: '24px' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="任务统计" bordered={false}>
            <Row gutter={[48, 24]}>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="运行中"
                    value={metrics.tasks.running}
                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="已完成"
                    value={metrics.tasks.completed}
                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="失败"
                    value={metrics.tasks.failed}
                    valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="等待中"
                    value={metrics.tasks.pending}
                    valueStyle={{ color: '#faad14', fontSize: '24px' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
