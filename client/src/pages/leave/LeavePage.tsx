import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';
import type { LeaveRequest, LeaveType, LeaveBalance, User, PaginatedResponse, ApiResponse } from '../../types';
import './LeavePage.css';

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [proxies, setProxies] = useState<Pick<User, 'id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    typeId: '', startDate: '', endDate: '', totalDays: 1, reason: '', proxyUserId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqsRes, typesRes, balsRes, proxiesRes] = await Promise.all([
        api.get<PaginatedResponse<LeaveRequest[]>>('/leave-requests?limit=10'),
        api.get<ApiResponse<LeaveType[]>>('/settings/leave-types'),
        api.get<ApiResponse<LeaveBalance[]>>('/leave-requests/balances'),
        api.get<ApiResponse<Pick<User, 'id' | 'name' | 'department'>[]>>('/users/available-proxies')
      ]);
      setRequests(reqsRes.data.data);
      setTypes(typesRes.data.data);
      setBalances(balsRes.data.data);
      setProxies(proxiesRes.data.data);
    } catch {
      console.error('获取请假数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/leave-requests', {
        ...form,
        typeId: Number(form.typeId),
        proxyUserId: form.proxyUserId ? Number(form.proxyUserId) : null,
      });
      setShowForm(false);
      setForm({ typeId: '', startDate: '', endDate: '', totalDays: 1, reason: '', proxyUserId: '' });
      fetchData(); // 刷新列表
    } catch (err: any) {
      setError(err.response?.data?.message || '申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id: number) => {
    if (!window.confirm('确定要取消此申请吗？')) return;
    try {
      await api.put(`/leave-requests/${id}/cancel`);
      fetchData();
    } catch {
      alert('取消失败');
    }
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: '待签核', className: 'status-warning' },
    approved: { label: '已核准', className: 'status-normal' },
    rejected: { label: '已驳回', className: 'status-danger' },
    cancelled: { label: '已取消', className: 'status-default' },
  };

  return (
    <div className="leave-page">
      <div className="page-header">
        <h2>请假管理</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '关闭表单' : '➕ 申请请假'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>提交请假申请</h3>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-row">
              <div className="form-group">
                <label>假别</label>
                <select required value={form.typeId} onChange={e => setForm({...form, typeId: e.target.value})}>
                  <option value="">-- 请选择 --</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>代理人（可选）</label>
                <select value={form.proxyUserId} onChange={e => setForm({...form, proxyUserId: e.target.value})}>
                  <option value="">-- 请选择 --</option>
                  {proxies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>开始日期</label>
                <input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>结束日期</label>
                <input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>请假天数</label>
                <input type="number" step="0.5" min="0.5" required value={form.totalDays} onChange={e => setForm({...form, totalDays: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="form-group">
              <label>请假事由</label>
              <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="选填..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 剩余额度 */}
      <div className="balances-section">
        <h3>我的可用额度</h3>
        <div className="balances-grid">
          {balances.length > 0 ? balances.map(b => (
            <div className="balance-card" key={b.id}>
              <h4>{b.LeaveType?.name}</h4>
              <div className="balance-stats">
                <div>总计 <span>{b.totalDays}</span> 天</div>
                <div>已用 <span>{b.usedDays}</span> 天</div>
                <div className="available">此时可用：<span>{(b.totalDays - b.usedDays - b.pendingDays).toFixed(1)}</span> 天</div>
              </div>
            </div>
          )) : (
            <div className="no-balances">暂无限制额度记录</div>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>请假时间</th>
              <th>假别</th>
              <th>天数</th>
              <th>代理人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="loading-state">加载中...</td></tr> : 
             requests.length > 0 ? requests.map(req => (
              <tr key={req.id}>
                <td>{req.startDate} 至 {req.endDate}</td>
                <td>{req.LeaveType?.name}</td>
                <td>{req.totalDays}</td>
                <td>{req.proxyUser?.name || '-'}</td>
                <td>
                  <span className={`badge ${statusMap[req.status].className}`}>{statusMap[req.status].label}</span>
                </td>
                <td>
                  {req.status === 'pending' && (
                    <button className="btn-text btn-danger" onClick={() => cancelRequest(req.id)}>取消</button>
                  )}
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="empty-state">无申请记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
