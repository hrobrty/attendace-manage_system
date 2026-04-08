import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './MainLayout.css';

/**
 * 主布局：侧边栏导航 + 顶部栏 + 内容区
 */
export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className={`main-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">⏰</h1>
          {!sidebarCollapsed && <span className="sidebar-title">出勤管理</span>}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-item">
            <span className="nav-icon">🏠</span>
            {!sidebarCollapsed && <span>打卡首页</span>}
          </NavLink>
          <NavLink to="/attendance" end className="nav-item">
            <span className="nav-icon">📋</span>
            {!sidebarCollapsed && <span>打卡记录</span>}
          </NavLink>
          <NavLink to="/attendance/amendments" className="nav-item">
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span>补打卡申请</span>}
          </NavLink>
          <NavLink to="/leave" className="nav-item">
            <span className="nav-icon">🏖️</span>
            {!sidebarCollapsed && <span>请假管理</span>}
          </NavLink>
          <NavLink to="/overtime" className="nav-item">
            <span className="nav-icon">⏱️</span>
            {!sidebarCollapsed && <span>加班管理</span>}
          </NavLink>

          {isAdminOrManager && (
            <>
              <div className="nav-divider" />
              <NavLink to="/approvals" className="nav-item">
                <span className="nav-icon">✅</span>
                {!sidebarCollapsed && <span>待审批</span>}
              </NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider" />
              <NavLink to="/admin/users" className="nav-item">
                <span className="nav-icon">👥</span>
                {!sidebarCollapsed && <span>用户管理</span>}
              </NavLink>
              <NavLink to="/admin/settings" className="nav-item">
                <span className="nav-icon">⚙️</span>
                {!sidebarCollapsed && <span>系统设置</span>}
              </NavLink>
            </>
          )}
        </nav>

        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left" />
          <div className="topbar-right">
            <span className="user-info">
              <span className="user-role">{user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '主管' : '员工'}</span>
              <span className="user-name">{user?.name}</span>
            </span>
            <button className="btn-logout" onClick={handleLogout}>登出</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
