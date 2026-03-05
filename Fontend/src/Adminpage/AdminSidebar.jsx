import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Typography, Tag, Avatar, message } from 'antd';
import {
  DashboardOutlined,
  SolutionOutlined,
  StarOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  ProjectFilled,
  AuditOutlined,
  SafetyCertificateFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SoundOutlined,
  MutedOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService } from '../services/userService';

const { Sider } = Layout;
const { Text } = Typography;

// ─── Avatar URL ───────────────────────────────────────────────────────────────
const getAvatarUrl = (fileName) => {
  if (!fileName || fileName === 'null' || fileName === 'undefined') return null;
  if (fileName.startsWith('http')) return fileName;
  let baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://reg.utc.ac.th';
  baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const clean = fileName.startsWith('/') ? fileName.substring(1) : fileName;
  return `${baseUrl}/uploads/profiles/${clean}`;
};

// ─── Web Audio click sound ────────────────────────────────────────────────────
const createClickSound = (ctx) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
};

const createNavSound = (ctx) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

// ─── Ripple Component ─────────────────────────────────────────────────────────
const Ripple = ({ x, y, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <span
      className="ripple-effect"
      style={{ left: x, top: y }}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ripples, setRipples] = useState([]);
  const [pressedKey, setPressedKey] = useState(null);
  const audioCtxRef = useRef(null);
  const siderRef = useRef(null);

  const [userData, setUserData] = useState({
    id: null,
    full_name: 'กำลังโหลด...',
    role: '',
    avatar_url: null,
  });

  // ─── Init AudioContext lazily ─────────────────────────────────────────────
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback((type = 'nav') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      if (type === 'nav') createNavSound(ctx);
      else createClickSound(ctx);
    } catch (_) {}
  }, [soundEnabled, getAudioCtx]);

  // ─── Fetch user ───────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = async () => {
      try {
        const str = sessionStorage.getItem('user') || localStorage.getItem('user');
        const saved = str ? JSON.parse(str) : null;
        const userId = saved?.id || saved?.userId;
        if (!userId) return;

        const res = await userService.getProfile(userId);
        const d = res.data?.data || res.data;
        if (!d) return;

        if (d.status === 'inactive') {
          message.error('บัญชีของคุณถูกระงับการใช้งาน');
          handleLogout();
          return;
        }

        setUserData({
          id: d.id,
          full_name: d.full_name || 'User',
          role: d.role,
          avatar_url: getAvatarUrl(d.profile_img),
        });
        sessionStorage.setItem('user', JSON.stringify(d));
      } catch (err) {
        const str = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (str) {
          const s = JSON.parse(str);
          setUserData(prev => ({
            ...prev,
            full_name: s.full_name,
            role: s.role,
            avatar_url: getAvatarUrl(s.profile_img),
          }));
        }
      }
    };
    sync();
  }, [location.pathname]);

  const handleLogout = async () => {
    try { if (userService?.logout) await userService.logout(); } catch (_) {}
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login';
  };

  const getRoleLabel = (role) => ({
    department_head: 'หัวหน้าแผนกวิชา',
    teacher: 'อาจารย์ผู้สอน',
    student: 'นักศึกษา',
  }[role] || role || '-');

  // ─── Menu items (flat, no groups) ────────────────────────────────────────
  const menuItems = [
    { key: '/Admindashboard',       icon: DashboardOutlined,        label: 'หน้าหลัก' },
    { key: '/ApproveProject',       icon: SafetyCertificateFilled,  label: 'อนุมัติหัวข้อโครงงาน',   roles: ['department_head'] },
    { key: '/ProjectSTD',           icon: StarOutlined,             label: 'จัดการโครงงานนักศึกษา' },
    { key: '/EvaluationPage',       icon: SolutionOutlined,         label: 'บันทึกคะแนนประเมิน' },
    { key: '/Adminpage/Milestone',  icon: AuditOutlined,            label: 'ติดตาม Milestone' },
    { key: '/RubricSettings',       icon: SettingOutlined,          label: 'ตั้งค่าเกณฑ์ประเมิน' },
    { key: '/ManageUsers',          icon: UserOutlined,             label: 'จัดการผู้ใช้งาน',          roles: ['department_head'] },
  ].filter(item => !item.roles || item.roles.includes(userData.role));

  // ─── Handle ripple + press ────────────────────────────────────────────────
  const triggerRipple = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y, key }]);
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 200);
  };

  const handleItemClick = (e, key) => {
    triggerRipple(e, key);
    playClick('nav');
    if (key === 'logout') {
      handleLogout();
    } else {
      navigate(key);
    }
  };

  const handleCollapse = (val) => {
    playClick('click');
    setCollapsed(val);
  };

  const handleSoundToggle = () => {
    setSoundEnabled(p => !p);
    playClick('click');
  };

  const isActive = (key) => location.pathname === key;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap');

        .admin-sider * {
          font-family: 'Noto Sans Thai', sans-serif !important;
        }

        /* ── Sider base ── */
        .admin-sider.ant-layout-sider {
          background: #ffffff !important;
          border-right: 1px solid #f0fdf4 !important;
          position: sticky !important;
          top: 0;
          height: 100vh;
          z-index: 50;
          box-shadow: 4px 0 24px rgba(0,0,0,0.06);
        }
        .admin-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .admin-sider .ant-layout-sider-trigger {
          background: #f0fdf4 !important;
          color: #16a34a !important;
          border-top: 1px solid #dcfce7;
          transition: background 0.2s;
        }
        .admin-sider .ant-layout-sider-trigger:hover {
          background: #dcfce7 !important;
          color: #15803d !important;
        }

        /* ── Scrollbar ── */
        .sidebar-menu-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-menu-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-menu-scroll::-webkit-scrollbar-thumb {
          background: #bbf7d0;
          border-radius: 10px;
        }

        /* ── Menu item ── */
        .menu-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          margin: 3px 10px;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .menu-item:hover {
          background: #f0fdf4;
          transform: translateX(2px);
        }
        .menu-item.active {
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.35);
          transform: translateX(3px);
        }
        .menu-item.pressed {
          transform: scale(0.96) translateX(2px) !important;
        }

        /* ── Bubble Ripple ── */
        .ripple-effect {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(134,239,172,0.7) 0%, rgba(34,197,94,0.3) 50%, transparent 100%);
          border: 1.5px solid rgba(34,197,94,0.5);
          transform: translate(-50%, -50%) scale(0);
          animation: bubbleRipple 0.7s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
          pointer-events: none;
        }
        .menu-item.active .ripple-effect {
          background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          border-color: rgba(255,255,255,0.5);
        }
        @keyframes bubbleRipple {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          60%  { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(22); opacity: 0; }
        }

        /* ── Icon ── */
        .menu-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .menu-item.active .menu-icon {
          background: rgba(255,255,255,0.22);
          color: #fff;
        }
        .menu-item:not(.active) .menu-icon {
          background: #f0fdf4;
          color: #86efac;
        }
        .menu-item:hover:not(.active) .menu-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        /* ── Label ── */
        .menu-label {
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.2s, max-width 0.3s;
        }
        .menu-item.active .menu-label { color: #fff; }
        .menu-item:not(.active) .menu-label { color: #64748b; }
        .menu-item:hover:not(.active) .menu-label { color: #15803d; }

        /* ── Active indicator dot ── */
        .active-dot {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        /* ── Divider ── */
        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #dcfce7, transparent);
          margin: 8px 16px;
        }

        /* ── Logout item ── */
        .menu-item.logout:hover {
          background: #fff1f2 !important;
        }
        .menu-item.logout:hover .menu-label { color: #ef4444 !important; }
        .menu-item.logout:hover .menu-icon { background: #fee2e2 !important; color: #ef4444 !important; }
        .menu-item.logout .menu-icon { color: #f87171 !important; background: #fff1f2 !important; }
        .menu-item.logout .menu-label { color: #f87171 !important; }

        /* ── Sound toggle ── */
        .sound-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid #dcfce7;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .sound-btn:hover {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #bbf7d0;
        }
        .sound-btn.on { color: #22c55e; border-color: #86efac; background: #f0fdf4; }

        /* ── Logo shimmer ── */
        .logo-shimmer {
          background: linear-gradient(135deg, #16a34a, #22c55e, #15803d);
          background-size: 200% 200%;
          animation: shimmerBg 4s ease-in-out infinite;
        }
        @keyframes shimmerBg {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── Collapsed tooltip ── */
        .collapsed-label {
          position: absolute;
          left: calc(100% + 12px);
          background: #1e293b;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.15s, transform 0.15s;
          z-index: 99;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: 'Noto Sans Thai', sans-serif !important;
        }
        .collapsed-label::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e293b;
          border-left: none;
        }
        .menu-item:hover .collapsed-label {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Profile card ── */
        .profile-card {
          background: #f0fdf4;
          border-radius: 14px;
          border: 1px solid #dcfce7;
          transition: background 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .profile-card:hover { background: #dcfce7; border-color: #bbf7d0; }
      `}</style>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapse}
        breakpoint="lg"
        collapsedWidth={72}
        width={260}
        className="admin-sider"
        ref={siderRef}
        trigger={
          <div className="flex items-center justify-center w-full h-full gap-2">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span style={{ fontSize: 12, fontFamily: "'Noto Sans Thai', sans-serif" }}>ย่อเมนู</span>}
          </div>
        }
      >
        {/* ── Logo ───────────────────────────────────────────── */}
        <div
          className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center p-4' : 'gap-3 px-5 py-5'}`}
        >
          <div
            className="logo-shimmer w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(34,197,94,0.45)' }}
          >
            <ProjectFilled style={{ color: '#fff', fontSize: 20 }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-800 leading-tight tracking-tight m-0">
                ระบบโปรเจคนักเรียน
              </p>
              <Tag
                style={{
                  fontSize: 9, padding: '0 6px', margin: '3px 0 0',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  color: '#86efac', borderRadius: 6,
                  fontFamily: "'Noto Sans Thai', sans-serif",
                }}
              >
                ADMIN PANEL
              </Tag>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="sidebar-divider" />

        {/* ── Menu ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto sidebar-menu-scroll py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key);
            const pressed = pressedKey === item.key;
            const itemRipples = ripples.filter(r => r.key === item.key);

            return (
              <div
                key={item.key}
                className={`menu-item ${active ? 'active' : ''} ${pressed ? 'pressed' : ''}`}
                onClick={(e) => handleItemClick(e, item.key)}
              >
                {/* Ripples */}
                {itemRipples.map(r => (
                  <Ripple
                    key={r.id}
                    x={r.x}
                    y={r.y}
                    onDone={() => setRipples(prev => prev.filter(rp => rp.id !== r.id))}
                  />
                ))}

                {/* Icon */}
                <div className="menu-icon">
                  <Icon />
                </div>

                {/* Label (hidden when collapsed) */}
                {!collapsed && (
                  <span className="menu-label">{item.label}</span>
                )}

                {/* Active dot */}
                {active && !collapsed && <span className="active-dot" />}

                {/* Collapsed tooltip */}
                {collapsed && (
                  <span className="collapsed-label">{item.label}</span>
                )}
              </div>
            );
          })}

          {/* ── Divider before logout ── */}
          <div className="sidebar-divider mt-3 mb-1" />

          {/* ── Logout ── */}
          {(() => {
            const logoutRipples = ripples.filter(r => r.key === 'logout');
            const pressed = pressedKey === 'logout';
            return (
              <div
                className={`menu-item logout ${pressed ? 'pressed' : ''}`}
                onClick={(e) => handleItemClick(e, 'logout')}
              >
                {logoutRipples.map(r => (
                  <Ripple
                    key={r.id}
                    x={r.x}
                    y={r.y}
                    onDone={() => setRipples(prev => prev.filter(rp => rp.id !== r.id))}
                  />
                ))}
                <div className="menu-icon">
                  <LogoutOutlined />
                </div>
                {!collapsed && <span className="menu-label">ออกจากระบบ</span>}
                {collapsed && <span className="collapsed-label">ออกจากระบบ</span>}
              </div>
            );
          })()}
        </div>

        {/* ── Profile ─────────────────────────────────────────── */}
        <div className={`p-3 border-t border-green-50`}>
          <div
            className={`profile-card flex items-center transition-all duration-300 ${
              collapsed ? 'p-2 justify-center' : 'p-3 gap-3'
            }`}
          >
            <Avatar
              size={collapsed ? 34 : 38}
              src={userData.avatar_url}
              style={{
                background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                color: '#fff',
                fontWeight: 700,
                flexShrink: 0,
                border: '2px solid rgba(34,197,94,0.4)',
              }}
            >
              {!userData.avatar_url && (
                userData.full_name !== 'กำลังโหลด...'
                  ? userData.full_name.charAt(0).toUpperCase()
                  : <UserOutlined />
              )}
            </Avatar>

            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <Text
                  className="block truncate font-bold text-slate-800"
                  style={{ fontSize: 12.5 }}
                >
                  {userData.full_name}
                </Text>
                <Text
                  className="block truncate"
                  style={{ fontSize: 10.5, color: '#64748b' }}
                >
                  {getRoleLabel(userData.role)}
                </Text>
              </div>
            )}

            {/* Sound toggle (visible only when expanded) */}
            {!collapsed && (
              <button
                className={`sound-btn ${soundEnabled ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleSoundToggle(); }}
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
              >
                {soundEnabled ? <SoundOutlined style={{ fontSize: 13 }} /> : <MutedOutlined style={{ fontSize: 13 }} />}
              </button>
            )}
          </div>
        </div>
      </Sider>
    </>
  );
};

export default AdminSidebar;