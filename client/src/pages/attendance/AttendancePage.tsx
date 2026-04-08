import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Attendance, PaginatedResponse } from '../../types';
import './AttendancePage.css';

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchRecords();
  }, [page, year, month]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<Attendance[]>>('/attendance', {
        params: { page, limit: 31, year, month },
      });
      setRecords(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch {
      console.error('获取打卡记录失败');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    normal: { label: '正常', className: 'status-normal' },
    late: { label: '迟到', className: 'status-warning' },
    early: { label: '早退', className: 'status-warning' },
    late_early: { label: '迟到且早退', className: 'status-danger' },
    missing_clock_in: { label: '缺上班卡', className: 'status-danger' },
    missing_clock_out: { label: '缺下班卡', className: 'status-danger' },
    absent: { label: '旷职', className: 'status-danger' },
    leave: { label: '请假', className: 'status-info' },
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h2>打卡记录</h2>
        <div className="filter-group">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} 月</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>上班时间</th>
                <th>下班时间</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{formatTime(record.clockIn)}</td>
                    <td>{formatTime(record.clockOut)}</td>
                    <td>
                      <span className={`badge ${statusMap[record.status]?.className || 'status-default'}`}>
                        {statusMap[record.status]?.label || record.status}
                      </span>
                    </td>
                    <td className="note-cell">{record.note || '-'}</td>
                    <td>
                      {record.status !== 'normal' && record.status !== 'leave' && (
                        <Link to={`/attendance/amendments?date=${record.date}`} className="btn-table-amend">
                          补勤
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">暂无打卡记录</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
        <span>{page} / {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
      </div>
    </div>
  );
}
