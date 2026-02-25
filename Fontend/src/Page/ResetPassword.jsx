import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/auth'; 
import { LockOutlined, MailOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // 1. ตรวจสอบความยาวรหัสผ่าน (ให้ตรงกับเงื่อนไขหลังบ้าน)
    if (newPassword.length < 5) {
      return setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 5 ตัวอักษร' });
    }

    // 2. ตรวจสอบว่ารหัสผ่านตรงกันไหม
    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'ยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง' });
    }

    setLoading(true);
    try {
      // 3. เรียกใช้ API (ส่ง email และ newPassword ตามที่หลังบ้านรอรับ)
      const result = await resetPassword(email.trim(), newPassword);
      
      if (result.status === "success") {
        setMessage({ type: 'success', text: '✅ เปลี่ยนรหัสผ่านสำเร็จ! กำลังพากลับไปหน้า Login...' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      // ดึง Error Message จากหลังบ้าน (เช่น "ไม่พบอีเมลนี้ในระบบ")
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/95 p-8 shadow-2xl border border-white/20">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
              <LockOutlined style={{ fontSize: '32px' }} />
            </div>
            <h2 className="text-2xl font-black text-emerald-900">ตั้งรหัสผ่านใหม่</h2>
            <p className="text-emerald-600 text-sm font-medium">ความปลอดภัยของบัญชีคือสิ่งสำคัญ</p>
          </div>

          <form className="space-y-5" onSubmit={handleReset}>
            {/* Alert Message */}
            {message.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <InfoCircleOutlined /> {message.text}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 ml-2 uppercase tracking-widest">อีเมลที่ใช้สมัคร</label>
              <div className="relative">
                <MailOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white pl-12 pr-5 py-3.5 text-emerald-900 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="name@college.ac.th"
                />
              </div>
            </div>

            {/* New Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 ml-2 uppercase tracking-widest">รหัสผ่านใหม่</label>
              <div className="relative">
                <LockOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input 
                  type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white pl-12 pr-5 py-3.5 text-emerald-900 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="ตั้งรหัสผ่านใหม่"
                />
              </div>
              <p className="text-[10px] text-emerald-500 ml-2 italic">* ต้องมีอย่างน้อย 5 ตัวอักษรขึ้นไป</p>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 ml-2 uppercase tracking-widest">ยืนยันรหัสผ่านอีกครั้ง</label>
              <div className="relative">
                <LockOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input 
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white pl-12 pr-5 py-3.5 text-emerald-900 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="กรอกรหัสผ่านเดิมอีกครั้ง"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-2 rounded-2xl py-4 font-black text-white shadow-xl transition-all active:scale-95 ${
                loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-emerald-200'
              }`}
            >
              {loading ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-400 transition-colors">
              <ArrowLeftOutlined /> กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};