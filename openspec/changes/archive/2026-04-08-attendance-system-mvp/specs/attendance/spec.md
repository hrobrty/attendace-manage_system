## ADDED Requirements

### Requirement: 上班打卡
系统 SHALL 允许员工在当天进行上班打卡，记录打卡时间。每天仅限一次上班打卡。

#### Scenario: 正常上班打卡
- **WHEN** 员工在上班时间前或准时点击「上班打卡」
- **THEN** 系统记录打卡时间，状态标记为「正常」

#### Scenario: 迟到打卡
- **WHEN** 员工在上班时间之后打卡（超过 `late_grace_minutes` 配置）
- **THEN** 系统记录打卡时间，状态标记为「迟到」

#### Scenario: 弹性工时模式下打卡
- **WHEN** `flexible_hours_enabled` 为 true 且员工在弹性区间内打卡
- **THEN** 系统记录打卡时间，状态标记为「正常」

#### Scenario: 重复上班打卡
- **WHEN** 员工当天已有上班打卡记录再次点击上班打卡
- **THEN** 系统拒绝并提示「今日已完成上班打卡」

### Requirement: 下班打卡
系统 SHALL 允许员工在当天进行下班打卡，记录打卡时间。须先有上班打卡记录。

#### Scenario: 正常下班打卡
- **WHEN** 员工在下班时间后点击「下班打卡」
- **THEN** 系统记录打卡时间，状态标记为「正常」

#### Scenario: 早退打卡
- **WHEN** 员工在下班时间前点击「下班打卡」
- **THEN** 系统记录打卡时间，状态标记为「早退」

#### Scenario: 未上班打卡就下班打卡
- **WHEN** 员工当天无上班打卡记录就点击下班打卡
- **THEN** 系统拒绝并提示「请先完成上班打卡」

### Requirement: 打卡记录查询
系统 SHALL 允许员工查看自己的打卡历史记录。Manager/Admin 可查看下属/所有人的记录。

#### Scenario: 员工查看自己的月度打卡记录
- **WHEN** 员工选择某月份查看打卡记录
- **THEN** 系统显示该月每日的上班时间、下班时间、状态（正常/迟到/早退/缺卡/请假）

#### Scenario: 管理者查看下属打卡记录
- **WHEN** manager 选择某下属查看打卡记录
- **THEN** 系统显示该下属的打卡历史

### Requirement: 补打卡申请（可配置）
当 `clock_amendment_enabled` 为 true 时，系统 SHALL 允许员工提交补打卡申请，需经签核流程审批。

#### Scenario: 补打卡功能关闭
- **WHEN** `clock_amendment_enabled` 为 false
- **THEN** 系统不显示补打卡申请入口

#### Scenario: 提交补打卡申请
- **WHEN** 员工提交补打卡申请，填写日期、时间、原因
- **THEN** 系统创建补打卡申请，进入签核流程

#### Scenario: 补打卡审批通过
- **WHEN** 审批人通过补打卡申请
- **THEN** 系统自动更新对应日期的打卡记录

### Requirement: 缺卡判定
系统 SHALL 在每日结束时自动判定当天未完成上班或下班打卡的员工为「缺卡」状态。

#### Scenario: 员工忘记下班打卡
- **WHEN** 员工有上班打卡但无下班打卡，且当天已过下班时间
- **THEN** 该记录标记为「缺卡（下班）」
