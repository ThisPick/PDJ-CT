import React, { useState, useEffect } from 'react';
import api from '../services/evaluationService'; 
import { 
  Layout, Card, Table, Tag, Button, Space, Typography, 
  Modal, Slider, Input, Row, Col, Divider, message, Statistic,
  Badge, Progress, Alert, Spin, Empty, FloatButton
} from 'antd';
import { 
  SolutionOutlined, EditOutlined, SearchOutlined, UserOutlined,
  StarFilled, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  FilePdfOutlined, CheckCircleOutlined, BookOutlined,
  TrophyFilled, SaveOutlined, CloseOutlined, LoadingOutlined,
  BellOutlined, ThunderboltOutlined, SmileOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

/* ─────────────────────────────────────────────────────
   WEB AUDIO ENGINE — procedural sounds
───────────────────────────────────────────────────── */
class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }
  _play(fn) { if (!this.enabled) return; try { fn(this._ctx()); } catch(e){} }

  chime() {
    this._play(ctx => {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.1;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      });
    });
  }

  pop() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(320, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.22, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      o.start(); o.stop(ctx.currentTime + 0.09);
    });
  }

  confirm() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.start(); o.stop(ctx.currentTime + 0.2);
    });
  }

  buzz() {
    this._play(ctx => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    });
  }
}

const sfx = new SoundEngine();

/* ─────────────────────────────────────────────────────
   SUCCESS MODAL COMPONENT
───────────────────────────────────────────────────── */
const SuccessModal = ({ visible, onClose, score }) => {
  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      bodyStyle={{ padding: '48px 24px' }}
      width={500}
      closable={false}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl mx-auto">
            <CheckCircleOutlined className="text-6xl text-white animate-bounce" />
          </div>
        </div>
        <div>
          <Title level={2} style={{ margin: 0, color: '#059669' }}>
            บันทึกผลการประเมินเรียบร้อย!
          </Title>
          <Text className="text-lg text-slate-500 mt-3 block">
            ✅ คะแนนของนักศึกษาได้รับการบันทึกสำเร็จแล้ว
          </Text>
        </div>

        {score !== undefined && (
          <div className={`w-full p-6 rounded-2xl ${
            score >= 80 ? 'bg-green-50 border-2 border-green-200' :
            score >= 60 ? 'bg-blue-50 border-2 border-blue-200' :
            score >= 40 ? 'bg-orange-50 border-2 border-orange-200' :
            'bg-red-50 border-2 border-red-200'
          }`}>
            <Text className="text-slate-600 text-sm font-semibold block mb-2">คะแนนที่บันทึก</Text>
            <div className={`text-5xl font-black ${
              score >= 80 ? 'text-green-600' :
              score >= 60 ? 'text-blue-600' :
              score >= 40 ? 'text-orange-500' :
              'text-red-500'
            }`}>
              {score}
            </div>
            <Text className="text-slate-500 text-xs block mt-2">/ 100 คะแนน</Text>
          </div>
        )}

        <Button
          type="primary"
          size="large"
          shape="round"
          className="bg-green-600 hover:bg-green-700 border-none px-8 py-6 text-lg font-bold h-auto"
          onClick={onClose}
        >
          🎉 ยอดเยี่ยม!
        </Button>
      </div>
    </Modal>
  );
};

const EvaluationPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [savedScore, setSavedScore] = useState(0);

  const [grading, setGrading] = useState({
    completeness: 0, 
    presentation: 0, 
    feedback: ''
  });

  const totalScore = grading.completeness + grading.presentation;

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
      message.error('❌ ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenEvaluate = async (project) => {
    sfx.pop();
    try {
      const res = await api.getById(project.project_id); 
      const data = res.data || res;
      setCurrentProject(data);
      
      setGrading({
        completeness: data.completeness_score ? Number(data.completeness_score) : 0, 
        presentation: data.presentation_score ? Number(data.presentation_score) : 0, 
        feedback: data.comment || ''
      });
      setIsModalOpen(true);
    } catch (error) {
      sfx.buzz();
      message.error('❌ โหลดข้อมูลโปรเจกต์ล้มเหลว');
    }
  };

  const handleCloseModal = () => {
    sfx.pop();
    setIsModalOpen(false);
    setGrading({
      completeness: 0, 
      presentation: 0, 
      feedback: ''
    });
    setCurrentProject(null);
  };

  const handleSaveEvaluation = async () => {
    if (totalScore === 0) {
      Modal.warning({
        title: '⚠️ ยังไม่ได้ให้คะแนน',
        content: 'กรุณาให้คะแนนอย่างน้อย 1 คะแนนก่อนบันทึก',
        okText: 'รับทราบ',
        okButtonProps: { className: 'bg-orange-500' }
      });
      sfx.buzz();
      return;
    }

    setSavingScore(true);
    sfx.confirm();

    try {
      const payload = {
        project_id: currentProject.project_id,
        evaluator_id: 15,
        completeness_score: grading.completeness,
        presentation_score: grading.presentation,
        total_score: totalScore,
        comment: grading.feedback
      };
      
      await api.updateScore(payload);
      
      sfx.chime();
      setSavedScore(totalScore);
      setSuccessModalOpen(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessModalOpen(false);
        fetchProjects();
      }, 2000);

    } catch (error) {
      sfx.buzz();
      Modal.error({
        title: '❌ บันทึกล้มเหลว',
        content: 'เกิดข้อผิดพลาดในการบันทึกคะแนน โปรดลองใหม่',
        okText: 'ตกลง'
      });
    } finally {
      setSavingScore(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const searchLower = searchText.toLowerCase();
    const matchTH = project.title_th?.toLowerCase().includes(searchLower);
    const matchEN = project.title_en?.toLowerCase().includes(searchLower);
    const matchAuthor = (project.student_name || project.creator_name || project.name || project.fullname || '')?.toLowerCase().includes(searchLower);
    const matchAdvisor = (project.advisor || '')?.toLowerCase().includes(searchLower);
    return matchTH || matchEN || matchAuthor || matchAdvisor;
  });

  const columns = [
    {
      title: <span className="text-lg font-bold">ข้อมูลโครงงาน</span>,
      key: 'project_info',
      render: (_, record) => {
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
        let statusColor = 'default';
        let statusText = 'รอการประเมิน';
        
        if (hasScore) {
          if (record.total_score >= 80) {
            statusColor = 'success';
            statusText = '🌟 ยอดเยี่ยม';
          } else if (record.total_score >= 60) {
            statusColor = 'processing';
            statusText = '👍 ดี';
          } else if (record.total_score >= 40) {
            statusColor = 'warning';
            statusText = '📚 พอใจ';
          } else {
            statusColor = 'error';
            statusText = '⚠️ ต้องปรับปรุง';
          }
        }

        return (
          <div className="flex flex-col items-center gap-2">
            {hasScore ? (
              <>
                <Badge status={statusColor} text={<span className={`font-bold text-lg ${statusColor === 'success' ? 'text-green-600' : statusColor === 'processing' ? 'text-blue-600' : statusColor === 'warning' ? 'text-orange-600' : 'text-red-600'}`}>{statusText}</span>} />
                <div className="text-4xl font-black text-slate-700">{record.total_score} <span className="text-xl text-slate-400">/ 100</span></div>
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
            className={`h-12 px-6 text-lg rounded-xl font-bold shadow-sm transition-all hover:scale-105 hover:-translate-y-1 ${hasScore ? 'border-indigo-400 text-indigo-600' : 'bg-indigo-600 border-none text-white'}`}
          >
            {hasScore ? 'แก้ไขคะแนน' : 'เริ่มประเมิน'}
          </Button>
        );
      }
    }
  ];

  const evaluatedCount = projects.filter(p => p.total_score !== null).length;
  const pendingCount = projects.filter(p => p.total_score === null).length;

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar />
      <Content className="p-4 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <SolutionOutlined className="text-5xl" />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: 'white', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
                    ระบบประเมินคะแนน
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }} className="text-sm md:text-base">
                    พิจารณาให้คะแนนและบันทึกข้อเสนอแนะสำหรับนักศึกษา
                  </Text>
                </div>
              </div>
            </div>

            {/* Stats Card 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:scale-105 transition-all transform">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-slate-500 text-sm font-semibold block">ประเมินแล้ว</Text>
                  <Title level={3} style={{ margin: 0, color: '#10b981' }} className="animate-pulse">
                    {evaluatedCount}
                  </Title>
                </div>
                <CheckCircleOutlined className="text-5xl text-green-400 animate-bounce" />
              </div>
            </div>

            {/* Stats Card 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:scale-105 transition-all transform">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-slate-500 text-sm font-semibold block">รอประเมิน</Text>
                  <Title level={3} style={{ margin: 0, color: '#ef4444' }} className="animate-pulse">
                    {pendingCount}
                  </Title>
                </div>
                <StarFilled className="text-5xl text-red-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>

          {/* Alerts */}
          {pendingCount > 0 && (
            <Alert
              message={`⚠️ มีโครงงาน ${pendingCount} รายการรอการประเมิน`}
              description="กรุณาประเมินคะแนนให้กับนักศึกษาในเร็วที่สุด"
              type="warning"
              showIcon
              closable
              className="mb-6 rounded-2xl text-base"
            />
          )}

          {/* Table & Search Section */}
          <Card className="rounded-3xl shadow-xl border border-slate-200 overflow-hidden" bodyStyle={{ padding: '32px' }}>
             
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <TrophyFilled className="text-4xl text-yellow-500 animate-bounce" />
                <Text strong className="text-3xl text-slate-700">รายชื่อโครงงาน</Text>
                <Tag color="indigo" className="text-base font-bold ml-2">{filteredProjects.length}</Tag>
              </div>

              {/* Search Input */}
              <Input 
                size="large" 
                placeholder="🔍 ค้นหาชื่อโครงงาน / ผู้จัดทำ..." 
                prefix={<SearchOutlined className="text-slate-400 text-xl" />} 
                value={searchText}
                onChange={(e) => { sfx.pop(); setSearchText(e.target.value); }}
                className="md:w-[420px] h-14 text-lg rounded-2xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500 shadow-sm transition-all"
                allowClear
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spin size="large" />
                <Text className="mt-4 text-slate-500 font-semibold animate-pulse">กำลังโหลดข้อมูล...</Text>
              </div>
            ) : filteredProjects.length === 0 ? (
              <Empty
                description={<span className="text-lg text-slate-500">ไม่พบโครงงาน</span>}
                style={{ paddingBlock: 60 }}
              />
            ) : (
              <Table 
                columns={columns} 
                dataSource={filteredProjects} 
                rowKey="project_id" 
                pagination={{ pageSize: 10, className: 'text-lg' }}
                className="rounded-2xl"
                rowClassName="hover:bg-indigo-50 transition-colors cursor-pointer"
                scroll={{ x: 600 }}
              />
            )}
          </Card>
        </div>
      </Content>

      {/* Success Modal */}
      <SuccessModal 
        visible={successModalOpen} 
        onClose={() => setSuccessModalOpen(false)}
        score={savedScore}
      />

      {/* Evaluation Modal */}
      <Modal
        title={
          <div className="text-2xl font-black text-indigo-800 flex items-center">
            <EditOutlined className="mr-3 text-indigo-600 text-3xl" /> บันทึกผลการประเมินโครงงาน
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        centered
        bodyStyle={{ padding: '32px' }}
        closable={true}
        closeIcon={<CloseOutlined className="text-2xl hover:text-red-500 transition-colors" />}
      >
        {currentProject && (
          <div className="mt-6 space-y-8">
            {/* Project Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-md">
              <Text strong className="text-2xl text-indigo-900 block">{currentProject.title_th}</Text>
              <Text className="text-lg text-indigo-600 font-medium">{currentProject.title_en || '-'}</Text>
              <div className="flex items-center gap-6 mt-3 text-slate-700 flex-wrap">
                <Text className="text-lg"><UserOutlined className="mr-2 text-indigo-500" /> <span className="font-bold">ผู้จัดทำ:</span> {currentProject.student_name || currentProject.creator_name || 'ไม่ระบุชื่อ'}</Text>
                {currentProject.advisor && <Text className="text-lg"><SolutionOutlined className="mr-2 text-indigo-500" /> <span className="font-bold">ที่ปรึกษา:</span> {currentProject.advisor}</Text>}
              </div>

              {currentProject.completeness_score !== null && currentProject.presentation_score !== null && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <Text type="secondary" className="text-xs font-semibold block mb-2">คะแนนปัจจุบัน:</Text>
                  <div className="flex gap-4 flex-wrap">
                    <Tag color="indigo" className="text-base font-bold px-3 py-1">ความสมบูรณ์: {currentProject.completeness_score}</Tag>
                    <Tag color="blue" className="text-base font-bold px-3 py-1">การนำเสนอ: {currentProject.presentation_score}</Tag>
                    <Tag color="purple" className="text-base font-bold px-3 py-1">รวม: {(currentProject.completeness_score || 0) + (currentProject.presentation_score || 0)}</Tag>
                  </div>
                </div>
              )}
            </div>

            {/* Files Links */}
            <div>
              <Text strong className="block mb-4 text-xl text-slate-700 flex items-center gap-2">
                <BookOutlined className="text-blue-500" /> เอกสารและสื่อนำเสนอ
              </Text>
              <Space size="middle" wrap>
                {currentProject.pdf_file_path && (
                  <Button icon={<FilePdfOutlined style={{ fontSize: '18px' }}/>} size="large" type="primary" danger className="h-12 px-6 text-base rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all" href={`https://reg.utc.ac.th/uploads/pdf/${currentProject.pdf_file_path}`} target="_blank" onClick={() => sfx.pop()}>
                    📄 เล่มโครงงาน
                  </Button>
                )}
                {currentProject.video_url && (
                  <Button icon={<YoutubeOutlined style={{ fontSize: '18px' }} />} size="large" className="text-red-600 border-red-300 hover:text-red-700 hover:border-red-600 bg-red-50 h-12 px-6 text-base rounded-xl hover:scale-105 transition-all" href={currentProject.video_url} target="_blank" onClick={() => sfx.pop()}>
                    🎬 วิดีโอ
                  </Button>
                )}
                {currentProject.drive_url && (
                  <Button icon={<GoogleOutlined style={{ fontSize: '18px' }} />} size="large" className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-600 bg-blue-50 h-12 px-6 text-base rounded-xl hover:scale-105 transition-all" href={currentProject.drive_url} target="_blank" onClick={() => sfx.pop()}>
                    📁 Drive
                  </Button>
                )}
                {currentProject.github_url && (
                  <Button icon={<GithubOutlined style={{ fontSize: '18px' }} />} size="large" className="text-slate-700 border-slate-300 hover:text-black hover:border-slate-800 bg-slate-50 h-12 px-6 text-base rounded-xl hover:scale-105 transition-all" href={currentProject.github_url} target="_blank" onClick={() => sfx.pop()}>
                    💻 GitHub
                  </Button>
                )}
              </Space>
            </div>

            <Divider className="border-slate-200" />

            {/* Grading Section */}
            <div>
              <Text strong className="block mb-6 text-xl text-slate-700 flex items-center gap-2">
                <ThunderboltOutlined className="text-yellow-500" /> เกณฑ์การให้คะแนน
              </Text>
              <Row gutter={32}>
                <Col xs={24} md={12}>
                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 rounded-2xl shadow-md text-center h-full hover:shadow-lg transition-all">
                    <Text className="text-base text-slate-600 font-bold block mb-4">
                      📋 ความสมบูรณ์ (50 คะแนน)
                    </Text>
                    <div className="mb-4">
                      <Slider 
                        min={0} 
                        max={50} 
                        value={grading.completeness} 
                        onChange={v => { sfx.pop(); setGrading({...grading, completeness: v}); }} 
                        tooltip={{ open: true, color: '#4f46e5' }}
                        marks={{ 0: '0', 25: '25', 50: '50' }}
                        className="px-2"
                      />
                    </div>
                    <Input 
                      type="number" 
                      min={0} 
                      max={50} 
                      value={grading.completeness} 
                      onChange={e => {
                        const val = Math.min(50, Math.max(0, Number(e.target.value)));
                        setGrading({...grading, completeness: val});
                      }}
                      className="text-center text-2xl font-bold rounded-xl h-12 text-indigo-600 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 rounded-2xl shadow-md text-center h-full hover:shadow-lg transition-all">
                    <Text className="text-base text-slate-600 font-bold block mb-4">
                      🎨 การนำเสนอ (50 คะแนน)
                    </Text>
                    <div className="mb-4">
                      <Slider 
                        min={0} 
                        max={50} 
                        value={grading.presentation} 
                        onChange={v => { sfx.pop(); setGrading({...grading, presentation: v}); }} 
                        tooltip={{ open: true, color: '#0ea5e9' }}
                        marks={{ 0: '0', 25: '25', 50: '50' }}
                        className="px-2"
                      />
                    </div>
                    <Input 
                      type="number" 
                      min={0} 
                      max={50} 
                      value={grading.presentation} 
                      onChange={e => {
                        const val = Math.min(50, Math.max(0, Number(e.target.value)));
                        setGrading({...grading, presentation: val});
                      }}
                      className="text-center text-2xl font-bold rounded-xl h-12 text-blue-600 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Progress Bars */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 space-y-6">
              <Title level={4} className="!mb-4 text-slate-800">📊 ความก้าวหน้า</Title>
              
              <div className="bg-white p-4 rounded-xl">
                <div className="flex justify-between mb-3">
                  <div>
                    <Text className="font-semibold text-slate-700 block">ความสมบูรณ์ของชิ้นงาน</Text>
                    <Text type="secondary" className="text-xs">เสร็จสมบูรณ์กี่เปอร์เซ็นต์</Text>
                  </div>
                  <Text className="font-black text-2xl text-indigo-600">{grading.completeness}%</Text>
                </div>
                <Progress 
                  percent={(grading.completeness/50)*100} 
                  strokeColor={{ '0%': '#4f46e5', '100%': '#6366f1' }}
                  format={() => null}
                  size={["100%", 12]}
                />
              </div>

              <div className="bg-white p-4 rounded-xl">
                <div className="flex justify-between mb-3">
                  <div>
                    <Text className="font-semibold text-slate-700 block">การนำเสนอและจัดทำรูปเล่ม</Text>
                    <Text type="secondary" className="text-xs">คุณภาพการนำเสนอ</Text>
                  </div>
                  <Text className="font-black text-2xl text-blue-600">{grading.presentation}%</Text>
                </div>
                <Progress 
                  percent={(grading.presentation/50)*100} 
                  strokeColor={{ '0%': '#0ea5e9', '100%': '#06b6d4' }}
                  format={() => null}
                  size={["100%", 12]}
                />
              </div>
            </div>

            {/* Total Score */}
            <div className={`p-8 rounded-3xl text-center border-4 shadow-2xl transition-all duration-500 animate-pulse ${
              totalScore >= 80 ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-green-400' : 
              (totalScore >= 60 ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-blue-400' : 
              (totalScore >= 40 ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-orange-400' :
              'bg-gradient-to-br from-red-50 via-pink-50 to-red-50 border-red-400'))
            }`}>
              <Text className="text-lg text-slate-500 font-bold uppercase tracking-widest block mb-4">คะแนนรวมสุทธิ</Text>
              <div className={`text-8xl font-black transition-all duration-300 mb-2 ${
                totalScore >= 80 ? 'text-green-600' : 
                (totalScore >= 60 ? 'text-blue-600' :
                (totalScore >= 40 ? 'text-orange-500' : 'text-red-500'))
              }`}>
                {totalScore}
              </div>
              <div className="text-4xl font-bold text-slate-400 mb-4">/ 100</div>
              
              {totalScore >= 80 && (
                <div>
                  <Text className="text-green-600 font-black text-2xl block mb-1">🌟 ยอดเยี่ยม!</Text>
                  <Text type="secondary" className="block text-sm">เด็กนักเรียนมีความสามารถสูง</Text>
                </div>
              )}
              {totalScore >= 60 && totalScore < 80 && (
                <div>
                  <Text className="text-blue-600 font-black text-2xl block mb-1">👍 ดีมาก!</Text>
                  <Text type="secondary" className="block text-sm">ผลงานมีคุณภาพดี</Text>
                </div>
              )}
              {totalScore >= 40 && totalScore < 60 && (
                <div>
                  <Text className="text-orange-600 font-black text-2xl block mb-1">📚 พอใจ</Text>
                  <Text type="secondary" className="block text-sm">ต้องปรับปรุงเพิ่มเติม</Text>
                </div>
              )}
              {totalScore < 40 && totalScore > 0 && (
                <div>
                  <Text className="text-red-600 font-black text-2xl block mb-1">⚠️ ต้องปรับปรุง</Text>
                  <Text type="secondary" className="block text-sm">ต้องมีการแก้ไขสำคัญ</Text>
                </div>
              )}
              {totalScore === 0 && (
                <div>
                  <Text className="text-slate-500 font-bold text-lg block">📝 กรอกคะแนนด้านบน</Text>
                </div>
              )}
            </div>

            {/* Feedback */}
            <div>
              <Text strong className="block mb-3 text-xl text-slate-700 flex items-center gap-2">
                <SmileOutlined className="text-pink-500" /> ข้อเสนอแนะเพิ่มเติม
              </Text>
              <TextArea rows={5} placeholder="✍️ กรอกข้อเสนอแนะให้กับนักศึกษา..." value={grading.feedback} onChange={e => setGrading({...grading, feedback: e.target.value})} className="text-lg rounded-2xl border-slate-300 focus:border-indigo-500 p-4 shadow-sm transition-all hover:shadow-md" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <Button size="large" onClick={handleCloseModal} className="h-12 px-8 text-lg font-bold rounded-xl text-slate-500 hover:bg-slate-100 border-none transition-all hover:scale-105">
                ❌ ยกเลิก
              </Button>
              <Button size="large" type="primary" onClick={handleSaveEvaluation} loading={savingScore} disabled={savingScore} icon={<SaveOutlined />} className="h-12 px-10 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-200 transition-all hover:scale-105 disabled:opacity-60">
                {savingScore ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Button */}
      <FloatButton
        badge={{ count: pendingCount, style: { backgroundColor: '#ef4444' } }}
        icon={<BellOutlined />}
        type="primary"
        className="bg-indigo-600 hover:bg-indigo-700"
        style={{ right: 24, bottom: 80 }}
        tooltip={`${pendingCount} โครงงานรอประเมิน`}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.3); }
        }

        .ant-table-thead > tr > th { 
          background: #f8fafc !important; 
          padding: 16px !important;
          font-weight: 700 !important;
        }

        .ant-table-tbody > tr {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ant-table-tbody > tr:hover {
          background-color: #eef2ff !important;
          transform: scale(1.01);
        }

        .ant-input-number-input {
          font-weight: bold !important;
        }

        .ant-slider-mark {
          font-size: 12px;
          color: #64748b;
        }

        .ant-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .ant-card:hover {
          transform: translateY(-2px) !important;
        }

        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }

        @media (max-width: 768px) {
          .ant-table-thead > tr > th {
            font-size: 12px !important;
            padding: 12px 8px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default EvaluationPage;