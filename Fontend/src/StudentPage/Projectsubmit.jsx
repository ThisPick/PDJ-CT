import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, 
  FileText, Trash2, Edit, Eye,
  CheckCircle2, Clock, 
  FileCheck, AlertCircle, FileDown, LayoutGrid,
  Globe, X, Save, Youtube, Github, Plus,
  MoreVertical, Calendar, User, BookOpen,
  GraduationCap, AlertTriangle, Search, Check
} from 'lucide-react';

import projectService from '../services/projectService'; 
import AdminSidebar from './Studentbar'; 

const Projectsubmit = () => {
  // --- State Management ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [searchText, setSearchText] = useState(''); 
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // --- Student List State (รองรับ 3 คน) ---
  const [students, setStudents] = useState([
    { name: '', id: '' },
    { name: '', id: '' },
    { name: '', id: '' }
  ]);

  // --- Custom Alert State ---
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null 
  });

  const initialFormState = {
    title_th: '', 
    title_en: '', 
    student_name: '', // จะถูกเขียนทับตอนส่ง
    student_id: '',   // จะถูกเขียนทับตอนส่ง
    academic_year: new Date().getFullYear() + 543, 
    project_level: 'ปวส.2', 
    category: 'Web Application',
    advisor: '',      
    progress_status: 'รออนุมัติหัวข้อ', 
    is_featured: false,
    video_url: '', 
    github_url: '', 
    drive_url: '',
    feedback: '', 
    pdf_file: null 
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- Effects ---
  useEffect(() => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setCurrentUserId(userObj.id || userObj.user_id);
    }
    loadProjects();
  }, []);

  // --- Logic Functions ---
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setIsReadOnly(false);
    setFormData({ ...initialFormState });
    // รีเซ็ตช่องนักเรียนทั้ง 3 คน
    setStudents([{ name: '', id: '' }, { name: '', id: '' }, { name: '', id: '' }]);
    setIsModalOpen(true);
  };

  const handleActionClick = (project, readOnly = false) => {
    setEditingId(project.project_id);
    setIsReadOnly(readOnly);
    setFormData({ ...project, pdf_file: null });

    // แยกข้อมูลชื่อและรหัสที่คั่นด้วย comma กลับมาเป็น Array (สูงสุด 3 คน)
    const names = project.student_name ? project.student_name.split(',').map(n => n.trim()) : [];
    const ids = project.student_id ? project.student_id.split(',').map(i => i.trim()) : [];
    
    const parsedStudents = [0, 1, 2].map(index => ({
      name: names[index] || '',
      id: ids[index] || ''
    }));

    setStudents(parsedStudents);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    if (isReadOnly) return;
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  // จัดการพิมพ์ข้อมูลในช่องนักเรียน
  const handleStudentChange = (index, field, value) => {
    if (isReadOnly) return;
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitLoading(true);

    try {
      const data = new FormData();

      // รวมชื่อและรหัสนักเรียนเป็น String เดียว (คั่นด้วย , )
      const combinedNames = students.map(s => s.name.trim()).filter(Boolean).join(', ');
      const combinedIds = students.map(s => s.id.trim()).filter(Boolean).join(', ');

      if (!combinedNames) {
        showAlert('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้จัดทำอย่างน้อย 1 คน');
        setSubmitLoading(false);
        return;
      }

      Object.keys(formData).forEach(key => {
        if (key === 'pdf_file') {
          if (formData[key]) data.append('pdf_file', formData[key]);
        } else if (key === 'student_name') {
          data.append('student_name', combinedNames); // ส่งชื่อที่รวมแล้ว
        } else if (key === 'student_id') {
          data.append('student_id', combinedIds);     // ส่งรหัสที่รวมแล้ว
        } else {
          data.append(key, formData[key] === null ? '' : formData[key]);
        }
      });
      
      data.append('created_by', currentUserId || 1);

      if (editingId) {
        await projectService.updateProject(editingId, data);
        showAlert('success', 'อัปเดตสำเร็จ', 'แก้ไขข้อมูลโครงงานเรียบร้อยแล้ว');
      } else {
        await projectService.createProject(data);
        showAlert('success', 'บันทึกสำเร็จ', 'เพิ่มโครงงานใหม่เข้าสู่ระบบแล้ว');
      }
      
      setIsModalOpen(false);
      loadProjects();
    } catch (error) {
      showAlert('error', 'เกิดข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSubmitLoading(false);
    }
  };

  const performDelete = async (id) => {
    try {
      await projectService.deleteProject(id);
      showAlert('success', 'ลบสำเร็จ', 'ข้อมูลโครงงานถูกลบออกแล้ว');
      loadProjects();
    } catch (error) {
      showAlert('error', 'ผิดพลาด', 'ไม่สามารถลบข้อมูลได้');
    }
  };

  const showAlert = (type, title, message) => setAlertState({ isOpen: true, type, title, message });
  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));
  const showConfirm = (title, message, onConfirm) => setAlertState({ isOpen: true, type: 'confirm', title, message, onConfirm });

  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'ทั้งหมด' || p.progress_status === activeTab;
    const searchLower = searchText.toLowerCase();
    return matchesTab && (
      p.title_th?.toLowerCase().includes(searchLower) || 
      p.student_name?.toLowerCase().includes(searchLower) ||
      p.student_id?.toLowerCase().includes(searchLower) ||
      p.advisor?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'สมบูรณ์': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'กำลังทำ': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'รออนุมัติหัวข้อ': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-orange-700 bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b px-10 py-8 flex items-center justify-between shrink-0 z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <LayoutGrid className="w-8 h-8" />
              </div>
              ระบบส่งโครงงานนักศึกษา
            </h1>
            <p className="text-slate-500 font-medium mt-2 ml-1">จัดการและติดตามสถานะการส่งโครงงานของคุณ</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all active:scale-95 group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /> 
            เพิ่มโครงงานของฉัน
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-100">
                {['ทั้งหมด', 'รออนุมัติหัวข้อ', 'กำลังทำ', 'สมบูรณ์'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาโครงงาน, รหัสนักศึกษา, อาจารย์..." 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest w-[35%]">ชื่อโครงงาน & หมวดหมู่</th>
                    <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest w-[25%]">ข้อมูลผู้จัดทำ & ที่ปรึกษา</th>
                    <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">ปีการศึกษา</th>
                    <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">ความคืบหน้า</th>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="px-10 py-20 text-center text-slate-400 font-bold">กำลังโหลดข้อมูล...</td></tr>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => {
                      const isOwner = Number(p.created_by) === Number(currentUserId);
                      
                      // แยกชื่อมาแสดงผลทีละคน
                      const namesList = p.student_name ? p.student_name.split(',').map(n => n.trim()) : [];
                      const idsList = p.student_id ? p.student_id.split(',').map(i => i.trim()) : [];

                      return (
                        <tr key={p.project_id} className="group hover:bg-indigo-50/30 transition-all">
                          {/* 1. โครงงานและหมวดหมู่ */}
                          <td className="px-8 py-6 align-top">
                            <div className="flex flex-col gap-2.5">
                              <span className="w-fit text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                {p.category || 'ไม่ระบุหมวดหมู่'}
                              </span>
                              <h3 className="font-black text-slate-800 text-lg group-hover:text-indigo-700 transition-colors line-clamp-2 leading-relaxed">
                                {p.title_th}
                              </h3>
                            </div>
                          </td>

                          {/* 2. ข้อมูลผู้จัดทำ & ครูที่ปรึกษา */}
                          <td className="px-6 py-5 align-top">
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                {namesList.map((name, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-400 shrink-0 mt-0.5">
                                      <User className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-700 text-sm leading-tight">{name}</div>
                                      <div className="text-[11px] font-bold text-slate-400 mt-0.5">รหัส: {idsList[idx] || '-'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 w-fit">
                                <div className="p-1.5 bg-orange-50 rounded-md text-orange-400 shrink-0">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-sm font-bold text-slate-600">
                                  <span className="text-slate-400 text-[11px] mr-1 uppercase">ที่ปรึกษา:</span> 
                                  {p.advisor || '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. ปีการศึกษา */}
                          <td className="px-6 py-6 text-center align-top">
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {p.academic_year}
                            </div>
                          </td>

                          {/* 4. สถานะ */}
                          <td className="px-6 py-6 text-center align-top">
                            <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black border-2 ${getStatusStyle(p.progress_status)} shadow-sm`}>
                              {p.progress_status === 'สมบูรณ์' ? <CheckCircle2 className="w-4 h-4" /> : 
                               p.progress_status === 'รออนุมัติหัวข้อ' ? <Clock className="w-4 h-4" /> : 
                               <Clock className="w-4 h-4" />}
                              {p.progress_status}
                            </span>
                          </td>

                          {/* 5. การจัดการ */}
                          <td className="px-8 py-6 text-right align-top">
                            <div className="flex justify-end gap-3">
                              {isOwner ? (
                                <>
                                  <button 
                                    onClick={() => handleActionClick(p, false)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                                    title="แก้ไขโครงงานของฉัน"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => showConfirm('ยืนยันการลบโครงงาน?', 'ข้อมูลที่ลบไปจะไม่สามารถกู้คืนได้', () => performDelete(p.project_id))}
                                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                    title="ลบโครงงาน"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => handleActionClick(p, true)}
                                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                  title="ดูรายละเอียดโครงงาน"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="w-16 h-16 mb-4 text-slate-300" />
                          <p className="text-lg font-bold text-slate-500">ไม่พบข้อมูลโครงงาน</p>
                          <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มโครงงานใหม่</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modern Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 border border-white/20">
            
            {/* Modal Header */}
            <div className="px-10 py-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md shrink-0">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                  {isReadOnly ? <Eye className="w-7 h-7" /> : (editingId ? <Edit className="w-7 h-7" /> : <Plus className="w-7 h-7" />)}
                </div>
                {isReadOnly ? 'รายละเอียดโครงงาน' : (editingId ? 'แก้ไขข้อมูลโครงงาน' : 'สร้างโครงงานใหม่')}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-slate-200 text-slate-400 rounded-full transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-10 py-8 space-y-8">
                {isReadOnly && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-600">
                    <Eye className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">คุณกำลังอยู่ในโหมดดูข้อมูลเท่านั้น (ไม่สามารถแก้ไขได้เนื่องจากคุณไม่ใช่เจ้าของโครงงาน)</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Title Section */}
                  <div className="md:col-span-2 space-y-5">
                    <div>
                      <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อโครงงาน (TH) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" name="title_th" value={formData.title_th} onChange={handleInputChange} 
                        disabled={isReadOnly} required placeholder="ระบุชื่อโครงงาน..."
                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-bold disabled:bg-slate-50 disabled:text-slate-600" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Project Title (EN)</label>
                      <input 
                        type="text" name="title_en" value={formData.title_en} onChange={handleInputChange} 
                        disabled={isReadOnly} placeholder="Project Name..."
                        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-bold disabled:bg-slate-50 disabled:text-slate-600" 
                      />
                    </div>
                  </div>

                  {/* Students Info (รองรับ 3 คน) */}
                  <div className="md:col-span-2 space-y-4 pt-4 border-t-2 border-slate-50">
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                      ข้อมูลผู้จัดทำโครงงาน (สูงสุด 3 คน) <span className="text-red-500">*</span>
                    </label>
                    
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            คนที่ {index + 1} : ชื่อ-นามสกุล {index === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input 
                            type="text" 
                            value={students[index].name} 
                            onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                            disabled={isReadOnly}
                            required={index === 0} // คนแรกบังคับกรอก
                            placeholder={`ระบุชื่อ-นามสกุล คนที่ ${index + 1}...`}
                            className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-2">รหัสนักศึกษา</label>
                          <input 
                            type="text" 
                            value={students[index].id} 
                            onChange={(e) => handleStudentChange(index, 'id', e.target.value)}
                            disabled={isReadOnly}
                            placeholder={`ระบุรหัสนักศึกษา คนที่ ${index + 1}...`}
                            className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advisor */}
                  <div className="mt-4">
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">อาจารย์ที่ปรึกษา <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="advisor" value={formData.advisor} onChange={handleInputChange} 
                      disabled={isReadOnly} required placeholder="ระบุชื่ออาจารย์ที่ปรึกษา..."
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold disabled:opacity-80 disabled:text-slate-600" 
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">หมวดหมู่</label>
                    <select 
                      name="category" value={formData.category} onChange={handleInputChange} 
                      disabled={isReadOnly} 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 font-bold disabled:opacity-80 disabled:text-slate-600"
                    >
                      <option>Web Application</option>
                      <option>Hardware / IoT</option>
                      <option>Mobile Application</option>
                      <option>AI / Machine Learning</option>
                      <option>Game Development</option>
                      <option>Network & Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">ปีการศึกษา</label>
                    <input 
                      type="number" name="academic_year" value={formData.academic_year} onChange={handleInputChange} 
                      disabled={isReadOnly} required placeholder="พ.ศ."
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold disabled:opacity-80 disabled:text-slate-600" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">สถานะความคืบหน้า</label>
                    <select 
                      name="progress_status" value={formData.progress_status} onChange={handleInputChange} 
                      disabled={isReadOnly} 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 font-black text-indigo-600 disabled:opacity-80"
                    >
                      <option>รออนุมัติหัวข้อ</option>
                    </select>
                  </div>

                  {/* File Upload - Hide on Read Only */}
                  {!isReadOnly && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-black text-indigo-500 uppercase tracking-widest mb-2">ไฟล์รูปเล่ม PDF {editingId && '(อัปโหลดใหม่เพื่อเปลี่ยนไฟล์เดิม)'}</label>
                      <label className="flex items-center gap-4 px-6 py-5 bg-indigo-50 border-2 border-indigo-100 border-dashed rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all group">
                        <FileDown className="w-7 h-7 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                          <span className="text-sm text-indigo-700 font-bold truncate">
                            {formData.pdf_file ? formData.pdf_file.name : "คลิกเพื่อเลือกไฟล์ PDF..."}
                          </span>
                          <span className="text-xs text-indigo-400 font-medium mt-0.5">รองรับไฟล์ .pdf ขนาดไม่เกิน 10MB</span>
                        </div>
                        <input type="file" name="pdf_file" accept=".pdf" onChange={handleInputChange} className="hidden" />
                      </label>
                    </div>
                  )}

                  {/* Links Section */}
                  <div className="md:col-span-2 space-y-4 pt-6 border-t-2 border-slate-50">
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">External Links (ตัวเลือกระบุ)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative group">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500" />
                        <input type="url" name="video_url" value={formData.video_url} placeholder="YouTube URL" onChange={handleInputChange} disabled={isReadOnly} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-red-400 outline-none transition-all disabled:opacity-70" />
                      </div>
                      <div className="relative group">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-800" />
                        <input type="url" name="github_url" value={formData.github_url} placeholder="GitHub URL" onChange={handleInputChange} disabled={isReadOnly} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-400 outline-none transition-all disabled:opacity-70" />
                      </div>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500" />
                        <input type="url" name="drive_url" value={formData.drive_url} placeholder="Drive/Web URL" onChange={handleInputChange} disabled={isReadOnly} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all disabled:opacity-70" />
                      </div>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                      <MessageSquare className="w-4 h-4" /> ข้อเสนอแนะจากอาจารย์ (Feedback)
                    </label>
                    <div className="p-6 bg-amber-50/50 border-2 border-amber-100/50 rounded-[2rem] text-slate-700 font-medium italic min-h-[100px] leading-relaxed">
                      {formData.feedback || "ยังไม่มีข้อเสนอแนะจากอาจารย์ในขณะนี้"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              {!isReadOnly && (
                <div className="px-10 py-6 border-t-2 border-slate-50 flex justify-end gap-4 bg-slate-50/30 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-8 py-4 font-black text-slate-400 hover:text-slate-600 transition-all rounded-2xl hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitLoading}
                    className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {submitLoading ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-6 h-6" />
                    )} 
                    {editingId ? 'บันทึกการแก้ไข' : 'ยืนยันการสร้างโครงงาน'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Alert Modal --- */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[3rem] max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-200">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              alertState.type === 'confirm' ? 'bg-orange-100 text-orange-500' :
              alertState.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'
            }`}>
              {alertState.type === 'error' ? <AlertTriangle className="w-12 h-12" /> : 
               alertState.type === 'confirm' ? <AlertTriangle className="w-12 h-12" /> : 
               <CheckCircle2 className="w-12 h-12" />}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{alertState.title}</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">{alertState.message}</p>
            <div className="flex gap-4">
              {alertState.type === 'confirm' ? (
                <>
                  <button onClick={closeAlert} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-colors">ยกเลิก</button>
                  <button onClick={() => { alertState.onConfirm(); closeAlert(); }} className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-200 transition-colors">ยืนยันลบ</button>
                </>
              ) : (
                <button onClick={closeAlert} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-colors shadow-xl">ตกลง</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projectsubmit;