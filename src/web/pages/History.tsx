import React, { useEffect, useState } from 'react';
import { Table, Tabs, Tag, Timeline } from 'antd';
import { fetchHistory } from '../services/history';

interface HistoryRecord {
  id: string;
  type: string;
  action: string;
  status: string;
  timestamp: string;
  details: Record<string, any>;
}

const History: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [taskHistory, setTaskHistory] = useState<HistoryRecord[]>([]);
  const [systemEvents, setSystemEvents] = useState<HistoryRecord[]>([]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [tasks, events] = await Promise.all([
        fetchHistory('tasks'),
        fetchHistory('events'),
      ]);
      
      setTaskHistory(tasks.data);
      setSystemEvents(events.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div className="history-page">
      <Tabs defaultActiveKey="tasks">
        <Tabs.TabPane tab="任务历史" key="tasks">
          <Table
            loading={loading}
            dataSource={taskHistory}
            columns={columns}
            rowKey="id"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="系统事件" key="events">
          <Timeline>
            {systemEvents.map((event) => (
              <Timeline.Item key={event.id}>
                <p>{new Date(event.timestamp).toLocaleString()}</p>
                <p>{event.action}</p>
                {event.details && (
                  <pre>{JSON.stringify(event.details, null, 2)}</pre>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default History; 