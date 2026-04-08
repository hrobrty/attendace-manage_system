import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';
import type { User, PaginatedResponse } from '../../types';
import './UserManagePage.css';

export default function UserManagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 新增/编辑表单
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', role: 'employee' as 'admin' | 'manager' | 'employee', department: '', approverId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<User[]>>('/users', {
        params: { page, limit: 20, search: search || undefined },
      });
      setUsers(data.data);
      setTotal(data.pagination.total);
    } catch {
      console.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ name: '', email: '', role: 'employee', department: '', approverId: '' });
    setShowForm(true);
    setError('');
  };

  const openEditForm = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      approverId: user.approverId ? String(user.approverId) : '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        department: form.department || null,
        approverId: form.approverId ? Number(form.approverId) : null,
        ...(editingId ? {} : { email: form.email }),
      };

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', { ...payload, email: form.email });
      }

      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`确定要${newStatus === 'active' ? '启用' : '停用'}用户 ${user.name}？`)) return;
    try {
      await api.put(`/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch {
      alert('操作失败');
    }
  };

  const roleMap: Record<string, string> = {
    admin: '管理员',
    manager: '主管',
    employee: '员工',
  };

  return (
    <div className="user-manage-page">
      <div className="page-header">
        <h2>用户管理</h2>
        <button className="btn-primary" onClick={openCreateForm}>➕ 新增用户</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索姓名或 Email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <span className="total-count">共 {total} 位用户</span>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? '编辑用户' : '新增用户'}</h3>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-row">
              <div className="form-group">
                <label>姓名</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              {!editingId && (
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>角色</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})}>
                  <option value="employee">员工</option>
                  <option value="manager">主管</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="form-group">
                <label>部门</label>
                <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="选填" />
              </div>
              <div className="form-group">
                <label>直属主管 ID</label>
                <input type="number" value={form.approverId} onChange={e => setForm({...form, approverId: e.target.value})} placeholder="选填" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '提交中...' : (editingId ? '保存修改' : '创建用户')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>Email</th>
              <th>角色</th>
              <th>部门</th>
              <th>直属主管</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="loading-state">加载中...</td></tr> :
             users.length > 0 ? users.map(u => (
              <tr key={u.id} className={u.status === 'inactive' ? 'row-inactive' : ''}>
                <td>{u.id}</td>
                <td className="cell-name">{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`role-badge role-${u.role}`}>{roleMap[u.role]}</span></td>
                <td>{u.department || '-'}</td>
                <td>{u.approver?.name || '-'}</td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'status-normal' : 'status-default'}`}>
                    {u.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td className="action-cell">
                  <button className="btn-text" onClick={() => openEditForm(u)}>编辑</button>
                  <button className={`btn-text ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u)}>
                    {u.status === 'active' ? '停用' : '启用'}
                  </button>
                </td>
              </tr>
            )) : <tr><td colSpan={8} className="empty-state">无用户数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
