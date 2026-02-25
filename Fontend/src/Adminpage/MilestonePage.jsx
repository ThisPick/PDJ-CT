import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Table, Tag, Button, Input, Select, 
  Steps, Drawer, Typography, Row, Col, 
  Space, Badge, Divider, message, Spin
} from 'antd';
import { 
  SearchOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, AuditOutlined, UserOutlined,
  FilePdfOutlined, GithubOutlined, YoutubeOutlined, GoogleOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import { getAllProjects } from '../services/projectService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// โครงสร้าง Milestone
const milestoneSteps = [
  "เสนอหัวข้อ", 
  "ออกแบบระบบ", 
  "พัฒนาชิ้นงาน 50%", 
  "พัฒนาชิ้นงาน 100%", 
  "ส่งเล่มสมบูรณ์"
];

const MilestonePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');

  // --- 📡 ดึงข้อมูลจริงจาก Backend ---
const fetchProjects = async () => {
    setLoading(true);
    try {
      // ✅ 1. เปลี่ยนมาใช้ getAllProjects() ตรงๆ
      const res = await getAllProjects();
      
      // ✅ 2. ดักจับข้อมูลให้ออกมาเป็น Array เสมอ ป้องกันตัวกรอง (filter) ด้านล่างพัง
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
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

  // --- 🔍 Logic การกรองข้อมูล (ใช้ของเดิมได้เลยครับ เขียนมาดีแล้ว) ---
  const filteredProjects = projects.filter(p => {
    const searchLower = searchText.toLowerCase();
    // ✅ ดึงชื่อจาก student_name เป็นหลัก ถ้าไม่มีถึงใช้ creator_name
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

  // --- 🎨 Helper Functions สำหรับ UI ---
  const getStatusBadge = (status) => {
    if (!status) return <Badge status="default" text={<span className="text-gray-600 font-bold text-lg">ไม่ทราบสถานะ</span>} />;
    
    if (status.includes('รอตรวจ') || status.includes('รออนุมัติ')) {
        return <Badge status="warning" text={<span className="text-orange-600 font-bold text-lg">{status}</span>} />;
    } else if (status.includes('ล่าช้า') || status === 'ไม่ผ่าน') {
        return <Badge status="error" text={<span className="text-red-600 font-bold text-lg">{status}</span>} />;
    } else if (status === 'สมบูรณ์' || status === 'ผ่าน') {
        return <Badge status="success" text={<span className="text-green-600 font-bold text-lg">{status}</span>} />;
    }
    return <Badge status="processing" text={<span className="text-blue-600 font-bold text-lg">{status}</span>} />;
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

  const columns = [
    {
      title: <span className="text-xl font-bold text-slate-700">ข้อมูลโครงงาน</span>,
      key: 'info',
      width: '35%',
      render: (_, r) => (
        <div className="py-2">
          <Text strong className="block text-2xl text-indigo-900 mb-2">{r.title_th}</Text>
          <div className="flex flex-col gap-1 text-lg text-slate-600">
            {/* ✅ แสดงชื่อผู้จัดทำแบบดึงจากช่องพิมพ์อิสระ */}
            <span><UserOutlined className="mr-2 text-indigo-500" />ผู้จัดทำโครงงาน: <b>{r.student_name || r.creator_name || 'ไม่ระบุชื่อ'}</b></span>
            {r.advisor && <span><AuditOutlined className="mr-2 text-indigo-500" />ที่ปรึกษา: <b>{r.advisor}</b></span>}
          </div>
          <div className="mt-3 space-x-2">
             <Tag color="geekblue" className="text-base px-3 py-1">{r.category}</Tag>
             <Tag color="purple" className="text-base px-3 py-1">{r.project_level}</Tag>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-xl font-bold text-slate-700">สถานะ Milestone</span>,
      key: 'milestone',
      width: '45%',
      render: (_, r) => {
        const stepIndex = getMilestoneIndex(r.progress_status);
        const isPending = r.progress_status?.includes('รอ');
        return (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="mb-4 flex justify-between items-center">
                {getStatusBadge(r.progress_status)}
                <Text type="secondary" className="text-sm">อัปเดต: {formatDate(r.updated_at || r.created_at)}</Text>
            </div>
            <Steps 
                current={stepIndex} 
                size="small"
                className="custom-steps"
                status={isPending ? 'process' : (r.progress_status === 'ไม่ผ่าน' ? 'error' : 'finish')}
                items={milestoneSteps.map((m) => ({
                title: <span className="text-sm font-bold text-slate-600">{m}</span>,
                }))}
            />
            </div>
        )
      }
    },
    {
      title: <span className="text-xl font-bold text-slate-700 text-center block">จัดการ</span>,
      key: 'action',
      width: '20%',
      align: 'center',
      render: (_, r) => {
        const isPending = r.progress_status?.includes('รอ');
        return (
            <Button 
                type={isPending ? 'primary' : 'default'}
                size="large"
                className={`h-14 px-6 text-lg rounded-xl font-bold shadow-md transition-all hover:scale-105 ${isPending ? 'bg-orange-500 hover:bg-orange-400 border-none' : 'border-slate-300 text-slate-600'}`}
                onClick={() => handleOpenDrawer(r)}
            >
            ดูรายละเอียด
            </Button>
        )
      }
    }
  ];

  return (
    <Layout className="min-h-screen">
      <AdminSidebar />
      <Layout>
        <Content className="p-10 bg-[#f8fafc]">
          <div className="max-w-[95%] mx-auto">
            
            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-200">
                    <AuditOutlined className="text-5xl text-white" />
                </div>
                <div>
                  <Title level={1} style={{ margin: 0, color: '#1e293b', fontSize: '2.5rem' }}>
                    กระดานติดตามความคืบหน้า
                  </Title>
                  <Text className="text-xl text-slate-500 mt-2 block">
                    ติดตาม Milestone และดูรายละเอียดไฟล์งานของนักศึกษา
                  </Text>
                </div>
              </div>
              
              <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2">
                  <div className="bg-orange-50 px-8 py-4 rounded-2xl border-2 border-orange-100 text-center min-w-[180px]">
                      <Text className="text-xl text-orange-600 font-bold block mb-1">รอตรวจ</Text>
                      <span className="text-4xl font-black text-orange-600">
                          {projects.filter(p => p.progress_status?.includes('รอ')).length}
                      </span>
                  </div>
                  <div className="bg-green-50 px-8 py-4 rounded-2xl border-2 border-green-100 text-center min-w-[180px]">
                      <Text className="text-xl text-green-600 font-bold block mb-1">สมบูรณ์</Text>
                      <span className="text-4xl font-black text-green-600">
                          {projects.filter(p => p.progress_status === 'สมบูรณ์').length}
                      </span>
                  </div>
              </div>
            </div>

            {/* Filter & Table */}
            <Card className="rounded-3xl shadow-xl border border-slate-200 overflow-hidden" bodyStyle={{ padding: '32px' }}>
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <Input
                  size="large"
                  placeholder="ค้นหาชื่อโครงงาน หรือ ชื่อผู้จัดทำ..."
                  prefix={<SearchOutlined className="text-slate-400 text-2xl mr-3" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 h-16 text-xl rounded-2xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500 shadow-sm px-6"
                  allowClear
                />
                <Select
                  size="large"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  className="w-full md:w-64 h-16 text-xl"
                  dropdownStyle={{ fontSize: '1.25rem' }}
                >
                  <Option value="ทั้งหมด">แสดงทั้งหมด</Option>
                  <Option value="รออนุมัติหัวข้อ">รออนุมัติหัวข้อ</Option>
                  <Option value="กำลังทำ">กำลังทำ</Option>
                  <Option value="รออนุมัติเล่ม">รออนุมัติเล่ม</Option>
                  <Option value="สมบูรณ์">สมบูรณ์</Option>
                </Select>
              </div>

              {loading ? (
                 <div className="text-center py-20"><Spin size="large" /><div className="mt-4 text-xl text-gray-500">กำลังโหลดข้อมูล...</div></div>
              ) : (
                <Table 
                    columns={columns} 
                    dataSource={filteredProjects}
                    rowKey="project_id"
                    pagination={{ pageSize: 10, className: 'text-lg' }}
                    className="border border-slate-100 rounded-2xl overflow-hidden"
                    rowClassName="hover:bg-slate-50 transition-colors"
                />
              )}
            </Card>

          </div>
        </Content>
      </Layout>

      {/* --- Drawer ตรวจงาน (ขนาดใหญ่พิเศษ) --- */}
      <Drawer
        title={
          <div className="text-2xl font-black text-indigo-800">
            <AuditOutlined className="mr-3 text-indigo-600" />
            รายละเอียดงาน Milestone
          </div>
        }
        placement="right"
        width={850}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="milestone-drawer"
      >
        {selectedProject && (
          <div className="space-y-8">
            {/* Project Info Summary */}
            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
              <Title level={2} className="!mt-0 !mb-4 text-indigo-900">{selectedProject.title_th}</Title>
              <div className="grid grid-cols-2 gap-4 text-lg text-slate-700">
                 {/* ✅ แสดงชื่อผู้จัดทำแบบดึงจากช่องพิมพ์อิสระ */}
                 <div><b>ผู้จัดทำ:</b> {selectedProject.student_name || selectedProject.creator_name || 'ไม่ระบุชื่อ'}</div>
                 <div><b>อัปเดตล่าสุด:</b> <span className="text-indigo-600 font-bold">{formatDate(selectedProject.updated_at || selectedProject.created_at)}</span></div>
                 <div><b>สถานะปัจจุบัน:</b> {getStatusBadge(selectedProject.progress_status)}</div>
                 <div><b>หมวดหมู่:</b> {selectedProject.category}</div>
              </div>
            </div>

            {/* ไฟล์แนบที่ส่งมา */}
            <div>
              <Title level={4} className="flex items-center text-slate-800"><CheckCircleOutlined className="mr-2 text-green-500"/> ข้อมูลและไฟล์ที่ส่งมา</Title>
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200">
                 
                 <Text strong className="text-lg text-slate-500 block mb-3">ตรวจสอบไฟล์ / ลิงก์แนบ:</Text>
                 <div className="flex flex-col gap-3">
                    {/* PDF File */}
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3 text-red-600 font-bold text-lg">
                            <FilePdfOutlined className="text-2xl" /> ไฟล์เอกสาร PDF
                        </div>
                        {selectedProject.pdf_file_path ? (
                            <Button type="primary" danger shape="round" href={`http://localhost:5000/uploads/pdf/${selectedProject.pdf_file_path}`} target="_blank">เปิดดูไฟล์</Button>
                        ) : <span className="text-slate-400 italic">ไม่มีไฟล์แนบ</span>}
                    </div>

                    {/* Google Drive */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3 text-blue-600 font-bold text-lg">
                            <GoogleOutlined className="text-2xl" /> โฟลเดอร์ Google Drive
                        </div>
                        {selectedProject.drive_url ? (
                            <Button type="primary" className="bg-blue-500" shape="round" href={selectedProject.drive_url} target="_blank">เปิดลิงก์</Button>
                        ) : <span className="text-slate-400 italic">ไม่มีลิงก์</span>}
                    </div>

                    {/* YouTube Video */}
                    <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3 text-red-500 font-bold text-lg">
                            <YoutubeOutlined className="text-2xl" /> วิดีโอพรีเซนต์ (YouTube)
                        </div>
                        {selectedProject.video_url ? (
                            <Button danger shape="round" href={selectedProject.video_url} target="_blank">ดูวิดีโอ</Button>
                        ) : <span className="text-slate-400 italic">ไม่มีลิงก์</span>}
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 text-slate-700 font-bold text-lg">
                            <GithubOutlined className="text-2xl" /> Source Code (GitHub)
                        </div>
                        {selectedProject.github_url ? (
                            <Button className="bg-slate-800 text-white" shape="round" href={selectedProject.github_url} target="_blank">เปิด Repository</Button>
                        ) : <span className="text-slate-400 italic">ไม่มีลิงก์</span>}
                    </div>
                 </div>

              </div>
            </div>

            {/* Feedback Display */}
            <div>
              <Title level={4} className="flex items-center text-slate-800"><ExclamationCircleOutlined className="mr-2 text-orange-500"/> ข้อเสนอแนะ (Feedback)</Title>
              <TextArea 
                rows={6} 
                placeholder="ไม่มีข้อเสนอแนะ..."
                value={feedback}
                readOnly
                className="text-xl p-5 rounded-2xl border-slate-300 bg-slate-50 cursor-not-allowed shadow-inner"
              />
            </div>
            
          </div>
        )}
      </Drawer>

      <style jsx="true">{`
        .ant-table-thead > tr > th { 
            background: #f8fafc !important; 
            padding-top: 24px !important;
            padding-bottom: 24px !important;
        }
        .custom-steps .ant-steps-item-title {
            font-size: 16px !important;
            line-height: 24px !important;
            font-weight: bold;
        }
        .custom-steps .ant-steps-item-tail::after {
            background-color: #e2e8f0 !important;
        }
        .ant-select-single.ant-select-lg .ant-select-selector {
            border-radius: 16px;
            padding: 0 24px;
            display: flex;
            align-items: center;
        }
        .milestone-drawer .ant-drawer-header {
            padding: 24px 32px;
            border-bottom: 2px solid #f1f5f9;
        }
        .milestone-drawer .ant-drawer-body {
            padding: 32px;
        }
      `}</style>
    </Layout>
  );
};

export default MilestonePage;