## Context

全新项目——公司出勤管理系统。目前无现有代码。需从零建立完整的全栈应用。
技术栈已确定：React (Vite) + Express + PostgreSQL，Docker Compose 部署。

核心设计原则：**所有业务规则均可由管理者在线配置**，系统在代码层面只提供默认值，运行时行为由 `system_settings` 表驱动。

## Goals / Non-Goals

**Goals:**
- 建立可配置的出勤管理系统 MVP
- 三层角色权限体系 (admin / manager / employee)
- 核心模块：打卡、请假、加班、签核、代理人
- 所有业务规则可由管理者在设置界面配置
- Docker Compose 一键启动开发/部署环境
- 安全的用户认证与授权机制

**Non-Goals:**
- 移动端 App（仅 Web 响应式）
- GPS / IP 打卡限制（预留接口，MVP 不实现内部逻辑）
- 报表与数据分析仪表板（Phase 2）
- SSO / OAuth 第三方登入
- 多语言 i18n（MVP 仅中文）
- 实时通知（WebSocket）— 使用 Email + 页面通知

## Decisions

### D1: 项目结构 — Monorepo

```
attendance-system/
├── docker-compose.yml
├── client/                 # React (Vite)
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # 自定义 hooks
│   │   ├── services/       # API 请求封装
│   │   ├── contexts/       # React Context (auth, settings)
│   │   └── utils/
│   └── Dockerfile
├── server/                 # Express
│   ├── src/
│   │   ├── routes/         # 路由定义
│   │   ├── controllers/    # 业务逻辑
│   │   ├── models/         # Sequelize ORM 模型
│   │   ├── middleware/     # auth, role, validation
│   │   ├── services/       # 邮件、签核引擎等
│   │   ├── config/         # DB/SMTP 配置
│   │   └── migrations/    # 数据库迁移
│   └── Dockerfile
└── pgadmin/                # pgAdmin 配置
```

**理由**: Monorepo 简化开发体验，前后端共享一个 Docker Compose，适合中小型团队项目。

**备选方案**: 分离 repo — 增加了部署复杂度，对 MVP 过度工程化。

### D2: ORM — Sequelize

使用 Sequelize 作为 ORM，配合 migration 机制管理 schema 变更。

**理由**: Node.js 生态最成熟的 ORM，支持 PostgreSQL，migration 系统完善，社区资源丰富。

**备选方案**:
- Prisma — 类型安全更好，但 migration 机制较新，对动态配置模式灵活度略差
- Knex (query builder) — 更灵活，但失去 model 层抽象

### D3: 认证 — JWT + Refresh Token

- Access Token: 15 分钟过期，存 memory
- Refresh Token: 7 天过期，存 httpOnly cookie
- 密码: bcrypt (salt rounds = 12)

**理由**: 无状态认证适合前后端分离架构，Refresh Token 兼顾安全性与用户体验。

### D4: 系统配置架构 — Key-Value 设置表 + 前端缓存

```
system_settings 表:
┌─────────────────────────┬────────────┬──────────────────┐
│ key (PK)                │ value      │ description      │
├─────────────────────────┼────────────┼──────────────────┤
│ work_start_time         │ "09:00"    │ 上班时间          │
│ work_end_time           │ "18:00"    │ 下班时间          │
│ late_grace_minutes      │ "0"        │ 迟到容许分钟       │
│ flexible_hours_enabled  │ "false"    │ 弹性工时          │
│ flexible_start          │ "08:00"    │ 弹性开始          │
│ flexible_end            │ "10:00"    │ 弹性结束          │
│ clock_amendment_enabled │ "false"    │ 补打卡开关          │
│ min_leave_unit          │ "half_day" │ 最小请假单位       │
│ overtime_to_comp        │ "true"     │ 加班转补休         │
│ comp_ratio              │ "1.0"      │ 加班补休比例       │
│ overtime_pre_approval   │ "true"     │ 加班需事前申请      │
│ overtime_monthly_cap    │ "0"        │ 月加班上限(0=无限) │
│ approval_levels         │ "1"        │ 签核层级          │
│ proxy_required          │ "true"     │ 代理人必填         │
│ proxy_needs_confirm     │ "false"    │ 代理人需确认接受    │
│ proxy_can_approve       │ "false"    │ 代理人可代审批      │
│ sick_leave_proof        │ "false"    │ 病假需证明         │
│ email_on_leave_submit   │ "true"     │ 假单提交通知       │
│ email_on_approval       │ "true"     │ 审批结果通知       │
│ email_on_clock_anomaly  │ "false"    │ 打卡异常通知       │
│ dept_management_enabled │ "false"    │ 部门管理开关       │
└─────────────────────────┴────────────┴──────────────────┘
```

**理由**: Key-Value 模式最简单、最灵活。前端登入时拉取全部配置缓存在 Context 中，设置变更时重新拉取。比 JSON 配置文件灵活（可热更新），比每个配置建一张表简单。

### D5: 签核流程引擎

```
approval_flows 表:
  id | request_type | request_id | current_level | total_levels | status

approval_steps 表:
  id | flow_id | level | approver_id | status | comment | acted_at
```

MVP 默认一层签核：员工提交 → 直属主管审批 → 完成/驳回。

多层签核开启后（`approval_levels > 1`）：
- 按组织层级逐级签核
- 每级签核人从员工的上级链路自动推导
- 任一层驳回则整个流程驳回

驳回后员工可修改重新提交，产生新的 approval flow。

### D6: 假别系统 — 内建 + 自定义

```
leave_types 表:
  id | name | code | has_quota | deduct_pay | need_attachment
     | gender_specific | is_system | is_active | default_days
```

内建假别（`is_system = true`，不可删除）：
- 年假 (annual)
- 补休 (comp)
- 事假 (personal)

管理者可新增自定义假别（`is_system = false`），配置所有字段。

### D7: Docker Compose 服务编排

```yaml
services:
  client:     # React dev server (port 3000)
  server:     # Express API (port 5000)
  db:         # PostgreSQL 16 (port 5432)
  pgadmin:    # pgAdmin 4 (port 5050)
```

开发环境使用 volume mount 实现热重载，生产环境使用 multi-stage build。

### D8: Email — Nodemailer + 可配置 SMTP

使用 Nodemailer 搭配环境变量配置 SMTP。开发环境可使用 Ethereal (fake SMTP) 或 Mailhog 容器。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Key-Value 设置查询性能 | 频繁读取设置可能影响性能 | 后端启动时加载到内存，变更时刷新缓存 |
| 签核流程并发 | 同时审批可能产生竞态条件 | 数据库事务 + 乐观锁 (version field) |
| Email 发送失败 | 用户收不到密码/通知 | 队列重试机制 + 管理者界面可查看/重发 |
| 单一 JWT secret 泄露 | 所有 token 失效 | 定期轮换 secret，记录 token 签发时间 |
| Monorepo 部署耦合 | 前后端必须一起部署 | Docker 分开构建，可独立部署各容器 |
