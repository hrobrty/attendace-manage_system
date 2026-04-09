/**
 * 邮件队列服务
 *
 * 使用内存队列 + EventEmitter 实现真正的异步邮件发送。
 * 调用方将任务 enqueue() 后立即返回，后台 worker 负责
 * 实际发送，失败时自动重试（最多 MAX_RETRIES 次）。
 */

const EventEmitter = require('events');
const emailService = require('./email-service');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;   // 首次重试等待 5 秒
const RETRY_BACKOFF = 2;       // 指数退避倍数
const PROCESS_INTERVAL_MS = 100; // 轮询间隔（毫秒）

class EmailQueue extends EventEmitter {
  constructor() {
    super();
    this._queue = [];
    this._processing = false;
    this._timer = null;

    // 监听入队事件，触发处理
    this.on('enqueued', () => this._scheduleProcess());
  }

  /**
   * 将邮件任务加入队列
   * @param {'welcome'} type       邮件类型（目前支持 'welcome'）
   * @param {object}   payload     邮件参数
   * @param {string}   payload.email
   * @param {string}   payload.name
   * @param {string}   payload.password  （仅 welcome 类型）
   */
  enqueue(type, payload) {
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      attempts: 0,
      nextRunAt: Date.now(),
    };

    this._queue.push(job);
    console.log(`[EmailQueue] 任务已入队 id=${job.id} type=${type} to=${payload.email}`);
    this.emit('enqueued', job);
  }

  /**
   * 启动后台轮询处理器（应用启动时调用）
   */
  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this._processNext(), PROCESS_INTERVAL_MS);
    // 允许进程在没有其他活跃句柄时正常退出
    if (this._timer.unref) this._timer.unref();
    console.log('[EmailQueue] 后台处理器已启动');
  }

  /**
   * 停止后台轮询处理器（应用退出时调用）
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      console.log('[EmailQueue] 后台处理器已停止');
    }
  }

  /** 当前队列长度（含待重试任务） */
  get size() {
    return this._queue.length;
  }

  // ─── 内部方法 ────────────────────────────────────────────────

  _scheduleProcess() {
    // 如果轮询器尚未启动，则自动启动
    if (!this._timer) this.start();
  }

  async _processNext() {
    if (this._processing || this._queue.length === 0) return;

    // 找到第一个到达执行时间的任务
    const now = Date.now();
    const idx = this._queue.findIndex((job) => job.nextRunAt <= now);
    if (idx === -1) return;

    this._processing = true;
    const job = this._queue.splice(idx, 1)[0];

    try {
      await this._dispatch(job);
      console.log(`[EmailQueue] 任务成功 id=${job.id} type=${job.type} to=${job.payload.email} attempts=${job.attempts + 1}`);
    } catch (err) {
      job.attempts += 1;
      const attemptsLeft = MAX_RETRIES - job.attempts;

      if (attemptsLeft > 0) {
        const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF, job.attempts - 1);
        job.nextRunAt = Date.now() + delay;
        this._queue.push(job);
        console.warn(
          `[EmailQueue] 任务失败，将在 ${delay / 1000}s 后重试 ` +
          `id=${job.id} attempts=${job.attempts}/${MAX_RETRIES} ` +
          `error=${err.message}`
        );
      } else {
        console.error(
          `[EmailQueue] 任务彻底失败，已放弃 ` +
          `id=${job.id} type=${job.type} to=${job.payload.email} ` +
          `error=${err.message}`
        );
        this.emit('failed', job, err);
      }
    } finally {
      this._processing = false;
    }
  }

  /**
   * 根据任务类型调用对应的 emailService 方法
   * @param {object} job
   */
  async _dispatch(job) {
    const { type, payload } = job;

    switch (type) {
      case 'welcome': {
        const result = await emailService.sendWelcome(
          payload.email,
          payload.name,
          payload.password
        );
        // emailService.send() 内部捕获了异常并返回 { success: false }
        // 这里将失败结果转换为可重试的异常
        if (result && result.success === false) {
          throw new Error(result.error || '邮件发送返回失败状态');
        }
        return result;
      }

      default:
        throw new Error(`未知邮件类型: ${type}`);
    }
  }
}

// 单例导出
const emailQueue = new EmailQueue();
module.exports = emailQueue;
