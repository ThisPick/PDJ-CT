import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layout, Modal, Table, Select, Tooltip } from 'antd';
import {
  FilePdfOutlined, SafetyCertificateFilled,
  YoutubeOutlined, GithubOutlined,
  GoogleOutlined, UserOutlined,
  SearchOutlined, HistoryOutlined, ReloadOutlined,
  EyeOutlined, EditOutlined, FilterOutlined,
  EyeInvisibleOutlined,
  LeftOutlined, RightOutlined,
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import approveService from '../services/approveService';

const { Content } = Layout;
const { Option } = Select;

/* ════════════════════════════════════════
   🔊  AUDIO ENGINE
════════════════════════════════════════ */
class SFX {
  constructor() { this.c = null; }
  _g() { if (!this.c) this.c = new (window.AudioContext || window.webkitAudioContext)(); return this.c; }
  _r(fn) { try { fn(this._g()); } catch (e) {} }
  success() {
    this._r(c => {
      [[523, 0], [659, .08], [784, .16], [1047, .24]].forEach(([f, d]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = f;
        const t = c.currentTime + d;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
        o.start(t); o.stop(t + .45);
      });
    });
  }
  error() {
    this._r(c => {
      [[280, 0], [220, .1], [160, .2]].forEach(([f, d]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.value = f;
        const t = c.currentTime + d;
        g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.start(t); o.stop(t + .22);
      });
    });
  }
  warning() {
    this._r(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = 'triangle'; o.frequency.value = 440;
      g.gain.setValueAtTime(.12, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .3);
      o.start(); o.stop(c.currentTime + .3);
    });
  }
  click() {
    this._r(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = 'triangle';
      o.frequency.setValueAtTime(360, c.currentTime); o.frequency.exponentialRampToValueAtTime(720, c.currentTime + .05);
      g.gain.setValueAtTime(.13, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .08);
      o.start(); o.stop(c.currentTime + .08);
    });
  }
  tick() {
    this._r(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(.06, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .04);
      o.start(); o.stop(c.currentTime + .04);
    });
  }
  open() {
    this._r(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = 'sine';
      o.frequency.setValueAtTime(300, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + .12);
      g.gain.setValueAtTime(.1, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .18);
      o.start(); o.stop(c.currentTime + .18);
    });
  }
  page() {
    this._r(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = 'sine';
      o.frequency.setValueAtTime(440, c.currentTime); o.frequency.exponentialRampToValueAtTime(550, c.currentTime + .06);
      g.gain.setValueAtTime(.08, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .1);
      o.start(); o.stop(c.currentTime + .1);
    });
  }
}
const sfx = new SFX();

/* ════════════════════════════════════════
   🔐  ROLE GUARD
════════════════════════════════════════ */
const EDITABLE_ROLES = ['department_head', 'teacher', 'admin', 'administrator'];
const canEdit = u => EDITABLE_ROLES.includes((u?.role || u?.user_role || '').toLowerCase().trim());

/* ════════════════════════════════════════
   🏷  STATUS CONFIG
════════════════════════════════════════ */
const SC = {
  'รออนุมัติหัวข้อ': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', emoji: '📋' },
  'รออนุมัติเล่ม':   { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: '#ea580c', emoji: '📚' },
  'รอแก้ไข':         { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', dot: '#ec4899', emoji: '✏️' },
  'กำลังทำ':         { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', emoji: '⚙️' },
  'สมบูรณ์':         { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', emoji: '✅' },
  'ไม่ผ่าน':          { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', emoji: '❌' },
};
const ALL_STATUSES     = Object.keys(SC);
const PENDING_STATUSES = ['รออนุมัติหัวข้อ', 'รออนุมัติเล่ม', 'รอแก้ไข'];
const DONE_STATUSES    = ['กำลังทำ', 'สมบูรณ์', 'ไม่ผ่าน'];

/* ── PAGE SIZES ── */
const CARD_PAGE_SIZE_OPTIONS = [5, 8, 10, 15, 20];
const DEFAULT_CARD_PAGE_SIZE = 8;

/* current Thai academic year */
const currentAcYear = (() => {
  const now = new Date();
  const y = now.getFullYear() + 543;
  return String(now.getMonth() >= 4 ? y : y - 1);
})();

/* ════════════════════════════════════════
   🏷  CHIP
════════════════════════════════════════ */
const Chip = ({ status, size = 'md' }) => {
  const c = SC[status] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#94a3b8', emoji: '•' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c.bg, color: c.color, border: `1.5px solid ${c.border}`, padding: size === 'sm' ? '2px 9px' : '4px 12px', borderRadius: 99, fontWeight: 800, fontSize: size === 'sm' ? 11 : 12, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0, animation: 'sdot 2s ease infinite' }} />
      {c.emoji} {status}
    </span>
  );
};

/* ════════════════════════════════════════
   🔔  TOAST
════════════════════════════════════════ */
const TCFG = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✅', title: 'สำเร็จ!',    color: '#16a34a' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '❌', title: 'ผิดพลาด!',  color: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', title: 'แจ้งเตือน', color: '#d97706' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ️', title: 'ข้อมูล',    color: '#2563eb' },
};
const Toaster = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, width: 340 }}>
    {toasts.map(t => {
      const c = TCFG[t.type] || TCFG.info;
      return (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', overflow: 'hidden', animation: 'toastIn .3s cubic-bezier(.34,1.56,.64,1)', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,.09)' }}>
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
  const add = (type, msg, dur = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, msg, dur }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur);
    if (type === 'success') sfx.success();
    else if (type === 'error') sfx.error();
    else if (type === 'warning') sfx.warning();
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
};

/* ════════════════════════════════════════
   📊  STAT PILL
════════════════════════════════════════ */
const StatPill = ({ icon, label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: 14, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${color}22` }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <div>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════
   📄  PAGINATION COMPONENT (Card View)
════════════════════════════════════════ */
const CardPagination = ({ current, total, pageSize, onPageChange, onPageSizeChange, scrollRef }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1 && total <= CARD_PAGE_SIZE_OPTIONS[0]) return null;

  const handlePage = (p) => {
    if (p < 1 || p > totalPages) return;
    sfx.page();
    onPageChange(p);
    // scroll to top of list
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollTop - 600, behavior: 'smooth' });
    }
  };

  /* build page number array with ellipsis */
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 4) pages.push('...');
    const start = Math.max(2, current - 2);
    const end   = Math.min(totalPages - 1, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < totalPages - 3) pages.push('...');
    pages.push(totalPages);
  }

  const btnBase = {
    minWidth: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s', color: '#64748b', fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', borderRadius: 18, border: '1.5px solid #e5e7eb', padding: '12px 18px', marginTop: 4, animation: 'fadeUp .3s ease' }}>
      {/* left: info + page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
          หน้า <b style={{ color: '#1e293b' }}>{current}</b> / <b style={{ color: '#1e293b' }}>{totalPages}</b>
          <span style={{ marginLeft: 8, color: '#cbd5e1' }}>·</span>
          <span style={{ marginLeft: 8 }}>ทั้งหมด <b style={{ color: '#4f46e5' }}>{total}</b> รายการ</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>แสดง</span>
          <select value={pageSize} onChange={e => { sfx.click(); onPageSizeChange(Number(e.target.value)); }}
            style={{ height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', padding: '0 8px', fontSize: 12, fontWeight: 800, color: '#1e293b', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
            {CARD_PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} รายการ</option>)}
          </select>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ต่อหน้า</span>
        </div>
      </div>

      {/* right: page buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* prev */}
        <button onClick={() => handlePage(current - 1)} disabled={current === 1}
          style={{ ...btnBase, opacity: current === 1 ? .35 : 1, cursor: current === 1 ? 'not-allowed' : 'pointer' }}>
          <LeftOutlined style={{ fontSize: 11 }} />
        </button>

        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ width: 30, textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>…</span>
            : (
              <button key={p} onClick={() => handlePage(p)}
                style={{ ...btnBase, background: current === p ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#fff', color: current === p ? '#fff' : '#64748b', borderColor: current === p ? 'transparent' : '#e5e7eb', boxShadow: current === p ? '0 4px 12px -3px rgba(99,102,241,.5)' : 'none', transform: current === p ? 'scale(1.08)' : 'scale(1)' }}>
                {p}
              </button>
            )
        )}

        {/* next */}
        <button onClick={() => handlePage(current + 1)} disabled={current === totalPages}
          style={{ ...btnBase, opacity: current === totalPages ? .35 : 1, cursor: current === totalPages ? 'not-allowed' : 'pointer' }}>
          <RightOutlined style={{ fontSize: 11 }} />
        </button>

        {/* quick jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ไปหน้า</span>
          <input type="number" min={1} max={totalPages} defaultValue={current} key={current}
            onKeyDown={e => { if (e.key === 'Enter') { const v = Math.max(1, Math.min(totalPages, Number(e.target.value))); handlePage(v); } }}
            style={{ width: 52, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', padding: '0 8px', fontSize: 12, fontWeight: 800, color: '#1e293b', background: '#f8fafc', textAlign: 'center', fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   🃏  PROJECT CARD
════════════════════════════════════════ */
const ProjectCard = ({ project: p, onManage, onView, editable }) => {
  const [hov, setHov] = useState(false);
  const c = SC[p.progress_status] || {};
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', borderRadius: 20, border: hov ? `1.5px solid ${c.dot || '#a5b4fc'}` : '1.5px solid #e5e7eb', boxShadow: hov ? `0 16px 40px -8px ${c.dot || '#6366f1'}22` : '0 2px 12px rgba(0,0,0,.04)', transition: 'all .22s cubic-bezier(.34,1.56,.64,1)', transform: hov ? 'translateY(-3px)' : 'none', padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#1e293b', lineHeight: 1.35 }}>{p.title_th}</p>
              {p.title_en && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{p.title_en}</p>}
            </div>
            <Chip status={p.progress_status} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 16px', background: '#f8fafc', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            {p.category      && <span style={{ fontSize: 12, color: '#475569' }}>🗂 <b>{p.category}</b></span>}
            {p.academic_year && <span style={{ fontSize: 12, color: '#475569' }}>📅 <b>ปี {p.academic_year}</b></span>}
            {p.project_level && <span style={{ fontSize: 12, color: '#475569' }}>🏫 <b>{p.project_level}</b></span>}
            {p.advisor && (
              <span style={{ fontSize: 12, color: '#475569', width: '100%', paddingTop: 6, borderTop: '1px dashed #e5e7eb', marginTop: 2 }}>
                👨‍🏫 ที่ปรึกษา: <b style={{ color: '#4f46e5' }}>{p.advisor}</b>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 99, border: '1px solid #f1f5f9' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>
                <UserOutlined />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 12, color: '#1e293b' }}>{p.student_name || p.creator_name || 'ไม่ระบุ'}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>ผู้จัดทำ</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {p.pdf_file_path && <a href={approveService.getPdfUrl(p.pdf_file_path)} target="_blank" rel="noreferrer" className="lbtn pdf" title="PDF" onClick={() => sfx.tick()}><FilePdfOutlined /></a>}
              {p.drive_url    && <button className="lbtn drv" title="Drive"  onClick={() => { sfx.tick(); window.open(p.drive_url,  '_blank'); }}><GoogleOutlined /></button>}
              {p.video_url    && <button className="lbtn yt"  title="วิดีโอ" onClick={() => { sfx.tick(); window.open(p.video_url,  '_blank'); }}><YoutubeOutlined /></button>}
              {p.github_url   && <button className="lbtn gh"  title="GitHub" onClick={() => { sfx.tick(); window.open(p.github_url, '_blank'); }}><GithubOutlined /></button>}
            </div>
          </div>
        </div>
        {/* ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
          {editable
            ? <button className="btn-primary" onClick={() => onManage(p)}><EditOutlined /> จัดการ / อนุมัติ</button>
            : <div style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 14, padding: '10px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>🔒 ดูได้อย่างเดียว</div>
          }
          <button className="btn-ghost" onClick={() => onView(p)}><EyeOutlined /> ดู Feedback</button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   🪟  MANAGE MODAL
════════════════════════════════════════ */
const ManageModal = ({ open, project, mode, editable, onClose, onSave, loading }) => {
  const [status, setStatus]     = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (project) { setStatus(project.progress_status || ''); setFeedback(project.feedback || ''); }
  }, [project, open]);

  const isView  = mode === 'view';
  const canSave = !isView && editable && !!status;

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="min(620px,95vw)" centered
      styles={{ body: { padding: 0 }, mask: { backdropFilter: 'blur(6px)' } }}
      className="ap-modal"
      closeIcon={<span style={{ color: 'rgba(255,255,255,.6)', fontSize: 18, lineHeight: 1 }}>✕</span>}>
      <div style={{ animation: 'modalIn .28s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* header */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)', padding: '22px 26px 20px', borderRadius: '14px 14px 0 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%,rgba(99,102,241,.35) 0,transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {isView ? '👁  ดู Feedback' : '⚙️  จัดการสถานะโครงงาน'}
            </p>
            <h2 style={{ margin: '5px 0 0', fontWeight: 900, color: '#fff', fontSize: 17, lineHeight: 1.35 }}>{project?.title_th}</h2>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
              <Chip status={project?.progress_status} size="sm" />
              {project?.category      && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>🗂 {project.category}</span>}
              {project?.academic_year && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>📅 ปี {project.academic_year}</span>}
            </div>
          </div>
        </div>
        {/* body */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isView && !editable && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#dc2626' }}>ไม่มีสิทธิ์แก้ไขสถานะ</span>
            </div>
          )}
          {!isView && (
            <div>
              <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: '#1e293b' }}>
                🔖 {editable ? 'เลือกสถานะใหม่' : 'สถานะปัจจุบัน (ดูอย่างเดียว)'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {ALL_STATUSES.map(s => {
                  const sc = SC[s]; const active = status === s;
                  return (
                    <button key={s} onClick={() => { if (!editable) return; sfx.click(); setStatus(s); }} disabled={!editable}
                      style={{ padding: '10px 8px', borderRadius: 13, border: `2px solid ${active ? sc.dot : '#e5e7eb'}`, background: active ? sc.bg : '#f9fafb', color: active ? sc.color : '#9ca3af', fontWeight: 800, fontSize: 12, cursor: editable ? 'pointer' : 'not-allowed', transition: 'all .18s cubic-bezier(.34,1.56,.64,1)', transform: active ? 'scale(1.05)' : 'scale(1)', boxShadow: active ? `0 4px 14px ${sc.dot}40` : 'none', opacity: editable ? 1 : .6, fontFamily: 'inherit' }}>
                      {sc.emoji} {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 13, color: '#1e293b' }}>
              💬 {isView ? 'Feedback ที่บันทึกไว้' : 'ข้อเสนอแนะ / Feedback'}
            </p>
            <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
              readOnly={isView || !editable}
              placeholder={isView ? 'ยังไม่มี Feedback' : 'เช่น เอกสารยังไม่ครบถ้วน, อนุมัติเรียบร้อยแล้ว...'}
              style={{ width: '100%', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, borderRadius: 13, border: '1.5px solid #e5e7eb', outline: 'none', resize: 'vertical', color: '#1e293b', background: isView || !editable ? '#f8fafc' : '#fff', boxSizing: 'border-box', transition: 'border .2s', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose} className="btn-ghost" style={{ minWidth: 100 }}>
              {isView ? '✕ ปิด' : 'ยกเลิก'}
            </button>
            {!isView && (
              <button onClick={() => onSave(status, feedback)} disabled={!canSave || loading}
                style={{ padding: '11px 26px', borderRadius: 13, border: 'none', background: canSave && !loading ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#e5e7eb', color: canSave && !loading ? '#fff' : '#9ca3af', fontWeight: 800, fontSize: 13, cursor: canSave && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7, boxShadow: canSave && !loading ? '0 6px 18px -4px rgba(99,102,241,.45)' : 'none', transition: 'all .2s', fontFamily: 'inherit' }}>
                {loading ? <><span className="spin-sm" /> กำลังบันทึก...</> : '✓ ยืนยันการเปลี่ยนแปลง'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════
   🗂  SELECT FILTER BAR
════════════════════════════════════════ */
const FilterBar = ({ allProjects, filters, setFilters, search, setSearch, activeTab }) => {
  const categories = useMemo(() => [...new Set(allProjects.map(p => p.category).filter(Boolean))].sort(), [allProjects]);
  const years      = useMemo(() => [...new Set(allProjects.map(p => p.academic_year).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a))), [allProjects]);
  const statuses   = activeTab === 'pending' ? PENDING_STATUSES : DONE_STATUSES;
  const activeCount = [filters.status, filters.category, filters.year].filter(v => v !== 'all').length + (search.trim() ? 1 : 0);
  const selStyle   = { minWidth: 165 };
  const dropStyle  = { borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,.12)' };

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e5e7eb', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', animation: 'slideDown .22s ease' }}>
      {/* label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FilterOutlined style={{ color: '#6366f1', fontSize: 15 }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>ตัวกรอง</span>
        {activeCount > 0 && <span style={{ background: '#4f46e5', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 7px', borderRadius: 99 }}>{activeCount}</span>}
      </div>
      <div style={{ width: 1, height: 28, background: '#f1f5f9', flexShrink: 0 }} />

      {/* search */}
      <div style={{ position: 'relative', flex: '1 1 190px', maxWidth: 300 }}>
        <SearchOutlined style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, zIndex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / ผู้จัดทำ / ที่ปรึกษา..."
          style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 28 : 12, height: 38, fontSize: 12, borderRadius: 11, border: '1.5px solid #e5e7eb', outline: 'none', background: '#f8fafc', color: '#1e293b', fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border .2s' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        {search && (
          <button onClick={() => { sfx.tick(); setSearch(''); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      {/* status */}
      <Select value={filters.status} onChange={v => { sfx.tick(); setFilters(f => ({ ...f, status: v })); }}
        style={selStyle} size="middle" className="ap-sel" dropdownStyle={dropStyle} popupMatchSelectWidth={false}>
        <Option value="all">🔖 ทุกสถานะ</Option>
        {statuses.map(s => <Option key={s} value={s}>{SC[s]?.emoji} {s}</Option>)}
      </Select>

      {/* category */}
      <Select value={filters.category} onChange={v => { sfx.tick(); setFilters(f => ({ ...f, category: v })); }}
        style={selStyle} size="middle" className="ap-sel" dropdownStyle={dropStyle} popupMatchSelectWidth={false} disabled={!categories.length}>
        <Option value="all">🗂 ทุกหมวดหมู่</Option>
        {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
      </Select>

      {/* year */}
      <Select value={filters.year} onChange={v => { sfx.tick(); setFilters(f => ({ ...f, year: v })); }}
        style={selStyle} size="middle" className="ap-sel" dropdownStyle={dropStyle} popupMatchSelectWidth={false} disabled={!years.length}>
        <Option value="all">📅 ทุกปีการศึกษา</Option>
        {years.map(y => <Option key={y} value={y}>ปี {y}{String(y) === currentAcYear ? ' 🟢' : ''}</Option>)}
      </Select>

      {/* clear all */}
      {activeCount > 0 && (
        <button onClick={() => { sfx.click(); setFilters({ status: 'all', category: 'all', year: 'all' }); setSearch(''); }}
          style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 99, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          ล้างทั้งหมด ×
        </button>
      )}
    </div>
  );
};

/* ════════════════════════════════════════
   🏠  MAIN PAGE
════════════════════════════════════════ */
const ApproveProject = () => {
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [activeTab, setActiveTab]   = useState('pending');
  const [showFilter, setShowFilter] = useState(true);
  const [pageReady, setPageReady]   = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  /* ── PAGINATION STATE ── */
  const [pendingPage,     setPendingPage]     = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(DEFAULT_CARD_PAGE_SIZE);

  const [pendingFilters, setPendingFilters] = useState({ status: 'all', category: 'all', year: 'all' });
  const [histFilters,    setHistFilters]    = useState({ status: 'all', category: 'all', year: 'all' });
  const [pendingSearch,  setPendingSearch]  = useState('');
  const [histSearch,     setHistSearch]     = useState('');

  const [modal, setModal] = useState({ open: false, project: null, mode: 'manage' });
  const { toasts, add: toast, remove: removeToast } = useToast();

  const scrollRef = useRef(null);

  const user     = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const editable = useMemo(() => canEdit(user), [user]);

  useEffect(() => { setTimeout(() => setPageReady(true), 80); }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try { setProjects(await approveService.getAllPendingProjects()); }
    catch { toast('error', 'ไม่สามารถโหลดข้อมูลได้'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* partitions */
  const pending = useMemo(() => projects.filter(p => PENDING_STATUSES.includes(p.progress_status)), [projects]);
  const done    = useMemo(() => projects.filter(p => DONE_STATUSES.includes(p.progress_status)),    [projects]);

  /* completed projects in current year → auto-hide */
  const completedCurYear = useMemo(() =>
    done.filter(p => p.progress_status === 'สมบูรณ์' && String(p.academic_year) === currentAcYear),
    [done]);

  /* filter + search */
  const applyAll = useCallback((list, filters, search) => {
    let f = list;
    if (filters.status   !== 'all') f = f.filter(p => p.progress_status === filters.status);
    if (filters.category !== 'all') f = f.filter(p => p.category === filters.category);
    if (filters.year     !== 'all') f = f.filter(p => String(p.academic_year) === String(filters.year));
    const q = search.trim().toLowerCase();
    if (q) f = f.filter(p => [p.title_th, p.title_en, p.student_name, p.creator_name, p.advisor].some(v => (v || '').toLowerCase().includes(q)));
    return f;
  }, []);

  const curFilters   = activeTab === 'pending' ? pendingFilters : histFilters;
  const setCurFilter = activeTab === 'pending' ? setPendingFilters : setHistFilters;
  const curSearch    = activeTab === 'pending' ? pendingSearch : histSearch;
  const setCurSearch = activeTab === 'pending' ? setPendingSearch : setHistSearch;

  const hasActiveFilter = useMemo(() => {
    return curFilters.status !== 'all' || curFilters.category !== 'all' || curFilters.year !== 'all' || curSearch.trim() !== '';
  }, [curFilters, curSearch]);

  /* history base: hide completed-current-year unless toggled or searching */
  const baseList = useMemo(() => {
    if (activeTab === 'pending') return pending;
    if (!showCompleted && !hasActiveFilter) {
      return done.filter(p => !(p.progress_status === 'สมบูรณ์' && String(p.academic_year) === currentAcYear));
    }
    return done;
  }, [activeTab, pending, done, showCompleted, hasActiveFilter]);

  const filtered    = useMemo(() => applyAll(baseList, curFilters, curSearch), [baseList, curFilters, curSearch, applyAll]);
  const activeCount = [curFilters.status, curFilters.category, curFilters.year].filter(v => v !== 'all').length;

  /* reset pending page when filters/search change */
  useEffect(() => { setPendingPage(1); }, [pendingFilters, pendingSearch, pendingPageSize]);

  /* paginated slice for card view */
  const paginatedPending = useMemo(() => {
    if (activeTab !== 'pending') return [];
    const start = (pendingPage - 1) * pendingPageSize;
    return filtered.slice(start, start + pendingPageSize);
  }, [activeTab, filtered, pendingPage, pendingPageSize]);

  const openManage = useCallback(p => {
    if (!editable) { toast('warning', 'คุณไม่มีสิทธิ์แก้ไขสถานะ'); return; }
    sfx.open(); setModal({ open: true, project: p, mode: 'manage' });
  }, [editable]);
  const openView   = useCallback(p => { sfx.open(); setModal({ open: true, project: p, mode: 'view' }); }, []);
  const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), []);

  const handleSave = useCallback(async (newStatus, newFeedback) => {
    if (!modal.project) return;
    setSaving(true);
    try {
      await approveService.updateProjectStatus(modal.project.project_id, {
        progress_status: newStatus, feedback: newFeedback,
        approved_by: user.id || user.user_id,
      });
      toast('success', `อัปเดตสถานะเป็น "${newStatus}" สำเร็จ 🎉`);
      closeModal();
      await fetchProjects();
    } catch (err) {
      toast('error', 'เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  }, [modal.project, user, closeModal, fetchProjects]);

  /* history table columns */
  const histCols = useMemo(() => [
    {
      title: <span className="th">ชื่อโครงงาน</span>, dataIndex: 'title_th', key: 't', width: '28%',
      render: (t, r) => (
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{t}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{r.student_name || r.creator_name || '—'}</p>
        </div>
      )
    },
    { title: <span className="th">หมวดหมู่</span>,   dataIndex: 'category',       key: 'c', width: '12%', render: t => t ? <span className="meta-tag">{t}</span> : <span style={{ color: '#d1d5db' }}>—</span> },
    { title: <span className="th">ปีการศึกษา</span>, dataIndex: 'academic_year',  key: 'y', width: '10%', align: 'center', render: t => <span className="meta-tag">{t || '—'}</span> },
    { title: <span className="th">ที่ปรึกษา</span>, dataIndex: 'advisor',         key: 'a', width: '12%', render: t => t ? <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700 }}>{t}</span> : <span style={{ color: '#d1d5db' }}>—</span> },
    { title: <span className="th">สถานะ</span>,     dataIndex: 'progress_status', key: 's', width: '15%', render: s => <Chip status={s} size="sm" /> },
    {
      title: <span className="th">Feedback</span>, dataIndex: 'feedback', key: 'f', width: '14%',
      render: t => t
        ? <Tooltip title={t}><span style={{ fontSize: 11, color: '#475569', background: '#f8fafc', padding: '3px 8px', borderRadius: 8, display: 'inline-block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help' }}>{t}</span></Tooltip>
        : <span style={{ color: '#d1d5db', fontSize: 11 }}>ไม่มี</span>
    },
    {
      title: '', key: 'act', align: 'center', width: '9%',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {editable && <button onClick={() => openManage(r)} title="แก้ไข" className="tbl-btn blue"><EditOutlined /></button>}
          <button onClick={() => openView(r)} title="ดู" className="tbl-btn green"><EyeOutlined /></button>
        </div>
      )
    },
  ], [editable, openManage, openView]);

  /* ═══ RENDER ═══ */
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f8' }}>
      <Toaster toasts={toasts} remove={removeToast} />
      <AdminSidebar />

      <Content ref={scrollRef} className="ap-scroll"
        style={{ padding: '24px 28px', overflowY: 'auto', opacity: pageReady ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 60 }}>

          {/* ── HEADER ── */}
          <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.06)', animation: 'fadeDown .45s ease both' }}>
            <div style={{ height: 4, background: 'linear-gradient(to right,#6366f1,#8b5cf6,#ec4899,#f59e0b,#6366f1)', backgroundSize: '300% 100%', animation: 'shimmer 5s linear infinite' }} />
            <div style={{ padding: '18px 26px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, flexShrink: 0 }}>
                    <SafetyCertificateFilled />
                  </span>
                  ระบบจัดการและอนุมัติโครงงาน
                </h1>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>ปีการศึกษาปัจจุบัน: <b style={{ color: '#4f46e5' }}>{currentAcYear}</b></p>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 99, background: editable ? '#f0fdf4' : '#fef2f2', color: editable ? '#16a34a' : '#dc2626', border: `1px solid ${editable ? '#bbf7d0' : '#fca5a5'}` }}>
                    {editable ? '✅ มีสิทธิ์แก้ไข' : '🔒 ดูอย่างเดียว'} · {user.role || user.user_role || 'ไม่ระบุ'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatPill icon="⏳" label="รอตรวจ"   value={pending.length}          color="#f59e0b" bg="#fffbeb" />
                <StatPill icon="✅" label="เสร็จสิ้น" value={done.length}             color="#22c55e" bg="#f0fdf4" />
                <StatPill icon="🔒" label="ซ่อนอยู่"  value={completedCurYear.length} color="#6366f1" bg="#eff6ff" />
                <button onClick={() => { sfx.click(); fetchProjects(); }}
                  style={{ width: 40, height: 40, borderRadius: 11, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 15, transition: 'all .2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                  title="รีเฟรช">
                  <ReloadOutlined style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
                </button>
              </div>
            </div>
          </div>

          {/* ── TABS + TOOLBAR ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* tabs */}
            <div style={{ display: 'flex', background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb', padding: 4, gap: 3 }}>
              {[
                { k: 'pending', l: 'รอดำเนินการ',   icon: '⏳', n: pending.length },
                { k: 'history', l: 'ประวัติทั้งหมด', icon: '📜', n: done.length },
              ].map(t => (
                <button key={t.k} onClick={() => { sfx.click(); setActiveTab(t.k); }}
                  style={{ padding: '8px 16px', borderRadius: 11, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', background: activeTab === t.k ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'transparent', color: activeTab === t.k ? '#fff' : '#64748b', boxShadow: activeTab === t.k ? '0 5px 14px -4px rgba(99,102,241,.4)' : 'none' }}>
                  {t.icon} {t.l}
                  <span style={{ background: activeTab === t.k ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: activeTab === t.k ? '#fff' : '#94a3b8', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 99 }}>{t.n}</span>
                </button>
              ))}
            </div>

            {/* toggle filter */}
            <button onClick={() => { sfx.click(); setShowFilter(v => !v); }}
              style={{ padding: '8px 14px', borderRadius: 12, border: `1.5px solid ${showFilter ? '#6366f1' : '#e5e7eb'}`, background: showFilter ? '#eff6ff' : '#fff', color: showFilter ? '#4f46e5' : '#64748b', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', position: 'relative', fontFamily: 'inherit' }}>
              <FilterOutlined /> ตัวกรอง
              {(activeCount + (curSearch ? 1 : 0)) > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', width: 17, height: 17, borderRadius: '50%', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f0f2f8' }}>
                  {activeCount + (curSearch ? 1 : 0)}
                </span>
              )}
            </button>

            {/* show/hide completed-current-year */}
            {activeTab === 'history' && completedCurYear.length > 0 && (
              <button onClick={() => { sfx.click(); setShowCompleted(v => !v); }}
                style={{ padding: '8px 14px', borderRadius: 12, border: `1.5px solid ${showCompleted ? '#bbf7d0' : '#e5e7eb'}`, background: showCompleted ? '#f0fdf4' : '#fff', color: showCompleted ? '#15803d' : '#64748b', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', fontFamily: 'inherit' }}>
                {showCompleted ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                {showCompleted ? 'ซ่อนโปรเจคสำเร็จปีนี้' : `แสดงโปรเจคสำเร็จปีนี้ (${completedCurYear.length})`}
              </button>
            )}
          </div>

          {/* ── FILTER BAR ── */}
          {showFilter && (
            <FilterBar
              allProjects={projects}
              filters={curFilters}
              setFilters={setCurFilter}
              search={curSearch}
              setSearch={setCurSearch}
              activeTab={activeTab}
            />
          )}

          {/* ── AUTO-HIDE NOTICE ── */}
          {activeTab === 'history' && !showCompleted && !hasActiveFilter && completedCurYear.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp .3s ease' }}>
              <EyeInvisibleOutlined style={{ color: '#4f46e5', fontSize: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 700 }}>
                ซ่อน <b>{completedCurYear.length}</b> โปรเจคที่ <b>สมบูรณ์</b> ในปีการศึกษา <b>{currentAcYear}</b> ไว้ — กดปุ่มด้านบนหรือใช้ตัวกรองเพื่อค้นหา
              </span>
            </div>
          )}

          {/* ── COUNT ── */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                {activeTab === 'pending'
                  ? <>แสดง <b style={{ color: '#1e293b' }}>{Math.min(pendingPage * pendingPageSize, filtered.length) - (pendingPage - 1) * pendingPageSize}</b> รายการ (หน้า {pendingPage} / {Math.ceil(filtered.length / pendingPageSize) || 1}) จากทั้งหมด <b style={{ color: '#4f46e5' }}>{filtered.length}</b> รายการ</>
                  : <>แสดง <b style={{ color: '#1e293b' }}>{filtered.length}</b> จาก {baseList.length} รายการ</>
                }
              </span>
              {activeCount > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: '#4f46e5', background: '#eff6ff', padding: '2px 8px', borderRadius: 99 }}>กรอง {activeCount} เงื่อนไข</span>}
              {curSearch && <span style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 99 }}>ค้นหา: "{curSearch}"</span>}
            </div>
          )}

          {/* ── CONTENT ── */}
          {loading && projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 44, height: 44, border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: 14, color: '#94a3b8', fontWeight: 700 }}>กำลังโหลดข้อมูล...</p>
            </div>

          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: '56px 40px', textAlign: 'center', border: '1.5px solid #f1f5f9', animation: 'fadeUp .35s ease' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
              <p style={{ fontWeight: 900, fontSize: 16, color: '#1e293b', margin: 0 }}>ไม่พบรายการ</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>ลองปรับตัวกรองหรือคำค้นหา</p>
              {(activeCount > 0 || curSearch) && (
                <button onClick={() => { sfx.click(); setCurFilter({ status: 'all', category: 'all', year: 'all' }); setCurSearch(''); }}
                  style={{ marginTop: 14, padding: '8px 20px', borderRadius: 99, border: '1.5px solid #6366f1', background: '#eff6ff', color: '#4f46e5', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ล้างทั้งหมด
                </button>
              )}
            </div>

          ) : activeTab === 'pending' ? (
            <>
              {/* ── TOP PAGINATION (when multiple pages) ── */}
              {filtered.length > pendingPageSize && (
                <CardPagination
                  current={pendingPage}
                  total={filtered.length}
                  pageSize={pendingPageSize}
                  onPageChange={setPendingPage}
                  onPageSizeChange={size => { setPendingPageSize(size); setPendingPage(1); }}
                  scrollRef={scrollRef}
                />
              )}

              {/* ── CARDS ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paginatedPending.map((p, i) => (
                  <div key={p.project_id} style={{ animation: `fadeUp .3s ${i * 40}ms both` }}>
                    <ProjectCard project={p} onManage={openManage} onView={openView} editable={editable} />
                  </div>
                ))}
              </div>

              {/* ── BOTTOM PAGINATION ── */}
              <CardPagination
                current={pendingPage}
                total={filtered.length}
                pageSize={pendingPageSize}
                onPageChange={setPendingPage}
                onPageSizeChange={size => { setPendingPageSize(size); setPendingPage(1); }}
                scrollRef={scrollRef}
              />
            </>

          ) : (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', animation: 'fadeUp .35s ease' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa', flexWrap: 'wrap' }}>
                <HistoryOutlined style={{ color: '#6366f1', fontSize: 15 }} />
                <span style={{ fontWeight: 900, fontSize: 13, color: '#1e293b' }}>ประวัติการอนุมัติ</span>
                <span style={{ background: '#eff6ff', color: '#4f46e5', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 900 }}>{filtered.length} รายการ</span>
                {editable && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EditOutlined /> กดปุ่มแก้ไขเพื่อเปลี่ยนสถานะได้
                  </span>
                )}
              </div>
              <Table
                columns={histCols}
                dataSource={filtered}
                rowKey="project_id"
                pagination={{
                  pageSize: 12,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '12', '20', '50'],
                  showTotal: (total, range) => (
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                      แสดง <b style={{ color: '#1e293b' }}>{range[0]}–{range[1]}</b> จาก <b style={{ color: '#4f46e5' }}>{total}</b> รายการ
                    </span>
                  ),
                  style: { padding: '12px 20px' },
                }}
                rowClassName="hist-row"
                className="hist-tbl"
                size="middle"
              />
            </div>
          )}
        </div>
      </Content>

      <ManageModal open={modal.open} project={modal.project} mode={modal.mode}
        editable={editable} onClose={closeModal} onSave={handleSave} loading={saving} />

      <style>{`
        @keyframes sdot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes toastIn  { from{transform:translateX(100%);opacity:0} to{transform:none;opacity:1} }
        @keyframes shrinkBar{ from{width:100%} to{width:0} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:none} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)}  to{opacity:1;transform:none} }
        @keyframes shimmer  { 0%{background-position:0 0} 100%{background-position:300% 0} }
        @keyframes modalIn  { from{opacity:0;transform:scale(.94) translateY(8px)} to{opacity:1;transform:none} }

        .ap-scroll::-webkit-scrollbar{width:6px}
        .ap-scroll::-webkit-scrollbar-track{background:#f0f2f8}
        .ap-scroll::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px}
        .ap-scroll::-webkit-scrollbar-thumb:hover{background:#818cf8}

        .btn-primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;border-radius:13px;padding:11px 16px;font-weight:800;font-size:13px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 5px 16px -4px rgba(99,102,241,.45);transition:transform .15s,box-shadow .15s;font-family:inherit}
        .btn-primary:hover{transform:scale(1.03);box-shadow:0 8px 22px -4px rgba(99,102,241,.5)}
        .btn-ghost{background:#f8fafc;color:#64748b;border:1.5px solid #e5e7eb;border-radius:12px;padding:9px 16px;font-weight:700;font-size:12px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s;font-family:inherit}
        .btn-ghost:hover{background:#eff6ff;color:#4f46e5;border-color:#c7d2fe}

        .lbtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1.5px solid;cursor:pointer;transition:all .18s;font-size:14px}
        .lbtn:hover{transform:translateY(-2px) scale(1.08)}
        .lbtn.pdf{background:#fef2f2;color:#dc2626;border-color:#fca5a5;text-decoration:none}
        .lbtn.pdf:hover{background:#dc2626;color:#fff}
        .lbtn.drv{background:#f0fdf4;color:#16a34a;border-color:#86efac}
        .lbtn.drv:hover{background:#16a34a;color:#fff}
        .lbtn.yt{background:#fff7ed;color:#ea580c;border-color:#fed7aa}
        .lbtn.yt:hover{background:#ea580c;color:#fff}
        .lbtn.gh{background:#f8fafc;color:#1e293b;border-color:#e2e8f0}
        .lbtn.gh:hover{background:#1e293b;color:#fff}

        .hist-tbl .ant-table{background:transparent!important}
        .hist-tbl .ant-table-thead>tr>th{background:#fafafa!important;padding:9px 13px!important;border-bottom:1px solid #f1f5f9!important}
        .hist-tbl .ant-table-tbody>tr>td{padding:10px 13px!important;border-bottom:1px solid #f8fafc!important;transition:background .12s}
        .hist-row:hover>td{background:#fafbff!important}
        .th{font-weight:900;font-size:10px;color:#94a3b8;letter-spacing:.07em;text-transform:uppercase}
        .meta-tag{font-weight:700;background:#f1f5f9;padding:3px 9px;border-radius:7px;font-size:11px;color:#475569}

        .tbl-btn{width:30px;height:28px;border-radius:8px;border:1px solid;cursor:pointer;font-size:12px;transition:all .15s;display:flex;align-items:center;justify-content:center}
        .tbl-btn.blue{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}
        .tbl-btn.blue:hover{background:#2563eb;color:#fff}
        .tbl-btn.green{background:#f0fdf4;color:#16a34a;border-color:#bbf7d0}
        .tbl-btn.green:hover{background:#16a34a;color:#fff}

        .ap-modal .ant-modal-content{border-radius:16px!important;overflow:hidden;padding:0;box-shadow:0 32px 70px -16px rgba(0,0,0,.22)!important}
        .ap-modal .ant-modal-footer{display:none!important}
        .ap-modal .ant-modal-close{top:10px!important;right:10px!important;z-index:10}
        .ap-modal .ant-modal-close-x{transition:transform .2s}
        .ap-modal .ant-modal-close:hover .ant-modal-close-x{transform:rotate(90deg)}

        .ap-sel .ant-select-selector{border-radius:11px!important;border-color:#e5e7eb!important;height:38px!important;display:flex!important;align-items:center!important;font-size:12px!important;font-weight:700!important;background:#f8fafc!important}
        .ap-sel:hover .ant-select-selector{border-color:#6366f1!important}
        .ap-sel.ant-select-focused .ant-select-selector{border-color:#6366f1!important;box-shadow:0 0 0 2px rgba(99,102,241,.12)!important}

        .ant-pagination-item{border-radius:9px!important;font-weight:700!important}
        .ant-pagination-item-active{background:#4f46e5!important;border-color:#4f46e5!important}
        .ant-pagination-item-active a{color:#fff!important}
        .ant-pagination-options .ant-select-selector{border-radius:9px!important;font-weight:700!important}

        .spin-sm{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
      `}</style>
    </Layout>
  );
};

export default ApproveProject;