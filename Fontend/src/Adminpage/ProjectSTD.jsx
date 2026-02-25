import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, 
  FileText, Trash2, Edit, 
  CheckCircle2, Clock, 
  FileCheck, AlertCircle, FileDown, LayoutGrid,
  Globe, X, Save, Youtube, Github, Plus,
  MoreVertical, Calendar, User, BookOpen,
  GraduationCap, AlertTriangle, Search
} from 'lucide-react';
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} from '../services/projectService';
import AdminSidebar from './AdminSidebar';

const ProjectSTD = () => {
  // --- State Management ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [searchText, setSearchText] = useState(''); 
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal States (Form)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
    loadProjects();
  }, []);

  // --- Helper Functions for Custom Alert ---
  const showAlert = (type, title, message) => {
    setAlertState({ isOpen: true, type, title, message, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirmAction) => {
    setAlertState({ isOpen: true, type: 'confirm', title, message, onConfirm: onConfirmAction });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // --- Logic Functions ---
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      const sanitizedData = data.map(p => ({
        ...p,
        is_featured: p.is_featured === true || p.is_featured === 1 || p.is_featured === '1'
      }));
      setProjects(sanitizedData);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...initialFormState });
    // รีเซ็ตช่องนักเรียนทั้ง 3 คน
    setStudents([{ name: '', id: '' }, { name: '', id: '' }, { name: '', id: '' }]);
    setIsModalOpen(true);
  };

  // ดึงข้อมูลเก่ามาแสดงตอนกด Edit ให้ครบ (รวมการแยกชื่อนักเรียน)
  const handleEditClick = (project) => {
    setEditingId(project.project_id);
    
    // แยกข้อมูลชื่อและรหัสที่คั่นด้วย comma กลับมาเป็น Array (สูงสุด 3 คน)
    const names = project.student_name ? project.student_name.split(',').map(n => n.trim()) : [];
    const ids = project.student_id ? project.student_id.split(',').map(i => i.trim()) : [];
    
    const parsedStudents = [0, 1, 2].map(index => ({
      name: names[index] || '',
      id: ids[index] || ''
    }));

    setStudents(parsedStudents);

    setFormData({
      title_th: project.title_th,
      title_en: project.title_en || '',
      student_id: project.student_id || '',
      student_name: project.student_name || '', 
      academic_year: project.academic_year || (new Date().getFullYear() + 543),
      project_level: project.project_level || 'ปวส.2',
      category: project.category || 'Web Application',
      advisor: project.advisor || '', 
      progress_status: project.progress_status || 'รออนุมัติหัวข้อ',
      is_featured: project.is_featured === true || project.is_featured === 1,
      video_url: project.video_url || '',
      github_url: project.github_url || '',
      drive_url: project.drive_url || '',
      feedback: project.feedback || '',
      pdf_file: null 
    });
    
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  // จัดการพิมพ์ข้อมูลในช่องนักเรียน
  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true); 
    
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
      let userId = 1; 
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userId = userObj.id || userObj.user_id;
      }

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
          data.append('student_name', combinedNames);
        } else if (key === 'student_id') {
          data.append('student_id', combinedIds);
        } else {
          data.append(key, formData[key] === null ? '' : formData[key]);
        }
      });
      
      data.append('created_by', userId);

      if (editingId) {
        await updateProject(editingId, data); 
        showAlert('success', 'บันทึกสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
      } else {
        await createProject(data);
        showAlert('success', 'สำเร็จ', 'เพิ่มโครงงานใหม่เรียบร้อยแล้ว');
      }
      
      setIsModalOpen(false);
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMsg = error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
      showAlert('error', 'เกิดข้อผิดพลาด', errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    showConfirm(
      'ยืนยันการลบข้อมูล?', 
      'คุณต้องการลบโครงงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้', 
      () => performDelete(id) 
    );
  };

  const performDelete = async (id) => {
    try {
      await deleteProject(id);
      showAlert('success', 'ลบข้อมูลสำเร็จ', 'โครงงานถูกลบออกจากระบบแล้ว');
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      showAlert('error', 'ผิดพลาด', 'ไม่สามารถลบข้อมูลได้');
    }
  };

  // --- Filtering Logic ---
  const filteredProjects = projects.filter(project => {
    const matchesTab = activeTab === 'ทั้งหมด' || project.progress_status === activeTab;
    const searchLower = searchText.toLowerCase();
    const matchesSearch = 
      (project.title_th && project.title_th.toLowerCase().includes(searchLower)) ||
      (project.title_en && project.title_en.toLowerCase().includes(searchLower)) ||
      (project.student_name && project.student_name.toLowerCase().includes(searchLower));

    return matchesTab && matchesSearch;
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'สมบูรณ์': return { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-5 h-5" />, bar: 'bg-emerald-500', progress: 100 };
      case 'รออนุมัติเล่ม': return { color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <FileCheck className="w-5 h-5" />, bar: 'bg-purple-500', progress: 80 };
      case 'กำลังทำ': return { color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <Clock className="w-5 h-5" />, bar: 'bg-blue-500', progress: 50 };
      case 'รออนุมัติหัวข้อ': return { color: 'text-orange-700 bg-orange-50 border-orange-200', icon: <AlertCircle className="w-5 h-5" />, bar: 'bg-orange-500', progress: 15 };
      default: return { color: 'text-slate-600 bg-slate-100 border-slate-200', icon: <AlertCircle className="w-5 h-5" />, bar: 'bg-slate-300', progress: 0 };
    }
  };

  // --- Render ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Bar / Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              <LayoutGrid className="text-indigo-600 w-9 h-9" />
              ระบบบริหารโครงงาน
            </h1>
            <p className="text-slate-500 text-base font-medium mt-1">จัดการข้อมูลโครงงานนักศึกษา (Admin)</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={openAddModal} 
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 font-bold text-base"
            >
              <Plus className="w-6 h-6" /> เพิ่มโครงงาน
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">
          <div className="max-w-[1920px] mx-auto space-y-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'โครงงานทั้งหมด', val: projects.length, icon: <FileText className="w-8 h-8" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { label: 'รออนุมัติ', val: projects.filter(p => p.progress_status === 'รออนุมัติหัวข้อ').length, icon: <AlertCircle className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
                { label: 'เสร็จสมบูรณ์', val: projects.filter(p => p.progress_status === 'สมบูรณ์').length, icon: <CheckCircle2 className="w-8 h-8" />, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Featured', val: projects.filter(p => p.is_featured).length, icon: <Star className="w-8 h-8 fill-current" />, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
              ].map((item, i) => (
                <div key={i} className={`bg-white p-6 rounded-2xl border ${item.border} shadow-sm flex items-center gap-5 hover:shadow-md transition-all group`}>
                  <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{item.label}</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Tabs & Search Bar Container */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Filter Tabs */}
              <div className="flex bg-slate-200/60 p-2 rounded-2xl w-fit overflow-x-auto custom-scrollbar">
                {['ทั้งหมด', 'รออนุมัติหัวข้อ', 'กำลังทำ', 'รออนุมัติเล่ม', 'สมบูรณ์'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-6 py-2.5 text-base font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search Input Box */}
              <div className="relative group w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อโครงงาน / ผู้จัดทำ..." 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-base focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                />
              </div>

            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
              {loading ? (
                <div className="p-32 text-center flex flex-col items-center justify-center gap-6 text-slate-400">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-lg tracking-widest uppercase">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center justify-center gap-6 text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-medium text-lg">
                    {searchText ? `ไม่พบข้อมูลที่ค้นหา "${searchText}"` : 'ไม่พบข้อมูลโครงงานในหมวดหมู่นี้'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-sm uppercase font-black tracking-wider">
                        <th className="px-8 py-6">รายละเอียด</th>
                        <th className="px-6 py-6 text-center">แหล่งข้อมูล</th>
                        <th className="px-6 py-6 text-center">สถานะโครงงาน</th>
                        <th className="px-6 py-6 text-center">การตอบรับ</th>
                        <th className="px-8 py-6 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProjects.map((p) => {
                        const config = getStatusConfig(p.progress_status);
                        
                        // แยกชื่อผู้จัดทำมาเป็น Array
                        const studentNames = p.student_name ? p.student_name.split(',').map(n => n.trim()) : [p.creator_name || 'ไม่ระบุชื่อ'];

                        return (
                          <tr key={p.project_id} className="hover:bg-slate-50/60 transition-colors group">
                            
                            {/* Project Details Column */}
                            <td className="px-8 py-6 max-w-xl">
                              <div className="flex items-start gap-5">
                                <div className={`mt-1 min-w-[50px] h-[50px] rounded-2xl flex items-center justify-center shadow-sm border ${
                                  p.is_featured ? 'bg-amber-100 border-amber-200 text-amber-500' : 'bg-white border-slate-100 text-slate-400'
                                }`}>
                                  {p.is_featured ? <Star className="w-6 h-6 fill-current" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {p.title_th}
                                  </h3>
                                  <p className="text-base text-slate-500 font-medium mb-2.5 line-clamp-1">{p.title_en || '—'}</p>
                                  
                                  <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                                      <Calendar className="w-3.5 h-3.5" /> ปี {p.academic_year || 2569}
                                    </span>
                                    
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-lg">
                                      <GraduationCap className="w-3.5 h-3.5" /> {p.project_level}
                                    </span>
                                    
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                                      <BookOpen className="w-3.5 h-3.5" /> {p.category}
                                    </span>
                                  </div>

                                  {/* Student & Advisor Info block */}
                                  <div className="flex flex-wrap items-center gap-3 mt-3 border-t border-slate-100 pt-3">
                                    {/* วนลูปรายชื่อนักศึกษาที่แยกแล้ว */}
                                    {studentNames.map((name, idx) => (
                                      <span key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                        <User className="w-3.5 h-3.5" /> {name}
                                      </span>
                                    ))}

                                    {/* อาจารย์ที่ปรึกษา */}
                                    {p.advisor && (
                                      <span className="flex items-center gap-1.5 text-xs font-bold text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-lg">
                                        <BookOpen className="w-3.5 h-3.5" /> อ.{p.advisor}
                                      </span>
                                    )}
                                  </div>

                                </div>
                              </div>
                            </td>

                            {/* Resources Column */}
                            <td className="px-6 py-6">
                              <div className="flex justify-center items-center gap-2.5">
                                {p.pdf_file_path ? (
                                  <a 
                                    href={p.pdf_file_path.startsWith('http') ? p.pdf_file_path : `http://localhost:5000/uploads/pdf/${p.pdf_file_path}`} 
                                    target="_blank" rel="noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="PDF Document"
                                  ><FileDown className="w-5 h-5" /></a>
                                ) : <span className="w-10 h-10 block"></span>}

                                {p.video_url && (
                                  <a href={p.video_url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                    <Youtube className="w-5 h-5" />
                                  </a>
                                )}
                                
                                {p.github_url && (
                                  <a href={p.github_url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white transition-all shadow-sm">
                                    <Github className="w-5 h-5" />
                                  </a>
                                )}

                                {p.drive_url && (
                                  <a href={p.drive_url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                    <Globe className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Status Column */}
                            <td className="px-6 py-6 text-center">
                                <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${config.color}`}>
                                  {config.icon} {p.progress_status}
                                </span>
                                <div className="mt-3 w-24 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${config.bar} rounded-full`} style={{ width: `${config.progress}%` }}></div>
                                </div>
                            </td>

                            {/* Feedback Column */}
                            <td className="px-6 py-6 text-center">
                              {p.feedback ? (
                                <div className="relative group/tip inline-block">
                                  <MessageSquare className="w-7 h-7 text-indigo-400 mx-auto cursor-help hover:text-indigo-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-slate-800 text-white text-sm rounded-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-2xl pointer-events-none text-left">
                                    <p className="font-bold text-xs uppercase text-slate-400 mb-2">Feedback:</p>
                                    "{p.feedback}"
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-200 text-2xl">•</span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEditClick(p)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteClick(p.project_id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- Main Project Form Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            {/* Modal Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                  {editingId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                {editingId ? 'แก้ไขข้อมูลโครงงาน' : 'สร้างโครงงานใหม่'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-10 py-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Title Section */}
                  <div className="md:col-span-2 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อโครงงาน (TH) <span className="text-red-500">*</span></label>
                      <input type="text" name="title_th" value={formData.title_th} required onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium" placeholder="เช่น ระบบบริหารจัดการ..." />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Project Title (EN)</label>
                      <input type="text" name="title_en" value={formData.title_en} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium" placeholder="e.g. Management System..." />
                    </div>
                  </div>

                  {/* Students Info (รองรับ 3 คน) */}
                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                      ข้อมูลผู้จัดทำโครงงาน (สูงสุด 3 คน) <span className="text-red-500">*</span>
                    </label>
                    
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            คนที่ {index + 1} : ชื่อ-นามสกุล {index === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input 
                            type="text" 
                            value={students[index].name} 
                            onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                            required={index === 0} // คนแรกบังคับกรอก
                            placeholder={`ระบุชื่อ-นามสกุล คนที่ ${index + 1}...`}
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-2">รหัสนักศึกษา</label>
                          <input 
                            type="text" 
                            value={students[index].id} 
                            onChange={(e) => handleStudentChange(index, 'id', e.target.value)}
                            placeholder={`ระบุรหัสนักศึกษา คนที่ ${index + 1}...`}
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* อาจารย์ที่ปรึกษา */}
                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">อาจารย์ที่ปรึกษา <span className="text-red-500">*</span></label>
                    <input type="text" name="advisor" value={formData.advisor} required onChange={handleInputChange} placeholder="ระบุชื่ออาจารย์..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-base" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">ปีการศึกษา</label>
                    <input type="number" name="academic_year" value={formData.academic_year} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-base" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">ระดับชั้น</label>
                    <div className="relative">
                      <select name="project_level" value={formData.project_level} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:bg-white focus:border-indigo-500 outline-none transition-all text-base cursor-pointer">
                        <option>ปวช.3</option><option>ปวส.2</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><MoreVertical className="w-5 h-5 rotate-90" /></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">หมวดหมู่</label>
                    <div className="relative">
                      <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:bg-white focus:border-indigo-500 outline-none transition-all text-base cursor-pointer">
                        <option>Web Application</option><option>Hardware / IoT</option><option>AI / Machine Learning</option><option>Mobile Application</option><option>Network / Security</option><option>Game / Multimedia</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><MoreVertical className="w-5 h-5 rotate-90" /></div>
                    </div>
                  </div>

                  {/* Status & Links */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">สถานะความคืบหน้า</label>
                    <div className="relative">
                      <select name="progress_status" value={formData.progress_status} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:bg-white focus:border-indigo-500 outline-none transition-all text-base font-bold text-slate-700 cursor-pointer">
                        <option value="รออนุมัติหัวข้อ">🟠 รออนุมัติหัวข้อ</option>
                        <option value="กำลังทำ">🔵 กำลังทำ</option>
                        <option value="รออนุมัติเล่ม">🟣 รออนุมัติเล่ม</option>
                        <option value="สมบูรณ์">🟢 สมบูรณ์</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><MoreVertical className="w-5 h-5 rotate-90" /></div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-red-500 uppercase tracking-wider mb-2">ไฟล์รูปเล่ม PDF {editingId && '(อัปโหลดใหม่เพื่อเปลี่ยน)'}</label>
                    <label className="flex items-center gap-4 px-5 py-3.5 bg-red-50 border border-red-100 border-dashed rounded-2xl cursor-pointer hover:bg-red-100 transition-colors group">
                      <FileDown className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                      <span className="text-sm text-red-600 font-medium truncate">
                        {formData.pdf_file ? formData.pdf_file.name : "เลือกไฟล์ PDF..."}
                      </span>
                      <input type="file" name="pdf_file" accept=".pdf" onChange={handleInputChange} className="hidden" />
                    </label>
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">External Links</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative group">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        <input type="url" name="video_url" value={formData.video_url} placeholder="YouTube URL" onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-red-400 outline-none transition-all" />
                      </div>
                      <div className="relative group">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                        <input type="url" name="github_url" value={formData.github_url} placeholder="GitHub URL" onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-slate-400 outline-none transition-all" />
                      </div>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="url" name="drive_url" value={formData.drive_url} placeholder="Drive/Web URL" onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Feedback จากอาจารย์</label>
                    <textarea name="feedback" value={formData.feedback} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-base min-h-[100px]" placeholder="ข้อเสนอแนะ..." />
                  </div>

                  {/* Featured Toggle */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl cursor-pointer hover:border-amber-300 transition-all select-none">
                      <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${formData.is_featured ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                        <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                      </div>
                      <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="hidden" />
                      <div className="flex items-center gap-2.5">
                        <Star className={`w-5 h-5 ${formData.is_featured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                        <span className={`text-base font-bold ${formData.is_featured ? 'text-amber-700' : 'text-slate-500'}`}>Featured Project (แสดงเป็นผลงานแนะนำ)</span>
                      </div>
                    </label>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
               <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all hover:bg-indigo-700"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )} 
                  {editingId ? 'บันทึกการแก้ไข' : 'สร้างโครงงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Alert / Confirm Modal --- */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 p-8 text-center">
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              alertState.type === 'confirm' ? 'bg-orange-100 text-orange-500' :
              alertState.type === 'error' ? 'bg-red-100 text-red-500' :
              'bg-emerald-100 text-emerald-500'
            }`}>
              {alertState.type === 'confirm' ? <AlertTriangle className="w-10 h-10" /> :
               alertState.type === 'error' ? <AlertCircle className="w-10 h-10" /> :
               <CheckCircle2 className="w-10 h-10" />}
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-3">{alertState.title}</h3>
            <p className="text-slate-500 text-base mb-8 px-2 leading-relaxed">{alertState.message}</p>

            <div className="flex gap-4 justify-center">
              {alertState.type === 'confirm' ? (
                <>
                  <button onClick={closeAlert} className="flex-1 px-6 py-3 text-base font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                    ยกเลิก
                  </button>
                  <button 
                    onClick={() => {
                      if(alertState.onConfirm) alertState.onConfirm();
                      closeAlert();
                    }} 
                    className="flex-1 px-6 py-3 text-base font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 rounded-xl transition-all"
                  >
                    ยืนยัน
                  </button>
                </>
              ) : (
                <button onClick={closeAlert} className="px-8 py-3 text-base font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-lg transition-all w-full">
                  ตกลง
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectSTD;