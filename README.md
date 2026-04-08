# 出勤管理系统 (Attendance Management System)

员工出勤管理系统 MVP — 打卡、请假、加班、签核流程，所有规则可配置。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Express 5 + Sequelize ORM |
| 数据库 | PostgreSQL 16 |
| 运行 | Docker (Postgres + pgAdmin) + Local (前后端) |

## 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) v18+ (推荐 v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm (随 Node.js 安装)

### 1. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env
```

`.env` 文件已包含开发环境的默认值，通常不需要修改。

### 2. 启动数据库

```bash
# 启动 PostgreSQL 和 pgAdmin
docker compose up -d

# 确认服务运行中
docker compose ps
```

| 服务 | 地址 | 用途 |
|------|------|------|
| PostgreSQL | `localhost:5432` | 数据库 |
| pgAdmin | `http://localhost:5050` | 数据库管理界面 |

pgAdmin 登入：`admin@attendance.local` / `pgadmin_pass_2026`

### 3. 启动后端

```bash
cd server
npm install
npm run dev
```

后端运行于 `http://localhost:5000`

> 首次启动会自动创建数据表和初始数据（管理员账号、假别、系统设置）

### 4. 启动前端

```bash
cd client
npm install
npm run dev
```

前端运行于 `http://localhost:3000`

### 5. 登入系统

默认管理员账号：

| 项目 | 值 |
|------|----|
| Email | `admin@attendance.local` |
| 密码 | `admin123` |

## 项目结构

```
attendance-system/
├── client/                  # React 前端
│   └── src/
│       ├── components/      # 可复用组件
│       ├── contexts/        # React Context (Auth, Settings)
│       ├── pages/           # 页面组件
│       ├── services/        # API 请求层
│       ├── types/           # TypeScript 类型定义
│       └── hooks/           # 自定义 Hooks
├── server/                  # Express 后端
│   └── src/
│       ├── config/          # 数据库/ORM 配置
│       ├── controllers/     # 控制器（业务逻辑）
│       ├── middleware/      # 中间件（认证/验证/错误处理）
│       ├── models/          # Sequelize 模型
│       ├── routes/          # 路由定义
│       ├── services/        # 服务层（Email/签核/设置）
│       └── utils/           # 工具函数
├── docker/                  # Docker 配置文件
├── docker-compose.yml       # Docker Compose（Postgres + pgAdmin）
├── .env.example             # 环境变量模板
└── openspec/                # OpenSpec 规格文档
```

## 核心功能

- ✅ **JWT 认证** — Access/Refresh Token，角色权限（admin/manager/employee）
- ✅ **打卡** — 上下班打卡，迟到/早退/缺卡判定
- ✅ **请假** — 申请、假别管理、额度追踪、附件上传
- ✅ **加班** — 申请、自动转补休额度
- ✅ **签核流程** — 一层/多层签核（可配置），驳回+重提
- ✅ **代理人** — 请假代理、可配置审批权限转移
- ✅ **系统设置** — 所有规则由管理者界面配置
- ✅ **Email 通知** — 新用户密码、审批通知（Ethereal 开发测试）

## API 端点

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `POST /api/auth/login` | 登入 |
| 认证 | `POST /api/auth/refresh` | 刷新 Token |
| 认证 | `PUT /api/auth/change-password` | 修改密码 |
| 用户 | `GET/POST /api/users` | 用户列表/新增 |
| 打卡 | `POST /api/attendance/clock-in` | 上班打卡 |
| 打卡 | `POST /api/attendance/clock-out` | 下班打卡 |
| 请假 | `POST /api/leave-requests` | 提交请假 |
| 加班 | `POST /api/overtime-requests` | 提交加班 |
| 审批 | `GET /api/approvals/pending` | 待审列表 |
| 审批 | `PUT /api/approvals/:id/approve` | 通过 |
| 设置 | `GET/PUT /api/settings` | 系统设置 |

## 常用命令

```bash
# 停止数据库
docker compose down

# 停止数据库并清除数据
docker compose down -v

# 查看后端日志
cd server && npm run dev

# 前端构建
cd client && npm run build
```

## 系统设置

管理者可在 **系统设置** 页面配置所有业务规则：

| 分类 | 可配置项 |
|------|---------|
| 打卡 | 上下班时间、迟到容许、弹性工时、补打卡 |
| 请假 | 最小请假单位、病假需证明 |
| 加班 | 事前/事后申请、转补休比例、月上限 |
| 签核 | 签核层级数 |
| 代理人 | 必填/确认/审批权限 |
| 通知 | Email 通知开关 |
