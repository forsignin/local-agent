import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  InputNumber,
  Switch,
  message,
} from 'antd';
import { useNetwork } from '../../context/NetworkContext';
import type { RequestConfig, CrawlerConfig } from '../../types/network';
import styled from 'styled-components';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const Container = styled.div`
  padding: 20px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const ResponseContainer = styled.div`
  background: #1e1e1e;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

export const NetworkTools: React.FC = () => {
  const {
    state: { activeRequests, activeCrawlers, cacheStats, loading },
    sendRequest,
    cancelRequest,
    startCrawler,
    cancelCrawler,
    clearCache,
  } = useNetwork();

  const [requestForm] = Form.useForm();
  const [crawlerForm] = Form.useForm();

  const handleSendRequest = async (values: RequestConfig) => {
    try {
      await sendRequest(values);
      message.success('请求已发送');
    } catch (error) {
      message.error('请求发送失败：' + (error as Error).message);
    }
  };

  const handleStartCrawler = async (values: CrawlerConfig) => {
    try {
      await startCrawler(values);
      message.success('爬虫任务已启动');
    } catch (error) {
      message.error('爬虫任务启动失败：' + (error as Error).message);
    }
  };

  const requestColumns = [
    {
      title: '请求ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
    },
    {
      title: 'URL',
      dataIndex: ['config', 'url'],
      key: 'url',
      ellipsis: true,
    },
    {
      title: '方法',
      dataIndex: ['config', 'method'],
      key: 'method',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'gold',
          completed: 'green',
          failed: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: { id: string; status: string }) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" onClick={() => cancelRequest(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const crawlerColumns = [
    {
      title: '爬虫ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
    },
    {
      title: 'URL',
      dataIndex: ['config', 'url'],
      key: 'url',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'gold',
          completed: 'green',
          failed: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: { id: string; status: string }) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" onClick={() => cancelCrawler(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const requestData = Array.from(activeRequests.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  const crawlerData = Array.from(activeCrawlers.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  return (
    <Container>
      <StyledCard title="网络工具">
        <Tabs defaultActiveKey="request">
          <TabPane tab="HTTP请求" key="request">
            <Form
              form={requestForm}
              onFinish={handleSendRequest}
              layout="vertical"
              initialValues={{
                method: 'GET',
                timeout: 30000,
              }}
            >
              <Form.Item
                name="url"
                label="URL"
                rules={[{ required: true, message: '请输入URL' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
              <Form.Item name="method" label="请求方法">
                <Select>
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                </Select>
              </Form.Item>
              <Form.Item name="headers" label="请求头">
                <TextArea
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                  rows={4}
                />
              </Form.Item>
              <Form.Item name="data" label="请求体">
                <TextArea placeholder="请输入JSON格式的请求体" rows={4} />
              </Form.Item>
              <Form.Item name="timeout" label="超时时间（毫秒）">
                <InputNumber min={1000} max={60000} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  发送请求
                </Button>
              </Form.Item>
            </Form>

            <Table
              columns={requestColumns}
              dataSource={requestData}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </TabPane>

          <TabPane tab="网页爬虫" key="crawler">
            <Form
              form={crawlerForm}
              onFinish={handleStartCrawler}
              layout="vertical"
              initialValues={{
                timeout: 30000,
                javascript: true,
              }}
            >
              <Form.Item
                name="url"
                label="URL"
                rules={[{ required: true, message: '请输入URL' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
              <Form.Item name="selector" label="CSS选择器">
                <Input placeholder=".article-content" />
              </Form.Item>
              <Form.Item name="waitFor" label="等待选择器或时间">
                <Input placeholder=".dynamic-content 或 5000（毫秒）" />
              </Form.Item>
              <Form.Item name="javascript" label="启用JavaScript" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="timeout" label="超时时间（毫秒）">
                <InputNumber min={1000} max={60000} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  启动爬虫
                </Button>
              </Form.Item>
            </Form>

            <Table
              columns={crawlerColumns}
              dataSource={crawlerData}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </TabPane>

          <TabPane tab="缓存管理" key="cache">
            <StyledCard>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>缓存命中：</strong> {cacheStats.hits}
                </div>
                <div>
                  <strong>缓存未命中：</strong> {cacheStats.misses}
                </div>
                <div>
                  <strong>缓存大小：</strong> {(cacheStats.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button onClick={() => clearCache()} loading={loading}>
                  清除缓存
                </Button>
              </Space>
            </StyledCard>
          </TabPane>
        </Tabs>
      </StyledCard>
    </Container>
  );
}; 