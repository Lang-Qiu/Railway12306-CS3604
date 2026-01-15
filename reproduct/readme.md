# 12306 网站复刻项目 (Test-Driven & Agent-Driven)

本项目旨在高保真复刻 12306 铁路购票网站的核心功能。项目采用严格的 **测试驱动开发 (TDD)** 模式，并利用 AI Agent 进行驱动。

所有的产品需求文档 (PRD) 均已被整理为规范的 YAML 文件格式。开发过程由 `architecture-manager` MCP 服务管理，配合 `system_prompt.md` 中定义的 AI Agent，按照“自顶向下、深度优先”的策略，依次弹出需求点，进行接口设计、测试编写和功能实现。

## 📂 项目结构

项目根目录包含以下核心模块：

*   **01-首页查询页**: 包含首页布局及车票查询功能的 PRD 定义。
*   **02-登录注册页**: 包含用户登录、注册及找回密码功能的 PRD 定义。
*   **03-车次列表页**: 包含车次查询结果展示及筛选功能的 PRD 定义。
*   **04-订单填写页**: 包含订单确认、乘客选择及提交订单功能的 PRD 定义。
*   **05-个人信息页**: 包含用户个人中心、常用联系人管理等功能的 PRD 定义。
*   **06-支付页和购票成功页**: 包含支付流程及购票结果反馈功能的 PRD 定义。
*   **architecture-manager/**: 架构管理器。这是一个 MCP (Model Context Protocol) 服务，负责维护开发队列、分发需求以及管理系统元数据。
*   **system_prompt.md**: AI Agent 的系统提示词。定义了 Agent 作为“测试驱动软件工程师”的角色、职责以及核心工作流（初始化 -> 获取需求 -> 设计 -> 测试 -> 实现 -> 注册）。

## 🚀 开发工作流

本项目遵循以下自动化开发流程：

1.  **初始化 (Initialization)**: Agent 调用 `init_top_down_queue` 工具，读取 YAML 格式的 PRD 文件，初始化待开发需求队列。
2.  **获取需求 (Fetch)**: Agent 从队列中提取下一个待实现的需求节点（Requirement）。
3.  **设计 (Design)**: 针对该需求，设计 UI 组件结构、API 接口契约及数据库 Schema。
4.  **测试生成 (Test - RED)**: 根据需求场景（Scenarios），编写分层测试（单元测试、集成测试、E2E 测试）。此时测试应为失败状态。
5.  **实现 (Implement - GREEN)**: 编写业务逻辑和 UI 代码，直至所有测试通过。
6.  **注册与提交 (Register & Commit)**: 将验证通过的接口和组件注册到系统元数据中，并保存进度。

## 🛠️ 技术栈与工具

*   **需求管理**: YAML PRD, MCP (Architecture Manager)
*   **开发模式**: TDD (Test-Driven Development)
*   **Agent 角色**: 测试驱动软件工程师 (定义于 `system_prompt.md`)

## 📝 快速开始

1.  确保已安装 Node.js 环境。
2.  进入 `architecture-manager` 目录并安装依赖，这是执行复刻流程必须安装的mcp组件。
3.  配置 AI Agent 环境，复制 `system_prompt.md` 到 AI Agent 的 prompt 中。
4.  启动 Agent，指定项目根目录及 PRD 路径，开始自动化开发流程。
