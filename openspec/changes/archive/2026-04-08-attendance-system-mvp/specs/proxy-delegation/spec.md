## ADDED Requirements

### Requirement: 请假指定代理人
系统 SHALL 在请假申请表单中提供代理人选择字段。是否必填 SHALL 由 `proxy_required` 配置决定。

#### Scenario: 代理人必填
- **WHEN** `proxy_required` 为 true 且员工未选择代理人
- **THEN** 系统拒绝提交并提示「请选择职务代理人」

#### Scenario: 代理人选填
- **WHEN** `proxy_required` 为 false
- **THEN** 代理人字段为可选，员工可不选择代理人

### Requirement: 代理人通知
系统 SHALL 在请假申请核准后通知被指定的代理人。

#### Scenario: 请假核准后通知代理人
- **WHEN** 某请假申请被核准且有指定代理人
- **THEN** 系统通过 Email（若启用）和系统内通知该代理人：「XX 于 X/X ~ X/X 请假，您被指定为职务代理人」

### Requirement: 代理人确认接受（可配置）
当 `proxy_needs_confirm` 为 true 时，系统 SHALL 要求代理人确认接受代理。

#### Scenario: 代理人需确认
- **WHEN** `proxy_needs_confirm` 为 true 且请假核准
- **THEN** 系统通知代理人并等待确认，代理人可接受或拒绝

#### Scenario: 代理人拒绝代理
- **WHEN** 代理人拒绝接受代理
- **THEN** 系统通知请假人「代理人 XX 拒绝代理，请重新指定」

#### Scenario: 代理人确认关闭
- **WHEN** `proxy_needs_confirm` 为 false
- **THEN** 指定即生效，不需要代理人确认

### Requirement: 代理人审批权限（可配置）
当 `proxy_can_approve` 为 true 时，系统 SHALL 将主管在请假期间的审批权限转移给其指定的代理人。

#### Scenario: 主管请假期间代理审批
- **WHEN** manager 请假且 `proxy_can_approve` 为 true，其下属提交假单
- **THEN** 该假单路由至 manager 指定的代理人进行审批

#### Scenario: 代理审批权限关闭
- **WHEN** `proxy_can_approve` 为 false 且 manager 请假
- **THEN** 假单仍路由至该 manager，manager 可在假期间通过系统审批
