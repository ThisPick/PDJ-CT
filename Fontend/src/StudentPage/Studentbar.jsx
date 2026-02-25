import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Avatar, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  RocketOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOpenOutlined,
  FileAddOutlined // ✅ เพิ่มไอคอนนี้เข้ามาใหม่
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService } from '../services/userService';

const { Sider } = Layout;
const { Text } = Typography;

const getAvatarUrl = (fileName) => {
  if (!fileName || fileName === 'null' || fileName === 'undefined') return null;
  if (fileName.startsWith('http')) return fileName;

  let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;
  return `${baseUrl}/uploads/profiles/${cleanFileName}`;
};

const Studentbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const [userData, setUserData] = useState({
    full_name: 'กำลังโหลด...',
    role: 'student',
    avatar_url: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const userId = savedUser.id || savedUser.userId;

        if (userId) {
          const res = await userService.getProfile(userId);
          const data = res.data?.data || res.data;
          setUserData({
            full_name: data.full_name || 'ไม่ระบุชื่อ',
            role: data.role || 'student',
            avatar_url: getAvatarUrl(data.profile_img)
          });
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      if (userService?.logout) await userService.logout();
    } catch (err) {
      console.warn('Logout error', err);
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login';
  };

  const getRoleLabel = (role) => {
    const roles = {
      department_head: 'หัวหน้าแผนกวิชา',
      teacher: 'อาจารย์ผู้สอน',
      student: 'นักศึกษา'
    };
    return roles[role] || role || '-';
  };

  const rawMenuItems = [
    { key: '/StudentDashboard', icon: <DashboardOutlined />, label: 'หน้าหลัก' },
    {
      type: 'group',
      label: !collapsed ? 'โครงงานของฉัน' : null,
      children: [
        // ✅ แก้ไข: เปลี่ยนไอคอนจาก <Projectsubmit /> เป็น <FileAddOutlined />
        { key: '/Projectsubmit', icon: <FileAddOutlined />, label: 'เสนอหัวข้อโครงงาน' },
        
      ],
    },
    {
      type: 'group',
      label: !collapsed ? 'จัดการบัญชี' : null,
      children: [
        { key: '/Studentprofile', icon: <UserOutlined />, label: 'จัดการโปรไฟล์' }, 
      ],
    },
    {
      type: 'group',
      label: !collapsed ? 'แหล่งเรียนรู้' : null,
      children: [
        { key: '/ProjectArchive', icon: <FolderOpenOutlined />, label: 'คลังโครงงานทั้งหมด' },
      ],
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', danger: true },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
      }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={280}
        theme="light"
        className="h-screen sticky top-0 left-0 border-r border-slate-200 shadow-sm z-50 bg-white"
        style={{ background: '#ffffff' }}
        trigger={
          <div className="border-t border-slate-100 w-full bg-white hover:text-indigo-600 transition-colors flex items-center justify-center h-[48px]">
            {collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
          </div>
        }
      >
        <div className="flex flex-col h-full bg-white">
          
          {/* Logo Section */}
          <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'gap-3'} transition-all duration-300`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
              <RocketOutlined className="text-white text-xl" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <Text className="text-lg font-black text-slate-800 block leading-tight">ระบบบันทึกโปรเจค</Text>
                <Text className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">นักศึกษา</Text>
              </div>
            )}
          </div>

          {/* Menu Section */}
          <div className="flex-grow overflow-y-auto custom-scrollbar px-3">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={rawMenuItems}
              onClick={(e) => e.key === 'logout' ? handleLogout() : navigate(e.key)}
              className="border-none pb-4"
            />
          </div>

          {/* User Profile Section (Bottom) */}
          <div className="p-4 bg-white border-t border-slate-100 mt-auto">
            <div 
              onClick={() => navigate('/Studentprofile')} 
              className={`bg-slate-50 rounded-2xl flex items-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer ${collapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}
            >
              <Avatar
                size={collapsed ? 36 : 44}
                src={userData.avatar_url}
                className="bg-indigo-600 text-white font-bold flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center"
              >
                {!userData.avatar_url && (userData.full_name !== 'กำลังโหลด...' ? userData.full_name.charAt(0).toUpperCase() : <UserOutlined />)}
              </Avatar>
              
              {!collapsed && (
                <div className="overflow-hidden w-full">
                  <Text className="text-[14px] font-bold text-slate-800 block truncate">
                    {userData.full_name}
                  </Text>
                  <Text className="text-[12px] text-indigo-500 font-semibold block truncate">
                    {getRoleLabel(userData.role)}
                  </Text>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ✅ Global Styles แก้ไขเอา jsx="true" ออก */}
        <style>{`
          .ant-layout-sider-children {
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: #ffffff;
          }

          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          
          .ant-menu-item {
            height: 48px !important;
            display: flex !important;
            align-items: center !important;
            margin-bottom: 4px !important;
            border-radius: 12px !important;
          }
          .ant-menu-item .ant-menu-title-content {
            font-size: 15px !important;
            font-weight: 500 !important;
            margin-inline-start: 12px !important;
          }
          .ant-menu-item .anticon {
            font-size: 18px !important;
          }
          .ant-menu-item-selected {
            background-color: #f5f3ff !important;
            color: #4f46e5 !important;
            font-weight: 700 !important;
          }
          .ant-menu-item-group-title {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #94a3b8 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding-top: 16px !important;
          }
        `}</style>
      </Sider>
    </ConfigProvider>
  );
};

export default Studentbar;