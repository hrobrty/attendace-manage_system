## 1. 项目初始化 & Docker 编排

- [ ] 1.1 创建 Monorepo 目录结构（client/、server/、docker/）
- [ ] 1.2 创建 Docker Compose 文件（PostgreSQL 16 + pgAdmin 4 + Express + React 服务定义）
- [ ] 1.3 创建 `.env.example` 模板（DB、JWT、SMTP 所有环境变量）
- [ ] 1.4 创建 server Dockerfile（Node.js + nodemon 开发模式）
- [ ] 1.5 创建 client Dockerfile（Vite 开发模式 HMR）
- [ ] 1.6 配置 pgAdmin 自动连接（servers.json 预配置）
- [ ] 1.7 验证 `docker compose up` 所有服务正常启动

## 2. 后端基础架构

- [ ] 2.1 初始化 Express 项目（package.json、入口文件、基本中间件 cors/json/helmet）
- [ ] 2.2 配置 Sequelize ORM 连接 PostgreSQL（config、connection test）
- [ ] 2.3 创建统一错误处理中间件（AppError 类、全局错误捕获）
- [ ] 2.4 创建统一 API 响应格式工具（success/error wrapper）
- [ ] 2.5 配置 express-validator 请求验证基础

## 3. 数据库 Schema & Migration

- [ ] 3.1 创建 users 表 migration（id, name, email, password, role, approver_id, department, hire_date, status, must_change_password, created_at, updated_at）
- [ ] 3.2 创建 system_settings 表 migration（key PK, value, description, category）
- [ ] 3.3 创建 leave_types 表 migration（id, name, code, has_quota, deduct_pay, need_attachment, gender_specific, is_system, is_active, default_days）
- [ ] 3.4 创建 leave_balances 表 migration（id, user_id, type_id, year, total_days, used_days）
- [ ] 3.5 创建 attendances 表 migration（id, user_id, date, clock_in, clock_out, status, note）
- [ ] 3.6 创建 leave_requests 表 migration（id, user_id, type_id, start_date, end_date, start_period, end_period, hours, reason, proxy_user_id, status, attachment_url）
- [ ] 3.7 创建 overtime_requests 表 migration（id, user_id, date, start_time, end_time, hours, reason, comp_hours, status）
- [ ] 3.8 创建 approval_flows 表 migration（id, request_type, request_id, current_level, total_levels, status）
- [ ] 3.9 创建 approval_steps 表 migration（id, flow_id, level, approver_id, proxy_approver_id, status, comment, acted_at）
- [ ] 3.10 创建 clock_amendments 表 migration（id, user_id, date, clock_type, amended_time, reason, status）
- [ ] 3.11 创建 Seed 数据（默认 admin 用户、内建假别、默认系统设置）
- [ ] 3.12 创建所有 Sequelize Model 文件并定义关联关系

## 4. 认证模块

- [ ] 4.1 实现密码工具（bcrypt 加密/比对、随机密码生成）
- [ ] 4.2 实现 JWT 工具（Access Token 签发/验证、Refresh Token 签发/验证）
- [ ] 4.3 实现 auth 中间件（verifyToken、requireRole）
- [ ] 4.4 实现 POST /api/auth/login 登入端点
- [ ] 4.5 实现 POST /api/auth/refresh Token 刷新端点
- [ ] 4.6 实现 POST /api/auth/logout 登出端点
- [ ] 4.7 实现 PUT /api/auth/change-password 修改密码端点
- [ ] 4.8 实现首次登入强制改密码逻辑（must_change_password 字段检查）

## 5. 系统设置模块

- [ ] 5.1 实现 SettingsService（加载、缓存、更新、刷新系统设置）
- [ ] 5.2 实现 GET /api/settings 获取所有设置（admin only）
- [ ] 5.3 实现 GET /api/settings/public 获取公开设置（所有登入用户）
- [ ] 5.4 实现 PUT /api/settings 批量更新设置（admin only，更新后刷新缓存）
- [ ] 5.5 编写 settings 中间件（将当前设置注入 req 对象供后续路由使用）

## 6. 用户管理模块

- [ ] 6.1 实现 GET /api/users 用户列表（admin: 全部, manager: 下属）
- [ ] 6.2 实现 POST /api/users 新增用户（admin only，生成密码 + 发送 Email）
- [ ] 6.3 实现 GET /api/users/:id 查看用户详情
- [ ] 6.4 实现 PUT /api/users/:id 编辑用户信息（admin only）
- [ ] 6.5 实现 PUT /api/users/:id/status 停用/启用用户（admin only）
- [ ] 6.6 实现 DELETE /api/users/:id 删除用户（admin only，软删除）
- [ ] 6.7 实现 GET /api/users/me 查看个人资料
- [ ] 6.8 实现 PUT /api/users/:id/leave-balance 管理者设定员工假额度（admin only）

## 7. Email 通知模块

- [ ] 7.1 配置 Nodemailer（SMTP 连接、开发环境 Ethereal 支持）
- [ ] 7.2 实现 EmailService（发送邮件、模板渲染、失败重试）
- [ ] 7.3 创建 Email 模板：新用户欢迎邮件（含临时密码）
- [ ] 7.4 创建 Email 模板：假单提交通知审批人
- [ ] 7.5 创建 Email 模板：审批结果通知（核准/驳回）
- [ ] 7.6 创建 Email 模板：代理人通知
- [ ] 7.7 创建 Email 模板：打卡异常通知

## 8. 打卡模块

- [ ] 8.1 实现 POST /api/attendance/clock-in 上班打卡（含迟到判定、弹性工时逻辑）
- [ ] 8.2 实现 POST /api/attendance/clock-out 下班打卡（含早退判定）
- [ ] 8.3 实现 GET /api/attendance 查看打卡记录（月度列表，支持筛选）
- [ ] 8.4 实现 GET /api/attendance/today 查看今日打卡状态
- [ ] 8.5 实现 POST /api/attendance/amendment 补打卡申请（读取 clock_amendment_enabled 配置）
- [ ] 8.6 实现打卡状态自动判定逻辑（读取 system_settings 动态判定迟到/早退/弹性）

## 9. 假别管理模块

- [ ] 9.1 实现 GET /api/leave-types 获取假别列表（员工看到 is_active 的，admin 看到全部）
- [ ] 9.2 实现 POST /api/leave-types 新增自定义假别（admin only）
- [ ] 9.3 实现 PUT /api/leave-types/:id 编辑假别（admin only，内建假别部分字段不可改）
- [ ] 9.4 实现 PUT /api/leave-types/:id/status 启用/停用假别（admin only，内建不可停用）

## 10. 签核流程引擎

- [ ] 10.1 实现 ApprovalService（创建流程、推进流程、驳回流程、多层签核逻辑）
- [ ] 10.2 实现自动路由逻辑（根据 approver_id 链推导各层审批人）
- [ ] 10.3 实现 GET /api/approvals/pending 待审列表
- [ ] 10.4 实现 PUT /api/approvals/:id/approve 通过审批
- [ ] 10.5 实现 PUT /api/approvals/:id/reject 驳回审批（含驳回原因）
- [ ] 10.6 实现审批完成后回调（更新请假/加班/补打卡状态、额度扣除/返还）
- [ ] 10.7 实现代理审批权限检查（`proxy_can_approve` 配置 + 主管请假期间判定）

## 11. 请假申请模块

- [ ] 11.1 实现 POST /api/leave-requests 提交请假申请（含额度预扣、日期冲突检查、代理人）
- [ ] 11.2 实现 GET /api/leave-requests 查看请假记录（个人/下属/全部依角色）
- [ ] 11.3 实现 GET /api/leave-requests/:id 请假详情（含签核历史）
- [ ] 11.4 实现 PUT /api/leave-requests/:id/cancel 取消请假（仅待审状态）
- [ ] 11.5 实现 POST /api/leave-requests/:id/resubmit 驳回后修改重新提交
- [ ] 11.6 实现 GET /api/leave-balances 查看假额度余额
- [ ] 11.7 实现附件上传功能（multer，存 uploads 目录）

## 12. 加班申请模块

- [ ] 12.1 实现 POST /api/overtime-requests 提交加班申请（含月上限检查）
- [ ] 12.2 实现 GET /api/overtime-requests 查看加班记录
- [ ] 12.3 实现加班核准后自动产生补休额度逻辑（comp_ratio 比例计算）
- [ ] 12.4 实现 GET /api/overtime-requests/summary 本月加班统计

## 13. 代理人模块

- [ ] 13.1 实现请假表单代理人选择接口 GET /api/users/available-proxies
- [ ] 13.2 实现代理人确认接受/拒绝接口 PUT /api/proxy/:id/respond（proxy_needs_confirm 配置）
- [ ] 13.3 实现代理人通知触发（请假核准后通知代理人）
- [ ] 13.4 实现审批路由中代理审批权限判定

## 14. 前端基础架构

- [ ] 14.1 初始化 Vite + React 项目（React Router、基本目录结构）
- [ ] 14.2 建立设计系统（CSS 变量、全局样式、响应式断点）
- [ ] 14.3 实现 AuthContext（JWT 管理、Token 刷新、登入状态）
- [ ] 14.4 实现 SettingsContext（系统设置缓存、条件渲染）
- [ ] 14.5 实现 API service 封装（axios 拦截器、自动 Token 刷新、错误处理）
- [ ] 14.6 实现路由保护组件 ProtectedRoute（权限检查、角色路由）
- [ ] 14.7 实现通用 UI 组件（Button、Input、Select、Modal、Table、Loading、Toast）

## 15. 前端页面 — 认证 & 个人

- [ ] 15.1 实现登入页面（Email + 密码表单、错误提示）
- [ ] 15.2 实现首次登入强制改密码页面
- [ ] 15.3 实现主布局组件（侧边栏导航、顶部栏、用户信息下拉）
- [ ] 15.4 实现个人资料页面（查看/修改密码）

## 16. 前端页面 — 打卡

- [ ] 16.1 实现打卡首页（今日状态、上/下班打卡按钮、当前时间显示）
- [ ] 16.2 实现打卡记录页面（月历视图、状态标记、筛选）
- [ ] 16.3 实现补打卡申请表单（条件渲染，根据 clock_amendment_enabled）

## 17. 前端页面 — 请假

- [ ] 17.1 实现请假申请表单（假别选择、日期选择、代理人选择、附件上传）
- [ ] 17.2 实现请假记录列表（状态筛选、分页）
- [ ] 17.3 实现请假详情页（签核历史时间线、取消/重提按钮）
- [ ] 17.4 实现假额度余额显示组件

## 18. 前端页面 — 加班

- [ ] 18.1 实现加班申请表单（日期、时间、事由）
- [ ] 18.2 实现加班记录列表
- [ ] 18.3 实现本月加班统计卡片

## 19. 前端页面 — 审批

- [ ] 19.1 实现待审列表页面（请假/加班/补打卡 tabs）
- [ ] 19.2 实现审批操作组件（通过/驳回按钮、驳回原因输入）
- [ ] 19.3 实现审批历史页面

## 20. 前端页面 — 管理者

- [ ] 20.1 实现用户管理列表页面（搜索、筛选、分页）
- [ ] 20.2 实现新增/编辑用户表单 Modal
- [ ] 20.3 实现假别管理页面（CRUD 自定义假别）
- [ ] 20.4 实现员工假额度管理页面
- [ ] 20.5 实现系统设置页面（按分类分组的配置表单）
- [ ] 20.6 实现下属打卡/请假/加班记录查看页面

## 21. 整合测试 & 收尾

- [ ] 21.1 端到端测试：新增用户 → 收到 Email → 首次登入 → 改密码 → 打卡
- [ ] 21.2 端到端测试：请假申请 → 签核 → 核准/驳回 → 额度变化
- [ ] 21.3 端到端测试：加班申请 → 签核 → 核准 → 补休额度累积
- [ ] 21.4 端到端测试：系统设置变更 → 行为变化验证
- [ ] 21.5 编写 README.md（项目说明、快速开始、环境变量说明、技术栈）
- [ ] 21.6 最终 Docker 验证：clean build + 全部服务健康检查
