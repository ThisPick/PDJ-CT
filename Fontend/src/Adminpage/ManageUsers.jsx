import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Table, Avatar, Tag, Typography, Space,
  Popconfirm, Modal, Form, Input, Select, Upload,
  Row, Col, Divider, Tooltip, Badge
} from 'antd';
import {
  UserOutlined, IdcardOutlined, MailOutlined, TeamOutlined,
  StarFilled, EditOutlined, DeleteOutlined, UploadOutlined,
  SearchOutlined, HomeOutlined, BookOutlined, SafetyCertificateOutlined,
  PhoneOutlined, LockOutlined, CheckCircleOutlined, StopOutlined,
  CameraOutlined, ReloadOutlined, CloseOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import { userService } from '../services/userService';

const { Content } = Layout;
const { Option } = Select;
const API_URL = 'https://reg.utc.ac.th';

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
  shutter(){this._r(c=>{const n=Math.ceil(c.sampleRate*.08),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n)*.6;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();f.type='highpass';f.frequency.value=3000;g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.08);s.buffer=buf;s.connect(f);f.connect(g);g.connect(c.destination);s.start();s.stop(c.currentTime+.08);});}
  delete(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sawtooth';o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(80,c.currentTime+.18);g.gain.setValueAtTime(.15,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.2);o.start();o.stop(c.currentTime+.2);});}
}
const sfx = new SFX();

/* ══════════════════════════════════════════════════
   🔔  TOAST SYSTEM
══════════════════════════════════════════════════ */
const TOAST_CFG = {
  success:{ grad:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'#86efac', accent:'#16a34a', emoji:'✅', title:'สำเร็จ!' },
  error:  { grad:'linear-gradient(135deg,#fff1f2,#fee2e2)', border:'#fca5a5', accent:'#dc2626', emoji:'❌', title:'ผิดพลาด!' },
  warning:{ grad:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'#fcd34d', accent:'#d97706', emoji:'⚠️', title:'แจ้งเตือน' },
  info:   { grad:'linear-gradient(135deg,#eff6ff,#dbeafe)', border:'#93c5fd', accent:'#2563eb', emoji:'ℹ️', title:'แจ้งข้อมูล' },
};

const ToastBox = ({ toasts, remove }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:99999, display:'flex', flexDirection:'column', gap:10, minWidth:320, maxWidth:400 }}>
    {toasts.map(t => {
      const c = TOAST_CFG[t.type] || TOAST_CFG.info;
      return (
        <div key={t.id} className="toast-item" style={{ background:c.grad, border:`2px solid ${c.border}`, borderRadius:18, padding:'14px 18px', boxShadow:`0 20px 40px -10px ${c.border}88`, display:'flex', alignItems:'flex-start', gap:12, position:'relative', overflow:'hidden', cursor:'pointer' }} onClick={()=>remove(t.id)}>
          <div className="t-prog" style={{ '--d':t.dur+'ms', '--a':c.accent }}/>
          <span style={{ fontSize:24, lineHeight:1, flexShrink:0 }}>{c.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontWeight:900, fontSize:14, color:c.accent }}>{c.title}</p>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#374151', lineHeight:1.5 }}>{t.msg}</p>
          </div>
          <button onClick={e=>{e.stopPropagation();remove(t.id);}} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af', padding:0, lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      );
    })}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = (type, msg, dur=4200) => {
    const id = Date.now()+Math.random();
    setToasts(p => [...p, { id, type, msg, dur }]);
    setTimeout(() => setToasts(p => p.filter(t=>t.id!==id)), dur);
    if(type==='success') sfx.success();
    else if(type==='error') sfx.error();
    else sfx.warning();
  };
  const remove = id => setToasts(p => p.filter(t=>t.id!==id));
  return { toasts, add, remove };
};

/* ══════════════════════════════════════════════════
   📷  CAMERA MODAL
══════════════════════════════════════════════════ */
const CameraModal = ({ open, onCapture, onClose }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [streaming, setStreaming] = useState(false);
  const [flash, setFlash] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!open) { stopStream(); return; }
    startStream();
    return () => stopStream();
  }, [open]);

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width:640, height:480, facingMode:'user' } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; setStreaming(true); }
    } catch(e) { console.error('Camera error:', e); }
  };

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    setStreaming(false);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    sfx.shutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type:'image/jpeg' });
      const url  = URL.createObjectURL(blob);
      onCapture({ file, url });
      onClose();
    }, 'image/jpeg', 0.92);
  };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99990, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="cam-box" style={{ background:'#0f172a', borderRadius:24, overflow:'hidden', maxWidth:520, width:'92%', boxShadow:'0 40px 80px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
            <CameraOutlined style={{ color:'#818cf8' }}/> ถ่ายรูปโปรไฟล์
          </span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#94a3b8', cursor:'pointer', width:32, height:32, borderRadius:8, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        <div style={{ position:'relative', background:'#000', minHeight:300 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', display:'block', borderRadius:0 }}/>
          {flash && <div style={{ position:'absolute', inset:0, background:'#fff', opacity:.7, pointerEvents:'none' }}/>}
          {!streaming && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
              <div className="cam-ring"/>
              <span style={{ color:'#94a3b8', fontSize:13, fontWeight:600 }}>กำลังเปิดกล้อง...</span>
            </div>
          )}
          {/* guide overlay */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:180, height:180, borderRadius:'50%', border:'2px dashed rgba(129,140,248,.6)', boxShadow:'0 0 0 9999px rgba(0,0,0,.25)' }}/>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display:'none' }}/>
        <div style={{ padding:'16px 20px', display:'flex', gap:12 }}>
          <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'#94a3b8', borderRadius:14, height:48, fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .2s' }} className="cam-cancel">ยกเลิก</button>
          <button onClick={capture} disabled={!streaming} style={{ flex:2, background: streaming ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#334155', border:'none', color:'#fff', borderRadius:14, height:48, fontWeight:800, fontSize:15, cursor: streaming?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: streaming?'0 8px 20px -5px rgba(99,102,241,.5)':'none', transition:'all .2s' }}>
            <CameraOutlined style={{ fontSize:18 }}/> ถ่ายรูป
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAGNETIC BUTTON
══════════════════════════════════════════════════ */
const MagBtn = ({ children, onClick, style={}, className='' }) => {
  const r = useRef();
  return (
    <button ref={r}
      onMouseMove={e=>{const b=r.current.getBoundingClientRect();const x=(e.clientX-b.left-b.width/2)*.16,y=(e.clientY-b.top-b.height/2)*.16;r.current.style.transform=`translate(${x}px,${y}px) scale(1.03)`;}}
      onMouseLeave={()=>r.current.style.transform='translate(0,0) scale(1)'}
      onClick={e=>{sfx.click();onClick&&onClick(e);}}
      className={className}
      style={{ transition:'transform .18s cubic-bezier(.34,1.56,.64,1)', cursor:'pointer', ...style }}
    >{children}</button>
  );
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const ManageUsers = () => {
  const [loading, setLoading]       = useState(false);
  const [userList, setUserList]     = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pageReady, setPageReady]   = useState(false);

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [editingRecord, setEditRecord]  = useState(null);
  const [form]                          = Form.useForm();
  const [fileList, setFileList]         = useState([]);
  const [previewUrl, setPreviewUrl]     = useState('');
  const [camOpen, setCamOpen]           = useState(false);
  const [saving, setSaving]             = useState(false);

  const { toasts, add: toast, remove: removeToast } = useToast();

  useEffect(() => { setTimeout(()=>setPageReady(true),80); }, []);
  useEffect(() => {
    if (!pageReady) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('io-in');io.unobserve(e.target);}});
    }, { threshold:.06 });
    document.querySelectorAll('.io').forEach(el=>io.observe(el));
    return ()=>io.disconnect();
  }, [pageReady, loading]);

  const fetchData = async () => {
    try { setLoading(true); const res = await userService.getAllUsers(); if(res?.data?.success||res?.success){ setUserList(res.data.data||res.data); } }
    catch(err){ toast('error','ไม่สามารถดึงข้อมูลสมาชิกได้'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id, name) => {
    try {
      setLoading(true);
      const res = await userService.deleteUser(id);
      if (res?.data?.success||res?.success) {
        sfx.delete();
        toast('success', `ลบข้อมูล "${name}" เรียบร้อยแล้ว 🗑️`);
        fetchData();
      }
    } catch(err) { toast('error','เกิดข้อผิดพลาดในการลบข้อมูล'); }
    finally { setLoading(false); }
  };

  const handleEditClick = (record) => {
    sfx.click();
    setEditingId(record.id);
    setEditRecord(record);
    const img = record.profile_img ? `${API_URL}/uploads/profiles/${record.profile_img}?t=${Date.now()}` : '';
    setPreviewUrl(img);
    if (record.profile_img) {
      setFileList([{ uid:'-1', name:record.profile_img, status:'done', url:img }]);
    } else { setFileList([]); }
    form.setFieldsValue({ full_name:record.full_name, role:record.role, email:record.email, phone:record.phone, status:record.status||'active', password:'', student_id:record.student_id, student_level:record.student_level, student_group:record.student_group });
    setIsModalOpen(true);
  };

  const handleCancel = () => { sfx.click(); setIsModalOpen(false); form.resetFields(); setFileList([]); setPreviewUrl(''); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const fd = new FormData();
      fd.append('full_name', values.full_name);
      fd.append('role', values.role);
      fd.append('status', values.status);
      if(values.email) fd.append('email', values.email);
      if(values.phone) fd.append('phone', values.phone);
      if(values.password && values.password.trim()) fd.append('password', values.password);
      if(values.role==='student'){
        fd.append('student_id', values.student_id||'');
        fd.append('student_level', values.student_level||'');
        fd.append('student_group', values.student_group||'');
      }
      if(fileList.length>0 && fileList[0].originFileObj) fd.append('profile_img', fileList[0].originFileObj);
      const res = await userService.updateUser(editingId, fd);
      if(res?.data?.success||res?.success){
        toast('success', `อัปเดตข้อมูล "${values.full_name}" สำเร็จเรียบร้อย ✨`);
        handleCancel(); fetchData();
      } else { throw new Error(res.message||'เซิร์ฟเวอร์ตอบกลับแต่ไม่สำเร็จ'); }
    } catch(err){
      if(err?.errorFields) { toast('warning','กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'); return; }
      toast('error', 'อัปเดตไม่สำเร็จ: '+(err.response?.data?.message||err.message||'ไม่ทราบสาเหตุ'));
    } finally { setSaving(false); }
  };

  const beforeUpload = file => {
    if (!file.type.startsWith('image/')) { toast('warning','กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'); return Upload.LIST_IGNORE; }
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
    return false;
  };

  const onCameraCapture = ({ file, url }) => {
    setPreviewUrl(url);
    setFileList([{ uid: String(Date.now()), name: file.name, status:'done', originFileObj: file, url }]);
  };

  const getLevelColor = l => !l?'default':l.includes('ปวช')?'orange':l.includes('ปวส')?'blue':'cyan';

  const filteredData = userList.filter(u => {
    const q = searchText.toLowerCase();
    return (u.full_name||'').toLowerCase().includes(q)||(u.student_id||'').includes(q)||(u.email||'').toLowerCase().includes(q);
  });

  const roleConfig = {
    department_head: { color:'#7c3aed', bg:'#faf5ff', border:'#ddd6fe', label:'หัวหน้าแผนก', icon:<StarFilled/> },
    teacher:         { color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', label:'อาจารย์',      icon:<TeamOutlined/> },
    student:         { color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc', label:'นักเรียน',     icon:<BookOutlined/> },
  };

  const columns = [
    {
      title: <span className="col-hd">โปรไฟล์</span>,
      dataIndex:'profile_img', key:'prof', width:80, align:'center',
      render:(img, r) => (
        <Badge dot color={r.status==='active'?'#22c55e':'#ef4444'} offset={[-6,42]}>
          <div className="av-wrap" style={{ '--bord': r.status==='active'?'#86efac':'#fca5a5' }}>
            <Avatar src={img?`${API_URL}/uploads/profiles/${img}?t=${Date.now()}`:null} size={48} icon={<UserOutlined/>}
              style={{ border:`2.5px solid ${r.status==='active'?'#86efac':'#fca5a5'}`, background:'#e0e7ff', color:'#6366f1', filter:r.status==='inactive'?'grayscale(80%) opacity(.6)':'none', transition:'all .3s' }}/>
          </div>
        </Badge>
      )
    },
    {
      title: <span className="col-hd">ข้อมูลพื้นฐาน</span>,
      key:'info', width:220,
      render:(_,r) => (
        <div>
          <p style={{ margin:0, fontWeight:800, fontSize:14, color: r.status==='inactive'?'#94a3b8':'#1e293b', textDecoration: r.status==='inactive'?'line-through':'none' }}>{r.full_name}</p>
          <span style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
            {r.role==='student'?<IdcardOutlined/>:<SafetyCertificateOutlined/>}
            {r.role==='student' ? (r.student_id||'ไม่มีรหัส') : `ID: ${r.id}`}
          </span>
        </div>
      )
    },
    {
      title: <span className="col-hd">สังกัด / ระดับ</span>,
      key:'aff', width:160,
      render:(_,r) => r.role==='student' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {r.student_level && <Tag color={getLevelColor(r.student_level)} style={{ margin:0, border:0, fontWeight:700, fontSize:11 }}>{r.student_level}</Tag>}
          {r.student_group && <span style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:6 }}>กลุ่ม {r.student_group}</span>}
        </div>
      ) : <span style={{ fontSize:11, color:'#cbd5e1', fontStyle:'italic' }}>— บุคลากร —</span>
    },
    {
      title: <span className="col-hd">การติดต่อ</span>,
      key:'contact', width:220,
      render:(_,r) => (
        <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, color:'#475569' }}>
          {r.email ? <span><MailOutlined style={{ color:'#94a3b8', marginRight:6 }}/>{r.email}</span> : <span style={{ color:'#e2e8f0', fontStyle:'italic' }}>ไม่มีอีเมล</span>}
          {r.phone ? <span><PhoneOutlined style={{ color:'#94a3b8', marginRight:6 }}/>{r.phone}</span> : <span style={{ color:'#e2e8f0', fontStyle:'italic' }}>ไม่มีเบอร์โทร</span>}
        </div>
      )
    },
    {
      title: <span className="col-hd">สถานะบัญชี</span>,
      key:'role', width:160, align:'center',
      render:(_,r) => {
        const rc = roleConfig[r.role] || { color:'#64748b', bg:'#f1f5f9', border:'#e2e8f0', label:r.role, icon:<UserOutlined/> };
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:rc.bg, color:rc.color, border:`1.5px solid ${rc.border}`, padding:'3px 12px', borderRadius:99, fontWeight:800, fontSize:11 }}>{rc.icon} {rc.label}</span>
            {r.status==='active'
              ? <span style={{ fontSize:10, color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'2px 10px', borderRadius:99, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}><CheckCircleOutlined/> ใช้งานได้</span>
              : <span style={{ fontSize:10, color:'#dc2626', background:'#fff1f2', border:'1px solid #fecaca', padding:'2px 10px', borderRadius:99, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}><StopOutlined/> ระงับการใช้งาน</span>}
          </div>
        );
      }
    },
    {
      title: <span className="col-hd">จัดการ</span>,
      key:'act', width:110, fixed:'right', align:'center',
      render:(_,r) => (
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <Tooltip title="แก้ไขโปรไฟล์">
            <button onClick={()=>handleEditClick(r)} className="act-btn edit-btn">
              <EditOutlined style={{ fontSize:14 }}/>
            </button>
          </Tooltip>
          <Tooltip title="ลบข้อมูลถาวร">
            <Popconfirm
              title="ยืนยันการลบข้อมูล?"
              description={<div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>ข้อมูลและรูปภาพโปรไฟล์จะถูก<b>ลบอย่างถาวร</b></div>}
              onConfirm={()=>handleDelete(r.id, r.full_name)}
              okText="ลบถาวร" cancelText="ยกเลิก"
              okButtonProps={{ danger:true }}
            >
              <button className="act-btn del-btn">
                <DeleteOutlined style={{ fontSize:14 }}/>
              </button>
            </Popconfirm>
          </Tooltip>
        </div>
      )
    },
  ];

  return (
    <Layout className={`min-h-screen bg-[#f0f4ff] transition-opacity duration-700 ${pageReady?'opacity-100':'opacity-0'}`}>
      <ToastBox toasts={toasts} remove={removeToast}/>
      <CameraModal open={camOpen} onCapture={onCameraCapture} onClose={()=>setCamOpen(false)}/>
      <div className="mesh" aria-hidden="true"/>
      <AdminSidebar/>
      <Layout className="bg-transparent">
        <Content className="p-4 md:p-8 h-screen overflow-y-auto cs">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">

            {/* HEADER */}
            <div className="io hdr overflow-hidden rounded-3xl">
              <div className="h-2 w-full stps"/>
              <div style={{ background:'rgba(255,255,255,.96)', padding:'22px 28px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:16 }}>
                <div>
                  <h1 style={{ margin:0, fontWeight:900, fontSize:26, color:'#1e293b', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', padding:'8px 10px', borderRadius:14, color:'#fff', fontSize:20, display:'flex', alignItems:'center' }}><TeamOutlined/></span>
                    จัดการผู้ใช้งาน
                  </h1>
                  <p style={{ margin:'5px 0 0', fontSize:13, color:'#94a3b8' }}>ดูแลและจัดการบัญชีผู้ใช้ บุคลากร และนักเรียนในระบบ</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fafc', padding:'8px 14px', borderRadius:16, border:'1.5px solid #e2e8f0' }}>
                    <SearchOutlined style={{ color:'#94a3b8', fontSize:15 }}/>
                    <input
                      placeholder="ค้นหาชื่อ, รหัสนักศึกษา, อีเมล..."
                      value={searchText}
                      onChange={e=>{ sfx.click(); setSearchText(e.target.value); }}
                      style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:'#1e293b', width:240, fontWeight:500 }}
                      className="srch"
                    />
                    {searchText && <button onClick={()=>setSearchText('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14, padding:0, lineHeight:1 }}>×</button>}
                  </div>
                  <span style={{ background:'#eff6ff', color:'#4f46e5', padding:'6px 14px', borderRadius:12, fontSize:12, fontWeight:900 }}>{filteredData.length} คน</span>
                  <button onClick={()=>{sfx.click();fetchData();}} style={{ background:'#f1f5f9', border:'none', borderRadius:12, width:40, height:40, cursor:'pointer', fontSize:16, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }} className="ref-btn"><ReloadOutlined className={loading?'animate-spin':''}/></button>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="io" style={{ background:'#fff', borderRadius:24, border:'1.5px solid #f1f5f9', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize:8, showSizeChanger:false, className:'px-4 pb-4' }}
                scroll={{ x:1050 }}
                className="mu-tbl"
                rowClassName={r => `mu-row ${r.status==='inactive'?'inactive-row':''}`}
                onRow={r=>({ onMouseEnter:()=>sfx.click() })}
              />
            </div>
          </div>
        </Content>
      </Layout>

      {/* EDIT MODAL */}
      <Modal
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        confirmLoading={saving}
        centered
        width="min(780px,96vw)"
        styles={{ body:{ padding:0 } }}
        className="mu-modal"
        okText={<span style={{ fontWeight:800, fontSize:14 }}>💾 บันทึกการเปลี่ยนแปลง</span>}
        cancelText={<span style={{ fontWeight:700, fontSize:14 }}>ยกเลิก</span>}
        okButtonProps={{ size:'large', style:{ height:46, borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', fontWeight:800, boxShadow:'0 8px 20px -5px rgba(99,102,241,.4)' } }}
        cancelButtonProps={{ size:'large', style:{ height:46, borderRadius:12, fontWeight:800 } }}
      >
        <div className="m-anim">
          {/* modal hero */}
          <div style={{ background:'linear-gradient(135deg,#1e3a5f,#312e81,#4c1d95)', padding:'22px 28px', borderRadius:'8px 8px 0 0', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.02) 0,rgba(255,255,255,.02) 1px,transparent 1px,transparent 10px)' }}/>
            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ position:'relative' }}>
                <Avatar
                  src={previewUrl || null}
                  icon={<UserOutlined/>}
                  size={68}
                  style={{ border:'3px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.1)', fontSize:24, flexShrink:0 }}
                />
                <button onClick={()=>setCamOpen(true)} className="cam-badge" title="ถ่ายรูปด้วยกล้อง">
                  <CameraOutlined style={{ fontSize:12 }}/>
                </button>
              </div>
              <div>
                <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700 }}>แก้ไขโปรไฟล์</p>
                <h2 style={{ margin:'3px 0 0', fontWeight:900, color:'#fff', fontSize:18 }}>{editingRecord?.full_name}</h2>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.45)' }}>ID: {editingId}</span>
              </div>
            </div>
          </div>

          <div style={{ padding:'24px 28px' }}>
            <Form form={form} layout="vertical">
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>

                {/* LEFT: avatar upload */}
                <div style={{ width:180, flexShrink:0 }}>
                  <div style={{ background:'#f8fafc', borderRadius:20, padding:'20px 16px', border:'1.5px solid #f1f5f9', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                    {/* preview */}
                    <div style={{ position:'relative', width:110, height:110 }}>
                      <div style={{ width:110, height:110, borderRadius:'50%', overflow:'hidden', border:'3px solid #e0e7ff', background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {previewUrl
                          ? <img src={previewUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <UserOutlined style={{ fontSize:36, color:'#a5b4fc' }}/>}
                      </div>
                      <button onClick={()=>setCamOpen(true)} className="cam-overlay-btn" title="ถ่ายรูปด้วยกล้อง">
                        <CameraOutlined style={{ fontSize:16 }}/>
                      </button>
                    </div>

                    {/* upload */}
                    <Upload
                      listType="text"
                      fileList={fileList}
                      onChange={({fileList:fl})=>{setFileList(fl);if(fl[0]?.originFileObj){const r=new FileReader();r.onload=e=>setPreviewUrl(e.target.result);r.readAsDataURL(fl[0].originFileObj);}}}
                      beforeUpload={beforeUpload}
                      maxCount={1} accept="image/*"
                      showUploadList={false}
                    >
                      <MagBtn
                        style={{ display:'flex', alignItems:'center', gap:6, background:'#eff6ff', color:'#4f46e5', border:'1.5px solid #c7d2fe', borderRadius:12, padding:'8px 14px', fontWeight:700, fontSize:12, width:'100%', justifyContent:'center' }}
                      >
                        <UploadOutlined style={{ fontSize:14 }}/> เลือกรูปภาพ
                      </MagBtn>
                    </Upload>
                    <MagBtn
                      onClick={()=>setCamOpen(true)}
                      style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', borderRadius:12, padding:'8px 14px', fontWeight:800, fontSize:12, width:'100%', justifyContent:'center', boxShadow:'0 6px 16px -4px rgba(99,102,241,.4)' }}
                    >
                      <CameraOutlined style={{ fontSize:14 }}/> ถ่ายรูป
                    </MagBtn>
                    <p style={{ margin:0, fontSize:10, color:'#94a3b8', textAlign:'center', lineHeight:1.6 }}>รองรับ JPG, PNG<br/>ขนาดไม่เกิน 2MB</p>
                  </div>

                  <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
                    <Form.Item label={<span style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>สถานะบัญชี</span>} name="status" style={{ marginBottom:0 }}>
                      <Select size="large">
                        <Option value="active"><Badge status="success" text="ใช้งาน (Active)"/></Option>
                        <Option value="inactive"><Badge status="error" text="ระงับ (Inactive)"/></Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>บทบาทผู้ใช้</span>} name="role" rules={[{required:true}]} style={{ marginBottom:0 }}>
                      <Select size="large">
                        <Option value="student">นักเรียน (Student)</Option>
                        <Option value="teacher">อาจารย์ (Teacher)</Option>
                        <Option value="department_head">หัวหน้าแผนก (Head)</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>

                {/* RIGHT: form fields */}
                <div style={{ flex:1, minWidth:260 }}>
                  <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', display:'flex', alignItems:'center', gap:6 }}>
                    <UserOutlined/> ข้อมูลส่วนตัว
                  </p>
                  <Form.Item label="ชื่อ-นามสกุล" name="full_name" rules={[{required:true,message:'กรุณากรอกชื่อ'}]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" prefix={<UserOutlined style={{ color:'#a5b4fc' }}/>} style={{ borderRadius:12 }}/>
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="อีเมล" name="email">
                        <Input size="large" placeholder="example@email.com" prefix={<MailOutlined style={{ color:'#a5b4fc' }}/>} style={{ borderRadius:12 }}/>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="เบอร์โทร" name="phone">
                        <Input size="large" placeholder="08X-XXX-XXXX" prefix={<PhoneOutlined style={{ color:'#a5b4fc' }}/>} style={{ borderRadius:12 }}/>
                      </Form.Item>
                    </Col>
                  </Row>
                  <p style={{ margin:'4px 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', display:'flex', alignItems:'center', gap:6 }}>
                    <LockOutlined/> ความปลอดภัย
                  </p>
                  <Form.Item label="เปลี่ยนรหัสผ่าน" name="password" tooltip="เว้นว่างไว้หากไม่ต้องการเปลี่ยน">
                    <Input.Password size="large" placeholder="เว้นว่างหากไม่เปลี่ยน" prefix={<LockOutlined style={{ color:'#a5b4fc' }}/>} style={{ borderRadius:12 }}/>
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate={(p,c)=>p.role!==c.role}>
                    {({getFieldValue}) => getFieldValue('role')==='student' ? (
                      <div style={{ background:'linear-gradient(135deg,#eff6ff,#eef2ff)', padding:'16px 18px', borderRadius:16, border:'1.5px solid #c7d2fe', marginTop:4 }}>
                        <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#4f46e5', textTransform:'uppercase', letterSpacing:'.08em', display:'flex', alignItems:'center', gap:6 }}>
                          <BookOutlined/> ข้อมูลทางวิชาการ
                        </p>
                        <Form.Item label="รหัสนักศึกษา" name="student_id" rules={[{required:true,message:'กรุณากรอกรหัส'}]} style={{ marginBottom:10 }}>
                          <Input size="large" prefix={<IdcardOutlined style={{ color:'#a5b4fc' }}/>} placeholder="11 หลัก" style={{ borderRadius:12 }}/>
                        </Form.Item>
                        <Row gutter={12}>
                          <Col span={12}>
                            <Form.Item label="ระดับชั้น" name="student_level" style={{ marginBottom:0 }}>
                              <Select size="large" placeholder="เลือกระดับ" style={{ borderRadius:12 }}>
                                {['ปวช. 1','ปวช. 2','ปวช. 3','ปวส. 1','ปวส. 2'].map(v=><Option key={v} value={v}>{v}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="กลุ่มเรียน" name="student_group" style={{ marginBottom:0 }}>
                              <Input size="large" placeholder="เช่น 1 หรือ 2" prefix={<HomeOutlined style={{ color:'#a5b4fc' }}/>} style={{ borderRadius:12 }}/>
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ) : null}
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      <style>{`
        :root{--sp:cubic-bezier(.34,1.56,.64,1);--out:cubic-bezier(.16,1,.3,1);}
        .mesh{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 70% 50% at 5% 0%,#dbeafe44,transparent),radial-gradient(ellipse 60% 60% at 95% 100%,#ede9fe44,transparent);}
        .io{opacity:0;transform:translateY(22px);transition:opacity .6s var(--out),transform .6s var(--out);}
        .io-in{opacity:1!important;transform:translateY(0)!important;}
        @keyframes hIn{from{opacity:0;transform:translateY(-18px) scale(.97)}to{opacity:1;transform:none}}
        .hdr{border:1px solid rgba(255,255,255,.9);box-shadow:0 20px 50px -10px rgba(99,102,241,.12);animation:hIn .7s var(--out) both;}
        @keyframes sA{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
        .stps{background:linear-gradient(to right,#4f46e5,#7c3aed,#db2777,#0ea5e9,#4f46e5);background-size:400% 400%;animation:sA 6s ease infinite;}
        /* table */
        .mu-tbl .ant-table{background:transparent!important;}
        .mu-tbl .ant-table-thead > tr > th{background:#f8fafc!important;padding:13px 16px!important;border-bottom:1.5px solid #f1f5f9!important;}
        .col-hd{font-weight:900;font-size:11px;color:#94a3b8;letter-spacing:.07em;text-transform:uppercase;}
        .mu-tbl .ant-table-tbody > tr > td{padding:13px 16px!important;border-bottom:1px solid #f8fafc!important;transition:background .15s;}
        .mu-row:hover > td{background:#f5f3ff!important;}
        .mu-row:hover{box-shadow:inset 3px 0 0 #7c3aed;}
        .inactive-row > td{opacity:.65;}
        /* action buttons */
        .act-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;border:1.5px solid;cursor:pointer;transition:all .18s var(--sp);}
        .act-btn:hover{transform:translateY(-2px) scale(1.1);}
        .edit-btn{background:#eff6ff;color:#4f46e5;border-color:#c7d2fe;}
        .edit-btn:hover{background:#4f46e5;color:#fff;box-shadow:0 6px 14px -4px rgba(99,102,241,.4);}
        .del-btn{background:#fff1f2;color:#dc2626;border-color:#fecaca;}
        .del-btn:hover{background:#dc2626;color:#fff;box-shadow:0 6px 14px -4px rgba(220,38,38,.35);}
        /* camera badge */
        .cam-badge{position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;borderRadius:'50%';background:linear-gradient(135deg,#4f46e5,#7c3aed);border:2px solid rgba(255,255,255,.3);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;border-radius:50%;transition:all .2s var(--sp);}
        .cam-badge:hover{transform:scale(1.2);}
        .cam-overlay-btn{position:absolute;bottom:0;right:0;width:32px;height:32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border:2.5px solid #fff;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:all .2s var(--sp);box-shadow:0 4px 10px rgba(99,102,241,.4);}
        .cam-overlay-btn:hover{transform:scale(1.15);}
        /* modal */
        .mu-modal .ant-modal-content{border-radius:20px!important;overflow:hidden;padding:0;box-shadow:0 40px 80px -20px rgba(0,0,0,.22);}
        .mu-modal .ant-modal-footer{padding:14px 24px 18px!important;border-top:1px solid #f1f5f9!important;}
        .mu-modal .ant-modal-close{top:12px;right:12px;}
        .mu-modal .ant-modal-close:hover{color:#ef4444;transform:rotate(90deg);transition:all .2s;}
        @keyframes mIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:none}}
        .m-anim{animation:mIn .35s var(--sp) both;}
        /* camera modal */
        @keyframes camIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
        .cam-box{animation:camIn .3s var(--sp) both;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cam-ring{width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.1);border-top-color:#818cf8;animation:spin .7s linear infinite;margin:0 auto;}
        .cam-cancel:hover{background:rgba(255,255,255,.12)!important;color:#fff!important;}
        /* toast */
        @keyframes tIn{from{transform:translateX(110%) scale(.9);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}
        .toast-item{animation:tIn .35s var(--sp) both;}
        .toast-item:hover{transform:scale(1.02);}
        .t-prog{position:absolute;bottom:0;left:0;height:3px;background:var(--a,#6366f1);border-radius:99px;animation:tProg var(--d,4200ms) linear forwards;}
        @keyframes tProg{from{width:100%}to{width:0}}
        /* misc */
        .ref-btn:hover{background:#eff6ff!important;color:#4f46e5!important;}
        .av-wrap{display:inline-block;transition:transform .2s var(--sp);}
        .av-wrap:hover{transform:scale(1.08);}
        /* scrollbar */
        .cs::-webkit-scrollbar{width:7px;}
        .cs::-webkit-scrollbar-track{background:#f1f5f9;}
        .cs::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px;border:2px solid #f1f5f9;}
        .cs::-webkit-scrollbar-thumb:hover{background:#818cf8;}
        .ant-pagination-item{border-radius:10px!important;font-weight:700!important;transition:all .15s;}
        .ant-pagination-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,.25);}
        .ant-pagination-item-active{background:#4f46e5!important;border-color:#4f46e5!important;}
        .ant-pagination-item-active a{color:#fff!important;}
      `}</style>
    </Layout>
  );
};

export default ManageUsers;