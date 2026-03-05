import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth'; 
import { UserAddOutlined, IdcardOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', 
    studentId: '', 
    level: 'ปวช. 1', 
    group: '', 
    email: '', 
    password: '', 
    role: 'student', 
    staffKey: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- [1. VALIDATION เบื้องต้น] ---
    if (formData.password.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร',
        confirmButtonColor: '#10b981',
      });
      setLoading(false);
      return;
    }

    if (formData.role === 'student') {
      if (formData.studentId.length !== 11) {
        Swal.fire({
          icon: 'warning',
          title: 'รหัสนักศึกษาไม่ถูกต้อง',
          text: 'รหัสนักศึกษาต้องครบ 11 หลัก',
          confirmButtonColor: '#10b981',
        });
        setLoading(false);
        return;
      }
      if (!formData.group.trim()) {
        Swal.fire({ icon: 'warning', title: 'กรุณากรอกกลุ่มเรียน' });
        setLoading(false);
        return;
      }
    }

    // --- [2. PREPARE PAYLOAD] ---
    const payload = {
      email: formData.email.trim(),
      password: formData.password,
      full_name: formData.fullName.trim(),
      role: formData.role === 'admin' ? 'department_head' : formData.role,
      student_id: formData.role === 'student' ? formData.studentId : null,
      student_level: formData.role === 'student' ? formData.level : null,
      student_group: formData.role === 'student' ? formData.group : null,
      ...(formData.role !== 'student' && {
        staff_key: formData.staffKey.trim()
      })
    };

    // --- [3. API CALL] ---
    try {
      const result = await register(payload);
      if (result.status === "success" || result.success) {
        Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสำเร็จ!',
          text: 'คุณสามารถเข้าสู่ระบบได้ทันที',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        }).then(() => {
          navigate('/login');
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      Swal.fire({
        icon: 'error',
        title: 'ล้มเหลว',
        text: msg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-green-400 to-emerald-600 px-4 py-10 font-sans">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl bg-white/95 p-8 md:p-10 shadow-2xl backdrop-blur-md border border-white/20">
          
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <UserAddOutlined className="text-3xl text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-emerald-900 tracking-tight">สมัครสมาชิก</h2>
            <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest mt-1">Computer Technology Department</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* บทบาท */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">สิทธิ์การใช้งาน</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'นักศึกษา' },
                  { id: 'teacher', label: 'ครู' },
                  { id: 'admin', label: 'หัวหน้าแผนก' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFormData({...formData, role: r.id})}
                    className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all duration-300 ${
                      formData.role === r.id 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' 
                      : 'border-emerald-50 text-emerald-600 hover:bg-emerald-50 bg-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* ชื่อ-นามสกุล */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase"><IdcardOutlined className="mr-1"/> ชื่อ-นามสกุล</label>
                <input 
                  name="fullName" type="text" onChange={handleChange} required 
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 focus:outline-none transition-all" 
                  placeholder="สมชาย สายคอม" 
                />
              </div>

              {formData.role === 'student' ? (
                <>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase">รหัสนักศึกษา (11 หลัก)</label>
                    <input 
                      name="studentId" type="text" maxLength={11}
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value.replace(/\D/g, "")})}
                      required 
                      className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 focus:outline-none transition-all" 
                      placeholder="6630204XXXX" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase">ระดับชั้น</label>
                    <select 
                      name="level" value={formData.level} onChange={handleChange} 
                      className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 outline-none"
                    >
                      <option value="ปวช. 1">ปวช. 1</option>
                      <option value="ปวช. 2">ปวช. 2</option>
                      <option value="ปวช. 3">ปวช. 3</option>
                      <option value="ปวส. 1">ปวส. 1</option>
                      <option value="ปวส. 2">ปวส. 2</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase">กลุ่มเรียน</label>
                    <input 
                      name="group" type="text" maxLength={2} value={formData.group}
                      onChange={(e) => setFormData({...formData, group: e.target.value.replace(/\D/g, "")})}
                      required className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 outline-none" 
                      placeholder="เช่น 1" 
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-black text-rose-600 ml-1 uppercase">Staff Key (ยืนยันสิทธิ์เจ้าหน้าที่)</label>
                  <input 
                    name="staffKey" type="password" onChange={handleChange} required 
                    className="w-full rounded-2xl border-2 border-rose-50 bg-rose-50/30 px-4 py-3 text-rose-900 focus:border-rose-500 outline-none transition-all" 
                    placeholder="Security Key" 
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase"><MailOutlined className="mr-1"/> อีเมล</label>
                <input 
                  name="email" type="email" onChange={handleChange} required 
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 outline-none" 
                  placeholder="email@college.ac.th" 
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-emerald-800 ml-1 uppercase"><LockOutlined className="mr-1"/> รหัสผ่าน</label>
                <input 
                  name="password" type="password" onChange={handleChange} required 
                  className="w-full rounded-2xl border-2 border-emerald-50 bg-white px-4 py-3 text-emerald-900 focus:border-emerald-500 outline-none" 
                  placeholder="รหัสผ่าน 8 ตัวขึ้นไป" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-4 font-black text-white shadow-xl transition-all active:scale-95 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-emerald-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  กำลังบันทึกข้อมูล...
                </span>
              ) : `สร้างบัญชี${formData.role === 'student' ? 'นักศึกษา' : 'บุคลากร'}`}
            </button>
          </form>

          <div className="mt-8 text-center text-sm border-t border-emerald-50 pt-6">
              <span className="text-emerald-700 font-medium">เป็นสมาชิกอยู่แล้วใช่ไหม? </span>
              <Link to="/login" className="text-emerald-600 font-black hover:text-emerald-400 transition-colors underline decoration-2 underline-offset-4">
                เข้าสู่ระบบ
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
};