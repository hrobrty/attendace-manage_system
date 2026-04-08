## ADDED Requirements

### Requirement: 系统设置界面
系统 SHALL 为 admin 角色提供可视化的设置管理界面，按分类展示所有可配置项。

#### Scenario: 管理者访问设置页面
- **WHEN** admin 角色访问系统设置页面
- **THEN** 系统显示按分类（打卡、请假、加班、签核、代理人、通知、组织）分组的配置项

#### Scenario: 非 admin 访问设置页面
- **WHEN** employee 或 manager 尝试访问系统设置页面
- **THEN** 系统返回 403 并重定向

### Requirement: 打卡配置
系统 SHALL 允许 admin 配置以下打卡相关参数：上班时间、下班时间、迟到容许分钟、弹性工时开关及区间、补打卡开关。

#### Scenario: 修改上班时间
- **WHEN** admin 将上班时间从 09:00 改为 08:30 并保存
- **THEN** 系统更新配置，次日起生效，所有员工的迟到判定基于 08:30

### Requirement: 假别配置
系统 SHALL 允许 admin 管理假别定义：新增/编辑/停用自定义假别，设定各假别的额度、是否扣薪、是否需要附件等参数。

#### Scenario: 新增自定义假别
- **WHEN** admin 新增一个名为「产假」的假别，设定 56 天额度、不扣薪、需附件、仅女性
- **THEN** 系统创建该假别，女性员工的请假表单出现「产假」选项

### Requirement: 签核配置
系统 SHALL 允许 admin 配置签核层级数。

#### Scenario: 从一层签核切换到两层签核
- **WHEN** admin 将 `approval_levels` 从 1 改为 2
- **THEN** 之后提交的新申请需要两层审批（已在流程中的申请不受影响）

### Requirement: 加班配置
系统 SHALL 允许 admin 配置：加班是否需事前申请、是否转补休、补休比例、月加班上限。

#### Scenario: 关闭加班转补休
- **WHEN** admin 将 `overtime_to_comp` 设为 false
- **THEN** 之后核准的加班不再自动产生补休额度

### Requirement: 代理人配置
系统 SHALL 允许 admin 配置：代理人是否必填、是否需代理人确认、代理人是否有审批权限。

#### Scenario: 开启代理人审批权限
- **WHEN** admin 将 `proxy_can_approve` 设为 true
- **THEN** 主管请假期间其代理人可代为审批下属假单

### Requirement: 通知配置
系统 SHALL 允许 admin 配置哪些场景触发 Email 通知（假单提交、审批结果、打卡异常）。

#### Scenario: 关闭打卡异常通知
- **WHEN** admin 将 `email_on_clock_anomaly` 设为 false
- **THEN** 系统不再发送打卡异常 Email

### Requirement: 设置变更即时生效
系统 SHALL 在 admin 保存设置后立即生效（刷新后端缓存），无需重启服务。

#### Scenario: 设置变更后立即生效
- **WHEN** admin 修改配置并保存
- **THEN** 后端缓存立即更新，后续 API 请求使用新配置
