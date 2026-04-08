import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Attendance, ApiResponse } from '../../types';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 实时时钟
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取今日打卡记录
  useEffect(() => {
    fetchToday();
  }, []);

  const fetchToday = async () => {
    try {
      const { data } = await api.get<ApiResponse<Attendance | null>>('/attendance/today');
      setTodayRecord(data.data);
    } catch {
      console.error('获取今日打卡记录失败');
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post<ApiResponse<Attendance>>('/attendance/clock-in');
      setTodayRecord(data.data);
      setMessage({ type: 'success', text: data.message });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '打卡失败';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post<ApiResponse<Attendance>>('/attendance/clock-out');
      setTodayRecord(data.data);
      setMessage({ type: 'success', text: data.message });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '打卡失败';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    normal: { label: '正常', color: '#10b981' },
    late: { label: '迟到', color: '#f59e0b' },
    early: { label: '早退', color: '#f59e0b' },
    late_early: { label: '迟到且早退', color: '#ef4444' },
  };

  return (
    <div className="dashboard-page">
      <div className="clock-section">
        <div className="clock-display">
          <span className="clock-time">{formatTime(currentTime)}</span>
          <span className="clock-date">{formatDate(currentTime)}</span>
        </div>

        <div className="greeting">
          <h2>你好，{user?.name} 👋</h2>
        </div>

        {message && (
          <div className={`clock-message ${message.type}`}>{message.text}</div>
        )}

        <div className="clock-actions">
          <button
            className="btn-clock btn-clock-in"
            onClick={handleClockIn}
            disabled={loading || !!todayRecord?.clockIn}
          >
            {todayRecord?.clockIn ? `✅ 已上班 ${new Date(todayRecord.clockIn).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '☀️ 上班打卡'}
          </button>

          <button
            className="btn-clock btn-clock-out"
            onClick={handleClockOut}
            disabled={loading || !todayRecord?.clockIn || !!todayRecord?.clockOut}
          >
            {todayRecord?.clockOut ? `✅ 已下班 ${new Date(todayRecord.clockOut).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '🌙 下班打卡'}
          </button>
        </div>

        {todayRecord && (
          <div className="today-status">
            <span>今日状态：</span>
            <span className="status-badge" style={{ color: statusMap[todayRecord.status]?.color ?? '#9ca3af' }}>
              {statusMap[todayRecord.status]?.label ?? todayRecord.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
