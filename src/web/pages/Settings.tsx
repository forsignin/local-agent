import React, { useEffect, useState, useCallback } from 'react';
import { Card, Tabs, Form, Input, Switch, InputNumber, Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { fetchSystemConfig, updateSystemConfig } from '../services/system';
import type { SystemConfig } from '../types/system';

const { TabPane } = Tabs;

interface SystemSettings extends SystemConfig {
  notificationChannels: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  backupSettings: {
    enabled: boolean;
    interval: number;
    retention: number;
    path: string;
  };
}

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const config = await fetchSystemConfig();
      const fullSettings: SystemSettings = {
        ...config,
        notificationChannels: {
          email: false,
          slack: false,
          webhook: false,
          ...config.notificationChannels,
        },
        backupSettings: {
          enabled: false,
          interval: 24,
          retention: 7,
          path: '/backup',
          ...config.backupSettings,
        },
      };
      setSettings(fullSettings);
      form.setFieldsValue(fullSettings);
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (values: SystemSettings) => {
    try {
      setLoading(true);
      await updateSystemConfig(values);
      message.success('设置已保存');
      await loadSettings();
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="系统设置">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={settings || {}}
      >
        <Tabs defaultActiveKey="system">
          <TabPane tab="系统" key="system">
            <Form.Item
              name={['maxConcurrentTasks']}
              label="最大并发任务数"
              rules={[{ required: true, message: '请输入最大并发任务数' }]}
            >
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item
              name={['maxAgents']}
              label="最大代理数量"
              rules={[{ required: true, message: '请输入最大代理数量' }]}
            >
              <InputNumber min={1} max={50} />
            </Form.Item>
            <Form.Item
              name={['maxTools']}
              label="最大工具数量"
              rules={[{ required: true, message: '请输入最大工具数量' }]}
            >
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item
              name={['logLevel']}
              label="日志级别"
              rules={[{ required: true, message: '请选择日志级别' }]}
            >
              <Select>
                <Select.Option value="debug">Debug</Select.Option>
                <Select.Option value="info">Info</Select.Option>
                <Select.Option value="warn">Warn</Select.Option>
                <Select.Option value="error">Error</Select.Option>
              </Select>
            </Form.Item>
          </TabPane>

          <TabPane tab="备份" key="backup">
            <Form.Item
              name={['backupEnabled']}
              label="启用自动备份"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name={['backupInterval']}
              label="备份间隔（小时）"
              rules={[{ required: true, message: '请输入备份间隔' }]}
            >
              <InputNumber min={1} max={168} />
            </Form.Item>
            <Form.Item
              name={['backupSettings', 'location']}
              label="备份位置"
              rules={[{ required: true, message: '请输入备份位置' }]}
            >
              <Input placeholder="/path/to/backup" />
            </Form.Item>
            <Form.Item
              name={['backupSettings', 'retention']}
              label="保留天数"
              rules={[{ required: true, message: '请输入备份保留天数' }]}
            >
              <InputNumber min={1} max={365} />
            </Form.Item>
          </TabPane>

          <TabPane tab="通知" key="notification">
            <Form.Item
              name={['notificationsEnabled']}
              label="启用通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name={['notificationChannels', 'email']}
              label="邮件通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name={['notificationChannels', 'slack']}
              label="Slack通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name={['notificationChannels', 'webhook']}
              label="Webhook通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </TabPane>
        </Tabs>
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            htmlType="submit"
          >
            保存设置
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default Settings; 