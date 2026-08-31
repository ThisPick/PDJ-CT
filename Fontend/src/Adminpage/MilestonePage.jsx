import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Table, Select, Steps,
  Drawer, Spin, Empty, FloatButton
} from 'antd';
import {
  SearchOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  AuditOutlined, UserOutlined, FilePdfOutlined, GithubOutlined,
  YoutubeOutlined, GoogleOutlined, RiseOutlined, BellOutlined,
  ClockCircleOutlined, FilterOutlined, ClearOutlined,
  CloseOutlined, ReloadOutlined, CalendarOutlined, TeamOutlined,
  AppstoreOutlined, BookOutlined, StarOutlined, EyeOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import { getAllProjects } from '../services/projectService';

const { Content } = Layout;
const { Option } = Select;

/* ══════════════════════════════════════════════════
   🔊  WEB AUDIO ENGINE
══════════════════════════════════════════════════ */
const sfx = (() => {
  let ctx = null;
  const gc = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };
  const run = (fn) => { try { fn(gc()); } catch (_) {} };
  const osc = (c, type, f, start, dur, vol = 0.18, attack = 0.01) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  };
  const sweep = (c, f0, f1, start, dur, vol = 0.12) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, c.currentTime + start);
    o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + start + dur);
    g.gain.setValueAtTime(vol, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  };
  return {
    tick:    () => run(c => { osc(c,'sine',880,0,.07,.14); osc(c,'sine',1108,.06,.08,.09); }),
    pop:     () => run(c => { osc(c,'triangle',400,0,.05,.2,.02); osc(c,'sine',780,.04,.07,.12,.01); }),
    open:    () => run(c => { [523,659,784,1047].forEach((f,i) => osc(c,'sine',f,i*.09,.28,.15,.02)); }),
    close:   () => run(c => { [1047,784,659,523].forEach((f,i) => osc(c,'sine',f,i*.07,.22,.12,.01)); }),
    clear:   () => run(c => { sweep(c,600,150,0,.22,.10); osc(c,'sine',300,.18,.12,.08); }),
    alert:   () => run(c => { osc(c,'sine',880,0,.15,.2,.02); osc(c,'sine',1108,.12,.18,.14,.01); osc(c,'sine',880,.28,.15,.12,.01); }),
    success: () => run(c => { [523,659,784,1047,1319].forEach((f,i) => osc(c,'sine',f,i*.1,.3,.18,.02)); }),
    select:  () => run(c => { osc(c,'sine',660,0,.08,.13,.01); osc(c,'triangle',880,.07,.07,.08,.01); }),
  };
})();

/* ══════════════════════════════════════════════════
   ✨  PARTICLE BURST
══════════════════════════════════════════════════ */
const SPARKS = ['✨','⭐','🌟','💫','🎯','🎊','💖','🌸'];
const Sparks = ({ x, y, active }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * 360;
        const dist  = 45 + (i % 4) * 18;
        const dx    = Math.cos((angle * Math.PI) / 180) * dist;
        const dy    = Math.sin((angle * Math.PI) / 180) * dist - 25;
        return (
          <span key={i} className="absolute" style={{
            left: x, top: y, fontSize: `${10 + (i % 4) * 6}px`,
            transform: 'translate(-50%,-50%)',
            animation: `spk .75s cubic-bezier(.16,1,.3,1) ${i * 25}ms both`,
            '--dx': `${dx}px`, '--dy': `${dy}px`,
          }}>{SPARKS[i % SPARKS.length]}</span>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   📊  STATUS CONFIG
══════════════════════════════════════════════════ */
const S = {
  'สมบูรณ์':         { pct:100, clr:'#059669', bg:'#ecfdf5', txt:'#065f46', bdr:'#a7f3d0', step:4, grad:'135deg, #059669, #0d9488', dot:'#10b981' },
  'รออนุมัติเล่ม':   { pct:80,  clr:'#7c3aed', bg:'#f5f3ff', txt:'#4c1d95', bdr:'#c4b5fd', step:3, grad:'135deg, #7c3aed, #6d28d9', dot:'#8b5cf6' },
  'กำลังทำ':         { pct:55,  clr:'#1d4ed8', bg:'#eff6ff', txt:'#1e3a8a', bdr:'#93c5fd', step:2, grad:'135deg, #2563eb, #0284c7', dot:'#3b82f6' },
  'รออนุมัติหัวข้อ': { pct:15,  clr:'#b45309', bg:'#fffbeb', txt:'#78350f', bdr:'#fcd34d', step:0, grad:'135deg, #d97706, #ea580c', dot:'#f59e0b' },
  'ล่าช้า':           { pct:40,  clr:'#b91c1c', bg:'#fff1f2', txt:'#7f1d1d', bdr:'#fca5a5', step:1, grad:'135deg, #dc2626, #e11d48', dot:'#ef4444' },
  'ไม่ผ่าน':          { pct:0,   clr:'#991b1b', bg:'#fff1f2', txt:'#7f1d1d', bdr:'#fca5a5', step:0, grad:'135deg, #dc2626, #b91c1c', dot:'#ef4444' },
};
const getCfg = (s) => S[s] || { pct:5, clr:'#64748b', bg:'#f8fafc', txt:'#475569', bdr:'#cbd5e1', step:0, grad:'135deg, #94a3b8, #64748b', dot:'#94a3b8' };

const MILESTONES = [
  { num:'1', label:'เสนอหัวข้อ' },
  { num:'2', label:'พัฒนาชิ้นงาน' },
  { num:'3', label:'พัฒนา 50%' },
  { num:'4', label:'พัฒนา 100%' },
  { num:'5', label:'ส่งเล่มสมบูรณ์' },
];

/* BUG FIX: StatusPill - เพิ่ม line-height และ white-space ป้องกัน text ถูกตัด */
const StatusPill = ({ status }) => {
  const c = getCfg(status);
  return (
    <span className="ms-pill" style={{ '--pill-bg': c.bg, '--pill-txt': c.txt, '--pill-bdr': c.bdr, '--pill-dot': c.dot }}>
      <span className="ms-dot"/>
      {status || '—'}
    </span>
  );
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
};
const formatFull = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('th-TH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
};
const getFileUrl = (path) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env?.VITE_API_BASE_URL || 'https://reg.utc.ac.th').replace(/\/api\/?$/, '');
  return `${base}/uploads/pdf/${path}`;
};

/* ══════════════════════════════════════════════════
   🎛  FILTER SELECT ATOM
══════════════════════════════════════════════════ */
const FSelect = ({ label, icon, value, onChange, options, placeholder }) => (
  <div className="ms-fselect-wrap">
    <label className="ms-filter-label">{icon} {label}</label>
    <Select
      size="large"
      value={value || undefined}
      placeholder={<span className="ms-ph">{placeholder}</span>}
      onChange={v => { onChange(v || null); sfx.select(); }}
      allowClear onClear={() => { onChange(null); sfx.clear(); }}
      className="ms-sel"
      popupClassName="ms-sel-pop"
      suffixIcon={<FilterOutlined style={{ color:'#94a3b8', fontSize:12, pointerEvents:'none' }}/>}
    >
      {options.map(o => (
        <Option key={o.value} value={o.value}>
          <span className="ms-opt">{o.label}</span>
        </Option>
      ))}
    </Select>
  </div>
);

/* ══════════════════════════════════════════════════
   🎴  STAT CARD
══════════════════════════════════════════════════ */
const StatCard = ({ label, value, emoji, grad, onClick, delay, pulse }) => (
  <div className="ms-stat-card" onClick={onClick} style={{ '--grad': grad, animationDelay:`${delay}ms` }} onMouseEnter={sfx.pop}>
    <div className="ms-stat-bar"/>
    <div className="ms-stat-body">
      <span className="ms-stat-emoji">{emoji}</span>
      <div className="ms-stat-text">
        <p className="ms-stat-label">{label}</p>
        <p className="ms-stat-value" style={pulse ? { color:'#f97316' } : {}}>{value}</p>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════
   🏠  MAIN COMPONENT
══════════════════════════════════════════════════ */
const MilestonePage = () => {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchText,  setSearchText]  = useState('');
  const [fStatus,     setFStatus]     = useState(null);
  const [fYear,       setFYear]       = useState(null);
  const [fLevel,      setFLevel]      = useState(null);
  const [fCategory,   setFCategory]   = useState(null);
  const [fAdvisor,    setFAdvisor]    = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [selProj,     setSelProj]     = useState(null);
  const [sparks,      setSparks]      = useState({ active:false, x:0, y:0 });
  const sparkTO = useRef(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res && Array.isArray(res.data)) data = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const yearOpts     = [...new Set(projects.map(p=>p.academic_year).filter(Boolean))].sort((a,b)=>b-a).map(y=>({ value:String(y), label:`ปีการศึกษา ${y}` }));
  const levelOpts    = [...new Set(projects.map(p=>p.project_level).filter(Boolean))].sort().map(l=>({ value:l, label:l }));
  const categoryOpts = [...new Set(projects.map(p=>p.category).filter(Boolean))].sort().map(c=>({ value:c, label:c }));
  const advisorOpts  = [...new Set(projects.map(p=>p.advisor).filter(Boolean))].sort().map(a=>({ value:a, label:`อ.${a}` }));
  const statusOpts   = Object.keys(S).map(s=>({ value:s, label:s }));

  const filtered = projects.filter(p => {
    const q = searchText.toLowerCase();
    const name = (p.student_name || p.creator_name || '').toLowerCase();
    const matchSearch = !q
      || (p.title_th||'').toLowerCase().includes(q)
      || name.includes(q)
      || (p.advisor||'').toLowerCase().includes(q);
    return matchSearch
      && (!fStatus   || p.progress_status === fStatus)
      && (!fYear     || String(p.academic_year) === String(fYear))
      && (!fLevel    || p.project_level === fLevel)
      && (!fCategory || p.category === fCategory)
      && (!fAdvisor  || p.advisor === fAdvisor);
  });

  const activeCount = [fStatus, fYear, fLevel, fCategory, fAdvisor].filter(Boolean).length;

  const clearAll = () => {
    setFStatus(null); setFYear(null); setFLevel(null); setFCategory(null); setFAdvisor(null);
    setSearchText(''); sfx.clear();
  };

  const burst = (e) => {
    const r = e?.currentTarget?.getBoundingClientRect?.();
    if (!r) return;
    clearTimeout(sparkTO.current);
    setSparks({ active:true, x:r.left+r.width/2, y:r.top+r.height/2 });
    sparkTO.current = setTimeout(() => setSparks(b=>({...b,active:false})), 900);
  };

  /* BUG FIX: openDrawer - ป้องกัน event bubble และตรวจสอบ selProj ก่อน render drawer */
  const openDrawer = (p, e) => {
    e?.stopPropagation();
    sfx.open();
    burst(e);
    setSelProj(p);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    sfx.close();
    /* BUG FIX: delay clear selProj เพื่อให้ animation drawer ปิดก่อน ไม่งั้น content กระพริบ */
    setTimeout(() => setSelProj(null), 350);
  };

  const pending  = projects.filter(p=>p.progress_status?.includes('รอ')).length;
  const done     = projects.filter(p=>p.progress_status==='สมบูรณ์').length;
  const inProg   = projects.filter(p=>p.progress_status==='กำลังทำ').length;
  const troubled = projects.filter(p=>['ไม่ผ่าน','ล่าช้า'].includes(p.progress_status)).length;
  const avgPct   = projects.length ? Math.round(projects.reduce((s,p)=>s+getCfg(p.progress_status).pct,0)/projects.length) : 0;

  /* ── TABLE COLUMNS ── */
  const columns = [
    {
      title: <span className="ms-th">โครงงาน</span>,
      key: 'info',
      render: (_, r) => (
        <div className="ms-cell-info">
          <p className="ms-proj-title">{r.title_th}</p>
          <div className="ms-meta-list">
            <span className="ms-meta-item"><UserOutlined className="ms-icon-blue"/>{r.student_name||r.creator_name||'—'}</span>
            {r.advisor && <span className="ms-meta-item"><AuditOutlined className="ms-icon-teal"/>อ.{r.advisor}</span>}
            {r.academic_year && <span className="ms-meta-item"><CalendarOutlined className="ms-icon-slate"/>ปี {r.academic_year}</span>}
          </div>
          <div className="ms-tags">
            {r.category      && <span className="ms-tag ms-tag-indigo">{r.category}</span>}
            {r.project_level && <span className="ms-tag ms-tag-purple">{r.project_level}</span>}
          </div>
        </div>
      )
    },
    {
      title: <span className="ms-th">ความก้าวหน้า</span>,
      key: 'progress',
      render: (_, r) => {
        const cfg = getCfg(r.progress_status);
        return (
          <div className="ms-cell-progress">
            <div className="ms-prog-header">
              <StatusPill status={r.progress_status}/>
              <span className="ms-prog-pct" style={{ color: cfg.clr }}>{cfg.pct}%</span>
            </div>
            <div className="ms-prog-track">
              <div className="ms-prog-fill" style={{ width:`${cfg.pct}%`, background:`linear-gradient(${cfg.grad})` }}/>
            </div>
            <p className="ms-prog-date">
              <ClockCircleOutlined style={{ marginRight:4 }}/>{formatDate(r.updated_at||r.created_at)}
            </p>
          </div>
        );
      }
    },
    {
      title: <span className="ms-th">Milestone</span>,
      key: 'milestone',
      render: (_, r) => {
        const cfg = getCfg(r.progress_status);
        const isPend = r.progress_status?.includes('รอ');
        return (
          <div className="ms-milestone-box">
            <Steps current={cfg.step} size="small" className="ms-steps"
              status={r.progress_status==='ไม่ผ่าน'?'error':isPend?'process':'finish'}
              items={MILESTONES.map(m=>({ title:<span className="ms-step-label">{m.label}</span> }))}/>
          </div>
        );
      }
    },
    {
      title: '', key: 'act', align: 'center',
      render: (_, r) => {
        const cfg = getCfg(r.progress_status);
        return (
          /* BUG FIX: เพิ่ม type="button" ป้องกัน form submit และปรับ contrast */
          <button type="button" onClick={e => openDrawer(r, e)} className="ms-view-btn"
            style={{ background:`linear-gradient(${cfg.grad})` }}>
            <EyeOutlined/><span>ดูรายละเอียด</span>
          </button>
        );
      }
    },
  ];

  /* ── MOBILE CARD ── */
  const MobileCard = ({ r, idx }) => {
    const cfg = getCfg(r.progress_status);
    const isPend = r.progress_status?.includes('รอ');
    return (
      <div className="ms-mobile-card" style={{ animationDelay:`${idx*60}ms` }}>
        <div className="ms-card-bar" style={{ background:`linear-gradient(${cfg.grad})` }}/>
        <div className="ms-card-body">
          <div className="ms-card-top">
            <p className="ms-card-title">{r.title_th}</p>
            <StatusPill status={r.progress_status}/>
          </div>
          <div className="ms-card-meta">
            <span className="ms-meta-chip"><UserOutlined/>{r.student_name||r.creator_name||'—'}</span>
            {r.advisor       && <span className="ms-meta-chip ms-chip-teal"><AuditOutlined/>อ.{r.advisor}</span>}
            {r.academic_year && <span className="ms-meta-chip ms-chip-blue"><CalendarOutlined/>ปี {r.academic_year}</span>}
            {r.category      && <span className="ms-meta-chip ms-chip-indigo">{r.category}</span>}
            {r.project_level && <span className="ms-meta-chip ms-chip-purple">{r.project_level}</span>}
          </div>
          <div className="ms-card-prog">
            <div className="ms-card-prog-header">
              <span style={{ color: cfg.clr, fontWeight:700 }}>{r.progress_status}</span>
              <span style={{ color: cfg.clr, fontWeight:800 }}>{cfg.pct}%</span>
            </div>
            <div className="ms-prog-track">
              <div className="ms-prog-fill" style={{ width:`${cfg.pct}%`, background:`linear-gradient(${cfg.grad})` }}/>
            </div>
          </div>
          <div className="ms-milestone-box">
            <Steps current={cfg.step} size="small" className="ms-steps"
              status={r.progress_status==='ไม่ผ่าน'?'error':isPend?'process':'finish'}
              items={MILESTONES.map(m=>({ title:<span className="ms-step-label">{m.label}</span> }))}/>
          </div>
          {/* BUG FIX: type="button" + ปรับ text ชัดขึ้น */}
          <button type="button" onClick={e => openDrawer(r, e)} className="ms-card-btn"
            style={{ background:`linear-gradient(${cfg.grad})` }}>
            <EyeOutlined/><span>ดูรายละเอียด</span>
          </button>
        </div>
      </div>
    );
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <Layout className="ms-root">
      <AdminSidebar/>
      <Layout className="ms-inner">
        <Content className="ms-content">
          <div className="ms-container">

            <Sparks {...sparks}/>

            {/* HERO */}
            <div className="ms-hero">
              <div className="ms-hero-left">
                <div className="ms-hero-icon"><RiseOutlined/></div>
                <div>
                  <h1 className="ms-hero-title">📈 ติดตามความก้าวหน้า</h1>
                  <p className="ms-hero-sub">โครงงานนักศึกษา · Milestone Tracking</p>
                </div>
              </div>
              <div className="ms-hero-right">
                <div className="ms-avg-box">
                  <p className="ms-avg-label">เฉลี่ยความก้าวหน้า</p>
                  <p className="ms-avg-val">{avgPct}%</p>
                </div>
                {/* BUG FIX: type="button" ป้องกัน form submit */}
                <button type="button" onClick={() => { fetchProjects(); sfx.pop(); }} className="ms-reload-btn"
                  title="รีโหลดข้อมูล" aria-label="รีโหลดข้อมูล">
                  <ReloadOutlined className={loading ? 'ms-spin' : ''}/>
                </button>
              </div>
              <div className="ms-hero-bar-wrap">
                <div className="ms-hero-bar-track">
                  <div className="ms-hero-bar-fill" style={{ width:`${avgPct}%` }}/>
                </div>
              </div>
            </div>

            {/* STAT CARDS */}
            <div className="ms-stats-grid">
              {[
                { label:'ทั้งหมด',    value:projects.length, emoji:'📚', grad:'135deg,#4f46e5,#2563eb',  delay:0,   onClick:clearAll },
                { label:'กำลังทำ',    value:inProg,          emoji:'⚡', grad:'135deg,#2563eb,#0891b2',  delay:80,  onClick:()=>{ setFStatus('กำลังทำ'); sfx.tick(); } },
                { label:'รอตรวจสอบ', value:pending,         emoji:'⏳', grad:'135deg,#d97706,#ea580c',  delay:160, onClick:()=>{ setFStatus('รออนุมัติหัวข้อ'); sfx.tick(); }, pulse:pending>0 },
                { label:'สมบูรณ์',    value:done,            emoji:'✅', grad:'135deg,#059669,#0d9488',  delay:240, onClick:()=>{ setFStatus('สมบูรณ์'); sfx.tick(); } },
                { label:'มีปัญหา',    value:troubled,        emoji:'🚨', grad:'135deg,#dc2626,#e11d48',  delay:320, onClick:()=>{ setFStatus('ไม่ผ่าน'); sfx.tick(); }, pulse:troubled>0 },
              ].map((s,i) => <StatCard key={i} {...s}/>)}
            </div>

            {/* FILTER PANEL */}
            <div className="ms-filter-panel">
              <div className="ms-search-row">
                <div className="ms-search-wrap">
                  <SearchOutlined className="ms-search-icon"/>
                  <input type="text" value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="ค้นหาชื่อโครงงาน, ผู้จัดทำ, อาจารย์..."
                    className="ms-search-input"/>
                  {searchText && (
                    <button type="button" onClick={() => setSearchText('')} className="ms-search-clear"
                      aria-label="ล้างการค้นหา">
                      <CloseOutlined/>
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => { setShowFilters(v => !v); sfx.pop(); }}
                  className={`ms-filter-btn ${showFilters || activeCount > 0 ? 'ms-filter-btn-active' : ''}`}>
                  <FilterOutlined/>
                  <span>ตัวกรอง</span>
                  {/* BUG FIX: badge ตัวเลขชัดเจน ไม่ซ้อนทับ */}
                  {activeCount > 0 && <span className="ms-filter-badge">{activeCount}</span>}
                </button>
              </div>

              {showFilters && (
                <div className="ms-adv-filters">
                  <FSelect label="หมวดหมู่"   icon={<AppstoreOutlined/>} value={fCategory} onChange={setFCategory} options={categoryOpts} placeholder="ทุกหมวดหมู่"/>
                  <FSelect label="ปีการศึกษา" icon={<CalendarOutlined/>} value={fYear}     onChange={setFYear}     options={yearOpts}     placeholder="ทุกปีการศึกษา"/>
                  <FSelect label="ระดับชั้น"  icon={<BookOutlined/>}     value={fLevel}    onChange={setFLevel}    options={levelOpts}    placeholder="ทุกระดับชั้น"/>
                  <FSelect label="ที่ปรึกษา"  icon={<TeamOutlined/>}     value={fAdvisor}  onChange={setFAdvisor}  options={advisorOpts}  placeholder="ที่ปรึกษาทุกคน"/>
                  <FSelect label="สถานะ"      icon={<StarOutlined/>}     value={fStatus}   onChange={setFStatus}   options={statusOpts}   placeholder="ทุกสถานะ"/>
                  {(activeCount > 0 || searchText) && (
                    <div className="ms-fselect-wrap">
                      <label className="ms-filter-label" style={{ opacity:0 }}>__</label>
                      <button type="button" onClick={clearAll} className="ms-clear-btn">
                        <ClearOutlined/><span>ล้างทั้งหมด</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="ms-result-bar">
                <p className="ms-result-text">
                  <SearchOutlined style={{ marginRight:6 }}/>
                  พบ <strong className="ms-result-num">{filtered.length}</strong> โครงงาน
                  {projects.length !== filtered.length && <span className="ms-result-of"> จาก {projects.length}</span>}
                </p>
                {activeCount > 0 && (
                  <span className="ms-active-badge">กรองอยู่ {activeCount} เงื่อนไข</span>
                )}
              </div>
            </div>

            {/* TABLE / CARDS */}
            {loading ? (
              <div className="ms-loading">
                <Spin size="large"/>
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ms-empty">
                <Empty description={
                  <div>
                    <p className="ms-empty-text">ไม่พบโครงงานที่ตรงกับเงื่อนไข</p>
                    {(activeCount > 0 || searchText) && (
                      <button type="button" onClick={clearAll} className="ms-empty-clear">
                        <ClearOutlined/><span>ล้างตัวกรอง</span>
                      </button>
                    )}
                  </div>
                }/>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="ms-mobile-grid">
                  {filtered.map((p,i) => <MobileCard key={p.project_id} r={p} idx={i}/>)}
                </div>
                {/* Desktop */}
                <div className="ms-table-wrap">
                  <Table columns={columns} dataSource={filtered} rowKey="project_id"
                    className="ms-table"
                    rowClassName={(_,i) => `ms-row ${i%2===0?'ms-row-even':'ms-row-odd'}`}
                    pagination={{
                      pageSize:12,
                      className:'ms-pager',
                      showTotal:(t,r)=><span className="ms-pager-info">แสดง {r[0]}–{r[1]} จาก {t}</span>
                    }}/>
                </div>
              </>
            )}
          </div>
        </Content>
      </Layout>

      {/* DRAWER */}
      <Drawer
        title={
          <div className="ms-drawer-title">
            <AuditOutlined style={{ color:'#4f46e5' }}/> รายละเอียดโครงงาน
          </div>
        }
        placement="right"
        /* BUG FIX: ใช้ window check อย่างปลอดภัย + fallback ที่ถูกต้อง */
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100vw' : 800}
        onClose={closeDrawer}
        open={drawerOpen}
        className="ms-drawer"
        closeIcon={<CloseOutlined style={{ color:'#94a3b8' }}/>}
        /* BUG FIX: destroyOnClose=false เพื่อป้องกัน flicker, ใช้ selProj check แทน */
        destroyOnClose={false}
      >
        {/* BUG FIX: แยก render condition ออกมา ไม่ใช้ IIFE ใน JSX */}
        {selProj && <DrawerContent selProj={selProj} closeDrawer={closeDrawer} />}
      </Drawer>

      <FloatButton
        badge={{ count: pending, style:{ backgroundColor:'#ea580c' } }}
        type="primary" icon={<BellOutlined/>}
        tooltip={`${pending} โครงงานรอตรวจสอบ`}
        style={{ right:28, bottom:88 }}
        onClick={() => { sfx.alert(); setFStatus('รออนุมัติหัวข้อ'); setShowFilters(false); }}
      />

      <style>{CSS}</style>
    </Layout>
  );
};

/* ══════════════════════════════════════════════════
   BUG FIX: แยก DrawerContent เป็น component แยก
   เพื่อป้องกัน IIFE ใน JSX และ re-render bug
══════════════════════════════════════════════════ */
const DrawerContent = ({ selProj, closeDrawer }) => {
  const cfg = getCfg(selProj.progress_status);
  const isPend = selProj.progress_status?.includes('รอ');

  return (
    <div className="ms-detail">
      {/* Hero */}
      <div className="ms-detail-hero" style={{ background:`linear-gradient(${cfg.grad})` }}>
        <h2 className="ms-detail-title">{selProj.title_th}</h2>
        {selProj.title_en && <p className="ms-detail-en">{selProj.title_en}</p>}
        <div className="ms-detail-meta-grid">
          {[
            { label:'ผู้จัดทำ',   val: selProj.student_name||selProj.creator_name||'—' },
            { label:'ที่ปรึกษา',  val: selProj.advisor ? `อ.${selProj.advisor}` : '—' },
            { label:'ปีการศึกษา', val: selProj.academic_year||'—' },
            { label:'ระดับชั้น',  val: selProj.project_level||'—' },
          ].map(row => (
            <div key={row.label} className="ms-detail-meta-card">
              <p className="ms-detail-meta-label">{row.label}</p>
              <p className="ms-detail-meta-val">{row.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="ms-detail-section">
        <div className="ms-detail-prog-header">
          <p className="ms-section-label">ความก้าวหน้า</p>
          <span className="ms-detail-pct" style={{ color: cfg.clr }}>{cfg.pct}%</span>
        </div>
        <div className="ms-prog-track" style={{ height:12 }}>
          <div className="ms-prog-fill" style={{ width:`${cfg.pct}%`, background:`linear-gradient(${cfg.grad})` }}/>
        </div>
        <div className="ms-detail-prog-footer">
          <StatusPill status={selProj.progress_status}/>
          <p className="ms-detail-date">
            <ClockCircleOutlined style={{ marginRight:4 }}/>
            อัปเดต {formatFull(selProj.updated_at||selProj.created_at)}
          </p>
        </div>
      </div>

      {/* Milestones */}
      <div className="ms-detail-section">
        <p className="ms-section-label">ขั้นตอน Milestone</p>
        <Steps current={cfg.step} size="small" className="ms-steps"
          status={selProj.progress_status==='ไม่ผ่าน'?'error':isPend?'process':'finish'}
          items={MILESTONES.map(m=>({ title:<span className="ms-step-label">{m.label}</span> }))}/>
      </div>

      {/* Tags */}
      <div className="ms-tags" style={{ padding:'4px 0' }}>
        {selProj.category      && <span className="ms-tag ms-tag-indigo"><AppstoreOutlined style={{ marginRight:4 }}/>{selProj.category}</span>}
        {selProj.project_level && <span className="ms-tag ms-tag-purple"><BookOutlined style={{ marginRight:4 }}/>{selProj.project_level}</span>}
        {selProj.academic_year && <span className="ms-tag ms-tag-blue"><CalendarOutlined style={{ marginRight:4 }}/>ปี {selProj.academic_year}</span>}
      </div>

      {/* Files */}
      <div className="ms-detail-section">
        <p className="ms-section-label">
          <CheckCircleOutlined style={{ color:'#059669', marginRight:6 }}/>ไฟล์งานและลิงก์แนบ
        </p>
        <div className="ms-files">
          {[
            { key:'pdf_file_path', icon:<FilePdfOutlined/>, label:'เอกสาร PDF',        bg:'#fff1f0', bdr:'#ffccc7', btnBg:'linear-gradient(135deg,#cf1322,#dc2626)', text:'เปิดดูไฟล์', href: selProj.pdf_file_path ? getFileUrl(selProj.pdf_file_path) : null },
            { key:'drive_url',     icon:<GoogleOutlined/>,  label:'Google Drive',      bg:'#e6f4ff', bdr:'#91caff', btnBg:'linear-gradient(135deg,#1677ff,#0958d9)', text:'เปิดลิงก์',  href: selProj.drive_url   },
            { key:'video_url',     icon:<YoutubeOutlined/>, label:'YouTube Video',     bg:'#fff7e6', bdr:'#ffd591', btnBg:'linear-gradient(135deg,#d46b08,#e8730a)', text:'ดูวิดีโอ',    href: selProj.video_url   },
            { key:'github_url',    icon:<GithubOutlined/>,  label:'GitHub Repository', bg:'#f8fafc', bdr:'#e2e8f0', btnBg:'linear-gradient(135deg,#1e293b,#334155)', text:'เปิด Repo',   href: selProj.github_url  },
          ].map(f => (
            <div key={f.key} className="ms-file-row" style={{ background: f.bg, borderColor: f.bdr }}>
              <div className="ms-file-name">
                <div className="ms-file-icon">{f.icon}</div>
                <span>{f.label}</span>
              </div>
              {f.href
                /* BUG FIX: ปุ่มลิงก์ใช้ gradient background + text-shadow ให้ชัดขึ้น */
                ? <a href={f.href} target="_blank" rel="noreferrer" onClick={sfx.success}
                    className="ms-file-btn" style={{ background: f.btnBg }}>{f.text}</a>
                : <span className="ms-file-empty">ไม่มีไฟล์</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="ms-detail-section">
        <p className="ms-section-label">
          <ExclamationCircleOutlined style={{ color:'#d97706', marginRight:6 }}/>ข้อเสนอแนะจากอาจารย์
        </p>
        <div className="ms-feedback-box">
          {selProj.feedback?.trim()
            ? <p className="ms-feedback-text">💬 {selProj.feedback}</p>
            : <div className="ms-feedback-empty">
                <ExclamationCircleOutlined/><span>ยังไม่มีข้อเสนอแนะในขณะนี้</span>
              </div>
          }
        </div>
      </div>

      {/* BUG FIX: ปุ่มปิด - เพิ่ม type="button", text-shadow, letter-spacing ให้ชัด */}
      <button type="button" onClick={closeDrawer}
        className="ms-close-btn" style={{ background:`linear-gradient(${cfg.grad})` }}>
        <span>✓ ปิดหน้าต่าง</span>
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   CSS — แก้บัคทุกจุด + ปุ่มอ่านง่ายชัดเจน
══════════════════════════════════════════════════ */
const CSS = `
  /* ─── ROOT ─── */
  .ms-root { min-height:100vh; background:#f1f5f9; font-family:'Sarabun','Noto Sans Thai',sans-serif; }
  .ms-inner { background:transparent; }
  .ms-content { padding:20px 16px; }
  @media(min-width:640px){ .ms-content { padding:24px 24px; } }
  @media(min-width:1024px){ .ms-content { padding:28px 32px; } }
  .ms-container { max-width:1440px; margin:0 auto; display:flex; flex-direction:column; gap:16px; }
  @media(min-width:640px){ .ms-container { gap:20px; } }

  /* ─── HERO ─── */
  .ms-hero {
    position:relative; overflow:hidden; border-radius:20px;
    background:linear-gradient(135deg,#4338ca,#4f46e5,#7c3aed);
    padding:24px 24px 20px; display:flex; flex-wrap:wrap;
    align-items:center; justify-content:space-between; gap:16px;
    box-shadow:0 8px 32px rgba(79,70,229,.3);
  }
  .ms-hero::before {
    content:''; position:absolute; inset:0;
    background:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0,rgba(255,255,255,.04) 1px,transparent 1px,transparent 12px);
    pointer-events:none;
  }
  .ms-hero::after {
    content:''; position:absolute; right:-40px; top:-40px;
    width:200px; height:200px; border-radius:50%;
    background:rgba(255,255,255,.08); filter:blur(30px); pointer-events:none;
  }
  .ms-hero-left { position:relative; z-index:1; display:flex; align-items:center; gap:16px; }
  .ms-hero-icon {
    width:52px; height:52px; border-radius:14px;
    background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; color:#fff; flex-shrink:0;
    animation:float 3s ease-in-out infinite;
  }
  .ms-hero-title { font-size:clamp(20px,4vw,30px); font-weight:900; color:#fff; margin:0; line-height:1.2; }
  .ms-hero-sub   { font-size:clamp(13px,2vw,15px); color:rgba(255,255,255,.75); margin:4px 0 0; }
  .ms-hero-right { position:relative; z-index:1; display:flex; align-items:center; gap:10px; }
  .ms-avg-box {
    background:rgba(255,255,255,.15); backdrop-filter:blur(8px);
    border:1px solid rgba(255,255,255,.2); border-radius:14px;
    padding:10px 18px; text-align:center;
  }
  .ms-avg-label { font-size:11px; font-weight:800; color:rgba(255,255,255,.75); text-transform:uppercase; letter-spacing:.06em; margin:0; }
  .ms-avg-val   { font-size:clamp(28px,5vw,40px); font-weight:900; color:#fff; margin:0; line-height:1.1; }
  /* BUG FIX: reload btn เพิ่ม cursor pointer อย่างชัดเจน */
  .ms-reload-btn {
    width:44px; height:44px; border-radius:12px; border:1.5px solid rgba(255,255,255,.3);
    background:rgba(255,255,255,.18); color:#fff; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:16px;
    transition:all .2s; flex-shrink:0;
  }
  .ms-reload-btn:hover { background:rgba(255,255,255,.3); transform:rotate(15deg); }
  .ms-reload-btn:active { transform:scale(.9); }
  .ms-hero-bar-wrap { position:relative; z-index:1; width:100%; }
  .ms-hero-bar-track { height:6px; background:rgba(255,255,255,.2); border-radius:99px; overflow:hidden; }
  /* BUG FIX: animation progIn แก้ให้ใช้ width transition แทน scaleX เพราะ width เป็น % */
  .ms-hero-bar-fill {
    height:100%; background:rgba(255,255,255,.85); border-radius:99px;
    transition:width 1s cubic-bezier(.34,1.2,.64,1);
    animation:none;
  }

  /* ─── STAT CARDS ─── */
  .ms-stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  @media(min-width:640px)  { .ms-stats-grid { grid-template-columns:repeat(3,1fr); } }
  @media(min-width:1024px) { .ms-stats-grid { grid-template-columns:repeat(5,1fr); } }

  .ms-stat-card {
    background:#fff; border-radius:16px; border:1px solid #e2e8f0;
    overflow:hidden; cursor:pointer; user-select:none;
    transition:all .2s; animation:slideUp .5s ease both;
    box-shadow:0 1px 4px rgba(0,0,0,.05);
  }
  .ms-stat-card:hover { transform:translateY(-4px); box-shadow:0 10px 28px rgba(0,0,0,.12); }
  .ms-stat-card:active { transform:translateY(-1px); }
  .ms-stat-bar { height:4px; background:linear-gradient(var(--grad)); }
  .ms-stat-body { padding:16px; display:flex; align-items:center; gap:12px; }
  .ms-stat-emoji { font-size:28px; flex-shrink:0; animation:floatE 3.5s ease-in-out infinite; }
  .ms-stat-text { min-width:0; }
  .ms-stat-label { font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin:0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  /* BUG FIX: stat value line-height ป้องกันตัวเลขถูกตัด */
  .ms-stat-value { font-size:clamp(28px,4vw,38px); font-weight:900; color:#1e293b; margin:0; line-height:1.15; }

  /* ─── FILTER PANEL ─── */
  .ms-filter-panel {
    background:#fff; border-radius:18px; border:1px solid #e2e8f0;
    box-shadow:0 1px 4px rgba(0,0,0,.04); overflow:hidden;
  }
  .ms-search-row { padding:16px 20px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  @media(min-width:640px){ .ms-search-row { padding:20px 24px; flex-wrap:nowrap; } }
  .ms-search-wrap { flex:1; min-width:200px; position:relative; }
  .ms-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; font-size:15px; }
  .ms-search-input {
    width:100%; padding:11px 40px 11px 42px;
    background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:15px; font-family:inherit; outline:none;
    transition:all .2s; color:#1e293b; font-weight:600;
    box-sizing:border-box;
  }
  .ms-search-input::placeholder { color:#94a3b8; font-weight:500; }
  .ms-search-input:focus { background:#fff; border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
  .ms-search-clear {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    padding:4px 6px; border-radius:8px; border:none; background:transparent;
    cursor:pointer; color:#94a3b8; transition:all .15s; line-height:1;
  }
  .ms-search-clear:hover { background:#f1f5f9; color:#475569; }

  /* BUG FIX: filter-btn ตัวอักษรชัดขึ้น ขนาดสม่ำเสมอ */
  .ms-filter-btn {
    display:flex; align-items:center; gap:8px; padding:11px 18px;
    border-radius:12px; border:1.5px solid #e2e8f0; background:#fff;
    color:#475569; font-weight:800; font-size:14px; cursor:pointer;
    white-space:nowrap; transition:all .2s; font-family:inherit; line-height:1.2;
    flex-shrink:0;
  }
  .ms-filter-btn:hover { border-color:#c7d2fe; color:#4f46e5; background:#f8f7ff; }
  .ms-filter-btn-active { background:#4f46e5; border-color:#4f46e5; color:#fff; }
  .ms-filter-btn-active:hover { background:#4338ca; border-color:#4338ca; color:#fff; }
  /* BUG FIX: badge ตัวเลขบนปุ่มกรอง - ชัดเจน ไม่ซ้อนทับ */
  .ms-filter-badge {
    background:rgba(255,255,255,.35); color:#fff;
    font-size:11px; font-weight:900; line-height:1;
    min-width:20px; height:20px; border-radius:10px;
    display:inline-flex; align-items:center; justify-content:center;
    padding:0 5px;
  }

  .ms-adv-filters {
    padding:16px 20px 20px; border-top:1px solid #f1f5f9;
    display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end;
    animation:filterSlide .2s ease both;
  }
  @media(min-width:640px){ .ms-adv-filters { padding:16px 24px 20px; } }

  /* .ms-fselect-wrap defined below with full-text fix */
  .ms-filter-label { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin-bottom:6px; }
  .ms-ph { color:#94a3b8; font-weight:600; }
  .ms-opt { font-weight:700; color:#334155; }

  /* Ant Design Select - full text, no truncation */
  .ms-sel { width:100%!important; }
  .ms-sel .ant-select-selector {
    border-radius:10px!important; background:#f8fafc!important;
    border-color:#e2e8f0!important; min-height:46px!important;
    height:auto!important; display:flex!important; align-items:center!important;
    font-family:inherit!important; padding-top:6px!important; padding-bottom:6px!important;
  }
  .ms-sel:hover .ant-select-selector { background:#fff!important; border-color:#c7d2fe!important; }
  .ms-sel.ant-select-focused .ant-select-selector { border-color:#6366f1!important; box-shadow:0 0 0 3px rgba(99,102,241,.12)!important; background:#fff!important; }
  /* 核心修复: ป้องกัน truncate — ให้ข้อความแสดงเต็ม */
  .ms-sel .ant-select-selection-item {
    font-weight:700!important; font-size:14px!important; font-family:inherit!important;
    white-space:normal!important; overflow:visible!important; text-overflow:unset!important;
    line-height:1.4!important; word-break:break-word!important; padding-right:8px!important;
  }
  .ms-sel .ant-select-selection-placeholder {
    font-weight:600!important; font-size:14px!important; font-family:inherit!important;
    white-space:normal!important; overflow:visible!important; text-overflow:unset!important;
    line-height:1.4!important; color:#94a3b8!important;
  }
  /* dropdown options - full text */
  .ms-sel-pop .ant-select-item {
    border-radius:8px; margin:2px 6px; font-size:14px!important; font-family:inherit!important;
    white-space:normal!important; word-break:break-word!important; line-height:1.5!important;
    height:auto!important; min-height:36px!important;
  }
  .ms-sel-pop .ant-select-item-option-content {
    white-space:normal!important; overflow:visible!important; text-overflow:unset!important;
    word-break:break-word!important;
  }
  .ms-sel-pop .ant-select-item-option-selected { background:#eef2ff!important; font-weight:800!important; color:#4338ca!important; }
  /* fselect-wrap ให้ขยายตามเนื้อหา */
  .ms-fselect-wrap { flex:1; min-width:160px; }

  /* BUG FIX: clear button ตัวอักษรชัด + gap กับ icon */
  .ms-clear-btn {
    display:flex; align-items:center; gap:8px; padding:0 16px;
    border-radius:10px; border:1.5px solid #fecaca; background:#fff1f2;
    color:#dc2626; font-weight:800; font-size:13px; cursor:pointer; white-space:nowrap;
    transition:all .15s; font-family:inherit; height:46px; line-height:1;
  }
  .ms-clear-btn:hover { background:#fee2e2; border-color:#fca5a5; }
  .ms-clear-btn:active { transform:scale(.97); }

  .ms-result-bar {
    padding:10px 20px; background:#f8fafc; border-top:1px solid #f1f5f9;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;
  }
  @media(min-width:640px){ .ms-result-bar { padding:10px 24px; } }
  .ms-result-text { font-size:13px; color:#64748b; font-weight:700; margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:2px; }
  .ms-result-num  { color:#4f46e5; font-size:15px; margin:0 3px; }
  .ms-result-of   { color:#94a3b8; font-weight:500; margin-left:4px; }
  .ms-active-badge { font-size:12px; font-weight:800; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; padding:3px 12px; border-radius:99px; white-space:nowrap; }

  /* ─── LOADING / EMPTY ─── */
  .ms-loading { background:#fff; border-radius:16px; padding:60px; text-align:center; border:1px solid #e2e8f0; }
  .ms-loading p { margin-top:16px; color:#94a3b8; font-weight:700; font-size:15px; }
  .ms-empty { background:#fff; border-radius:16px; padding:60px; text-align:center; border:2px dashed #e2e8f0; }
  .ms-empty-text { color:#94a3b8; font-weight:700; font-size:16px; margin-bottom:12px; }
  .ms-empty-clear {
    display:inline-flex; align-items:center; gap:6px; padding:9px 18px;
    background:#eef2ff; color:#4f46e5; font-weight:800; font-size:13px;
    border-radius:10px; cursor:pointer; border:1px solid #c7d2fe; transition:all .15s; font-family:inherit;
  }
  .ms-empty-clear:hover { background:#e0e7ff; }

  /* ─── TABLE ─── */
  .ms-mobile-grid { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:640px){ .ms-mobile-grid { grid-template-columns:repeat(2,1fr); } }
  @media(min-width:1280px){ .ms-mobile-grid { display:none; } }
  .ms-table-wrap { display:none; }
  @media(min-width:1280px){ .ms-table-wrap { display:block; background:#fff; border-radius:18px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04); } }

  .ms-table .ant-table { background:transparent!important; }
  .ms-table .ant-table-thead>tr>th { background:#f8fafc!important; padding:14px 18px!important; color:#64748b!important; font-weight:800!important; font-size:13px!important; border-bottom:1px solid #f1f5f9!important; text-transform:uppercase; letter-spacing:.05em; font-family:inherit!important; }
  .ms-table .ant-table-tbody>tr>td { padding:16px 18px!important; border-bottom:1px solid #f8fafc!important; vertical-align:top; font-family:inherit!important; }
  .ms-row { transition:background .15s; }
  .ms-row-even { background:#fff; }
  .ms-row-odd  { background:#fafbff; }
  .ms-row:hover>td { background:#eef2ff!important; }
  .ms-row:hover { box-shadow:inset 3px 0 0 #6366f1; }
  .ms-th { font-size:12px!important; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.06em; }

  /* ─── TABLE CELL CONTENT ─── */
  .ms-cell-info { padding:2px 0; }
  .ms-proj-title { font-weight:800; color:#1e293b; font-size:15px; line-height:1.4; margin:0 0 8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .ms-meta-list  { display:flex; flex-direction:column; gap:4px; margin-bottom:8px; }
  .ms-meta-item  { display:flex; align-items:center; gap:6px; font-size:13px; color:#64748b; font-weight:600; }
  .ms-icon-blue  { color:#60a5fa; flex-shrink:0; }
  .ms-icon-teal  { color:#2dd4bf; flex-shrink:0; }
  .ms-icon-slate { color:#94a3b8; flex-shrink:0; }
  .ms-tags { display:flex; flex-wrap:wrap; gap:6px; }
  .ms-tag { font-size:12px; font-weight:700; padding:3px 10px; border-radius:99px; line-height:1.5; }
  .ms-tag-indigo { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; }
  .ms-tag-purple { background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; }
  .ms-tag-blue   { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }

  .ms-cell-progress { display:flex; flex-direction:column; gap:8px; min-width:160px; }
  .ms-prog-header   { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  .ms-prog-pct      { font-size:20px; font-weight:900; flex-shrink:0; }
  .ms-prog-track    { height:8px; background:#f1f5f9; border-radius:99px; overflow:hidden; width:100%; }
  /* BUG FIX: prog-fill ใช้ transition แทน animation เพราะ width เป็น dynamic value */
  .ms-prog-fill     { height:100%; border-radius:99px; transition:width .8s cubic-bezier(.34,1.2,.64,1); }
  .ms-prog-date     { font-size:12px; color:#94a3b8; font-weight:700; display:flex; align-items:center; margin:0; }

  .ms-milestone-box { background:#f8fafc; border-radius:12px; border:1px solid #f1f5f9; padding:12px; overflow:hidden; }
  .ms-steps .ant-steps-item-title    { font-size:11px!important; line-height:1.4!important; font-family:inherit!important; }
  .ms-steps .ant-steps-item-tail::after { background:#e2e8f0!important; }
  .ms-steps .ant-steps-item-icon     { width:26px!important; height:26px!important; line-height:26px!important; font-size:12px!important; min-width:26px!important; }
  /* BUG FIX: step label color ชัดขึ้น */
  .ms-step-label { font-size:11px; font-weight:700; color:#475569; line-height:1.4; }

  /* BUG FIX: ปุ่มดูรายละเอียด - ตัวอักษรชัดเจน เพิ่ม text-shadow + letter-spacing */
  .ms-view-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:10px; border:none; cursor:pointer;
    font-size:13px; font-weight:800; color:#fff; font-family:inherit;
    transition:all .18s; white-space:nowrap; line-height:1.2;
    box-shadow:0 3px 12px rgba(0,0,0,.2);
    text-shadow:0 1px 2px rgba(0,0,0,.25);
    letter-spacing:.02em;
  }
  .ms-view-btn:hover { transform:scale(1.05); box-shadow:0 6px 18px rgba(0,0,0,.28); }
  .ms-view-btn:active { transform:scale(.96); }

  /* ─── MOBILE CARD ─── */
  .ms-mobile-card {
    background:#fff; border-radius:16px; border:1px solid #e2e8f0;
    overflow:hidden; animation:cardIn .4s ease both;
    box-shadow:0 1px 4px rgba(0,0,0,.05); transition:box-shadow .2s, transform .2s;
  }
  .ms-mobile-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.1); transform:translateY(-2px); }
  .ms-card-bar  { height:5px; }
  .ms-card-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
  .ms-card-top  { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
  .ms-card-title { font-weight:800; color:#1e293b; font-size:15px; line-height:1.4; margin:0; flex:1; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .ms-card-meta  { display:flex; flex-wrap:wrap; gap:6px; }
  .ms-meta-chip  { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; font-weight:700; color:#475569; }
  .ms-chip-teal  { background:#f0fdfa; border-color:#99f6e4; color:#0f766e; }
  .ms-chip-blue  { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
  .ms-chip-indigo{ background:#eef2ff; border-color:#c7d2fe; color:#4338ca; }
  .ms-chip-purple{ background:#f5f3ff; border-color:#ddd6fe; color:#6d28d9; }
  .ms-card-prog  { display:flex; flex-direction:column; gap:6px; }
  .ms-card-prog-header { display:flex; justify-content:space-between; font-size:13px; align-items:center; }

  /* BUG FIX: ปุ่มหลัก card - ตัวอักษรชัดเจน เพิ่ม text-shadow, letter-spacing, gap icon */
  .ms-card-btn {
    width:100%; padding:12px 16px; border-radius:10px; border:none; cursor:pointer;
    font-size:14px; font-weight:800; color:#fff; display:flex; align-items:center;
    justify-content:center; gap:8px; font-family:inherit; transition:all .15s;
    box-shadow:0 4px 14px rgba(0,0,0,.2); line-height:1.2;
    text-shadow:0 1px 3px rgba(0,0,0,.3); letter-spacing:.02em;
  }
  .ms-card-btn:hover { opacity:.92; box-shadow:0 6px 18px rgba(0,0,0,.28); }
  .ms-card-btn:active { transform:scale(.97); box-shadow:0 2px 8px rgba(0,0,0,.2); }

  /* STATUS PILL */
  .ms-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 12px; border-radius:99px; font-size:12px; font-weight:800;
    background:var(--pill-bg); color:var(--pill-txt); border:1px solid var(--pill-bdr);
    white-space:nowrap; line-height:1.5; flex-shrink:0;
  }
  .ms-dot {
    width:7px; height:7px; border-radius:50%; flex-shrink:0;
    background:var(--pill-dot); animation:pdot 2s ease-in-out infinite;
  }

  /* PAGER */
  .ms-pager { padding:12px 20px!important; }
  .ms-pager-info { font-size:12px; font-weight:700; color:#94a3b8; }

  /* ─── DRAWER ─── */
  .ms-drawer .ant-drawer-header { padding:18px 24px; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
  .ms-drawer .ant-drawer-body   { padding:20px; background:#f8fafc; font-family:'Sarabun','Noto Sans Thai',sans-serif; overflow-y:auto; }
  @media(min-width:640px){ .ms-drawer .ant-drawer-body { padding:24px; } }
  .ms-drawer-title { font-weight:800; color:#1e293b; font-size:16px; display:flex; align-items:center; gap:8px; }

  .ms-detail { display:flex; flex-direction:column; gap:16px; padding-bottom:16px; animation:fadeIn .3s ease both; }
  .ms-detail-hero {
    border-radius:16px; padding:22px; color:#fff;
    position:relative; overflow:hidden;
    box-shadow:0 6px 24px rgba(0,0,0,.2);
  }
  .ms-detail-hero::before {
    content:''; position:absolute; inset:0;
    background:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0,rgba(255,255,255,.04) 1px,transparent 1px,transparent 12px);
    pointer-events:none;
  }
  .ms-detail-title { font-weight:900; font-size:clamp(17px,3vw,22px); line-height:1.35; margin:0 0 6px; position:relative; z-index:1; }
  .ms-detail-en    { color:rgba(255,255,255,.75); font-size:14px; margin:0 0 16px; position:relative; z-index:1; }
  .ms-detail-meta-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; position:relative; z-index:1; }
  @media(min-width:480px){ .ms-detail-meta-grid { grid-template-columns:repeat(4,1fr); } }
  .ms-detail-meta-card { background:rgba(255,255,255,.18); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.2); border-radius:10px; padding:10px 12px; }
  .ms-detail-meta-label { font-size:10px; font-weight:800; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.06em; margin:0 0 3px; }
  /* BUG FIX: meta val font ชัดขึ้น */
  .ms-detail-meta-val   { font-weight:800; color:#fff; font-size:14px; margin:0; line-height:1.35; word-break:break-word; }

  .ms-detail-section { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:16px; display:flex; flex-direction:column; gap:10px; }
  .ms-section-label  { font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin:0; display:flex; align-items:center; }
  .ms-detail-prog-header { display:flex; align-items:center; justify-content:space-between; }
  .ms-detail-pct     { font-size:32px; font-weight:900; line-height:1; }
  .ms-detail-prog-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .ms-detail-date    { font-size:12px; color:#94a3b8; font-weight:700; display:flex; align-items:center; margin:0; }

  /* BUG FIX: file-row layout ปรับให้ responsive บนมือถือ */
  .ms-files { display:flex; flex-direction:column; gap:8px; }
  .ms-file-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 16px; border-radius:12px; border:1px solid; gap:12px;
    flex-wrap:wrap;
  }
  .ms-file-name { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:700; color:#334155; flex:1; min-width:0; }
  .ms-file-icon { background:#fff; padding:8px; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,.08); font-size:15px; flex-shrink:0; line-height:1; }

  /* BUG FIX: ปุ่มลิงก์ไฟล์ - text ชัดเจน, letter-spacing, text-shadow */
  .ms-file-btn {
    color:#fff; font-size:13px; font-weight:800; padding:8px 16px;
    border-radius:8px; text-decoration:none; white-space:nowrap;
    transition:all .15s; display:inline-flex; align-items:center;
    line-height:1.2; letter-spacing:.02em;
    text-shadow:0 1px 2px rgba(0,0,0,.3);
    box-shadow:0 2px 8px rgba(0,0,0,.2);
    flex-shrink:0;
  }
  .ms-file-btn:hover { opacity:.85; color:#fff; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.28); }
  .ms-file-btn:active { transform:scale(.96); }
  .ms-file-empty { color:#94a3b8; font-size:12px; background:#f8fafc; padding:7px 14px; border-radius:8px; border:1px solid #e2e8f0; font-weight:700; white-space:nowrap; flex-shrink:0; }

  .ms-feedback-box { background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:16px; min-height:80px; }
  .ms-feedback-text { font-size:15px; color:#1e293b; white-space:pre-wrap; line-height:1.7; margin:0; }
  .ms-feedback-empty { display:flex; align-items:center; justify-content:center; gap:8px; padding:16px 0; color:#94a3b8; font-style:italic; font-size:14px; opacity:.7; }

  /* BUG FIX: ปุ่มปิด Drawer - ตัวอักษรชัด text-shadow + letter-spacing */
  .ms-close-btn {
    width:100%; padding:14px 20px; border-radius:12px; border:none; cursor:pointer;
    font-size:16px; font-weight:900; color:#fff; font-family:inherit;
    transition:all .15s; box-shadow:0 4px 16px rgba(0,0,0,.22); line-height:1.2;
    text-shadow:0 1px 3px rgba(0,0,0,.3); letter-spacing:.03em; display:flex;
    align-items:center; justify-content:center;
  }
  .ms-close-btn:hover { opacity:.92; box-shadow:0 6px 20px rgba(0,0,0,.3); }
  .ms-close-btn:active { transform:scale(.98); box-shadow:0 2px 8px rgba(0,0,0,.2); }

  /* ─── ANIMATIONS ─── */
  @keyframes slideDown   { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
  @keyframes slideUp     { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:none} }
  @keyframes cardIn      { from{opacity:0;transform:translateX(-8px)}  to{opacity:1;transform:none} }
  @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes floatE      { 0%,100%{transform:translateY(0)rotate(0)} 50%{transform:translateY(-5px)rotate(3deg)} }
  @keyframes fadeIn      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes filterSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
  @keyframes pdot        { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spk         { 0%{opacity:1;transform:translate(-50%,-50%)} 100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))scale(0)} }

  .ms-spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ─── SCROLLBAR ─── */
  ::-webkit-scrollbar       { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#c7d2fe; border-radius:99px; }
  ::-webkit-scrollbar-thumb:hover { background:#6366f1; }

  /* ─── ACCESSIBILITY ─── */
  button:focus-visible { outline:2px solid #6366f1; outline-offset:2px; }
  a:focus-visible { outline:2px solid #6366f1; outline-offset:2px; }
`;

export default MilestonePage;