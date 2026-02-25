import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Tag, Typography, message, 
  Space, Button, Modal, Input, Empty,
  Row, Col, Statistic, Radio, Avatar, Tooltip
} from 'antd';
import { 
  FileTextOutlined, TeamOutlined, 
  ClockCircleOutlined, 
  FilePdfOutlined, SafetyCertificateFilled,
  ExclamationCircleOutlined,
  YoutubeOutlined,
  GithubOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  GoogleOutlined,
  BankOutlined,
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';

// ✅ Imports ตัวเชื่อมต่อ
import AdminSidebar from './AdminSidebar'; 
import approveService from '../services/approveService'; 

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ApproveProject = () => {
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]); 
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [searchText, setSearchText] = useState(''); // ✅ State สำหรับค้นหา

  // Modal State for Action (Approve/Reject)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [actionType, setActionType] = useState(''); // 'change_status' | 'view'
  const [feedback, setFeedback] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // ✅ ดึงข้อมูล User จาก LocalStorage
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  // --- 🟢 Load Real Data from DB ---
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await approveService.getAllPendingProjects();
      setProjects(data);
    } catch (error) {
      message.error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- Filter Logic ---
  const getFilteredProjects = () => {
    let filtered = projects;

    // 1. Filter by Tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(p => {
        const status = String(p.progress_status);
        return status === 'รออนุมัติหัวข้อ' || 
               status === 'รออนุมัติเล่ม' ||
               status === 'รอแก้ไข';
      });
    } else {
      filtered = filtered.filter(p => {
        const status = String(p.progress_status);
        return status === 'กำลังทำ' || 
               status === 'สมบูรณ์' ||
               status === 'ไม่ผ่าน';
      });
    }

    // 2. Filter by Search Text ✅ ค้นหาจากชื่อเจ้าของโครงงานได้เลย
    if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        filtered = filtered.filter(p => 
            (p.title_th && p.title_th.toLowerCase().includes(lowerSearch)) ||
            (p.title_en && p.title_en.toLowerCase().includes(lowerSearch)) ||
            (p.student_name && p.student_name.toLowerCase().includes(lowerSearch)) ||
            (p.creator_name && p.creator_name.toLowerCase().includes(lowerSearch)) || 
            (p.advisor && p.advisor.toLowerCase().includes(lowerSearch))
        );
    }

    return filtered;
  };

  // --- Handlers ---
  const openActionModal = (project, type) => {
    setCurrentProject(project);
    setActionType(type);
    setFeedback(project.feedback || ''); 
    setSelectedStatus(project.progress_status); 
    setIsModalOpen(true);
  };

  const handleSubmitAction = async () => {
    if (actionType === 'view') {
      setIsModalOpen(false);
      return;
    }

    if (!currentProject) return;
    if (!selectedStatus) {
        message.warning("กรุณาเลือกสถานะที่ต้องการเปลี่ยน");
        return;
    }

    setLoading(true);
    try {
        const data = {
            progress_status: selectedStatus,
            feedback: feedback,
            approved_by: user.id
        };

        await approveService.updateProjectStatus(currentProject.project_id, data);
        
        message.success(`อัปเดตสถานะเป็น "${selectedStatus}" เรียบร้อยแล้ว`);
        setIsModalOpen(false);
        setFeedback('');
        fetchProjects(); 
        
    } catch (error) {
        console.error("❌ Error Updating Status:", error);
        const backendError = error.response?.data?.detail || error.response?.data?.message || error.message;
        message.error("เกิดข้อผิดพลาด: " + backendError);
    } finally {
        setLoading(false);
    }
  };

  // --- UI Helpers ---
  const getStatusTag = (status) => {
    const statusStr = String(status);
    const tagStyle = { padding: '6px 14px', fontSize: '16px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' };
    
    switch(statusStr) {
        case 'รออนุมัติหัวข้อ': return <Tag color="orange" style={tagStyle} icon={<ClockCircleOutlined />}>{statusStr}</Tag>;
        case 'รออนุมัติเล่ม': return <Tag color="warning" style={tagStyle} icon={<FileTextOutlined />}>{statusStr}</Tag>;
        case 'รอแก้ไข': return <Tag color="magenta" style={tagStyle} icon={<ExclamationCircleOutlined />}>{statusStr}</Tag>;
        case 'กำลังทำ': return <Tag color="blue" style={tagStyle} icon={<SyncOutlined spin />}>{statusStr}</Tag>;
        case 'สมบูรณ์': return <Tag color="success" style={tagStyle} icon={<SafetyCertificateFilled />}>{statusStr}</Tag>;
        case 'ไม่ผ่าน': return <Tag color="error" style={tagStyle} icon={<CloseCircleOutlined />}>{statusStr}</Tag>;
        default: return <Tag style={tagStyle}>{statusStr}</Tag>;
    }
  };

  const filteredList = getFilteredProjects();

  return (
    <Layout className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <Content className="p-4 md:p-8 ml-0 transition-all">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-100">
            <div>
              <Title level={2} className="!mb-2 flex items-center gap-3 text-slate-800" style={{ fontSize: '32px' }}>
                <SafetyCertificateFilled className="text-indigo-600 text-4xl" /> ระบบจัดการและอนุมัติโครงงาน
              </Title>
              <Text type="secondary" style={{ fontSize: '18px' }}>ตรวจสอบความถูกต้องและอนุมัติขั้นตอนต่างๆ ของนักศึกษา</Text>
            </div>
            
            <div className="flex gap-6">
              <Statistic 
                title={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#8c8c8c' }}>รอตรวจ</span>}
                value={projects.filter(p => ['รออนุมัติหัวข้อ', 'รออนุมัติเล่ม', 'รอแก้ไข'].includes(p.progress_status)).length} 
                valueStyle={{ color: '#faad14', fontWeight: 'bold', fontSize: '36px' }} 
                className="bg-orange-50 px-6 py-4 rounded-2xl min-w-[140px] text-center border-2 border-orange-100 shadow-sm"
              />
              <Statistic 
                title={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#8c8c8c' }}>เสร็จสิ้น</span>}
                value={projects.filter(p => ['กำลังทำ', 'สมบูรณ์', 'ไม่ผ่าน'].includes(p.progress_status)).length} 
                valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '36px' }} 
                className="bg-green-50 px-6 py-4 rounded-2xl min-w-[140px] text-center border-2 border-green-100 shadow-sm"
              />
            </div>
          </div>

          {/* Controls Section: Tabs & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
              {/* Tabs */}
              <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-md border border-slate-100 w-full md:w-auto overflow-x-auto">
                  <Button 
                    type={activeTab === 'pending' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('pending')}
                    size="large"
                    style={{ height: '56px', fontSize: '18px', borderRadius: '12px' }}
                    className={`${activeTab === 'pending' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    งานที่ต้องดำเนินการ
                  </Button>
                  <Button 
                    type={activeTab === 'history' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('history')}
                    size="large"
                    style={{ height: '56px', fontSize: '18px', borderRadius: '12px' }}
                    className={`${activeTab === 'history' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    สถานะล่าสุด / ประวัติ
                  </Button>
              </div>

              {/* Search */}
              <div className="flex gap-3 w-full md:w-auto">
                   <Input 
                        placeholder="ค้นหาโครงงาน / ผู้จัดทำ..." 
                        prefix={<SearchOutlined className="text-slate-400 text-xl" />} 
                        size="large"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ height: '56px', fontSize: '18px', borderRadius: '12px' }}
                        className="shadow-sm border-slate-200 hover:border-indigo-400 focus:border-indigo-500 flex-1 md:w-[350px]"
                        allowClear
                   />
              </div>
          </div>

          {/* Project List */}
          {loading && projects.length === 0 ? (
              <div className="text-center py-24"><div className="animate-spin text-6xl text-indigo-500">⟳</div></div>
          ) : filteredList.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {filteredList.map(project => (
                <Card 
                  key={project.project_id}
                  className="shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 rounded-2xl overflow-hidden"
                  styles={{ body: { padding: '32px' } }}
                >
                  <Row gutter={[32, 24]} align="top">
                    {/* Left Column: Project Info */}
                    <Col xs={24} md={16}>
                      <div className="flex flex-col gap-5">
                        
                        {/* Title & Status */}
                        <div className="flex items-start justify-between md:justify-start md:gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Text strong style={{ fontSize: '28px', lineHeight: '1.3', color: '#1e293b' }} className="block">
                                    {project.title_th}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '20px', fontStyle: 'italic', color: '#64748b' }} className="block mt-1">
                                    {project.title_en || '-'}
                                </Text>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {getStatusTag(project.progress_status)}
                            </div>
                        </div>
                        
                        {/* Meta Data Box */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-2 flex flex-wrap gap-x-8 gap-y-4 text-base text-slate-700">
                           <span className="flex items-center gap-2" style={{ fontSize: '18px' }}>
                              <SafetyCertificateFilled className="text-indigo-500 text-xl"/> 
                              หมวดหมู่: <span className="font-bold text-slate-900">{project.category}</span>
                           </span>
                           <span className="flex items-center gap-2" style={{ fontSize: '18px' }}>
                              <ClockCircleOutlined className="text-indigo-500 text-xl"/> 
                              ปีการศึกษา: <span className="font-bold text-slate-900">{project.academic_year}</span>
                           </span>
                           {project.project_level && (
                             <span className="flex items-center gap-2" style={{ fontSize: '18px' }}>
                                <BankOutlined className="text-indigo-500 text-xl"/> 
                                ระดับ: <Tag color="cyan" style={{ fontSize: '16px', padding: '4px 10px', fontWeight: 'bold' }}>{project.project_level}</Tag>
                             </span>
                           )}
                           
                           <div className="w-full h-[1px] bg-slate-200 my-1 hidden sm:block"></div>

                           {/* Advisor Info */}
                           {project.advisor && (
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200">
                                    <UserOutlined style={{ fontSize: '16px' }} /> อาจารย์ที่ปรึกษา
                                 </div>
                                 <Text style={{ fontSize: '18px', color: '#334155', fontWeight: '500' }}>{project.advisor}</Text>
                              </div>
                            )}
                        </div>

                        {/* ✅ Student Info Enhanced */}
                        <div className="flex flex-wrap items-center justify-between gap-6 mt-2">
                           <div className="flex items-center gap-4 bg-white p-3 pr-6 rounded-full border-2 border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-default group">
                              <Avatar 
                                size={56} 
                                icon={<UserOutlined />} 
                                style={{ backgroundColor: '#6366f1', fontSize: '24px' }}
                              />
                              <div>
                                  {/* ✅ ให้ดึงจาก student_name (ที่พิมพ์ไว้) มาโชว์ก่อนเลย ถ้าไม่มีค่อยโชว์ creator_name */}
                                  <Text strong style={{ fontSize: '20px', color: '#334155' }} className="block group-hover:text-indigo-600 transition-colors">
                                    {project.student_name || project.creator_name || 'ไม่ระบุชื่อผู้จัดทำ'}
                                  </Text>
                                  <div className="flex items-center gap-2 mt-1">
                                      <TeamOutlined className="text-slate-400" />
                                      <Text type="secondary" style={{ fontSize: '16px' }}>
                                        ผู้จัดทำโครงงาน
                                      </Text>
                                  </div>
                              </div>
                           </div>

                           <Space size="middle">
                              {project.pdf_file_path && (
                                <Tooltip title="ดาวน์โหลดรูปเล่ม">
                                    <Button size="large" type="primary" danger ghost icon={<FilePdfOutlined style={{ fontSize: '20px' }} />} href={approveService.getPdfUrl(project.pdf_file_path)} target="_blank" style={{ height: '50px', width: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                </Tooltip>
                              )}
                              {project.drive_url && (
                                <Tooltip title="เปิด Google Drive">
                                    <Button size="large" icon={<GoogleOutlined style={{ fontSize: '20px' }} />} className="text-green-700 border-green-300 hover:border-green-600 hover:bg-green-50" onClick={() => window.open(project.drive_url, '_blank')} style={{ height: '50px', width: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                </Tooltip>
                              )}
                              {project.video_url && (
                                <Tooltip title="ดูวิดีโอพรีเซนต์">
                                    <Button size="large" icon={<YoutubeOutlined style={{ fontSize: '20px' }} />} className="text-red-700 border-red-300 hover:border-red-600 hover:bg-red-50" onClick={() => window.open(project.video_url, '_blank')} style={{ height: '50px', width: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                </Tooltip>
                              )}
                              {project.github_url && (
                                <Tooltip title="เปิด GitHub">
                                    <Button size="large" icon={<GithubOutlined style={{ fontSize: '20px' }} />} className="text-slate-800 border-slate-400 hover:border-black hover:bg-slate-100" onClick={() => window.open(project.github_url, '_blank')} style={{ height: '50px', width: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                </Tooltip>
                              )}
                           </Space>
                        </div>
                      </div>
                    </Col>
                    
                    {/* Right Column: Main Actions */}
                    <Col xs={24} md={8} className="flex flex-col justify-center gap-5 md:border-l md:border-slate-100 md:pl-8">
                        <Button 
                          block 
                          type="primary" 
                          size="large"
                          icon={<SettingOutlined style={{ fontSize: '24px' }} />} 
                          className="bg-indigo-600 hover:bg-indigo-500 border-none shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-1"
                          style={{ height: '72px', fontSize: '22px', borderRadius: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}
                          onClick={() => openActionModal(project, 'change_status')}
                        >
                          จัดการ / อนุมัติ
                        </Button>
                        <Button 
                          block
                          size="large"
                          variant="outlined"
                          className="text-slate-600 border-slate-300 hover:text-indigo-700 hover:border-indigo-700 hover:bg-indigo-50"
                          style={{ height: '60px', fontSize: '20px', borderRadius: '14px', fontWeight: '500' }}
                          onClick={() => openActionModal(project, 'view')}
                          icon={<FileTextOutlined style={{ fontSize: '20px' }} />}
                        >
                          ดู Feedback เดิม
                        </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          ) : (
            <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={<span style={{ fontSize: '20px', color: '#94a3b8' }}>ไม่พบรายการที่ค้นหา</span>}
                className="bg-white p-20 rounded-3xl shadow-md border border-slate-100" 
            />
          )}

        </div>
      </Content>

      {/* ✅ Action Modal (Approve/Reject) */}
      <Modal
        title={
          <div className="flex items-center gap-4 text-2xl py-4 border-b border-slate-100">
             <div className="bg-indigo-50 p-3 rounded-xl"><SettingOutlined className="text-indigo-600 text-3xl"/></div>
             <span className="font-bold text-slate-800" style={{ fontSize: '24px' }}>
               {actionType === 'view' ? 'รายละเอียด Feedback' : 'ปรับปรุงสถานะโครงงาน'}
             </span>
          </div>
        }
        open={isModalOpen}
        onOk={handleSubmitAction}
        onCancel={() => setIsModalOpen(false)}
        okText={<span style={{ fontSize: '18px' }}>{actionType === 'view' ? "ปิดหน้าต่าง" : "ยืนยันการเปลี่ยนแปลง"}</span>}
        cancelText={<span style={{ fontSize: '18px' }}>ยกเลิก</span>}
        confirmLoading={loading}
        width={700}
        centered
        styles={{ body: { padding: '30px 36px' } }}
        okButtonProps={{ size: 'large', style: { height: '50px', borderRadius: '10px' } }}
        cancelButtonProps={{ size: 'large', style: { height: '50px', borderRadius: '10px' } }}
      >
        <div className="flex flex-col gap-8 mt-4">
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-200">
            <Text strong className="block mb-2 text-slate-800" style={{ fontSize: '22px' }}>{currentProject?.title_th}</Text>
            <div className="flex items-center gap-4 mt-3">
                <Tag className="m-0 bg-white border-slate-300 text-slate-600" style={{ fontSize: '16px', padding: '6px 12px' }}>สถานะปัจจุบัน</Tag> 
                <span className="text-slate-400 text-xl">➜</span>
                {getStatusTag(currentProject?.progress_status)}
            </div>
          </div>

          {actionType !== 'view' && (
            <div>
              <Text strong className="mb-4 block text-slate-800" style={{ fontSize: '20px' }}>เลือกสถานะใหม่:</Text>
              <Radio.Group 
                className="grid grid-cols-2 gap-4 w-full" 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                buttonStyle="solid"
              >
                {['รออนุมัติหัวข้อ', 'รออนุมัติเล่ม', 'รอแก้ไข', 'กำลังทำ', 'สมบูรณ์', 'ไม่ผ่าน'].map(status => (
                    <Radio.Button 
                        key={status} 
                        value={status} 
                        className="text-center py-3 rounded-xl border-slate-300 hover:text-indigo-700 hover:border-indigo-700 peer-checked:bg-indigo-600 peer-checked:text-white"
                        style={{ height: 'auto', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {status}
                    </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          )}

          <div>
            <Text strong className="mb-3 block text-slate-800" style={{ fontSize: '20px' }}>
                {actionType === 'view' ? 'ข้อความ Feedback ที่เคยระบุไว้:' : 'ระบุข้อเสนอแนะ / สาเหตุ (Feedback):'}
            </Text>
            <TextArea 
              rows={5} 
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="เช่น เอกสารบทที่ 1 ยังไม่ครบถ้วน, อนุมัติหัวข้อเรียบร้อยแล้ว..."
              readOnly={actionType === 'view'}
              style={{ fontSize: '18px', lineHeight: '1.6', padding: '16px', borderRadius: '12px' }}
              className="border-slate-300 focus:border-indigo-500 hover:border-indigo-400"
            />
          </div>
        </div>
      </Modal>

    </Layout>
  );
};

export default ApproveProject;