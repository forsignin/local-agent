import { message } from 'antd';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private options: WebSocketOptions;

  constructor(options: WebSocketOptions = {}) {
    this.options = options;
  }

  connect(url: string = process.env.REACT_APP_WS_URL || 'ws://localhost:8002/ws') {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.options.onError?.(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.options.onClose?.();
      this.handleReconnect();
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'task_update':
        this.handleTaskUpdate(message.data);
        break;
      case 'agent_update':
        this.handleAgentUpdate(message.data);
        break;
      case 'system_event':
        this.handleSystemEvent(message.data);
        break;
      default:
        this.options.onMessage?.(message);
    }
  }

  private handleTaskUpdate(data: any) {
    const { id, status, progress } = data;
    // 发送任务更新事件
    const event = new CustomEvent('task_update', { detail: data });
    window.dispatchEvent(event);

    // 显示任务状态更新通知
    if (status === 'completed') {
      message.success(`任务 ${id} 已完成`);
    } else if (status === 'failed') {
      message.error(`任务 ${id} 执行失败`);
    }
  }

  private handleAgentUpdate(data: any) {
    const { id, status } = data;
    // 发送代理更新事件
    const event = new CustomEvent('agent_update', { detail: data });
    window.dispatchEvent(event);

    // 显示代理状态更新通知
    if (status === 'offline') {
      message.warning(`代理 ${id} 已离线`);
    }
  }

  private handleSystemEvent(data: any) {
    const { level, message: msg } = data;
    // 发送系统事件
    const event = new CustomEvent('system_event', { detail: data });
    window.dispatchEvent(event);

    // 显示系统事件通知
    switch (level) {
      case 'error':
        message.error(msg);
        break;
      case 'warning':
        message.warning(msg);
        break;
      case 'info':
        message.info(msg);
        break;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      message.error('WebSocket连接失败，请刷新页面重试');
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket is not connected');
      message.error('WebSocket未连接，请稍后重试');
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;