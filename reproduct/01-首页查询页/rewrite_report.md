# YAML Rewrite Comparison Report

## File: 01-首页查询页-api.yaml

```diff
--- Original (01-首页查询页-api.yaml)+++ Rewritten (01-首页查询页-api.yaml)@@ -1,58 +1,58 @@ id: REQ-API-1
-name: 首页/查询页 接口设计
-functional_description: 为首页/查询页的站点选择、日期选择、车次查询及登录/注册/个人中心跳转提供统一的API契约。
+name: 首页与查询页面接口规范
+functional_description: 旨在为首页及查询页面的站点拣选、日期选定、列车班次检索以及登录、注册、用户中心跳转等功能提供标准化的API协议。
 children:
   - id: REQ-API-1-1
-    name: 站点相关接口
+    name: 车站相关服务接口
     children:
       - id: REQ-API-1-1-1
-        name: 站点列表与搜索
+        name: 车站清单及检索
         functional_description: |
           - 接口：GET /api/stations
-          - 描述：支持中文/拼音/别名模糊匹配。
+          - 描述：兼容中文、拼音及别名的模糊查找功能。
           - Query参数：
-            - query (string, optional)：搜索关键字；为空时返回全部（可分页）。
+            - query (string, optional)：检索关键词；若未提供则返回所有记录（支持分页获取）。
             - limit (int, optional, default 50)
             - offset (int, optional, default 0)
           - Response data：
             - stations: [{station_id, station_name_cn, station_name_py, alias_list[], station_code}]
-          - Errors：VALIDATION_ERROR（非法参数），INTERNAL_ERROR
+          - Errors：VALIDATION_ERROR（参数无效），INTERNAL_ERROR
 
       - id: REQ-API-1-1-2
-        name: 推荐相似站点
+        name: 建议相关车站
         functional_description: |
           - 接口：GET /api/stations/recommend
-          - 描述：根据输入内容推荐相似站点。
+          - 描述：依据输入信息智能推荐近似车站。
           - Query参数：
             - input (string, required)
             - limit (int, optional, default 10)
           - Response data：
             - recommendations: [{station_id, station_name_cn, station_name_py, similarity (0..1)}]
-          - Errors：STATION_NOT_FOUND（无推荐时返回空数组但不报错）、INTERNAL_ERROR
+          - Errors：STATION_NOT_FOUND（若无推荐项则返回空集合而不抛出异常）、INTERNAL_ERROR
 
   - id: REQ-API-1-2
-    name: 日期与放票接口
+    name: 日期及售票服务接口
     children:
       - id: REQ-API-1-2-1
-        name: 可售日期集合
... (diff truncated) ...

```

## File: 01-首页查询页-test.yaml

```diff
--- Original (01-首页查询页-test.yaml)+++ Rewritten (01-首页查询页-test.yaml)@@ -1,211 +1,211 @@ id: REQ-Test-1
-name: 首页/查询页 测试用例
-functional_description: 依据《01-首页查询页.md》场景整理的测试用例。
+name: 首页及查询页面测试方案
+functional_description: 基于《01-首页查询页.md》中定义的业务场景，梳理如下测试用例集合。
 children:
   - id: REQ-Test-1-1
-    name: 必填校验测试
+    name: 必填项校验测试
     children:
       - id: REQ-Test-1-1-1
-        name: 出发地为空
-        scenarios:
-          - name: H-1.2.1 出发地为空
-            steps:
-              - action: 用户在首页/查询页且未在车票查询表单中输入出发地
-                expectation: 系统就绪
-              - action: 点击“查询”
-                expectation: 提示“请选择出发地”
+        name: 缺失出发地
+        scenarios:
+          - name: H-1.2.1 缺失出发地
+            steps:
+              - action: 用户停留在首页或查询页，且车票查询表单中未填写出发地信息
+                expectation: 系统处于待命状态
+              - action: 点击“查询”操作
+                expectation: 系统弹出“请选择出发地”提示
       - id: REQ-Test-1-1-2
-        name: 到达地为空
-        scenarios:
-          - name: H-1.2.2 到达地为空
-            steps:
-              - action: 用户在首页/查询页且未在车票查询表单中输入到达地
-                expectation: 系统就绪
-              - action: 点击“查询”
-                expectation: 提示“请选择到达地”
+        name: 缺失到达地
+        scenarios:
+          - name: H-1.2.2 缺失到达地
+            steps:
+              - action: 用户停留在首页或查询页，且车票查询表单中未填写到达地信息
+                expectation: 系统处于待命状态
+              - action: 点击“查询”操作
+                expectation: 系统弹出“请选择到达地”提示
 
   - id: REQ-Test-1-2
-    name: 合法性校验测试
+    name: 数据合法性校验测试
... (diff truncated) ...

```

## File: 01-首页查询页_overall.yaml

```diff
--- Original (01-首页查询页_overall.yaml)+++ Rewritten (01-首页查询页_overall.yaml)@@ -1,259 +1,259 @@ id: REQ-1
-name: 首页查询页
-functional_description: 首页查询页面的整体设计与功能定义。
+name: 首页及查询页面
+functional_description: 首页与查询页面的整体架构设计及功能规格定义。
 children:
   - id: REQ-1-1
-    name: 首页查询页布局
+    name: 页面布局结构
     children:
       - id: REQ-1-1-1
-        name: 整体页面布局
-        ui_description: |
-          背景为white（白色），分上、中、下三部分布局，最上方为顶部导航区域，中间为车票查询表单区域，最下方为底部导航区域。
+        name: 全局版式
+        ui_description: |
+          背景色设定为white（纯白），布局上划分为上、中、下三个板块，顶部为导航控制区，中部部署车票查询表单，底部则为辅助导航区。
       - id: REQ-1-1-2
-        name: 顶部导航区域（HomeTopBar）
-        ui_description: |
-          - **整体样式**：背景为white（白色），底部边框为#e0e0e0（浅灰色），阴影为0 1px 3px rgba(0, 0, 0, 0.05)，最大宽度1400px，内边距12px 40px
-          - **Logo 区域**：页面左上角为Logo区域，左侧为中国铁路12306官方Logo（尺寸60px×60px），右侧上方为"中国铁路12306"（字体大小22px，字体加粗，颜色#333333（深灰色），字间距1.3px），下方为"12306 CHINA RAILWAY"（字体大小15px，颜色#999999（灰色），字间距0.1px），点击可跳转到12306首页
-          - **搜索框**：位于Logo区域和右侧链接区域之间，最大宽度480px，高度36px，内边距0 50px 0 16px，边框为#d0d0d0（浅灰色），字体大小13px，文字颜色#333333（深灰色），占位符颜色#999999（浅灰色），focus时边框为#3B99FC（蓝色），带有阴影效果rgba(59, 153, 252, 0.1)，右侧搜索按钮宽度42px，高度36px，背景#3B99FC（蓝色），hover时背景#0082fc（深蓝色）
-          - **右侧链接区域**：显示"登录"、"注册"、"个人中心"等链接，字体大小14px，链接颜色#3B99FC（蓝色），hover时颜色#2a88eb（深蓝色），链接之间间距8px，链接之间用竖线分隔（颜色#3B99FC，宽度1px，高度12px）
-          - **已登录状态**：显示"欢迎，[用户名]"（用户名颜色#2196f3（蓝色），字体加粗，字体大小14px），以及"退出"链接（颜色#3B99FC，字体大小14px）
+        name: 顶部导航栏（HomeTopBar）
+        ui_description: |
+          - **整体风格**：背景色white（纯白），底边框色#e0e0e0（浅灰），阴影效果0 1px 3px rgba(0, 0, 0, 0.05)，最大宽幅1400px，内衬间距12px 40px
+          - **Logo 标识区**：页面左上角部署Logo，左侧展示中国铁路12306官方徽标（规格60px×60px），右侧上部标注"中国铁路12306"（字号22px，加粗，色值#333333（深灰），字距1.3px），下部标注"12306 CHINA RAILWAY"（字号15px，色值#999999（灰），字距0.1px），点击即跳转至12306主页
+          - **检索框**：置于Logo区与右侧链接区之间，最大宽幅480px，高36px，内衬0 50px 0 16px，边框色#d0d0d0（浅灰），字号13px，文本色#333333（深灰），占位符色#999999（浅灰），聚焦状态边框色#3B99FC（亮蓝），附带阴影rgba(59, 153, 252, 0.1)，右侧检索按钮宽42px，高36px，背景色#3B99FC（亮蓝），悬停背景色#0082fc（深蓝）
+          - **右侧功能链**：展示"登录"、"注册"、"个人中心"等入口，字号14px，链接色#3B99FC（亮蓝），悬停色#2a88eb（深蓝），链接间距8px，中间以竖线分隔（色值#3B99FC，宽1px，高12px）
+          - **登录状态展示**：显示"欢迎，[用户名]"（用户名色值#2196f3（蓝），加粗，字号14px），以及"退出"选项（色值#3B99FC，字号14px）
       - id: REQ-1-1-3
-        name: 主导航栏（MainNavigation）
-        ui_description: |
-          - **整体样式**：背景为#3B99FC（蓝色），底部边框为#2a88eb（深蓝色），阴影为0 2px 5px rgba(0, 0, 0, 0.12)，高度45px，最大宽度1400px，内边距0 40px，粘性定位（sticky）
-          - **导航项目**：包含"车票查询"、"订单查询"、"我的12306"等导航项，每个导航项平分宽度（flex: 1），内边距0 24px，字体大小16px，文字颜色white（白色），hover时背景#2676E3（深蓝色），左侧边框为rgba(255, 255, 255, 0.1)（半透明白色）
-          - **登录/注册按钮**：位于导航栏右侧，内边距6px 18px，边框为rgba(255, 255, 255, 0.8)（半透明白色），圆角4px，背景rgba(255, 255, 255, 0.1)（半透明白色），文字颜色white（白色），字体大小14px，字体加粗（font-weight: 500），hover时背景rgba(255, 255, 255, 0.25)（更亮的半透明白色）
+        name: 主导航条（MainNavigation）
+        ui_description: |
+          - **整体风格**：背景色#3B99FC（亮蓝），底边框色#2a88eb（深蓝），阴影0 2px 5px rgba(0, 0, 0, 0.12)，高度45px，最大宽幅1400px，内衬0 40px，采用粘性定位（sticky）
+          - **导航条目**：囊括"车票查询"、"订单查询"、"我的12306"等项目，各项目均分宽度（flex: 1），内衬0 24px，字号16px，文本色white（纯白），悬停背景色#2676E3（深蓝），左侧边框rgba(255, 255, 255, 0.1)（半透白）
+          - **登录/注册按键**：置于导航条右端，内衬6px 18px，边框rgba(255, 255, 255, 0.8)（半透白），圆角4px，背景色rgba(255, 255, 255, 0.1)（半透白），文本色white（纯白），字号14px，中等粗细（font-weight: 500），悬停背景色rgba(255, 255, 255, 0.25)（高亮半透白）
       - id: REQ-1-1-4
-        name: 车票查询表单区域
-        ui_description: |
-          - **推广背景**：中间为宽屏12306官方APP推广，作为车票查询表单的背景（直接使用图片"首页-背景图-1.png"），背景图片覆盖整个查询区域，最小高度400px，内边距60px 0
-          - **车票查询表单容器**：最大宽度530px，背景white（白色），阴影0 2px 8px rgba(0, 0, 0, 0.12)，无圆角，定位在推广背景左侧
... (diff truncated) ...

```

## File: 01-首页查询页_requests.yaml

```diff
--- Original (01-首页查询页_requests.yaml)+++ Rewritten (01-首页查询页_requests.yaml)@@ -1,172 +1,172 @@ id: REQ-Breakdown
-name: 首页/查询页 需求拆解
-functional_description: 基于《01-首页查询页.md》梳理功能点、业务规则、边界场景与数据依赖，为后续设计、开发与测试提供统一依据。
+name: 首页/查询页 需求细化拆解
+functional_description: 基于《01-首页查询页.md》深入梳理功能模块、业务逻辑、边界条件及数据依赖关系，为后续的设计实现与测试验证提供权威依据。
 children:
   - id: REQ-Breakdown-1
-    name: 功能清单
+    name: 功能模块清单
     children:
       - id: REQ-Breakdown-1-1
-        name: 顶部导航栏
+        name: 顶部导航控制
         functional_description: |
-          - 未登录：显示“登录”“注册”“个人中心”入口；已登录：仅显示“个人中心”。
+          - 未登录态：展示“登录”、“注册”及“个人中心”三个入口；已登录态：仅保留“个人中心”入口。
       - id: REQ-Breakdown-1-2
-        name: 车票查询表单
+        name: 车票查询核心表单
         functional_description: |
-          - 出发地、到达地输入框（站点选择/模糊匹配/下拉推荐）
-          - 出发日期选择器（只可选择已放票日期；不可选择过期或未开票日期）
-          - 查询按钮
-          - 出发地/到达地交换按钮
-          - 出发日期默认填入当前日期（用户未选择时）
+          - 站点输入：包含出发地与到达地输入框（支持选择、模糊匹配及下拉推荐）；
+          - 日期选择：出发日期控件（限制选择已开放售票的日期，禁用过期或未开售日期）；
+          - 查询操作：提供查询触发按钮；
+          - 站点互换：提供出发地与到达地一键互换功能；
+          - 默认填充：用户未操作时，出发日期自动预填当前日期。
       - id: REQ-Breakdown-1-3
-        name: 常用功能快捷入口
+        name: 快捷功能入口
         functional_description: |
-          - 个人中心入口、车票查询入口
+          - 提供直达“个人中心”与“车票查询”页面的快捷通道。
       - id: REQ-Breakdown-1-4
-        name: 页面跳转
+        name: 页面流转逻辑
         functional_description: |
-          - 查询成功：在100毫秒内跳转至车次列表页，展示与选择一致的车次信息（出发地、到达地、出发日期、是否高铁/动车）。
-          - 查询失败：停留在当前页，保留用户已输入内容并提示“查询失败，请稍后重试”。
+          - 查询成功：100毫秒内完成向车次列表页的跳转，并携带查询参数（站点、日期、车次类型筛选）展示结果。
+          - 查询失败：保持在当前页面，保留用户输入信息，并弹出提示“查询失败，请稍后重试”。
       - id: REQ-Breakdown-1-5
-        name: 登录/注册/个人中心
+        name: 身份验证与中心跳转
         functional_description: |
... (diff truncated) ...

```

## File: arrival_selection.yaml

```diff
--- Original (arrival_selection.yaml)+++ Rewritten (arrival_selection.yaml)@@ -1,30 +1,30 @@ id: REQ-01-05
-name: 到达地选择
-functional_description: 用户输入或选择到达城市，支持模糊搜索和下拉推荐。
+name: 到达站点选定
+functional_description: 用户输入或拣选目的城市，兼容模糊检索及下拉列表推荐功能。
 ui_description: |
-  文本输入框，左侧标签“到达城市”。
-  聚焦时弹出城市选择浮层。
+  文本录入框，左侧标注“到达城市”。
+  获得焦点时展开城市选择悬浮层。
 input_parameters:
   - name: input_text
     type: string
-    description: 用户输入的文本
+    description: 用户键入的字符
 output_parameters:
   - name: selected_station
     type: object
     description: {id, name, code}
 preconditions:
-  - 处于车票查询表单中
+  - 位于车票查询表单上下文
 postconditions:
-  - 输入框显示选中的城市名
-  - 更新内部查询条件的到达地
+  - 输入框展示已选定城市名称
+  - 更新系统内部查询条件的到达地参数
 business_rules:
-  - 必须是系统支持的站点
-  - 支持中文名、拼音、拼音首字母搜索
-  - 与出发地不能相同（查询时校验，选择时不强制但建议提示）
+  - 必须隶属于系统支持的站点列表
+  - 支持中文名称、全拼、拼音首字母检索
+  - 不得与出发地重复（查询动作触发校验，选择阶段不强制拦截但建议给予提示）
 exceptions:
-  - 输入内容无法匹配时，提示“无法匹配该到达城市”
+  - 若输入内容无匹配项，提示“无法匹配该到达城市”
 scenarios:
-  - name: 正常选择到达地
+  - name: 常规选择到达地
     steps:
-      - action: 点击输入框，选择“上海”
-      - expectation: 输入框显示“上海”，下拉框收起。
+      - action: 点击输入框，选中“上海”
+      - expectation: 输入框呈现“上海”，下拉菜单收起。

```

## File: bottom_footer.yaml

```diff
--- Original (bottom_footer.yaml)+++ Rewritten (bottom_footer.yaml)@@ -1,19 +1,19 @@ id: REQ-01-11
-name: 底部导航与页脚
-functional_description: 展示友情链接、官方二维码及版权信息。
+name: 底部导航栏与页脚区域
+functional_description: 呈现友情链接、官方媒体二维码以及版权声明信息。
 ui_description: |
-  友情链接：左侧列表。
-  二维码：右侧4个（微信、微博、公众号、App）。
+  友情链接：置于左侧的列表区域。
+  二维码矩阵：右侧排列4个（微信、微博、公众号、App）。
 input_parameters: null
 output_parameters: null
 preconditions: null
 postconditions: null
 business_rules:
-  - 链接可点击跳转
-  - 二维码清晰可扫
+  - 链接需支持点击跳转
+  - 二维码需清晰可识别
 exceptions: null
 scenarios:
-  - name: 底部展示
+  - name: 底部内容展示
     steps:
-      - action: 滚动到底部
-      - expectation: 显示完整的页脚信息。
+      - action: 页面滚动至底部
+      - expectation: 完整展示页脚所有信息要素。

```

## File: date_selection.yaml

```diff
--- Original (date_selection.yaml)+++ Rewritten (date_selection.yaml)@@ -1,28 +1,28 @@ id: REQ-01-07
-name: 出发日期选择
-functional_description: 选择出发日期，支持日历选择。
+name: 启程日期选定
+functional_description: 指定行程起始日期，提供交互式日历组件。
 ui_description: |
-  输入框，右侧显示日历图标。
-  点击弹出日历控件。
+  文本显示区，右侧附带日历标识。
+  点击触发日历选择器弹窗。
 input_parameters:
   - name: selected_date
     type: date
-    description: 用户选择的日期
+    description: 用户指定的具体日期
 output_parameters:
   - name: final_date
     type: date
 preconditions:
-  - 处于车票查询表单中
+  - 位于车票检索表单上下文内
 postconditions:
-  - 输入框显示格式化后的日期（yyyy-MM-dd）
+  - 输入区呈现标准化日期格式（yyyy-MM-dd）
 business_rules:
-  - 默认显示当前日期（若未选）
-  - 只能选择预售期内的日期（如未来15天）
-  - 不能选择过去的时间
+  - 初始状态展示系统当前日期（若无用户输入）
+  - 仅限选取预售周期范围内的日期（例如未来15日内）
+  - 禁止选取历史日期
 exceptions:
-  - 尝试输入非法日期格式，自动纠正或提示
+  - 若输入格式违规，系统将自动修正或给予警示
 scenarios:
-  - name: 选择日期
+  - name: 日期选定操作
     steps:
-      - action: 点击日期框，选择明天
-      - expectation: 输入框显示明天的日期。
+      - action: 激活日期控件，选中次日日期
+      - expectation: 输入框正确回显次日日期。

```

## File: departure_selection.yaml

```diff
--- Original (departure_selection.yaml)+++ Rewritten (departure_selection.yaml)@@ -1,13 +1,13 @@ id: REQ-01-04
-name: 出发地选择
-functional_description: 用户输入或选择出发城市，支持模糊搜索和下拉推荐。
+name: 启程站点选择
+functional_description: 用户录入或拣选始发城市，兼容模糊匹配与下拉智能推荐。
 ui_description: |
-  文本输入框，左侧标签“出发城市”。
-  聚焦时弹出城市选择浮层（热门城市/拼音索引）。
+  文本录入域，左侧标注“出发城市”。
+  获得焦点时展开城市拣选面板（包含热门城市及拼音索引功能）。
 input_parameters:
   - name: input_text
     type: string
-    description: 用户输入的文本
+    description: 用户键入的字符
 output_parameters:
   - name: selected_station
     type: object
@@ -15,21 +15,21 @@ preconditions:
   - 处于车票查询表单中
 postconditions:
-  - 输入框显示选中的城市名
-  - 更新内部查询条件的出发地
+  - 输入域展示已选定的城市名称
+  - 同步更新内部查询参数中的始发地信息
 business_rules:
-  - 必须是系统支持的站点
-  - 支持中文名、拼音、拼音首字母搜索
-  - 聚焦输入框时，若未输入，显示热门城市/历史记录
-  - 选中后自动收起下拉框
+  - 必须属于系统预设的支持站点库
+  - 支持基于中文名称、全拼及首字母的检索方式
+  - 输入框获焦且无内容时，展示热门城市或历史搜索记录
+  - 完成选择后自动折叠下拉列表
 exceptions:
-  - 输入内容无法匹配时，提示“无法匹配该出发城市”
+  - 当输入无匹配项时，弹出提示“无法匹配该出发城市”
 scenarios:
-  - name: 正常选择出发地
+  - name: 常规始发地选择
     steps:
-      - action: 点击输入框，选择“北京”
-      - expectation: 输入框显示“北京”，下拉框收起。
-  - name: 模糊搜索
+      - action: 激活输入框，选中“北京”
+      - expectation: 输入框回显“北京”，同时收起下拉菜单。
+  - name: 模糊匹配检索
... (diff truncated) ...

```

## File: main_navigation.yaml

```diff
--- Original (main_navigation.yaml)+++ Rewritten (main_navigation.yaml)@@ -1,22 +1,22 @@ id: REQ-01-02
-name: 主导航栏
-functional_description: 页面主要的导航菜单，提供核心业务入口。
+name: 核心导航条
+functional_description: 页面的一级导航菜单，承载核心业务功能的访问入口。
 ui_description: |
-  背景蓝色，粘性定位。
-  包含“车票查询”、“订单查询”、“我的12306”等导航项。
-  右侧包含透明背景的“登录/注册”按钮（作为强调入口）。
+  底色为蓝，采用吸顶（Sticky）定位模式。
+  囊括“车票查询”、“订单查询”、“我的12306”等导航条目。
+  右端配置透明背景的“登录/注册”按键（作为高频操作入口）。
 input_parameters: null
 output_parameters: null
 preconditions:
-  - 页面加载完成
+  - 页面初始化完毕
 postconditions: null
 business_rules:
-  - 导航项平分宽度
-  - 滚动页面时保持吸顶
-  - Hover效果：背景色加深
+  - 各导航项均分容器宽度
+  - 页面滚动过程中保持顶部吸附
+  - 悬停反馈：背景颜色加深
 exceptions: null
 scenarios:
-  - name: 点击导航项
+  - name: 触发导航条目
     steps:
-      - action: 点击“车票查询”
-      - expectation: 页面跳转至车票查询页（或锚点定位）。
+      - action: 点击“车票查询”链接
+      - expectation: 页面重定向至车票查询页面（或执行锚点跳转）。

```

## File: promotional_area.yaml

```diff
--- Original (promotional_area.yaml)+++ Rewritten (promotional_area.yaml)@@ -1,21 +1,21 @@ id: REQ-01-10
-name: 宣传与推广区域
-functional_description: 展示首页中部的快捷入口图片、宣传卡片及底部发布信息。
+name: 营销与推广板块
+functional_description: 呈现首页中部的快捷功能图示、宣传卡片矩阵以及底部的公告信息。
 ui_description: |
-  中部快捷按钮区域：一张大图。
-  宣传栏区域：2列网格，4张卡片（会员服务、餐饮特产等）。
-  底部发布区域：一张横幅图。
+  中部快捷功能区：单幅大幅图片展示。
+  宣传栏板块：采用双列网格布局，包含4张主题卡片（如会员服务、餐饮特产等）。
+  底部公告区：单幅横幅图片。
 input_parameters: null
 output_parameters: null
 preconditions:
   - 页面加载完成
 postconditions: null
 business_rules:
-  - 图片需自适应宽度
-  - 卡片Hover时有上浮和阴影加深效果
+  - 图片资源需具备宽度自适应能力
+  - 卡片悬停时触发上浮动画及阴影加深视觉效果
 exceptions: null
 scenarios:
-  - name: 展示宣传内容
+  - name: 呈现推广内容
     steps:
-      - action: 页面滚动到中部
-      - expectation: 显示清晰的宣传图片和卡片。
+      - action: 滚动页面至中部区域
+      - expectation: 清晰展示各类宣传图片及卡片元素。

```

## File: search_action.yaml

```diff
--- Original (search_action.yaml)+++ Rewritten (search_action.yaml)@@ -1,9 +1,9 @@ id: REQ-01-09
-name: 查询提交
-functional_description: 校验表单并提交查询请求，跳转至车次列表页。
+name: 检索请求提交
+functional_description: 执行表单验证并发送检索请求，随后跳转至车次列表页面。
 ui_description: |
-  橙色大按钮，文字“查询”。
-  点击有反馈效果。
+  橙色醒目按钮，标注“查询”字样。
+  点击操作伴随视觉反馈。
 input_parameters:
   - name: departure_station
     type: object
@@ -15,24 +15,24 @@     type: object
 output_parameters: null
 preconditions:
-  - 用户完成了表单填写
+  - 用户已完成表单数据的录入
 postconditions:
-  - 跳转至车次列表页，并携带查询参数
+  - 导航至车次列表页，同时传递检索参数
 business_rules:
-  - 出发地不能为空
-  - 到达地不能为空
-  - 出发地和到达地不能相同
-  - 日期必须合法
-  - 校验通过后跳转；不通过则显示错误提示
+  - 始发地为必填项
+  - 目的地为必填项
+  - 始发地与目的地不得一致
+  - 日期必须符合规范
+  - 验证通过执行跳转；验证失败展示错误信息
 exceptions:
-  - 校验失败：在按钮上方显示红色错误提示条
-  - 网络异常：提示“查询失败，请稍后重试”
+  - 验证未通过：于按钮上方展示红色警示条
+  - 网络故障：提示“查询失败，请稍后重试”
 scenarios:
-  - name: 成功查询
+  - name: 查询操作成功
     steps:
-      - action: 填写完整信息，点击查询
-      - expectation: 跳转至车次列表页。
-  - name: 缺省查询
+      - action: 录入完整数据，点击查询按钮
+      - expectation: 成功跳转至车次列表页面。
+  - name: 信息缺失查询
... (diff truncated) ...

```

## File: station_swap.yaml

```diff
--- Original (station_swap.yaml)+++ Rewritten (station_swap.yaml)@@ -1,31 +1,31 @@ id: REQ-01-06
-name: 车站交换
-functional_description: 交换出发地和到达地的值。
+name: 站点对调
+functional_description: 互换始发地与目的地的数据。
 ui_description: |
-  位于出发地和到达地输入框之间的圆形按钮，带双向箭头图标。
-  Hover时有缩放效果。
+  置于始发与终点输入框之间的圆形控件，配有双向切换图标。
+  悬停时展现缩放动画。
 input_parameters:
   - name: departure_value
     type: string
-    description: 当前出发地
+    description: 当前始发站点
   - name: arrival_value
     type: string
-    description: 当前到达地
+    description: 当前终点站点
 output_parameters:
   - name: new_departure_value
     type: string
   - name: new_arrival_value
     type: string
 preconditions:
-  - 至少有一个输入框有值（或都为空也可以交换）
+  - 至少一项输入框非空（或两者皆空亦可执行交换）
 postconditions:
-  - 出发地和到达地内容互换
+  - 始发地与目的地内容互换
 business_rules:
-  - 仅交换显示的文本和对应的站点ID
-  - 若某一方为空，交换后另一方变为空
+  - 仅对调显示的文本信息及关联的站点ID
+  - 若一方缺省，交换后对应方亦变为空值
 exceptions: null
 scenarios:
-  - name: 点击交换
+  - name: 触发交换操作
     steps:
-      - action: 设出发地为“北京”，到达地为“上海”，点击交换按钮
-      - expectation: 出发地变为“上海”，到达地变为“北京”。
+      - action: 设定始发地“北京”，目的地“上海”，点击交换控件
+      - expectation: 始发地变更为“上海”，目的地变更为“北京”。

```

## File: ticket_filters.yaml

```diff
--- Original (ticket_filters.yaml)+++ Rewritten (ticket_filters.yaml)@@ -1,10 +1,10 @@ id: REQ-01-08
-name: 票种与席别筛选
-functional_description: 勾选“学生”、“高铁/动车”等筛选条件。
+name: 车票类型与席位过滤
+functional_description: 启用“学生票”、“高铁/动车”等检索过滤选项。
 ui_description: |
-  复选框组件。
-  “学生”：勾选后查询学生票。
-  “高铁/动车”：勾选后仅查询G/D/C字头列车。
+  多选框控件。
+  “学生”：选中该项以检索学生优惠票。
+  “高铁/动车”：选中该项将检索范围限定为G/D/C字头列车。
 input_parameters:
   - name: is_student
     type: boolean
@@ -15,13 +15,13 @@     type: object
 preconditions: null
 postconditions:
-  - 更新内部查询参数
+  - 同步刷新内部检索参数
 business_rules:
-  - 可多选
-  - 勾选“学生”可能影响后续下单时的验证流程
+  - 支持复选操作
+  - 启用“学生”选项或将触发后续购票环节的身份验证逻辑
 exceptions: null
 scenarios:
-  - name: 勾选只看高铁
+  - name: 仅检索高铁车次
     steps:
-      - action: 勾选“高铁/动车”
-      - expectation: 复选框变为选中状态。
+      - action: 选中“高铁/动车”复选框
+      - expectation: 该复选框呈现被选中状态。

```

## File: ticket_search_form_ui.yaml

```diff
--- Original (ticket_search_form_ui.yaml)+++ Rewritten (ticket_search_form_ui.yaml)@@ -1,25 +1,25 @@ id: REQ-01-03
-name: 车票查询表单容器
-functional_description: 包含左侧业务切换Tab和右侧查询表单内容的容器区域。
+name: 车票检索表单主容器
+functional_description: 涵盖左侧业务导航标签页及右侧检索表单详情的组合区域。
 ui_description: |
-  背景为App推广图。
-  左侧边栏：蓝色背景，垂直排列“车票”、“常用查询”、“订餐”Tab。
-  右侧内容区：白色背景，显示当前选中的业务表单（默认车票-单程）。
+  底图采用App营销海报。
+  左侧导航栏：采用蓝色底色，纵向罗列“车票”、“常用查询”、“订餐”等标签页。
+  右侧详情区：采用白色底色，呈现当前激活的业务表单（默认展示车票-单程界面）。
 input_parameters:
   - name: active_tab
     type: string
-    description: 当前选中的业务Tab，默认为“车票”
+    description: 当前激活的业务标签，默认初始值为“车票”
 output_parameters: null
 preconditions:
   - 页面加载完成
 postconditions:
-  - 显示对应的业务表单
+  - 渲染对应的业务操作界面
 business_rules:
-  - 默认选中“车票”Tab
-  - 切换Tab时更新右侧内容区
+  - 初始默认激活“车票”标签页
+  - 标签页切换时同步刷新右侧内容区域
 exceptions: null
 scenarios:
-  - name: 切换业务Tab
+  - name: 变更业务标签
     steps:
-      - action: 点击“常用查询”Tab
-      - expectation: 右侧内容区切换为常用查询表单。
+      - action: 激活“常用查询”标签页
+      - expectation: 右侧区域变更为常用查询表单界面。

```

## File: top_navigation.yaml

```diff
--- Original (top_navigation.yaml)+++ Rewritten (top_navigation.yaml)@@ -1,40 +1,40 @@ id: REQ-01-01
-name: 顶部导航栏
-functional_description: 展示Logo、全局搜索框、用户登录/注册入口及个人中心入口。根据登录状态切换显示内容。
+name: 顶层导航条
+functional_description: 呈现品牌Logo、全局检索栏、用户鉴权入口及个人中心链接。依据用户会话状态动态调整展示内容。
 ui_description: |
-  背景白色，底部浅灰边框。
-  左侧：Logo及“中国铁路12306”标识。
-  中部：搜索框，带搜索按钮。
-  右侧：
-  - 未登录：显示“登录”、“注册”、“个人中心”链接。
-  - 已登录：显示“欢迎，[用户名]”、“退出”链接。
+  白色背景，底边辅以浅灰色边框。
+  左端：部署Logo图标及“中国铁路12306”文字标识。
+  中间区域：配置带检索按钮的搜索输入框。
+  右端：
+  - 访客模式：展示“登录”、“注册”及“个人中心”超链接。
+  - 用户模式：展示“欢迎，[用户名]”提示语及“退出”操作链接。
 input_parameters:
   - name: is_logged_in
     type: boolean
-    description: 当前用户登录状态
+    description: 用户当前的会话状态
   - name: user_name
     type: string
-    description: 已登录用户的用户名
+    description: 已认证用户的账号名称
   - name: search_keyword
     type: string
-    description: 搜索框输入的关键词
+    description: 检索框内录入的关键字
 output_parameters: null
 preconditions:
   - 页面加载完成
 postconditions:
-  - 根据登录态显示对应链接
+  - 基于登录状态渲染相应的操作链接
 business_rules:
-  - 点击Logo跳转首页
-  - 点击登录/注册跳转对应页面
-  - 点击个人中心：未登录跳登录页，已登录跳个人中心
-  - 搜索框支持全局内容搜索
+  - 单击Logo返回网站主页
+  - 点击登录或注册链接跳转至相应页面
+  - 点击个人中心：未认证状态跳转登录页，已认证状态进入个人中心
+  - 检索框提供全站内容搜索功能
 exceptions: null
 scenarios:
... (diff truncated) ...

```

