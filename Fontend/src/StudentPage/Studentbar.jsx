import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Typography, Avatar } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  RocketOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
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

// ─── Web Audio ────────────────────────────────────────────────────────────────
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

// ─── Ripple Component ─────────────────────────────────────────────────────────
const Ripple = ({ x, y, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);
  return <span className="std-ripple" style={{ left: x, top: y }} />;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Studentbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ripples, setRipples] = useState([]);
  const [pressedKey, setPressedKey] = useState(null);
  const audioCtxRef = useRef(null);

  const [userData, setUserData] = useState({
    full_name: 'กำลังโหลด...',
    role: 'student',
    avatar_url: null,
  });

  // ─── Audio ────────────────────────────────────────────────────────────────
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback((type = 'nav') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      type === 'nav' ? createNavSound(ctx) : createClickSound(ctx);
    } catch (_) {}
  }, [soundEnabled, getAudioCtx]);

  // ─── Fetch Profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const userId = saved.id || saved.userId;
        if (!userId) return;
        const res = await userService.getProfile(userId);
        const d = res.data?.data || res.data;
        setUserData({
          full_name: d.full_name || 'ไม่ระบุชื่อ',
          role: d.role || 'student',
          avatar_url: getAvatarUrl(d.profile_img),
        });
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    };
    fetchProfile();
  }, []);

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

  // ─── Menu (flat) ──────────────────────────────────────────────────────────
  const menuItems = [
    { key: '/StudentDashboard', icon: DashboardOutlined, label: 'หน้าหลัก' },
    { key: '/Projectsubmit',    icon: FileAddOutlined,   label: 'เสนอหัวข้อโครงงาน' },
    { key: '/ProjectArchive',   icon: FolderOpenOutlined,label: 'คลังโครงงานทั้งหมด' },
    { key: '/Studentprofile',   icon: UserOutlined,      label: 'จัดการโปรไฟล์' },
  ];

  // ─── Ripple + Press ───────────────────────────────────────────────────────
  const triggerRipple = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, key }]);
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 200);
  };

  const handleItemClick = (e, key) => {
    triggerRipple(e, key);
    playClick('nav');
    key === 'logout' ? handleLogout() : navigate(key);
  };

  const isActive = (key) => location.pathname === key;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap');

        .std-sider * { font-family: 'Noto Sans Thai', sans-serif !important; }

        /* ── Sider ── */
        .std-sider.ant-layout-sider {
          background: #ffffff !important;
          border-right: 1px solid #f0fdf4 !important;
          position: sticky !important;
          top: 0;
          height: 100vh;
          z-index: 50;
          box-shadow: 4px 0 24px rgba(0,0,0,0.06);
        }
        .std-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #ffffff;
        }
        .std-sider .ant-layout-sider-trigger {
          background: #f0fdf4 !important;
          color: #16a34a !important;
          border-top: 1px solid #dcfce7;
          font-family: 'Noto Sans Thai', sans-serif !important;
        }
        .std-sider .ant-layout-sider-trigger:hover {
          background: #dcfce7 !important;
          color: #15803d !important;
        }

        /* ── Scrollbar ── */
        .std-scroll::-webkit-scrollbar { width: 3px; }
        .std-scroll::-webkit-scrollbar-track { background: transparent; }
        .std-scroll::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 10px; }

        /* ── Menu item ── */
        .std-item {
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
        .std-item:hover { background: #f0fdf4; transform: translateX(2px); }
        .std-item.active {
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          box-shadow: 0 4px 20px rgba(34,197,94,0.35);
          transform: translateX(3px);
        }
        .std-item.pressed { transform: scale(0.96) translateX(2px) !important; }

        /* ── Bubble Ripple ── */
        .std-ripple {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(134,239,172,0.7) 0%, rgba(34,197,94,0.3) 50%, transparent 100%);
          border: 1.5px solid rgba(34,197,94,0.5);
          transform: translate(-50%, -50%) scale(0);
          animation: stdBubble 0.7s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
          pointer-events: none;
        }
        .std-item.active .std-ripple {
          background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          border-color: rgba(255,255,255,0.5);
        }
        @keyframes stdBubble {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          60%  { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(22); opacity: 0; }
        }

        /* ── Icon box ── */
        .std-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .std-item.active .std-icon  { background: rgba(255,255,255,0.22); color: #fff; }
        .std-item:not(.active) .std-icon { background: #f0fdf4; color: #86efac; }
        .std-item:hover:not(.active) .std-icon { background: #dcfce7; color: #16a34a; }

        /* ── Label ── */
        .std-label {
          font-size: 13.5px; font-weight: 600;
          white-space: nowrap; overflow: hidden;
          transition: opacity 0.2s;
        }
        .std-item.active .std-label { color: #fff; }
        .std-item:not(.active) .std-label { color: #64748b; }
        .std-item:hover:not(.active) .std-label { color: #15803d; }

        /* ── Active dot ── */
        .std-dot {
          position: absolute; right: 12px;
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
          animation: stdDot 2s ease-in-out infinite;
        }
        @keyframes stdDot {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        /* ── Divider ── */
        .std-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #dcfce7, transparent);
          margin: 8px 16px;
        }

        /* ── Logout ── */
        .std-item.logout:hover { background: #fff1f2 !important; }
        .std-item.logout:hover .std-label { color: #ef4444 !important; }
        .std-item.logout:hover .std-icon { background: #fee2e2 !important; color: #ef4444 !important; }
        .std-item.logout .std-icon { color: #f87171 !important; background: #fff1f2 !important; }
        .std-item.logout .std-label { color: #f87171 !important; }

        /* ── Sound btn ── */
        .std-sound {
          width: 30px; height: 30px; border-radius: 8px;
          border: 1px solid #dcfce7; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #94a3b8;
          transition: all 0.18s; flex-shrink: 0;
        }
        .std-sound:hover { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .std-sound.on { color: #22c55e; border-color: #86efac; background: #f0fdf4; }

        /* ── Logo shimmer ── */
        .std-logo {
          background: linear-gradient(135deg, #16a34a, #22c55e, #15803d);
          background-size: 200% 200%;
          animation: stdShimmer 4s ease-in-out infinite;
        }
        @keyframes stdShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── Collapsed tooltip ── */
        .std-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          background: #1e293b; color: #e2e8f0;
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transform: translateX(-6px);
          transition: opacity 0.15s, transform 0.15s;
          z-index: 99; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: 'Noto Sans Thai', sans-serif !important;
        }
        .std-tooltip::before {
          content: '';
          position: absolute; left: -5px; top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e293b; border-left: none;
        }
        .std-item:hover .std-tooltip { opacity: 1; transform: translateX(0); }

        /* ── Profile card ── */
        .std-profile {
          background: #f0fdf4; border-radius: 14px;
          border: 1px solid #dcfce7;
          transition: background 0.2s, border-color 0.2s; cursor: pointer;
        }
        .std-profile:hover { background: #dcfce7; border-color: #bbf7d0; }
      `}</style>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => { playClick('click'); setCollapsed(val); }}
        width={260}
        collapsedWidth={72}
        breakpoint="lg"
        className="std-sider"
        trigger={
          <div className="flex items-center justify-center w-full h-full gap-2">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span style={{ fontSize: 12, fontFamily: "'Noto Sans Thai', sans-serif" }}>ย่อเมนู</span>}
          </div>
        }
      >

        {/* ── Logo ── */}
        <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center p-4' : 'gap-3 px-5 py-5'}`}>
          <div
            className="std-logo w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ boxShadow: '0 0 20px rgba(34,197,94,0.4)' }}
          >
            <RocketOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-800 leading-tight tracking-tight m-0">ระบบบันทึกโปรเจค</p>
              <span style={{
                display: 'inline-block', marginTop: 3,
                fontSize: 9, padding: '1px 6px',
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#86efac', borderRadius: 6,
                fontFamily: "'Noto Sans Thai', sans-serif",
                fontWeight: 700, letterSpacing: '0.08em',
              }}>
                STUDENT
              </span>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="std-divider" />

        {/* ── Menu ── */}
        <div className="flex-1 overflow-y-auto std-scroll py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key);
            const pressed = pressedKey === item.key;
            const itemRipples = ripples.filter(r => r.key === item.key);
            return (
              <div
                key={item.key}
                className={`std-item ${active ? 'active' : ''} ${pressed ? 'pressed' : ''}`}
                onClick={(e) => handleItemClick(e, item.key)}
              >
                {itemRipples.map(r => (
                  <Ripple key={r.id} x={r.x} y={r.y}
                    onDone={() => setRipples(prev => prev.filter(rp => rp.id !== r.id))} />
                ))}
                <div className="std-icon"><Icon /></div>
                {!collapsed && <span className="std-label">{item.label}</span>}
                {active && !collapsed && <span className="std-dot" />}
                {collapsed && <span className="std-tooltip">{item.label}</span>}
              </div>
            );
          })}

          <div className="std-divider mt-3 mb-1" />

          {/* ── Logout ── */}
          {(() => {
            const lr = ripples.filter(r => r.key === 'logout');
            const pressed = pressedKey === 'logout';
            return (
              <div
                className={`std-item logout ${pressed ? 'pressed' : ''}`}
                onClick={(e) => handleItemClick(e, 'logout')}
              >
                {lr.map(r => (
                  <Ripple key={r.id} x={r.x} y={r.y}
                    onDone={() => setRipples(prev => prev.filter(rp => rp.id !== r.id))} />
                ))}
                <div className="std-icon"><LogoutOutlined /></div>
                {!collapsed && <span className="std-label">ออกจากระบบ</span>}
                {collapsed && <span className="std-tooltip">ออกจากระบบ</span>}
              </div>
            );
          })()}
        </div>

        {/* ── Profile ── */}
        <div className="p-3 border-t border-green-50">
          <div
            className={`std-profile flex items-center transition-all duration-300 ${collapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}
            onClick={() => { playClick('click'); navigate('/Studentprofile'); }}
          >
            <Avatar
              size={collapsed ? 34 : 38}
              src={userData.avatar_url}
              style={{
                background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                color: '#fff', fontWeight: 700,
                flexShrink: 0,
                border: '2px solid rgba(34,197,94,0.35)',
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
                <Text className="block truncate font-bold text-slate-800" style={{ fontSize: 12.5 }}>
                  {userData.full_name}
                </Text>
                <Text className="block truncate" style={{ fontSize: 10.5, color: '#64748b' }}>
                  {getRoleLabel(userData.role)}
                </Text>
              </div>
            )}

            {!collapsed && (
              <button
                className={`std-sound ${soundEnabled ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSoundEnabled(p => !p); playClick('click'); }}
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
              >
                {soundEnabled
                  ? <SoundOutlined style={{ fontSize: 13 }} />
                  : <MutedOutlined style={{ fontSize: 13 }} />
                }
              </button>
            )}
          </div>
        </div>

      </Sider>
    </>
  );
};

export default Studentbar;