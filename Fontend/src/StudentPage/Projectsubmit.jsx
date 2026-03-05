import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Star, MessageSquare, FileText, Trash2, Edit, Eye,
  CheckCircle2, Clock, FileCheck, AlertCircle, FileDown, LayoutGrid,
  Globe, X, Save, Youtube, Github, Plus,
  Calendar, User, BookOpen, GraduationCap, Search, Check, Menu, Bell
} from 'lucide-react';
import projectService from '../services/projectService';
import AdminSidebar from './Studentbar';

/* ─────────────────────────────────────────────────────────
   🔊  Web Audio — เสียงน่ารัก
───────────────────────────────────────────────────────── */
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    const note = (freq, start, dur, vol = 0.6, wave = 'sine') => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.connect(g); g.connect(master);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    };
    if (type === 'success') {
      note(523, 0, 0.18); note(659, 0.12, 0.18); note(784, 0.24, 0.22); note(1047, 0.36, 0.35);
    } else if (type === 'error') {
      note(440, 0, 0.18, 0.5, 'triangle'); note(349, 0.16, 0.28, 0.4, 'triangle');
    } else if (type === 'confirm') {
      note(659, 0, 0.15, 0.45); note(523, 0.18, 0.20, 0.35);
    } else if (type === 'info') {
      note(880, 0, 0.18, 0.35);
    }
  } catch (_) {}
};

/* ─────────────────────────────────────────────────────────
   🌸  Particle Burst
───────────────────────────────────────────────────────── */
const ParticleBurst = ({ active, onDone }) => {
  const items = ['🌸','⭐','✨','💖','🎀','🌟','💫','🍬','🎊','🌺'];
  useEffect(() => {
    if (active) { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }
  }, [active, onDone]);
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => {
        const left = 5 + (i * 4.7) % 90;
        const delay = (i * 0.07).toFixed(2);
        const type = i % 3;
        return (
          <span key={i} style={{
            position: 'absolute', left: `${left}%`, top: '50%',
            fontSize: `${12 + (i % 4) * 6}px`,
            animation: `pflyT${type} 1.4s ease-out ${delay}s forwards`,
          }}>{items[i % items.length]}</span>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   🔔  Toast Notification
───────────────────────────────────────────────────────── */
const TOAST_GRAD = {
  success: 'from-pink-400 to-rose-400',
  error:   'from-red-400 to-orange-400',
  info:    'from-indigo-400 to-purple-400',
  confirm: 'from-amber-400 to-orange-400',
};
const TOAST_ICON = { success:'🌸', error:'💔', info:'💫', confirm:'🤔' };

const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id}
        style={{ animation: 'toastSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white
                    bg-gradient-to-r ${TOAST_GRAD[t.type]||TOAST_GRAD.info}
                    max-w-[88vw] sm:max-w-xs pointer-events-auto`}>
        <span className="text-xl shrink-0" style={{ animation:'bounceIcon 0.7s ease-in-out infinite' }}>
          {TOAST_ICON[t.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm leading-tight">{t.title}</p>
          {t.message && <p className="text-xs opacity-90 mt-0.5 leading-snug">{t.message}</p>}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────
   🌀  Kawaii Loader
───────────────────────────────────────────────────────── */
const KawaiiLoader = () => (
  <tr>
    <td colSpan="5">
      <div className="py-20 flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-pink-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin"
               style={{ animationDirection:'reverse', animationDuration:'0.7s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-xl select-none"
               style={{ animation:'kawaiiPop 1s ease-in-out infinite' }}>🌸</div>
        </div>
        <div className="flex gap-1 items-end">
          {'กำลังโหลด'.split('').map((c, i) => (
            <span key={i} className="text-slate-400 font-black text-sm inline-block"
                  style={{ animation:`letterBounce 0.7s ease-in-out ${i*0.07}s infinite alternate` }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </td>
  </tr>
);

/* ─────────────────────────────────────────────────────────
   💬  Kawaii Alert / Confirm Modal
───────────────────────────────────────────────────────── */
const ALERT_CFG = {
  confirm: { emoji:'🌺', grad:'from-amber-50 to-orange-50', btn:'from-orange-400 to-amber-500', ring:'ring-orange-200' },
  error:   { emoji:'💔', grad:'from-red-50 to-pink-50',     btn:'from-red-400 to-pink-500',     ring:'ring-red-200'    },
  success: { emoji:'🌸', grad:'from-emerald-50 to-teal-50', btn:'from-emerald-400 to-teal-500', ring:'ring-emerald-200' },
  info:    { emoji:'💫', grad:'from-indigo-50 to-purple-50', btn:'from-indigo-400 to-purple-500',ring:'ring-indigo-200'  },
};

const KawaiiAlertModal = ({ alertState, onClose }) => {
  if (!alertState.isOpen) return null;
  const c = ALERT_CFG[alertState.type] || ALERT_CFG.info;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md"
         style={{ animation:'fadeInOverlay 0.2s ease' }}>
      <div className={`bg-gradient-to-br ${c.grad} w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center border border-white ring-2 ${c.ring}`}
           style={{ animation:'modalBounceIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="text-6xl mb-5 leading-none select-none"
             style={{ animation:'emojiWiggle 0.55s ease 0.1s both' }}>{c.emoji}</div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{alertState.title}</h3>
        <p className="text-slate-500 text-sm mb-7 leading-relaxed">{alertState.message}</p>
        <div className="flex gap-3">
          {alertState.type === 'confirm' ? (
            <>
              <button onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                ยกเลิก
              </button>
              <button onClick={() => { alertState.onConfirm?.(); onClose(); }}
                className={`flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r ${c.btn} rounded-xl shadow-lg transition-all active:scale-95`}>
                ยืนยัน ✓
              </button>
            </>
          ) : (
            <button onClick={onClose}
              className={`w-full py-3 text-sm font-bold text-white bg-gradient-to-r ${c.btn} rounded-xl shadow-lg transition-all active:scale-95`}>
              ตกลง 🎀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   📊  Status Config
───────────────────────────────────────────────────────── */
const getStatusCfg = (status) => ({
  'สมบูรณ์':        { color:'text-emerald-700 bg-emerald-50 border-emerald-200', icon:<CheckCircle2 className="w-3.5 h-3.5"/>, dot:'bg-emerald-400', progress:100 },
  'รออนุมัติเล่ม':  { color:'text-purple-700 bg-purple-50 border-purple-200',   icon:<FileCheck className="w-3.5 h-3.5"/>,    dot:'bg-purple-400',  progress:80  },
  'กำลังทำ':        { color:'text-blue-700 bg-blue-50 border-blue-200',          icon:<Clock className="w-3.5 h-3.5"/>,        dot:'bg-blue-400',    progress:50  },
  'รออนุมัติหัวข้อ':{ color:'text-amber-700 bg-amber-50 border-amber-200',      icon:<AlertCircle className="w-3.5 h-3.5"/>,  dot:'bg-amber-400',   progress:15  },
}[status] || { color:'text-slate-600 bg-slate-100 border-slate-200', icon:<AlertCircle className="w-3.5 h-3.5"/>, dot:'bg-slate-300', progress:0 });

/* ══════════════════════════════════════════════════════════
   🏠  Projectsubmit — MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const Projectsubmit = () => {
  /* ── State ── */
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('ทั้งหมด');
  const [searchText,    setSearchText]    = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [particle,      setParticle]      = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [isReadOnly,    setIsReadOnly]    = useState(false);
  const [students,      setStudents]      = useState([{name:'',id:''},{name:'',id:''},{name:'',id:''}]);
  const [alertState,    setAlertState]    = useState({ isOpen:false, type:'info', title:'', message:'', onConfirm:null });
  const toastRef = useRef(0);

  /* ── Toast helpers ── */
  const pushToast = useCallback((type, title, message, duration = 3500) => {
    const id = ++toastRef.current;
    setToasts(p => [...p, { id, type, title, message }]);
    playSound(type);
    if (type === 'success') setParticle(true);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration + 500);
  }, []);

  const showAlert   = (t, title, msg)  => { playSound(t); setAlertState({ isOpen:true, type:t, title, message:msg, onConfirm:null }); };
  const showConfirm = (title, msg, fn) => { playSound('confirm'); setAlertState({ isOpen:true, type:'confirm', title, message:msg, onConfirm:fn }); };
  const closeAlert  = ()               => setAlertState(p => ({ ...p, isOpen:false }));

  /* ── Form ── */
  const initialForm = {
    title_th:'', title_en:'', student_name:'', student_id:'',
    academic_year: new Date().getFullYear()+543, project_level:'ปวส.2',
    category:'Web Application', advisor:'', progress_status:'รออนุมัติหัวข้อ',
    is_featured:false, video_url:'', github_url:'', drive_url:'', feedback:'', pdf_file:null
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUserId(u.id || u.user_id);
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingId(null); setIsReadOnly(false);
    setFormData({ ...initialForm });
    setStudents([{name:'',id:''},{name:'',id:''},{name:'',id:''}]);
    setIsModalOpen(true);
  };

  const handleActionClick = (project, readOnly = false) => {
    setEditingId(project.project_id);
    setIsReadOnly(readOnly);
    setFormData({ ...project, pdf_file:null });
    const names = project.student_name?.split(',').map(n=>n.trim()) || [];
    const ids   = project.student_id?.split(',').map(i=>i.trim())   || [];
    setStudents([0,1,2].map(i => ({ name:names[i]||'', id:ids[i]||'' })));
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    if (isReadOnly) return;
    const { name, value, type, checked, files } = e.target;
    if (type==='file') setFormData(p=>({...p,[name]:files[0]}));
    else setFormData(p=>({...p,[name]:type==='checkbox'?checked:value}));
  };

  const handleStudentChange = (i, field, val) => {
    if (isReadOnly) return;
    const u = [...students]; u[i] = { ...u[i], [field]:val }; setStudents(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitLoading(true);
    try {
      const data = new FormData();
      const combinedNames = students.map(s=>s.name.trim()).filter(Boolean).join(', ');
      const combinedIds   = students.map(s=>s.id.trim()).filter(Boolean).join(', ');
      if (!combinedNames) {
        showAlert('error','ข้อมูลไม่ครบ','กรุณาระบุชื่อผู้จัดทำอย่างน้อย 1 คน');
        setSubmitLoading(false); return;
      }
      Object.keys(formData).forEach(key => {
        if (key==='pdf_file')      { if(formData[key]) data.append('pdf_file',formData[key]); }
        else if (key==='student_name') data.append('student_name', combinedNames);
        else if (key==='student_id')   data.append('student_id',   combinedIds);
        else data.append(key, formData[key]===null?'':formData[key]);
      });
      data.append('created_by', currentUserId || 1);
      if (editingId) { await projectService.updateProject(editingId, data); pushToast('success','บันทึกสำเร็จ! 🌸','อัปเดตข้อมูลโครงงานเรียบร้อย'); }
      else           { await projectService.createProject(data);             pushToast('success','เพิ่มโครงงานแล้ว! ✨','สร้างโครงงานใหม่เรียบร้อย'); }
      setIsModalOpen(false); loadProjects();
    } catch (err) {
      pushToast('error','เกิดข้อผิดพลาด 💔', err.message||'ไม่สามารถบันทึกได้');
    } finally { setSubmitLoading(false); }
  };

  const performDelete = async (id) => {
    try { await projectService.deleteProject(id); pushToast('info','ลบแล้ว 🍂','โครงงานถูกลบออกจากระบบ'); loadProjects(); }
    catch { pushToast('error','ผิดพลาด 💔','ไม่สามารถลบข้อมูลได้'); }
  };

  /* ── Filtering ── */
  const filtered = projects.filter(p => {
    const matchTab = activeTab==='ทั้งหมด' || p.progress_status===activeTab;
    const s = searchText.toLowerCase();
    return matchTab && (
      p.title_th?.toLowerCase().includes(s) ||
      p.student_name?.toLowerCase().includes(s) ||
      p.student_id?.toLowerCase().includes(s) ||
      p.advisor?.toLowerCase().includes(s)
    );
  });

  const TABS = ['ทั้งหมด','รออนุมัติหัวข้อ','กำลังทำ','รออนุมัติเล่ม','สมบูรณ์'];

  /* ════════════════ JSX ════════════════ */
  return (
    <>
      <style>{`
        @keyframes pflyT0 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(55px,-170px)scale(0)} }
        @keyframes pflyT1 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(-70px,-200px)scale(0)} }
        @keyframes pflyT2 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(10px,-220px)scale(0)} }
        @keyframes toastSlideIn  { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes bounceIcon    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes modalBounceIn { from{opacity:0;transform:scale(0.75)translateY(20px)} to{opacity:1;transform:scale(1)translateY(0)} }
        @keyframes emojiWiggle   { 0%{transform:rotate(-12deg)scale(0.6)} 50%{transform:rotate(10deg)scale(1.25)} 80%{transform:rotate(-4deg)scale(1.05)} 100%{transform:rotate(0)scale(1)} }
        @keyframes kawaiiPop     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
        @keyframes letterBounce  { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes cardIn        { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowSlide      { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatAnim     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulseGlow     { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.3)} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0)} }
        .data-row  { animation: rowSlide 0.32s ease both; }
        .stat-card { animation: cardIn 0.4s ease both; }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
      `}</style>

      <ParticleBurst active={particle} onDone={() => setParticle(false)} />
      <Toast toasts={toasts} />

      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
               onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-[60] transition-transform duration-300
                         ${sidebarOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ── Header ── */}
          <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 sm:px-6 lg:px-10
                             py-4 sm:py-5 flex items-center justify-between shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                      onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-slate-600"/>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600 hidden sm:flex">
                  <LayoutGrid className="w-6 h-6"/>
                </div>
                <div>
                  <h1 className="text-base sm:text-xl lg:text-2xl font-black text-slate-800 leading-tight">
                    <span className="hidden sm:inline">ระบบส่งโครงงานนักศึกษา</span>
                    <span className="sm:hidden">ส่งโครงงาน</span>
                  </h1>
                  <p className="hidden sm:block text-slate-400 text-xs font-medium mt-0.5">
                    จัดการและติดตามสถานะการส่งโครงงาน
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-slate-500"/>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse"/>
              </button>
              <button onClick={openAddModal}
                className="flex items-center gap-1.5 px-3 sm:px-6 py-2.5 sm:py-3
                           bg-gradient-to-r from-indigo-500 to-purple-500
                           hover:from-indigo-600 hover:to-purple-600
                           text-white rounded-xl shadow-lg shadow-indigo-200/50
                           font-bold text-sm transition-all active:scale-95 group"
                style={{ animation:'pulseGlow 2s ease-in-out 3' }}>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300"/>
                <span className="hidden sm:inline">เพิ่มโครงงานของฉัน</span>
                <span className="sm:hidden">เพิ่ม</span>
              </button>
            </div>
          </header>

          {/* ── Body ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 xl:p-10">
            <div className="max-w-screen-2xl mx-auto space-y-5 sm:space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label:'โครงงานทั้งหมด', val: projects.length,                                                    emoji:'📚', from:'from-indigo-500', to:'to-blue-500'   },
                  { label:'รออนุมัติ',      val: projects.filter(p=>p.progress_status==='รออนุมัติหัวข้อ').length,  emoji:'⏳', from:'from-amber-400',  to:'to-orange-400' },
                  { label:'กำลังทำ',        val: projects.filter(p=>p.progress_status==='กำลังทำ').length,          emoji:'⚡', from:'from-blue-500',   to:'to-cyan-500'   },
                  { label:'สมบูรณ์',        val: projects.filter(p=>p.progress_status==='สมบูรณ์').length,          emoji:'✅', from:'from-emerald-500',to:'to-teal-500'   },
                ].map((c,i) => (
                  <div key={i} className="stat-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
                                          hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default"
                       style={{ animationDelay:`${i*0.07}s` }}>
                    <div className={`h-1.5 bg-gradient-to-r ${c.from} ${c.to}`}/>
                    <div className="p-3 sm:p-4 flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl select-none"
                            style={{ animation:`floatAnim 3s ease-in-out ${i*0.5}s infinite` }}>{c.emoji}</span>
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">{c.label}</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">{c.val}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter + Search */}
              <div className="space-y-3">
                <div className="overflow-x-auto pb-1 -mx-1 px-1">
                  <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-max">
                    {TABS.map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap
                                    transition-all active:scale-95
                                    ${activeTab===tab?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                  <input type="text" placeholder="ค้นหาโครงงาน, รหัสนักศึกษา, อาจารย์..."
                    value={searchText} onChange={e => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm
                               focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none
                               transition-all shadow-sm"/>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-xs uppercase font-black tracking-wider">
                        <th className="px-6 lg:px-8 py-5 w-[35%]">ชื่อโครงงาน & หมวดหมู่</th>
                        <th className="px-5 py-5 w-[25%]">ผู้จัดทำ & ที่ปรึกษา</th>
                        <th className="px-5 py-5 text-center">ปีการศึกษา</th>
                        <th className="px-5 py-5 text-center">ความคืบหน้า</th>
                        <th className="px-6 lg:px-8 py-5 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <KawaiiLoader />
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                              <span className="text-5xl select-none" style={{ animation:'floatAnim 3s ease-in-out infinite' }}>🔍</span>
                              <p className="font-bold text-base">{searchText?`ไม่พบ "${searchText}"`:'ไม่มีโครงงานในหมวดนี้'}</p>
                            </div>
                          </td>
                        </tr>
                      ) : filtered.map((p, ri) => {
                        const cfg     = getStatusCfg(p.progress_status);
                        const isOwner = Number(p.created_by) === Number(currentUserId);
                        const namesList = p.student_name?.split(',').map(n=>n.trim()) || [];
                        const idsList   = p.student_id?.split(',').map(i=>i.trim())   || [];

                        return (
                          <tr key={p.project_id}
                              className="data-row hover:bg-indigo-50/20 transition-colors group"
                              style={{ animationDelay:`${ri*0.04}s` }}>

                            {/* Project name */}
                            <td className="px-6 lg:px-8 py-5 align-top">
                              <div className="flex flex-col gap-2">
                                <span className="w-fit text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                  {p.category||'ไม่ระบุ'}
                                </span>
                                <h3 className="font-black text-slate-800 text-sm lg:text-base group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
                                  {p.title_th}
                                </h3>
                                {p.title_en && <p className="text-xs text-slate-400 truncate">{p.title_en}</p>}
                              </div>
                            </td>

                            {/* Students + advisor */}
                            <td className="px-5 py-5 align-top">
                              <div className="space-y-1.5">
                                {namesList.map((name,i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <div className="p-1 bg-slate-100 rounded-md text-slate-400 shrink-0 mt-0.5">
                                      <User className="w-3 h-3"/>
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-700 text-xs leading-tight">{name}</p>
                                      <p className="text-[10px] text-slate-400">รหัส: {idsList[i]||'-'}</p>
                                    </div>
                                  </div>
                                ))}
                                {p.advisor && (
                                  <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-100">
                                    <div className="p-1 bg-orange-50 rounded-md text-orange-400 shrink-0">
                                      <BookOpen className="w-3 h-3"/>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">อ.{p.advisor}</p>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Year */}
                            <td className="px-5 py-5 text-center align-top">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                                <Calendar className="w-3 h-3 text-slate-400"/>
                                {p.academic_year}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-5 text-center align-top">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${cfg.color}`}>
                                {cfg.icon}{p.progress_status}
                              </span>
                              <div className="mt-2 w-16 mx-auto h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${cfg.dot.replace('bg-','bg-')} rounded-full transition-all duration-1000`}
                                     style={{ width:`${cfg.progress}%`, background: cfg.dot.replace('bg-','') }}/>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 lg:px-8 py-5 text-right align-top">
                              <div className="flex justify-end gap-1.5">
                                {isOwner ? (
                                  <>
                                    <button onClick={() => handleActionClick(p, false)}
                                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                      title="แก้ไข">
                                      <Edit className="w-4 h-4"/>
                                    </button>
                                    <button onClick={() => showConfirm('ยืนยันการลบ? 🗑️','ข้อมูลที่ลบไปไม่สามารถกู้คืนได้', () => performDelete(p.project_id))}
                                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                      title="ลบ">
                                      <Trash2 className="w-4 h-4"/>
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => handleActionClick(p, true)}
                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                    title="ดูรายละเอียด">
                                    <Eye className="w-4 h-4"/>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {loading ? (
                    <div className="py-16 flex flex-col items-center gap-5">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-pink-100"/>
                        <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"/>
                        <div className="absolute inset-0 flex items-center justify-center text-lg">🌸</div>
                      </div>
                      <p className="text-slate-400 font-bold text-sm">กำลังโหลด...</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                      <span className="text-5xl">🔍</span>
                      <p className="font-bold text-sm">{searchText?`ไม่พบ "${searchText}"`:'ไม่มีโครงงาน'}</p>
                    </div>
                  ) : filtered.map((p, ri) => {
                    const cfg     = getStatusCfg(p.progress_status);
                    const isOwner = Number(p.created_by) === Number(currentUserId);
                    const names   = p.student_name?.split(',').map(n=>n.trim()) || [];

                    return (
                      <div key={p.project_id} className="data-row p-4 hover:bg-indigo-50/10 transition-colors"
                           style={{ animationDelay:`${ri*0.04}s` }}>
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {p.category||'ไม่ระบุ'}
                            </span>
                            <h3 className="font-black text-slate-800 text-sm mt-1.5 leading-snug line-clamp-2">{p.title_th}</h3>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {isOwner ? (
                              <>
                                <button onClick={() => handleActionClick(p, false)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => showConfirm('ยืนยันการลบ? 🗑️','ไม่สามารถกู้คืนได้', () => performDelete(p.project_id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4"/></button>
                              </>
                            ) : (
                              <button onClick={() => handleActionClick(p, true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"><Eye className="w-4 h-4"/></button>
                            )}
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${cfg.color}`}>{cfg.icon}{p.progress_status}</span>
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"><Calendar className="w-3 h-3"/>ปี {p.academic_year}</span>
                        </div>
                        {/* Names */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {names.map((n,i) => <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"><User className="w-2.5 h-2.5"/>{n}</span>)}
                          {p.advisor && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">อ.{p.advisor}</span>}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.dot} rounded-full`} style={{ width:`${cfg.progress}%` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ════ Form Modal ════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
             style={{ animation:'fadeInOverlay 0.2s ease' }}>
          <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
               style={{ maxHeight:'92vh', animation:'modalBounceIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>

            {/* Header */}
            <div className="px-5 sm:px-10 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center shrink-0
                            bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-base sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                  {isReadOnly ? <Eye className="w-5 h-5 sm:w-6 sm:h-6"/> : (editingId?<Edit className="w-5 h-5 sm:w-6 sm:h-6"/>:<Plus className="w-5 h-5 sm:w-6 sm:h-6"/>)}
                </div>
                {isReadOnly ? 'รายละเอียดโครงงาน 👀' : (editingId ? 'แก้ไขข้อมูลโครงงาน ✏️' : 'สร้างโครงงานใหม่ ✨')}
              </h2>
              <button onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/80 rounded-full transition-colors active:scale-90">
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500"/>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-5 sm:py-8">

                {/* Read-only notice */}
                {isReadOnly && (
                  <div className="mb-5 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700"
                       style={{ animation:'cardIn 0.4s ease both' }}>
                    <Eye className="w-4 h-4 shrink-0"/>
                    <p className="font-bold text-xs sm:text-sm">โหมดดูข้อมูลเท่านั้น — คุณไม่ใช่เจ้าของโครงงานนี้</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">

                  {/* Titles */}
                  <div className="sm:col-span-2 space-y-3 sm:space-y-4">
                    {[
                      {label:'ชื่อโครงงาน (TH)', name:'title_th', req:true,  ph:'ระบุชื่อโครงงานภาษาไทย...'},
                      {label:'Project Title (EN)',name:'title_en', req:false, ph:'Project Name in English...'},
                    ].map(f=>(
                      <div key={f.name}>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                          {f.label}{f.req&&<span className="text-pink-500 ml-1">*</span>}
                        </label>
                        <input type="text" name={f.name} value={formData[f.name]}
                          onChange={handleInputChange} disabled={isReadOnly} required={f.req} placeholder={f.ph}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm sm:text-base font-bold
                                     focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all
                                     disabled:bg-slate-50 disabled:text-slate-600"/>
                      </div>
                    ))}
                  </div>

                  {/* Students */}
                  <div className="sm:col-span-2 space-y-2.5 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                      ผู้จัดทำโครงงาน (สูงสุด 3 คน) <span className="text-pink-500">*</span>
                    </label>
                    {[0,1,2].map(i=>(
                      <div key={i} className="flex flex-col sm:flex-row gap-2.5 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            คนที่ {i+1} : ชื่อ-นามสกุล{i===0&&<span className="text-pink-500 ml-1">*</span>}
                          </label>
                          <input type="text" value={students[i].name}
                            onChange={e=>handleStudentChange(i,'name',e.target.value)}
                            disabled={isReadOnly} required={i===0}
                            placeholder={`ชื่อ-นามสกุล คนที่ ${i+1}...`}
                            className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-lg text-sm
                                       focus:border-indigo-400 outline-none transition-all
                                       disabled:bg-slate-50 disabled:text-slate-500"/>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">รหัสนักศึกษา</label>
                          <input type="text" value={students[i].id}
                            onChange={e=>handleStudentChange(i,'id',e.target.value)}
                            disabled={isReadOnly}
                            placeholder={`รหัสนักศึกษา คนที่ ${i+1}...`}
                            className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-lg text-sm
                                       focus:border-indigo-400 outline-none transition-all
                                       disabled:bg-slate-50 disabled:text-slate-500"/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advisor */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      อาจารย์ที่ปรึกษา <span className="text-pink-500">*</span>
                    </label>
                    <input type="text" name="advisor" value={formData.advisor}
                      onChange={handleInputChange} disabled={isReadOnly} required
                      placeholder="ระบุชื่ออาจารย์ที่ปรึกษา..."
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm
                                 focus:bg-white focus:border-indigo-400 outline-none transition-all
                                 disabled:opacity-80 disabled:text-slate-600"/>
                  </div>

                  {/* Category */}
                                    <div className="relative group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Project Category
                    </label>

                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="
                          w-full px-4 py-3 pr-10
                          bg-slate-50 border border-slate-200
                          rounded-2xl text-sm font-medium text-slate-700
                          shadow-sm
                          transition-all duration-300 ease-in-out
                          focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                          hover:border-indigo-300 hover:shadow-md
                          outline-none appearance-none cursor-pointer
                        "
                      >
                        {[
                          'Web Application Development',
                          'Mobile Application Development',
                          'Desktop Application',
                          'AI / Machine Learning Project',
                          'IoT / Embedded Systems',
                          'Network & Cybersecurity',
                          'Database Management System',
                          'E-Commerce System',
                          'Business Information System',
                          'Game Development',
                          'Multimedia & Animation',
                          'Automation System',
                          'Smart Farming System',
                          'Accounting Information System',
                          'Educational Learning Platform',
                          'Hotel / POS System',
                          'Inventory Management System',
                          'Healthcare System'
                        ].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>

                      {/* Dropdown Icon */}
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 text-slate-400 transition-transform duration-300 group-focus-within:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">ปีการศึกษา</label>
                    <input type="number" name="academic_year" value={formData.academic_year}
                      onChange={handleInputChange} disabled={isReadOnly} placeholder="พ.ศ."
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm
                                 focus:bg-white focus:border-indigo-400 outline-none transition-all
                                 disabled:opacity-80 disabled:text-slate-600"/>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">สถานะ</label>
                    <select name="progress_status" value={formData.progress_status}
                      onChange={handleInputChange} disabled={isReadOnly}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-indigo-600
                                 focus:bg-white focus:border-indigo-400 outline-none transition-all cursor-pointer
                                 disabled:opacity-80">
                      <option>รออนุมัติหัวข้อ</option>
                    </select>
                  </div>

                  {/* PDF (hide on read-only) */}
                  {!isReadOnly && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-indigo-400 uppercase tracking-wider mb-1.5">
                        ไฟล์รูปเล่ม PDF {editingId&&'(อัปโหลดใหม่เพื่อเปลี่ยนไฟล์เดิม)'}
                      </label>
                      <label className="flex items-center gap-3 px-4 py-3.5 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors active:scale-[0.99] group">
                        <FileDown className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-indigo-700 font-bold truncate">
                            {formData.pdf_file ? formData.pdf_file.name : 'คลิกเพื่อเลือกไฟล์ PDF...'}
                          </p>
                          <p className="text-[10px] text-indigo-400 mt-0.5">รองรับไฟล์ .pdf ขนาดไม่เกิน 10MB</p>
                        </div>
                        <input type="file" name="pdf_file" accept=".pdf" onChange={handleInputChange} className="hidden"/>
                      </label>
                    </div>
                  )}

                  {/* Links */}
                  <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                      External Links (ตัวเลือก)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {icon:<Youtube className="w-4 h-4"/>, name:'video_url',  ph:'YouTube URL'},
                        {icon:<Github  className="w-4 h-4"/>, name:'github_url', ph:'GitHub URL'},
                        {icon:<Globe   className="w-4 h-4"/>, name:'drive_url',  ph:'Drive / Web URL'},
                      ].map(l=>(
                        <div key={l.name} className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{l.icon}</span>
                          <input type="url" name={l.name} value={formData[l.name]||''} placeholder={l.ph}
                            onChange={handleInputChange} disabled={isReadOnly}
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs sm:text-sm
                                       focus:border-indigo-400 focus:bg-white outline-none transition-all
                                       disabled:opacity-70"/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback (always visible, read-only styled) */}
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5"/> ข้อเสนอแนะจากอาจารย์
                    </label>
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 rounded-2xl
                                    text-slate-700 text-sm font-medium italic min-h-[80px] leading-relaxed">
                      {formData.feedback
                        ? <><span className="text-lg mr-2">💬</span>{formData.feedback}</>
                        : <span className="text-slate-400 not-italic flex items-center gap-2"><span className="text-2xl">🤍</span>ยังไม่มีข้อเสนอแนะจากอาจารย์</span>
                      }
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              {!isReadOnly && (
                <div className="px-5 sm:px-10 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/60 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-4 sm:px-7 py-2.5 font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-sm">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={submitLoading}
                    className="flex items-center gap-2 px-5 sm:px-8 py-2.5
                               bg-gradient-to-r from-indigo-500 to-purple-500
                               hover:from-indigo-600 hover:to-purple-600
                               text-white rounded-xl font-bold shadow-lg shadow-indigo-200/50
                               disabled:opacity-50 transition-all active:scale-95 text-sm">
                    {submitLoading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>กำลังบันทึก...</span></>
                      : <><Check className="w-4 h-4"/><span>{editingId ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างโครงงาน 🌸'}</span></>
                    }
                  </button>
                </div>
              )}

              {/* Close btn for read-only */}
              {isReadOnly && (
                <div className="px-5 sm:px-10 py-4 border-t border-slate-100 flex justify-end bg-slate-50/60 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex items-center gap-2 px-5 sm:px-7 py-2.5 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl font-bold transition-all active:scale-95 text-sm shadow-md">
                    <X className="w-4 h-4"/> ปิดหน้าต่าง
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Alert / Confirm */}
      <KawaiiAlertModal alertState={alertState} onClose={closeAlert} />
    </>
  );
};

export default Projectsubmit;