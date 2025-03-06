import React from 'react';
import { Card, Row, Col, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTool } from '../context/ToolContext';
import type { Tool } from '../types/tool';

const ToolBox: React.FC = () => {
  const { state, createTool } = useTool();

  const handleCreateTool = async () => {
    try {
      await createTool({
        name: '新工具',
        type: 'general',
        description: '请编辑工具描述',
        config: {},
      });
      message.success('工具创建成功');
    } catch (error) {
      console.error('Failed to create tool:', error);
      message.error('创建工具失败');
    }
  };

  return (
    <div className="tool-box">
      <Card
        title="工具箱"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTool}
          >
            新建工具
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {state.tools.map((tool: Tool) => (
            <Col key={tool.id} span={8}>
              <Card
                title={tool.name}
                extra={
                  <Button type="link" size="small">
                    配置
                  </Button>
                }
              >
                <p>{tool.description}</p>
                <p>类型: {tool.type}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ToolBox; 