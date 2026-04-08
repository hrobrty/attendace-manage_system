const { User, SystemSetting, LeaveType } = require('./models');
const { hashPassword } = require('./utils/password');

/**
 * 初始化种子数据
 * 在首次启动时创建默认 admin、内建假别和系统设置
 */
const seedDatabase = async () => {
  // ==================== 默认管理员 ====================
  const adminExists = await User.findOne({ where: { email: 'admin@attendance.local' } });
  if (!adminExists) {
    const hashedPw = await hashPassword('admin123');
    await User.create({
      name: '系统管理员',
      email: 'admin@attendance.local',
      password: hashedPw,
      role: 'admin',
      status: 'active',
      mustChangePassword: false, // NOTE: 预设管理员不强制改密码
    });
    console.log('[Seed] 创建默认管理员: admin@attendance.local / admin123');
  }

  // ==================== 内建假别 ====================
  const systemLeaveTypes = [
    { name: '年假', code: 'annual', hasQuota: true, deductPay: false, needAttachment: false, isSystem: true, defaultDays: 7 },
    { name: '补休', code: 'comp', hasQuota: true, deductPay: false, needAttachment: false, isSystem: true, defaultDays: 0 },
    { name: '事假', code: 'personal', hasQuota: false, deductPay: false, needAttachment: false, isSystem: true, defaultDays: null },
  ];

  for (const lt of systemLeaveTypes) {
    await LeaveType.findOrCreate({ where: { code: lt.code }, defaults: lt });
  }
  console.log('[Seed] 内建假别已初始化');

  // ==================== 系统设置默认值 ====================
  const defaultSettings = [
    // 打卡
    { key: 'work_start_time', value: '09:00', description: '上班时间', category: 'attendance' },
    { key: 'work_end_time', value: '18:00', description: '下班时间', category: 'attendance' },
    { key: 'late_grace_minutes', value: '0', description: '迟到容许分钟数', category: 'attendance' },
    { key: 'flexible_hours_enabled', value: 'false', description: '弹性工时开关', category: 'attendance' },
    { key: 'flexible_start', value: '08:00', description: '弹性上班开始时间', category: 'attendance' },
    { key: 'flexible_end', value: '10:00', description: '弹性上班结束时间', category: 'attendance' },
    { key: 'clock_amendment_enabled', value: 'true', description: '补打卡功能开关', category: 'attendance' },
    { key: 'amendment_monthly_quota', value: '3', description: '每月自助补打额度 (次数)', category: 'attendance' },
    { key: 'amendment_deadline_days', value: '3', description: '补打申请有效期 (天数)', category: 'attendance' },
    { key: 'amendment_auto_approve_if_quota', value: 'true', description: '额度内是否自动通过', category: 'attendance' },
    // 请假
    { key: 'min_leave_unit', value: 'half_day', description: '最小请假单位 (half_day / hour)', category: 'leave' },
    { key: 'sick_leave_proof', value: 'false', description: '病假需提交证明', category: 'leave' },
    // 加班
    { key: 'overtime_to_comp', value: 'true', description: '加班转补休', category: 'overtime' },
    { key: 'comp_ratio', value: '1.0', description: '加班补休比例 (1:N)', category: 'overtime' },
    { key: 'overtime_pre_approval', value: 'true', description: '加班需事前申请', category: 'overtime' },
    { key: 'overtime_monthly_cap', value: '0', description: '月加班上限小时数 (0=无限)', category: 'overtime' },
    // 签核
    { key: 'approval_levels', value: '1', description: '签核层级数', category: 'approval' },
    // 代理人
    { key: 'proxy_required', value: 'true', description: '请假时代理人是否必填', category: 'proxy' },
    { key: 'proxy_needs_confirm', value: 'false', description: '代理人是否需要确认接受', category: 'proxy' },
    { key: 'proxy_can_approve', value: 'false', description: '代理人是否有审批权限', category: 'proxy' },
    // 通知
    { key: 'email_on_leave_submit', value: 'true', description: '假单提交时通知审批人', category: 'notification' },
    { key: 'email_on_approval', value: 'true', description: '审批结果通知申请人', category: 'notification' },
    { key: 'email_on_clock_anomaly', value: 'false', description: '打卡异常通知', category: 'notification' },
    // 组织
    { key: 'dept_management_enabled', value: 'false', description: '部门管理功能开关', category: 'organization' },
  ];

  for (const setting of defaultSettings) {
    await SystemSetting.findOrCreate({ where: { key: setting.key }, defaults: setting });
  }
  console.log('[Seed] 系统设置默认值已初始化');
};

module.exports = seedDatabase;
