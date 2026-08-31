import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layout, Table, Tag, Button, Input, Select,
  Steps, Drawer, Typography, message, Spin, Empty
} from 'antd';
import {
  SearchOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, AuditOutlined, UserOutlined,
  FilePdfOutlined, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  DashboardOutlined, BellOutlined, CloseOutlined, ClockCircleOutlined,
  CheckOutlined, FilterOutlined, EyeOutlined, CalendarOutlined,
  TeamOutlined, StarOutlined, ReloadOutlined, ClearOutlined
} from '@ant-design/icons';
import Studentbar from '../StudentPage/Studentbar';
import { getAllProjects } from '../services/projectService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* ══════════════════════════════════════════════
   🔊  Web Audio SFX
══════════════════════════════════════════════ */
const sfx = (() => {
  let ctx = null;
  const g = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };
  const play = (fn) => { try { fn(g()); } catch (_) {} };
  const osc = (c, type, freq, start, dur, vol = 0.18) => {
    const o = c.createOscillator(), gain = c.createGain();
    o.type = type; o.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(gain); gain.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  };
  return {
    pop:    () => play(c => { osc(c,'triangle',400,0,.05,.22); osc(c,'sine',800,.04,.08,.12); }),
    select: () => play(c => { osc(c,'sine',660,0,.07,.14); osc(c,'sine',880,.06,.08,.09); }),
    open:   () => play(c => { [523,659,784].forEach((f,i) => osc(c,'sine',f,i*.08,.2,.12)); }),
    close:  () => play(c => { [784,659,523].forEach((f,i) => osc(c,'sine',f,i*.06,.18,.10)); }),
    notif:  () => play(c => { osc(c,'sine',880,0,.12,.16); osc(c,'sine',1108,.10,.15,.10); }),
    clear:  () => play(c => { osc(c,'sawtooth',300,0,.12,.08); osc(c,'sine',200,.10,.10,.06); }),
    card:   () => play(c => { osc(c,'sine',550,0,.06,.12); }),
  };
})();

/* ══════════════════════════════════════════════
   ✨  Particle Burst
══════════════════════════════════════════════ */
const EMOJI_SET = ['✨','⭐','🌸','💫','🎉','🌟','💖','🎊'];
const Particles = ({ x, y, active }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360;
        const dist  = 40 + Math.random() * 60;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist - 30;
        return (
          <span key={i} style={{
            position: 'absolute',
            left: x, top: y,
            fontSize: `${12 + (i % 3) * 6}px`,
            transform: 'translate(-50%,-50%)',
            animation: `pBurst 0.8s cubic-bezier(.16,1,.3,1) ${i * 30}ms both`,
            '--dx': `${dx}px`, '--dy': `${dy}px`,
          }}>{EMOJI_SET[i % EMOJI_SET.length]}</span>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════
   🔔  Notification helpers
══════════════════════════════════════════════ */
const generateNotifications = (projects) => {
  const notifs = [];
  projects.forEach(p => {
    if (p.progress_status?.includes('รออนุมัติ'))
      notifs.push({ id:`p-${p.project_id}`, type:'warning', icon:'⏳', title:'รอการอนุมัติ',
        message:`"${(p.title_th||'').slice(0,30)}..." อยู่ระหว่างรออนุมัติ`,
        time: p.updated_at || p.created_at, read:false });
    if (p.progress_status === 'สมบูรณ์')
      notifs.push({ id:`d-${p.project_id}`, type:'success', icon:'✅', title:'โครงงานสำเร็จ!',
        message:`"${(p.title_th||'').slice(0,30)}..." ได้รับการอนุมัติแล้ว`,
        time: p.updated_at || p.created_at, read:false });
    if (p.feedback?.trim())
      notifs.push({ id:`f-${p.project_id}`, type:'info', icon:'💬', title:'มีข้อเสนอแนะใหม่',
        message:`อาจารย์แสดงความคิดเห็นใน "${(p.title_th||'').slice(0,25)}..."`,
        time: p.updated_at || p.created_at, read:false });
  });
  return notifs.sort((a,b) => new Date(b.time) - new Date(a.time));
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d), now = new Date(), diff = now - dt;
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000);
  if (m < 1) return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  if (day < 7) return `${day} วันที่แล้ว`;
  return dt.toLocaleDateString('th-TH',{ year:'numeric',month:'short',day:'numeric' });
};
const formatFull = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('th-TH',{ year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' });
};

/* ── Status Config ── */
const S_CFG = {
  'สมบูรณ์':         { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200', dot:'#10b981', step:4 },
  'รออนุมัติเล่ม':   { bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200',  dot:'#8b5cf6', step:3 },
  'กำลังทำ':         { bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',    dot:'#3b82f6', step:2 },
  'รออนุมัติหัวข้อ': { bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',   dot:'#f59e0b', step:1 },
  'ไม่ผ่าน':          { bg:'bg-red-50',     text:'text-red-700',     border:'border-red-200',     dot:'#ef4444', step:1 },
};
const getCfg = (s) => S_CFG[s] || { bg:'bg-slate-50', text:'text-slate-600', border:'border-slate-200', dot:'#94a3b8', step:0 };

const StatusBadge = ({ status }) => {
  const c = getCfg(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot, boxShadow:`0 0 0 3px ${c.dot}22` }}/>
      {status || 'ไม่ระบุ'}
    </span>
  );
};

/* ── Milestone steps ── */
const MILESTONES = ['เสนอหัวข้อ','ออกแบบระบบ','พัฒนา 50%','พัฒนา 100%','ส่งเล่มสมบูรณ์'];

/* ── file URL helper ── */
const getFileUrl = (path) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || 'https://reg.utc.ac.th').replace(/\/api\/?$/, '');
  return `${base}/uploads/pdf/${path}`;
};

/* ── SelectBox component ── */
const FilterSelect = ({ label, icon, value, onChange, options, allLabel = 'ทั้งหมด', allValue = '' }) => (
  <div className="flex-1 min-w-[140px]">
    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
      {icon}{label}
    </label>
    <Select
      size="large"
      value={value || allValue}
      onChange={v => { onChange(v || null); sfx.select(); }}
      className="w-full fsel"
      suffixIcon={<FilterOutlined className="text-slate-400 text-xs"/>}
      dropdownStyle={{ borderRadius:14, boxShadow:'0 20px 60px -10px rgba(99,102,241,.2)' }}
    >
      <Option value={allValue}><span className="font-bold text-slate-400">{allLabel}</span></Option>
      {options.map(o => (
        <Option key={o.value} value={o.value}>
          <span className="font-bold">{o.label}</span>
        </Option>
      ))}
    </Select>
  </div>
);

/* ══════════════════════════════════════════════
   🏠  MAIN COMPONENT
══════════════════════════════════════════════ */
const ProjectArchive = () => {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchText,  setSearchText]  = useState('');
  const [filterStatus,setFilterStatus]= useState(null);
  const [filterYear,  setFilterYear]  = useState(null);
  const [filterAdv,   setFilterAdv]   = useState(null);
  const [myOnly,      setMyOnly]      = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [selProj,     setSelProj]     = useState(null);

  const [notifs,      setNotifs]      = useState([]);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const notifRef = useRef(null);

  const [burst,       setBurst]       = useState({ active:false, x:0, y:0 });
  const burstTimeout  = useRef(null);

  /* ── load user ── */
  useEffect(() => {
    const stored = localStorage.getItem('user') || localStorage.getItem('userInfo') || sessionStorage.getItem('user');
    if (stored) {
      try { const u = JSON.parse(stored); setCurrentUser(u); } catch (_) {}
    }
  }, []);

  /* ── fetch ── */
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res && Array.isArray(res.data)) data = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      setProjects(data);
      setNotifs(generateNotifications(data));
    } catch (e) {
      console.error(e);
      message.error('ไม่สามารถดึงข้อมูลได้');
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  /* ── close notif on outside click ── */
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── derived option lists ── */
  const yearOpts = [...new Set(projects.map(p=>p.academic_year).filter(Boolean))]
    .sort((a,b)=>b-a).map(y=>({ value:String(y), label:`ปีการศึกษา ${y}` }));

  const advOpts = [...new Set(projects.map(p=>p.advisor).filter(Boolean))]
    .sort().map(a=>({ value:a, label:`อ.${a}` }));

  const statusOpts = Object.keys(S_CFG).map(s=>({ value:s, label:s }));

  /* ── filter pipeline ── */
  const filtered = projects.filter(p => {
    const q = searchText.toLowerCase();
    const matchSearch = !searchText || (
      (p.title_th||'').toLowerCase().includes(q) ||
      (p.student_name||p.creator_name||'').toLowerCase().includes(q) ||
      (p.advisor||'').toLowerCase().includes(q)
    );
    const userId = currentUser?.id || currentUser?.user_id;
    const matchMy  = !myOnly || Number(p.created_by) === Number(userId);
    const matchSt  = !filterStatus || p.progress_status === filterStatus;
    const matchYr  = !filterYear   || String(p.academic_year) === String(filterYear);
    const matchAdv = !filterAdv    || p.advisor === filterAdv;
    return matchSearch && matchMy && matchSt && matchYr && matchAdv;
  });

  const activeFilters = [filterStatus,filterYear,filterAdv,myOnly?'1':null].filter(Boolean).length;

  const clearAll = () => {
    setFilterStatus(null); setFilterYear(null); setFilterAdv(null);
    setMyOnly(false); setSearchText('');
    sfx.clear();
  };

  /* ── open drawer ── */
  const openDrawer = (p, e) => {
    sfx.open(); setSelProj(p); setDrawerOpen(true);
    if (e) {
      const r = e.currentTarget.getBoundingClientRect();
      clearTimeout(burstTimeout.current);
      setBurst({ active:true, x: r.left + r.width/2, y: r.top + r.height/2 });
      burstTimeout.current = setTimeout(() => setBurst(b=>({...b,active:false})), 900);
    }
  };

  /* ── my-only toggle burst ── */
  const toggleMy = (e) => {
    const next = !myOnly; setMyOnly(next); sfx.pop();
    if (next) {
      const r = e.currentTarget.getBoundingClientRect();
      clearTimeout(burstTimeout.current);
      setBurst({ active:true, x:r.left+r.width/2, y:r.top+r.height/2 });
      burstTimeout.current = setTimeout(()=>setBurst(b=>({...b,active:false})),900);
    }
  };

  const unread = notifs.filter(n=>!n.read).length;

  /* ── STAT CARDS ── */
  const stats = [
    { label:'ทั้งหมด',   val:projects.length,                                              grad:'from-indigo-500 to-blue-500',    emoji:'📚' },
    { label:'รอดำเนินการ',val:projects.filter(p=>p.progress_status?.includes('รอ')).length, grad:'from-amber-400 to-orange-400',   emoji:'⏳' },
    { label:'กำลังทำ',    val:projects.filter(p=>p.progress_status==='กำลังทำ').length,     grad:'from-blue-500 to-cyan-400',      emoji:'⚡' },
    { label:'สำเร็จแล้ว', val:projects.filter(p=>p.progress_status==='สมบูรณ์').length,     grad:'from-emerald-500 to-teal-400',   emoji:'✅' },
  ];

  /* ── DESKTOP TABLE COLUMNS ── */
  const columns = [
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest uppercase">ข้อมูลโครงงาน</span>,
      key:'info', width:'36%',
      render:(_,r) => {
        const isMe = Number(r.created_by) === Number(currentUser?.id || currentUser?.user_id);
        return (
          <div className="py-1">
            {isMe && (
              <span className="inline-flex items-center gap-1 mb-1.5 text-[10px] font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                <StarOutlined/> ชิ้นงานของฉัน
              </span>
            )}
            <p className="font-black text-slate-800 text-sm leading-snug line-clamp-2 mb-2">{r.title_th}</p>
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><UserOutlined className="text-indigo-300 shrink-0"/>{r.student_name||r.creator_name||'—'}</span>
              {r.advisor && <span className="flex items-center gap-1.5"><AuditOutlined className="text-teal-400 shrink-0"/>อ.{r.advisor}</span>}
              {r.academic_year && <span className="flex items-center gap-1.5"><CalendarOutlined className="text-slate-300 shrink-0"/>ปีการศึกษา {r.academic_year}</span>}
            </div>
          </div>
        );
      }
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest uppercase">ความคืบหน้า</span>,
      key:'milestone', width:'44%',
      render:(_,r) => {
        const cfg = getCfg(r.progress_status);
        const isPending = r.progress_status?.includes('รอ');
        return (
          <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <StatusBadge status={r.progress_status}/>
              <span className="text-[10px] text-slate-400 bg-white px-2.5 py-1 rounded-xl border border-slate-100 flex items-center gap-1 font-bold">
                <ClockCircleOutlined/> {formatDate(r.updated_at||r.created_at)}
              </span>
            </div>
            <Steps current={cfg.step} size="small" className="csteps"
              status={r.progress_status==='ไม่ผ่าน'?'error':isPending?'process':'finish'}
              items={MILESTONES.map(m=>({ title:<span className="text-[9px] font-bold text-slate-500 leading-tight">{m}</span> }))}/>
          </div>
        );
      }
    },
    {
      title: <span className="font-black text-slate-500 text-xs tracking-widest uppercase block text-center">จัดการ</span>,
      key:'action', width:'20%', align:'center',
      render:(_,r) => {
        const isPending = r.progress_status?.includes('รอ');
        const isMe = Number(r.created_by) === Number(currentUser?.id || currentUser?.user_id);
        return (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={e => openDrawer(r, e)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                          hover:scale-105 active:scale-95 hover:shadow-lg
                          ${isPending
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-orange-100 shadow-md'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-100 shadow-md'}`}>
              <EyeOutlined className="group-hover:scale-110 transition-transform"/>
              รายละเอียด
            </button>
            {isMe && (
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <StarOutlined/> ของฉัน
              </span>
            )}
          </div>
        );
      }
    },
  ];

  /* ── MOBILE CARD ── */
  const MobileCard = ({ r, idx }) => {
    const cfg = getCfg(r.progress_status);
    const isMe = Number(r.created_by) === Number(currentUser?.id || currentUser?.user_id);
    const isPending = r.progress_status?.includes('รอ');
    return (
      <div
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md
                    ${isMe ? 'border-l-4 border-l-indigo-400 border-slate-100' : 'border-slate-100'}
                    ${isPending ? 'ring-1 ring-amber-200' : ''}`}
        style={{ animation:`cardSlide .4s ease ${idx*.06}s both` }}>
        <div className={`h-1 bg-gradient-to-r ${isPending?'from-amber-400 to-orange-400':'from-indigo-500 to-purple-500'}`}/>
        <div className="p-4">
          {isMe && (
            <span className="inline-flex items-center gap-1 mb-2 text-[10px] font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
              <StarOutlined/> ชิ้นงานของฉัน
            </span>
          )}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-black text-slate-800 text-sm leading-snug flex-1 line-clamp-2">{r.title_th}</p>
            <StatusBadge status={r.progress_status}/>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <UserOutlined className="text-indigo-300"/>{r.student_name||r.creator_name||'—'}
            </span>
            {r.advisor && (
              <span className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 text-teal-700 font-bold">
                <AuditOutlined/>อ.{r.advisor}
              </span>
            )}
            {r.academic_year && (
              <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 text-blue-700 font-bold">
                <CalendarOutlined/>ปี {r.academic_year}
              </span>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
            <Steps current={cfg.step} size="small" className="csteps"
              status={r.progress_status==='ไม่ผ่าน'?'error':isPending?'process':'finish'}
              items={MILESTONES.map(m=>({ title:<span className="text-[9px] font-bold text-slate-500">{m}</span> }))}/>
          </div>
          <button onClick={e=>openDrawer(r,e)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                        active:scale-95 hover:opacity-90
                        ${isPending
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'}`}>
            <EyeOutlined/>ดูรายละเอียด
          </button>
        </div>
      </div>
    );
  };

  /* ── NOTIFICATION PANEL ── */
  const NotifPanel = () => (
    <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
         style={{ animation:'slideDown .22s cubic-bezier(.34,1.56,.64,1)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <BellOutlined className="text-indigo-500"/>
          <span className="font-black text-slate-800">การแจ้งเตือน</span>
          {unread>0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{unread}</span>}
        </div>
        {unread>0 && (
          <button onClick={()=>{setNotifs(p=>p.map(n=>({...n,read:true}))); sfx.pop();}}
            className="text-xs text-indigo-600 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors">
            <CheckOutlined/> อ่านทั้งหมด
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifs.length===0 ? (
          <div className="py-12 text-center text-slate-400">
            <BellOutlined className="text-4xl opacity-20 mb-3 block"/>
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} onClick={()=>{setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x)); sfx.card();}}
            className={`flex gap-3 px-5 py-3.5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50
                        ${!n.read?'bg-indigo-50/30':''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0
                            ${n.type==='success'?'bg-emerald-100':n.type==='warning'?'bg-amber-100':'bg-blue-100'}`}>{n.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-black ${!n.read?'text-slate-800':'text-slate-500'}`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse"/>}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><ClockCircleOutlined/>{formatDate(n.time)}</p>
            </div>
          </div>
        ))}
      </div>
      {notifs.length>0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <button onClick={()=>{setNotifs([]); sfx.clear();}} className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">
            ล้างการแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}
    </div>
  );

  /* ════════════════ RENDER ════════════════ */
  return (
    <Layout className="min-h-screen font-sans bg-[#f0f4ff]">
      <Studentbar/>
      <Layout className="bg-transparent">
        <Content className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-5">

            <Particles {...burst}/>

            {/* ── HEADER ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
                 style={{ animation:'slideUp .5s ease both' }}>
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ backgroundSize:'200%', animation:'gradShift 4s ease infinite' }}/>
              <div className="px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 shrink-0"
                       style={{ animation:'float 3s ease-in-out infinite' }}>
                    <DashboardOutlined className="text-2xl text-white"/>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 m-0">ติดตามความคืบหน้าโครงงาน</h1>
                    <p className="text-slate-400 text-sm mt-0.5">ตรวจสอบ Milestone และจัดการไฟล์งาน</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Stats mini */}
                  <div className="flex gap-2">
                    {[
                      { label:'รอ', val:projects.filter(p=>p.progress_status?.includes('รอ')).length, bg:'bg-amber-50 border-amber-100', text:'text-amber-600' },
                      { label:'สำเร็จ', val:projects.filter(p=>p.progress_status==='สมบูรณ์').length, bg:'bg-emerald-50 border-emerald-100', text:'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} border px-3 py-2 rounded-xl text-center min-w-[72px]`}>
                        <p className={`text-[10px] font-black ${s.text} uppercase tracking-wider`}>{s.label}</p>
                        <p className={`text-2xl font-black ${s.text}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Refresh */}
                  <button onClick={()=>{fetchProjects(); sfx.pop();}}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all active:scale-90 hover:shadow-md">
                    <ReloadOutlined className={loading?'animate-spin':''}/>
                  </button>
                  {/* Bell */}
                  <div className="relative" ref={notifRef}>
                    <button onClick={()=>{setNotifOpen(v=>!v); sfx.notif();}}
                      className={`relative p-2.5 rounded-xl border transition-all active:scale-90
                                  ${notifOpen?'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-200':'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'}`}>
                      <BellOutlined className="text-lg"/>
                      {unread>0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black animate-pulse">{unread>9?'9+':unread}</span>}
                    </button>
                    {notifOpen && <NotifPanel/>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s,i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default"
                     style={{ animation:`cardSlide .4s ease ${i*.08}s both` }}>
                  <div className={`h-1.5 bg-gradient-to-r ${s.grad}`}/>
                  <div className="p-4 flex items-center gap-3">
                    <span className="text-2xl select-none" style={{ animation:`float ${3+i*.5}s ease-in-out infinite` }}>{s.emoji}</span>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <p className="text-3xl font-black text-slate-800">{s.val}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── FILTER BAR ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6"
                 style={{ animation:'slideUp .5s .1s ease both' }}>

              {/* Search */}
              <div className="relative mb-4">
                <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                <input type="text" value={searchText}
                  onChange={e=>setSearchText(e.target.value)}
                  placeholder="ค้นหาชื่อโครงงาน, ผู้จัดทำ, อาจารย์..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm
                             focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"/>
                {searchText && (
                  <button onClick={()=>setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-lg transition-colors">
                    <CloseOutlined className="text-slate-400 text-xs"/>
                  </button>
                )}
              </div>

              {/* Filter row */}
              <div className="flex flex-wrap gap-3 items-end">
                <FilterSelect label="ปีการศึกษา"  icon={<CalendarOutlined/>}
                  value={filterYear}  onChange={setFilterYear}
                  options={yearOpts}  allLabel="ทุกปีการศึกษา"/>

                <FilterSelect label="ที่ปรึกษา" icon={<AuditOutlined/>}
                  value={filterAdv}  onChange={setFilterAdv}
                  options={advOpts}  allLabel="ที่ปรึกษาทุกคน"/>

                <FilterSelect label="สถานะ" icon={<FilterOutlined/>}
                  value={filterStatus} onChange={setFilterStatus}
                  options={statusOpts} allLabel="ทุกสถานะ"/>

                {/* My only toggle */}
                <div className="flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    <StarOutlined/>ชิ้นงาน
                  </label>
                  <button onClick={toggleMy}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95 hover:shadow-md
                                ${myOnly
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-500 shadow-md shadow-indigo-200/50'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                    <StarOutlined className={myOnly?'text-yellow-300':''}/>
                    ชิ้นงานของฉัน
                    {myOnly && <span className="text-xs bg-white/30 rounded-full px-1.5 py-0.5 font-black">
                      {projects.filter(p=>Number(p.created_by)===Number(currentUser?.id||currentUser?.user_id)).length}
                    </span>}
                  </button>
                </div>

                {/* Clear */}
                {(activeFilters > 0 || searchText) && (
                  <div className="flex-shrink-0">
                    <label className="flex items-center gap-1 text-[10px] font-black text-transparent uppercase tracking-widest mb-1.5 select-none">__</label>
                    <button onClick={clearAll}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold text-red-500 bg-red-50 border-red-200 hover:bg-red-100 transition-all active:scale-95">
                      <ClearOutlined/> ล้างทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {/* Result info */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                  <SearchOutlined/>
                  พบ <span className="text-indigo-600 font-black text-sm mx-1">{filtered.length}</span> โครงงาน
                  {projects.length !== filtered.length && <span className="text-slate-300">จาก {projects.length} ทั้งหมด</span>}
                </p>
                {activeFilters > 0 && (
                  <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    กรองอยู่ {activeFilters} เงื่อนไข
                  </span>
                )}
              </div>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
              <div className="bg-white rounded-2xl py-24 text-center border border-slate-100">
                <Spin size="large"/>
                <p className="mt-4 text-slate-400 font-bold">กำลังโหลดข้อมูล...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl py-20 text-center border border-dashed border-slate-200">
                <Empty description={
                  <div className="space-y-3">
                    <p className="text-slate-400 font-bold">ไม่พบโครงงานที่ตรงกับเงื่อนไข</p>
                    {(activeFilters > 0 || searchText) && (
                      <button onClick={clearAll}
                        className="mx-auto flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
                        <ClearOutlined/> ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                }/>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                  {filtered.map((p,i) => <MobileCard key={p.project_id} r={p} idx={i}/>)}
                </div>
                {/* Desktop */}
                <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
                     style={{ animation:'slideUp .5s .15s ease both' }}>
                  <Table columns={columns} dataSource={filtered} rowKey="project_id"
                    pagination={{ pageSize:10, className:'px-6 pb-4',
                      showTotal:(t,r)=><span className="text-xs font-bold text-slate-400">แสดง {r[0]}–{r[1]} จาก {t}</span> }}
                    className="dtbl"
                    rowClassName={(_,i) => `dtrow ${i%2===0?'bg-white':'bg-slate-50/30'}`}/>
                </div>
              </>
            )}

          </div>
        </Content>
      </Layout>

      {/* ── DRAWER ── */}
      <Drawer
        title={
          <div className="font-black text-slate-800 flex items-center gap-2">
            <AuditOutlined className="text-indigo-500"/>
            รายละเอียดและการส่งงาน
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 760}
        onClose={() => { setDrawerOpen(false); sfx.close(); }}
        open={drawerOpen}
        className="cdrawer"
        closeIcon={<CloseOutlined className="text-slate-400 hover:text-red-500 transition-colors"/>}
      >
        {selProj && (
          <div className="space-y-6 pb-10" style={{ animation:'fadeIn .35s ease both' }}>
            {/* Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 opacity-5 text-[130px]"><AuditOutlined/></div>
              <h2 className="font-black text-indigo-900 text-lg leading-snug mb-4">{selProj.title_th}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label:'ผู้จัดทำ', val: selProj.student_name||selProj.creator_name||'—' },
                  { label:'อาจารย์ที่ปรึกษา', val: selProj.advisor ? `อ.${selProj.advisor}` : '—' },
                  { label:'ปีการศึกษา', val: selProj.academic_year||'—' },
                  { label:'อัปเดต', val: formatFull(selProj.updated_at||selProj.created_at) },
                ].map(r => (
                  <div key={r.label} className="bg-white/80 p-3 rounded-xl border border-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{r.label}</p>
                    <p className="font-bold text-slate-800 text-sm">{r.val}</p>
                  </div>
                ))}
                <div className="bg-white/80 p-3 rounded-xl border border-white sm:col-span-2 flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">สถานะปัจจุบัน</span>
                  <StatusBadge status={selProj.progress_status}/>
                </div>
              </div>
            </div>

            {/* Milestone */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ความคืบหน้า</p>
              <Steps current={getCfg(selProj.progress_status).step} size="small" className="csteps"
                status={selProj.progress_status==='ไม่ผ่าน'?'error':selProj.progress_status?.includes('รอ')?'process':'finish'}
                items={MILESTONES.map(m=>({ title:<span className="text-xs font-bold text-slate-600">{m}</span> }))}/>
            </div>

            {/* Files */}
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-500"/>ไฟล์งานและลิงก์แนบ
              </p>
              <div className="space-y-2.5">
                {[
                  { key:'pdf_file_path', icon:<FilePdfOutlined/>, label:'เอกสาร PDF', bg:'bg-red-50', border:'border-red-100', btnBg:'bg-red-500', href:selProj.pdf_file_path?getFileUrl(selProj.pdf_file_path):null, btnText:'เปิดดูไฟล์' },
                  { key:'drive_url',     icon:<GoogleOutlined/>,  label:'Google Drive', bg:'bg-blue-50', border:'border-blue-100', btnBg:'bg-blue-500', href:selProj.drive_url, btnText:'เปิดลิงก์' },
                  { key:'video_url',     icon:<YoutubeOutlined/>, label:'YouTube Video', bg:'bg-orange-50', border:'border-orange-100', btnBg:'bg-orange-500', href:selProj.video_url, btnText:'ดูวิดีโอ' },
                  { key:'github_url',    icon:<GithubOutlined/>,  label:'GitHub Repository', bg:'bg-slate-50', border:'border-slate-200', btnBg:'bg-slate-700', href:selProj.github_url, btnText:'เปิด Repo' },
                ].map(item => (
                  <div key={item.key}
                    className={`flex items-center justify-between p-3.5 ${item.bg} rounded-xl border ${item.border} hover:shadow-sm transition-all`}>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-base">{item.icon}</div>
                      {item.label}
                    </div>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer"
                        onClick={sfx.pop}
                        className={`${item.btnBg} text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm`}>
                        {item.btnText}
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-bold">ไม่มีไฟล์</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ExclamationCircleOutlined className="text-amber-500"/>ข้อเสนอแนะจากอาจารย์
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 min-h-[90px]">
                {selProj.feedback?.trim() ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed m-0">
                    <span className="text-lg mr-2">💬</span>{selProj.feedback}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-400 opacity-60">
                    <AuditOutlined className="text-3xl mb-2"/>
                    <p className="italic text-sm">ยังไม่มีข้อเสนอแนะในขณะนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <style>{`
        @keyframes slideUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes cardSlide  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes gradShift  { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes slideDown  { from{opacity:0;transform:translateY(-10px)scale(.97)} to{opacity:1;transform:none} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pBurst     { 0%{opacity:1;transform:translate(-50%,-50%)} 100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)} }

        /* Table */
        .dtbl .ant-table { background:transparent!important; }
        .dtbl .ant-table-thead>tr>th {
          background:#f8fafc!important; padding:14px 20px!important;
          color:#64748b!important; font-weight:800!important; font-size:11px!important;
          border-bottom:1px solid #f1f5f9!important; letter-spacing:.05em; text-transform:uppercase;
        }
        .dtbl .ant-table-tbody>tr>td { padding:16px 20px!important; border-bottom:1px solid #f8fafc!important; vertical-align:top; }
        .dtrow { transition:background .15s, box-shadow .15s; }
        .dtrow:hover>td { background:#eef2ff!important; }
        .dtrow:hover { box-shadow:inset 3px 0 0 #6366f1; }

        /* Steps */
        .csteps .ant-steps-item-title { line-height:18px!important; }
        .csteps .ant-steps-item-tail::after { background-color:#e2e8f0!important; }
        .csteps .ant-steps-item-icon { width:22px!important; height:22px!important; line-height:22px!important; font-size:11px!important; }

        /* FilterSelect */
        .fsel .ant-select-selector {
          border-radius:12px!important; background:#f8fafc!important;
          border-color:#e2e8f0!important; height:44px!important; align-items:center;
          transition:all .2s!important;
        }
        .fsel:hover .ant-select-selector { background:#fff!important; border-color:#c7d2fe!important; }
        .fsel.ant-select-focused .ant-select-selector { border-color:#6366f1!important; box-shadow:0 0 0 3px rgba(99,102,241,.15)!important; background:#fff!important; }
        .fsel .ant-select-selection-item { font-weight:700!important; color:#1e293b!important; }
        .fsel .ant-select-arrow { color:#94a3b8!important; }

        /* Drawer */
        .cdrawer .ant-drawer-header { padding:20px 24px; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
        .cdrawer .ant-drawer-body   { padding:24px; background:#fafbfc; }
        @media(max-width:640px){ .cdrawer .ant-drawer-body { padding:16px; } }

        /* Scrollbar */
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#c7d2fe; border-radius:99px; }
      `}</style>
    </Layout>
  );
};

export default ProjectArchive;