import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import './SettingsPage.css';

interface SettingItem {
  key: string;
  value: string;
  description: string | null;
  category: string;
}

const categoryLabels: Record<string, string> = {
  attendance: '🕐 打卡设置',
  leave: '🏖️ 请假设置',
  overtime: '⏱️ 加班设置',
  approval: '✅ 签核设置',
  proxy: '🤝 代理人设置',
  notification: '🔔 通知设置',
  organization: '🏢 组织设置',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<SettingItem[]>>('/settings');
      setSettings(data.data);
    } catch {
      console.error('获取设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanged((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const updates = Object.entries(changed).map(([key, value]) => ({ key, value }));
    if (updates.length === 0) return;

    setSaving(true);
    setMessage(null);
    try {
      await api.put('/settings', { updates });
      setMessage({ type: 'success', text: `已保存 ${updates.length} 项设置` });
      setChanged({});
      fetchSettings();
    } catch {
      setMessage({ type: 'error', text: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const grouped = settings.reduce<Record<string, SettingItem[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const isBool = (value: string) => value === 'true' || value === 'false';

  const getCurrentValue = (key: string, originalValue: string) => {
    return changed[key] !== undefined ? changed[key] : originalValue;
  };

  const changedCount = Object.keys(changed).length;

  const OPTIONS_MAP: Record<string, { label: string; value: string }[]> = {
    'min_leave_unit': [
      { label: '半天', value: 'half_day' },
      { label: '小时', value: 'hour' }
    ],
    'approval_levels': [
      { label: '1层签核', value: '1' },
      { label: '2层签核', value: '2' },
      { label: '3层签核', value: '3' }
    ]
  };

  const renderControl = (item: SettingItem) => {
    const currentVal = getCurrentValue(item.key, item.value);

    // 标准滑动开关 (Switch)
    if (isBool(item.value)) {
      return (
        <label className="switch-container">
          <input 
            type="checkbox" 
            checked={currentVal === 'true'}
            onChange={(e) => handleChange(item.key, e.target.checked ? 'true' : 'false')}
          />
          <span className="switch-slider"></span>
        </label>
      );
    }

    // 下拉选择
    if (OPTIONS_MAP[item.key]) {
      return (
        <div className="select-wrapper">
          <select 
            className="setting-select"
            value={currentVal} 
            onChange={(e) => handleChange(item.key, e.target.value)}
          >
            {OPTIONS_MAP[item.key].map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    // 数字/时间或其他输入
    const isTime = item.key.includes('time');
    const inputType = isTime ? 'time' : (
      item.key.includes('minutes') || item.key.includes('cap') || item.key.includes('ratio') || item.key.includes('levels') 
      ? 'number' : 'text'
    );
    
    return (
      <div className={`input-wrapper ${isTime ? 'time-wrapper' : ''}`}>
        <input 
          type={inputType}
          className="setting-input"
          step={item.key.includes('ratio') ? '0.1' : '1'}
          value={currentVal} 
          onChange={(e) => handleChange(item.key, e.target.value)}
          onClick={(e) => isTime && e.currentTarget.showPicker()}
        />
        {isTime && <span className="input-icon">🕒</span>}
      </div>
    );
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>系统设置</h2>
        {changedCount > 0 && (
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : `💾 保存 (${changedCount} 项变更)`}
          </button>
        )}
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>{message.text}</div>
      )}

      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : (
        <div className="settings-groups">
          {Object.entries(grouped).map(([category, items]) => (
            <div className="settings-group" key={category}>
              <h3>{categoryLabels[category] || category}</h3>
              <div className="settings-items">
                {items.map((item) => {
                  const isModified = changed[item.key] !== undefined;
                  return (
                    <div className={`setting-item ${isModified ? 'modified' : ''}`} key={item.key}>
                      <div className="setting-info">
                        <span className="setting-desc">{item.description || item.key}</span>
                      </div>
                      <div className="setting-control">
                        {renderControl(item)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
