const { SystemSetting } = require('../models');

/**
 * 系统设置服务
 * 启动时加载所有配置到内存缓存，变更时刷新
 */
class SettingsService {
  constructor() {
    this.cache = new Map();
    this.loaded = false;
  }

  /**
   * 从数据库加载所有设置到缓存
   */
  async loadAll() {
    const settings = await SystemSetting.findAll();
    this.cache.clear();
    settings.forEach((s) => {
      this.cache.set(s.key, s.value);
    });
    this.loaded = true;
    console.log(`[SettingsService] 已加载 ${this.cache.size} 项系统设置`);
  }

  /**
   * 获取单个设置值
   * @param {string} key 配置键
   * @param {string} [defaultValue] 默认值
   * @returns {string}
   */
  get(key, defaultValue = '') {
    return this.cache.get(key) ?? defaultValue;
  }

  /**
   * 获取布尔类型设置
   * @param {string} key
   * @param {boolean} [defaultValue]
   * @returns {boolean}
   */
  getBool(key, defaultValue = false) {
    const val = this.cache.get(key);
    if (val === undefined) return defaultValue;
    return val === 'true' || val === '1';
  }

  /**
   * 获取数字类型设置
   * @param {string} key
   * @param {number} [defaultValue]
   * @returns {number}
   */
  getNumber(key, defaultValue = 0) {
    const val = this.cache.get(key);
    if (val === undefined) return defaultValue;
    const num = parseFloat(val);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 获取所有设置（含 description、category）
   * @returns {Promise<Array>}
   */
  async getAll() {
    return SystemSetting.findAll({ order: [['category', 'ASC'], ['key', 'ASC']] });
  }

  /**
   * 获取公开设置（非敏感，给前端使用）
   * @returns {object} key-value 对象
   */
  getPublicSettings() {
    const result = {};
    this.cache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 批量更新设置
   * @param {Array<{key: string, value: string}>} updates
   */
  async bulkUpdate(updates) {
    for (const { key, value } of updates) {
      await SystemSetting.upsert({ key, value });
      this.cache.set(key, value);
    }
    console.log(`[SettingsService] 已更新 ${updates.length} 项设置`);
  }
}

// NOTE: 单例模式，全应用共享一个实例
const settingsService = new SettingsService();
module.exports = settingsService;
