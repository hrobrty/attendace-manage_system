const nodemailer = require('nodemailer');

/**
 * Email 发送服务
 * 开发环境自动创建 Ethereal 测试账号，生产环境使用 SMTP 配置
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this._verifyOnce = false;
  }

  /**
   * HTML 转义 - 防止 XSS 注入
   * @param {string} str 
   * @returns {string}
   */
  _escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  async init() {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT, 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      // ✅ 完整校验生产环境必需配置
      const isConfigured = host && Number.isFinite(port) && port > 0 && user && pass !== undefined;

      if (!isConfigured) {
        console.log('[EmailService] 未配置完整 SMTP，使用 Ethereal 测试邮件服务');
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
        console.log(`[EmailService] 预览链接示例: ${nodemailer.getTestMessageUrl({ messageId: 'demo' })}`);
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          connectionTimeout: 10000,
          socketTimeout: 10000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        });
        console.log('[EmailService] SMTP 配置加载成功（连接池已启用，延迟验证）');
      }

      this.initialized = true;
    } catch (err) {
      console.error('[EmailService] 初始化失败:', err.message, err.code ? `(${err.code})` : '');
      this.initialized = false;
      throw new Error(`EmailService 初始化失败: ${err.message}`);
    }
  }

  /**
   * 发送邮件
   * @param {object} options
   * @param {string} options.to 收件人
   * @param {string} options.subject 主题
   * @param {string} options.html HTML 内容
   * @param {string} [options.text] 纯文本内容（可选，用于兼容纯文本客户端）
   * @returns {Promise<object>} 发送结果
   */
  async send({ to, subject, html, text }) {
    try {
      // ✅ 参数校验
      if (!to || !subject) {
        throw new Error('to 和 subject 为必填字段');
      }
      if (!this.initialized) {
        await this.init();
      }

      // 延迟验证：仅在首次发送时验证 SMTP 连接
      if (!this._verifyOnce) {
        try {
          await this.transporter.verify();
          this._verifyOnce = true;
          console.log('[EmailService] SMTP 连接验证成功');
        } catch (verifyErr) {
          console.error('[EmailService] SMTP 连接验证失败:', verifyErr.message, verifyErr.code ? `(${verifyErr.code})` : '');
          // 验证失败不阻断发送，继续尝试
        }
      }

      const from = process.env.SMTP_FROM || 'noreply@attendance.local';

      const mailOptions = { from, to, subject, html };
      if (text) mailOptions.text = text;

      const info = await this.transporter.sendMail(mailOptions);

      // 开发环境输出预览链接
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] 邮件预览: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (err) {
      // ✅ 开发环境输出完整堆栈便于调试
      if (process.env.NODE_ENV !== 'production') {
        console.error('[EmailService] 发送失败:', err);
      } else {
        console.error('[EmailService] 发送失败:', err.message, err.code ? `(${err.code})` : '');
      }
      return { success: false, error: err.message, code: err.code };
    }
  }

  /**
   * 发送新用户欢迎邮件
   * ⚠️ 安全建议：生产环境建议改为发送「密码重置链接」而非明文密码
   */
  async sendWelcome(email, name, password) {
    // ✅ 转义用户输入，防止 HTML 注入
    const safeName = this._escapeHtml(name);
    const safeEmail = this._escapeHtml(email);
    const safePassword = this._escapeHtml(password);

    return this.send({
      to: email,
      subject: '【出勤管理系统】欢迎加入 - 您的登入信息',
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">欢迎加入出勤管理系统</h2>
          <p>您好，${safeName}：</p>
          <p>您的账号已创建成功，以下是您的登入信息：</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1a73e8;">
            <p style="margin: 8px 0;"><strong>登入邮箱：</strong>${safeEmail}</p>
            <p style="margin: 8px 0;"><strong>临时密码：</strong><code style="background: #e8e8e8; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${safePassword}</code></p>
          </div>
          <p style="color: #d93025; background: #fce8e6; padding: 10px; border-radius: 4px;">⚠️ 首次登入后请立即修改密码</p>
          <p>如有任何问题，请联系系统管理员。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">此邮件由系统自动发送，请勿直接回复。</p>
        </div>
      `,
      // ✅ 提供纯文本版本，兼容不支持 HTML 的客户端
      text: `欢迎加入出勤管理系统

您好，${name}：

您的账号已创建成功，以下是您的登入信息：
登入邮箱：${email}
临时密码：${password}

⚠️ 首次登入后请立即修改密码

如有任何问题，请联系系统管理员。
      `
    });
  }

  /**
   * 发送假单提交通知给审批人
   */
  async sendLeaveSubmitNotice(approverEmail, approverName, applicantName, leaveType, startDate, endDate) {
    const safeApproverName = this._escapeHtml(approverName);
    const safeApplicantName = this._escapeHtml(applicantName);
    const safeLeaveType = this._escapeHtml(leaveType);
    const safeStartDate = this._escapeHtml(startDate);
    const safeEndDate = this._escapeHtml(endDate);

    return this.send({
      to: approverEmail,
      subject: `【出勤管理系统】${applicantName} 提交了请假申请`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">请假审批通知</h2>
          <p>${safeApproverName}，您好：</p>
          <p><strong>${safeApplicantName}</strong> 提交了一份请假申请，等待您的审批：</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 8px 0;"><strong>假别：</strong>${safeLeaveType}</p>
            <p style="margin: 8px 0;"><strong>日期：</strong>${safeStartDate} ~ ${safeEndDate}</p>
          </div>
          <p>请登入系统进行审批。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">此邮件由系统自动发送，请勿直接回复。</p>
        </div>
      `
    });
  }

  /**
   * 发送审批结果通知
   */
  async sendApprovalResult(email, name, type, result, reason = '') {
    const isApproved = result === 'approved';
    const color = isApproved ? '#0d904f' : '#d93025';
    const statusText = isApproved ? '已核准' : '已驳回';

    const safeName = this._escapeHtml(name);
    const safeType = this._escapeHtml(type);
    const safeReason = this._escapeHtml(reason);

    return this.send({
      to: email,
      subject: `【出勤管理系统】您的${type}申请${statusText}`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 10px;">申请${statusText}</h2>
          <p>${safeName}，您好：</p>
          <p>您的<strong>${safeType}</strong>申请已${statusText}。</p>
          ${safeReason ? `<p style="background: #fff3e0; padding: 10px; border-radius: 4px; border-left: 4px solid #ff9800;"><strong>原因：</strong>${safeReason}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">此邮件由系统自动发送，请勿直接回复。</p>
        </div>
      `
    });
  }

  /**
   * 发送代理人通知
   */
  async sendProxyNotice(proxyEmail, proxyName, applicantName, startDate, endDate) {
    const safeProxyName = this._escapeHtml(proxyName);
    const safeApplicantName = this._escapeHtml(applicantName);
    const safeStartDate = this._escapeHtml(startDate);
    const safeEndDate = this._escapeHtml(endDate);

    return this.send({
      to: proxyEmail,
      subject: `【出勤管理系统】您被指定为 ${applicantName} 的职务代理人`,
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">职务代理通知</h2>
          <p>${safeProxyName}，您好：</p>
          <p><strong>${safeApplicantName}</strong> 于 ${safeStartDate} ~ ${safeEndDate} 请假期间，您被指定为职务代理人。</p>
          <p>请留意相关工作事项。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">此邮件由系统自动发送，请勿直接回复。</p>
        </div>
      `
    });
  }

  /**
   * 关闭连接（应用退出时调用）
   */
  async close() {
    if (this.transporter && typeof this.transporter.close === 'function') {
      await this.transporter.close();
      console.log('[EmailService] 连接已关闭');
    }
    this.initialized = false;
  }
}

const emailService = new EmailService();
module.exports = emailService;