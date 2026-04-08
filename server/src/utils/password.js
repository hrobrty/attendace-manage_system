const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * 密码 bcrypt 加密
 * @param {string} plainPassword 明文密码
 * @returns {Promise<string>} 加密后的密码
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * 密码比对
 * @param {string} plainPassword 明文密码
 * @param {string} hashedPassword 已加密的密码
 * @returns {Promise<boolean>}
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * 生成随机密码（新用户首次登入用）
 * @param {number} [length=12] 密码长度
 * @returns {string}
 */
const generateRandomPassword = (length = 12) => {
  // NOTE: 确保包含大小写字母、数字、特殊符号
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
};

module.exports = { hashPassword, comparePassword, generateRandomPassword };
