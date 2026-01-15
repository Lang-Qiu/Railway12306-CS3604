**中期汇报PPT制作指导（按页）**

- 建议总时长：7分钟讲述 + 3分钟问答
- 建议节奏：每页标注“建议用时”，便于控时
- 素材准备：按“截图建议”收集代码与界面画面；按“演示步骤”排练操作路径

**第1页 封面（建议用时：20秒）**
- 标题：铁路12306系统中期汇报
- 副标题：进度、案例与协作
- 时间与团队：2025-11-17｜CS3604 12306_Follow
- 视觉素材：`/frontend/public/images/home-carousel/*` 任意一张作为背景
- 话术要点：一句话说明本次汇报聚焦“完成度、成功/失败案例、协作展望”

**第2页 议程（建议用时：20秒）**
- 列出四部分：完成情况与需求树、成功案例（模型+TDD）、失败案例（工程修复）、协作与展望，最后是Q&A
- 话术要点：明确每部分输出与预期收获

**第3页 完成情况总览（需求树+计数）（建议用时：60秒）**
- 需求树（文字版）：
  - 车票查询 → 条件输入（出发地/到达地/日期）→ 列表展示/筛选 → 进入详情
  - 车次详情 → 车次基本信息/停靠站 → 座位类型与价格
  - 订单管理 → 订单创建/填写 → 支付状态/订单列表与详情
  - 鉴权 → 登录（口令/短信）→ 注册（校验/验证码/入库）→ 服务条款/隐私政策
  - 个人中心 → 用户信息展示/账户设置/订单历史
- 数量统计：
  - 已总结场景数：5
  - 已完成（端到端）：1（注册）
  - 部分完成：4（车票查询、车次详情、订单管理、登录）
  - 未完成：1（个人中心）
- 截图建议：需求树彩色标注（绿=完成、黄=部分、灰=未做）
- 参考依据：`/e:/LQiu/CS3604/12306_Follow/中期汇报2.md`

**第4页 首页完成情况（建议用时：50秒）**
- 路由入口：`frontend/src/App.tsx:12-15`
- 轮播与导航：`frontend/src/pages/HomePage.tsx:115-131`，接入 `TopNavigation/MainNavigation/BottomNavigation`
- 快速查询表单与校验：`frontend/src/pages/HomePage.tsx:150-228`，支持单程/往返/中转换乘/退改签
- 查询跳转：`frontend/src/pages/HomePage.tsx:80-109` 导航到 `/trains`
- 后端首页接口：`backend/src/routes/auth.js:15-16`，控制器 `backend/src/controllers/authController.js:137-160`（当前未接入前端，为增强项）
- 截图建议：首页查询卡片、轮播图、`MainNavigation`“车票”指向 `frontend/src/components/MainNavigation.tsx:9`
- 话术要点：核心交互完整，数据接入可作为下一步优化

**第5页 登录页完成情况（建议用时：60秒）**
- 路由与页面：`frontend/src/App.tsx:12` → `LoginPage`
- 会话创建：`frontend/src/pages/LoginPage.tsx:20-37` 调用 `POST /api/auth/login`（封装 `frontend/src/api/auth.ts:3-9`）
- 短信验证：`frontend/src/pages/LoginPage.tsx:60-88` 调用 `POST /api/auth/verify-login`（封装 `frontend/src/api/auth.ts:16-18`）
- 未完成子项：
  - 登录成功后的跳转为 TODO：`frontend/src/pages/LoginPage.tsx:73-77`
  - 忘记密码入口为 TODO：`frontend/src/pages/LoginPage.tsx:43-46`；后端接口已就绪 `backend/src/routes/auth.js:18-19`，`backend/src/controllers/authController.js:162-187`
- 截图建议：登录表单、短信验证码弹窗
- 话术要点：核心流程已打通，导航与忘记密码页面将于近期补齐

**第6页 注册页完成情况（建议用时：60秒）**
- 注册会话：`frontend/src/pages/RegisterPage.tsx:32-77` → `POST /api/register`（封装 `frontend/src/api/register.ts:13-16`）
- 发送验证码并展示弹窗：`frontend/src/pages/RegisterPage.tsx:48-69` → `POST /api/register/send-verification-code`（封装 `frontend/src/api/register.ts:18-21`）
- 完成注册与跳转：`frontend/src/pages/RegisterPage.tsx:91-105` → `POST /api/register/complete`（封装 `frontend/src/api/register.ts:23-26`）
- 注册弹窗组件：`frontend/src/pages/RegisterPage.tsx:170-181`
- 后端路由齐备：`backend/src/routes/register.js:11-23`
- 截图建议：注册表单、验证码弹窗、成功提示
- 话术要点：注册端到端完整，是当前“已完成”场景

**第7页 成功案例：模型+测试驱动（建议用时：80秒）**
- 场景：首页日期选择器 CalendarPopover（验收标准明确）
- 验收要点：
  - 14天范围限制、两月并排不重叠、数字等宽、“今天”标签、双入口触发（输入框/图标）
- 关键实现映射：
  - 范围与“今天”：`frontend/src/components/CalendarPopover.tsx:41-61`
  - 面板与两月并排：`frontend/src/components/CalendarPopover.tsx:62-116`
  - 双入口触发：`frontend/src/pages/HomePage.tsx:185-199`、`190-198`
  - 视觉类名：`frontend/src/components/CalendarPopover.tsx:91-96`
- 展示方式：列截图+简述“先写断言/后写最小实现”的TDD闭环
- 话术要点：明确的验收标准让模型输出更接近“可执行最小实现”

**第8页 失败案例：生成失败与手动修复（建议用时：60秒）**
- 失败界定：
  - 根目录无 `package.json` 导致安装/启动失败
  - 导航“车票”指向错误路径导致跳转异常
- 根因与修复：
  - 双包结构拆分安装/启动（分别在 `backend`、`frontend`）
  - 修正“车票”入口到 `/trains`：`frontend/src/components/MainNavigation.tsx:9`
- 效果：服务稳定运行，导航链路恢复；占位页确保流程连贯
- 话术要点：工程结构清晰与定点测试是可靠修复路径

**第9页 团队协作与展望（建议用时：50秒）**
- 协作现状：需求→接口契约→后端→前端→测试，接口覆盖查询/详情/订单/鉴权
- 待改进：
  - 登录成功跳转与忘记密码页面
  - 首页消费后端内容接口
  - 个人中心API与页面
- 近期计划（至11/17）：
  - 补登录成功跳转：`frontend/src/pages/LoginPage.tsx:73-77`
  - 首页接入 `GET /api/auth/homepage`
  - 落地忘记密码页面，使用 `GET /api/auth/forgot-password`
  - 规划并实现个人中心API（资料、订单汇总）
- 话术要点：坚持契约驱动与TDD/E2E保障端到端质量

**第10页 演示页（脚本）（建议用时：60秒）**
- 首页演示：
  - 填写出发地/到达地/日期 → 点击“查询” → 跳转 `/trains`
  - 展示日期选择器的双入口与14天限制
- 登录演示：
  - 输入凭据 → 会话创建 → 弹窗输入验证码 → 显示成功提示（说明当前跳转为TODO）
- 注册演示：
  - 提交注册 → 发送验证码 → 验证成功 → 自动跳转登录
- 话术要点：强调流程已打通，个别增强项时间所限待补齐

**第11页 Q&A（建议用时：30秒引导 + 3分钟答疑）**
- 预设问题与答法：
  - 为何首页不接入后端内容接口？主流程优先，增强项排期中
  - 登录后未自动跳转的影响？流程已通，立即补齐导航逻辑即可
  - 余票实时与排序如何保障？当前示例数据，后续通过数据源更新与索引优化
  - 个人中心缺失的计划？契约先行，分阶段补齐资料与订单汇总

**第12页 备份页（代码与接口索引）（可选）**
- 路由入口：`frontend/src/App.tsx:12-16`
- 首页：`frontend/src/pages/HomePage.tsx:80-109`、`115-131`、`150-228`
- 登录：`frontend/src/pages/LoginPage.tsx:20-37`、`60-88`、`73-77`、`43-46`
- 注册：`frontend/src/pages/RegisterPage.tsx:32-77`、`48-69`、`91-105`、`170-181`
- 导航修复：`frontend/src/components/MainNavigation.tsx:9`
- 日期组件：`frontend/src/components/CalendarPopover.tsx:41-61`、`62-116`、`91-96`
- 后端接口：
  - 首页/登录：`backend/src/routes/auth.js:6-19`，`backend/src/controllers/authController.js:137-160`、`162-187`
  - 注册：`backend/src/routes/register.js:11-23`

**附：控时建议**
- 开场与议程：40秒
- 完成度与首页/登录/注册：2分30秒
- 成功案例：1分20秒
- 失败案例：1分钟
- 协作与展望：50秒
- 演示：1分钟
- Q&A：3分钟

**附：素材清单**
- 首页、登录、注册页面截图（含弹窗）
- 需求树彩色标注图
- 关键代码片段对应路径截图（如上索引）
- 接口清单摘录（`/api/auth/*`、`/api/register/*`）用于说明契约一致性

以上按页执行即可快速拼装PPT并保证现场演示与讲述节奏。