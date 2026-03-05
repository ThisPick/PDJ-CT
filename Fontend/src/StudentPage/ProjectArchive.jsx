import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Card, Table, Tag, Button, Input, Select, 
  Steps, Drawer, Typography, Badge, message, Spin, Empty
} from 'antd';
import { 
  SearchOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, AuditOutlined, UserOutlined,
  FilePdfOutlined, GithubOutlined, YoutubeOutlined, GoogleOutlined,
  DashboardOutlined, BellOutlined, CloseOutlined, ClockCircleOutlined,
  CheckOutlined, FilterOutlined, EyeOutlined
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
  "พัฒนา 50%", 
  "พัฒนา 100%", 
  "ส่งเล่มสมบูรณ์"
];

// --- หมวดหมู่โครงงานที่ถูกต้อง ---
const PROJECT_CATEGORIES = {
  'web': { label: 'เว็บแอปพลิเคชัน', color: 'blue' },
  'mobile': { label: 'แอปมือถือ', color: 'purple' },
  'desktop': { label: 'โปรแกรม Desktop', color: 'cyan' },
  'ai': { label: 'AI / Machine Learning', color: 'volcano' },
  'iot': { label: 'IoT', color: 'green' },
  'game': { label: 'เกม', color: 'magenta' },
  'data': { label: 'Data Science', color: 'gold' },
  'security': { label: 'Cybersecurity', color: 'red' },
  'other': { label: 'อื่นๆ', color: 'default' },
};

const getCategoryLabel = (cat) => {
  if (!cat) return { label: 'ไม่ระบุ', color: 'default' };
  const key = cat.toLowerCase();
  return PROJECT_CATEGORIES[key] || { label: cat, color: 'geekblue' };
};

// --- สร้างการแจ้งเตือนจากข้อมูลโครงงาน ---
const generateNotifications = (projects) => {
  const notifs = [];
  projects.forEach((p) => {
    const name = p.student_name || p.creator_name || 'โครงงาน';
    if (p.progress_status?.includes('รออนุมัติ')) {
      notifs.push({
        id: `pending-${p.project_id}`,
        type: 'warning',
        icon: '⏳',
        title: 'รอการอนุมัติ',
        message: `"${p.title_th?.substring(0, 30)}..." อยู่ระหว่างรออนุมัติ`,
        time: p.updated_at || p.created_at,
        read: false,
        projectId: p.project_id,
      });
    }
    if (p.progress_status === 'สมบูรณ์') {
      notifs.push({
        id: `done-${p.project_id}`,
        type: 'success',
        icon: '✅',
        title: 'โครงงานสำเร็จ!',
        message: `"${p.title_th?.substring(0, 30)}..." ได้รับการอนุมัติแล้ว`,
        time: p.updated_at || p.created_at,
        read: false,
        projectId: p.project_id,
      });
    }
    if (p.feedback && p.feedback.trim()) {
      notifs.push({
        id: `feedback-${p.project_id}`,
        type: 'info',
        icon: '💬',
        title: 'มีข้อเสนอแนะใหม่',
        message: `อาจารย์ได้แสดงความคิดเห็นในโครงงาน "${p.title_th?.substring(0, 25)}..."`,
        time: p.updated_at || p.created_at,
        read: false,
        projectId: p.project_id,
      });
    }
  });
  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
};

const ProjectArchive = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  // --- 📡 ดึงข้อมูลจาก Backend ---
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res && Array.isArray(res.data)) data = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      setProjects(data);
      setNotifications(generateNotifications(data));
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("ไม่สามารถดึงข้อมูลโครงงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ปิด notification panel เมื่อคลิกนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // --- 🔍 Logic การกรองข้อมูล ---
  const filteredProjects = projects.filter(p => {
    const searchLower = searchText.toLowerCase();
    const studentName = p.student_name || p.creator_name || '';
    const matchSearch = 
      (p.title_th && p.title_th.toLowerCase().includes(searchLower)) || 
      studentName.toLowerCase().includes(searchLower);
    if (filterStatus === 'ทั้งหมด') return matchSearch;
    return matchSearch && p.progress_status === filterStatus;
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://reg.utc.ac.th';
    return `${baseUrl.replace(/\/api\/?$/, '')}/uploads/pdf/${path}`;
  };

  // --- 🎨 Helper Functions ---
  const getStatusConfig = (status) => {
    if (!status) return { color: 'default', bg: 'bg-gray-100', text: 'text-gray-500', label: 'ไม่ทราบสถานะ', dot: '#9ca3af' };
    if (status.includes('รอ')) return { color: 'warning', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: status, dot: '#f59e0b' };
    if (status === 'ไม่ผ่าน') return { color: 'error', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: status, dot: '#ef4444' };
    if (status === 'สมบูรณ์' || status === 'ผ่าน') return { color: 'success', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: status, dot: '#10b981' };
    return { color: 'processing', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: status, dot: '#3b82f6' };
  };

  const getStatusBadge = (status) => {
    const cfg = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border || 'border-gray-200'}`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }}></span>
        {cfg.label}
      </span>
    );
  };

  const getMilestoneIndex = (status) => {
    if (status === 'รออนุมัติหัวข้อ') return 0;
    if (status === 'กำลังทำ') return 2;
    if (status === 'รออนุมัติเล่ม') return 4;
    if (status === 'สมบูรณ์') return 5;
    return 1;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'เมื่อกี้';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    return new Date(dateString).toLocaleString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- 📊 Mobile Card สำหรับ sm ---
  const ProjectCard = ({ r }) => {
    const stepIndex = getMilestoneIndex(r.progress_status);
    const isPending = r.progress_status?.includes('รอ');
    const catInfo = getCategoryLabel(r.category);
    return (
      <div className={`bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${isPending ? 'border-amber-200' : 'border-slate-100'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-base leading-snug line-clamp-2 mb-1">{r.title_th}</p>
            <p className="text-sm text-slate-500">{r.student_name || r.creator_name || 'ไม่ระบุ'}</p>
          </div>
          {getStatusBadge(r.progress_status)}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Tag color={catInfo.color} className="text-xs rounded-lg m-0">{catInfo.label}</Tag>
          {r.project_level && <Tag color="purple" className="text-xs rounded-lg m-0">{r.project_level}</Tag>}
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-3">
          <Steps
            current={stepIndex}
            size="small"
            className="custom-steps"
            status={isPending ? 'process' : (r.progress_status === 'ไม่ผ่าน' ? 'error' : 'finish')}
            items={milestoneSteps.map(m => ({ title: <span className="text-[10px] font-medium text-slate-500">{m}</span> }))}
          />
        </div>
        <Button
          type={isPending ? 'primary' : 'default'}
          block
          className={`h-10 rounded-xl font-semibold ${isPending ? 'bg-gradient-to-r from-orange-500 to-amber-400 border-none text-white' : ''}`}
          icon={<EyeOutlined />}
          onClick={() => handleOpenDrawer(r)}
        >
          ดูรายละเอียด
        </Button>
      </div>
    );
  };

  // --- 📊 Desktop Table Columns ---
  const columns = [
    {
      title: <span className="font-bold text-slate-700">ข้อมูลโครงงาน</span>,
      key: 'info',
      width: '35%',
      render: (_, r) => {
        const catInfo = getCategoryLabel(r.category);
        return (
          <div className="py-2 pr-4">
            <p className="font-bold text-base text-indigo-900 mb-2 line-clamp-2 leading-snug">{r.title_th}</p>
            <div className="flex flex-col gap-1.5 text-sm text-slate-600 mb-3">
              <span className="flex items-center gap-1.5"><UserOutlined className="text-indigo-400" /><strong>{r.student_name || r.creator_name || 'ไม่ระบุ'}</strong></span>
              {r.advisor && <span className="flex items-center gap-1.5"><AuditOutlined className="text-indigo-400" />{r.advisor}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Tag color={catInfo.color} className="text-xs rounded-md m-0">{catInfo.label}</Tag>
              {r.project_level && <Tag color="purple" className="text-xs rounded-md m-0">{r.project_level}</Tag>}
            </div>
          </div>
        );
      }
    },
    {
      title: <span className="font-bold text-slate-700">ความคืบหน้า (Milestone)</span>,
      key: 'milestone',
      width: '45%',
      render: (_, r) => {
        const stepIndex = getMilestoneIndex(r.progress_status);
        const isPending = r.progress_status?.includes('รอ');
        return (
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:shadow-sm transition-shadow">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              {getStatusBadge(r.progress_status)}
              <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1">
                <ClockCircleOutlined /> {formatDate(r.updated_at || r.created_at)}
              </span>
            </div>
            <Steps
              current={stepIndex}
              size="small"
              className="custom-steps"
              status={isPending ? 'process' : (r.progress_status === 'ไม่ผ่าน' ? 'error' : 'finish')}
              items={milestoneSteps.map(m => ({ title: <span className="text-xs font-medium text-slate-600">{m}</span> }))}
            />
          </div>
        );
      }
    },
    {
      title: <span className="font-bold text-slate-700 block text-center">จัดการ</span>,
      key: 'action',
      width: '20%',
      align: 'center',
      render: (_, r) => {
        const isPending = r.progress_status?.includes('รอ');
        return (
          <Button
            type={isPending ? 'primary' : 'default'}
            className={`h-10 px-5 rounded-xl font-semibold transition-all hover:-translate-y-0.5 ${isPending ? 'bg-gradient-to-r from-orange-500 to-amber-400 border-none text-white shadow-orange-100 shadow-md' : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
            icon={<EyeOutlined />}
            onClick={() => handleOpenDrawer(r)}
          >
            รายละเอียด
          </Button>
        );
      }
    }
  ];

  // --- Notification Panel Component ---
  const NotificationPanel = () => (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden notif-panel">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <BellOutlined className="text-indigo-500" />
          <span className="font-bold text-slate-800">การแจ้งเตือน</span>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
            <CheckOutlined /> อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BellOutlined className="text-4xl mb-3 opacity-30" />
            <p className="text-sm">ไม่มีการแจ้งเตือนในขณะนี้</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markOneRead(n.id)}
              className={`flex gap-3 px-5 py-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                n.type === 'success' ? 'bg-emerald-100' :
                n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ClockCircleOutlined />{formatDate(n.time)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-red-500 w-full text-center transition-colors">
            ล้างการแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Layout className="min-h-screen font-sans">
      <Studentbar />
      <Layout>
        <Content className="p-4 sm:p-6 lg:p-8 bg-[#f4f7fe]">
          <div className="max-w-[1600px] w-full mx-auto space-y-5 sm:space-y-7">

            {/* --- Header Section --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-5 py-5 sm:px-8 sm:py-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 flex-shrink-0">
                  <DashboardOutlined className="text-2xl sm:text-3xl text-white" />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: 'clamp(18px, 3vw, 24px)' }}>
                    ติดตามความคืบหน้า
                  </Title>
                  <Text className="text-sm text-slate-500 mt-0.5 block">
                    ตรวจสอบ Milestone และจัดการไฟล์งาน
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Stats */}
                <div className="flex gap-3">
                  <div className="bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 text-center min-w-[90px]">
                    <Text className="text-xs text-amber-600 font-bold block">รอดำเนินการ</Text>
                    <span className="text-2xl font-black text-amber-500">
                      {projects.filter(p => p.progress_status?.includes('รอ')).length}
                    </span>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 text-center min-w-[90px]">
                    <Text className="text-xs text-emerald-600 font-bold block">สำเร็จ</Text>
                    <span className="text-2xl font-black text-emerald-500">
                      {projects.filter(p => p.progress_status === 'สมบูรณ์').length}
                    </span>
                  </div>
                </div>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className={`relative w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${showNotifPanel ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'}`}
                  >
                    <BellOutlined className="text-xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifPanel && <NotificationPanel />}
                </div>
              </div>
            </div>

            {/* --- Filter Section --- */}
            <Card className="rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100 overflow-visible" styles={{ body: { padding: '20px 24px' } }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  size="large"
                  placeholder="ค้นหาชื่อโครงงาน หรือ ชื่อผู้จัดทำ..."
                  prefix={<SearchOutlined className="text-slate-400 mr-1" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-50 border-transparent hover:border-indigo-200 focus:border-indigo-400 transition-all"
                  allowClear
                />
                <Select
                  size="large"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  className="w-full sm:w-56 custom-select"
                  suffixIcon={<FilterOutlined className="text-slate-400" />}
                  dropdownStyle={{ borderRadius: '12px' }}
                >
                  <Option value="ทั้งหมด">สถานะทั้งหมด</Option>
                  <Option value="รออนุมัติหัวข้อ">🕐 รออนุมัติหัวข้อ</Option>
                  <Option value="กำลังทำ">🔄 กำลังดำเนินการ</Option>
                  <Option value="รออนุมัติเล่ม">📋 รออนุมัติเล่ม</Option>
                  <Option value="สมบูรณ์">✅ สมบูรณ์</Option>
                </Select>
              </div>
              {filteredProjects.length > 0 && !loading && (
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <SearchOutlined />พบ <strong className="text-indigo-500">{filteredProjects.length}</strong> โครงงาน
                </p>
              )}
            </Card>

            {/* --- Content Section --- */}
            {loading ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
                <Spin size="large" />
                <div className="mt-4 text-slate-500 font-medium">กำลังโหลดข้อมูลโครงงาน...</div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl py-16 border border-dashed border-slate-200 text-center">
                <Empty description={<span className="text-slate-400">ไม่พบข้อมูลโครงงาน</span>} />
              </div>
            ) : (
              <>
                {/* Mobile Cards (xs-md) */}
                <div className="grid grid-cols-1 gap-4 lg:hidden">
                  {filteredProjects.map(p => <ProjectCard key={p.project_id} r={p} />)}
                </div>

                {/* Desktop Table (lg+) */}
                <Card className="hidden lg:block rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden" styles={{ body: { padding: '24px' } }}>
                  <Table
                    columns={columns}
                    dataSource={filteredProjects}
                    rowKey="project_id"
                    pagination={{ pageSize: 10, className: 'px-4 pt-2' }}
                    className="custom-table"
                    rowClassName="hover:bg-indigo-50/20 transition-colors"
                  />
                </Card>
              </>
            )}
          </div>
        </Content>
      </Layout>

      {/* --- Drawer รายละเอียด --- */}
      <Drawer
        title={
          <div className="font-black text-slate-800 flex items-center gap-2 text-base sm:text-lg">
            <AuditOutlined className="text-indigo-500" />
            รายละเอียดและการส่งงาน
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 760}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="custom-drawer"
        closeIcon={<CloseOutlined className="text-slate-500 hover:text-red-500 transition-colors" />}
      >
        {selectedProject && (
          <div className="space-y-6 pb-10 animate-fade-in">

            {/* 📝 Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-5"><AuditOutlined style={{ fontSize: 120 }} /></div>
              <Title level={4} className="!mt-0 !mb-4 text-indigo-900 leading-snug">{selectedProject.title_th}</Title>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <div className="bg-white/70 p-3 rounded-xl"><b className="text-slate-500">ผู้จัดทำ:</b> <span className="ml-1 font-semibold">{selectedProject.student_name || selectedProject.creator_name || 'ไม่ระบุ'}</span></div>
                <div className="bg-white/70 p-3 rounded-xl"><b className="text-slate-500">อัปเดต:</b> <span className="ml-1 text-indigo-600 font-semibold">{formatFullDate(selectedProject.updated_at || selectedProject.created_at)}</span></div>
                <div className="bg-white/70 p-3 rounded-xl flex items-center gap-2"><b className="text-slate-500">สถานะ:</b> {getStatusBadge(selectedProject.progress_status)}</div>
                <div className="bg-white/70 p-3 rounded-xl flex items-center gap-2">
                  <b className="text-slate-500">หมวดหมู่:</b>
                  <Tag color={getCategoryLabel(selectedProject.category).color} className="m-0">{getCategoryLabel(selectedProject.category).label}</Tag>
                </div>
              </div>
            </div>

            {/* 📂 Attached Files */}
            <div>
              <Title level={5} className="flex items-center gap-2 text-slate-800 mb-3">
                <CheckCircleOutlined className="text-emerald-500" /> ไฟล์งานและลิงก์แนบ
              </Title>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'pdf_file_path', icon: <FilePdfOutlined />, label: 'เอกสาร PDF', color: 'red', bg: 'bg-red-50', border: 'border-red-100', btnText: 'เปิดดูไฟล์', btnClass: 'danger', href: selectedProject.pdf_file_path ? getFileUrl(selectedProject.pdf_file_path) : null },
                  { key: 'drive_url', icon: <GoogleOutlined />, label: 'Google Drive', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-100', btnText: 'เปิดลิงก์', btnClass: 'primary', href: selectedProject.drive_url },
                  { key: 'video_url', icon: <YoutubeOutlined />, label: 'YouTube Video', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-100', btnText: 'ดูวิดีโอ', btnClass: 'danger', href: selectedProject.video_url },
                  { key: 'github_url', icon: <GithubOutlined />, label: 'GitHub Repository', color: 'slate', bg: 'bg-slate-50', border: 'border-slate-200', btnText: 'เปิด Repo', btnClass: 'default', href: selectedProject.github_url },
                ].map(item => (
                  <div key={item.key} className={`flex items-center justify-between p-4 ${item.bg} rounded-xl border ${item.border} hover:shadow-sm transition-shadow`}>
                    <div className={`flex items-center gap-3 font-semibold text-sm`}>
                      <div className="bg-white p-2.5 rounded-xl shadow-sm text-lg">{item.icon}</div>
                      {item.label}
                    </div>
                    {item.href ? (
                      <Button
                        type={item.btnClass}
                        danger={item.btnClass === 'danger'}
                        size="middle"
                        shape="round"
                        className="font-semibold px-4"
                        href={item.href}
                        target="_blank"
                      >
                        {item.btnText}
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100">ไม่มีไฟล์</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 💬 Feedback */}
            <div>
              <Title level={5} className="flex items-center gap-2 text-slate-800 mb-3">
                <ExclamationCircleOutlined className="text-amber-500" /> ข้อเสนอแนะจากอาจารย์
              </Title>
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 min-h-[100px]">
                {feedback ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap m-0 leading-relaxed">{feedback}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-400 opacity-70">
                    <AuditOutlined className="text-3xl mb-2" />
                    <p className="italic text-sm m-0">ยังไม่มีข้อเสนอแนะในขณะนี้</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* --- Global Styles --- */}
      <style>{`
        /* Notification panel animation */
        .notif-panel {
          animation: slideDown 0.2s ease-out;
          transform-origin: top right;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Table */
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          padding: 14px 16px !important;
          color: #475569 !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 16px !important;
          vertical-align: top;
        }
        .custom-table .ant-table {
          border-radius: 16px;
          overflow: hidden;
        }

        /* Steps */
        .custom-steps .ant-steps-item-title { line-height: 20px !important; }
        .custom-steps .ant-steps-item-tail::after { background-color: #e2e8f0 !important; }

        /* Select */
        .custom-select .ant-select-selector {
          border-radius: 12px !important;
          align-items: center;
          background-color: #f8fafc !important;
          border: 1px solid transparent !important;
          transition: all 0.25s ease;
          height: 40px !important;
        }
        .custom-select:hover .ant-select-selector {
          background-color: #fff !important;
          border-color: #c7d2fe !important;
        }

        /* Drawer */
        .custom-drawer .ant-drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-drawer .ant-drawer-body {
          padding: 24px;
          background-color: #fafbfc;
        }
        @media (max-width: 640px) {
          .custom-drawer .ant-drawer-body { padding: 16px; }
        }

        /* Fade in animation */
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile touch improvements */
        @media (max-width: 1024px) {
          .ant-table { display: none !important; }
        }

        /* Bell pulse */
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>
    </Layout>
  );
};

export default ProjectArchive;