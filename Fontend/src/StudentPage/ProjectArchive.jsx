import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Table, Tag, Button, Input, Select, 
  Steps, Drawer, Typography, Badge, message, Spin, Empty
} from 'antd';
import { 
  SearchOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, AuditOutlined, UserOutlined,
  FilePdfOutlined, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import Studentbar from '../StudentPage/Studentbar';
import { getAllProjects } from '../services/projectService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- โครงสร้าง Milestone ---
const milestoneSteps = [
  "เสนอหัวข้อ", 
  "ออกแบบระบบ", 
  "พัฒนาชิ้นงาน 50%", 
  "พัฒนาชิ้นงาน 100%", 
  "ส่งเล่มสมบูรณ์"
];

const ProjectArchive = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');

  // --- 📡 ดึงข้อมูลจาก Backend ---
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects();
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      }
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("ไม่สามารถดึงข้อมูลโครงงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- 🔍 Logic การกรองข้อมูล ---
  const filteredProjects = projects.filter(p => {
    const searchLower = searchText.toLowerCase();
    const studentName = p.student_name || p.creator_name || ''; 
    
    const matchSearch = 
        (p.title_th && p.title_th.toLowerCase().includes(searchLower)) || 
        studentName.toLowerCase().includes(searchLower);
    
    let currentStatus = p.progress_status;
    if (filterStatus === 'ทั้งหมด') return matchSearch;
    return matchSearch && currentStatus === filterStatus;
  });

  // --- ฟังก์ชันจัดการ Drawer ---
  const handleOpenDrawer = (project) => {
    setSelectedProject(project);
    setFeedback(project.feedback || ''); 
    setIsDrawerOpen(true);
  };

  // --- 🔗 ฟังก์ชันจัดการ URL ---
  const getFileUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/api\/?$/, '')}/uploads/pdf/${path}`;
  };

  // --- 🎨 Helper Functions สำหรับ UI ---
  const getStatusBadge = (status) => {
    if (!status) return <Badge status="default" text={<span className="text-gray-500 font-medium text-base">ไม่ทราบสถานะ</span>} />;
    
    if (status.includes('รอตรวจ') || status.includes('รออนุมัติ')) {
        return <Badge status="warning" text={<span className="text-orange-600 font-bold text-base bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">{status}</span>} />;
    } else if (status.includes('ล่าช้า') || status === 'ไม่ผ่าน') {
        return <Badge status="error" text={<span className="text-red-600 font-bold text-base bg-red-50 px-3 py-1 rounded-full border border-red-100 shadow-sm">{status}</span>} />;
    } else if (status === 'สมบูรณ์' || status === 'ผ่าน') {
        return <Badge status="success" text={<span className="text-green-600 font-bold text-base bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm">{status}</span>} />;
    }
    return <Badge status="processing" text={<span className="text-blue-600 font-bold text-base bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">{status}</span>} />;
  };

  const getMilestoneIndex = (status) => {
      if(status === 'รออนุมัติหัวข้อ') return 0;
      if(status === 'กำลังทำ') return 2;
      if(status === 'รออนุมัติเล่ม') return 4;
      if(status === 'สมบูรณ์') return 5;
      return 1;
  };

  const formatDate = (dateString) => {
      if (!dateString) return 'ไม่มีข้อมูลเวลา';
      const date = new Date(dateString);
      return date.toLocaleString('th-TH', { 
          year: 'numeric', month: 'short', day: 'numeric', 
          hour: '2-digit', minute:'2-digit' 
      });
  };

  // --- 📊 Table Columns ---
  const columns = [
    {
      title: <span className="text-lg font-bold text-slate-700">ข้อมูลโครงงาน</span>,
      key: 'info',
      width: '35%',
      render: (_, r) => (
        <div className="py-3 pr-4">
          <Text strong className="block text-xl text-indigo-900 mb-3 hover:text-indigo-600 transition-colors line-clamp-2">{r.title_th}</Text>
          <div className="flex flex-col gap-2 text-base text-slate-600">
            <span className="flex items-center"><UserOutlined className="mr-2 text-indigo-400" />ผู้จัดทำ: <strong className="ml-1 text-slate-800">{r.student_name || r.creator_name || 'ไม่ระบุ'}</strong></span>
            {r.advisor && <span className="flex items-center"><AuditOutlined className="mr-2 text-indigo-400" />ที่ปรึกษา: <strong className="ml-1 text-slate-800">{r.advisor}</strong></span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
             <Tag color="blue" className="text-sm px-3 py-1 rounded-md border-blue-200">{r.category}</Tag>
             <Tag color="purple" className="text-sm px-3 py-1 rounded-md border-purple-200">{r.project_level}</Tag>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-lg font-bold text-slate-700">ความคืบหน้า (Milestone)</span>,
      key: 'milestone',
      width: '45%',
      render: (_, r) => {
        const stepIndex = getMilestoneIndex(r.progress_status);
        const isPending = r.progress_status?.includes('รอ');
        return (
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
                  {getStatusBadge(r.progress_status)}
                  <Text type="secondary" className="text-xs bg-white px-2 py-1 rounded-md border border-slate-100">อัปเดต: {formatDate(r.updated_at || r.created_at)}</Text>
              </div>
              <Steps 
                  current={stepIndex} 
                  size="small"
                  className="custom-steps mt-2"
                  status={isPending ? 'process' : (r.progress_status === 'ไม่ผ่าน' ? 'error' : 'finish')}
                  items={milestoneSteps.map((m) => ({
                    title: <span className="text-xs lg:text-sm font-semibold text-slate-600">{m}</span>,
                  }))}
              />
            </div>
        )
      }
    },
    {
      title: <span className="text-lg font-bold text-slate-700 text-center block">จัดการ</span>,
      key: 'action',
      width: '20%',
      align: 'center',
      render: (_, r) => {
        const isPending = r.progress_status?.includes('รอ');
        return (
            <Button 
                type={isPending ? 'primary' : 'default'}
                className={`h-12 px-6 text-base rounded-xl font-bold shadow-sm transition-all hover:-translate-y-1 ${
                  isPending 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 border-none shadow-orange-200 text-white' 
                  : 'border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                }`}
                onClick={() => handleOpenDrawer(r)}
            >
              ดูรายละเอียด
            </Button>
        )
      }
    }
  ];

  return (
    <Layout className="min-h-screen font-sans">
      <Studentbar />
      <Layout>
        <Content className="p-6 lg:p-10 bg-[#f4f7fe]">
          {/* ✅ ปรับความกว้างตรงนี้ ให้คอนเทนต์ใช้พื้นที่กว้างขึ้น ไม่เบียดกัน */}
          <div className="max-w-[95%] w-full 2xl:max-w-[1600px] mx-auto space-y-8">
            
            {/* --- Header Section --- */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-5 w-full lg:w-auto">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center">
                    <DashboardOutlined className="text-4xl text-white" />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>
                    ติดตามความคืบหน้า
                  </Title>
                  <Text className="text-base text-slate-500 mt-1 block">
                    ตรวจสอบ Milestone และจัดการไฟล์งานของคุณ
                  </Text>
                </div>
              </div>
              
              <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 custom-scrollbar">
                  <div className="bg-orange-50/80 px-8 py-3 rounded-2xl border border-orange-100 text-center min-w-[160px] flex-1 lg:flex-none transition-transform hover:scale-105">
                      <Text className="text-sm text-orange-600 font-bold block mb-1">รอดำเนินการ</Text>
                      <span className="text-3xl font-black text-orange-500">
                          {projects.filter(p => p.progress_status?.includes('รอ')).length}
                      </span>
                  </div>
                  <div className="bg-green-50/80 px-8 py-3 rounded-2xl border border-green-100 text-center min-w-[160px] flex-1 lg:flex-none transition-transform hover:scale-105">
                      <Text className="text-sm text-green-600 font-bold block mb-1">เสร็จสมบูรณ์</Text>
                      <span className="text-3xl font-black text-green-500">
                          {projects.filter(p => p.progress_status === 'สมบูรณ์').length}
                      </span>
                  </div>
              </div>
            </div>

            {/* --- Filter & Table Section --- */}
            <Card className="rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden" styles={{ body: { padding: '32px' } }}>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Input
                  size="large"
                  placeholder="ค้นหาชื่อโครงงาน หรือ ชื่อผู้จัดทำ..."
                  prefix={<SearchOutlined className="text-slate-400 text-xl mr-2" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 h-14 text-lg rounded-xl bg-slate-50 border-transparent hover:bg-white hover:border-indigo-300 focus:bg-white focus:border-indigo-500 transition-all px-5"
                  allowClear
                />
                <Select
                  size="large"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  className="w-full md:w-60 h-14 custom-select"
                  dropdownStyle={{ borderRadius: '12px' }}
                >
                  <Option value="ทั้งหมด">แสดงสถานะทั้งหมด</Option>
                  <Option value="รออนุมัติหัวข้อ">รออนุมัติหัวข้อ</Option>
                  <Option value="กำลังทำ">กำลังทำ</Option>
                  <Option value="รออนุมัติเล่ม">รออนุมัติเล่ม</Option>
                  <Option value="สมบูรณ์">สมบูรณ์</Option>
                </Select>
              </div>

              {loading ? (
                 <div className="text-center py-24">
                   <Spin size="large" />
                   <div className="mt-4 text-lg text-slate-500 font-medium">กำลังโหลดข้อมูลโครงงาน...</div>
                 </div>
              ) : filteredProjects.length === 0 ? (
                 <div className="bg-slate-50 rounded-2xl py-20 border border-dashed border-slate-200">
                   <Empty description={<span className="text-slate-400 text-lg">ไม่พบข้อมูลโครงงาน</span>} />
                 </div>
              ) : (
                <Table 
                    columns={columns} 
                    dataSource={filteredProjects}
                    rowKey="project_id"
                    pagination={{ pageSize: 10, className: 'px-4' }}
                    className="border border-slate-100 rounded-2xl overflow-hidden custom-table"
                    rowClassName="hover:bg-indigo-50/30 transition-colors"
                />
              )}
            </Card>

          </div>
        </Content>
      </Layout>

      {/* --- Drawer ตรวจงาน (รายละเอียด) --- */}
      {/* ✅ ปรับความกว้าง Drawer จาก 700 เป็น 800 ให้มีพื้นที่อ่านข้อเสนอแนะและรายละเอียดได้สบายๆ */}
      <Drawer
        title={
          <div className="text-xl font-black text-slate-800 flex items-center">
            <AuditOutlined className="mr-3 text-indigo-500 text-2xl" />
            รายละเอียดและการส่งงาน
          </div>
        }
        placement="right"
        width={800} 
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="custom-drawer"
        closeIcon={<div className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><SearchOutlined className="text-slate-600 hidden" />❌</div>}
      >
        {selectedProject && (
          <div className="space-y-8 animate-fade-in pb-10">
            
            {/* 📝 Project Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><AuditOutlined style={{ fontSize: '100px' }}/></div>
              <Title level={3} className="!mt-0 !mb-5 text-indigo-900 leading-snug relative z-10">{selectedProject.title_th}</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-base text-slate-700 relative z-10">
                 <div className="bg-white/60 p-3 rounded-xl"><b>ผู้จัดทำ:</b> <span className="ml-1">{selectedProject.student_name || selectedProject.creator_name || 'ไม่ระบุชื่อ'}</span></div>
                 <div className="bg-white/60 p-3 rounded-xl"><b>อัปเดตล่าสุด:</b> <span className="ml-1 text-indigo-600 font-semibold">{formatDate(selectedProject.updated_at || selectedProject.created_at)}</span></div>
                 <div className="bg-white/60 p-3 rounded-xl flex items-center"><b>สถานะ:</b> <div className="ml-2">{getStatusBadge(selectedProject.progress_status)}</div></div>
                 <div className="bg-white/60 p-3 rounded-xl"><b>หมวดหมู่:</b> <span className="ml-1">{selectedProject.category}</span></div>
              </div>
            </div>

            {/* 📂 Attached Files */}
            <div>
              <Title level={4} className="flex items-center text-slate-800 mb-4">
                <CheckCircleOutlined className="mr-2 text-green-500"/> ไฟล์งานและลิงก์แนบ
              </Title>
              <div className="bg-white p-2 rounded-2xl">
                 <div className="flex flex-col gap-4">
                    
                    {/* PDF File */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 text-red-600 font-bold text-lg mb-3 sm:mb-0">
                            <div className="bg-white p-3 rounded-xl shadow-sm"><FilePdfOutlined className="text-2xl" /></div> 
                            เอกสารโครงงาน (PDF)
                        </div>
                        {selectedProject.pdf_file_path ? (
                            <Button type="primary" danger shape="round" size="large" className="font-semibold px-6 shadow-sm shadow-red-200" href={getFileUrl(selectedProject.pdf_file_path)} target="_blank">เปิดดูไฟล์</Button>
                        ) : <span className="text-slate-400 bg-slate-50 px-4 py-2 rounded-lg text-sm">ไม่มีไฟล์แนบ</span>}
                    </div>

                    {/* Google Drive */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-blue-50/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 text-blue-600 font-bold text-lg mb-3 sm:mb-0">
                            <div className="bg-white p-3 rounded-xl shadow-sm"><GoogleOutlined className="text-2xl" /></div> 
                            โฟลเดอร์ Google Drive
                        </div>
                        {selectedProject.drive_url ? (
                            <Button type="primary" className="bg-blue-500 font-semibold px-6 shadow-sm shadow-blue-200" size="large" shape="round" href={selectedProject.drive_url} target="_blank">เปิดลิงก์</Button>
                        ) : <span className="text-slate-400 bg-slate-50 px-4 py-2 rounded-lg text-sm">ไม่มีลิงก์</span>}
                    </div>

                    {/* YouTube Video */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-orange-50/30 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 text-red-500 font-bold text-lg mb-3 sm:mb-0">
                            <div className="bg-white p-3 rounded-xl shadow-sm"><YoutubeOutlined className="text-2xl" /></div> 
                            วิดีโอพรีเซนต์ (YouTube)
                        </div>
                        {selectedProject.video_url ? (
                            <Button danger shape="round" size="large" className="font-semibold px-6" href={selectedProject.video_url} target="_blank">ดูวิดีโอ</Button>
                        ) : <span className="text-slate-400 bg-slate-50 px-4 py-2 rounded-lg text-sm">ไม่มีลิงก์</span>}
                    </div>

                    {/* GitHub */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 text-slate-700 font-bold text-lg mb-3 sm:mb-0">
                            <div className="bg-white p-3 rounded-xl shadow-sm"><GithubOutlined className="text-2xl" /></div> 
                            Source Code (GitHub)
                        </div>
                        {selectedProject.github_url ? (
                            <Button className="bg-slate-800 text-white font-semibold px-6 shadow-sm shadow-slate-300" size="large" shape="round" href={selectedProject.github_url} target="_blank">เปิด Repository</Button>
                        ) : <span className="text-slate-400 bg-slate-100 px-4 py-2 rounded-lg text-sm">ไม่มีลิงก์</span>}
                    </div>
                 </div>
              </div>
            </div>

            {/* 💬 Feedback Display */}
            <div>
              <Title level={4} className="flex items-center text-slate-800 mb-4">
                <ExclamationCircleOutlined className="mr-2 text-amber-500"/> ข้อเสนอแนะจากอาจารย์
              </Title>
              <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-100 shadow-inner min-h-[120px]">
                {feedback ? (
                  <p className="text-base text-slate-700 whitespace-pre-wrap m-0 leading-relaxed font-medium">{feedback}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70 mt-2">
                    <AuditOutlined className="text-3xl mb-2" />
                    <p className="italic m-0">ยังไม่มีข้อเสนอแนะในขณะนี้...</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </Drawer>

      {/* --- Global Styles เอา jsx="true" ออก --- */}
      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        /* Table Styles */
        .custom-table .ant-table-thead > tr > th { 
            background: #ffffff !important; 
            padding: 20px 16px !important;
            color: #475569 !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #f1f5f9 !important;
        }
        .custom-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f8fafc !important;
            padding: 20px 16px !important;
        }
        
        /* Steps Component */
        .custom-steps .ant-steps-item-title {
            line-height: 24px !important;
        }
        .custom-steps .ant-steps-item-tail::after {
            background-color: #e2e8f0 !important;
        }
        
        /* Select Input Form */
        .custom-select .ant-select-selector {
            border-radius: 12px !important;
            align-items: center;
            background-color: #f8fafc !important;
            border: 1px solid transparent !important;
            transition: all 0.3s ease;
        }
        .custom-select:hover .ant-select-selector {
            background-color: #ffffff !important;
            border-color: #c7d2fe !important;
        }
        
        /* Drawer Animations & UI */
        .custom-drawer .ant-drawer-header {
            padding: 24px 32px;
            border-bottom: 1px solid #f1f5f9;
        }
        .custom-drawer .ant-drawer-body {
            padding: 32px;
            background-color: #ffffff;
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
};

export default ProjectArchive;