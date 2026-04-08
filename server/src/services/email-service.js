const nodemailer = require('nodemailer');

/**
 * Email 发送服务
 * 开发环境自动创建 Ethereal 测试账号，生产环境使用 SMTP 配置
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async init() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // NOTE: 开发环境若未配置 SMTP，自动使用 Ethereal 测试服务
    if (!host || !user) {
      console.log('[EmailService] 未配置 SMTP，使用 Ethereal 测试邮件服务');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Ethereal 测试账号: ${testAccount.user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    this.initialized = true;
  }

  /**
   * 发送邮件
   * @param {object} options
   * @param {string} options.to 收件人
   * @param {string} options.subject 主题
   * @param {string} options.html HTML 内容
   * @returns {Promise<object>} 发送结果
   */
  async send({ to, subject, html }) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const from = process.env.SMTP_FROM || 'noreply@attendance.local';
      const info = await this.transporter.sendMail({ from, to, subject, html });

      // NOTE: 开发环境用 Ethereal 时输出预览链接
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] 邮件预览: ${previewUrl}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err) {
      console.error('[EmailService] 发送失败:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 发送新用户欢迎邮件
   */
  async sendWelcome(email, name, password) {
    return this.send({
      to: email,
      subject: '【出勤管理系统】欢迎加入 - 您的登入信息',
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a73e8;">欢迎加入出勤管理系统</h2>
          <p>您好，${name}：</p>
          <p>您的账号已创建成功，以下是您的登入信息：</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>登入邮箱：</strong>${email}</p>
            <p><strong>临时密码：</strong><code style="background: #e8e8e8; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          <p style="color: #d93025;">⚠️ 首次登入后请立即修改密码</p>
          <p>如有任何问题，请联系系统管理员。</p>
        </div>
      `,
    });
  }

  /**
   * 发送假单提交通知给审批人
   */
  async sendLeaveSubmitNotice(approverEmail, approverName, applicantName, leaveType, startDate, endDate) {
    return this.send({
      to: approverEmail,
      subject: `【出勤管理系统】${applicantName} 提交了请假申请`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a73e8;">请假审批通知</h2>
          <p>${approverName}，您好：</p>
          <p><strong>${applicantName}</strong> 提交了一份请假申请，等待您的审批：</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>假别：</strong>${leaveType}</p>
            <p><strong>日期：</strong>${startDate} ~ ${endDate}</p>
          </div>
          <p>请登入系统进行审批。</p>
        </div>
      `,
    });
  }

  /**
   * 发送审批结果通知
   */
  async sendApprovalResult(email, name, type, result, reason = '') {
    const isApproved = result === 'approved';
    const color = isApproved ? '#0d904f' : '#d93025';
    const statusText = isApproved ? '已核准' : '已驳回';

    return this.send({
      to: email,
      subject: `【出勤管理系统】您的${type}申请${statusText}`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${color};">申请${statusText}</h2>
          <p>${name}，您好：</p>
          <p>您的<strong>${type}</strong>申请已${statusText}。</p>
          ${reason ? `<p><strong>原因：</strong>${reason}</p>` : ''}
        </div>
      `,
    });
  }

  /**
   * 发送代理人通知
   */
  async sendProxyNotice(proxyEmail, proxyName, applicantName, startDate, endDate) {
    return this.send({
      to: proxyEmail,
      subject: `【出勤管理系统】您被指定为 ${applicantName} 的职务代理人`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a73e8;">职务代理通知</h2>
          <p>${proxyName}，您好：</p>
          <p><strong>${applicantName}</strong> 于 ${startDate} ~ ${endDate} 请假期间，您被指定为职务代理人。</p>
          <p>请留意相关工作事项。</p>
        </div>
      `,
    });
  }
}

const emailService = new EmailService();
module.exports = emailService;
