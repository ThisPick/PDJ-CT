import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Star, MessageSquare, FileText, Trash2, Edit,
  CheckCircle2, Clock, FileCheck, AlertCircle, FileDown, LayoutGrid,
  Globe, X, Save, Youtube, Github, Plus,
  Calendar, User, BookOpen, GraduationCap, Search, Menu,
  ShieldAlert, ChevronDown, ChevronLeft, ChevronRight, Filter, SlidersHorizontal
} from 'lucide-react';
import { getAllProjects, createProject, updateProject, deleteProject } from '../services/projectService';
import AdminSidebar from './AdminSidebar';

/* ─────────────────────────────────────────────────────────
   🔊  Web Audio
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
    if (type === 'success') { note(523,0,0.18); note(659,0.12,0.18); note(784,0.24,0.22); note(1047,0.36,0.35); }
    else if (type === 'error')   { note(440,0,0.18,0.5,'triangle'); note(349,0.16,0.28,0.4,'triangle'); }
    else if (type === 'confirm') { note(659,0,0.15,0.45); note(523,0.18,0.20,0.35); }
    else if (type === 'info')    { note(880,0,0.18,0.35); }
    else if (type === 'warn')    { note(600,0,0.12,0.45,'triangle'); note(500,0.14,0.22,0.35,'triangle'); }
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
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} style={{
          position:'absolute', left:`${5+(i*4.7)%90}%`, top:'50%',
          fontSize:`${12+(i%4)*6}px`,
          animation:`pflyType${i%3} 1.4s ease-out ${(i*0.07).toFixed(2)}s forwards`,
        }}>{items[i%items.length]}</span>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   🔔  Toast Stack
───────────────────────────────────────────────────────── */
const TOAST_GRAD = {
  success:'from-pink-400 to-rose-400', error:'from-red-400 to-orange-400',
  info:'from-indigo-400 to-purple-400', confirm:'from-amber-400 to-orange-400',
  warn:'from-yellow-400 to-orange-400',
};
const TOAST_ICON = { success:'🌸', error:'💔', info:'💫', confirm:'🤔', warn:'⚠️' };

const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id}
        style={{ animation:'toastSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
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
   🌀  Kawaii Loading
───────────────────────────────────────────────────────── */
const KawaiiLoader = () => (
  <div className="py-20 flex flex-col items-center gap-6">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-4 border-pink-100" />
      <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin"
           style={{ animationDirection:'reverse', animationDuration:'0.7s' }} />
      <div className="absolute inset-0 flex items-center justify-center text-2xl select-none"
           style={{ animation:'kawaiiPop 1s ease-in-out infinite' }}>🌸</div>
    </div>
    <div className="flex gap-1 items-end">
      {'กำลังโหลด'.split('').map((c, i) => (
        <span key={i} className="text-slate-400 font-black text-sm inline-block"
              style={{ animation:`letterBounce 0.7s ease-in-out ${i*0.07}s infinite alternate` }}>{c}</span>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   💬  Kawaii Alert / Confirm Modal
───────────────────────────────────────────────────────── */
const ALERT_CFG = {
  confirm:{ emoji:'🌺', grad:'from-amber-50 to-orange-50', btn:'from-orange-400 to-amber-500', ring:'ring-orange-200' },
  error:  { emoji:'💔', grad:'from-red-50 to-pink-50',     btn:'from-red-400 to-pink-500',     ring:'ring-red-200'    },
  success:{ emoji:'🌸', grad:'from-emerald-50 to-teal-50', btn:'from-emerald-400 to-teal-500', ring:'ring-emerald-200' },
  info:   { emoji:'💫', grad:'from-indigo-50 to-purple-50',btn:'from-indigo-400 to-purple-500',ring:'ring-indigo-200'  },
  warn:   { emoji:'⚠️', grad:'from-yellow-50 to-amber-50', btn:'from-yellow-400 to-orange-400',ring:'ring-yellow-200'  },
};

const KawaiiModal = ({ alertState, onClose }) => {
  if (!alertState.isOpen) return null;
  const c = ALERT_CFG[alertState.type] || ALERT_CFG.info;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
         style={{ animation:'fadeInOverlay 0.2s ease' }}>
      <div className={`bg-gradient-to-br ${c.grad} w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center border border-white ring-2 ${c.ring}`}
           style={{ animation:'modalBounceIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="text-6xl mb-5 leading-none select-none" style={{ animation:'emojiWiggle 0.55s ease 0.1s both' }}>{c.emoji}</div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{alertState.title}</h3>
        <p className="text-slate-500 text-sm mb-7 leading-relaxed">{alertState.message}</p>
        <div className="flex gap-3">
          {alertState.type === 'confirm' ? (
            <>
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">ยกเลิก</button>
              <button onClick={() => { alertState.onConfirm?.(); onClose(); }}
                className={`flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r ${c.btn} rounded-xl shadow-lg transition-all active:scale-95`}>ยืนยัน ✓</button>
            </>
          ) : (
            <button onClick={onClose} className={`w-full py-3 text-sm font-bold text-white bg-gradient-to-r ${c.btn} rounded-xl shadow-lg transition-all active:scale-95`}>ตกลง 🎀</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   🛡️  Duplicate Detection Utility
───────────────────────────────────────────────────────── */
// Normalize Thai/EN text for comparison
const normalizeTitle = (str = '') =>
  str.toLowerCase().replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '').trim();

// Simple Levenshtein distance
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

// Returns similarity 0–1
const similarity = (a, b) => {
  const na = normalizeTitle(a), nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshtein(na, nb) / maxLen;
};

const SIMILARITY_THRESHOLD = 0.72; // 72% similar → flag as duplicate

const findDuplicates = (projects, currentTitle, currentId = null) => {
  return projects
    .filter(p => p.project_id !== currentId)
    .map(p => ({ project: p, score: similarity(currentTitle, p.title_th) }))
    .filter(d => d.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
};

/* ─────────────────────────────────────────────────────────
   📂  Category Map per Level
───────────────────────────────────────────────────────── */
const CATEGORIES = {
  'ปวช.3': [
    'Web Application',
    'Mobile Application',
    'Desktop Application',
    'Game Development',
    'Multimedia & Animation',
    'IoT / Embedded Systems',
    'Database Management System',
    'E-Commerce System',
    'Inventory Management System',
    'Educational Learning Platform',
    'Smart Farming System',
    'Automation System',
    'Other',
  ],
  'ปวส.2': [
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
    'Healthcare System',
    'Other',
  ],
};

/* ─────────────────────────────────────────────────────────
   🔍  Duplicate Warning Banner (in modal)
───────────────────────────────────────────────────────── */
const DuplicateWarning = ({ duplicates, onDismiss }) => {
  if (!duplicates.length) return null;
  return (
    <div className="sm:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
         style={{ animation:'modalBounceIn 0.3s ease' }}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-amber-800 text-sm">ตรวจพบโครงงานที่คล้ายกัน! ⚠️</p>
          <p className="text-amber-600 text-xs mt-0.5 mb-2">กรุณาตรวจสอบว่าโครงงานนี้ซ้ำกับรายการด้านล่างหรือไม่</p>
          <div className="space-y-1.5">
            {duplicates.map(({ project, score }) => (
              <div key={project.project_id} className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{project.title_th}</p>
                  <p className="text-[10px] text-slate-400">{project.student_name} · ปี {project.academic_year} · {project.project_level}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg
                                  ${score >= 0.9 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {Math.round(score * 100)}% ซ้ำ
                </span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-amber-100 rounded-lg transition-colors active:scale-90">
          <X className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   🏠  ProjectSTD  —  MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const ProjectSTD = () => {
  /* ── State ── */
  const [projects,       setProjects]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [activeTab,      setActiveTab]     = useState('ทั้งหมด');
  const [searchText,     setSearchText]    = useState('');
  const [filterYear,     setFilterYear]    = useState('ทั้งหมด');
  const [filterLevel,    setFilterLevel]   = useState('ทั้งหมด');
  const [filterCategory, setFilterCategory]= useState('ทั้งหมด');
  const [showFilters,    setShowFilters]   = useState(false);
  const [submitLoading,  setSubmitLoading] = useState(false);
  const [sidebarOpen,    setSidebarOpen]   = useState(false);
  const [particle,       setParticle]      = useState(false);
  const [toasts,         setToasts]        = useState([]);
  const [isModalOpen,    setIsModalOpen]   = useState(false);
  const [editingId,      setEditingId]     = useState(null);
  const [students,       setStudents]      = useState([{name:'',id:''},{name:'',id:''},{name:'',id:''}]);
  const [alertState,     setAlertState]    = useState({ isOpen:false, type:'info', title:'', message:'', onConfirm:null });
  const [duplicates,     setDuplicates]    = useState([]);
  const [showDupWarning, setShowDupWarning]= useState(false);
  const [currentPage,    setCurrentPage]  = useState(1);
  const ROWS_PER_PAGE = 5;
  const toastRef = useRef(0);
  const dupCheckTimer = useRef(null);

  /* ── Toast helpers ── */
  const pushToast = useCallback((type, title, message, duration = 3500) => {
    const id = ++toastRef.current;
    setToasts(p => [...p, { id, type, title, message, duration }]);
    playSound(type);
    if (type === 'success') setParticle(true);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration + 500);
  }, []);

  const showAlert   = (t, title, msg)  => { playSound(t); setAlertState({ isOpen:true, type:t, title, message:msg, onConfirm:null }); };
  const showConfirm = (title, msg, fn) => { playSound('confirm'); setAlertState({ isOpen:true, type:'confirm', title, message:msg, onConfirm:fn }); };
  const closeAlert  = () => setAlertState(p => ({ ...p, isOpen:false }));

  /* ── Form ── */
  const initialForm = {
    title_th:'', title_en:'', student_name:'', student_id:'',
    academic_year: new Date().getFullYear() + 543, project_level:'ปวส.2',
    category:'Web Application Development', advisor:'', progress_status:'รออนุมัติหัวข้อ',
    is_featured:false, video_url:'', github_url:'', drive_url:'', feedback:'', pdf_file:null
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(data.map(p => ({ ...p, is_featured: p.is_featured===true||p.is_featured===1||p.is_featured==='1' })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* ── Duplicate check with debounce ── */
  const checkDuplicates = useCallback((title, id) => {
    clearTimeout(dupCheckTimer.current);
    if (!title || title.length < 5) { setDuplicates([]); setShowDupWarning(false); return; }
    dupCheckTimer.current = setTimeout(() => {
      const found = findDuplicates(projects, title, id);
      setDuplicates(found);
      if (found.length > 0) {
        setShowDupWarning(true);
        playSound('warn');
      } else {
        setShowDupWarning(false);
      }
    }, 600);
  }, [projects]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...initialForm });
    setStudents([{name:'',id:''},{name:'',id:''},{name:'',id:''}]);
    setDuplicates([]);
    setShowDupWarning(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (project) => {
    setEditingId(project.project_id);
    const names = project.student_name?.split(',').map(n=>n.trim()) || [];
    const ids   = project.student_id?.split(',').map(i=>i.trim())   || [];
    setStudents([0,1,2].map(i => ({ name:names[i]||'', id:ids[i]||'' })));
    setFormData({
      title_th:project.title_th, title_en:project.title_en||'',
      student_id:project.student_id||'', student_name:project.student_name||'',
      academic_year:project.academic_year||(new Date().getFullYear()+543),
      project_level:project.project_level||'ปวส.2',
      category:project.category||'Web Application Development',
      advisor:project.advisor||'',
      progress_status:project.progress_status||'รออนุมัติหัวข้อ',
      is_featured:project.is_featured===true||project.is_featured===1,
      video_url:project.video_url||'', github_url:project.github_url||'',
      drive_url:project.drive_url||'', feedback:project.feedback||'', pdf_file:null
    });
    setDuplicates([]);
    setShowDupWarning(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(p => ({ ...p, [name]:files[0] }));
    } else {
      const newVal = type === 'checkbox' ? checked : value;
      setFormData(p => {
        const updated = { ...p, [name]:newVal };
        // When level changes, reset category to first option of new level
        if (name === 'project_level') {
          updated.category = CATEGORIES[newVal]?.[0] || '';
        }
        return updated;
      });
      // Trigger dup check on title change
      if (name === 'title_th') {
        checkDuplicates(value, editingId);
      }
    }
  };

  const handleStudentChange = (i, field, val) => {
    const u = [...students]; u[i] = { ...u[i], [field]:val }; setStudents(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Warn on duplicates but allow override
    if (duplicates.length > 0 && showDupWarning) {
      showConfirm(
        'มีโครงงานที่คล้ายกันอยู่แล้ว ⚠️',
        `พบ ${duplicates.length} โครงงานที่ชื่อคล้ายกัน ต้องการบันทึกต่อไปหรือไม่?`,
        () => submitForm()
      );
      return;
    }
    submitForm();
  };

  const submitForm = async () => {
    setSubmitLoading(true);
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
      let userId = 1;
      if (userStr) { const u = JSON.parse(userStr); userId = u.id || u.user_id; }

      const data = new FormData();
      const combinedNames = students.map(s=>s.name.trim()).filter(Boolean).join(', ');
      const combinedIds   = students.map(s=>s.id.trim()).filter(Boolean).join(', ');

      if (!combinedNames) {
        showAlert('error','ข้อมูลไม่ครบ','กรุณาระบุชื่อผู้จัดทำอย่างน้อย 1 คน');
        setSubmitLoading(false); return;
      }

      Object.keys(formData).forEach(key => {
        if (key === 'pdf_file')      { if (formData[key]) data.append('pdf_file', formData[key]); }
        else if (key === 'student_name') data.append('student_name', combinedNames);
        else if (key === 'student_id')   data.append('student_id',   combinedIds);
        else data.append(key, formData[key] === null ? '' : formData[key]);
      });
      data.append('created_by', userId);

      if (editingId) { await updateProject(editingId, data); pushToast('success','บันทึกสำเร็จ! 🌸','อัปเดตข้อมูลเรียบร้อยแล้ว'); }
      else           { await createProject(data);            pushToast('success','เพิ่มโครงงานแล้ว! ✨','สร้างโครงงานใหม่เรียบร้อย'); }

      setIsModalOpen(false); loadProjects();
    } catch (err) {
      pushToast('error','เกิดข้อผิดพลาด 💔', err.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally { setSubmitLoading(false); }
  };

  const handleDeleteClick = (id) =>
    showConfirm('ยืนยันการลบ? 🗑️','ต้องการลบโครงงานนี้? ไม่สามารถเรียกคืนได้', () => performDelete(id));

  const performDelete = async (id) => {
    try { await deleteProject(id); pushToast('info','ลบแล้ว 🍂','โครงงานถูกลบออกจากระบบ'); loadProjects(); }
    catch { pushToast('error','ผิดพลาด 💔','ไม่สามารถลบข้อมูลได้'); }
  };

  /* ── Derived filter options ── */
  const yearOptions = ['ทั้งหมด', ...Array.from(new Set(projects.map(p => String(p.academic_year)))).sort((a,b) => b-a)];
  const categoryOptions = ['ทั้งหมด', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean))).sort()];
  const activeFilterCount = [filterYear,filterLevel,filterCategory].filter(v => v !== 'ทั้งหมด').length;

  /* ── Filtering ── */
  const filtered = projects.filter(p => {
    const matchTab      = activeTab === 'ทั้งหมด' || p.progress_status === activeTab;
    const matchYear     = filterYear === 'ทั้งหมด' || String(p.academic_year) === filterYear;
    const matchLevel    = filterLevel === 'ทั้งหมด' || p.project_level === filterLevel;
    const matchCategory = filterCategory === 'ทั้งหมด' || p.category === filterCategory;
    const s = searchText.toLowerCase();
    const matchSearch   = !s || p.title_th?.toLowerCase().includes(s) || p.title_en?.toLowerCase().includes(s) || p.student_name?.toLowerCase().includes(s);
    return matchTab && matchYear && matchLevel && matchCategory && matchSearch;
  });

  const resetFilters = () => { setFilterYear('ทั้งหมด'); setFilterLevel('ทั้งหมด'); setFilterCategory('ทั้งหมด'); setSearchText(''); setActiveTab('ทั้งหมด'); setCurrentPage(1); };

  /* ── Pagination ── */
  const totalPages  = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const safePage    = Math.min(currentPage, Math.max(totalPages, 1));
  const paginated   = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const goToPage    = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // Reset to page 1 whenever filter changes
  const prevFilterKey = useRef('');
  const filterKey = `${activeTab}|${searchText}|${filterYear}|${filterLevel}|${filterCategory}`;
  if (prevFilterKey.current !== filterKey) { prevFilterKey.current = filterKey; if (currentPage !== 1) setCurrentPage(1); }

  const getStatusCfg = (status) => ({
    'สมบูรณ์':        { color:'text-emerald-700 bg-emerald-50 border-emerald-200', icon:<CheckCircle2 className="w-3.5 h-3.5"/>, bar:'bg-emerald-500', progress:100 },
    'รออนุมัติเล่ม':  { color:'text-purple-700 bg-purple-50 border-purple-200',   icon:<FileCheck    className="w-3.5 h-3.5"/>, bar:'bg-purple-500',  progress:80  },
    'กำลังทำ':        { color:'text-blue-700 bg-blue-50 border-blue-200',          icon:<Clock        className="w-3.5 h-3.5"/>, bar:'bg-blue-500',    progress:50  },
    'รออนุมัติหัวข้อ':{ color:'text-orange-700 bg-orange-50 border-orange-200',   icon:<AlertCircle  className="w-3.5 h-3.5"/>, bar:'bg-orange-500',  progress:15  },
  }[status] || { color:'text-slate-500 bg-slate-100 border-slate-200', icon:<AlertCircle className="w-3.5 h-3.5"/>, bar:'bg-slate-300', progress:0 });

  /* ── Stat Cards ── */
  const STAT_CARDS = [
    { label:'ทั้งหมด',  val:projects.length,                                                    emoji:'📚', from:'from-indigo-500', to:'to-blue-500'   },
    { label:'ปวช.3',    val:projects.filter(p=>p.project_level==='ปวช.3').length,               emoji:'🎓', from:'from-teal-400',   to:'to-cyan-400'   },
    { label:'ปวส.2',    val:projects.filter(p=>p.project_level==='ปวส.2').length,               emoji:'🏫', from:'from-violet-500', to:'to-purple-500' },
    { label:'สมบูรณ์',  val:projects.filter(p=>p.progress_status==='สมบูรณ์').length,           emoji:'✅', from:'from-emerald-500',to:'to-teal-500'   },
    { label:'รออนุมัติ',val:projects.filter(p=>p.progress_status==='รออนุมัติหัวข้อ').length,  emoji:'⏳', from:'from-orange-400', to:'to-amber-400'  },
    { label:'Featured', val:projects.filter(p=>p.is_featured).length,                           emoji:'⭐', from:'from-pink-500',   to:'to-rose-400'   },
  ];

  /* ════════════════════════════════ JSX ════════════════════════════════ */
  return (
    <>
      {/* ══ Keyframe Injector ══ */}
      <style>{`
        @keyframes pflyType0 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(55px,-170px)scale(0)} }
        @keyframes pflyType1 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(-70px,-200px)scale(0)} }
        @keyframes pflyType2 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(10px,-220px)scale(0)} }
        @keyframes toastSlideIn  { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes bounceIcon    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes fadeInOverlay   { from{opacity:0} to{opacity:1} }
        @keyframes modalBounceIn   { from{opacity:0;transform:scale(0.75)translateY(20px)} to{opacity:1;transform:scale(1)translateY(0)} }
        @keyframes emojiWiggle     { 0%{transform:rotate(-12deg)scale(0.6)} 50%{transform:rotate(10deg)scale(1.25)} 80%{transform:rotate(-4deg)scale(1.05)} 100%{transform:rotate(0)scale(1)} }
        @keyframes kawaiiPop   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
        @keyframes letterBounce{ from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowSlide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatAnim{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes filterSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .stat-card { animation: cardIn 0.4s ease both; }
        .data-row  { animation: rowSlide 0.32s ease both; }
        .filter-panel { animation: filterSlide 0.25s ease both; }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
      `}</style>

      <ParticleBurst active={particle} onDone={() => setParticle(false)} />
      <Toast toasts={toasts} />

      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
               onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`fixed lg:static inset-y-0 left-0 z-[60] transition-transform duration-300 ease-in-out
                         ${sidebarOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

          {/* ── Top Bar (bell removed) ── */}
          <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4
                             flex items-center justify-between shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                      onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-2 leading-tight">
                  <LayoutGrid className="text-indigo-600 w-5 h-5 sm:w-7 sm:h-7 shrink-0" />
                  <span className="hidden sm:inline">ระบบบริหารโครงงาน</span>
                  <span className="sm:hidden">โครงงาน</span>
                </h1>
                <p className="hidden sm:block text-slate-400 text-xs font-medium mt-0.5">
                  จัดการข้อมูลโครงงานนักศึกษา (Admin)
                </p>
              </div>
            </div>
            <button onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5
                         bg-gradient-to-r from-indigo-500 to-purple-500
                         hover:from-indigo-600 hover:to-purple-600
                         text-white rounded-xl shadow-lg shadow-indigo-200/50
                         font-bold text-sm transition-all active:scale-95">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">เพิ่มโครงงาน</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          </header>

          {/* ── Scrollable body ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
            <div className="max-w-screen-2xl mx-auto space-y-5 sm:space-y-6">

              {/* ── Stat Cards (6 cards) ── */}
              <div className="grid grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {STAT_CARDS.map((c, i) => (
                  <div key={i}
                    className="stat-card bg-white rounded-2xl border border-slate-100 shadow-sm
                               overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default"
                    style={{ animationDelay:`${i*0.06}s` }}>
                    <div className={`h-1.5 bg-gradient-to-r ${c.from} ${c.to}`} />
                    <div className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl select-none hidden sm:inline"
                            style={{ animation:`floatAnim 3s ease-in-out ${i*0.55}s infinite` }}>{c.emoji}</span>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{c.label}</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{c.val}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Filter Section ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">

                {/* Row 1: Status Tabs + Search + Filter Toggle */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Tabs */}
                  <div className="overflow-x-auto pb-0.5 flex-1">
                    <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-max">
                      {['ทั้งหมด','รออนุมัติหัวข้อ','กำลังทำ','รออนุมัติเล่ม','สมบูรณ์'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all active:scale-95
                                      ${activeTab===tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Search + filter toggle */}
                  <div className="flex gap-2 shrink-0">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="text"
                        placeholder="ค้นหา..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                   focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                    </div>
                    <button onClick={() => setShowFilters(v => !v)}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95
                                  ${showFilters || activeFilterCount > 0
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'}`}>
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">ตัวกรอง</span>
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {activeFilterCount > 0 && (
                      <button onClick={resetFilters}
                        className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 font-bold text-xs transition-all active:scale-95">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Advanced Filters Panel */}
                {showFilters && (
                  <div className="filter-panel grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    {/* ปีการศึกษา */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />ปีการศึกษา
                      </label>
                      <div className="relative">
                        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                          className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                     focus:border-indigo-400 focus:bg-white outline-none transition-all cursor-pointer">
                          {yearOptions.map(y => <option key={y}>{y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* ระดับชั้น */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <GraduationCap className="w-3 h-3" />ระดับชั้น
                      </label>
                      <div className="relative">
                        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                          className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                     focus:border-indigo-400 focus:bg-white outline-none transition-all cursor-pointer">
                          <option>ทั้งหมด</option>
                          <option>ปวช.3</option>
                          <option>ปวส.2</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* หมวดหมู่โครงงาน */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />หมวดหมู่
                      </label>
                      <div className="relative">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                          className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                     focus:border-indigo-400 focus:bg-white outline-none transition-all cursor-pointer">
                          {categoryOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-bold self-center">กรองโดย:</span>
                    {filterYear !== 'ทั้งหมด' && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Calendar className="w-3 h-3"/>ปี {filterYear}
                        <button onClick={() => setFilterYear('ทั้งหมด')} className="ml-0.5 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </span>
                    )}
                    {filterLevel !== 'ทั้งหมด' && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-700 rounded-lg">
                        <GraduationCap className="w-3 h-3"/>{filterLevel}
                        <button onClick={() => setFilterLevel('ทั้งหมด')} className="ml-0.5 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </span>
                    )}
                    {filterCategory !== 'ทั้งหมด' && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg">
                        <BookOpen className="w-3 h-3"/>{filterCategory}
                        <button onClick={() => setFilterCategory('ทั้งหมด')} className="ml-0.5 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </span>
                    )}
                  </div>
                )}

                {/* Result count */}
                <p className="text-xs text-slate-400 font-medium">
                  แสดง <span className="font-black text-slate-600">{filtered.length}</span> รายการ
                  {projects.length !== filtered.length && ` จากทั้งหมด ${projects.length} รายการ`}
                </p>
              </div>

              {/* ── Data Table ── */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
                {loading ? <KawaiiLoader /> : filtered.length === 0 ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                    <span className="text-5xl select-none" style={{ animation:'floatAnim 3s ease-in-out infinite' }}>🔍</span>
                    <p className="font-bold text-sm sm:text-base">
                      {searchText || activeFilterCount > 0 ? 'ไม่พบโครงงานที่ตรงกับเงื่อนไข' : 'ไม่มีโครงงานในหมวดนี้'}
                    </p>
                    {(activeFilterCount > 0 || searchText) && (
                      <button onClick={resetFilters} className="text-xs font-bold text-indigo-500 hover:underline">ล้างตัวกรองทั้งหมด</button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-xs uppercase font-black tracking-wider">
                            <th className="px-5 lg:px-7 py-4">รายละเอียด</th>
                            <th className="px-4 py-4">ระดับ / หมวดหมู่</th>
                            <th className="px-4 py-4 text-center">ไฟล์ / ลิงก์</th>
                            <th className="px-4 py-4 text-center">สถานะ</th>
                            <th className="px-4 py-4 text-center">Feedback</th>
                            <th className="px-5 lg:px-7 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {paginated.map((p, ri) => {
                            const cfg   = getStatusCfg(p.progress_status);
                            const names = p.student_name?.split(',').map(n=>n.trim()) || [p.creator_name||'ไม่ระบุ'];
                            const isPvch = p.project_level === 'ปวช.3';
                            return (
                              <tr key={p.project_id}
                                  className="data-row hover:bg-indigo-50/20 transition-colors group"
                                  style={{ animationDelay:`${ri*0.04}s` }}>

                                {/* Detail */}
                                <td className="px-5 lg:px-7 py-5 max-w-xs xl:max-w-sm">
                                  <div className="flex items-start gap-3.5">
                                    <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                                                     group-hover:scale-105 transition-transform
                                                     ${p.is_featured?'bg-amber-100 border-amber-200 text-amber-500':'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                      {p.is_featured?<Star className="w-4 h-4 fill-current"/>:<FileText className="w-4 h-4"/>}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-bold text-sm lg:text-base text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{p.title_th}</h3>
                                      <p className="text-xs text-slate-400 truncate mt-0.5">{p.title_en||'—'}</p>
                                      <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                                        {names.map((n,i)=>(
                                          <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                            <User className="w-3 h-3"/>{n}
                                          </span>
                                        ))}
                                        {p.advisor && (
                                          <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                            <BookOpen className="w-3 h-3"/>อ.{p.advisor}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Level + Category (new column) */}
                                <td className="px-4 py-5 min-w-[150px]">
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg w-fit
                                                     ${isPvch
                                                       ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                       : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
                                      <GraduationCap className="w-3 h-3"/>{p.project_level}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                                      <BookOpen className="w-3 h-3 shrink-0"/><span className="line-clamp-1">{p.category}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                      <Calendar className="w-3 h-3"/>ปี {p.academic_year}
                                    </span>
                                  </div>
                                </td>

                                {/* Links */}
                                <td className="px-4 py-5">
                                  <div className="flex justify-center items-center gap-1.5 flex-wrap">
                                    {p.pdf_file_path && <a href={p.pdf_file_path.startsWith('http')?p.pdf_file_path:`http://localhost:5000/uploads/pdf/${p.pdf_file_path}`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-sm"><FileDown className="w-4 h-4"/></a>}
                                    {p.video_url  && <a href={p.video_url}  target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-sm"><Youtube className="w-4 h-4"/></a>}
                                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white transition-all hover:scale-110 shadow-sm"><Github className="w-4 h-4"/></a>}
                                    {p.drive_url  && <a href={p.drive_url}  target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 shadow-sm"><Globe className="w-4 h-4"/></a>}
                                    {!p.pdf_file_path && !p.video_url && !p.github_url && !p.drive_url && <span className="text-slate-200 text-sm">—</span>}
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-5 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${cfg.color}`}>
                                    {cfg.icon}{p.progress_status}
                                  </span>
                                  <div className="mt-2 w-16 mx-auto h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${cfg.bar} rounded-full transition-all duration-1000`} style={{ width:`${cfg.progress}%` }}/>
                                  </div>
                                </td>

                                {/* Feedback */}
                                <td className="px-4 py-5 text-center">
                                  {p.feedback ? (
                                    <div className="relative group/tip inline-block">
                                      <MessageSquare className="w-5 h-5 text-indigo-400 cursor-help hover:text-indigo-600 hover:scale-110 transition-all"/>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 p-3.5 bg-slate-800 text-white text-xs rounded-2xl
                                                       opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-2xl pointer-events-none text-left">
                                        <p className="font-bold text-[10px] uppercase text-slate-400 mb-1.5">Feedback</p>
                                        <p className="leading-relaxed">"{p.feedback}"</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-800"/>
                                      </div>
                                    </div>
                                  ) : <span className="text-slate-200">•</span>}
                                </td>

                                {/* Actions */}
                                <td className="px-5 lg:px-7 py-5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleEditClick(p)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 active:scale-90"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteClick(p.project_id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-90"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="sm:hidden divide-y divide-slate-100">
                      {paginated.map((p, ri) => {
                        const cfg   = getStatusCfg(p.progress_status);
                        const names = p.student_name?.split(',').map(n=>n.trim()) || [p.creator_name||'ไม่ระบุ'];
                        const isPvch = p.project_level === 'ปวช.3';
                        return (
                          <div key={p.project_id} className="data-row p-4 hover:bg-indigo-50/10 transition-colors" style={{ animationDelay:`${ri*0.04}s` }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border
                                                 ${p.is_featured?'bg-amber-100 border-amber-200 text-amber-500':'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                  {p.is_featured?<Star className="w-4 h-4 fill-current"/>:<FileText className="w-4 h-4"/>}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{p.title_th}</h3>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate">{p.title_en||'—'}</p>
                                </div>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteClick(p.project_id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4"/></button>
                              </div>
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${cfg.color}`}>{cfg.icon}{p.progress_status}</span>
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${isPvch?'text-teal-700 bg-teal-50':'text-violet-700 bg-violet-50'}`}>{p.project_level}</span>
                              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">ปี {p.academic_year}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium mt-1.5 truncate">{p.category}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {names.map((n,i)=><span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{n}</span>)}
                              {p.advisor && <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">อ.{p.advisor}</span>}
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${cfg.bar} rounded-full`} style={{ width:`${cfg.progress}%` }}/>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                {p.pdf_file_path && <a href={p.pdf_file_path.startsWith('http')?p.pdf_file_path:`http://localhost:5000/uploads/pdf/${p.pdf_file_path}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 bg-red-50 active:scale-90"><FileDown className="w-3.5 h-3.5"/></a>}
                                {p.video_url  && <a href={p.video_url}  target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 bg-red-50 active:scale-90"><Youtube className="w-3.5 h-3.5"/></a>}
                                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 bg-slate-100 active:scale-90"><Github className="w-3.5 h-3.5"/></a>}
                                {p.drive_url  && <a href={p.drive_url}  target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 active:scale-90"><Globe className="w-3.5 h-3.5"/></a>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Pagination Footer (shows only when > ROWS_PER_PAGE) ── */}
                    {totalPages > 1 && (
                      <div className="border-t border-slate-100 px-5 sm:px-7 py-3.5 flex items-center justify-between gap-3 bg-slate-50/60">
                        {/* Info */}
                        <p className="text-xs text-slate-400 font-medium shrink-0">
                          <span className="font-black text-slate-600">
                            {(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filtered.length)}
                          </span>
                          {' '}จาก{' '}
                          <span className="font-black text-slate-600">{filtered.length}</span>
                          {' '}รายการ
                        </p>

                        {/* Page buttons */}
                        <div className="flex items-center gap-1">
                          {/* Prev */}
                          <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500
                                       hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90">
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {/* Page numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => {
                            // Show: first, last, current ±1, and ellipsis
                            const show = pg === 1 || pg === totalPages || Math.abs(pg - safePage) <= 1;
                            const ellipsisBefore = pg === safePage - 2 && safePage - 2 > 1;
                            const ellipsisAfter  = pg === safePage + 2 && safePage + 2 < totalPages;
                            if (!show) return null;
                            return (
                              <React.Fragment key={pg}>
                                {ellipsisBefore && <span className="w-8 text-center text-slate-300 text-xs font-bold">…</span>}
                                <button onClick={() => goToPage(pg)}
                                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-all active:scale-90
                                              ${safePage === pg
                                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                                                : 'border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'}`}>
                                  {pg}
                                </button>
                                {ellipsisAfter && <span className="w-8 text-center text-slate-300 text-xs font-bold">…</span>}
                              </React.Fragment>
                            );
                          })}

                          {/* Next */}
                          <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500
                                       hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ════════ Form Modal ════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
             style={{ animation:'fadeInOverlay 0.2s ease' }}>
          <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
               style={{ animation:'modalBounceIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>

            {/* Header */}
            <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-sm sm:text-xl font-black text-slate-800 flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                  {editingId ? <Edit className="w-4 h-4 sm:w-5 sm:h-5"/> : <Plus className="w-4 h-4 sm:w-5 sm:h-5"/>}
                </div>
                {editingId ? 'แก้ไขข้อมูลโครงงาน ✏️' : 'สร้างโครงงานใหม่ ✨'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/80 rounded-full transition-colors active:scale-90">
                <X className="w-5 h-5 text-slate-500"/>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-5 sm:px-8 py-5 sm:py-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

                  {/* Duplicate warning */}
                  {showDupWarning && (
                    <DuplicateWarning duplicates={duplicates} onDismiss={() => setShowDupWarning(false)} />
                  )}

                  {/* Titles */}
                  <div className="sm:col-span-2 space-y-3">
                    {[
                      { label:'ชื่อโครงงาน (TH)', name:'title_th', req:true,  ph:'เช่น ระบบบริหารจัดการ...' },
                      { label:'Project Title (EN)',name:'title_en', req:false, ph:'e.g. Management System...' },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                          {f.label}{f.req && <span className="text-pink-500 ml-1">*</span>}
                        </label>
                        <input type="text" name={f.name} value={formData[f.name]}
                          required={f.req} onChange={handleInputChange} placeholder={f.ph}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
                                     focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"/>
                      </div>
                    ))}
                  </div>

                  {/* Students */}
                  <div className="sm:col-span-2 space-y-2.5 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                      ผู้จัดทำ (สูงสุด 3 คน) <span className="text-pink-500">*</span>
                    </label>
                    {[0,1,2].map(i => (
                      <div key={i} className="flex flex-col sm:flex-row gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            คนที่ {i+1} : ชื่อ-นามสกุล{i===0 && <span className="text-pink-500 ml-1">*</span>}
                          </label>
                          <input type="text" value={students[i].name}
                            onChange={e => handleStudentChange(i,'name',e.target.value)} required={i===0}
                            placeholder={`ชื่อ-นามสกุล คนที่ ${i+1}`}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"/>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">รหัสนักศึกษา</label>
                          <input type="text" value={students[i].id}
                            onChange={e => handleStudentChange(i,'id',e.target.value)}
                            placeholder={`รหัส คนที่ ${i+1}`}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advisor */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      อาจารย์ที่ปรึกษา <span className="text-pink-500">*</span>
                    </label>
                    <input type="text" name="advisor" value={formData.advisor} required onChange={handleInputChange}
                      placeholder="ระบุชื่ออาจารย์..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all"/>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">ปีการศึกษา</label>
                    <input type="number" name="academic_year" value={formData.academic_year} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all"/>
                  </div>

                  {/* Level — drives category list */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      ระดับชั้น <span className="text-pink-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {['ปวช.3','ปวส.2'].map(lv => (
                        <button key={lv} type="button"
                          onClick={() => handleInputChange({ target:{ name:'project_level', value:lv, type:'text' } })}
                          className={`flex-1 py-2.5 rounded-xl font-black text-sm border transition-all active:scale-95
                                      ${formData.project_level === lv
                                        ? lv==='ปวช.3'
                                          ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-200'
                                          : 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                          {lv === 'ปวช.3' ? '🎓 ปวช.3' : '🏫 ปวส.2'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category — dynamic based on level */}
                  <div className="relative">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      หมวดหมู่โครงงาน <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <select name="category" value={formData.category} onChange={handleInputChange}
                        className="w-full appearance-none px-4 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium
                                   focus:bg-white focus:border-indigo-400 outline-none transition-all cursor-pointer">
                        {(CATEGORIES[formData.project_level] || CATEGORIES['ปวส.2']).map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      หมวดหมู่สำหรับ <span className={`font-black ${formData.project_level==='ปวช.3'?'text-teal-600':'text-violet-600'}`}>{formData.project_level}</span>
                      {' '}({(CATEGORIES[formData.project_level]||CATEGORIES['ปวส.2']).length} หมวด)
                    </p>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">สถานะ</label>
                    <select name="progress_status" value={formData.progress_status} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all cursor-pointer">
                      <option value="รออนุมัติหัวข้อ">🟠 รออนุมัติหัวข้อ</option>
                      <option value="กำลังทำ">🔵 กำลังทำ</option>
                      <option value="รออนุมัติเล่ม">🟣 รออนุมัติเล่ม</option>
                      <option value="สมบูรณ์">🟢 สมบูรณ์</option>
                    </select>
                  </div>

                  {/* PDF */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-red-400 uppercase tracking-wider mb-1.5">
                      ไฟล์ PDF {editingId && '(อัปโหลดใหม่เพื่อเปลี่ยน)'}
                    </label>
                    <label className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-dashed border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors active:scale-[0.99]">
                      <FileDown className="w-4 h-4 text-red-500 shrink-0"/>
                      <span className="text-xs sm:text-sm text-red-500 font-medium truncate">
                        {formData.pdf_file ? formData.pdf_file.name : 'เลือกไฟล์ PDF...'}
                      </span>
                      <input type="file" name="pdf_file" accept=".pdf" onChange={handleInputChange} className="hidden"/>
                    </label>
                  </div>

                  {/* Links */}
                  <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">External Links</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { icon:<Youtube className="w-4 h-4"/>, name:'video_url',  ph:'YouTube URL' },
                        { icon:<Github  className="w-4 h-4"/>, name:'github_url', ph:'GitHub URL' },
                        { icon:<Globe   className="w-4 h-4"/>, name:'drive_url',  ph:'Drive / Web URL' },
                      ].map(l => (
                        <div key={l.name} className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{l.icon}</span>
                          <input type="url" name={l.name} value={formData[l.name]} placeholder={l.ph}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-indigo-400 focus:bg-white outline-none transition-all"/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Feedback จากอาจารย์</label>
                    <textarea name="feedback" value={formData.feedback} onChange={handleInputChange}
                      placeholder="ข้อเสนอแนะ..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all min-h-[70px] resize-none"/>
                  </div>

                  {/* Featured toggle */}
                  <div className="sm:col-span-2">
                    <label className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer border transition-all select-none active:scale-[0.99]
                                       ${formData.is_featured ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'}`}>
                      <div className={`relative shrink-0 w-10 rounded-full transition-colors duration-300 ${formData.is_featured?'bg-amber-400':'bg-slate-300'}`} style={{ height:'22px' }}>
                        <div className={`absolute top-0.5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.is_featured?'left-5':'left-0.5'}`} style={{ width:'18px', height:'18px' }}/>
                      </div>
                      <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="hidden"/>
                      <span className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                        <Star className={`w-4 h-4 shrink-0 ${formData.is_featured?'fill-amber-500 text-amber-500':'text-slate-400'}`}/>
                        <span className={formData.is_featured?'text-amber-700':'text-slate-500'}>Featured Project (แสดงเป็นผลงานแนะนำ)</span>
                      </span>
                    </label>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-8 py-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/60">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitLoading}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5
                             bg-gradient-to-r from-indigo-500 to-purple-500
                             hover:from-indigo-600 hover:to-purple-600
                             text-white rounded-xl font-bold shadow-lg shadow-indigo-200/50
                             disabled:opacity-50 transition-all active:scale-95 text-xs sm:text-sm">
                  {submitLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>กำลังบันทึก...</span></>
                  ) : (
                    <><Save className="w-4 h-4"/><span>{editingId ? 'บันทึกการแก้ไข' : 'สร้างโครงงาน 🌸'}</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <KawaiiModal alertState={alertState} onClose={closeAlert} />
    </>
  );
};

export default ProjectSTD;