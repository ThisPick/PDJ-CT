import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Card, Row, Col, Statistic, Table, Tag, Typography, 
  Space, Button, Avatar, Input, Select, Switch, Modal, Descriptions, Badge, Spin, message, notification, Steps
} from 'antd';
import { 
  ProjectOutlined, RocketOutlined, CodeOutlined, UserOutlined, 
  SearchOutlined, ReloadOutlined, TrophyFilled, BulbOutlined,
  TeamOutlined, FormOutlined, ToolOutlined, FundProjectionScreenOutlined, BookOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// ✅ ดึง API Service และ Sidebar มาให้ถูกต้อง
import { getAllProjects } from '../services/projectService';
import { userService } from '../services/userService'; // สำหรับดึงรูปโปรไฟล์
import StudentSidebar from '../StudentPage/Studentbar'; 

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- Colors & Theme ---
const STATUS_COLORS = {
  'สมบูรณ์': '#10b981', 
  'กำลังทำ': '#3b82f6', 
  'รออนุมัติหัวข้อ': '#f59e0b', 
  'รออนุมัติเล่ม': '#f59e0b', 
  'ล่าช้า': '#ef4444', 
  'ไม่ผ่าน': '#ef4444'
};

// --- Sound Effects ---
const SOUND_NOTIFY = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const SOUND_CLICK = 'https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3';

// --- Security: Helper สำหรับรูปภาพโปรไฟล์ ---
const getAvatarUrl = (fileName) => {
  if (!fileName || fileName === 'null' || fileName === 'undefined') return null;
  if (fileName.startsWith('http')) return fileName;

  let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;
  
  if (cleanFileName.includes('..')) return null;
  return `${baseUrl}/uploads/profiles/${cleanFileName}`;
};

export const StudentDashboard = () => {
  const [user, setUser] = useState({ full_name: "กำลังโหลด...", role: "student", profile_img: null });
  const [rawProjects, setRawProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [api, contextHolder] = notification.useNotification();
  const prevProjectCount = useRef(null); 
  
  const audioNotify = useRef(new Audio(SOUND_NOTIFY));
  const audioClick = useRef(new Audio(SOUND_CLICK));

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterAdvisor, setFilterAdvisor] = useState(null);
  const [filterFeatured, setFilterFeatured] = useState(false);

  // Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // ดึงข้อมูล User (และรูปโปรไฟล์ล่าสุดจาก API)
  useEffect(() => {
    const loadUserData = async () => {
      const savedUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (savedUserStr) {
        try { 
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser); // โชว์ข้อมูลเบื้องต้นไปก่อน

          const userId = parsedUser.id || parsedUser.userId;
          if (userId && userService?.getProfile) {
            const res = await userService.getProfile(userId);
            const latestData = res.data?.data || res.data;
            if (latestData) {
              setUser(prev => ({
                ...prev,
                ...latestData,
                full_name: latestData.full_name || latestData.username || prev.full_name
              }));
              localStorage.setItem('user', JSON.stringify(latestData));
            }
          }
        } catch (e) { 
          console.error("User data fetch error:", e); 
        }
      }
    };

    loadUserData();
    fetchData(true);

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsRefreshing(true);
    
    try {
      // ✅ เปลี่ยนจาก projectService.getAll() เป็น getAllProjects()
      const response = await getAllProjects();
      
      // ✅ ปรับการแกะข้อมูลให้เสถียรเหมือนหน้า Archive
      let data = [];
      if (Array.isArray(response)) {
        data = response; 
      } else if (response && Array.isArray(response.data)) {
        data = response.data; 
      } else if (response && response.data && Array.isArray(response.data.data)) {
        data = response.data.data; 
      }

      if (!data || data.length === 0) {
        setRawProjects([]);
        setFilteredProjects([]);
        return;
      }

      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (prevProjectCount.current !== null && sortedData.length > prevProjectCount.current) {
        const newCount = sortedData.length - prevProjectCount.current;
        const notifKey = `new_project_alert_${Date.now()}`;
        
        audioNotify.current.play().catch(e => console.log('Audio autoplay prevented:', e));

        api.info({
          key: notifKey,
          message: <span className="text-2xl font-black text-indigo-700">มีผลงานใหม่เข้าสู่ระบบ! 🎉</span>,
          description: <span className="text-xl text-slate-600 block mt-2 hover:text-indigo-500 transition-colors">เพื่อนๆ อัปโหลดโครงงานใหม่จำนวน {newCount} รายการ ลองเข้าไปดูไอเดียได้เลย <b>(คลิกเพื่อรับทราบ)</b></span>,
          placement: 'topRight',
          duration: 0,
          icon: <BulbOutlined className="text-4xl text-yellow-500 animate-bounce" />,
          className: 'cursor-pointer hover:scale-105 transition-transform duration-300',
          style: { 
            borderRadius: '24px', 
            padding: '24px 32px', 
            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)', 
            border: '2px solid #8b5cf6',
            background: 'linear-gradient(to right, #ffffff, #f5f3ff)'
          },
          onClick: () => {
            audioClick.current.play().catch(e => console.log('Audio play error:', e));
            api.destroy(notifKey);
          }
        });
      }
      prevProjectCount.current = sortedData.length;

      setRawProjects(sortedData);
    } catch (error) {
      console.error("Fetch error:", error);
      if (showLoading) message.error({ content: <span className="text-xl">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</span> });
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    let result = rawProjects;
    
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(p => 
        (p.title_th && p.title_th.toLowerCase().includes(lower)) || 
        (p.student_name && p.student_name.toLowerCase().includes(lower)) ||
        (p.creator_name && p.creator_name.toLowerCase().includes(lower))
      );
    }
    
    if (filterAcademicYear) result = result.filter(p => String(p.academic_year) === String(filterAcademicYear));
    if (filterCategory) result = result.filter(p => p.category === filterCategory);
    if (filterAdvisor) result = result.filter(p => p.advisor === filterAdvisor);
    if (filterFeatured) result = result.filter(p => p.is_featured === 1 || p.is_featured === true);
    
    setFilteredProjects(result);
  }, [searchText, filterAcademicYear, filterCategory, filterAdvisor, filterFeatured, rawProjects]);

  const clearFilters = () => {
    setSearchText('');
    setFilterAcademicYear(null);
    setFilterCategory(null);
    setFilterAdvisor(null);
    setFilterFeatured(false);
  };

  const totalProjects = filteredProjects.length;
  const pendingProjects = filteredProjects.filter(p => p.progress_status?.includes('รอ')).length;
  const completedProjects = filteredProjects.filter(p => p.progress_status === 'สมบูรณ์').length;
  const featuredProjects = filteredProjects.filter(p => p.is_featured === 1 || p.is_featured === true).length;

  const uniqueAcademicYears = [...new Set(rawProjects.map(p => p.academic_year).filter(Boolean))].sort((a, b) => b - a);
  const uniqueCategories = [...new Set(rawProjects.map(p => p.category).filter(Boolean))];
  const uniqueAdvisors = [...new Set(rawProjects.map(p => p.advisor).filter(Boolean))];

  const columns = [
    {
      title: <span className="text-2xl font-bold">ชื่อโครงงาน</span>,
      dataIndex: 'title_th',
      key: 'title_th',
      width: '30%',
      render: (text, record) => (
        <div className="py-2">
          <Text strong className="text-2xl text-slate-800 block mb-2">{text}</Text>
          <Text type="secondary" className="text-xl">ผู้จัดทำ: {record.student_name || record.creator_name || 'ไม่ระบุชื่อ'}</Text>
          {record.is_featured ? <Tag color="gold" className="ml-3 text-lg px-3 py-1 border-0 animate-pulse shadow-sm"><TrophyFilled /> ชิ้นงานยอดเยี่ยม</Tag> : null}
        </div>
      ),
    },
    {
      title: <span className="text-2xl font-bold">ปีการศึกษา</span>,
      dataIndex: 'academic_year',
      key: 'academic_year',
      align: 'center',
      render: (text) => <span className="text-xl font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{text || '-'}</span>,
    },
    {
      title: <span className="text-2xl font-bold">ครูที่ปรึกษา</span>,
      dataIndex: 'advisor',
      key: 'advisor',
      render: (text) => text ? <Tag icon={<UserOutlined />} className="text-xl px-4 py-2 rounded-full bg-slate-100 border-slate-200 text-slate-700">{text}</Tag> : '-',
    },
    {
      title: <span className="text-2xl font-bold">หมวดหมู่</span>,
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag color="purple" className="text-xl px-4 py-2 border-0">{text || '-'}</Tag>,
    },
    {
      title: <span className="text-2xl font-bold">สถานะ</span>,
      dataIndex: 'progress_status',
      key: 'status',
      render: (status) => {
        const color = STATUS_COLORS[status] ? STATUS_COLORS[status].replace('#', '') : '94a3b8';
        return <Badge color={`#${color}`} text={<span className="text-xl font-bold" style={{color: `#${color}`}}>{status}</span>} />;
      },
    },
    {
      title: <span className="text-2xl font-bold text-center block">เปิดดู</span>,
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          size="large"
          className="h-14 px-6 text-xl rounded-xl transition-transform hover:scale-105"
          onClick={() => { setSelectedProject(record); setIsModalVisible(true); }}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen flex">
      {contextHolder}
      
      {/* ✅ เรียกใช้คอมโพเนนต์ Sidebar */}
      <StudentSidebar /> 
      
      <Layout className="bg-[#f8fafc]">
        <Content className="p-6 md:p-8 h-screen overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-[1600px] pb-20">
            
            {/* 🌟 Banner นักศึกษา */}
            <Card className="mb-8 rounded-3xl border-none shadow-md overflow-hidden animate-fade-in-down" styles={{ body: { padding: 0 } }}>
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-4 w-full animate-gradient-x" />
              <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
                <div className="flex items-center gap-6">
                  <Avatar 
                    size={90} 
                    src={getAvatarUrl(user.profile_img)}
                    icon={<UserOutlined />} 
                    className="bg-indigo-50 text-indigo-500 border-4 border-indigo-100 shadow-lg transform transition-transform hover:rotate-6 hover:scale-110 duration-300" 
                  />
                  <div>
                    <Title level={1} className="!m-0 text-slate-800 !font-black !text-4xl tracking-tight">
                      สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user.full_name}</span> ✌️
                    </Title>
                    <Text className="text-2xl text-slate-500 mt-2 block font-medium">
                      นักศึกษา • สำรวจไอเดียและดูภาพรวมผลงานโครงงานทั้งหมดในแผนก
                    </Text>
                  </div>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<ReloadOutlined className={isRefreshing ? 'animate-spin' : ''} />} 
                  onClick={() => fetchData(true)} 
                  className="h-16 px-8 text-2xl rounded-2xl bg-slate-800 hover:bg-indigo-600 hover:shadow-indigo-500/30 border-none shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  รีเฟรชข้อมูล
                </Button>
              </div>
            </Card>

            {/* 🌟 Unified Container 1: ภาพรวมสถิติ (รวม 4 การ์ดในกล่องเดียว) */}
            <Card 
              className="mb-8 rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden animate-slide-up animation-delay-100" 
              bodyStyle={{ padding: 0 }}
            >
              <div className="p-8 md:p-10 bg-slate-50/50">
                <div className="flex items-center gap-4 mb-8">
                   <BarChartOutlined className="text-4xl text-blue-500" />
                   <Title level={3} className="!m-0 text-slate-700 !text-3xl font-black">ภาพรวมสถิติโครงงาน</Title>
                </div>
                <Row gutter={[24, 24]}>
                   {/* กล่องที่ 1: โครงงานทั้งหมด */}
                   <Col xs={24} sm={12} lg={6}>
                      <div className="rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white p-6 h-full relative overflow-hidden">
                        <Statistic 
                          title={<span className="text-xl text-slate-500 font-bold relative z-10">โครงงานทั้งหมด</span>} 
                          value={totalProjects} 
                          valueStyle={{ fontSize: '4.5rem', fontWeight: '900', color: '#1e293b', position: 'relative', zIndex: 10 }} 
                          prefix={<ProjectOutlined className="text-blue-500 bg-blue-50 p-3 rounded-2xl mr-3" />} 
                        />
                        <ProjectOutlined className="absolute -right-4 -bottom-4 text-[120px] text-slate-50 z-0" />
                      </div>
                   </Col>
                   
                   {/* กล่องที่ 2: กำลังดำเนินการ */}
                   <Col xs={24} sm={12} lg={6}>
                      <div className="rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white p-6 h-full relative overflow-hidden">
                        <Statistic 
                          title={<span className="text-xl text-slate-500 font-bold relative z-10">กำลังดำเนินการ</span>} 
                          value={pendingProjects} 
                          valueStyle={{ fontSize: '4.5rem', fontWeight: '900', color: '#f59e0b', position: 'relative', zIndex: 10 }} 
                          prefix={<CodeOutlined className="text-orange-500 bg-orange-50 p-3 rounded-2xl mr-3" />} 
                        />
                        <CodeOutlined className="absolute -right-4 -bottom-4 text-[120px] text-slate-50 z-0" />
                      </div>
                   </Col>
                   
                   {/* กล่องที่ 3: เสร็จสมบูรณ์ */}
                   <Col xs={24} sm={12} lg={6}>
                      <div className="rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white p-6 h-full relative overflow-hidden">
                        <Statistic 
                          title={<span className="text-xl text-slate-500 font-bold relative z-10">เสร็จสมบูรณ์</span>} 
                          value={completedProjects} 
                          valueStyle={{ fontSize: '4.5rem', fontWeight: '900', color: '#10b981', position: 'relative', zIndex: 10 }} 
                          prefix={<RocketOutlined className="text-emerald-500 bg-emerald-50 p-3 rounded-2xl mr-3" />} 
                        />
                        <RocketOutlined className="absolute -right-4 -bottom-4 text-[120px] text-slate-50 z-0" />
                      </div>
                   </Col>
                   
                   {/* กล่องที่ 4: ผลงานเด่น */}
                   <Col xs={24} sm={12} lg={6}>
                      <div className="rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-purple-50 p-6 h-full relative overflow-hidden">
                        <Statistic 
                          title={<span className="text-xl text-slate-600 font-bold relative z-10">ผลงานเด่น (Hall of Fame)</span>} 
                          value={featuredProjects} 
                          valueStyle={{ fontSize: '4.5rem', fontWeight: '900', color: '#8b5cf6', position: 'relative', zIndex: 10 }} 
                          prefix={<TrophyFilled className="text-purple-500 bg-purple-100 p-3 rounded-2xl mr-3" />} 
                        />
                        <TrophyFilled className="absolute -right-4 -bottom-4 text-[120px] text-purple-100 opacity-50 z-0" />
                      </div>
                   </Col>
                </Row>
              </div>
            </Card>

            {/* 🌟 Unified Container 2: ขั้นตอน + ค้นหา + ตารางคลังโครงงาน */}
            <Card 
              className="mb-8 rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden animate-slide-up animation-delay-400" 
              bodyStyle={{ padding: 0 }}
            >
              
              {/* --- Section 1: ขั้นตอนการปฏิบัติตัวในการทำโปรเจค --- */}
              <div className="p-8 md:p-10 border-b border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                   <BulbOutlined className="text-4xl text-yellow-500" />
                   <Title level={3} className="!m-0 text-slate-700 !text-3xl font-black">ขั้นตอนและแนวปฏิบัติในการทำโครงงาน</Title>
                </div>
                <Steps
                  className="custom-steps px-4"
                  current={-1}
                  items={[
                    {
                      title: <span className="text-xl font-bold text-slate-700">1. คิดหัวข้อ & รวมกลุ่ม</span>,
                      description: <span className="text-base text-slate-500">รวมกลุ่มเพื่อน คิดไอเดียสร้างสรรค์ และหาข้อมูลเบื้องต้น</span>,
                      icon: <div className="bg-blue-50 text-blue-500 rounded-full w-14 h-14 flex items-center justify-center shadow-sm"><TeamOutlined /></div>,
                    },
                    {
                      title: <span className="text-xl font-bold text-slate-700">2. เสนอหัวข้อโครงงาน</span>,
                      description: <span className="text-base text-slate-500">ยื่นเสนอหัวข้อผ่านระบบ และรอรับการอนุมัติจากที่ปรึกษา</span>,
                      icon: <div className="bg-orange-50 text-orange-500 rounded-full w-14 h-14 flex items-center justify-center shadow-sm"><FormOutlined /></div>,
                    },
                    {
                      title: <span className="text-xl font-bold text-slate-700">3. พัฒนา & รายงาน 50%</span>,
                      description: <span className="text-base text-slate-500">ลงมือพัฒนาชิ้นงาน และรายงานความคืบหน้าแก่อาจารย์ผู้สอน</span>,
                      icon: <div className="bg-emerald-50 text-emerald-500 rounded-full w-14 h-14 flex items-center justify-center shadow-sm"><ToolOutlined /></div>,
                    },
                    {
                      title: <span className="text-xl font-bold text-slate-700">4. สอบป้องกัน 100%</span>,
                      description: <span className="text-base text-slate-500">นำเสนอผลงานและระบบฉบับสมบูรณ์ต่อหน้าคณะกรรมการ</span>,
                      icon: <div className="bg-purple-50 text-purple-500 rounded-full w-14 h-14 flex items-center justify-center shadow-sm"><FundProjectionScreenOutlined /></div>,
                    },
                    {
                      title: <span className="text-xl font-bold text-slate-700">5. ส่งเล่ม & เผยแพร่</span>,
                      description: <span className="text-base text-slate-500">ส่งเอกสารปริญญานิพนธ์และเผยแพร่ผลงานลงคลังโครงงาน</span>,
                      icon: <div className="bg-pink-50 text-pink-500 rounded-full w-14 h-14 flex items-center justify-center shadow-sm"><BookOutlined /></div>,
                    },
                  ]}
                />
              </div>

              {/* --- Section 2: ค้นหาคลังโครงงาน --- */}
              <div className="p-8 md:p-10 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                   <SearchOutlined className="text-4xl text-blue-500" />
                   <Title level={3} className="!m-0 text-slate-700 !text-3xl font-black">ค้นหาคลังโครงงาน</Title>
                </div>
                
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} md={6}>
                    <Text strong className="block mb-3 text-2xl text-slate-600">พิมพ์คำค้นหา</Text>
                    <Input size="large" placeholder="ชื่อโครงงาน, ชื่อนักศึกษา..." value={searchText} onChange={e => setSearchText(e.target.value)} className="h-16 rounded-2xl text-2xl border-slate-300 shadow-inner" allowClear />
                  </Col>
                  <Col xs={24} md={3}>
                    <Text strong className="block mb-3 text-2xl text-slate-600">ปีการศึกษา</Text>
                    <Select size="large" className="w-full h-16 text-2xl custom-select" placeholder="ทุกปี" value={filterAcademicYear} onChange={setFilterAcademicYear} dropdownStyle={{ padding: '8px' }} allowClear>
                      {uniqueAcademicYears.map(year => <Option key={year} value={year} className="text-xl p-3">{year}</Option>)}
                    </Select>
                  </Col>
                  <Col xs={24} md={4}>
                    <Text strong className="block mb-3 text-2xl text-slate-600">หมวดหมู่</Text>
                    <Select size="large" className="w-full h-16 text-2xl custom-select" placeholder="ทุกหมวดหมู่" value={filterCategory} onChange={setFilterCategory} dropdownStyle={{ padding: '8px' }} allowClear>
                      {uniqueCategories.map(cat => <Option key={cat} value={cat} className="text-xl p-3">{cat}</Option>)}
                    </Select>
                  </Col>
                  <Col xs={24} md={5}>
                    <Text strong className="block mb-3 text-2xl text-slate-600">ครูที่ปรึกษา</Text>
                    <Select size="large" className="w-full h-16 text-2xl custom-select" placeholder="ทุกคน" value={filterAdvisor} onChange={setFilterAdvisor} dropdownStyle={{ padding: '8px' }} allowClear>
                      {uniqueAdvisors.map(adv => <Option key={adv} value={adv} className="text-xl p-3">{adv}</Option>)}
                    </Select>
                  </Col>
                  <Col xs={24} md={4}>
                     <Text strong className="block mb-3 text-2xl text-purple-600"><TrophyFilled /> เฉพาะผลงานเด่น</Text>
                     <Switch checked={filterFeatured} onChange={setFilterFeatured} className={`custom-switch shadow-inner ${filterFeatured ? 'bg-purple-500' : 'bg-slate-300'}`} />
                  </Col>
                  <Col xs={24} md={2} className="flex items-end">
                     <Button size="large" onClick={clearFilters} className="w-full h-16 rounded-2xl text-2xl text-slate-600 border-slate-300 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all">ล้าง</Button>
                  </Col>
                </Row>
              </div>

              {/* --- Section 3: ตารางคลังโครงงานทั้งหมด --- */}
              <div>
                <div className="p-8 md:p-10 pb-0 flex items-center gap-4 mb-4">
                   <ProjectOutlined className="text-4xl text-indigo-500" /> 
                   <Title level={3} className="!m-0 text-slate-700 !text-3xl font-black">คลังโครงงานทั้งหมด</Title>
                </div>
                {loading && !isRefreshing ? (
                    <div className="py-20 text-center"><Spin size="large" /><div className="mt-6 text-2xl text-slate-500 font-bold">กำลังโหลดข้อมูล...</div></div>
                ) : (
                    <Table 
                      columns={columns} 
                      dataSource={filteredProjects} 
                      rowKey="project_id"
                      pagination={{ pageSize: 10, className: 'custom-pagination px-8 md:px-10 pb-8', showSizeChanger: false }} 
                      rowClassName="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onRow={(record) => ({ onClick: () => { setSelectedProject(record); setIsModalVisible(true); } })}
                    />
                )}
              </div>
            </Card>

          </div>
        </Content>
      </Layout>

      {/* Modal ดูรายละเอียด */}
      <Modal
        title={
            <div className="flex items-center gap-4 text-3xl font-black text-slate-800 border-b pb-6 mt-2">
                <ProjectOutlined className="text-blue-600" /> รายละเอียดโครงงาน
            </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
            <Button key="close" size="large" type="primary" className="h-16 px-12 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" onClick={() => setIsModalVisible(false)}>ปิดหน้าต่าง</Button>
        ]}
        width={1000}
        centered
        styles={{ body: { padding: '32px 0' } }}
        className="modal-animation"
      >
        {selectedProject && (
            <div className="px-8 space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden shadow-inner">
                    <div className="absolute -right-10 -top-10 text-blue-100 opacity-50 transform rotate-12">
                        <BulbOutlined style={{ fontSize: '200px' }} />
                    </div>
                    {selectedProject.is_featured ? <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 font-black text-xl px-8 py-3 rounded-bl-3xl shadow-md z-10 animate-pulse"><TrophyFilled/> ผลงานยอดเยี่ยม</div> : null}
                    
                    <div className="relative z-10">
                        <Title level={2} className="!m-0 text-blue-900 !text-4xl leading-tight font-black">{selectedProject.title_th}</Title>
                        <Text className="text-2xl text-blue-500 block mt-3 font-bold">{selectedProject.title_en}</Text>
                    </div>
                </div>

                <Descriptions column={2} bordered size="middle" 
                    labelStyle={{ width: '220px', fontSize: '22px', fontWeight: '900', background: '#f8fafc', color: '#475569', padding: '28px' }} 
                    contentStyle={{ fontSize: '22px', color: '#1e293b', padding: '28px', fontWeight: '600' }}
                    className="shadow-sm rounded-2xl overflow-hidden border border-slate-200"
                >
                    <Descriptions.Item label="ผู้จัดทำ" span={2}>
                        <UserOutlined className="mr-3 text-blue-500 text-2xl" /> {selectedProject.student_name || selectedProject.creator_name || 'ไม่ระบุชื่อ'}
                    </Descriptions.Item>
                    <Descriptions.Item label="ที่ปรึกษา">
                        {selectedProject.advisor || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="หมวดหมู่">
                        <Tag color="purple" className="text-xl px-5 py-2 rounded-xl">{selectedProject.category || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="ระดับชั้น">
                        {selectedProject.project_level || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="ปีการศึกษา">
                        <span className="text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{selectedProject.academic_year || '-'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะปัจจุบัน" span={2}>
                        <Badge 
                            color={STATUS_COLORS[selectedProject.progress_status] ? STATUS_COLORS[selectedProject.progress_status] : '#94a3b8'} 
                            text={<span className="text-3xl font-black ml-3 tracking-wide">{selectedProject.progress_status || 'ไม่ระบุ'}</span>} 
                        />
                    </Descriptions.Item>
                </Descriptions>
            </div>
        )}
      </Modal>

      <style jsx="true">{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gradientX { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .animate-fade-in-down { animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.8s ease-in-out forwards; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradientX 4s ease infinite; }
        
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-700 { animation-delay: 0.7s; }

        .custom-scrollbar::-webkit-scrollbar { width: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .ant-table-thead > tr > th { background: #f8fafc !important; color: #334155 !important; padding: 28px 24px !important; border-bottom: 2px solid #e2e8f0 !important; }
        .ant-table-tbody > tr > td { padding: 28px 24px !important; }
        .ant-table-tbody > tr { transition: all 0.3s ease !important; }
        .ant-table-tbody > tr:hover { transform: scale(1.005) translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); z-index: 10; position: relative; }

        .custom-pagination { padding-right: 40px; padding-bottom: 32px; padding-top: 24px; }
        .custom-pagination .ant-pagination-item, .custom-pagination .ant-pagination-prev, .custom-pagination .ant-pagination-next { min-width: 48px !important; height: 48px !important; line-height: 48px !important; font-size: 20px !important; border-radius: 12px; }
        .custom-select .ant-select-selector { align-items: center !important; border-radius: 16px !important; box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05); }
        .ant-select-item-option-content { font-size: 20px !important; padding: 10px 0; font-weight: 500; }
        .custom-switch { min-width: 70px !important; height: 36px !important; }
        .custom-switch .ant-switch-handle { width: 30px !important; height: 30px !important; top: 3px !important; }
        .custom-switch.ant-switch-checked .ant-switch-handle { inset-inline-start: calc(100% - 33px) !important; }

        .modal-animation .ant-modal-content { border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

        /* CSS สำหรับตัว Steps */
        .custom-steps .ant-steps-item-title { font-size: 20px !important; font-weight: 700 !important; margin-top: 8px !important; }
        .custom-steps .ant-steps-item-description { font-size: 16px !important; line-height: 1.5; padding-right: 16px; }
        .custom-steps .ant-steps-item-icon { width: 56px !important; height: 56px !important; margin: 0 auto; border: none !important; background: transparent !important; }
        .custom-steps .ant-steps-item-icon svg { font-size: 24px; }
        .custom-steps .ant-steps-item-tail { top: 28px !important; padding: 0 24px !important; }
        .custom-steps .ant-steps-item-tail::after { height: 2px !important; background-color: #e2e8f0 !important; }
      `}</style>
    </Layout>
  );
};

export default StudentDashboard;