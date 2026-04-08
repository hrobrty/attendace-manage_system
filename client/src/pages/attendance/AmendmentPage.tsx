import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';
import dayjs from 'dayjs';
import './AmendmentPage.css';

interface Amendment {
  id: number;
  date: string;
  clockType: 'clock_in' | 'clock_out';
  amendedTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AmendmentPage() {
  const navigate = useNavigate();
  const { get } = useSettings();
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 表单状态
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    clockType: 'clock_in' as 'clock_in' | 'clock_out',
    time: dayjs().format('HH:mm'),
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 这里的 quota 是为了前端展示，后续增加 API 获取精准数字
  const monthlyQuota = parseInt(get('amendment_monthly_quota') || '3', 10);
  const currentMonthUsed = amendments.filter(a => 
    a.status === 'approved' && 
    dayjs(a.date).isSame(dayjs(), 'month')
  ).length;

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchAmendments();
    
    // 如果 URL 中有 date 参数，预填到表单
    const dateParam = searchParams.get('date');
    if (dateParam && dayjs(dateParam).isValid()) {
      setForm(prev => ({ ...prev, date: dateParam }));
    }
  }, [searchParams]);

  const fetchAmendments = async () => {
    try {
      const { data } = await api.get('/attendance/amendments/my');
      setAmendments(data.data);
    } catch (err) {
      console.error('获取补打卡记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // 构造补签时间
      const amendedTime = dayjs(`${form.date} ${form.time}`).toISOString();
      const { data } = await api.post('/attendance/amendments', {
        ...form,
        amendedTime
      });

      setSuccess(data.message || '申请提交成功');
      setForm({ ...form, reason: '' });
      fetchAmendments();
    } catch (err: any) {
      setError(err.response?.data?.message || '提取失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="amendment-page">
      <div className="page-header">
        <h2>补打卡申请</h2>
        <button className="btn-secondary" onClick={() => navigate('/')}>返回仪表盘</button>
      </div>

      <div className="content-grid">
        {/* 左侧：申请表单 */}
        <div className="card form-card">
          <div className="quota-hint">
            <span className="icon">ℹ️</span>
            您本月还有 <strong>{Math.max(0, monthlyQuota - currentMonthUsed)}</strong> 次自助补打机会
          </div>

          <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group">
              <label>漏打卡日期</label>
              <input 
                type="date" 
                required 
                max={dayjs().format('YYYY-MM-DD')}
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})} 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>打卡类型</label>
                <div className="radio-group">
                  <label className={form.clockType === 'clock_in' ? 'active' : ''}>
                    <input 
                      type="radio" 
                      name="clockType" 
                      value="clock_in" 
                      checked={form.clockType === 'clock_in'} 
                      onChange={e => setForm({...form, clockType: e.target.value as any})} 
                    />
                    上班打卡
                  </label>
                  <label className={form.clockType === 'clock_out' ? 'active' : ''}>
                    <input 
                      type="radio" 
                      name="clockType" 
                      value="clock_out" 
                      checked={form.clockType === 'clock_out'} 
                      onChange={e => setForm({...form, clockType: e.target.value as any})} 
                    />
                    下班打卡
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>补签时间</label>
                <input 
                  type="time" 
                  required 
                  value={form.time} 
                  onChange={e => setForm({...form, time: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>补办理由</label>
              <textarea 
                placeholder="请详细说明漏打卡原因..." 
                required
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
              />
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </form>
        </div>

        {/* 右侧：记录列表 */}
        <div className="card history-card">
          <h3>申请记录</h3>
          <div className="history-list">
            {loading ? <div className="loading">加载中...</div> :
             amendments.length === 0 ? <div className="empty">暂无补办记录</div> :
             amendments.map(a => (
               <div key={a.id} className={`history-item status-${a.status}`}>
                 <div className="item-main">
                   <div className="item-date">{a.date}</div>
                   <div className="item-type">{a.clockType === 'clock_in' ? '上班' : '下班'} {dayjs(a.amendedTime).format('HH:mm')}</div>
                 </div>
                 <div className="item-side">
                   <span className="status-badge">{a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : '审批中'}</span>
                   <div className="item-reason" title={a.reason}>{a.reason}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
