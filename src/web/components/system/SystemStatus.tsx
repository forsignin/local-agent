import React from 'react';
import { Card, Table, Progress, List, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { DashboardMetrics } from '../../types/dashboard';
import type { Task } from '../../types/task';
import type { Agent } from '../../types/agent';
import type { Tool } from '../../types/tool';

const { Title } = Typography;

interface SystemStatusProps {
  metrics: DashboardMetrics;
  recentEvents: DashboardMetrics['recentEvents'];
  activeAgents: Agent[];
  recentTasks: Task[];
  popularTools: Tool[];
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  metrics,
  recentEvents,
  activeAgents,
  recentTasks,
  popularTools,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Card title="系统资源">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, padding: '0 8px' }}>
            <Title level={5}>CPU 使用率</Title>
            <Progress
              type="dashboard"
              percent={Number((metrics.tasks.averageCompletionTime * 100).toFixed(1))}
              format={percent => `${percent}%`}
            />
          </div>
          <div style={{ flex: 1, padding: '0 8px' }}>
            <Title level={5}>内存使用率</Title>
            <Progress
              type="dashboard"
              percent={Number((metrics.agents.utilization * 100).toFixed(1))}
              format={percent => `${percent}%`}
            />
          </div>
          <div style={{ flex: 1, padding: '0 8px' }}>
            <Title level={5}>任务成功率</Title>
            <Progress
              type="dashboard"
              percent={Number((metrics.tasks.successRate * 100).toFixed(1))}
              format={percent => `${percent}%`}
              status={metrics.tasks.successRate >= 0.9 ? 'success' : metrics.tasks.successRate >= 0.7 ? 'normal' : 'exception'}
            />
          </div>
        </div>
      </Card>

      <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
        <Card title="最近事件" style={{ flex: 1 }}>
          <List
            dataSource={recentEvents}
            renderItem={event => (
              <List.Item>
                <List.Item.Meta
                  title={event.title}
                  description={event.message}
                />
                <Tag color={getStatusColor(event.type)}>{event.type}</Tag>
              </List.Item>
            )}
          />
        </Card>

        <Card title="活跃代理" style={{ flex: 1 }}>
          <List
            dataSource={activeAgents}
            renderItem={agent => (
              <List.Item>
                <List.Item.Meta
                  title={agent.name}
                  description={agent.description}
                />
                <Tag color={agent.status === 'busy' ? 'processing' : 'success'}>{agent.status}</Tag>
              </List.Item>
            )}
          />
        </Card>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
        <Card title="最近任务" style={{ flex: 1 }}>
          <Table
            dataSource={recentTasks}
            columns={[
              {
                title: '任务名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                  <span>
                    {getTaskStatusIcon(status)} {status}
                  </span>
                ),
              },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => new Date(date).toLocaleString(),
              },
            ]}
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="热门工具" style={{ flex: 1 }}>
          <List
            dataSource={popularTools}
            renderItem={tool => (
              <List.Item>
                <List.Item.Meta
                  title={tool.name}
                  description={tool.description}
                />
                <Tag color={tool.enabled ? 'success' : 'default'}>
                  {tool.enabled ? '已启用' : '已禁用'}
                </Tag>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;