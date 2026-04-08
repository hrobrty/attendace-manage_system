## ADDED Requirements

### Requirement: Docker Compose 编排
系统 SHALL 使用 Docker Compose 编排以下服务：React 前端、Express 后端、PostgreSQL 数据库、pgAdmin 管理界面。

#### Scenario: 一键启动所有服务
- **WHEN** 用户执行 `docker compose up`
- **THEN** 所有四个服务启动完成，前端可通过 http://localhost:3000 访问，后端通过 http://localhost:5000，pgAdmin 通过 http://localhost:5050

### Requirement: 开发环境热重载
系统 SHALL 在开发模式下使用 volume mount 实现前后端代码热重载。

#### Scenario: 修改前端代码
- **WHEN** 开发者修改 React 组件代码并保存
- **THEN** 浏览器自动更新显示新内容（HMR）

#### Scenario: 修改后端代码
- **WHEN** 开发者修改 Express 路由代码并保存
- **THEN** 后端服务自动重启（nodemon）

### Requirement: 数据库持久化
PostgreSQL 数据 SHALL 通过 Docker volume 持久化，容器重启不丢失数据。

#### Scenario: 容器重启后数据保留
- **WHEN** 用户执行 `docker compose down` 再 `docker compose up`
- **THEN** 数据库中的所有数据保留

### Requirement: pgAdmin 管理界面
系统 SHALL 提供 pgAdmin 服务，预配置数据库连接信息。

#### Scenario: 访问 pgAdmin
- **WHEN** 用户访问 http://localhost:5050 并使用预设账密登入
- **THEN** 可直接看到已连接的 attendance 数据库

### Requirement: 环境变量管理
系统 SHALL 使用 `.env` 文件管理所有敏感配置（数据库密码、JWT secret、SMTP 信息等），并提供 `.env.example` 模板。

#### Scenario: 首次启动环境配置
- **WHEN** 新开发者 clone 项目后复制 `.env.example` 为 `.env`
- **THEN** 使用默认配置即可成功启动所有服务
