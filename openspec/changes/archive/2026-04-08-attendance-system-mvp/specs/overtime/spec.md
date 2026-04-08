## ADDED Requirements

### Requirement: 提交加班申请
系统 SHALL 允许员工提交加班申请，包含：日期、预计开始时间、预计结束时间、加班事由。

#### Scenario: 事前申请加班
- **WHEN** `overtime_pre_approval` 为 true 且员工提交加班申请
- **THEN** 系统创建加班申请，进入签核流程

#### Scenario: 事后报备加班
- **WHEN** `overtime_pre_approval` 为 false 且员工提交加班报备
- **THEN** 系统创建加班记录，进入签核流程（事后审批）

### Requirement: 加班转补休
当 `overtime_to_comp` 为 true 时，系统 SHALL 在加班申请核准后自动按 `comp_ratio` 比例产生补休额度。

#### Scenario: 加班 2 小时，1:1 转补休
- **WHEN** 加班申请核准，加班时数为 2 小时，`comp_ratio` 为 1.0
- **THEN** 系统自动增加该员工 2 小时的补休额度

#### Scenario: 加班转补休功能关闭
- **WHEN** `overtime_to_comp` 为 false 且加班申请核准
- **THEN** 系统不产生补休额度

### Requirement: 月加班上限（可配置）
当 `overtime_monthly_cap` 大于 0 时，系统 SHALL 限制员工每月加班总时数。

#### Scenario: 超过月加班上限
- **WHEN** 员工本月已加班 44 小时，再申请 4 小时加班，`overtime_monthly_cap` 为 46
- **THEN** 系统拒绝并提示「本月加班已达上限 46 小时」

#### Scenario: 月加班无上限
- **WHEN** `overtime_monthly_cap` 为 0
- **THEN** 系统不限制加班时数

### Requirement: 加班记录查询
系统 SHALL 允许员工查看自己的加班历史记录和补休累积情况。

#### Scenario: 查看本月加班记录
- **WHEN** 员工查看加班记录
- **THEN** 系统显示本月已加班时数、已核准时数、待审时数、已产生补休时数
