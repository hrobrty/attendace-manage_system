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

## 部署 (Deployment)

建议采用前后端分离部署方案：**后端 (API)** 部署在支持 Node.js 的平台（如 Railway, Render, Fly.io），**前端 (UI)** 部署在 Vercel。

### 1. 后端部署 (API Server)
推荐平台：[Railway](https://railway.app/) (操作最简便)

1.  **创建数据库**：在 Railway 控制面板点击 `New` -> `Database` -> `Add PostgreSQL`。
2.  **导入后端代码**：
    *   点击 `New` -> `GitHub Repo` -> 选择本仓库。
    *   在设置中将 **Root Directory** 设为 `server`。
3.  **配置环境变量 (Variables)**：复制以下项并填入 Railway 的 Variables 页面：
    *   `PORT`: `5000` (Railway 会自动分配，但建议手动指定一个)
    *   `DATABASE_URL`: 直接引用刚才创建的 PostgreSQL 的连接字符串（Railway 内部会自动注入 `PGHOST`, `PGUSER` 等，或者你直接填 `DB_HOST=${{Postgres.PGHOST}}` 等）。
    *   `JWT_ACCESS_SECRET`: 生产环境必需的随机强密钥。
    *   `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: 邮箱推送信息（参考上文 Gmail 教程）。
4.  **初始化数据库**：
    *   部署成功后，在 Railway 的终端执行一次 `npx sequelize-cli db:migrate` 和 `npx sequelize-cli db:seed:all` 来初始化正式环境的数据表和默认管理员。

### 2. 前端部署 (Vercel)

项目前端通过 Vercel 部署非常简单：

1.  **登录 Vercel**：关联你的 GitHub 账号。
2.  **导入项目**：点击 `Add New` -> `Project`，选择该仓库。
3.  **配置项目参数**：
    *   **Root Directory**: 设为 `client` (关键)。
    *   **Framework Preset**: 选择 `Vite`。
    *   **Build Command**: `npm run build`。
    *   **Output Directory**: `dist`。
4.  **配置环境变量 (Environment Variables)**：
    *   添加 `VITE_API_URL`: 填写你**已部署好的后端 API 地址** (例如 `https://your-api.railway.app/api`)。
5.  **点击 Deploy**：等待构建完成即可获得公网访问链接。

### 3. 生产环境 CheckList
*   [ ] 所有的 `localhost` 引用都已改为生产域名。
*   [ ] 数据库已完成初始 Seed（可通过 `npm run db:seed` 或在生产环境中手动触发一次）。
*   [ ] 生产环境的数据库开启了 SSL。
*   [ ] 设置了强密码的 `JWT_ACCESS_SECRET`。
