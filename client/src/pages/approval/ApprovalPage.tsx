import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { ApprovalItem, ApiResponse } from '../../types';
import './ApprovalPage.css';

export default function ApprovalPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [commentFor, setCommentFor] = useState<number | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<ApprovalItem[]>>('/approvals/pending');
      setItems(data.data);
    } catch {
      console.error('获取待审列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (flowId: number) => {
    setActing(flowId);
    try {
      await api.put(`/approvals/${flowId}/approve`, { comment });
      setComment('');
      setCommentFor(null);
      fetchPending();
    } catch (err: any) {
      alert(err.response?.data?.message || '审批失败');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (flowId: number) => {
    if (!comment.trim()) {
      alert('驳回时请填写原因');
      setCommentFor(flowId);
      return;
    }
    setActing(flowId);
    try {
      await api.put(`/approvals/${flowId}/reject`, { comment });
      setComment('');
      setCommentFor(null);
      fetchPending();
    } catch (err: any) {
      alert(err.response?.data?.message || '驳回失败');
    } finally {
      setActing(null);
    }
  };

  const typeLabels: Record<string, string> = {
    leave: '请假',
    overtime: '加班',
    clock_amendment: '补打卡',
  };

  const renderRequestDetail = (item: ApprovalItem) => {
    const req = item.request as any;
    if (item.requestType === 'leave') {
      return (
        <div className="request-detail">
          <span className="detail-tag">假别: {req?.LeaveType?.name || '-'}</span>
          <span>{req?.startDate} ~ {req?.endDate}</span>
          <span>{req?.totalDays} 天</span>
        </div>
      );
    }
    if (item.requestType === 'overtime') {
      return (
        <div className="request-detail">
          <span>{req?.date}</span>
          <span>{req?.startTime} - {req?.endTime}</span>
          <span>{req?.hours} 小时</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="approval-page">
      <div className="page-header">
        <h2>待审批</h2>
        <span className="pending-count">{items.length} 件</span>
      </div>

      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : items.length > 0 ? (
        <div className="approval-list">
          {items.map((item) => (
            <div className="approval-card" key={item.stepId}>
              <div className="approval-card-header">
                <div className="applicant-info">
                  <span className="type-badge">{typeLabels[item.requestType]}</span>
                  <span className="applicant-name">{(item.request as any)?.applicant?.name || (item.request as any)?.User?.name || '-'}</span>
                  <span className="dept">{(item.request as any)?.applicant?.department || (item.request as any)?.User?.department || ''}</span>
                </div>
                <div className="flow-level">
                  第 {item.currentLevel}/{item.totalLevels} 层
                </div>
              </div>

              {renderRequestDetail(item)}

              {commentFor === item.flowId && (
                <div className="comment-input">
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="请输入审批意见..."
                    autoFocus
                  />
                </div>
              )}

              <div className="approval-actions">
                <button
                  className="btn-comment"
                  onClick={() => setCommentFor(commentFor === item.flowId ? null : item.flowId)}
                >
                  💬 意见
                </button>
                <div className="action-btns">
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(item.flowId)}
                    disabled={acting === item.flowId}
                  >
                    驳回
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(item.flowId)}
                    disabled={acting === item.flowId}
                  >
                    通过
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-approval">
          <span className="empty-icon">✅</span>
          <p>没有待审批的申请</p>
        </div>
      )}
    </div>
  );
}
