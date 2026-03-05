import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layout, Table, Tag, Typography, Button, Avatar, Input,
  Select, Switch, Modal, Spin, message, notification
} from 'antd';
import {
  ProjectOutlined, RocketOutlined, CodeOutlined, UserOutlined,
  SearchOutlined, ReloadOutlined, TrophyFilled, BulbOutlined,
  TeamOutlined, FormOutlined, ToolOutlined, FundProjectionScreenOutlined,
  BookOutlined, BarChartOutlined
} from '@ant-design/icons';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getAllProjects } from '../services/projectService';
import { userService } from '../services/userService';
import AdminSidebar from '../Adminpage/AdminSidebar';

const { Content } = Layout;
const { Option } = Select;

/* ─────────────────────────────────────────────────────
   WEB AUDIO ENGINE — zero dependencies, generates all
   sounds procedurally via Web Audio API
───────────────────────────────────────────────────── */
class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }
  _play(fn) { if (!this.enabled) return; try { fn(this._ctx()); } catch(e){} }

  // short UI tick on hover
  tick(freq = 880, dur = 0.06, vol = 0.15) {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    });
  }

  // button click pop
  pop() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(320, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.22, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      o.start(); o.stop(ctx.currentTime + 0.09);
    });
  }

  // success chime (3-note arp)
  chime() {
    this._play(ctx => {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.1;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      });
    });
  }

  // modal open whoosh (noise burst)
  whoosh() {
    this._play(ctx => {
      const len = Math.ceil(ctx.sampleRate * 0.22);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.setValueAtTime(200, ctx.currentTime);
      f.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.22);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.22);
    });
  }

  // notification bell
  bell() {
    this._play(ctx => {
      [880, 1108, 1320].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.06;
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.start(t); o.stop(t + 0.6);
      });
    });
  }

  // refresh sweep
  sweep() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(110, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.start(); o.stop(ctx.currentTime + 0.2);
    });
  }

  // row-click thud
  thud() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(180, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.13);
      g.gain.setValueAtTime(0.28, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    });
  }
}

const sfx = new SoundEngine();

/* ─────────────────────────────────────────────────────
   PARTICLE BURST component
───────────────────────────────────────────────────── */
const ParticleBurst = ({ active, x, y, color }) => {
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed z-[9999]" style={{ left: x, top: y }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 7, height: 7,
            borderRadius: '50%',
            background: color,
            animation: `burst 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 15}ms both`,
            transform: `rotate(${i * 30}deg) translateX(0)`,
            '--angle': `${i * 30}deg`,
          }}
          className="particle-dot"
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   ANIMATED COUNTER hook
───────────────────────────────────────────────────── */
const useCounter = (target, dur = 1400) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let n = 0; const inc = target / (dur / 16);
    const id = setInterval(() => {
      n += inc;
      if (n >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(n));
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return val;
};

/* ─────────────────────────────────────────────────────
   MAGNETIC BUTTON
───────────────────────────────────────────────────── */
const MagBtn = ({ children, onClick, className = '', style = {} }) => {
  const ref = useRef();
  const onMove = e => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.22;
    const y = (e.clientY - r.top - r.height / 2) * 0.22;
    ref.current.style.transform = `translate(${x}px,${y}px) scale(1.04)`;
  };
  const onLeave = () => { ref.current.style.transform = 'translate(0,0) scale(1)'; };
  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={className}
      style={{ transition: 'transform .18s cubic-bezier(0.34,1.56,0.64,1)', ...style }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────────────────
   STAT CARD with particle burst on hover
───────────────────────────────────────────────────── */
const StatCard = ({ title, value, icon, color, bg, delay = 0 }) => {
  const count = useCounter(value);
  const [burst, setBurst] = useState({ active: false, x: 0, y: 0 });
  const ref = useRef();

  const onHover = () => {
    sfx.tick(440 + Math.random() * 300, 0.05, 0.08);
    const r = ref.current.getBoundingClientRect();
    setBurst({ active: true, x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setTimeout(() => setBurst(b => ({ ...b, active: false })), 600);
  };

  return (
    <>
      <ParticleBurst {...burst} color={color} />
      <div
        ref={ref}
        onMouseEnter={onHover}
        className="stat-card-epic relative overflow-hidden rounded-2xl border bg-white cursor-pointer select-none"
        style={{ borderColor: color + '40', animationDelay: delay + 'ms', '--c': color }}
      >
        <div className="stat-shine" />
        <div className="relative z-10 p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-xl p-3 text-2xl stat-icon" style={{ background: bg, color }}>{icon}</div>
            <div className="stat-orb" style={{ background: color + '20' }} />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
          <p className="text-4xl md:text-5xl font-black tabular-nums" style={{ color }}>{count.toLocaleString()}</p>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────
   THEME DATA
───────────────────────────────────────────────────── */
const STATUS_STYLES = {
  'สมบูรณ์':          { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  'กำลังทำ':          { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  'รออนุมัติหัวข้อ':  { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  'รออนุมัติเล่ม':    { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  'ล่าช้า':            { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  'ไม่ผ่าน':           { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
};

const STEPS = [
  { icon: <TeamOutlined />,             color: '#3b82f6', bg: '#eff6ff', title: '1. คิดหัวข้อ & รวมกลุ่ม',   desc: 'รวมกลุ่มเพื่อน คิดไอเดียสร้างสรรค์ หาข้อมูล' },
  { icon: <FormOutlined />,             color: '#f59e0b', bg: '#fffbeb', title: '2. เสนอหัวข้อโครงงาน',      desc: 'ยื่นเสนอผ่านระบบ รอรับการอนุมัติจากที่ปรึกษา' },
  { icon: <ToolOutlined />,             color: '#10b981', bg: '#f0fdf4', title: '3. พัฒนา & รายงาน 50%',     desc: 'ลงมือพัฒนาชิ้นงาน รายงานความคืบหน้า' },
  { icon: <FundProjectionScreenOutlined />, color: '#8b5cf6', bg: '#faf5ff', title: '4. สอบป้องกัน 100%',   desc: 'นำเสนอผลงานฉบับสมบูรณ์ต่อคณะกรรมการ' },
  { icon: <BookOutlined />,             color: '#ec4899', bg: '#fdf2f8', title: '5. ส่งเล่ม & เผยแพร่',      desc: 'ส่งเอกสาร เผยแพร่ผลงานลงคลังโครงงาน' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

const getAvatarUrl = f => {
  if (!f || f === 'null' || f === 'undefined') return null;
  if (f.startsWith('http')) return f;
  const base = (import.meta.env.VITE_API_BASE_URL || 'https://reg.utc.ac.th').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const clean = f.startsWith('/') ? f.slice(1) : f;
  return clean.includes('..') ? null : `${base}/uploads/profiles/${clean}`;
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export const AdminDashboard = () => {
  const [user, setUser]                         = useState({ full_name: 'กำลังโหลด...', profile_img: null });
  const [rawProjects, setRawProjects]           = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [isRefreshing, setIsRefreshing]         = useState(false);
  const [pageReady, setPageReady]               = useState(false);
  const [activeRow, setActiveRow]               = useState(null);

  const [api, contextHolder] = notification.useNotification();
  const prevCount = useRef(null);

  const [searchText, setSearchText]           = useState('');
  const [filterYear, setFilterYear]           = useState(null);
  const [filterCat, setFilterCat]             = useState(null);
  const [filterAdv, setFilterAdv]             = useState(null);
  const [filterFeat, setFilterFeat]           = useState(false);

  const [modal, setModal]     = useState(false);
  const [selected, setSelected] = useState(null);

  /* page in */
  useEffect(() => { setTimeout(() => setPageReady(true), 80); }, []);

  /* scroll reveal */
  useEffect(() => {
    if (!pageReady) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('io-in'); io.unobserve(e.target); } });
    }, { threshold: 0.07 });
    document.querySelectorAll('.io').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pageReady, loading]);

  /* load user */
  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!raw) return;
      try {
        const p = JSON.parse(raw); setUser(p);
        const uid = p.id || p.userId;
        if (uid && userService?.getProfile) {
          const res = await userService.getProfile(uid);
          const d = res.data?.data || res.data;
          if (d) { setUser(u => ({ ...u, ...d, full_name: d.full_name || d.username || u.full_name })); localStorage.setItem('user', JSON.stringify(d)); }
        }
      } catch(e) { console.error(e); }
    })();
    fetchData(true);
    const id = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchData = async (show = true) => {
    if (show) { setLoading(true); sfx.sweep(); }
    setIsRefreshing(true);
    try {
      const res = await getAllProjects();
      let data = [];
      if (Array.isArray(res))                               data = res;
      else if (res && Array.isArray(res.data))              data = res.data;
      else if (res?.data && Array.isArray(res.data.data))   data = res.data.data;
      if (!data.length) { setRawProjects([]); setFilteredProjects([]); return; }
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (prevCount.current !== null && sorted.length > prevCount.current) {
        const n = sorted.length - prevCount.current;
        sfx.bell();
        const key = `n_${Date.now()}`;
        api.info({
          key,
          message: <span className="font-black text-indigo-700 text-base">มีผลงานใหม่เข้าสู่ระบบ! 🎉</span>,
          description: <span className="text-slate-600 text-sm">อัปโหลดโครงงานใหม่ <b className="text-indigo-600">{n} รายการ</b> <span className="opacity-50 text-xs">(คลิกรับทราบ)</span></span>,
          placement: 'topRight', duration: 0,
          icon: <BulbOutlined className="text-yellow-500 bulb-notif" />,
          className: 'notif-epic cursor-pointer',
          style: { borderRadius: 18, border: '2px solid #8b5cf6', background: 'linear-gradient(135deg,#fff,#f5f3ff)', boxShadow: '0 20px 40px -10px rgba(99,102,241,.28)' },
          onClick: () => { sfx.chime(); api.destroy(key); }
        });
      }
      prevCount.current = sorted.length;
      setRawProjects(sorted);
      if (show) sfx.chime();
    } catch(err) {
      if (show) message.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    let r = rawProjects;
    const lc = searchText.toLowerCase();
    if (searchText) r = r.filter(p => (p.title_th||'').toLowerCase().includes(lc) || (p.student_name||'').toLowerCase().includes(lc) || (p.creator_name||'').toLowerCase().includes(lc));
    if (filterYear)  r = r.filter(p => String(p.academic_year) === String(filterYear));
    if (filterCat)   r = r.filter(p => p.category === filterCat);
    if (filterAdv)   r = r.filter(p => p.advisor === filterAdv);
    if (filterFeat)  r = r.filter(p => p.is_featured === 1 || p.is_featured === true);
    setFilteredProjects(r);
  }, [searchText, filterYear, filterCat, filterAdv, filterFeat, rawProjects]);

  const clearFilters = () => { sfx.sweep(); setSearchText(''); setFilterYear(null); setFilterCat(null); setFilterAdv(null); setFilterFeat(false); };

  const openDetail = rec => { sfx.whoosh(); setSelected(rec); setActiveRow(rec.project_id); setTimeout(() => setActiveRow(null), 600); setModal(true); };

  const total     = filteredProjects.length;
  const pending   = filteredProjects.filter(p => p.progress_status?.includes('รอ')).length;
  const complete  = filteredProjects.filter(p => p.progress_status === 'สมบูรณ์').length;
  const featured  = filteredProjects.filter(p => p.is_featured === 1 || p.is_featured === true).length;

  const uYears = [...new Set(rawProjects.map(p => p.academic_year).filter(Boolean))].sort((a,b) => b-a);
  const uCats  = [...new Set(rawProjects.map(p => p.category).filter(Boolean))];
  const uAdvs  = [...new Set(rawProjects.map(p => p.advisor).filter(Boolean))];

  /* ═══ CHART DATA PROCESSING ═══ */
  const getStatusChartData = () => {
    const counts = {};
    Object.keys(STATUS_STYLES).forEach(s => { counts[s] = 0; });
    rawProjects.forEach(p => {
      const s = p.progress_status || 'ไม่ระบุ';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: STATUS_STYLES[name]?.dot || '#94a3b8' }));
  };

  const getCategoryChartData = () => {
    const counts = {};
    rawProjects.forEach(p => {
      const c = p.category || 'ไม่ระบุ';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  };

  const getYearChartData = () => {
    const counts = {};
    rawProjects.forEach(p => {
      const y = p.academic_year || 'ไม่ระบุ';
      counts[y] = (counts[y] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const aNum = parseInt(a.name);
        const bNum = parseInt(b.name);
        return bNum - aNum;
      });
  };

  const getAdvisorChartData = () => {
    const counts = {};
    rawProjects.forEach(p => {
      const a = p.advisor || 'ไม่ระบุ';
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const statusData = getStatusChartData();
  const categoryData = getCategoryChartData();
  const yearData = getYearChartData();
  const advisorData = getAdvisorChartData();

  const columns = [
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest">ชื่อโครงงาน</span>,
      dataIndex: 'title_th', key: 'title_th', width: '32%',
      render: (t, r) => (
        <div>
          <p className="font-black text-slate-800 text-sm leading-snug mb-1">{t}</p>
          <p className="text-xs text-slate-400">👤 {r.student_name || r.creator_name || 'ไม่ระบุ'}</p>
          {r.is_featured && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full feat-badge">
              <TrophyFilled className="text-amber-400" /> ยอดเยี่ยม
            </span>
          )}
        </div>
      ),
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest">ปีการศึกษา</span>,
      dataIndex: 'academic_year', key: 'year', align: 'center', width: '10%',
      render: t => <span className="font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl text-sm">{t || '-'}</span>,
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest">ที่ปรึกษา</span>,
      dataIndex: 'advisor', key: 'adv', width: '16%',
      render: t => t ? (
        <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-full font-semibold">
          <UserOutlined className="text-indigo-400" />{t}
        </span>
      ) : <span className="text-slate-300">—</span>,
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest">หมวดหมู่</span>,
      dataIndex: 'category', key: 'cat', width: '14%',
      render: t => <Tag color="purple" className="text-xs px-2.5 py-1 border-0 rounded-full font-bold">{t || '—'}</Tag>,
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest">สถานะ</span>,
      dataIndex: 'progress_status', key: 'status', width: '16%',
      render: s => {
        const sc = STATUS_STYLES[s] || { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
            <span className="w-2 h-2 rounded-full s-dot" style={{ background: sc.dot }} />{s || 'ไม่ระบุ'}
          </span>
        );
      },
    },
    {
      title: '', key: 'act', align: 'center', width: '12%',
      render: (_, r) => (
        <button
          onClick={e => { e.stopPropagation(); sfx.pop(); openDetail(r); }}
          className="det-btn"
          onMouseEnter={() => sfx.tick(600, 0.04, 0.07)}
        >
          ดูรายละเอียด
        </button>
      ),
    },
  ];

  return (
    <Layout className={`min-h-screen flex flex-col md:flex-row bg-[#eef2ff] transition-opacity duration-700 ${pageReady ? 'opacity-100' : 'opacity-0'}`}>
      {contextHolder}
      <div className="mesh-bg" aria-hidden />

      <AdminSidebar />

      <Layout className="bg-transparent flex-1 min-w-0">
        <Content className="p-4 md:p-8 h-screen overflow-y-auto cs">
          <div className="mx-auto w-full max-w-[1600px] pb-24 space-y-5">

            {/* ── HERO ── */}
            <div className="io hero-card overflow-hidden rounded-3xl">
              <div className="h-2 w-full stripe" />
              <div className="bg-white/95 backdrop-blur-sm p-5 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar size={68} src={getAvatarUrl(user.profile_img)} icon={<UserOutlined />}
                      className="border-4 border-indigo-100 shadow-lg av-float" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white pls" />
                  </div>
                  <div>
                    <h1 className="font-black text-xl md:text-3xl text-slate-800 m-0 hero-ttl">
                      สวัสดี,&nbsp;
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">{user.full_name}</span>
                      &nbsp;✌️
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">สำรวจไอเดียและดูภาพรวมผลงานโครงงานทั้งหมดในแผนก</p>
                  </div>
                </div>
                <MagBtn
                  onClick={() => { sfx.sweep(); fetchData(true); }}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg text-sm transition-colors"
                >
                  <ReloadOutlined className={isRefreshing ? 'animate-spin' : ''} />
                  รีเฟรชข้อมูล
                </MagBtn>
              </div>
            </div>

            {/* ── STATS ── */}
            <div className="io grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="โครงงานทั้งหมด" value={total}    icon={<ProjectOutlined />}  color="#3b82f6" bg="#eff6ff" delay={0}   />
              <StatCard title="กำลังดำเนินการ"  value={pending}  icon={<CodeOutlined />}     color="#f59e0b" bg="#fffbeb" delay={80}  />
              <StatCard title="เสร็จสมบูรณ์"    value={complete} icon={<RocketOutlined />}   color="#10b981" bg="#f0fdf4" delay={160} />
              <StatCard title="Hall of Fame"     value={featured} icon={<TrophyFilled />}     color="#8b5cf6" bg="#faf5ff" delay={240} />
            </div>

            {/* ── CHARTS SECTION ── */}
            <div className="io bg-white/95 backdrop-blur-sm rounded-3xl shadow-md border border-white/80 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50"><BarChartOutlined className="text-blue-500 text-xl" /></div>
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">รายงานสถิติข้อมูล</h2>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Status Chart */}
                <div className="chart-card rounded-2xl bg-slate-50/80 p-6">
                  <h3 className="font-black text-slate-700 text-base mb-4">สถานะของโครงงาน</h3>
                  <div className="h-80 flex items-center justify-center">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} โครงงาน`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">ไม่มีข้อมูล</p>
                    )}
                  </div>
                </div>

                {/* Category Chart */}
                <div className="chart-card rounded-2xl bg-slate-50/80 p-6">
                  <h3 className="font-black text-slate-700 text-base mb-4">จำนวนโครงงานตามหมวดหมู่</h3>
                  <div className="h-80 flex items-center justify-center">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 100, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#94a3b8" />
                          <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip formatter={(value) => `${value} โครงงาน`} />
                          <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">ไม่มีข้อมูล</p>
                    )}
                  </div>
                </div>

                {/* Year Chart */}
                <div className="chart-card rounded-2xl bg-slate-50/80 p-6">
                  <h3 className="font-black text-slate-700 text-base mb-4">จำนวนโครงงานตามปีการศึกษา</h3>
                  <div className="h-80 flex items-center justify-center">
                    {yearData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={yearData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip formatter={(value) => `${value} โครงงาน`} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">ไม่มีข้อมูล</p>
                    )}
                  </div>
                </div>

                {/* Advisor Chart */}
                <div className="chart-card rounded-2xl bg-slate-50/80 p-6">
                  <h3 className="font-black text-slate-700 text-base mb-4">จำนวนโครงงานตามที่ปรึกษา (Top 8)</h3>
                  <div className="h-80 flex items-center justify-center">
                    {advisorData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={advisorData} margin={{ left: 90, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#94a3b8" />
                          <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip formatter={(value) => `${value} โครงงาน`} />
                          <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                            {advisorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">ไม่มีข้อมูล</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── UNIFIED CARD ── */}
            <div className="io bg-white/95 backdrop-blur-sm rounded-3xl shadow-md border border-white/80 overflow-hidden">

              {/* Steps */}
              <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-amber-50"><BulbOutlined className="text-amber-500 text-xl blb" /></div>
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">ขั้นตอนและแนวปฏิบัติในการทำโครงงาน</h2>
                </div>

                {/* mobile vertical */}
                <div className="flex flex-col gap-0 md:hidden">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex gap-4 items-stretch step-item" onMouseEnter={() => sfx.tick(400 + i * 90, 0.06, 0.07)}>
                      <div className="flex flex-col items-center">
                        <div className="rounded-2xl p-2.5 s-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        {i < STEPS.length - 1 && <div className="w-0.5 flex-1 min-h-[18px] my-1" style={{ background: s.color + '30' }} />}
                      </div>
                      <div className="pb-4 pt-0.5 flex-1">
                        <p className="font-black text-slate-700 text-sm">{s.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* desktop horizontal */}
                <div className="hidden md:flex items-start gap-0">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center text-center px-2 step-item group cursor-default"
                      onMouseEnter={() => sfx.tick(400 + i * 90, 0.06, 0.07)}>
                      <div className="relative w-full flex justify-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg s-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        {i < STEPS.length - 1 && (
                          <div className="absolute top-7 left-[60%] right-0 h-0.5" style={{ background: `linear-gradient(to right, ${s.color}50, ${STEPS[i+1].color}40)` }} />
                        )}
                      </div>
                      <p className="font-black text-slate-700 text-xs mt-3 leading-snug">{s.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="p-6 md:p-8 bg-slate-50/60 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <SearchOutlined className="text-lg text-blue-500 bg-blue-50 p-2 rounded-xl" />
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">ค้นหาคลังโครงงาน</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ค้นหา</label>
                    <Input size="large" placeholder="ชื่อโครงงาน, นักศึกษา..." value={searchText}
                      onChange={e => { sfx.tick(600, 0.03, 0.05); setSearchText(e.target.value); }}
                      className="rounded-xl s-inp" allowClear />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ปีการศึกษา</label>
                    <Select size="large" className="w-full" placeholder="ทุกปี" value={filterYear} onChange={v => { sfx.pop(); setFilterYear(v); }} allowClear>
                      {uYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">หมวดหมู่</label>
                    <Select size="large" className="w-full" placeholder="ทุกหมวด" value={filterCat} onChange={v => { sfx.pop(); setFilterCat(v); }} allowClear>
                      {uCats.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ที่ปรึกษา</label>
                    <Select size="large" className="w-full" placeholder="ทุกคน" value={filterAdv} onChange={v => { sfx.pop(); setFilterAdv(v); }} allowClear>
                      {uAdvs.map(a => <Option key={a} value={a}>{a}</Option>)}
                    </Select>
                  </div>
                  <div className="flex flex-col justify-between">
                    <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">
                      <TrophyFilled /> Hall of Fame
                    </label>
                    <div className="flex items-center gap-3">
                      <Switch checked={filterFeat} onChange={v => { v ? sfx.chime() : sfx.tick(); setFilterFeat(v); }}
                        className={filterFeat ? 'bg-purple-500' : 'bg-slate-300'} />
                      <button onClick={clearFilters} onMouseEnter={() => sfx.tick(260, 0.04, 0.06)}
                        className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">ล้างทั้งหมด</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div>
                <div className="px-6 md:px-8 pt-6 pb-2 flex items-center gap-3">
                  <ProjectOutlined className="text-lg text-indigo-500 bg-indigo-50 p-2 rounded-xl" />
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">คลังโครงงานทั้งหมด</h2>
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-2.5 py-1 rounded-full cnt-badge">{filteredProjects.length}</span>
                </div>

                {loading ? (
                  <div className="py-24 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="ld-ring" /><p className="text-slate-400 font-bold text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                ) : (
                  <Table columns={columns} dataSource={filteredProjects} rowKey="project_id"
                    pagination={{ pageSize: 10, showSizeChanger: false, className: 'px-6 md:px-8 pb-6' }}
                    rowClassName={r => `ep-row cursor-pointer ${activeRow === r.project_id ? 'row-flash' : ''}`}
                    onRow={r => ({
                      onClick: () => { sfx.thud(); openDetail(r); },
                      onMouseEnter: () => sfx.tick(500, 0.03, 0.05),
                    })}
                    className="ep-tbl"
                  />
                )}
              </div>
            </div>

          </div>
        </Content>
      </Layout>

      {/* MODAL */}
      <Modal open={modal} onCancel={() => { sfx.tick(380, 0.07); setModal(false); }}
        footer={null} width="min(760px, 95vw)" centered styles={{ body: { padding: 0 } }} className="ep-modal">
        {selected && (() => {
          const sc = STATUS_STYLES[selected.progress_status] || { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' };
          const rows = [
            { e: '👤', l: 'ผู้จัดทำ',    v: selected.student_name || selected.creator_name || 'ไม่ระบุ' },
            { e: '🧑', l: 'ที่ปรึกษา',   v: selected.advisor || '—' },
            { e: '🗂',  l: 'หมวดหมู่',    v: selected.category || '—' },
            { e: '📚', l: 'ระดับชั้น',    v: selected.project_level || '—' },
            { e: '📅', l: 'ปีการศึกษา',  v: selected.academic_year || '—' },
          ];
          return (
            <div className="m-anim">
              <div className="m-hero relative overflow-hidden p-7 md:p-9 rounded-t-2xl">
                <div className="m-hero-bg" />
                {selected.is_featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-300 text-amber-900 font-black text-xs px-5 py-2 rounded-bl-2xl z-20 f-banner">
                    <TrophyFilled /> ผลงานยอดเยี่ยม
                  </div>
                )}
                <div className="relative z-10">
                  <h2 className="font-black text-white text-xl md:text-3xl leading-tight mb-2 drop-shadow">{selected.title_th}</h2>
                  <p className="text-blue-100 font-semibold text-sm">{selected.title_en || ''}</p>
                </div>
              </div>
              <div className="p-6 md:p-8">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0 m-row" style={{ animationDelay: (i * 55 + 80) + 'ms' }}>
                    <span className="text-xl w-7 text-center">{r.e}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 shrink-0">{r.l}</span>
                    <span className="font-bold text-slate-800 text-sm">{r.v}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-4">
                  <span className="text-xl w-7 text-center">🚦</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 shrink-0">สถานะ</span>
                  <span className="inline-flex items-center gap-2 font-black text-sm px-4 py-2 rounded-2xl" style={{ background: sc.bg, color: sc.text }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: sc.dot }} />
                    {selected.progress_status || 'ไม่ระบุ'}
                  </span>
                </div>
              </div>
              <div className="px-6 md:px-8 pb-7 flex justify-end">
                <MagBtn onClick={() => { sfx.tick(380, 0.07); setModal(false); }}
                  className="bg-slate-900 hover:bg-indigo-600 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-colors shadow-lg">
                  ปิดหน้าต่าง
                </MagBtn>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ═══ ALL CSS ═══ */}
      <style>{`
        :root { --spring: cubic-bezier(0.34,1.56,0.64,1); --out: cubic-bezier(0.16,1,0.3,1); }

        /* mesh background */
        .mesh-bg { position:fixed;inset:0;pointer-events:none;z-index:0;
          background: radial-gradient(ellipse 80% 50% at 10% 0%,#dbeafe55,transparent),
            radial-gradient(ellipse 60% 60% at 90% 100%,#ede9fe44,transparent); }

        /* IO reveal */
        .io { opacity:0;transform:translateY(26px);transition:opacity .6s var(--out),transform .6s var(--out); }
        .io-in { opacity:1!important;transform:translateY(0)!important; }

        /* hero card */
        @keyframes hIn { from{opacity:0;transform:translateY(-20px) scale(.97)} to{opacity:1;transform:none} }
        .hero-card { border:1px solid rgba(255,255,255,.85);
          box-shadow:0 20px 60px -10px rgba(99,102,241,.14),0 0 0 1px rgba(99,102,241,.06);
          animation: hIn .75s var(--out) both; }

        /* stripe */
        @keyframes sAnim { 0%{background-position:0 50%} 50%{background-position:100% 50%} 100%{background-position:0 50%} }
        .stripe { background:linear-gradient(to right,#3b82f6,#6366f1,#8b5cf6,#ec4899,#3b82f6);
          background-size:300% 300%;animation:sAnim 5s ease infinite; }

        /* avatar float */
        @keyframes avF { 0%,100%{transform:translateY(0) rotate(0)} 40%{transform:translateY(-5px) rotate(1deg)} 70%{transform:translateY(-3px) rotate(-1deg)} }
        .av-float { animation:avF 5s ease-in-out infinite; }
        /* online dot */
        @keyframes plsA { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.7);opacity:.4} }
        .pls { animation:plsA 2s ease-in-out infinite; }
        /* title */
        @keyframes ttlIn { from{opacity:0;letter-spacing:.25em} to{opacity:1;letter-spacing:normal} }
        .hero-ttl { animation:ttlIn .9s .15s var(--out) both; }

        /* stat cards */
        @keyframes scIn { from{opacity:0;transform:scale(.82) translateY(18px)} to{opacity:1;transform:none} }
        .stat-card-epic { animation:scIn .55s var(--spring) both;transition:transform .22s var(--spring),box-shadow .22s ease; }
        .stat-card-epic:hover { transform:translateY(-7px) scale(1.025);box-shadow:0 20px 40px -10px var(--c,rgba(99,102,241,.3)); }
        .stat-card-epic:active { transform:scale(.96); }
        .stat-shine { position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent 60%);pointer-events:none;opacity:0;transition:opacity .3s; }
        .stat-card-epic:hover .stat-shine { opacity:1; }
        .stat-icon { transition:transform .3s var(--spring); }
        .stat-card-epic:hover .stat-icon { transform:rotate(-12deg) scale(1.22); }
        @keyframes orbP { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
        .stat-orb { width:44px;height:44px;border-radius:50%;position:absolute;right:14px;bottom:14px;opacity:.35;animation:orbP 3s ease-in-out infinite; }

        /* particle dots */
        @keyframes burst { 0%{transform:rotate(var(--angle,0deg)) translateX(0) scale(1);opacity:1} 100%{transform:rotate(var(--angle,0deg)) translateX(42px) scale(0);opacity:0} }
        .particle-dot { animation:burst .55s var(--out) both; transform-origin:center; }

        /* steps */
        .step-item { transition:all .2s ease; }
        .s-icon { transition:transform .28s var(--spring); }
        .step-item:hover .s-icon { transform:scale(1.18) rotate(-8deg); }

        /* bulb flicker */
        @keyframes blbF { 0%,100%{opacity:1} 45%{opacity:.55} 80%{opacity:.85} }
        .blb { animation:blbF 3.5s ease-in-out infinite; }

        /* search input focus glow */
        .s-inp:focus-within { box-shadow:0 0 0 3px rgba(99,102,241,.18)!important; }

        /* chart card */
        .chart-card { transition:all .3s ease;border:1px solid rgba(99,102,241,.1); }
        .chart-card:hover { box-shadow:0 10px 30px -10px rgba(99,102,241,.2); }

        /* epic table */
        .ep-tbl .ant-table { background:transparent!important; }
        .ep-tbl .ant-table-thead > tr > th { background:#f8fafc!important;font-size:11px!important;padding:13px 16px!important;color:#64748b!important;border-bottom:1px solid #e2e8f0!important;font-weight:900!important;letter-spacing:.05em; }
        .ep-tbl .ant-table-tbody > tr > td { padding:13px 16px!important;border-bottom:1px solid #f8fafc!important;transition:background .15s; }
        .ep-row { transition:all .2s; }
        .ep-row:hover > td { background:#eef2ff!important; }
        .ep-row:hover { box-shadow:inset 4px 0 0 #6366f1; }
        .ep-row:active { transform:scale(.999); }
        @keyframes rFlash { 0%{background:#e0e7ff} 100%{background:transparent} }
        .row-flash > td { animation:rFlash .5s ease forwards!important; }

        /* detail button */
        .det-btn { position:relative;overflow:hidden;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:11px;padding:6px 13px;border-radius:12px;border:1.5px solid #e0e7ff;transition:all .18s var(--spring);cursor:pointer; }
        .det-btn:hover { background:#4f46e5;color:#fff;transform:translateY(-2px) scale(1.06);box-shadow:0 8px 20px -5px rgba(79,70,229,.45); }
        .det-btn:active { transform:scale(.95); }

        /* status dot pulse */
        @keyframes sdP { 0%,100%{opacity:1} 50%{opacity:.35} }
        .s-dot { animation:sdP 2.2s ease-in-out infinite; }
        /* featured badge */
        @keyframes fbP { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 4px rgba(251,191,36,.25)} }
        .feat-badge { animation:fbP 2.5s ease-in-out infinite; }
        /* count badge pop */
        @keyframes cbP { 0%{transform:scale(1.5)} 100%{transform:scale(1)} }
        .cnt-badge { animation:cbP .35s var(--spring) both; }
        /* loader ring */
        @keyframes spin { to{transform:rotate(360deg)} }
        .ld-ring { width:46px;height:46px;border-radius:50%;border:4px solid #e2e8f0;border-top-color:#6366f1;animation:spin .75s linear infinite; }

        /* notification */
        @keyframes nfIn { from{transform:translateX(100%) scale(.92)} to{transform:translateX(0) scale(1)} }
        .notif-epic { animation:nfIn .38s var(--spring) both; }
        @keyframes bulbB { 0%,100%{transform:scale(1)} 40%{transform:scale(1.45);filter:drop-shadow(0 0 6px #fbbf24)} }
        .bulb-notif { animation:bulbB 1.2s ease-in-out infinite; }

        /* modal */
        .ep-modal .ant-modal-content { border-radius:22px!important;overflow:hidden;padding:0;box-shadow:0 40px 80px -20px rgba(0,0,0,.22); }
        .ep-modal .ant-modal-close { top:12px;right:12px;transition:transform .2s,color .2s; }
        .ep-modal .ant-modal-close:hover { color:#ef4444;transform:rotate(90deg) scale(1.2); }
        @keyframes mIn { from{opacity:0;transform:scale(.9) translateY(14px)} to{opacity:1;transform:none} }
        .m-anim { animation:mIn .38s var(--spring) both; }
        .m-hero { background:linear-gradient(135deg,#1e40af,#4f46e5 50%,#7c3aed);min-height:130px;display:flex;align-items:flex-end; }
        .m-hero-bg { position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 10px); }
        @keyframes mRow { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
        .m-row { animation:mRow .32s var(--out) both; }
        @keyframes fBan { from{transform:translateX(35px)} to{transform:none} }
        .f-banner { animation:fBan .38s .18s var(--spring) both; }

        /* scrollbar */
        .cs::-webkit-scrollbar { width:7px; }
        .cs::-webkit-scrollbar-track { background:#f1f5f9; }
        .cs::-webkit-scrollbar-thumb { background:#c7d2fe;border-radius:99px;border:2px solid #f1f5f9; }
        .cs::-webkit-scrollbar-thumb:hover { background:#818cf8; }

        /* pagination */
        .ant-pagination-item { border-radius:10px!important;font-weight:700!important;transition:all .15s; }
        .ant-pagination-item:hover { transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,.28); }
        .ant-pagination-item-active { background:#4f46e5!important;border-color:#4f46e5!important; }
        .ant-pagination-item-active a { color:#fff!important; }

        /* Recharts customization */
        .recharts-surface { overflow:visible !important; }
        .recharts-wrapper { margin:0 auto; }
        .recharts-text { font-family: inherit; }
        .recharts-tooltip { border-radius:12px !important;box-shadow:0 10px 20px rgba(0,0,0,.15) !important; }
      `}</style>
    </Layout>
  );
};

export default AdminDashboard;