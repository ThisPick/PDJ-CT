import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Hash, Lock, Camera, Image, BookOpen,
  Home, StopCircle, Save, X, Eye, EyeOff, CheckCircle2,
  AlertCircle, Bell, Menu, Sparkles, Shield, Edit3, RefreshCw
} from 'lucide-react';
import StudentSidebar from './Studentbar';
import { userService } from '../services/userService';

/* ─────────────────────────────────────────────────────────
   🔊  Web Audio — เสียงน่ารัก
───────────────────────────────────────────────────────── */
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.2;
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
      note(523, 0, 0.15); note(659, 0.1, 0.15); note(784, 0.2, 0.18); note(1047, 0.3, 0.3);
    } else if (type === 'error') {
      note(440, 0, 0.18, 0.5, 'triangle'); note(349, 0.16, 0.25, 0.4, 'triangle');
    } else if (type === 'confirm') {
      note(659, 0, 0.14, 0.4); note(523, 0.16, 0.18, 0.35);
    } else if (type === 'info') {
      note(880, 0, 0.16, 0.3);
    } else if (type === 'camera') {
      // 📸 shutter click
      note(1200, 0,    0.04, 0.5, 'square');
      note(800,  0.04, 0.06, 0.3, 'square');
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
            position: 'absolute', left: `${left}%`, top: '45%',
            fontSize: `${12 + (i % 4) * 6}px`,
            animation: `pflyP${type} 1.4s ease-out ${delay}s forwards`,
          }}>{items[i % items.length]}</span>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   🔔  Toast Stack
───────────────────────────────────────────────────────── */
const TOAST_GRAD = {
  success: 'from-pink-400 to-rose-400',
  error:   'from-red-400 to-orange-400',
  info:    'from-indigo-400 to-purple-400',
  confirm: 'from-amber-400 to-orange-400',
  camera:  'from-teal-400 to-cyan-400',
};
const TOAST_ICON = { success:'🌸', error:'💔', info:'💫', confirm:'🤔', camera:'📸' };

const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id}
        style={{ animation:'toastIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white
                    bg-gradient-to-r ${TOAST_GRAD[t.type]||TOAST_GRAD.info}
                    max-w-[88vw] sm:max-w-xs pointer-events-auto`}>
        <span className="text-xl shrink-0" style={{ animation:'iconBounce 0.8s ease-in-out infinite' }}>
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
   💬  Kawaii Alert / Confirm Modal
───────────────────────────────────────────────────────── */
const ALERT_CFG = {
  confirm: { emoji:'⚠️',  grad:'from-amber-50 to-orange-50', btn:'from-orange-400 to-amber-500', ring:'ring-orange-200' },
  error:   { emoji:'💔',  grad:'from-red-50 to-pink-50',     btn:'from-red-400 to-pink-500',     ring:'ring-red-200'    },
  success: { emoji:'🌸',  grad:'from-emerald-50 to-teal-50', btn:'from-emerald-400 to-teal-500', ring:'ring-emerald-200' },
  info:    { emoji:'💫',  grad:'from-indigo-50 to-purple-50', btn:'from-indigo-400 to-purple-500',ring:'ring-indigo-200'  },
  warning: { emoji:'🌺',  grad:'from-amber-50 to-yellow-50', btn:'from-amber-400 to-orange-400', ring:'ring-amber-200'   },
};

const KawaiiModal = ({ state, onClose }) => {
  if (!state.isOpen) return null;
  const c = ALERT_CFG[state.type] || ALERT_CFG.info;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md"
         style={{ animation:'fadeInBg 0.2s ease' }}>
      <div className={`bg-gradient-to-br ${c.grad} w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center border border-white ring-2 ${c.ring}`}
           style={{ animation:'modalIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="text-6xl mb-5 leading-none select-none"
             style={{ animation:'wiggleEmoji 0.55s ease 0.1s both' }}>{c.emoji}</div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{state.title}</h3>
        <p className="text-slate-500 text-sm mb-7 leading-relaxed">{state.message}</p>
        <div className="flex gap-3">
          {state.type === 'confirm' ? (
            <>
              <button onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                ยกเลิก
              </button>
              <button onClick={() => { state.onConfirm?.(); onClose(); }}
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
   📸  Camera Modal
───────────────────────────────────────────────────────── */
const CameraModal = ({ isOpen, videoRef, canvasRef, onCapture, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
         style={{ animation:'fadeInBg 0.25s ease' }}>
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
           style={{ animation:'modalIn 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 flex items-center gap-2.5 text-base">
            <div className="p-2 bg-teal-100 rounded-xl text-teal-600">
              <Camera className="w-4 h-4"/>
            </div>
            ถ่ายรูปโปรไฟล์ 📸
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-full transition-colors active:scale-90">
            <X className="w-5 h-5 text-slate-500"/>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center gap-4">
          {/* Video ring */}
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-spin"
                 style={{ animationDuration:'3s' }}/>
            <div className="absolute -inset-0.5 rounded-full bg-white"/>
            <video ref={videoRef} autoPlay playsInline muted
              className="relative w-64 h-64 rounded-full object-cover bg-slate-900 border-4 border-white shadow-xl"/>
          </div>

          <canvas ref={canvasRef} className="hidden"/>

          <p className="text-xs text-slate-400 font-medium">ปรับตำแหน่งให้ใบหน้าอยู่กลางกรอบ</p>

          <button onClick={onCapture}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500
                       hover:from-teal-600 hover:to-cyan-600 text-white rounded-2xl font-bold shadow-lg
                       shadow-teal-200/60 transition-all active:scale-90 text-sm">
            <Camera className="w-5 h-5"/> กดแชะภาพ ✨
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   🌀  Skeleton Loader
───────────────────────────────────────────────────────── */
const SkeletonPulse = ({ className }) => (
  <div className={`rounded-xl bg-slate-200 ${className}`}
       style={{ animation:'shimmerAnim 1.5s ease-in-out infinite' }}/>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="w-32 h-32 rounded-full bg-slate-200"/>
      <SkeletonPulse className="w-36 h-5"/>
      <SkeletonPulse className="w-24 h-4"/>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   🔑  Password Input with toggle
───────────────────────────────────────────────────────── */
const PasswordInput = ({ value, onChange, placeholder, name, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
      <input
        type={show ? 'text' : 'password'}
        name={name} value={value} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        className="w-full pl-10 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm
                   focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10
                   outline-none transition-all disabled:opacity-60"/>
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
        {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   🏠  Studentprofile — MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const Studentprofile = () => {
  const [loading,       setLoading]       = useState(false);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [userData,      setUserData]      = useState(null);
  const [previewImage,  setPreviewImage]  = useState(null);
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [isCameraOpen,  setIsCameraOpen]  = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [particle,      setParticle]      = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [alertState,    setAlertState]    = useState({ isOpen:false, type:'info', title:'', message:'', onConfirm:null });

  /* form fields */
  const [fields, setFields] = useState({
    full_name:'', email:'', student_id:'',
    student_level:'ปวส. 2', student_group:'',
    new_password:'', confirm_password:''
  });
  const [errors, setErrors] = useState({});

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);
  const toastRef  = useRef(0);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "https://reg.utc.ac.th";

  /* ── Toast & Alert helpers ── */
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

  /* ── Load profile ── */
  useEffect(() => {
    fetchProfile();
    return () => stopCamera();
  }, []);

  const fetchProfile = async () => {
    try {
      setPageLoading(true);
      const saved = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const userId = saved.id || saved.userId;
      if (!userId) { showAlert('error','ไม่พบข้อมูล','กรุณาเข้าสู่ระบบใหม่'); return; }

      const res  = await userService.getProfile(userId);
      const data = res.data?.data || res.data;
      setUserData(data);

      if (data.profile_img) {
        setPreviewImage(`${API_URL}/uploads/profiles/${data.profile_img}`);
      }
      setFields(f => ({
        ...f,
        full_name:     data.full_name    || '',
        email:         data.email        || '',
        student_id:    data.student_id   || '',
        student_level: data.student_level|| 'ปวส. 2',
        student_group: data.student_group|| '',
      }));
    } catch (err) {
      console.error(err);
      showAlert('error','โหลดข้อมูลไม่สำเร็จ','ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
    } finally {
      setPageLoading(false);
    }
  };

  /* ── Field handler ── */
  const handleField = (e) => {
    const { name, value } = e.target;
    setFields(f => ({ ...f, [name]:value }));
    setErrors(e => ({ ...e, [name]:'' }));
  };

  /* ── Image from file ── */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(file.name);
    if (!ok) { showAlert('error','ไฟล์ไม่ถูกต้อง','กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPreviewImage(ev.target.result);
    reader.readAsDataURL(file);
    pushToast('info','เลือกรูปแล้ว 🖼️','กดบันทึกเพื่ออัปโหลดรูปโปรไฟล์');
  };

  /* ── Camera ── */
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      showAlert('error','เปิดกล้องไม่ได้','ตรวจสอบว่าเว็บใช้ HTTPS หรืออนุญาตการใช้กล้องแล้วหรือยัง');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'camera_capture.jpg', { type:'image/jpeg' });
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = ev => setPreviewImage(ev.target.result);
      reader.readAsDataURL(file);
      playSound('camera');
      stopCamera();
      pushToast('camera','ถ่ายรูปสำเร็จ! 📸','กดบันทึกเพื่ออัปโหลดรูปโปรไฟล์');
    }, 'image/jpeg', 0.92);
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!fields.full_name.trim())   e.full_name = 'กรุณากรอกชื่อ-นามสกุล';
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'อีเมลไม่ถูกต้อง';
    if (fields.new_password && fields.new_password !== fields.confirm_password) e.confirm_password = 'รหัสผ่านไม่ตรงกัน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { playSound('error'); return; }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('full_name',     fields.full_name);
      data.append('email',         fields.email || '');
      data.append('student_id',    fields.student_id);
      data.append('student_level', fields.student_level || '');
      data.append('student_group', fields.student_group || '');
      if (fields.new_password) data.append('password', fields.new_password);
      if (selectedFile) data.append('profile_img', selectedFile);

      const res = await userService.updateUser(userData.id, data);
      if (res.data?.success || res.success) {
        pushToast('success','บันทึกสำเร็จ! 🌸','กำลังอัปเดตข้อมูล...');
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch (err) {
      console.error(err);
      showAlert('error','เกิดข้อผิดพลาด', err.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  /* ── Deactivate ── */
  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await userService.updateUser(userData.id, { status:'inactive' });
      pushToast('info','ระงับบัญชีแล้ว 🍂','กำลังออกจากระบบ...');
      setTimeout(() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }, 2200);
    } catch (err) {
      showAlert('error','ผิดพลาด','ระงับบัญชีไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  /* ── Input field component ── */
  const Field = ({ icon: Icon, label, name, type='text', required, disabled, placeholder, hint }) => (
    <div className="space-y-1.5" style={{ animation:'fieldIn 0.4s ease both' }}>
      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
        {label}{required && <span className="text-pink-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>}
        <input type={type} name={name} value={fields[name]} onChange={handleField}
          disabled={disabled} required={required} placeholder={placeholder}
          className={`w-full ${Icon?'pl-10':'pl-4'} pr-4 py-3 border-2 rounded-xl text-sm transition-all outline-none
                      ${disabled
                        ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'
                        : errors[name]
                          ? 'bg-red-50 border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'
                          : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                      }`}/>
      </div>
      {errors[name] && (
        <p className="text-xs font-bold text-red-500 flex items-center gap-1" style={{ animation:'fieldIn 0.3s ease' }}>
          <AlertCircle className="w-3 h-3"/> {errors[name]}
        </p>
      )}
      {hint && !errors[name] && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );

  const LEVELS = ['ปวช. 1','ปวช. 2','ปวช. 3','ปวส. 1','ปวส. 2'];

  /* ════════════════════════════════ JSX ════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes pflyP0 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(55px,-170px)scale(0)} }
        @keyframes pflyP1 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(-70px,-200px)scale(0)} }
        @keyframes pflyP2 { 0%{opacity:1;transform:translate(0,0)scale(1)} 100%{opacity:0;transform:translate(10px,-220px)scale(0)} }
        @keyframes toastIn     { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes iconBounce  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes fadeInBg    { from{opacity:0} to{opacity:1} }
        @keyframes modalIn     { from{opacity:0;transform:scale(0.78)translateY(18px)} to{opacity:1;transform:scale(1)translateY(0)} }
        @keyframes wiggleEmoji { 0%{transform:rotate(-12deg)scale(0.6)} 50%{transform:rotate(10deg)scale(1.25)} 80%{transform:rotate(-4deg)scale(1.05)} 100%{transform:rotate(0)scale(1)} }
        @keyframes shimmerAnim { 0%{opacity:1} 50%{opacity:0.5} 100%{opacity:1} }
        @keyframes fieldIn     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatAvatar { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes cardSlide   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spinRing    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseRing   { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.3)} 50%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .card-anim { animation: cardSlide 0.45s ease both; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
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
        <div className={`fixed lg:static inset-y-0 left-0 z-[60] transition-transform duration-300
                         ${sidebarOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>
          <StudentSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ── Header ── */}
          <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 sm:px-6 lg:px-8
                             py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                      onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-slate-600"/>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600 hidden sm:flex">
                  <User className="w-6 h-6"/>
                </div>
                <div>
                  <h1 className="text-base sm:text-xl lg:text-2xl font-black text-slate-800 leading-tight">
                    ตั้งค่าโปรไฟล์
                  </h1>
                  <p className="hidden sm:block text-slate-400 text-xs font-medium mt-0.5">
                    จัดการข้อมูลส่วนตัวและความปลอดภัย
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-slate-500"/>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse"/>
              </button>
              <button onClick={fetchProfile}
                className="p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 active:scale-95 transition-all"
                title="รีเฟรชข้อมูล">
                <RefreshCw className="w-4 h-4"/>
              </button>
            </div>
          </header>

          {/* ── Body ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                  {/* ════ LEFT: Profile Card ════ */}
                  <div className="lg:col-span-1 space-y-4">

                    {/* Avatar Card */}
                    <div className="card-anim bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden"
                         style={{ animationDelay:'0s' }}>

                      {/* Gradient banner */}
                      <div className="h-24 relative overflow-hidden"
                           style={{
                             background:'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)',
                             backgroundSize:'300% 300%',
                             animation:'gradientShift 4s ease infinite'
                           }}>
                        {/* Decorative circles */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10"/>
                        <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-white/10"/>
                        <div className="absolute top-2 right-8 w-3 h-3 rounded-full bg-white/30"/>
                        <span className="absolute top-3 left-4 text-white/40 text-3xl select-none">✨</span>
                      </div>

                      <div className="px-5 pb-6 text-center">
                        {/* Avatar */}
                        <div className="-mt-14 mb-4 flex flex-col items-center">
                          <div className="relative inline-block">
                            {/* Spinning ring when loading */}
                            {loading && (
                              <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-indigo-400"
                                   style={{ animation:'spinRing 2s linear infinite' }}/>
                            )}
                            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-indigo-100">
                              {pageLoading ? (
                                <div className="w-full h-full bg-slate-200 rounded-full" style={{ animation:'shimmerAnim 1.5s ease-in-out infinite' }}/>
                              ) : previewImage ? (
                                <img src={previewImage} alt="profile" className="w-full h-full object-cover"
                                     style={{ animation:'floatAvatar 4s ease-in-out infinite' }}/>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"
                                     style={{ animation:'floatAvatar 4s ease-in-out infinite' }}>
                                  <User className="w-12 h-12 text-indigo-300"/>
                                </div>
                              )}
                            </div>

                            {/* Edit badge */}
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform active:scale-90"
                                 onClick={() => fileRef.current?.click()}>
                              <Edit3 className="w-3.5 h-3.5 text-white"/>
                            </div>
                          </div>

                          {pageLoading ? (
                            <div className="mt-3 space-y-2 flex flex-col items-center">
                              <SkeletonPulse className="w-36 h-5"/>
                              <SkeletonPulse className="w-24 h-4"/>
                            </div>
                          ) : (
                            <>
                              <h2 className="mt-3 font-black text-slate-800 text-base leading-tight">
                                {userData?.full_name || '—'}
                              </h2>
                              <p className="text-slate-400 text-xs font-bold mt-0.5">{userData?.student_id || '—'}</p>
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl mb-4">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">กำลังใช้งาน (Active)</span>
                        </div>

                        {/* Upload buttons */}
                        <div className="flex gap-2.5">
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect}/>
                          <button type="button" onClick={() => fileRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold
                                       text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95">
                            <Image className="w-3.5 h-3.5"/> เลือกรูป
                          </button>
                          <button type="button" onClick={startCamera}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold
                                       text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all active:scale-95"
                            style={{ animation:'pulseRing 2.5s ease-in-out 3' }}>
                            <Camera className="w-3.5 h-3.5"/> ถ่ายรูป
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-2">รองรับ JPG, PNG, HEIC ขนาดไม่เกิน 10MB</p>
                      </div>
                    </div>

                    {/* Info Card */}
                    {!pageLoading && userData && (
                      <div className="card-anim bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3"
                           style={{ animationDelay:'0.1s' }}>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400"/> ข้อมูลบัญชี
                        </h3>
                        {[
                          { icon: Hash,    label:'รหัสนักศึกษา', val: userData.student_id },
                          { icon: BookOpen,label:'ระดับชั้น',     val: userData.student_level },
                          { icon: Home,    label:'กลุ่ม',         val: userData.student_group||'—' },
                        ].map(({ icon:Icon, label, val }) => (
                          <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-500 shrink-0">
                              <Icon className="w-3.5 h-3.5"/>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
                              <p className="text-sm font-bold text-slate-700">{val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Danger Zone */}
                    {!pageLoading && (
                      <div className="card-anim bg-white rounded-3xl border border-red-100 shadow-sm p-5"
                           style={{ animationDelay:'0.15s' }}>
                        <h3 className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                          <Shield className="w-3.5 h-3.5"/> Danger Zone
                        </h3>
                        <button type="button"
                          onClick={() => showConfirm('ระงับบัญชีของฉัน? ⚠️',
                            'หากระงับบัญชี คุณจะต้องติดต่อแอดมินเพื่อเปิดใช้งานใหม่ ยืนยันหรือไม่?',
                            handleDeactivate)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold
                                     text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all active:scale-95">
                          <StopCircle className="w-4 h-4"/> ระงับบัญชีของฉัน
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-2">การดำเนินการนี้ไม่สามารถยกเลิกได้เองได้</p>
                      </div>
                    )}
                  </div>

                  {/* ════ RIGHT: Edit Form ════ */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-5">

                    {/* Basic Info Card */}
                    <div className="card-anim bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-5 sm:p-6"
                         style={{ animationDelay:'0.08s' }}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                          <User className="w-5 h-5"/>
                        </div>
                        <div>
                          <h2 className="font-black text-slate-800 text-sm sm:text-base">แก้ไขข้อมูลพื้นฐาน</h2>
                          <p className="text-xs text-slate-400">ชื่อ อีเมล และข้อมูลชั้นเรียน</p>
                        </div>
                      </div>

                      {pageLoading ? (
                        <div className="space-y-4">
                          {[1,2,3].map(i => <SkeletonPulse key={i} className="h-12 w-full"/>)}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Field icon={Hash}   label="รหัสนักศึกษา (ไม่สามารถแก้ไขได้)" name="student_id" disabled
                            hint="รหัสนักศึกษาไม่สามารถแก้ไขได้"/>
                          <Field icon={User}   label="ชื่อ-นามสกุล" name="full_name" required
                            placeholder="กรอกชื่อ-นามสกุลของคุณ"/>
                          <Field icon={Mail}   label="อีเมล" name="email" type="email"
                            placeholder="example@email.com"/>

                          {/* Level + Group */}
                          <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 rounded-2xl space-y-4">
                            <p className="text-xs font-black text-indigo-600 flex items-center gap-2 uppercase tracking-wider">
                              <BookOpen className="w-3.5 h-3.5"/> ข้อมูลแผนก / ชั้นเรียน
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {/* Level select */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">ระดับชั้น</label>
                                <div className="relative">
                                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                                  <select name="student_level" value={fields.student_level} onChange={handleField}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm
                                               focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer">
                                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                                  </select>
                                </div>
                              </div>
                              {/* Group */}
                              <Field icon={Home} label="กลุ่ม" name="student_group" placeholder="เช่น 1, 2"/>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Security Card */}
                    <div className="card-anim bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-5 sm:p-6"
                         style={{ animationDelay:'0.14s' }}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2.5 bg-purple-100 rounded-2xl text-purple-600 shrink-0">
                          <Lock className="w-5 h-5"/>
                        </div>
                        <div>
                          <h2 className="font-black text-slate-800 text-sm sm:text-base">ความปลอดภัย</h2>
                          <p className="text-xs text-slate-400">เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                            รหัสผ่านใหม่
                          </label>
                          <PasswordInput name="new_password" value={fields.new_password} onChange={handleField}
                            placeholder="ว่างไว้เพื่อใช้รหัสเดิม"/>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                            ยืนยันรหัสผ่าน
                          </label>
                          <PasswordInput name="confirm_password" value={fields.confirm_password} onChange={handleField}
                            placeholder="พิมพ์รหัสผ่านอีกครั้ง"/>
                          {errors.confirm_password && (
                            <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3"/> {errors.confirm_password}
                            </p>
                          )}
                        </div>
                      </div>

                      {fields.new_password && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                             style={{ animation:'fieldIn 0.3s ease' }}>
                          <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5"/> ตรวจสอบให้แน่ใจว่ารหัสผ่านทั้งสองช่องตรงกัน
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="card-anim" style={{ animationDelay:'0.2s' }}>
                      <button type="submit" disabled={loading || pageLoading}
                        className="w-full flex items-center justify-center gap-3 py-4
                                   bg-gradient-to-r from-indigo-500 to-purple-500
                                   hover:from-indigo-600 hover:to-purple-600
                                   text-white rounded-2xl font-black shadow-xl shadow-indigo-200/60
                                   disabled:opacity-50 transition-all active:scale-[0.98]
                                   text-sm sm:text-base">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5"/>
                            <span>บันทึกการเปลี่ยนแปลงทั้งหมด 🌸</span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-2">
                        ข้อมูลของคุณจะถูกเข้ารหัสและปลอดภัย 🔒
                      </p>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onCapture={capturePhoto}
        onClose={stopCamera}
      />

      {/* Alert / Confirm */}
      <KawaiiModal state={alertState} onClose={closeAlert} />
    </>
  );
};

export default Studentprofile;