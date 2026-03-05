import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth'; 
import { DesktopOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2

export const Login = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.status === "success" || result.success) {
        const user = result.user;
        const dbRole = user.role; 
        const token = result.token || result.data?.token; 

        // ตรวจสอบความถูกต้องของสิทธิ์ (Role)
        const selectedRole = role === 'admin' ? 'department_head' : role;
        
        if (dbRole !== selectedRole) {
          let roleName = dbRole === 'student' ? "นักศึกษา" : dbRole === 'teacher' ? "ครู" : "หัวหน้าแผนก";
          
          // แจ้งเตือนกรณีเลือก Role ผิด
          Swal.fire({
            icon: 'warning',
            title: 'สิทธิ์การเข้าใช้งานไม่ถูกต้อง',
            text: `บัญชีนี้เป็นสิทธิ์ของ "${roleName}" กรุณาเลือกสิทธิ์ให้ถูกต้อง`,
            confirmButtonColor: '#10b981',
          });
          
          setLoading(false);
          return; 
        }

        // จัดการเรื่อง Token และ LocalStorage
        localStorage.clear();
        if (!token) {
          throw new Error("ไม่พบรหัสยืนยันตัวตน (Token) จากเซิร์ฟเวอร์");
        }

        const userDataToSave = {
           id: user.id,
           full_name: user.full_name,
           role: user.role
        };

        localStorage.setItem('user', JSON.stringify(userDataToSave));
        localStorage.setItem('token', token);

        // ✅ แสดง Windows Alert แบบสวยงาม (SweetAlert2)
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับคุณ ${user.full_name}`,
          showConfirmButton: false,
          timer: 1500, // ปิดเองภายใน 1.5 วินาที
          timerProgressBar: true,
        }).then(() => {
          // นำทางไปยัง Dashboard หลังจาก Alert ปิดลง
          if (dbRole === 'teacher' || dbRole === 'department_head') {
            navigate('/Admindashboard', { replace: true }); 
          } else if (dbRole === 'student') {
            navigate('/Studentdashboard', { replace: true }); 
          }
        });

      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      setError(errorMsg);
      
      // แจ้งเตือนกรณี Login ผิดพลาด
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: errorMsg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600 px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-md border border-white/20">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border border-emerald-50">
                <DesktopOutlined style={{ fontSize: '48px', color: '#10b981' }} />
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-black text-emerald-900 leading-tight text-center">
              ระบบบันทึกผลงานโครงงาน
            </h2>
            <p className="text-emerald-600 font-bold text-sm tracking-wide text-center uppercase">
              Computer Technology Department
            </p>
          </div>

          {/* Role Selection */}
          <div className="flex p-1.5 bg-emerald-50/50 rounded-2xl mb-6 border border-emerald-100">
            {['student', 'teacher', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  role === r 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'text-emerald-600 hover:bg-emerald-100/50'
                }`}
              >
                {r === 'student' ? 'นักศึกษา' : r === 'teacher' ? 'ครู' : 'หัวหน้าแผนก'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="text-center text-red-500 text-xs font-bold bg-red-50 p-2.5 rounded-xl border border-red-100 animate-pulse">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 ml-2 uppercase tracking-widest">Identification (Email)</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-5 py-3.5 text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all"
                placeholder="example@college.ac.th"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 ml-2 uppercase tracking-widest">Security (Password)</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-5 py-3.5 text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-4 font-black text-white shadow-xl transition-all active:scale-95 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-emerald-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                   กำลังตรวจสอบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Links Section */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-emerald-50 pt-6">
            <Link 
              to="/reset-password" 
              className="text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-all"
            >
              ลืมรหัสผ่านใช่หรือไม่?
            </Link>

            <p className="text-sm font-medium text-emerald-800">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="font-black text-emerald-600 underline decoration-2 underline-offset-4 hover:text-emerald-400 transition-colors">
                สมัครสมาชิก
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};