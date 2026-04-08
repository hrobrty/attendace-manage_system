## Why

公司需要一套数字化的出勤管理系统，取代传统纸本/Excel 管理方式。员工需要在线打卡、请假、申请加班，管理者需要审批假单并管理员工。系统需要支持灵活配置，让不同公司可以根据自身规章调整规则。

## What Changes

- 建立全新的全栈出勤管理系统（React + Express + PostgreSQL）
- 提供 JWT 身份验证与三层角色权限（admin / manager / employee）
- 打卡上下班功能，含迟到/早退/异常判定
- 请假申请流程，含可配置假别（年假、补休、事假 + 自定义假别）
- 加班申请流程，加班时数可自动转补休额度
- 签核流程引擎（一层签核为 MVP，多层签核可配置）
- 代理人制度（请假时指定职务代理人，代理审批权可配置）
- 管理者用户 CRUD + 新增用户自动发送 Email 密码
- 系统设置模块 — 所有规则参数由管理者界面配置
- Docker Compose 一键启动（含 pgAdmin）

## Capabilities

### New Capabilities
- `user-management`: 用户 CRUD、角色权限分配（admin/manager/employee）、新增用户 Email 通知密码
- `authentication`: JWT 登入登出、密码重置、角色权限中间件
- `attendance`: 打卡上下班、迟到/早退/异常判定、补打卡申请（可配置）
- `leave-management`: 请假申请、假别定义（内建+自定义）、假额度管理、附件上传
- `overtime`: 加班申请（事前/事后可配置）、加班转补休额度（比例可配置）
- `approval-workflow`: 签核流程引擎、一层/多层签核（可配置）、驳回与重新提交
- `proxy-delegation`: 请假代理人指定、代理人通知、代理审批权限转移（可配置）
- `system-settings`: 管理者设置界面、打卡/假别/签核/加班/通知/组织等所有规则可配置
- `email-notification`: Email 发送服务、新用户密码通知、假单审批通知、打卡异常通知（可配置）
- `docker-deployment`: Docker Compose 编排、React/Express/PostgreSQL/pgAdmin 容器化

### Modified Capabilities
_(无，全新项目)_

## Impact

- **前端**: 全新 React (Vite) 应用，需建立完整的页面路由、组件库、状态管理
- **后端**: 全新 Express API 服务，需建立 RESTful API、中间件、数据模型
- **数据库**: PostgreSQL schema 设计，含 migrations
- **基础设施**: Docker Compose 编排，含开发环境与生产环境配置
- **外部依赖**: SMTP 邮件服务（可用 Nodemailer + 任意 SMTP 服务器）
- **安全性**: 密码 bcrypt 加密、JWT token 管理、CORS 配置、输入验证
