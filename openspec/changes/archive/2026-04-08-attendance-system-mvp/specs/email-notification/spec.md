## ADDED Requirements

### Requirement: 新用户密码通知
系统 SHALL 在 admin 新增用户后自动发送 Email，包含登入网址和系统生成的临时密码。

#### Scenario: 新增用户后发送 Email
- **WHEN** admin 成功新增一个用户
- **THEN** 系统向该用户的 Email 发送包含临时密码的欢迎邮件

#### Scenario: Email 发送失败
- **WHEN** Email 发送失败（SMTP 错误）
- **THEN** 系统记录失败日志，admin 界面显示「Email 发送失败」提示，提供重发按钮

### Requirement: 假单提交通知审批人
当 `email_on_leave_submit` 为 true 时，系统 SHALL 在假单提交后通知审批人。

#### Scenario: 假单提交后通知审批人
- **WHEN** 员工提交假单且 `email_on_leave_submit` 为 true
- **THEN** 系统向审批人发送 Email：「XX 提交了请假申请（年假 X/X~X/X），请进入系统审批」

### Requirement: 审批结果通知申请人
当 `email_on_approval` 为 true 时，系统 SHALL 在审批完成后通知申请人结果。

#### Scenario: 假单核准后通知
- **WHEN** 审批人批准假单且 `email_on_approval` 为 true
- **THEN** 系统向申请人发送 Email：「您的请假申请（年假 X/X~X/X）已核准」

#### Scenario: 假单驳回后通知
- **WHEN** 审批人驳回假单且 `email_on_approval` 为 true
- **THEN** 系统向申请人发送 Email：「您的请假申请已被驳回，原因：XXX」

### Requirement: 打卡异常通知（可配置）
当 `email_on_clock_anomaly` 为 true 时，系统 SHALL 在检测到打卡异常（迟到/早退/缺卡）时通知员工及其主管。

#### Scenario: 迟到通知
- **WHEN** 员工迟到且 `email_on_clock_anomaly` 为 true
- **THEN** 系统向员工和其直属主管发送迟到通知 Email

### Requirement: SMTP 配置
系统 SHALL 通过环境变量配置 SMTP 服务器信息。开发环境支持 Ethereal 测试邮件服务。

#### Scenario: 开发环境使用 Ethereal
- **WHEN** 环境变量 `SMTP_HOST` 设为 Ethereal 地址
- **THEN** 所有 Email 发送至 Ethereal 平台可在线预览
