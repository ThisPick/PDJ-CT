import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Tag, Typography, message,
  Button, Modal, Input, Empty,
  Radio, Avatar, Tooltip, Table, Drawer
} from 'antd';
import {
  FileTextOutlined, TeamOutlined,
  ClockCircleOutlined,
  FilePdfOutlined, SafetyCertificateFilled,
  ExclamationCircleOutlined,
  YoutubeOutlined, GithubOutlined,
  CloseCircleOutlined, SyncOutlined,
  SettingOutlined, GoogleOutlined,
  BankOutlined, UserOutlined,
  SearchOutlined, CheckCircleFilled,
  HistoryOutlined, BellFilled,
  TrophyFilled, ReloadOutlined,
  EyeOutlined, FilterOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import approveService from '../services/approveService';

const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

/* ══════════════════════════════════════════════════
   🔔  TOAST ALERT SYSTEM  (custom, no antd)
══════════════════════════════════════════════════ */
const TOAST_TYPES = {
  success: { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#86efac', icon: '✅', title: 'สำเร็จ!', accent: '#16a34a' },
  error:   { bg: 'linear-gradient(135deg,#fff1f2,#fee2e2)', border: '#fca5a5', icon: '❌', title: 'ผิดพลาด!', accent: '#dc2626' },
  warning: { bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fcd34d', icon: '⚠️', title: 'แจ้งเตือน!', accent: '#d97706' },
  info:    { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#93c5fd', icon: 'ℹ️', title: 'แจ้งข้อมูล', accent: '#2563eb' },
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:99999, display:'flex', flexDirection:'column', gap:12, minWidth:320, maxWidth:400 }}>
    {toasts.map(t => {
      const cfg = TOAST_TYPES[t.type] || TOAST_TYPES.info;
      return (
        <div key={t.id} className="toast-item" style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius:18, padding:'16px 20px', boxShadow:`0 20px 40px -10px ${cfg.border}88`, display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer', position:'relative', overflow:'hidden' }}
          onClick={() => onRemove(t.id)}>
          <div className="toast-progress" style={{ '--dur': t.duration+'ms', '--acc': cfg.accent }} />
          <span style={{ fontSize:26, lineHeight:1 }}>{cfg.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontWeight:900, fontSize:15, color: cfg.accent }}>{cfg.title}</p>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'#374151', lineHeight:1.5 }}>{t.msg}</p>
          </div>
          <button onClick={e=>{e.stopPropagation();onRemove(t.id);}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#9ca3af',padding:0,lineHeight:1 }}>×</button>
        </div>
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════
   🔊  WEB AUDIO ENGINE
══════════════════════════════════════════════════ */
class SFX {
  constructor(){this.c=null;}
  _g(){if(!this.c)this.c=new(window.AudioContext||window.webkitAudioContext)();return this.c;}
  _r(fn){try{fn(this._g());}catch(e){}}
  success(){this._r(c=>{[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;const t=c.currentTime+i*.09;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.4);o.start(t);o.stop(t+.4);});});}
  error(){this._r(c=>{[220,196,174.6].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sawtooth';o.frequency.value=f;const t=c.currentTime+i*.1;g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.start(t);o.stop(t+.25);});});}
  warning(){this._r(c=>{[440,554].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='triangle';o.frequency.value=f;const t=c.currentTime+i*.15;g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.start(t);o.stop(t+.3);});});}
  click(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='triangle';o.frequency.setValueAtTime(400,c.currentTime);o.frequency.exponentialRampToValueAtTime(800,c.currentTime+.04);g.gain.setValueAtTime(.18,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.07);o.start();o.stop(c.currentTime+.07);});}
  open(){this._r(c=>{const n=Math.ceil(c.sampleRate*.18),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.setValueAtTime(300,c.currentTime);f.frequency.linearRampToValueAtTime(1800,c.currentTime+.18);g.gain.setValueAtTime(.09,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.2);s.buffer=buf;s.connect(f);f.connect(g);g.connect(c.destination);s.start();s.stop(c.currentTime+.2);});}
  tick(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=660;g.gain.setValueAtTime(.1,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.05);o.start();o.stop(c.currentTime+.05);});}
}
const sfx = new SFX();

/* ══════════════════════════════════════════════════
   STATUS CONFIG
══════════════════════════════════════════════════ */
const STATUS_CFG = {
  'รออนุมัติหัวข้อ': { color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d', icon:<ClockCircleOutlined/>, dot:'#f59e0b' },
  'รออนุมัติเล่ม':   { color:'#ea580c', bg:'#fff7ed', border:'#fdba74', icon:<FileTextOutlined/>, dot:'#ea580c' },
  'รอแก้ไข':         { color:'#db2777', bg:'#fdf2f8', border:'#f9a8d4', icon:<ExclamationCircleOutlined/>, dot:'#db2777' },
  'กำลังทำ':         { color:'#2563eb', bg:'#eff6ff', border:'#93c5fd', icon:<SyncOutlined spin/>, dot:'#2563eb' },
  'สมบูรณ์':         { color:'#16a34a', bg:'#f0fdf4', border:'#86efac', icon:<SafetyCertificateFilled/>, dot:'#16a34a' },
  'ไม่ผ่าน':          { color:'#dc2626', bg:'#fff1f2', border:'#fca5a5', icon:<CloseCircleOutlined/>, dot:'#dc2626' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { color:'#64748b', bg:'#f1f5f9', border:'#cbd5e1', icon:null, dot:'#94a3b8' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, background:cfg.bg, color:cfg.color, border:`1.5px solid ${cfg.border}`, padding:'5px 14px', borderRadius:99, fontWeight:800, fontSize:13 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block', animation:'sdot 2s ease-in-out infinite' }}/>
      {cfg.icon && <span style={{ fontSize:13 }}>{cfg.icon}</span>}
      {status}
    </span>
  );
};

/* ══════════════════════════════════════════════════
   MAGNETIC BUTTON
══════════════════════════════════════════════════ */
const MagBtn = ({ children, onClick, className='', style={}, disabled=false }) => {
  const r = useRef();
  return (
    <button ref={r}
      onMouseMove={e=>{if(disabled||!r.current)return;const b=r.current.getBoundingClientRect();const x=(e.clientX-b.left-b.width/2)*.18,y=(e.clientY-b.top-b.height/2)*.18;r.current.style.transform=`translate(${x}px,${y}px) scale(1.03)`;}}
      onMouseLeave={()=>{if(r.current)r.current.style.transform='translate(0,0) scale(1)';}}
      onClick={e=>{if(!disabled){sfx.click();onClick&&onClick(e);}}}
      disabled={disabled}
      className={className}
      style={{ transition:'transform .18s cubic-bezier(.34,1.56,.64,1)', cursor:disabled?'not-allowed':'pointer', ...style }}
    >{children}</button>
  );
};

/* ══════════════════════════════════════════════════
   PROJECT CARD
══════════════════════════════════════════════════ */
const ProjectCard = ({ project, onManage, onView, getAvatarUrl }) => {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState([]);
  const addRipple = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipple(prev => [...prev, { id, x: e.clientX-r.left, y: e.clientY-r.top }]);
    setTimeout(() => setRipple(prev => prev.filter(i => i.id !== id)), 700);
  };

  return (
    <div
      className="pcard"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={addRipple}
      style={{ position:'relative', overflow:'hidden', background:'#fff', borderRadius:24, border: hovered ? '1.5px solid #a5b4fc' : '1.5px solid #e2e8f0', boxShadow: hovered ? '0 24px 48px -12px rgba(99,102,241,.15)' : '0 4px 16px -4px rgba(0,0,0,.06)', transition:'all .25s cubic-bezier(.34,1.56,.64,1)', transform: hovered ? 'translateY(-3px)' : 'none', padding:'28px 32px' }}
    >
      {ripple.map(rp => (
        <span key={rp.id} style={{ position:'absolute', left:rp.x, top:rp.y, width:0, height:0, borderRadius:'50%', background:'rgba(99,102,241,.12)', animation:'rippleCard .65s ease forwards', pointerEvents:'none' }}/>
      ))}
      <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* LEFT */}
        <div style={{ flex:'1 1 300px', minWidth:280 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <p style={{ margin:0, fontWeight:900, fontSize:20, color:'#1e293b', lineHeight:1.3 }}>{project.title_th}</p>
              <p style={{ margin:'4px 0 0', fontSize:14, color:'#94a3b8', fontStyle:'italic' }}>{project.title_en || '—'}</p>
            </div>
            <StatusBadge status={project.progress_status}/>
          </div>

          <div style={{ background:'#f8fafc', borderRadius:16, padding:'14px 18px', border:'1px solid #f1f5f9', display:'flex', flexWrap:'wrap', gap:'10px 28px', marginBottom:16 }}>
            {[
              { icon:'🗂', label:'หมวดหมู่', value: project.category },
              { icon:'📅', label:'ปีการศึกษา', value: project.academic_year },
              project.project_level && { icon:'🏫', label:'ระดับ', value: project.project_level },
            ].filter(Boolean).map((m,i) => (
              <span key={i} style={{ fontSize:13, color:'#475569', display:'flex', alignItems:'center', gap:5 }}>
                {m.icon} <span style={{ color:'#94a3b8' }}>{m.label}:</span> <b style={{ color:'#1e293b' }}>{m.value}</b>
              </span>
            ))}
            {project.advisor && (
              <span style={{ fontSize:13, color:'#475569', display:'flex', alignItems:'center', gap:5, width:'100%', paddingTop:8, borderTop:'1px solid #f1f5f9', marginTop:4 }}>
                👨‍🏫 <span style={{ color:'#94a3b8' }}>ที่ปรึกษา:</span> <b style={{ color:'#4f46e5' }}>{project.advisor}</b>
              </span>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#f8fafc', padding:'8px 16px', borderRadius:99, border:'1.5px solid #f1f5f9' }}>
              <Avatar size={40} icon={<UserOutlined/>} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', flexShrink:0 }}/>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:14, color:'#334155' }}>{project.student_name || project.creator_name || 'ไม่ระบุ'}</p>
                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>ผู้จัดทำโครงงาน</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {project.pdf_file_path && (
                <Tooltip title="รูปเล่ม PDF">
                  <a href={approveService.getPdfUrl(project.pdf_file_path)} target="_blank" rel="noreferrer" className="link-btn pdf-btn" onClick={sfx.tick.bind(sfx)}>
                    <FilePdfOutlined style={{ fontSize:18 }}/>
                  </a>
                </Tooltip>
              )}
              {project.drive_url && (
                <Tooltip title="Google Drive">
                  <button className="link-btn drive-btn" onClick={e=>{e.stopPropagation();sfx.tick();window.open(project.drive_url,'_blank');}}>
                    <GoogleOutlined style={{ fontSize:18 }}/>
                  </button>
                </Tooltip>
              )}
              {project.video_url && (
                <Tooltip title="วิดีโอ">
                  <button className="link-btn yt-btn" onClick={e=>{e.stopPropagation();sfx.tick();window.open(project.video_url,'_blank');}}>
                    <YoutubeOutlined style={{ fontSize:18 }}/>
                  </button>
                </Tooltip>
              )}
              {project.github_url && (
                <Tooltip title="GitHub">
                  <button className="link-btn gh-btn" onClick={e=>{e.stopPropagation();sfx.tick();window.open(project.github_url,'_blank');}}>
                    <GithubOutlined style={{ fontSize:18 }}/>
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:180, justifyContent:'center' }}>
          <MagBtn
            onClick={e=>{e.stopPropagation();onManage(project);}}
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', borderRadius:16, padding:'14px 20px', fontWeight:800, fontSize:15, width:'100%', boxShadow:'0 8px 20px -5px rgba(99,102,241,.45)' }}
          >
            <SettingOutlined style={{ marginRight:8 }}/> จัดการ / อนุมัติ
          </MagBtn>
          <MagBtn
            onClick={e=>{e.stopPropagation();onView(project);}}
            style={{ background:'#f8fafc', color:'#64748b', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'10px 20px', fontWeight:700, fontSize:14, width:'100%' }}
          >
            <EyeOutlined style={{ marginRight:6 }}/> ดู Feedback เดิม
          </MagBtn>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
const ApproveProject = () => {
  const [loading, setLoading]         = useState(false);
  const [projects, setProjects]       = useState([]);
  const [activeTab, setActiveTab]     = useState('pending');
  const [searchText, setSearchText]   = useState('');
  const [histSearch, setHistSearch]   = useState('');
  const [histFilter, setHistFilter]   = useState('all');
  const [pageReady, setPageReady]     = useState(false);

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [actionType, setActionType]         = useState('');
  const [feedback, setFeedback]             = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // toast system
  const [toasts, setToasts] = useState([]);
  const addToast = (type, msg, duration=4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, msg, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    if(type==='success') sfx.success();
    else if(type==='error') sfx.error();
    else if(type==='warning') sfx.warning();
  };
  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  const user = JSON.parse(localStorage.getItem('user') || '{"id":1}');

  useEffect(() => { setTimeout(()=>setPageReady(true),100); }, []);
  useEffect(() => {
    if(!pageReady) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('io-in'); io.unobserve(e.target); } });
    }, { threshold:.06 });
    document.querySelectorAll('.io').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pageReady, loading]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await approveService.getAllPendingProjects();
      setProjects(data);
    } catch (err) {
      addToast('error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const getFiltered = () => {
    let f = projects;
    if (activeTab === 'pending') {
      f = f.filter(p => ['รออนุมัติหัวข้อ','รออนุมัติเล่ม','รอแก้ไข'].includes(p.progress_status));
    } else {
      f = f.filter(p => ['กำลังทำ','สมบูรณ์','ไม่ผ่าน'].includes(p.progress_status));
      if (histFilter !== 'all') f = f.filter(p => p.progress_status === histFilter);
      const q = histSearch.toLowerCase();
      if (q) f = f.filter(p => (p.title_th||'').toLowerCase().includes(q)||(p.title_en||'').toLowerCase().includes(q)||(p.student_name||'').toLowerCase().includes(q)||(p.creator_name||'').toLowerCase().includes(q)||(p.advisor||'').toLowerCase().includes(q));
      return f;
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      f = f.filter(p => (p.title_th||'').toLowerCase().includes(q)||(p.title_en||'').toLowerCase().includes(q)||(p.student_name||'').toLowerCase().includes(q)||(p.creator_name||'').toLowerCase().includes(q)||(p.advisor||'').toLowerCase().includes(q));
    }
    return f;
  };

  const openManage = p => { sfx.open(); setCurrentProject(p); setActionType('change_status'); setFeedback(p.feedback||''); setSelectedStatus(p.progress_status); setIsModalOpen(true); };
  const openView   = p => { sfx.open(); setCurrentProject(p); setActionType('view'); setFeedback(p.feedback||''); setSelectedStatus(p.progress_status); setIsModalOpen(true); };

  const handleSubmit = async () => {
    if (actionType==='view') { setIsModalOpen(false); return; }
    if (!currentProject) return;
    if (!selectedStatus) { addToast('warning','กรุณาเลือกสถานะที่ต้องการ'); return; }
    setLoading(true);
    try {
      await approveService.updateProjectStatus(currentProject.project_id, { progress_status:selectedStatus, feedback, approved_by:user.id });
      addToast('success', `อัปเดตสถานะ "${selectedStatus}" เรียบร้อยแล้ว 🎉`);
      setIsModalOpen(false); setFeedback(''); fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message;
      addToast('error', 'เกิดข้อผิดพลาด: ' + msg);
    } finally { setLoading(false); }
  };

  const pending = projects.filter(p=>['รออนุมัติหัวข้อ','รออนุมัติเล่ม','รอแก้ไข'].includes(p.progress_status));
  const done    = projects.filter(p=>['กำลังทำ','สมบูรณ์','ไม่ผ่าน'].includes(p.progress_status));
  const filteredList = getFiltered();

  const histColumns = [
    { title:<span style={{fontWeight:900,fontSize:12,color:'#94a3b8',letterSpacing:'.06em'}}>ชื่อโครงงาน</span>, dataIndex:'title_th', key:'tt', width:'32%',
      render:(t,r)=><div><p style={{margin:0,fontWeight:800,fontSize:13,color:'#1e293b'}}>{t}</p><p style={{margin:'2px 0 0',fontSize:11,color:'#94a3b8'}}>{r.student_name||r.creator_name||'—'}</p></div> },
    { title:<span style={{fontWeight:900,fontSize:12,color:'#94a3b8',letterSpacing:'.06em'}}>ปี</span>, dataIndex:'academic_year', key:'yr', align:'center', width:'8%',
      render:t=><span style={{fontWeight:800,background:'#f1f5f9',padding:'3px 10px',borderRadius:8,fontSize:12,color:'#475569'}}>{t||'-'}</span> },
    { title:<span style={{fontWeight:900,fontSize:12,color:'#94a3b8',letterSpacing:'.06em'}}>ที่ปรึกษา</span>, dataIndex:'advisor', key:'adv', width:'15%',
      render:t=>t?<span style={{fontSize:12,color:'#4f46e5',fontWeight:700}}>{t}</span>:<span style={{color:'#e2e8f0'}}>—</span> },
    { title:<span style={{fontWeight:900,fontSize:12,color:'#94a3b8',letterSpacing:'.06em'}}>สถานะ</span>, dataIndex:'progress_status', key:'st', width:'14%',
      render:s=><StatusBadge status={s}/> },
    { title:<span style={{fontWeight:900,fontSize:12,color:'#94a3b8',letterSpacing:'.06em'}}>Feedback</span>, dataIndex:'feedback', key:'fb', width:'22%',
      render:t=>t?<span style={{fontSize:12,color:'#475569',background:'#f8fafc',padding:'4px 10px',borderRadius:8,display:'inline-block',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t}</span>:<span style={{color:'#e2e8f0',fontSize:12}}>ไม่มี</span> },
    { title:'', key:'act', align:'center', width:'9%',
      render:(_,r)=><button onMouseEnter={sfx.tick.bind(sfx)} onClick={()=>openView(r)} style={{background:'#eff6ff',color:'#2563eb',border:'1.5px solid #bfdbfe',borderRadius:10,padding:'5px 12px',fontWeight:700,fontSize:11,cursor:'pointer',transition:'all .15s'}} className="tbl-act-btn">ดูรายละเอียด</button> },
  ];

  return (
    <Layout className={`min-h-screen bg-[#f0f4ff] transition-opacity duration-700 ${pageReady?'opacity-100':'opacity-0'}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
      <div className="mesh" aria-hidden="true"/>
      <AdminSidebar/>
      <Content className="p-4 md:p-8 h-screen overflow-y-auto cs">
        <div className="max-w-7xl mx-auto space-y-6 pb-20">

          {/* HEADER */}
          <div className="io hdr overflow-hidden rounded-3xl">
            <div className="h-2 w-full stps"/>
            <div style={{ background:'rgba(255,255,255,.96)', padding:'24px 32px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:20 }}>
              <div>
                <h1 style={{ margin:0, fontWeight:900, fontSize:28, color:'#1e293b', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', padding:'8px 10px', borderRadius:14, display:'flex', alignItems:'center', color:'#fff', fontSize:22 }}><SafetyCertificateFilled/></span>
                  ระบบจัดการและอนุมัติโครงงาน
                </h1>
                <p style={{ margin:'6px 0 0', fontSize:14, color:'#94a3b8' }}>ตรวจสอบและอนุมัติขั้นตอนต่างๆ ของนักศึกษา</p>
              </div>
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                <div className="stat-pill warn">
                  <span className="stat-dot" style={{ background:'#f59e0b' }}/>
                  <div><p className="stat-label">รอตรวจ</p><p className="stat-val" style={{ color:'#f59e0b' }}>{pending.length}</p></div>
                </div>
                <div className="stat-pill ok">
                  <span className="stat-dot" style={{ background:'#10b981' }}/>
                  <div><p className="stat-label">เสร็จสิ้น</p><p className="stat-val" style={{ color:'#10b981' }}>{done.length}</p></div>
                </div>
                <button onClick={()=>{sfx.click();fetchProjects();}} className="ref-btn" title="รีเฟรช">
                  <ReloadOutlined className={loading?'animate-spin':''}/>
                </button>
              </div>
            </div>
          </div>

          {/* TABS + SEARCH */}
          <div className="io" style={{ display:'flex', flexWrap:'wrap', gap:14, alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:8, background:'#fff', padding:'6px', borderRadius:18, boxShadow:'0 2px 12px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' }}>
              {[
                { key:'pending', label:'งานที่ต้องดำเนินการ', icon:<BellFilled/>, count: pending.length },
                { key:'history', label:'ประวัติการอนุมัติ', icon:<HistoryOutlined/>, count: done.length },
              ].map(tab=>(
                <button key={tab.key} onClick={()=>{sfx.click();setActiveTab(tab.key);}}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:14, border:'none', fontWeight:800, fontSize:14, cursor:'pointer', transition:'all .2s', background: activeTab===tab.key ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'transparent', color: activeTab===tab.key ? '#fff' : '#64748b', boxShadow: activeTab===tab.key ? '0 8px 20px -5px rgba(99,102,241,.45)' : 'none' }}>
                  {tab.icon} {tab.label}
                  <span style={{ background: activeTab===tab.key ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: activeTab===tab.key ? '#fff' : '#94a3b8', padding:'1px 8px', borderRadius:99, fontSize:11, fontWeight:900 }}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, flex:'1 1 280px', justifyContent:'flex-end' }}>
              <div style={{ position:'relative', flex:'1 1 260px', maxWidth:380 }}>
                <SearchOutlined style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:16, zIndex:1 }}/>
                <input
                  placeholder={activeTab==='pending' ? 'ค้นหาโครงงาน / ผู้จัดทำ...' : 'ค้นหาในประวัติ...'}
                  value={activeTab==='pending' ? searchText : histSearch}
                  onChange={e=>{ sfx.tick(); activeTab==='pending' ? setSearchText(e.target.value) : setHistSearch(e.target.value); }}
                  style={{ width:'100%', paddingLeft:44, paddingRight:16, height:48, fontSize:14, borderRadius:14, border:'1.5px solid #e2e8f0', outline:'none', background:'#fff', color:'#1e293b', fontWeight:500, boxShadow:'0 2px 8px rgba(0,0,0,.04)', transition:'border .2s' }}
                  className="srch-inp"
                />
              </div>
            </div>
          </div>

          {/* HISTORY FILTER PILLS */}
          {activeTab==='history' && (
            <div className="io" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[{k:'all',l:'ทั้งหมด'},{k:'กำลังทำ',l:'กำลังทำ'},{k:'สมบูรณ์',l:'สมบูรณ์'},{k:'ไม่ผ่าน',l:'ไม่ผ่าน'}].map(f=>(
                <button key={f.k} onClick={()=>{sfx.click();setHistFilter(f.k);}}
                  style={{ padding:'6px 16px', borderRadius:99, border:`1.5px solid ${histFilter===f.k?'#6366f1':'#e2e8f0'}`, background: histFilter===f.k ? '#eff6ff' : '#fff', color: histFilter===f.k ? '#4f46e5' : '#64748b', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .15s' }}>
                  {f.l}
                </button>
              ))}
            </div>
          )}

          {/* CONTENT */}
          {loading && projects.length===0 ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div className="loader-ring-indigo"/>
              <p style={{ marginTop:16, color:'#94a3b8', fontWeight:700 }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredList.length===0 ? (
            <div className="io" style={{ background:'#fff', borderRadius:24, padding:'60px 40px', textAlign:'center', border:'1.5px solid #f1f5f9', boxShadow:'0 4px 16px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>📭</div>
              <p style={{ fontWeight:800, fontSize:18, color:'#1e293b', margin:0 }}>ไม่พบรายการที่ค้นหา</p>
              <p style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>ลองปรับเงื่อนไขการค้นหาดู</p>
            </div>
          ) : activeTab==='pending' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {filteredList.map((p,i)=>(
                <div key={p.project_id} className="io" style={{ animationDelay: i*40+'ms' }}>
                  <ProjectCard project={p} onManage={openManage} onView={openView}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="io" style={{ background:'#fff', borderRadius:24, border:'1.5px solid #f1f5f9', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.04)' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'center', gap:10 }}>
                <HistoryOutlined style={{ color:'#6366f1', fontSize:18 }}/>
                <span style={{ fontWeight:900, fontSize:16, color:'#1e293b' }}>ประวัติการอนุมัติ</span>
                <span style={{ background:'#eff6ff', color:'#4f46e5', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:900 }}>{filteredList.length} รายการ</span>
              </div>
              <Table
                columns={histColumns}
                dataSource={filteredList}
                rowKey="project_id"
                pagination={{ pageSize:10, showSizeChanger:false, className:'px-4 pb-4' }}
                rowClassName="hist-row"
                onRow={r=>({ onMouseEnter:()=>sfx.tick() })}
                className="hist-tbl"
              />
            </div>
          )}

        </div>
      </Content>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={()=>{sfx.tick();setIsModalOpen(false);}}
        confirmLoading={loading}
        width="min(680px,96vw)"
        centered
        styles={{ body:{ padding:0 } }}
        className="ap-modal"
        okText={<span style={{fontWeight:800,fontSize:15}}>{actionType==='view'?'ปิดหน้าต่าง':'ยืนยันการเปลี่ยนแปลง'}</span>}
        cancelText={<span style={{fontWeight:800,fontSize:15}}>ยกเลิก</span>}
        okButtonProps={{ size:'large', style:{ height:46, borderRadius:12, background: actionType==='view'?'#1e293b':'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', fontWeight:800, boxShadow:'0 8px 20px -5px rgba(99,102,241,.4)' } }}
        cancelButtonProps={{ size:'large', style:{ height:46, borderRadius:12, fontWeight:800 } }}
      >
        <div className="m-anim">
          <div style={{ background:'linear-gradient(135deg,#1e3a5f,#312e81,#4c1d95)', padding:'24px 28px', minHeight:100, display:'flex', flexDirection:'column', justifyContent:'flex-end', borderRadius:'8px 8px 0 0', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 10px)' }}/>
            <div style={{ position:'relative', zIndex:1 }}>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.1em' }}>{actionType==='view'?'ดู Feedback':'จัดการสถานะ'}</p>
              <h2 style={{ margin:'4px 0 0', fontWeight:900, color:'#fff', fontSize:20, lineHeight:1.3 }}>{currentProject?.title_th}</h2>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.55)' }}>สถานะปัจจุบัน:</span>
                <StatusBadge status={currentProject?.progress_status}/>
              </div>
            </div>
          </div>

          <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:22 }}>
            {actionType!=='view' && (
              <div>
                <p style={{ margin:'0 0 12px', fontWeight:800, fontSize:15, color:'#1e293b' }}>เลือกสถานะใหม่:</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {['รออนุมัติหัวข้อ','รออนุมัติเล่ม','รอแก้ไข','กำลังทำ','สมบูรณ์','ไม่ผ่าน'].map(s=>{
                    const cfg = STATUS_CFG[s]||{};
                    return(
                      <button key={s} onClick={()=>{sfx.click();setSelectedStatus(s);}}
                        style={{ padding:'10px 8px', borderRadius:14, border:`2px solid ${selectedStatus===s ? cfg.dot||'#6366f1' : '#f1f5f9'}`, background: selectedStatus===s ? (cfg.bg||'#f8fafc') : '#f8fafc', color: selectedStatus===s ? (cfg.color||'#4f46e5') : '#64748b', fontWeight:800, fontSize:12, cursor:'pointer', transition:'all .18s cubic-bezier(.34,1.56,.64,1)', transform: selectedStatus===s ? 'scale(1.04)' : 'scale(1)', boxShadow: selectedStatus===s ? `0 6px 16px -4px ${cfg.dot||'#6366f1'}50` : 'none' }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <p style={{ margin:'0 0 10px', fontWeight:800, fontSize:14, color:'#1e293b' }}>
                {actionType==='view'?'Feedback ที่บันทึกไว้:':'ข้อเสนอแนะ / Feedback:'}
              </p>
              <textarea
                rows={5} value={feedback}
                onChange={e=>setFeedback(e.target.value)}
                readOnly={actionType==='view'}
                placeholder="เช่น เอกสารยังไม่ครบถ้วน, อนุมัติเรียบร้อยแล้ว..."
                style={{ width:'100%', padding:'14px 16px', fontSize:14, lineHeight:1.7, borderRadius:14, border:'1.5px solid #e2e8f0', outline:'none', resize:'vertical', color:'#1e293b', background: actionType==='view'?'#f8fafc':'#fff', fontFamily:'inherit', boxSizing:'border-box', transition:'border .2s' }}
                className="fb-area"
              />
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        :root{--sp:cubic-bezier(.34,1.56,.64,1);--out:cubic-bezier(.16,1,.3,1);}
        .mesh{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 80% 50% at 5% 0%,#dbeafe44,transparent),radial-gradient(ellipse 60% 60% at 95% 100%,#ede9fe44,transparent);}
        .io{opacity:0;transform:translateY(22px);transition:opacity .6s var(--out),transform .6s var(--out);}
        .io-in{opacity:1!important;transform:translateY(0)!important;}
        @keyframes hIn{from{opacity:0;transform:translateY(-18px) scale(.97)}to{opacity:1;transform:none}}
        .hdr{border:1px solid rgba(255,255,255,.9);box-shadow:0 20px 60px -10px rgba(99,102,241,.12);animation:hIn .7s var(--out) both;}
        @keyframes sA{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
        .stps{background:linear-gradient(to right,#4f46e5,#7c3aed,#db2777,#4f46e5);background-size:300% 300%;animation:sA 5s ease infinite;}
        /* stat pills */
        .stat-pill{display:flex;align-items:center;gap:12;background:#fff;padding:10px 18px;border-radius:16px;border:1.5px solid #f1f5f9;box-shadow:0 2px 8px rgba(0,0,0,.05);}
        .stat-pill.warn{border-color:#fcd34d;}
        .stat-pill.ok{border-color:#86efac;}
        .stat-dot{width:10px;height:10px;border-radius:50%;animation:sdot 2s ease-in-out infinite;flex-shrink:0;}
        @keyframes sdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
        .stat-label{margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;}
        .stat-val{margin:0;font-size:24px;font-weight:900;line-height:1.1;}
        /* refresh btn */
        .ref-btn{background:#f1f5f9;border:none;borderRadius:14px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:#64748b;transition:all .2s;border-radius:14px;}
        .ref-btn:hover{background:#eff6ff;color:#4f46e5;}
        /* search input focus */
        .srch-inp:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.12)!important;}
        /* link buttons */
        .link-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;border:1.5px solid;cursor:pointer;transition:all .18s var(--sp);}
        .link-btn:hover{transform:translateY(-2px) scale(1.08);}
        .pdf-btn{background:#fff1f2;color:#dc2626;border-color:#fca5a5;text-decoration:none;}
        .pdf-btn:hover{background:#dc2626;color:#fff;}
        .drive-btn{background:#f0fdf4;color:#16a34a;border-color:#86efac;}
        .drive-btn:hover{background:#16a34a;color:#fff;}
        .yt-btn{background:#fff1f2;color:#dc2626;border-color:#fca5a5;}
        .yt-btn:hover{background:#dc2626;color:#fff;}
        .gh-btn{background:#f8fafc;color:#1e293b;border-color:#e2e8f0;}
        .gh-btn:hover{background:#1e293b;color:#fff;}
        /* history table */
        .hist-tbl .ant-table{background:transparent!important;}
        .hist-tbl .ant-table-thead > tr > th{background:#f8fafc!important;padding:12px 16px!important;border-bottom:1px solid #f1f5f9!important;}
        .hist-tbl .ant-table-tbody > tr > td{padding:12px 16px!important;border-bottom:1px solid #f8fafc!important;transition:background .15s;}
        .hist-row:hover > td{background:#eff6ff!important;}
        .hist-row:hover{box-shadow:inset 3px 0 0 #6366f1;}
        .tbl-act-btn:hover{background:#4f46e5!important;color:#fff!important;border-color:#4f46e5!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.3);}
        /* modal */
        .ap-modal .ant-modal-content{border-radius:20px!important;overflow:hidden;padding:0;box-shadow:0 40px 80px -20px rgba(0,0,0,.22);}
        .ap-modal .ant-modal-footer{padding:16px 28px 20px!important;border-top:1px solid #f1f5f9!important;}
        .ap-modal .ant-modal-close{top:12px;right:12px;}
        .ap-modal .ant-modal-close:hover{color:#ef4444;transform:rotate(90deg);transition:all .2s;}
        @keyframes mIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:none}}
        .m-anim{animation:mIn .35s var(--sp) both;}
        /* feedback area */
        .fb-area:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.12);}
        /* toast */
        @keyframes toastIn{from{transform:translateX(110%) scale(.9);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}
        .toast-item{animation:toastIn .35s var(--sp) both;}
        .toast-item:hover{transform:scale(1.02);}
        .toast-progress{position:absolute;bottom:0;left:0;height:3px;background:var(--acc,#6366f1);border-radius:99px;animation:progBar var(--dur,4000ms) linear forwards;}
        @keyframes progBar{from{width:100%}to{width:0%}}
        /* ripple */
        @keyframes rippleCard{0%{width:0;height:0;opacity:.8;margin:-0px}100%{width:500px;height:500px;opacity:0;margin:-250px}}
        /* loader */
        @keyframes spin{to{transform:rotate(360deg)}}
        .loader-ring-indigo{width:48px;height:48px;border-radius:50%;border:4px solid #e0e7ff;border-top-color:#6366f1;animation:spin .75s linear infinite;margin:0 auto;}
        /* scrollbar */
        .cs::-webkit-scrollbar{width:7px;}
        .cs::-webkit-scrollbar-track{background:#f1f5f9;}
        .cs::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px;border:2px solid #f1f5f9;}
        .cs::-webkit-scrollbar-thumb:hover{background:#818cf8;}
        /* pagination */
        .ant-pagination-item{border-radius:10px!important;font-weight:700!important;transition:all .15s;}
        .ant-pagination-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,.25);}
        .ant-pagination-item-active{background:#4f46e5!important;border-color:#4f46e5!important;}
        .ant-pagination-item-active a{color:#fff!important;}
      `}</style>
    </Layout>
  );
};

export default ApproveProject;