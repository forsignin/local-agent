# LocalAgent - 本地化 AI Agent 系统

LocalAgent 是一个强大的本地运行 AI Agent 系统，通过调用公网大语言模型实现智能任务处理和自动化执行。系统采用多代理协作架构，能够自主规划、执行任务，并提供完整的解决方案。

## 功能特性

- 🤖 多代理协作系统
  - 主控代理（Controller Agent）：负责任务分解和协调
  - 执行代理（Executor Agent）：负责具体任务执行
  - 监督代理（Supervisor Agent）：负责质量控制和结果验证

- 🛠 丰富的工具集成
  - 代码执行环境：Python、Node.js 等运行时
  - 网络访问工具：网页爬取、API 调用
  - 文件处理工具：读写、转换、解析
  - 数据分析工具：数据处理、可视化
  - 系统操作工具：文件系统操作、进程管理

- 📊 完整的任务管理
  - 任务创建与分配
  - 状态追踪与监控
  - 执行日志记录
  - 结果验证与反馈

## 系统架构

```
src/
├── api/                # API 接口层
│   ├── rest/          # REST API 实现
│   └── websocket/     # WebSocket 接口
├── core/              # 核心功能模块
│   ├── task/         # 任务管理
│   └── tools/        # 工具集成
├── agents/           # Agent 实现
├── common/           # 公共组件
├── storage/          # 数据存储
├── tools/            # 工具集
└── web/              # Web 界面
```

## 快速开始

### 环境要求

- Python 3.9+
- Node.js 16+
- Redis
- SQLite/PostgreSQL

### 安装步骤

1. 克隆代码库
```bash
git clone [repository_url]
cd localagent
```

2. 创建并激活虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

5. 启动服务
```bash
python -m src.api.rest.main
```

服务将在 http://localhost:8000 运行

### API 接口

#### REST API

- POST /tasks - 创建新任务
```json
{
    "content": "任务内容",
    "type": "任务类型",
    "metadata": {}
}
```

- GET /tasks/{task_id} - 获取任务状态
- GET /agents - 列出所有代理
- GET /status - 获取系统状态

API 文档访问地址：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发指南

### 项目结构说明

- `src/api/`: API 接口实现
  - `rest/`: REST API 实现
  - `websocket/`: WebSocket 接口实现
- `src/core/`: 核心功能模块
  - `task/`: 任务管理相关功能
  - `tools/`: 工具集成实现
- `src/agents/`: Agent 实现
  - `controller/`: 控制器代理
  - `executor/`: 执行器代理
  - `supervisor/`: 监督器代理
- `src/common/`: 公共组件
  - `config/`: 配置管理
  - `events/`: 事件总线
  - `utils/`: 工具函数
- `src/storage/`: 数据存储层
  - `database/`: 数据库操作
  - `cache/`: 缓存管理
- `src/web/`: Web 界面实现

### 开发流程

1. 创建新功能分支
```bash
git checkout -b feature/your-feature-name
```

2. 开发新功能
- 遵循项目代码规范
- 添加必要的测试
- 更新相关文档

3. 提交代码
```bash
git add .
git commit -m "feat: your feature description"
```

4. 创建合并请求

### 代码规范

- 使用 Python 类型注解
- 遵循 PEP 8 编码规范
- 编写详细的文档字符串
- 保持代码简洁清晰

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。在提交之前，请确保：

1. 代码经过测试
2. 遵循项目代码规范
3. 更新相关文档
4. 提供清晰的提交信息

## 许可证

[License Name] - 查看 [LICENSE](LICENSE) 文件了解更多信息。 