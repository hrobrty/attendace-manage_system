## ADDED Requirements

### Requirement: JWT 登入
系统 SHALL 使用 JWT 进行身份验证。用户提供 Email + 密码登入后，系统 SHALL 返回 Access Token（15 分钟过期）和 Refresh Token（7 天过期，httpOnly cookie）。

#### Scenario: 成功登入
- **WHEN** 用户输入正确的 Email 和密码
- **THEN** 系统返回 Access Token 并设置 Refresh Token cookie，重定向到打卡首页

#### Scenario: 密码错误
- **WHEN** 用户输入错误的密码
- **THEN** 系统返回 401 错误，显示「Email 或密码错误」

#### Scenario: 账号已停用
- **WHEN** 已停用账号尝试登入
- **THEN** 系统返回 403 错误，显示「账号已停用，请联系管理员」

### Requirement: Token 自动刷新
系统 SHALL 在 Access Token 过期时自动使用 Refresh Token 获取新的 Access Token，对用户无感。

#### Scenario: Access Token 过期自动刷新
- **WHEN** 前端发出 API 请求收到 401 响应且 Refresh Token 有效
- **THEN** 前端自动调用 refresh 端点获取新 Access Token 并重试原请求

#### Scenario: Refresh Token 也过期
- **WHEN** Access Token 和 Refresh Token 均已过期
- **THEN** 系统将用户重定向到登入页面

### Requirement: 登出
系统 SHALL 提供登出功能，清除 Access Token 和 Refresh Token。

#### Scenario: 用户登出
- **WHEN** 用户点击登出按钮
- **THEN** 系统清除前端 Access Token、删除 Refresh Token cookie，重定向到登入页面

### Requirement: 首次登入强制改密码
系统 SHALL 在用户首次登入（使用系统生成的密码）时强制要求修改密码。

#### Scenario: 首次登入
- **WHEN** 用户使用系统自动生成的密码首次登入
- **THEN** 系统重定向到强制改密码页面，完成后才能使用其他功能

### Requirement: API 路由保护
所有 API 端点（除登入和 refresh 外）SHALL 要求有效的 Access Token。角色权限检查 SHALL 通过中间件实现。

#### Scenario: 无 Token 访问 API
- **WHEN** 未附带 Access Token 的请求访问受保护 API
- **THEN** 系统返回 401 Unauthorized

#### Scenario: 权限不足
- **WHEN** employee 角色尝试调用 admin-only API
- **THEN** 系统返回 403 Forbidden
