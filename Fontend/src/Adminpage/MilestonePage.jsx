import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Table, Tag, Button, Input, Select, 
  Steps, Drawer, Typography, Row, Col, 
  Space, Badge, Divider, message, Spin, Progress, Statistic,
  Alert, Empty, FloatButton
} from 'antd';
import { 
  SearchOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, AuditOutlined, UserOutlined,
  FilePdfOutlined, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  RiseOutlined, TeamOutlined, ClockCircleOutlined, BellOutlined,
  LoadingOutlined, FireOutlined
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import { getAllProjects } from '../services/projectService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const milestoneSteps = [
  "เสนอหัวข้อ", 
  "ออกแบบระบบ", 
  "พัฒนา 50%", 
  "พัฒนา 100%", 
  "ส่งเล่มสมบูรณ์"
];

/* ─────────────────────────────────────────────────────
   WEB AUDIO ENGINE
───────────────────────────────────────────────────── */
class SoundEngine {
  constructor() { this.ctx = null; }
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }
  _play(fn) { try { fn(this._ctx()); } catch(e){} }

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

  success() {
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

  alert() {
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
}

const sfx = new SoundEngine();

const MilestonePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects();
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
      message.error("❌ ไม่สามารถดึงข้อมูลโครงงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const searchLower = searchText.toLowerCase();
    const studentName = p.student_name || p.creator_name || '';
    const matchSearch = 
      (p.title_th && p.title_th.toLowerCase().includes(searchLower)) || 
      studentName.toLowerCase().includes(searchLower);
    
    if (filterStatus === 'ทั้งหมด') return matchSearch;
    return matchSearch && p.progress_status === filterStatus;
  });

  const handleOpenDrawer = (project) => {
    sfx.pop();
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const getProgressPercent = (status) => {
    const map = {
      'รออนุมัติหัวข้อ': 15,
      'ออกแบบระบบ': 25,
      'กำลังทำ': 60,
      'รออนุมัติเล่ม': 85,
      'สมบูรณ์': 100,
      'ไม่ผ่าน': 0,
      'ล่าช้า': 50,
    };
    return map[status] || 0;
  };

  const getProgressColor = (status) => {
    const map = {
      'สมบูรณ์': '#10b981',
      'กำลังทำ': '#3b82f6',
      'รออนุมัติหัวข้อ': '#f59e0b',
      'รออนุมัติเล่ม': '#f97316',
      'ล่าช้า': '#ef4444',
      'ไม่ผ่าน': '#dc2626',
    };
    return map[status] || '#6b7280';
  };

  const getMilestoneIndex = (status) => {
    const map = {
      'รออนุมัติหัวข้อ': 0,
      'กำลังทำ': 2,
      'รออนุมัติเล่ม': 4,
      'สมบูรณ์': 5,
    };
    return map[status] || 1;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const pendingCount = projects.filter(p => p.progress_status?.includes('รอ')).length;
  const completeCount = projects.filter(p => p.progress_status === 'สมบูรณ์').length;
  const inProgressCount = projects.filter(p => p.progress_status === 'กำลังทำ').length;
  const failedCount = projects.filter(p => p.progress_status === 'ไม่ผ่าน' || p.progress_status === 'ล่าช้า').length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + getProgressPercent(p.progress_status), 0) / projects.length) : 0;

  const columns = [
    {
      title: <span className="text-base font-bold">📚 โครงงาน</span>,
      key: 'info',
      width: '28%',
      render: (_, r) => (
        <div className="space-y-2">
          <Text strong className="text-lg text-indigo-900">{r.title_th}</Text>
          <div className="text-sm space-y-1">
            <div className="text-slate-600"><UserOutlined className="mr-1 text-indigo-500" />{r.student_name || r.creator_name || 'ไม่ระบุ'}</div>
            {r.advisor && <div className="text-slate-600"><AuditOutlined className="mr-1 text-indigo-500" />{r.advisor}</div>}
          </div>
          <Space size={4}>
            <Tag color="blue">{r.category}</Tag>
            <Tag color="purple">{r.project_level}</Tag>
          </Space>
        </div>
      )
    },
    {
      title: <span className="text-base font-bold">⚡ ความก้าวหน้า</span>,
      key: 'progress',
      width: '34%',
      render: (_, r) => {
        const percent = getProgressPercent(r.progress_status);
        return (
          <div className="space-y-3">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-slate-700">{r.progress_status}</span>
              <span className="text-lg font-black text-indigo-600">{percent}%</span>
            </div>
            <Progress 
              percent={percent} 
              strokeColor={getProgressColor(r.progress_status)}
              format={() => null}
              size={["100%", 12]}
            />
            <Text type="secondary" className="text-xs block">อัปเดต: {formatDate(r.updated_at)}</Text>
          </div>
        );
      }
    },
    {
      title: <span className="text-base font-bold">🎯 Milestone</span>,
      key: 'milestone',
      width: '20%',
      align: 'center',
      render: (_, r) => {
        const stepIndex = getMilestoneIndex(r.progress_status);
        return (
          <div className="text-center">
            <Badge 
              count={stepIndex + 1}
              style={{ backgroundColor: getProgressColor(r.progress_status), fontSize: '16px', fontWeight: 'bold' }}
              showZero
            />
            <div className="text-xs text-slate-600 mt-2">{milestoneSteps[stepIndex]}</div>
          </div>
        );
      }
    },
    {
      title: <span className="text-base font-bold text-center">👁️ ดู</span>,
      key: 'action',
      width: '18%',
      align: 'center',
      render: (_, r) => (
        <Button 
          type="primary"
          size="small"
          className="bg-indigo-600 hover:bg-indigo-700 font-semibold transition-all hover:scale-110"
          onClick={() => handleOpenDrawer(r)}
        >
          รายละเอียด
        </Button>
      )
    }
  ];

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar />
      <Layout>
        <Content className="p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <RiseOutlined className="text-4xl" />
                    </div>
                    <div>
                      <Title level={2} style={{ margin: 0, color: 'white' }}>📈 ติดตามความก้าวหน้า</Title>
                      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>โครงงานนักศึกษา</Text>
                    </div>
                  </div>
                  <div className="text-5xl">🎯</div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <Row gutter={16} className="mb-8">
              <Col xs={24} sm={12} lg={6}>
                <Card className="rounded-2xl shadow-md border-0 hover:shadow-lg hover:scale-105 transition-all transform cursor-pointer" onClick={() => { sfx.pop(); setFilterStatus('กำลังทำ'); }}>
                  <Statistic
                    title={<span className="text-sm font-semibold text-slate-600 flex items-center"><LoadingOutlined className="mr-2 animate-spin text-blue-500" />กำลังดำเนิน</span>}
                    value={inProgressCount}
                    valueStyle={{ color: '#3b82f6', fontSize: '2.5rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="rounded-2xl shadow-md border-0 hover:shadow-lg hover:scale-105 transition-all transform cursor-pointer" onClick={() => { sfx.pop(); setFilterStatus('รออนุมัติหัวข้อ'); }}>
                  <Statistic
                    title={<span className="text-sm font-semibold text-slate-600 flex items-center"><BellOutlined className="mr-2 text-orange-500 animate-bounce" />รอตรวจสอบ</span>}
                    value={pendingCount}
                    valueStyle={{ color: '#f97316', fontSize: '2.5rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="rounded-2xl shadow-md border-0 hover:shadow-lg hover:scale-105 transition-all transform cursor-pointer" onClick={() => { sfx.pop(); setFilterStatus('สมบูรณ์'); }}>
                  <Statistic
                    title={<span className="text-sm font-semibold text-slate-600 flex items-center"><CheckCircleOutlined className="mr-2 text-green-500" />สมบูรณ์</span>}
                    value={completeCount}
                    valueStyle={{ color: '#10b981', fontSize: '2.5rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="rounded-2xl shadow-md border-0 hover:shadow-lg hover:scale-105 transition-all transform">
                  <Statistic
                    title={<span className="text-sm font-semibold text-slate-600 flex items-center"><FireOutlined className="mr-2 text-purple-500" />ความก้าวหน้า</span>}
                    value={avgProgress}
                    suffix="%"
                    valueStyle={{ color: '#8b5cf6', fontSize: '2.5rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Alerts */}
            {failedCount > 0 && (
              <Alert
                message={`⚠️ มีโครงงาน ${failedCount} รายการมีปัญหา`}
                description="โครงงานเหล่านี้ล่าช้าหรือไม่ผ่านการตรวจสอบ ต้องเร่งดำเนิน"
                type="warning"
                showIcon
                closable
                className="mb-6 rounded-xl text-base animate-pulse"
              />
            )}

            {pendingCount > 0 && (
              <Alert
                message={`🔔 ${pendingCount} โครงงานรอการอนุมัติ`}
                type="info"
                showIcon
                closable
                className="mb-6 rounded-xl text-base"
              />
            )}

            {/* Filter */}
            <Card className="rounded-2xl shadow-lg border-slate-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  size="large"
                  placeholder="🔍 ค้นหา..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => { sfx.pop(); setSearchText(e.target.value); }}
                  className="flex-1 rounded-xl"
                  allowClear
                />
                <Select
                  size="large"
                  value={filterStatus}
                  onChange={(v) => { sfx.pop(); setFilterStatus(v); }}
                  className="w-full md:w-56 rounded-xl"
                >
                  <Option value="ทั้งหมด">📋 ทั้งหมด ({projects.length})</Option>
                  <Option value="กำลังทำ">🔨 กำลังทำ ({inProgressCount})</Option>
                  <Option value="รออนุมัติหัวข้อ">⏳ รอการอนุมัติ ({pendingCount})</Option>
                  <Option value="สมบูรณ์">✅ สมบูรณ์ ({completeCount})</Option>
                </Select>
              </div>
            </Card>

            {/* Table */}
            {loading ? (
              <Card className="rounded-2xl shadow-lg">
                <div className="text-center py-20">
                  <Spin size="large" />
                  <Text className="mt-4 block text-slate-500 font-semibold">กำลังโหลด...</Text>
                </div>
              </Card>
            ) : filteredProjects.length === 0 ? (
              <Card className="rounded-2xl shadow-lg">
                <Empty description="ไม่พบโครงงาน" style={{ paddingBlock: 80 }} />
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-lg border-slate-200">
                <Table 
                  columns={columns} 
                  dataSource={filteredProjects}
                  rowKey="project_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  rowClassName="hover:bg-indigo-50 transition-colors cursor-pointer"
                  scroll={{ x: 900 }}
                />
              </Card>
            )}
          </div>
        </Content>
      </Layout>

      {/* Drawer */}
      <Drawer
        title={
          <div className="text-2xl font-black text-indigo-800 flex items-center gap-2">
            <AuditOutlined className="text-indigo-600" />
            รายละเอียดโครงงาน
          </div>
        }
        placement="right"
        width={window.innerWidth < 768 ? '100%' : 900}
        onClose={() => { sfx.pop(); setIsDrawerOpen(false); }}
        open={isDrawerOpen}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedProject && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Project Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
              <Title level={3} className="!mt-0 !mb-3 text-indigo-900">{selectedProject.title_th}</Title>
              <Text type="secondary" className="block mb-4">{selectedProject.title_en}</Text>
              
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div className="bg-white p-3 rounded-lg">
                    <Text type="secondary" className="text-xs block">ผู้จัดทำ</Text>
                    <Text strong className="text-base">{selectedProject.student_name || selectedProject.creator_name || 'ไม่ระบุ'}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="bg-white p-3 rounded-lg">
                    <Text type="secondary" className="text-xs block">ที่ปรึกษา</Text>
                    <Text strong className="text-base">{selectedProject.advisor || '-'}</Text>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Progress Section */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <Title level={4} className="!mb-0">📊 ความก้าวหน้า</Title>
                <span className="text-4xl font-black text-indigo-600">{getProgressPercent(selectedProject.progress_status)}%</span>
              </div>

              <Progress 
                percent={getProgressPercent(selectedProject.progress_status)}
                strokeColor={getProgressColor(selectedProject.progress_status)}
                size={["100%", 20]}
                format={() => null}
              />

              <Row gutter={16} className="mt-6">
                <Col xs={12}>
                  <Card className="rounded-lg border-0 bg-white text-center">
                    <Text type="secondary" className="text-xs block">สถานะปัจจุบัน</Text>
                    <Text strong className="text-lg text-indigo-600">{selectedProject.progress_status}</Text>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card className="rounded-lg border-0 bg-white text-center">
                    <Text type="secondary" className="text-xs block">อัปเดตล่าสุด</Text>
                    <Text strong className="text-lg">{formatDate(selectedProject.updated_at)}</Text>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Milestone Steps */}
            <div>
              <Title level={4}>🎯 ขั้นตอน Milestone</Title>
              <Steps 
                current={getMilestoneIndex(selectedProject.progress_status)}
                items={milestoneSteps.map((m, i) => ({
                  title: <span className="text-sm font-semibold">{m}</span>,
                  status: i <= getMilestoneIndex(selectedProject.progress_status) ? 'finish' : 'wait'
                }))}
              />
            </div>

            {/* Files Section */}
            <div>
              <Title level={4}>📁 ไฟล์และลิงก์</Title>
              <div className="space-y-3">
                {selectedProject.pdf_file_path && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <FilePdfOutlined className="text-2xl text-red-600" />
                      <div>
                        <Text strong className="text-red-600">เอกสาร PDF</Text>
                        <Text type="secondary" className="text-xs block">โครงงาน</Text>
                      </div>
                    </div>
                    <Button type="primary" danger shape="round" size="small" href={`http://localhost:5000/uploads/pdf/${selectedProject.pdf_file_path}`} target="_blank" onClick={() => sfx.success()}>📥 เปิด</Button>
                  </div>
                )}

                {selectedProject.drive_url && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <GoogleOutlined className="text-2xl text-blue-600" />
                      <div>
                        <Text strong className="text-blue-600">Google Drive</Text>
                        <Text type="secondary" className="text-xs block">โฟลเดอร์</Text>
                      </div>
                    </div>
                    <Button type="primary" shape="round" size="small" className="bg-blue-500" href={selectedProject.drive_url} target="_blank" onClick={() => sfx.success()}>🔗 เปิด</Button>
                  </div>
                )}

                {selectedProject.video_url && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <YoutubeOutlined className="text-2xl text-red-600" />
                      <div>
                        <Text strong className="text-red-600">วิดีโอ YouTube</Text>
                        <Text type="secondary" className="text-xs block">นำเสนอ</Text>
                      </div>
                    </div>
                    <Button danger shape="round" size="small" href={selectedProject.video_url} target="_blank" onClick={() => sfx.success()}>▶️ ดู</Button>
                  </div>
                )}

                {selectedProject.github_url && (
                  <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <GithubOutlined className="text-2xl text-slate-700" />
                      <div>
                        <Text strong className="text-slate-700">GitHub</Text>
                        <Text type="secondary" className="text-xs block">Source Code</Text>
                      </div>
                    </div>
                    <Button className="bg-slate-800 text-white" shape="round" size="small" href={selectedProject.github_url} target="_blank" onClick={() => sfx.success()}>💻 เปิด</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <Title level={4}>💬 ข้อเสนอแนะ</Title>
              <TextArea 
                rows={5}
                value={selectedProject.feedback || 'ไม่มีข้อเสนอแนะ'}
                readOnly
                className="bg-slate-50 rounded-xl cursor-not-allowed"
              />
            </div>

            <Button size="large" type="primary" block className="bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl" onClick={() => { sfx.success(); setIsDrawerOpen(false); }}>
              ✅ ปิด
            </Button>
          </div>
        )}
      </Drawer>

      {/* Floating Button */}
      <FloatButton
        badge={{ count: pendingCount, style: { backgroundColor: '#f97316' } }}
        type="primary"
        className="bg-indigo-600 hover:bg-indigo-700"
        icon={<BellOutlined className="text-xl" />}
        tooltip={`${pendingCount} รอตรวจสอบ`}
        style={{ right: 24, bottom: 80 }}
        onClick={() => { sfx.alert(); setFilterStatus('รออนุมัติหัวข้อ'); }}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          padding: 16px !important;
          font-weight: 700 !important;
        }

        .ant-table-tbody > tr {
          transition: all 0.3s ease;
        }

        .ant-table-tbody > tr:hover {
          background-color: #eef2ff !important;
          transform: scale(1.01);
        }

        * {
          transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }

        @media (max-width: 768px) {
          .ant-table {
            font-size: 12px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default MilestonePage;