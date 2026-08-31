import React, { useState } from 'react';
import { Select } from 'antd';
import { DownloadOutlined, FileExcelOutlined, LoadingOutlined, CheckCircleFilled, CloseOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx-js-style';

/* ─────────────────────────────────────────────────────
   SOUND: SUCCESS CHIME  (C5 → E5 → G5 → C6)
───────────────────────────────────────────────────── */
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523.25, 0], [659.25, 0.09], [783.99, 0.18], [1046.5, 0.28]].forEach(([freq, delay]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.start(t); o.stop(t + 0.55);
    });
  } catch(e) {}
}

/* ─────────────────────────────────────────────────────
   EXPORT SUCCESS MODAL
───────────────────────────────────────────────────── */
const ExportSuccessModal = ({ visible, filename, count, onClose, color = '#16a34a' }) => {
  if (!visible) return null;
  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'rgba(15,23,42,0.45)',
        backdropFilter:'blur(4px)',
        animation:'xBdIn .22s ease both',
      }} />

      {/* card */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:9999, width:'min(420px,92vw)',
        background:'#fff', borderRadius:24,
        boxShadow:'0 32px 72px -12px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.06)',
        overflow:'hidden',
        animation:'xMdIn .38s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* accent bar */}
        <div style={{ height:5, background:`linear-gradient(to right,${color},#6366f1)` }} />

        {/* close */}
        <button onClick={onClose} style={{
          position:'absolute', top:14, right:14,
          background:'#f1f5f9', border:'none', borderRadius:'50%',
          width:30, height:30, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#64748b', fontSize:13, transition:'all .15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#ef4444';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#64748b';}}
        ><CloseOutlined /></button>

        {/* body */}
        <div style={{ padding:'28px 28px 24px', textAlign:'center' }}>

          {/* icon ring */}
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:`${color}18`,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            animation:'xIconPop .5s .1s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <CheckCircleFilled style={{ fontSize:38, color }} />
          </div>

          <h3 style={{ fontWeight:900, fontSize:20, color:'#1e293b', margin:'0 0 6px' }}>
            ส่งออกสำเร็จ! 🎉
          </h3>
          <p style={{ color:'#64748b', fontSize:13, margin:'0 0 18px', lineHeight:1.6 }}>
            ดาวน์โหลดไฟล์ Excel เสร็จเรียบร้อยแล้ว
          </p>

          {/* file info */}
          <div style={{
            background:'#f8fafc', border:'1.5px solid #e2e8f0',
            borderRadius:14, padding:'12px 16px', marginBottom:20,
            textAlign:'left',
            animation:'xRowIn .32s .18s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:`${color}18`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <FileExcelOutlined style={{ fontSize:18, color }} />
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{
                  fontWeight:800, fontSize:12, color:'#1e293b', margin:0,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{filename}</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0', fontWeight:600 }}>
                  {count > 0 ? `${count.toLocaleString()} รายการ` : 'ไฟล์ Excel (.xlsx)'}
                </p>
              </div>
            </div>
          </div>

          {/* confirm btn */}
          <button onClick={onClose} style={{
            width:'100%', padding:'11px 0',
            background:`linear-gradient(135deg,${color},#15803d)`,
            color:'#fff', fontWeight:800, fontSize:14,
            border:'none', borderRadius:14, cursor:'pointer',
            boxShadow:`0 6px 18px -4px ${color}70`,
            transition:'all .18s cubic-bezier(0.34,1.56,0.64,1)',
            animation:'xRowIn .32s .26s cubic-bezier(0.16,1,0.3,1) both',
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px) scale(1.02)';e.currentTarget.style.boxShadow=`0 10px 24px -4px ${color}80`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 6px 18px -4px ${color}70`;}}
          >
            รับทราบ
          </button>
        </div>
      </div>

      <style>{`
        @keyframes xBdIn   { from{opacity:0} to{opacity:1} }
        @keyframes xMdIn   { from{opacity:0;transform:translate(-50%,-48%) scale(.88)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes xIconPop{ from{transform:scale(0) rotate(-20deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
        @keyframes xRowIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>
    </>
  );
};

const { Option } = Select;

/* ─────────────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────────────── */
const STATUS_STYLES = {
  'สมบูรณ์':         { dot: '#22c55e' },
  'กำลังทำ':         { dot: '#3b82f6' },
  'รออนุมัติหัวข้อ': { dot: '#eab308' },
  'รออนุมัติเล่ม':   { dot: '#eab308' },
  'ล่าช้า':           { dot: '#ef4444' },
  'ไม่ผ่าน':          { dot: '#ef4444' },
};

/* ─────────────────────────────────────────────────────
   XLSX STYLE HELPERS
───────────────────────────────────────────────────── */
const HEADER_FILL  = { patternType: 'solid', fgColor: { rgb: '4F46E5' } };
const HEADER_FONT  = { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 11 };
const TITLE_FONT   = { bold: true, name: 'Arial', sz: 14, color: { rgb: '1E293B' } };
const SUB_FONT     = { bold: true, name: 'Arial', sz: 11, color: { rgb: '475569' } };
const BODY_FONT    = { name: 'Arial', sz: 10 };
const BORDER_THIN  = { style: 'thin', color: { rgb: 'E2E8F0' } };
const CELL_BORDER  = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
const CENTER_ALIGN = { horizontal: 'center', vertical: 'center', wrapText: true };
const LEFT_ALIGN   = { horizontal: 'left',   vertical: 'center', wrapText: true };

const styleCell = (ws, addr, style) => {
  if (!ws[addr]) ws[addr] = { t: 's', v: '' };
  ws[addr].s = { ...ws[addr].s, ...style };
};

const headerStyle = { fill: HEADER_FILL, font: HEADER_FONT, alignment: CENTER_ALIGN, border: CELL_BORDER };
const bodyStyle   = { font: BODY_FONT,   alignment: LEFT_ALIGN,   border: CELL_BORDER };
const centerStyle = { font: BODY_FONT,   alignment: CENTER_ALIGN, border: CELL_BORDER };

function colLetter(n) {
  let s = '';
  while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ─────────────────────────────────────────────────────
   BUILD STATS WORKBOOK
   Sheets: สรุปภาพรวม | สถานะ | หมวดหมู่ | รายปี | ที่ปรึกษา
───────────────────────────────────────────────────── */
function buildStatsWorkbook(projects, selectedYear) {
  const wb = XLSX.utils.book_new();
  const pool = selectedYear
    ? projects.filter(p => String(p.academic_year) === String(selectedYear))
    : projects;
  const yearLabel = selectedYear ? `ปี ${selectedYear}` : 'ทุกปี';

  /* ── helper: count by key ── */
  const countBy = (arr, key) => {
    const m = {};
    arr.forEach(p => { const v = p[key] || 'ไม่ระบุ'; m[v] = (m[v] || 0) + 1; });
    return m;
  };

  /* ── Sheet 1: สรุปภาพรวม ── */
  const overview = [
    ['รายงานสถิติโครงงาน', '', ''],
    [`ข้อมูล: ${yearLabel}`, '', ''],
    ['', '', ''],
    ['หัวข้อ', 'จำนวน (โครงงาน)', 'หมายเหตุ'],
    ['โครงงานทั้งหมด',  pool.length,                                                           ''],
    ['กำลังดำเนินการ',  pool.filter(p => p.progress_status?.includes('รอ') || p.progress_status === 'กำลังทำ').length, ''],
    ['เสร็จสมบูรณ์',    pool.filter(p => p.progress_status === 'สมบูรณ์').length,             ''],
    ['Hall of Fame',    pool.filter(p => p.is_featured === 1 || p.is_featured === true).length, 'ผลงานยอดเยี่ยม'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overview);
  ws1['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }];
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
  styleCell(ws1, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN });
  styleCell(ws1, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } });
  ['A4','B4','C4'].forEach(a => styleCell(ws1, a, headerStyle));
  for (let r = 5; r <= 8; r++) {
    styleCell(ws1, `A${r}`, bodyStyle);
    styleCell(ws1, `B${r}`, centerStyle);
    styleCell(ws1, `C${r}`, bodyStyle);
  }
  ws1['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 8 }, { hpt: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'สรุปภาพรวม');

  /* ── Sheet 2: สถานะ ── */
  const statusMap = countBy(pool, 'progress_status');
  const statusRows = [
    ['สถานะโครงงาน', '', ''],
    [`ข้อมูล: ${yearLabel}`, '', ''],
    ['', '', ''],
    ['สถานะ', 'จำนวน (โครงงาน)', 'สัดส่วน (%)'],
    ...Object.entries(statusMap)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => [k, v, pool.length ? ((v / pool.length) * 100).toFixed(1) + '%' : '0%']),
    ['รวมทั้งหมด', `=SUM(B5:B${4 + Object.keys(statusMap).length})`, '100%'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(statusRows);
  ws2['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 18 }];
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
  styleCell(ws2, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN });
  styleCell(ws2, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } });
  ['A4','B4','C4'].forEach(a => styleCell(ws2, a, headerStyle));
  const lastStatusRow = 4 + Object.keys(statusMap).length + 1;
  for (let r = 5; r <= lastStatusRow; r++) {
    styleCell(ws2, `A${r}`, r === lastStatusRow ? { font: { bold: true, name: 'Arial', sz: 10 }, alignment: CENTER_ALIGN, border: CELL_BORDER, fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } } } : bodyStyle);
    styleCell(ws2, `B${r}`, centerStyle);
    styleCell(ws2, `C${r}`, centerStyle);
  }
  XLSX.utils.book_append_sheet(wb, ws2, 'สถานะโครงงาน');

  /* ── Sheet 3: หมวดหมู่ ── */
  const catMap = countBy(pool, 'category');
  const catRows = [
    ['จำนวนโครงงานตามหมวดหมู่', '', ''],
    [`ข้อมูล: ${yearLabel}`, '', ''],
    ['', '', ''],
    ['หมวดหมู่', 'จำนวน (โครงงาน)', 'สัดส่วน (%)'],
    ...Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => [k, v, pool.length ? ((v / pool.length) * 100).toFixed(1) + '%' : '0%']),
    ['รวมทั้งหมด', `=SUM(B5:B${4 + Object.keys(catMap).length})`, '100%'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(catRows);
  ws3['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }];
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
  styleCell(ws3, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN });
  styleCell(ws3, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } });
  ['A4','B4','C4'].forEach(a => styleCell(ws3, a, headerStyle));
  const lastCatRow = 4 + Object.keys(catMap).length + 1;
  for (let r = 5; r <= lastCatRow; r++) {
    styleCell(ws3, `A${r}`, bodyStyle);
    styleCell(ws3, `B${r}`, centerStyle);
    styleCell(ws3, `C${r}`, centerStyle);
  }
  XLSX.utils.book_append_sheet(wb, ws3, 'หมวดหมู่');

  /* ── Sheet 4: รายปี (แสดงทุกปีเสมอในชีตนี้) ── */
  const yearMap = countBy(projects, 'academic_year');
  const yearRows = [
    ['แนวโน้มจำนวนโครงงานรายปี', '', ''],
    ['ข้อมูลทุกปีการศึกษา', '', ''],
    ['', '', ''],
    ['ปีการศึกษา', 'จำนวน (โครงงาน)', 'เพิ่มขึ้น/ลดลง'],
  ];
  const sortedYears = Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  sortedYears.forEach(([yr, cnt], i) => {
    const prev = i > 0 ? sortedYears[i - 1][1] : null;
    const diff = prev !== null ? (cnt - prev > 0 ? `+${cnt - prev}` : `${cnt - prev}`) : '-';
    yearRows.push([yr, cnt, diff]);
  });
  yearRows.push(['รวมทั้งหมด', `=SUM(B5:B${4 + sortedYears.length})`, '']);
  const ws4 = XLSX.utils.aoa_to_sheet(yearRows);
  ws4['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 20 }];
  ws4['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
  styleCell(ws4, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN });
  styleCell(ws4, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } });
  ['A4','B4','C4'].forEach(a => styleCell(ws4, a, headerStyle));
  for (let r = 5; r <= 4 + sortedYears.length + 1; r++) {
    styleCell(ws4, `A${r}`, bodyStyle);
    styleCell(ws4, `B${r}`, centerStyle);
    styleCell(ws4, `C${r}`, centerStyle);
  }
  XLSX.utils.book_append_sheet(wb, ws4, 'รายปี');

  /* ── Sheet 5: ที่ปรึกษา Top 10 ── */
  const advMap = countBy(pool, 'advisor');
  const advRows = [
    ['จำนวนโครงงานตามที่ปรึกษา (Top 10)', '', ''],
    [`ข้อมูล: ${yearLabel}`, '', ''],
    ['', '', ''],
    ['ที่ปรึกษา', 'จำนวน (โครงงาน)', 'สัดส่วน (%)'],
    ...Object.entries(advMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, v]) => [k, v, pool.length ? ((v / pool.length) * 100).toFixed(1) + '%' : '0%']),
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(advRows);
  ws5['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 18 }];
  ws5['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
  styleCell(ws5, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN });
  styleCell(ws5, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } });
  ['A4','B4','C4'].forEach(a => styleCell(ws5, a, headerStyle));
  for (let r = 5; r <= advRows.length; r++) {
    styleCell(ws5, `A${r}`, bodyStyle);
    styleCell(ws5, `B${r}`, centerStyle);
    styleCell(ws5, `C${r}`, centerStyle);
  }
  XLSX.utils.book_append_sheet(wb, ws5, 'ที่ปรึกษา');

  return wb;
}

/* ─────────────────────────────────────────────────────
   BUILD PROJECTS WORKBOOK
   Sheet: คลังโครงงาน
───────────────────────────────────────────────────── */
function buildProjectsWorkbook(projects, selectedYear) {
  const wb = XLSX.utils.book_new();
  const pool = selectedYear
    ? projects.filter(p => String(p.academic_year) === String(selectedYear))
    : projects;
  const yearLabel = selectedYear ? `ปี ${selectedYear}` : 'ทุกปี';

  const COLS = [
    { key: 'title_th',        label: 'ชื่อโครงงาน (ภาษาไทย)',    wch: 40 },
    { key: 'title_en',        label: 'ชื่อโครงงาน (ภาษาอังกฤษ)', wch: 40 },
    { key: 'academic_year',   label: 'ปีการศึกษา',                wch: 14 },
    { key: 'project_level',   label: 'ระดับชั้น',                  wch: 14 },
    { key: 'student_name',    label: 'ผู้จัดทำ',                   wch: 28 },
    { key: 'advisor',         label: 'ที่ปรึกษา',                  wch: 28 },
    { key: 'category',        label: 'หมวดหมู่',                   wch: 22 },
    { key: 'progress_status', label: 'สถานะ',                      wch: 20 },
    { key: 'is_featured',     label: 'Hall of Fame',               wch: 14 },
    { key: 'created_at',      label: 'วันที่สร้าง',                wch: 22 },
  ];

  const headers = COLS.map(c => c.label);
  const rows = pool.map(p => COLS.map(c => {
    if (c.key === 'is_featured') return (p.is_featured === 1 || p.is_featured === true) ? '⭐ ยอดเยี่ยม' : '';
    if (c.key === 'created_at' && p.created_at) {
      const d = new Date(p.created_at);
      return isNaN(d) ? (p.created_at || '') : d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return p[c.key] ?? '';
  }));

  const titleRow    = [`คลังโครงงานทั้งหมด — ${yearLabel}`];
  const subtitleRow = [`ส่งออกเมื่อ: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}   |   จำนวน: ${pool.length} รายการ`];
  const blankRow    = [];

  const aoa = [titleRow, subtitleRow, blankRow, headers, ...rows];
  const ws  = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = COLS.map(c => ({ wch: c.wch }));
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS.length - 1 } },
  ];

  /* title & subtitle styles */
  styleCell(ws, 'A1', { font: TITLE_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: '4F46E5' } }, border: CELL_BORDER });
  ws['A1'].s.font = { ...TITLE_FONT, color: { rgb: 'FFFFFF' } };
  styleCell(ws, 'A2', { font: SUB_FONT, alignment: CENTER_ALIGN, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } }, border: CELL_BORDER });

  /* header row (row index 3 → excel row 4) */
  headers.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 3, c: ci });
    styleCell(ws, addr, headerStyle);
  });

  /* body rows */
  rows.forEach((row, ri) => {
    row.forEach((_, ci) => {
      const addr = XLSX.utils.encode_cell({ r: 4 + ri, c: ci });
      const isCenter = ci === 2 || ci === 3 || ci === 7 || ci === 8;
      styleCell(ws, addr, isCenter ? centerStyle : bodyStyle);
      /* zebra stripe */
      if (ri % 2 === 0) {
        ws[addr].s = { ...ws[addr].s, fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFF' } } };
      }
    });
  });

  /* freeze top 4 rows */
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };

  XLSX.utils.book_append_sheet(wb, ws, 'คลังโครงงาน');
  return wb;
}

/* ─────────────────────────────────────────────────────
   EXPORT STATS BUTTON
───────────────────────────────────────────────────── */
export const ExportStatsButton = ({ projects = [], years = [] }) => {
  const [loading, setLoading]   = useState(false);
  const [year, setYear]         = useState(null);
  const [modal, setModal]       = useState({ visible: false, filename: '', count: 0 });

  const doExport = async () => {
    if (!projects.length) {
      /* reuse sfx-like sound for warning */
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = 320;
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.start(); o.stop(ctx.currentTime + 0.25);
      } catch(e) {}
      return;
    }
    setLoading(true);
    try {
      const pool = year ? projects.filter(p => String(p.academic_year) === String(year)) : projects;
      const wb = buildStatsWorkbook(projects, year);
      const fname = `สถิติโครงงาน${year ? `_ปี${year}` : '_ทุกปี'}_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fname);
      playSuccessSound();
      setModal({ visible: true, filename: fname, count: pool.length });
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ExportSuccessModal
        visible={modal.visible}
        filename={modal.filename}
        count={modal.count}
        color="#16a34a"
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />

      <div className="export-btn-wrap flex items-center gap-2">
        {years.length > 0 && (
          <Select size="small" value={year || 'all'}
            onChange={v => setYear(v === 'all' ? null : String(v))}
            style={{ minWidth: 110 }} className="yr-select">
            <Option value="all">ทุกปี</Option>
            {years.map(y => <Option key={y} value={String(y)}>{y}</Option>)}
          </Select>
        )}
        <button onClick={doExport} disabled={loading}
          className="xls-btn xls-btn--green" title="Export รายงานสถิติเป็น Excel">
          {loading ? <LoadingOutlined style={{ fontSize:13 }} /> : <FileExcelOutlined style={{ fontSize:13 }} />}
          <span>{loading ? 'กำลังส่งออก...' : 'Export สถิติ'}</span>
          <DownloadOutlined style={{ fontSize:11, opacity:0.7 }} />
        </button>

        <style>{`
          .xls-btn {
            display:inline-flex;align-items:center;gap:6px;
            font-size:11px;font-weight:700;padding:6px 14px;
            border-radius:12px;border:none;cursor:pointer;
            transition:all .18s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;
          }
          .xls-btn:disabled{opacity:.6;cursor:not-allowed;}
          .xls-btn--green{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 4px 12px -3px rgba(22,163,74,.4);}
          .xls-btn--green:not(:disabled):hover{transform:translateY(-2px) scale(1.04);box-shadow:0 8px 20px -4px rgba(22,163,74,.5);}
          .xls-btn--green:not(:disabled):active{transform:scale(.96);}
          .xls-btn--indigo{background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;box-shadow:0 4px 12px -3px rgba(79,70,229,.4);}
          .xls-btn--indigo:not(:disabled):hover{transform:translateY(-2px) scale(1.04);box-shadow:0 8px 20px -4px rgba(79,70,229,.5);}
          .xls-btn--indigo:not(:disabled):active{transform:scale(.96);}
        `}</style>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────
   EXPORT PROJECTS BUTTON
───────────────────────────────────────────────────── */
export const ExportProjectsButton = ({ projects = [], years = [] }) => {
  const [loading, setLoading] = useState(false);
  const [year, setYear]       = useState(null);
  const [modal, setModal]     = useState({ visible: false, filename: '', count: 0 });

  const doExport = async () => {
    if (!projects.length) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = 320;
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.start(); o.stop(ctx.currentTime + 0.25);
      } catch(e) {}
      return;
    }
    setLoading(true);
    try {
      const pool = year ? projects.filter(p => String(p.academic_year) === String(year)) : projects;
      const wb = buildProjectsWorkbook(projects, year);
      const fname = `คลังโครงงาน${year ? `_ปี${year}` : '_ทุกปี'}_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fname);
      playSuccessSound();
      setModal({ visible: true, filename: fname, count: pool.length });
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ExportSuccessModal
        visible={modal.visible}
        filename={modal.filename}
        count={modal.count}
        color="#4f46e5"
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />

      <div className="export-btn-wrap flex items-center gap-2">
        {years.length > 0 && (
          <Select size="small" value={year || 'all'}
            onChange={v => setYear(v === 'all' ? null : String(v))}
            style={{ minWidth: 110 }} className="yr-select">
            <Option value="all">ทุกปี</Option>
            {years.map(y => <Option key={y} value={String(y)}>{y}</Option>)}
          </Select>
        )}
        <button onClick={doExport} disabled={loading}
          className="xls-btn xls-btn--indigo" title="Export คลังโครงงานเป็น Excel">
          {loading ? <LoadingOutlined style={{ fontSize:13 }} /> : <FileExcelOutlined style={{ fontSize:13 }} />}
          <span>{loading ? 'กำลังส่งออก...' : 'Export โครงงาน'}</span>
          <DownloadOutlined style={{ fontSize:11, opacity:0.7 }} />
        </button>
      </div>
    </>
  );
};

export default { ExportStatsButton, ExportProjectsButton };