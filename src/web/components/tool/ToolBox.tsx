import React from 'react';
import { Card, List, Button, Tag, Space } from 'antd';
import {
  CodeOutlined,
  DatabaseOutlined,
  FileOutlined,
  GlobalOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import type { Tool } from '../../types/tool';

const iconMap: Record<string, React.ReactNode> = {
  code_runner: <CodeOutlined />,
  data_analyzer: <LineChartOutlined />,
  file_processor: <FileOutlined />,
  network_tool: <GlobalOutlined />,
  database_tool: <DatabaseOutlined />,
  system_tool: <SettingOutlined />,
};

const ToolBox: React.FC<{
  tools: Tool[];
  onToolSelect: (tool: Tool) => void;
}> = ({ tools, onToolSelect }) => {
  const getIcon = (type: string) => {
    return iconMap[type] || <SettingOutlined />;
  };

  const handleToolClick = (tool: Tool) => {
    onToolSelect(tool);
  };

  return (
    <List
      grid={{ gutter: 16, column: 3 }}
      dataSource={tools}
      renderItem={(tool) => (
        <List.Item>
          <Card
            hoverable
            onClick={() => handleToolClick(tool)}
          >
            <Card.Meta
              avatar={getIcon(tool.type)}
              title={tool.name}
              description={
                <Space direction="vertical">
                  <div>{tool.description}</div>
                  <Tag color={tool.enabled ? 'success' : 'default'}>
                    {tool.enabled ? '已启用' : '已禁用'}
                  </Tag>
                </Space>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
};

export default ToolBox;