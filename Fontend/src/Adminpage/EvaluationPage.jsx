import React, { useState, useEffect } from 'react';
import api from '../services/evaluationService'; 
import { 
  Layout, Card, Table, Tag, Button, Space, Typography, 
  Modal, Slider, Input, Row, Col, Divider, message, Statistic,
  Descriptions, Badge, Avatar
} from 'antd';
import { 
  SolutionOutlined, EditOutlined, SearchOutlined, UserOutlined,
  StarFilled, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  FilePdfOutlined, CheckCircleOutlined, BookOutlined,
  TrophyFilled
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const EvaluationPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  
  // State สำหรับช่องค้นหา
  const [searchText, setSearchText] = useState('');

  // รองรับการให้คะแนนแยกส่วน
  const [grading, setGrading] = useState({
    completeness: 0, 
    presentation: 0, 
    feedback: ''
  });

  // คำนวณคะแนนรวมอัตโนมัติ
  const totalScore = grading.completeness + grading.presentation;

  // 📡 ฟังก์ชันดึงข้อมูลโครงงานทั้งหมด
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.getAll(); 
      const result = Array.isArray(response) ? response : response.data;
      
      if (result) {
        setProjects(result);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      message.error("ดึงข้อมูลจากหลังบ้านไม่ได้! ตรวจสอบ CORS หรือ Network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ฟังก์ชันเปิด Modal และดึงรายละเอียดเต็มของโปรเจกต์
  const handleOpenEvaluate = async (project) => {
    try {
      const res = await api.getById(project.project_id); 
      const data = res.data || res;
      setCurrentProject(data);
      
      // ตั้งค่าคะแนนเดิมกลับเข้า Slider ถ้ามีคะแนนอยู่แล้ว
      setGrading({
        completeness: data.completeness_score ? Number(data.completeness_score) : 0, 
        presentation: data.presentation_score ? Number(data.presentation_score) : 0, 
        feedback: data.comment || ''
      });
      setIsModalOpen(true);
    } catch (error) {
      message.error("โหลดข้อมูลโปรเจกต์ล้มเหลว");
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      const payload = {
        project_id: currentProject.project_id,
        evaluator_id: 15, // สมมติไอดีอาจารย์ (หรือดึงจาก LocalStorage ตามระบบคุณ)
        completeness_score: grading.completeness,
        presentation_score: grading.presentation,
        total_score: totalScore,
        comment: grading.feedback
      };
      
      await api.updateScore(payload);
      
      message.success("บันทึกคะแนนเรียบร้อย!");
      setIsModalOpen(false);
      fetchProjects(); // โหลดข้อมูลใหม่มาอัปเดตตาราง
    } catch (error) {
      message.error("บันทึกล้มเหลว");
    }
  };

  // 🔍 ฟังก์ชันกรองข้อมูลโครงงานตามคำค้นหา (Search Logic)
  const filteredProjects = projects.filter(project => {
    const searchLower = searchText.toLowerCase();
    const matchTH = project.title_th?.toLowerCase().includes(searchLower);
    const matchEN = project.title_en?.toLowerCase().includes(searchLower);
    // ✅ ดึงจาก student_name ก่อน แล้วตามด้วย creator_name
    const matchAuthor = (project.student_name || project.creator_name || project.name || project.fullname || '')?.toLowerCase().includes(searchLower);
    const matchAdvisor = (project.advisor || '')?.toLowerCase().includes(searchLower);
    return matchTH || matchEN || matchAuthor || matchAdvisor;
  });

  // ตารางแสดงผล
  const columns = [
    {
      title: <span className="text-lg font-bold">ข้อมูลโครงงาน</span>,
      key: 'project_info',
      render: (_, record) => {
        // ✅ ใช้ชื่อ student_name ก่อนเป็นอันดับแรก
        const authorName = record.student_name || record.creator_name || record.name || record.fullname || 'ไม่ระบุชื่อผู้จัดทำ';
        
        return (
          <div className="py-2">
            <Text strong className="block text-xl text-indigo-900 mb-1">{record.title_th}</Text>
            <Text type="secondary" className="text-base block mb-2">{record.title_en || '-'}</Text>
            
            <div className="flex flex-col gap-1">
                <Text className="text-lg flex items-center text-gray-700">
                <UserOutlined className="mr-2" /> 
                <span className="font-semibold mr-2">ผู้จัดทำ:</span>
                {authorName}
                </Text>

                {record.advisor && (
                <Text className="text-lg flex items-center text-indigo-700">
                    <SolutionOutlined className="mr-2" />
                    <span className="font-semibold mr-2">ที่ปรึกษา:</span> {record.advisor}
                </Text>
                )}
            </div>

            <div className="mt-3 space-x-2">
                <Tag color="blue" className="px-3 py-1 text-base rounded-md">{record.category}</Tag>
                {record.project_level && <Tag className="px-3 py-1 text-base rounded-md font-bold">{record.project_level}</Tag>}
            </div>
          </div>
        );
      }
    },
    {
      title: <span className="text-lg font-bold text-center block">สถานะการประเมิน</span>,
      key: 'status',
      align: 'center',
      width: '25%',
      render: (_, record) => {
        const hasScore = record.total_score !== null && record.total_score !== undefined;
        return (
          <div className="flex flex-col items-center gap-2">
             {hasScore ? (
                 <>
                   <Badge status="success" text={<span className="text-green-600 font-bold text-lg">ประเมินแล้ว</span>} />
                   <div className="text-4xl font-black text-slate-700 mt-2">{record.total_score} <span className="text-xl text-slate-400">/ 100</span></div>
                 </>
             ) : (
                 <Badge status="error" text={<span className="text-red-500 font-bold text-lg">รอการประเมิน</span>} />
             )}
          </div>
        );
      }
    },
    {
      title: <span className="text-lg font-bold text-center block">จัดการ</span>,
      key: 'action',
      align: 'center',
      width: '20%',
      render: (_, record) => {
        const hasScore = record.total_score !== null && record.total_score !== undefined;
        return (
          <Button 
            type={hasScore ? "default" : "primary"}
            size="large" 
            icon={<EditOutlined />}
            onClick={() => handleOpenEvaluate(record)}
            className={`h-12 px-6 text-lg rounded-xl font-bold shadow-sm transition-transform hover:scale-105 ${hasScore ? 'border-indigo-400 text-indigo-600' : 'bg-indigo-600 border-none'}`}
          >
            {hasScore ? 'แก้ไขคะแนน' : 'เริ่มประเมิน'}
          </Button>
        );
      }
    }
  ];

  return (
    <Layout className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <Content className="p-8">
        <div className="max-w-[95%] mx-auto">
          
          {/* Header Dashboard */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
             <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-200">
                    <SolutionOutlined className="text-5xl text-white" />
                </div>
                <div>
                  <Title level={1} style={{ margin: 0, color: '#1e293b', fontSize: '2.5rem' }}>ระบบประเมินคะแนนโครงงาน</Title>
                  <Text className="text-xl text-slate-500 mt-2 block">พิจารณาให้คะแนนและบันทึกข้อเสนอแนะสำหรับนักศึกษา</Text>
                </div>
             </div>
             
             <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2">
                 <Statistic 
                    title={<span className="text-lg font-bold text-slate-400">ประเมินแล้ว</span>} 
                    value={projects.filter(p => p.total_score !== null).length} 
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }} 
                    className="bg-green-50 px-6 py-3 rounded-2xl border border-green-100 text-center min-w-[160px]" 
                 />
                 <Statistic 
                    title={<span className="text-lg font-bold text-slate-400">รอประเมิน</span>} 
                    value={projects.filter(p => p.total_score === null).length} 
                    prefix={<StarFilled />}
                    valueStyle={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }} 
                    className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 text-center min-w-[160px]" 
                 />
             </div>
          </div>

          {/* Table & Search Section */}
          <Card className="rounded-3xl shadow-xl border border-slate-200 overflow-hidden" bodyStyle={{ padding: '32px' }}>
             
             <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <TrophyFilled className="text-3xl text-yellow-500" />
                    <Text strong className="text-3xl text-slate-700">รายชื่อโครงงาน</Text>
                </div>

                {/* 🔍 ช่องค้นหาขนาดใหญ่ */}
                <Input 
                    size="large" 
                    placeholder="ค้นหาชื่อโครงงาน / ผู้จัดทำ..." 
                    prefix={<SearchOutlined className="text-slate-400 text-2xl mr-2" />} 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="md:w-[400px] h-14 text-lg rounded-2xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500 shadow-sm"
                    allowClear
                />
             </div>

            <Table 
              columns={columns} 
              dataSource={filteredProjects} 
              rowKey="project_id" 
              loading={loading}
              pagination={{ pageSize: 10, className: 'text-lg' }}
              className="border border-slate-100 rounded-2xl overflow-hidden"
              rowClassName="hover:bg-indigo-50/30 transition-colors"
            />
          </Card>
        </div>
      </Content>

      {/* 🟢 Modal ให้คะแนน (ปรับให้สวยงามและใหญ่ขึ้น) */}
      <Modal
        title={
            <div className="text-2xl font-black text-indigo-800 flex items-center border-b pb-4 mt-2">
                <EditOutlined className="mr-3 text-indigo-600 text-3xl" /> บันทึกผลการประเมินโครงงาน
            </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        className="evaluation-modal"
      >
        {currentProject && (
            <div className="mt-6">
                {/* ข้อมูลโปรเจกต์ */}
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 relative overflow-hidden mb-8">
                   <div className="flex flex-col gap-2 relative z-10">
                       <Text strong className="text-2xl text-indigo-900">{currentProject.title_th}</Text>
                       <Text className="text-lg text-indigo-600 font-medium">{currentProject.title_en || '-'}</Text>
                       <div className="flex items-center gap-6 mt-3 text-slate-700 flex-wrap">
                           {/* ✅ แสดง student_name ตรงนี้ด้วย */}
                           <Text className="text-lg"><UserOutlined className="mr-2 text-indigo-500" /> <span className="font-bold">ผู้จัดทำ:</span> {currentProject.student_name || currentProject.creator_name || 'ไม่ระบุชื่อ'}</Text>
                           {currentProject.advisor && <Text className="text-lg"><SolutionOutlined className="mr-2 text-indigo-500" /> <span className="font-bold">ที่ปรึกษา:</span> {currentProject.advisor}</Text>}
                       </div>
                   </div>
                </div>

                {/* ไฟล์แนบให้กรรมการดู */}
                <div className="mb-8">
                    <Text strong className="block mb-3 text-xl text-slate-700">เอกสารและสื่อนำเสนอประกอบการพิจารณา</Text>
                    <Space size="middle" wrap>
                        {currentProject.pdf_file_path && (
                            <Button icon={<FilePdfOutlined style={{ fontSize: '22px' }}/>} size="large" type="primary" danger className="h-14 px-6 text-lg rounded-xl shadow-md" href={`http://localhost:5000/uploads/pdf/${currentProject.pdf_file_path}`} target="_blank">
                                เล่มโครงงาน PDF
                            </Button>
                        )}
                        {currentProject.video_url && (
                            <Button icon={<YoutubeOutlined style={{ fontSize: '22px' }} />} size="large" className="text-red-600 border-red-300 hover:text-red-700 hover:border-red-600 bg-red-50 h-14 px-6 text-lg rounded-xl" href={currentProject.video_url} target="_blank">
                                Video Presentation
                            </Button>
                        )}
                        {currentProject.drive_url && (
                            <Button icon={<GoogleOutlined style={{ fontSize: '22px' }} />} size="large" className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-600 bg-blue-50 h-14 px-6 text-lg rounded-xl" href={currentProject.drive_url} target="_blank">
                                Google Drive
                            </Button>
                        )}
                        {currentProject.github_url && (
                            <Button icon={<GithubOutlined style={{ fontSize: '22px' }} />} size="large" className="text-slate-700 border-slate-300 hover:text-black hover:border-slate-800 bg-slate-50 h-14 px-6 text-lg rounded-xl" href={currentProject.github_url} target="_blank">
                                Source Code
                            </Button>
                        )}
                    </Space>
                </div>

                <Divider className="border-slate-200" />

                {/* ส่วนกรอกคะแนน */}
                <div className="mb-8">
                    <Text strong className="block mb-4 text-xl text-slate-700">เกณฑ์การให้คะแนน</Text>
                    <Row gutter={32}>
                        <Col span={12}>
                            <Card className="bg-slate-50 border-slate-200 rounded-2xl shadow-sm text-center">
                                <Text className="text-lg text-slate-600 font-bold block mb-4">ความสมบูรณ์ของชิ้นงาน (50 คะแนน)</Text>
                                <Slider 
                                    min={0} max={50} 
                                    value={grading.completeness} 
                                    onChange={v => setGrading({...grading, completeness: v})} 
                                    tooltip={{ open: true, color: '#4f46e5' }}
                                    className="custom-slider"
                                />
                                <Input 
                                    type="number" 
                                    min={0} max={50} 
                                    value={grading.completeness} 
                                    onChange={e => setGrading({...grading, completeness: Number(e.target.value)})}
                                    className="mt-4 text-center text-xl font-bold rounded-xl h-12 text-indigo-600"
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card className="bg-slate-50 border-slate-200 rounded-2xl shadow-sm text-center">
                                <Text className="text-lg text-slate-600 font-bold block mb-4">การนำเสนอและจัดทำรูปเล่ม (50 คะแนน)</Text>
                                <Slider 
                                    min={0} max={50} 
                                    value={grading.presentation} 
                                    onChange={v => setGrading({...grading, presentation: v})} 
                                    tooltip={{ open: true, color: '#0ea5e9' }}
                                    className="custom-slider-blue"
                                />
                                <Input 
                                    type="number" 
                                    min={0} max={50} 
                                    value={grading.presentation} 
                                    onChange={e => setGrading({...grading, presentation: Number(e.target.value)})}
                                    className="mt-4 text-center text-xl font-bold rounded-xl h-12 text-sky-600"
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* คะแนนรวม */}
                <div className={`p-8 rounded-3xl text-center mb-8 border-2 shadow-inner transition-colors ${totalScore >= 80 ? 'bg-green-50 border-green-200' : (totalScore >= 50 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200')}`}>
                    <Text className="text-xl text-slate-500 font-bold uppercase tracking-widest block mb-2">คะแนนรวมสุทธิ</Text>
                    <div className={`text-7xl font-black ${totalScore >= 80 ? 'text-green-600' : (totalScore >= 50 ? 'text-orange-500' : 'text-red-500')}`}>
                        {totalScore} <span className="text-3xl font-bold text-slate-400">/ 100</span>
                    </div>
                </div>

                {/* ข้อเสนอแนะ */}
                <div className="bg-white p-2">
                    <Text strong className="block mb-3 text-xl text-slate-700">ข้อเสนอแนะเพิ่มเติม (Feedback)</Text>
                    <TextArea 
                        rows={5} 
                        placeholder="กรอกข้อเสนอแนะ..."
                        value={grading.feedback} 
                        onChange={e => setGrading({...grading, feedback: e.target.value})} 
                        className="text-lg rounded-2xl border-slate-300 focus:border-indigo-500 p-4 shadow-inner"
                    />
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                    <Button size="large" onClick={() => setIsModalOpen(false)} className="h-14 px-8 text-lg font-bold rounded-xl text-slate-500 hover:bg-slate-100 border-none">ยกเลิก</Button>
                    <Button size="large" type="primary" onClick={handleSaveEvaluation} className="h-14 px-10 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-200">
                        บันทึกผลการประเมิน
                    </Button>
                </div>
            </div>
        )}
      </Modal>

      <style jsx="true">{`
        .ant-table-thead > tr > th { 
            background: #f8fafc !important; 
            padding-top: 20px !important;
            padding-bottom: 20px !important;
            border-bottom: 2px solid #e2e8f0 !important;
        }
        .evaluation-modal .ant-modal-content {
            border-radius: 32px;
            padding: 32px;
        }
        .custom-slider .ant-slider-track { background-color: #4f46e5 !important; height: 6px; }
        .custom-slider .ant-slider-handle::after { box-shadow: 0 0 0 2px #4f46e5 !important; width: 16px; height: 16px; margin-top: -5px;}
        
        .custom-slider-blue .ant-slider-track { background-color: #0ea5e9 !important; height: 6px; }
        .custom-slider-blue .ant-slider-handle::after { box-shadow: 0 0 0 2px #0ea5e9 !important; width: 16px; height: 16px; margin-top: -5px;}
      `}</style>
    </Layout>
  );
};

export default EvaluationPage;