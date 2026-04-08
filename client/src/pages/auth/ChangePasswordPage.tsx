import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 8) {
      setError('新密码至少 8 个字符');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="cp-card">
        <h2>🔐 修改密码</h2>
        {user?.mustChangePassword && (
          <div className="cp-notice">首次登入，请先修改密码后继续使用系统</div>
        )}

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label>当前密码</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>新密码</label>
            <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少 8 个字符" />
          </div>
          <div className="form-group">
            <label>确认新密码</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? '修改中...' : '修改密码'}
          </button>
        </form>
      </div>
    </div>
  );
}
