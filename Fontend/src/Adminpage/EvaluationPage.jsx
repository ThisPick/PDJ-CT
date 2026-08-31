import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/evaluationService';
import {
  Layout, Table, Button, Modal, Slider, Input, Row, Col,
  Divider, Spin, Empty, Select, Tag, Tooltip
} from 'antd';
import {
  SolutionOutlined, EditOutlined, SearchOutlined, UserOutlined,
  StarFilled, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  FilePdfOutlined, CheckCircleOutlined, BookOutlined,
  TrophyFilled, SaveOutlined, CloseOutlined, SmileOutlined,
  ThunderboltOutlined, FilterOutlined, ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';

const { Content } = Layout;
const { Option } = Select;

/* ─────────────────────────────────────────
   AUDIO ENGINE
───────────────────────────────────────── */
class SFX {
  constructor() { this.c = null; }
  _g() { if (!this.c) this.c = new (window.AudioContext || window.webkitAudioContext)(); return this.c; }
  _r(fn) { try { fn(this._g()); } catch (e) {} }
  chime() { this._r(c => { [523, 659, 784, 1047].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = f; const t = c.currentTime + i * .09; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.15, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .4); o.start(t); o.stop(t + .4); }); }); }
  pop() { this._r(c => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'triangle'; o.frequency.setValueAtTime(320, c.currentTime); o.frequency.exponentialRampToValueAtTime(900, c.currentTime + .05); g.gain.setValueAtTime(.18, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .08); o.start(); o.stop(c.currentTime + .08); }); }
  buzz() { this._r(c => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'square'; o.frequency.setValueAtTime(200, c.currentTime); o.frequency.linearRampToValueAtTime(100, c.currentTime + .15); g.gain.setValueAtTime(.1, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .15); o.start(); o.stop(c.currentTime + .15); }); }
}
const sfx = new SFX();

/* ─────────────────────────────────────────
   SCORE CONFIG
───────────────────────────────────────── */
const getScoreLevel = (score) => {
  if (score === null || score === undefined) return null;
  if (score >= 80) return { label: 'ยอดเยี่ยม', emoji: '🌟', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', text: 'text-green-600' };
  if (score >= 60) return { label: 'ดีมาก',    emoji: '👍', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', text: 'text-blue-600' };
  if (score >= 40) return { label: 'พอใจ',     emoji: '📚', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', text: 'text-amber-600' };
  return                  { label: 'ต้องปรับปรุง', emoji: '⚠️', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', text: 'text-red-600' };
};

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
const TCFG = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✅', title: 'สำเร็จ!',    color: '#16a34a' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '❌', title: 'ผิดพลาด!',  color: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', title: 'แจ้งเตือน', color: '#d97706' },
};
const Toaster = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, width: 340 }}>
    {toasts.map(t => {
      const c = TCFG[t.type] || TCFG.success;
      return (
        <div key={t.id} onClick={() => remove(t.id)} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', overflow: 'hidden', animation: 'toastIn .32s cubic-bezier(.34,1.56,.64,1)', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,.09)' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: c.color, animation: `shrinkBar ${t.dur}ms linear forwards`, borderRadius: 99 }} />
          <span style={{ fontSize: 22 }}>{c.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: c.color }}>{c.title}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{t.msg}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); remove(t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      );
    })}
  </div>
);
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = (type, msg, dur = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, msg, dur }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur);
    if (type === 'success') sfx.chime();
    else if (type === 'error') sfx.buzz();
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
};

/* ─────────────────────────────────────────
   SCORE RING
───────────────────────────────────────── */
const ScoreRing = ({ score, size = 64 }) => {
  const level = getScoreLevel(score);
  if (!level) return <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>—</span>;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={level.color} strokeWidth={8}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.34,1.56,.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: size > 56 ? 16 : 13, fontWeight: 900, color: level.color }}>{score}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SCORE INPUT CARD
───────────────────────────────────────── */
const ScoreCard = ({ label, emoji, value, max, onChange, accentColor, trackColor }) => (
  <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f1f5f9', padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#374151' }}>{emoji} {label}</span>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>0 – {max} คะแนน</span>
    </div>
    <Slider min={0} max={max} value={value}
      onChange={v => { sfx.pop(); onChange(v); }}
      tooltip={{ open: true, formatter: v => `${v} / ${max}` }}
      trackStyle={{ background: accentColor, height: 8 }}
      railStyle={{ background: '#f1f5f9', height: 8 }}
      handleStyle={{ borderColor: accentColor, width: 20, height: 20, marginTop: -6, boxShadow: `0 2px 8px ${accentColor}60` }}
      marks={{ 0: '0', [max / 2]: String(max / 2), [max]: String(max) }}
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="number" min={0} max={max} value={value}
        onChange={e => { const v = Math.min(max, Math.max(0, Number(e.target.value) || 0)); onChange(v); }}
        style={{ width: 80, textAlign: 'center', fontSize: 26, fontWeight: 900, color: accentColor, border: `2px solid ${trackColor}`, borderRadius: 12, padding: '6px 8px', outline: 'none', fontFamily: 'inherit', background: '#fafafa' }}
        onFocus={e => e.target.style.borderColor = accentColor}
        onBlur={e => e.target.style.borderColor = trackColor}
      />
      <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: `linear-gradient(to right, ${trackColor}, ${accentColor})`, borderRadius: 99, transition: 'width .3s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, minWidth: 36 }}>{Math.round((value / max) * 100)}%</span>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   LINK BUTTON
───────────────────────────────────────── */
const LinkBtn = ({ href, icon, label, hoverBg, color, border }) => (
  <a href={href} target="_blank" rel="noreferrer" onClick={() => sfx.pop()}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 12, border: `1.5px solid ${border}`, color, background: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', transition: 'all .18s', cursor: 'pointer' }}
    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}>
    {icon} {label}
  </a>
);

/* ─────────────────────────────────────────
   SUCCESS OVERLAY
───────────────────────────────────────── */
const SuccessOverlay = ({ show, score, onClose }) => {
  if (!show) return null;
  const level = getScoreLevel(score);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .25s ease' }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 40px', maxWidth: 420, width: '90vw', textAlign: 'center', boxShadow: '0 40px 80px -20px rgba(0,0,0,.3)', animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ fontSize: 72, marginBottom: 4 }}>🎉</div>
        <h2 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 24, color: '#1e293b' }}>บันทึกสำเร็จ!</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8' }}>คะแนนถูกบันทึกเข้าระบบเรียบร้อยแล้ว</p>
        <div style={{ background: level?.bg, border: `2px solid ${level?.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>คะแนนที่บันทึก</p>
          <p style={{ margin: '4px 0 0', fontSize: 56, fontWeight: 900, color: level?.color, lineHeight: 1 }}>{score}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>/ 100 คะแนน · {level?.emoji} {level?.label}</p>
        </div>
        <button onClick={onClose} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
          เยี่ยม! ปิด
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const EvaluationPage = () => {
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [successShow, setSuccessShow] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [savedScore, setSavedScore] = useState(0);
  const [pageReady, setPageReady]   = useState(false);

  /* filters */
  const [searchText, setSearchText]   = useState('');
  const [filterCat, setFilterCat]     = useState('all');
  const [filterYear, setFilterYear]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  /* grading */
  const [grading, setGrading] = useState({ completeness: 0, presentation: 0, feedback: '' });
  const totalScore = grading.completeness + grading.presentation;

  const { toasts, add: toast, remove: removeToast } = useToast();

  useEffect(() => { setTimeout(() => setPageReady(true), 100); }, []);

  /* ── fetch ── */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAll();
      const data = Array.isArray(res) ? res : (res?.data || []);
      setProjects(data);
    } catch (e) {
      toast('error', 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* ── derived filter options (dynamic from data) ── */
  const categories = useMemo(() => {
    const cats = [...new Set(projects.map(p => p.category).filter(Boolean))].sort();
    return cats;
  }, [projects]);

  const years = useMemo(() => {
    const yrs = [...new Set(projects.map(p => p.academic_year).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));
    return yrs;
  }, [projects]);

  /* ── filtered list ── */
  const filteredProjects = useMemo(() => {
    let f = projects;
    const q = searchText.toLowerCase().trim();
    if (q) f = f.filter(p =>
      (p.title_th || '').toLowerCase().includes(q) ||
      (p.title_en || '').toLowerCase().includes(q) ||
      (p.student_name || p.creator_name || p.name || p.fullname || '').toLowerCase().includes(q) ||
      (p.advisor || '').toLowerCase().includes(q)
    );
    if (filterCat  !== 'all') f = f.filter(p => p.category === filterCat);
    if (filterYear !== 'all') f = f.filter(p => String(p.academic_year) === String(filterYear));
    if (filterStatus === 'evaluated') f = f.filter(p => p.total_score !== null && p.total_score !== undefined);
    if (filterStatus === 'pending')   f = f.filter(p => p.total_score === null  || p.total_score === undefined);
    return f;
  }, [projects, searchText, filterCat, filterYear, filterStatus]);

  /* ── open evaluate modal ── */
  const openEvaluate = async (project) => {
    sfx.pop();
    try {
      const res = await api.getById(project.project_id);
      const data = res?.data || res;
      setCurrentProject(data);
      setGrading({
        completeness: Number(data.completeness_score) || 0,
        presentation: Number(data.presentation_score) || 0,
        feedback: data.comment || '',
      });
      setModalOpen(true);
    } catch (e) {
      sfx.buzz();
      toast('error', 'โหลดข้อมูลโปรเจกต์ไม่สำเร็จ');
    }
  };

  const closeModal = () => {
    sfx.pop();
    setModalOpen(false);
    setGrading({ completeness: 0, presentation: 0, feedback: '' });
    setCurrentProject(null);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (totalScore === 0) {
      toast('warning', 'กรุณาให้คะแนนอย่างน้อย 1 คะแนนก่อนบันทึก');
      sfx.buzz();
      return;
    }
    setSaving(true);
    try {
      await api.updateScore({
        project_id: currentProject.project_id,
        evaluator_id: (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id || 15; } catch { return 15; } })(),
        completeness_score: grading.completeness,
        presentation_score: grading.presentation,
        total_score: totalScore,
        comment: grading.feedback,
      });
      setSavedScore(totalScore);
      setModalOpen(false);
      setSuccessShow(true);
      setTimeout(() => { setSuccessShow(false); fetchProjects(); }, 2200);
    } catch (e) {
      sfx.buzz();
      toast('error', 'บันทึกไม่สำเร็จ: ' + (e?.response?.data?.detail || e?.message || 'กรุณาลองใหม่'));
    } finally {
      setSaving(false);
    }
  };

  /* ── stats ── */
  const evaluatedCount = projects.filter(p => p.total_score !== null && p.total_score !== undefined).length;
  const pendingCount   = projects.length - evaluatedCount;
  const avgScore = evaluatedCount > 0
    ? Math.round(projects.filter(p => p.total_score != null).reduce((a, p) => a + Number(p.total_score), 0) / evaluatedCount)
    : null;

  /* ── active filter count ── */
  const activeFilters = [filterCat !== 'all', filterYear !== 'all', filterStatus !== 'all', searchText.trim() !== ''].filter(Boolean).length;

  /* ── columns ── */
  const columns = [
    {
      title: <span style={{ fontWeight: 900, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>โครงงาน</span>,
      key: 'info',
      render: (_, r) => {
        const author = r.student_name || r.creator_name || r.name || r.fullname || 'ไม่ระบุ';
        return (
          <div style={{ padding: '4px 0' }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#1e293b', lineHeight: 1.35 }}>{r.title_th}</p>
            {r.title_en && <p style={{ margin: '2px 0 4px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{r.title_en}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserOutlined style={{ color: '#6366f1' }} /> {author}
              </span>
              {r.advisor && (
                <span style={{ fontSize: 12, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SolutionOutlined /> {r.advisor}
                </span>
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {r.category && <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>{r.category}</span>}
              {r.academic_year && <span style={{ fontSize: 11, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>ปี {r.academic_year}</span>}
              {r.project_level && <span style={{ fontSize: 11, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>{r.project_level}</span>}
            </div>
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 900, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>คะแนน</span>,
      key: 'score',
      align: 'center',
      width: 140,
      render: (_, r) => {
        const hasScore = r.total_score !== null && r.total_score !== undefined;
        if (!hasScore) return (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>ยังไม่ประเมิน</span>
        );
        const lvl = getScoreLevel(Number(r.total_score));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ScoreRing score={Number(r.total_score)} size={56} />
            <span style={{ fontSize: 11, fontWeight: 800, color: lvl.color }}>{lvl.emoji} {lvl.label}</span>
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 900, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>ดำเนินการ</span>,
      key: 'action',
      align: 'center',
      width: 140,
      render: (_, r) => {
        const hasScore = r.total_score !== null && r.total_score !== undefined;
        return (
          <button onClick={() => openEvaluate(r)}
            style={{ background: hasScore ? '#fff' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: hasScore ? '#4f46e5' : '#fff', border: hasScore ? '1.5px solid #c7d2fe' : 'none', borderRadius: 12, padding: '9px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto', fontFamily: 'inherit', boxShadow: hasScore ? 'none' : '0 4px 14px -4px rgba(99,102,241,.5)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <EditOutlined /> {hasScore ? 'แก้ไขคะแนน' : 'เริ่มประเมิน'}
          </button>
        );
      }
    }
  ];

  const totalScoreLevel = getScoreLevel(totalScore);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Toaster toasts={toasts} remove={removeToast} />
      <SuccessOverlay show={successShow} score={savedScore} onClose={() => setSuccessShow(false)} />
      <AdminSidebar />

      <Content style={{ padding: '24px 28px', overflowY: 'auto', opacity: pageReady ? 1 : 0, transition: 'opacity .5s' }} className="ev-scroll">
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>

          {/* ── HEADER ── */}
          <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.06)', animation: 'fadeDown .45s ease both' }}>
            <div style={{ height: 4, background: 'linear-gradient(to right,#6366f1,#8b5cf6,#ec4899,#6366f1)', backgroundSize: '300% 100%', animation: 'shimmer 4s linear infinite' }} />
            <div style={{ padding: '18px 26px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, flexShrink: 0 }}>
                    <SolutionOutlined />
                  </span>
                  ระบบประเมินคะแนนโครงงาน
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>ให้คะแนนและบันทึกข้อเสนอแนะสำหรับนักศึกษา</p>
              </div>
              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { label: 'ทั้งหมด',    value: projects.length, color: '#4f46e5', bg: '#eff6ff' },
                  { label: 'ประเมินแล้ว', value: evaluatedCount,  color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'รอประเมิน',  value: pendingCount,    color: '#f59e0b', bg: '#fffbeb' },
                  ...(avgScore !== null ? [{ label: 'เฉลี่ย', value: avgScore, color: '#7c3aed', bg: '#f5f3ff' }] : []),
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 62 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{s.label}</span>
                  </div>
                ))}
                <button onClick={fetchProjects}
                  style={{ width: 40, height: 40, borderRadius: 11, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 15, transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }} title="รีเฟรช">
                  <ReloadOutlined style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
                </button>
              </div>
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e5e7eb', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', animation: 'fadeUp .4s .1s both' }}>
            {/* Filter icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
              <FilterOutlined style={{ color: '#6366f1', fontSize: 15 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>ตัวกรอง</span>
              {activeFilters > 0 && (
                <span style={{ background: '#4f46e5', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 99 }}>{activeFilters}</span>
              )}
            </div>
            <div style={{ width: 1, height: 28, background: '#f1f5f9' }} />

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
              <SearchOutlined style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, zIndex: 1 }} />
              <input value={searchText} onChange={e => setSearchText(e.target.value)}
                placeholder="ค้นหาชื่อ / ผู้จัดทำ / ที่ปรึกษา..."
                style={{ width: '100%', paddingLeft: 34, paddingRight: searchText ? 28 : 12, height: 38, fontSize: 13, borderRadius: 11, border: '1.5px solid #e5e7eb', outline: 'none', background: '#f8fafc', color: '#1e293b', fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border .2s' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              {searchText && (
                <button onClick={() => setSearchText('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            {/* Category select */}
            <Select value={filterCat} onChange={v => { sfx.pop(); setFilterCat(v); }}
              style={{ minWidth: 160 }} size="middle" className="ev-select"
              dropdownStyle={{ borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
              <Option value="all">🗂 ทุกหมวดหมู่</Option>
              {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>

            {/* Year select */}
            <Select value={filterYear} onChange={v => { sfx.pop(); setFilterYear(v); }}
              style={{ minWidth: 150 }} size="middle" className="ev-select"
              dropdownStyle={{ borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
              <Option value="all">📅 ทุกปีการศึกษา</Option>
              {years.map(y => <Option key={y} value={y}>ปีการศึกษา {y}</Option>)}
            </Select>

            {/* Status select */}
            <Select value={filterStatus} onChange={v => { sfx.pop(); setFilterStatus(v); }}
              style={{ minWidth: 150 }} size="middle" className="ev-select"
              dropdownStyle={{ borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
              <Option value="all">📊 ทุกสถานะ</Option>
              <Option value="evaluated">✅ ประเมินแล้ว</Option>
              <Option value="pending">⏳ รอประเมิน</Option>
            </Select>

            {/* Clear */}
            {activeFilters > 0 && (
              <button onClick={() => { setSearchText(''); setFilterCat('all'); setFilterYear('all'); setFilterStatus('all'); sfx.pop(); }}
                style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 99, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                ล้างทั้งหมด ×
              </button>
            )}
          </div>

          {/* ── COUNT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
              แสดง <b style={{ color: '#1e293b' }}>{filteredProjects.length}</b> จาก {projects.length} โครงงาน
            </span>
            {pendingCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', padding: '2px 9px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
                <WarningOutlined /> {pendingCount} รายการรอประเมิน
              </span>
            )}
          </div>

          {/* ── TABLE ── */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animation: 'fadeUp .45s .15s both' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa' }}>
              <TrophyFilled style={{ color: '#f59e0b', fontSize: 16 }} />
              <span style={{ fontWeight: 900, fontSize: 14, color: '#1e293b' }}>รายชื่อโครงงานทั้งหมด</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{ width: 42, height: 42, border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: 12, color: '#94a3b8', fontWeight: 700 }}>กำลังโหลดข้อมูล...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', margin: 0 }}>ไม่พบโครงงาน</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>ลองปรับตัวกรองหรือคำค้นหา</p>
              </div>
            ) : (
              <Table columns={columns} dataSource={filteredProjects} rowKey="project_id"
                pagination={{ pageSize: 10, showSizeChanger: false, style: { padding: '12px 20px' } }}
                rowClassName="ev-row" className="ev-tbl" size="middle" scroll={{ x: 560 }} />
            )}
          </div>
        </div>
      </Content>

      {/* ── EVALUATE MODAL ── */}
      <Modal open={modalOpen} onCancel={closeModal} footer={null} width="min(780px,96vw)" centered
        styles={{ body: { padding: 0 }, mask: { backdropFilter: 'blur(4px)' } }}
        className="ev-modal" closable>
        {currentProject && (
          <div style={{ animation: 'popIn .32s cubic-bezier(.34,1.56,.64,1)' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)', padding: '20px 24px', borderRadius: '12px 12px 0 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 30%,rgba(99,102,241,.3) 0,transparent 55%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>ประเมินคะแนนโครงงาน</p>
                <h2 style={{ margin: '4px 0 0', fontWeight: 900, color: '#fff', fontSize: 17, lineHeight: 1.35 }}>{currentProject.title_th}</h2>
                {currentProject.title_en && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,.55)', fontStyle: 'italic' }}>{currentProject.title_en}</p>}
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <UserOutlined /> {currentProject.student_name || currentProject.creator_name || 'ไม่ระบุ'}
                  </span>
                  {currentProject.advisor && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <SolutionOutlined /> {currentProject.advisor}
                    </span>
                  )}
                  {currentProject.category && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>🗂 {currentProject.category}</span>}
                  {currentProject.academic_year && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>📅 ปี {currentProject.academic_year}</span>}
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '72vh', overflowY: 'auto' }} className="ev-scroll">

              {/* Previous scores notice */}
              {currentProject.total_score !== null && currentProject.total_score !== undefined && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                    มีคะแนนเดิมอยู่แล้ว: ความสมบูรณ์ {currentProject.completeness_score} · การนำเสนอ {currentProject.presentation_score} · รวม <b>{currentProject.total_score}</b> คะแนน
                  </span>
                </div>
              )}

              {/* File links */}
              {(currentProject.pdf_file_path || currentProject.video_url || currentProject.drive_url || currentProject.github_url) && (
                <div>
                  <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOutlined style={{ color: '#3b82f6' }} /> เอกสารและสื่อ
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {currentProject.pdf_file_path && <LinkBtn href={`https://reg.utc.ac.th/uploads/pdf/${currentProject.pdf_file_path}`} icon={<FilePdfOutlined />} label="เล่มโครงงาน" hoverBg="#fef2f2" color="#dc2626" border="#fca5a5" />}
                    {currentProject.video_url      && <LinkBtn href={currentProject.video_url}   icon={<YoutubeOutlined />}   label="วิดีโอ"         hoverBg="#fef2f2" color="#dc2626" border="#fca5a5" />}
                    {currentProject.drive_url      && <LinkBtn href={currentProject.drive_url}   icon={<GoogleOutlined />}   label="Google Drive"   hoverBg="#f0fdf4" color="#16a34a" border="#86efac" />}
                    {currentProject.github_url     && <LinkBtn href={currentProject.github_url}  icon={<GithubOutlined />}   label="GitHub"         hoverBg="#f8fafc" color="#1e293b" border="#e2e8f0" />}
                  </div>
                </div>
              )}

              {/* Score inputs */}
              <div>
                <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThunderboltOutlined style={{ color: '#f59e0b' }} /> ให้คะแนน
                </p>
                <Row gutter={14}>
                  <Col xs={24} md={12}>
                    <ScoreCard label="ความสมบูรณ์" emoji="📋" value={grading.completeness} max={50}
                      onChange={v => setGrading(g => ({ ...g, completeness: v }))}
                      accentColor="#4f46e5" trackColor="#c7d2fe" />
                  </Col>
                  <Col xs={24} md={12} style={{ marginTop: 0 }}>
                    <ScoreCard label="การนำเสนอ" emoji="🎨" value={grading.presentation} max={50}
                      onChange={v => setGrading(g => ({ ...g, presentation: v }))}
                      accentColor="#0ea5e9" trackColor="#bae6fd" />
                  </Col>
                </Row>
              </div>

              {/* Total score display */}
              <div style={{ background: totalScoreLevel ? totalScoreLevel.bg : '#f8fafc', border: `2px solid ${totalScoreLevel ? totalScoreLevel.border : '#e5e7eb'}`, borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, transition: 'all .4s ease' }}>
                <ScoreRing score={totalScore > 0 ? totalScore : null} size={72} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>คะแนนรวมสุทธิ</p>
                  <p style={{ margin: '2px 0 0', fontSize: 34, fontWeight: 900, color: totalScoreLevel ? totalScoreLevel.color : '#94a3b8', lineHeight: 1 }}>
                    {totalScore} <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>/ 100</span>
                  </p>
                  {totalScoreLevel && totalScore > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: totalScoreLevel.color }}>{totalScoreLevel.emoji} {totalScoreLevel.label}</p>
                  )}
                  {totalScore === 0 && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>ปรับ slider ด้านบนเพื่อให้คะแนน</p>}
                </div>
                {/* mini breakdown */}
                <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                  <p style={{ margin: 0 }}>📋 {grading.completeness} / 50</p>
                  <p style={{ margin: '4px 0 0' }}>🎨 {grading.presentation} / 50</p>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SmileOutlined style={{ color: '#ec4899' }} /> ข้อเสนอแนะ (ถ้ามี)
                </p>
                <textarea rows={4} value={grading.feedback}
                  onChange={e => setGrading(g => ({ ...g, feedback: e.target.value }))}
                  placeholder="✍️ กรอกข้อเสนอแนะให้กับนักศึกษา..."
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', resize: 'vertical', color: '#1e293b', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border .2s' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={closeModal}
                  style={{ padding: '11px 22px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  ยกเลิก
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: saving ? '#e5e7eb' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: saving ? '#9ca3af' : '#fff', fontWeight: 800, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, boxShadow: saving ? 'none' : '0 5px 16px -4px rgba(99,102,241,.45)', transition: 'all .2s' }}>
                  {saving ? (
                    <><span style={{ width: 14, height: 14, border: '2px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> กำลังบันทึก...</>
                  ) : (
                    <><SaveOutlined /> บันทึกคะแนน</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes fadeDown   { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:none} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:none} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes popIn      { from{opacity:0;transform:scale(.92) translateY(10px)} to{opacity:1;transform:none} }
        @keyframes shimmer    { 0%{background-position:0 0} 100%{background-position:300% 0} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes toastIn    { from{transform:translateX(100%);opacity:0} to{transform:none;opacity:1} }
        @keyframes shrinkBar  { from{width:100%} to{width:0} }

        .ev-scroll::-webkit-scrollbar{width:5px}
        .ev-scroll::-webkit-scrollbar-track{background:#f4f6fb}
        .ev-scroll::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px}

        .ev-tbl .ant-table{background:transparent!important}
        .ev-tbl .ant-table-thead>tr>th{background:#fafafa!important;padding:10px 14px!important;border-bottom:1px solid #f1f5f9!important;font-weight:700!important}
        .ev-tbl .ant-table-tbody>tr>td{padding:12px 14px!important;border-bottom:1px solid #f8fafc!important;vertical-align:top}
        .ev-row{transition:background .15s}
        .ev-row:hover>td{background:#fafbff!important}

        .ev-modal .ant-modal-content{border-radius:16px!important;overflow:hidden;padding:0;box-shadow:0 28px 64px -16px rgba(0,0,0,.22)!important}
        .ev-modal .ant-modal-footer{display:none!important}
        .ev-modal .ant-modal-close{top:10px!important;right:10px!important;color:rgba(255,255,255,.5)!important;z-index:10}
        .ev-modal .ant-modal-close:hover{color:#fff!important}
        .ev-modal .ant-modal-close-x{transition:transform .2s}
        .ev-modal .ant-modal-close:hover .ant-modal-close-x{transform:rotate(90deg)}

        .ev-select .ant-select-selector{border-radius:11px!important;border-color:#e5e7eb!important;height:38px!important;display:flex!important;align-items:center!important;font-size:13px!important;font-weight:600!important}
        .ev-select:hover .ant-select-selector{border-color:#6366f1!important}
        .ev-select.ant-select-focused .ant-select-selector{border-color:#6366f1!important;box-shadow:0 0 0 2px rgba(99,102,241,.12)!important}

        .ant-pagination-item{border-radius:9px!important;font-weight:700!important}
        .ant-pagination-item-active{background:#4f46e5!important;border-color:#4f46e5!important}
        .ant-pagination-item-active a{color:#fff!important}

        .ant-slider-mark-text{font-size:11px!important;color:#94a3b8!important}
      `}</style>
    </Layout>
  );
};

export default EvaluationPage;