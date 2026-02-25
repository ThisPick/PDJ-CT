import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth'; 

export const Register = () => {
  const navigate = useNavigate();
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
    
    // --- [1. VALIDATION สำหรับนักเรียน] ---
    if (formData.role === 'student') {
      if (formData.studentId.length !== 11) {
        alert("❌ รหัสนักศึกษาต้องครบ 11 หลัก");
        return;
      }
      if (!formData.group.trim()) {
        alert("❌ กรุณากรอกกลุ่มเรียน");
        return;
      }
    }

    // --- [2. PREPARE PAYLOAD - ปรับคีย์ให้ตรงกับ Database] ---
    const payload = {
      email: formData.email.trim(),
      password: formData.password,
      full_name: formData.fullName.trim(),
      role: formData.role === 'admin' ? 'department_head' : formData.role,
      
      // ข้อมูลเฉพาะสำหรับนักศึกษา
      student_id: formData.role === 'student' ? formData.studentId : null,
      student_level: formData.role === 'student' ? formData.level : null,
      student_group: formData.role === 'student' ? formData.group : null,

      // ข้อมูลสำหรับครูและหัวหน้าแผนก
      ...(formData.role !== 'student' && {
        staff_key: formData.staffKey.trim()
      })
    };

    console.log("🚀 Payload ที่ส่งไปหลังบ้าน:", payload);

    // --- [3. API CALL] ---
    try {
      const result = await register(payload);
      // ตรวจสอบสถานะความสำเร็จจาก Backend
      if (result.status === "success" || result.success) {
        alert("✅ ลงทะเบียนสำเร็จ!");
        navigate('/login');
      }
    } catch (error) {
      const msg = error.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      alert("⚠️ " + msg);
      console.error("Register Error:", error.response?.data || error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-green-400 to-emerald-500 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl bg-white/95 p-8 md:p-10 shadow-2xl border border-white/40">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-emerald-900 tracking-tight">สมัครสมาชิก</h2>
            <p className="text-emerald-600 font-medium text-sm">แผนกเทคโนโลยีคอมพิวเตอร์</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            
            {/* เลือกบทบาท */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest ml-1">สมัครในฐานะ</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: 'student', label: 'นักศึกษา' },
                  { id: 'teacher', label: 'ครู' },
                  { id: 'admin', label: 'หัวหน้าแผนก' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFormData({...formData, role: r.id})}
                    className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all duration-200 ${
                      formData.role === r.id 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                      : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ชื่อ-นามสกุล */}
            <div className="md:col-span-2">
              <label className="text-sm font-bold ml-1 text-emerald-900">ชื่อ-นามสกุล</label>
              <input 
                name="fullName" type="text" onChange={handleChange} required 
                className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                placeholder="ชื่อ สกุล" 
              />
            </div>

            {/* ส่วนของนักศึกษา */}
            {formData.role === 'student' ? (
              <>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold ml-1 text-emerald-900">
                    รหัสนักศึกษา <span className="text-emerald-500 text-[10px] font-normal">(11 หลัก)</span>
                  </label>
                  <input 
                    name="studentId" 
                    type="text"
                    maxLength={11}
                    value={formData.studentId}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData({...formData, studentId: val});
                    }}
                    required 
                    className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none" 
                    placeholder="66302040001" 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold ml-1 text-emerald-900">ระดับชั้น</label>
                  <select 
                    name="level" 
                    value={formData.level}
                    onChange={handleChange} 
                    className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none"
                  >
                    <optgroup label="ระดับ ปวช.">
                      <option value="ปวช. 1">ปวช. 1</option>
                      <option value="ปวช. 2">ปวช. 2</option>
                      <option value="ปวช. 3">ปวช. 3</option>
                    </optgroup>
                    <optgroup label="ระดับ ปวส.">
                      <option value="ปวส. 1">ปวส. 1</option>
                      <option value="ปวส. 2">ปวส. 2</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold ml-1 text-emerald-900">กลุ่มเรียน</label>
                  <input 
                    name="group" 
                    type="text"
                    maxLength={2}
                    value={formData.group}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData({...formData, group: val});
                    }}
                    required 
                    className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none" 
                    placeholder="เช่น 1" 
                  />
                </div>
              </>
            ) : (
              /* ส่วนของครู/หัวหน้าแผนก */
              <div className="md:col-span-2">
                <label className="text-sm font-bold ml-1 text-rose-600">Staff Key (รหัสยืนยันจากแผนก)</label>
                <input 
                  name="staffKey" type="password" onChange={handleChange} required 
                  className="mt-1 w-full rounded-xl bg-rose-50 border-2 border-rose-100 px-4 py-2.5 focus:border-rose-500 outline-none" 
                  placeholder="กรอกรหัสสำหรับเจ้าหน้าที่" 
                />
              </div>
            )}

            {/* อีเมลและรหัสผ่าน */}
            <div className="md:col-span-2">
              <label className="text-sm font-bold ml-1 text-emerald-900">อีเมล</label>
              <input 
                name="email" type="email" onChange={handleChange} required 
                className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 focus:border-emerald-500 outline-none" 
                placeholder="example@mail.com" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-bold ml-1 text-emerald-900">รหัสผ่าน</label>
              <input 
                name="password" type="password" onChange={handleChange} required 
                className="mt-1 w-full rounded-xl bg-green-50/30 border-2 border-green-100 px-4 py-2.5 focus:border-emerald-500 outline-none" 
                placeholder="อย่างน้อย 8 ตัวอักษร" 
              />
            </div>

            <button 
              type="submit" 
              className="md:col-span-2 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-4 font-black text-white shadow-xl hover:shadow-emerald-200 transition-all active:scale-95"
            >
              สร้างบัญชี{formData.role === 'student' ? 'นักศึกษา' : 'บุคลากร'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm border-t border-emerald-50 pt-6">
              <span className="text-emerald-700">มีบัญชีผู้ใช้อยู่แล้ว? </span>
              <Link to="/login" className="text-emerald-600 font-black hover:text-emerald-400">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </div>
    </div>
  );
};