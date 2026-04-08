import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';
import type { OvertimeRequest, PaginatedResponse } from '../../types';
import './OvertimePage.css';

export default function OvertimePage() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [summary, setSummary] = useState({ approvedHours: 0, pendingHours: 0, compHours: 0, month: '' });
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', hours: 1, reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqs, sum] = await Promise.all([
        api.get<PaginatedResponse<OvertimeRequest[]>>('/overtime-requests?limit=10'),
        api.get<any>('/overtime-requests/summary'),
      ]);
      setRequests(reqs.data.data);
      setSummary(sum.data.data);
    } catch {
      console.error('获取加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/overtime-requests', form);
      setShowForm(false);
      setForm({ date: '', startTime: '', endTime: '', hours: 1, reason: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || '申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: '待签核', className: 'status-warning' },
    approved: { label: '已核准', className: 'status-normal' },
    rejected: { label: '已驳回', className: 'status-danger' },
  };

  return (
    <div className="overtime-page">
      <div className="page-header">
        <h2>加班管理</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消申请' : '➕ 申请加班'}
        </button>
      </div>

      {/* 本月统计概览 */}
      <div className="overtime-summary">
        <div className="summary-card">
          <span className="summary-label">{summary.month || '本月'} 已核准加班</span>
          <span className="summary-value">{summary.approvedHours} <span>小时</span></span>
        </div>
        <div className="summary-card">
          <span className="summary-label">待签核加班</span>
          <span className="summary-value warning">{summary.pendingHours} <span>小时</span></span>
        </div>
        <div className="summary-card">
          <span className="summary-label">产生补休额度</span>
          <span className="summary-value success">{summary.compHours} <span>小时</span></span>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>提交加班申请</h3>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-row">
              <div className="form-group">
                <label>加班日期</label>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>时数（小时）</label>
                <input type="number" step="0.5" min="0.5" required value={form.hours} onChange={e => setForm({...form, hours: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>开始时间</label>
                <input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>加班事由</label>
              <textarea rows={3} required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="说明加班原因..." />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时段</th>
              <th>小时数</th>
              <th>补休产生</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="loading-state">加载中...</td></tr> : 
             requests.length > 0 ? requests.map(req => (
              <tr key={req.id}>
                <td>{req.date}</td>
                <td>{req.startTime} - {req.endTime}</td>
                <td>{req.hours}</td>
                <td>{req.status === 'approved' ? `${req.compHours}h` : '-'}</td>
                <td>
                  <span className={`badge ${statusMap[req.status].className}`}>{statusMap[req.status].label}</span>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="empty-state">无加班记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
