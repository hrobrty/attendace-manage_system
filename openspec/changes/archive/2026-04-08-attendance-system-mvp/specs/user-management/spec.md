## ADDED Requirements

### Requirement: 管理者可新增用户
系统 SHALL 允许 admin 角色新增用户，填写姓名、Email、角色、直属主管等信息。新增成功后系统 SHALL 自动生成随机密码并通过 Email 发送给该用户。

#### Scenario: 成功新增员工
- **WHEN** admin 在用户管理页面填写完整信息并点击新增
- **THEN** 系统创建用户记录，生成随机密码，发送 Email 通知，页面显示成功提示

#### Scenario: Email 重复
- **WHEN** admin 输入的 Email 已存在于系统中
- **THEN** 系统拒绝创建并显示「Email 已被使用」错误信息

### Requirement: 管理者可编辑用户
系统 SHALL 允许 admin 角色编辑任意用户的基本信息（姓名、角色、直属主管、状态）。

#### Scenario: 修改用户角色
- **WHEN** admin 将用户角色从 employee 改为 manager
- **THEN** 该用户立即获得 manager 权限（可审批假单）

### Requirement: 管理者可停用/删除用户
系统 SHALL 允许 admin 角色停用（软删除）或删除用户。停用后该用户无法登入。

#### Scenario: 停用用户
- **WHEN** admin 将某用户状态设为停用
- **THEN** 该用户的现有 JWT token 失效，无法再登入系统

#### Scenario: 停用的用户尝试登入
- **WHEN** 已停用的用户尝试使用正确密码登入
- **THEN** 系统拒绝登入并显示「账号已停用」提示

### Requirement: 三层角色权限
系统 SHALL 定义三种角色：admin、manager、employee。
- admin: 系统管理 + 用户 CRUD + 所有权限
- manager: 审批假单/加班 + 查看下属记录
- employee: 打卡 + 请假 + 申请加班 + 查看自己的记录

#### Scenario: employee 尝试访问用户管理页面
- **WHEN** employee 角色尝试访问 /admin/users 页面
- **THEN** 系统返回 403 并重定向到首页

#### Scenario: manager 审批下属假单
- **WHEN** manager 角色查看待审批列表
- **THEN** 系统仅显示该 manager 被指定为审批人的假单

### Requirement: 用户个人资料
每个用户 SHALL 拥有以下字段：姓名、Email、角色、直属主管（approver_id）、部门（可选）、入职日期、状态（active/inactive）。

#### Scenario: 查看个人资料
- **WHEN** 任何已登入用户访问个人资料页面
- **THEN** 系统显示该用户的完整个人信息（密码除外）

### Requirement: 用户可修改自己的密码
系统 SHALL 允许用户修改自己的密码，需提供当前密码验证。

#### Scenario: 修改密码
- **WHEN** 用户输入正确的当前密码和符合规则的新密码
- **THEN** 系统更新密码，所有其他设备的 session 失效
