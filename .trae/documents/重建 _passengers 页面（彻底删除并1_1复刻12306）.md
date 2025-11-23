## 范围与目标
- 完全删除现有 `/passengers` 页面及其路由配置与专属资源。
- 参考页面 `https://kyfw.12306.cn/otn/view/passengers.html` 进行 1:1 复刻：布局、样式、交互、动画、数据展示、按钮与链接行为全部一致。
- 新页面保持响应式、性能优化，并保留参考页中的所有原文案（含 " ${unlinkText} "）。

## 现状确认
- 前端栈：React + TypeScript + Vite；路由：`react-router-dom`
- 路由入口：`frontend/src/main.tsx`；路由表：`frontend/src/App.tsx`
- 旧页面组件：`frontend/src/pages/PassengerManagementPage.tsx`
- 乘客 API：`frontend/src/api/passengers.ts`
- 相关引用与导航：`frontend/src/components/our12306/MainNavigation.tsx`、`frontend/src/components/TopNavigation.tsx`、`frontend/src/components/our12306/PassengerInfoSection.tsx`
- 后端端点（已存在）：`GET/POST/PUT/DELETE /api/passengers…`（具体在 `backend/src/route-manifests/passengers.js`、`backend/src/request-handlers/passengerController.js` 等）

## 删除与清理（第一阶段）
- 从 `frontend/src/App.tsx` 移除旧的 `/passengers` 路由元素与任何指向旧组件的引用。
- 删除旧页面文件 `frontend/src/pages/PassengerManagementPage.tsx` 及其仅被该页面使用的子组件/样式（若 `PassengerInfoSection.tsx` 等仅被旧页使用则一并移除）。
- 清理导航中与旧实现耦合的逻辑：`MainNavigation.tsx`、`TopNavigation.tsx` 中的旧链接或高亮逻辑改为占位或待新页面接入。
- 全库检索并删除遗留引用（关键词：`PassengerManagementPage`、`/passengers` 旧实现特征）以确保无残留。

## 新页面设计与实现（第二阶段）
- 新组件：`frontend/src/pages/PassengersPage.tsx`（命名与路由统一为 `/passengers`）。
- 1:1 复刻结构：页面头部导航（我的12306风格）、功能区工具栏（新增/搜索/筛选/说明）、乘车人列表（表格/卡片视图）、状态标签（已通过/待核验/未通过等）、操作列（编辑/删除/设为常用/手机号核验等）。
- 文案与链接：严格复制参考页所有文案（包括 " ${unlinkText} "）与链接跳转行为；外链与站内页的目标路由一致还原。
- 样式方案：CSS Modules 或全局 `passengers.css`，对齐参考页视觉（配色、字号、网格与间距、hover/active/disabled态）；还原微交互与动画（点击扩展、行高亮、操作提示）。
- 响应式：依据参考页面断点进行栅格调整与排版降级（表格→卡片）、触摸交互优化（点击区域与最小可触大小）。

## 数据与交互（对齐后端）
- 使用现有 `frontend/src/api/passengers.ts` 封装：列表、搜索、添加、编辑、删除。
- 状态与校验：支持身份核验状态展示、手机号核验提示、不可删除/限制操作等业务规则（按参考页表现匹配）。
- 搜索与过滤：输入防抖（300ms）、服务器侧搜索 `/api/passengers/search`；空态与加载骨架还原。
- 批量与单项操作：批量选择、批量删除/设为常用；单行编辑、删除；操作确认弹窗与动画一致。

## 性能优化
- 路由级代码拆分：`/passengers` 懒加载。
- 样式优化：关键样式内联，非关键 CSS 异步；图标采用 SVG sprite 或与参考页一致的资源策略。
- 列表优化：大数据量下虚拟滚动；搜索/列表结果缓存与错误重试。

## 路由与导航接入
- 在 `frontend/src/App.tsx` 新增 `Route path="/passengers" element={<PassengersPage />} />`。
- `MainNavigation.tsx` 与 `TopNavigation.tsx` 绑定新路由，导航态与面包屑对齐参考页。

## 测试与验证
- 跨浏览器：Chrome/Edge/Firefox + 移动端视口；检查视觉一致性与交互一致性。
- 自动化：新增 E2E 用例（Playwright/现有测试框架）覆盖：列表展示、搜索、添加、编辑、删除、核验提示、批量操作、响应式断点。
- 回归检查：全库检索确保无旧页面残留；路由无死链；404/空态正确。

## 交付物
- 新页面源码与样式、路由更新、必要的组件与资源。
- 测试用例与说明（运行步骤与覆盖点）。
- 清理报告：删除项清单与验证结果截图（视觉对比与关键交互）。

## 风险与对策
- 参考页资源（字体/图片）需替代：若跨域受限则本地化等价资源，视觉近似匹配。
- 参考页业务规则细节差异：以文案与交互优先，必要时扩展后端端点（先前端占位，后平滑接入）。

## 下一步
- 按上述步骤执行删除→重建→接入→测试；过程中严格对齐参考页面视觉与交互，并在完成后提交对比与验证结果供审查。