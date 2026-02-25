import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Tag, Avatar, message, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  SolutionOutlined,
  StarOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  ProjectFilled,
  AuditOutlined,
  BarChartOutlined,
  SafetyCertificateFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined
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

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const [userData, setUserData] = useState({
    id: null,
    full_name: 'กำลังโหลด...',
    role: '',
    avatar_url: null
  });

  useEffect(() => {
    const syncUserData = async () => {
      try {
        const savedUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        const userId = savedUser?.id || savedUser?.userId;

        if (userId) {
          const res = await userService.getProfile(userId);
          const latestData = res.data?.data || res.data;

          if (latestData) {
            if (latestData.status === 'inactive') {
              message.error('บัญชีของคุณถูกระงับการใช้งาน');
              handleLogout();
              return;
            }

            setUserData({
              id: latestData.id,
              full_name: latestData.full_name || 'User',
              role: latestData.role,
              avatar_url: getAvatarUrl(latestData.profile_img)
            });

            sessionStorage.setItem('user', JSON.stringify(latestData));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        const savedUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (savedUserStr) {
          const saved = JSON.parse(savedUserStr);
          setUserData(prev => ({
            ...prev,
            full_name: saved.full_name,
            role: saved.role,
            avatar_url: getAvatarUrl(saved.profile_img)
          }));
        }
      }
    };

    syncUserData();
  }, [location.pathname]);

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
    { key: '/Admindashboard', icon: <DashboardOutlined />, label: 'หน้าหลัก' },
    {
      type: 'group',
      label: !collapsed ? 'การจัดการและอนุมัติ' : null,
      children: [
        {
          key: '/ApproveProject',
          icon: <SafetyCertificateFilled />,
          label: 'อนุมัติหัวข้อโครงงาน',
          hidden: userData.role !== 'department_head'
        },
        { key: '/ProjectSTD', icon: <StarOutlined />, label: 'จัดการโครงงานนักศึกษา' },
      ],
    },
    {
      type: 'group',
      label: !collapsed ? 'การประเมินผล' : null,
      children: [
        { key: '/EvaluationPage', icon: <SolutionOutlined />, label: 'บันทึกคะแนนประเมิน' },
        { key: '/Adminpage/Milestone', icon: <AuditOutlined />, label: 'ติดตาม Milestone' },
      ],
    },
    {
      type: 'group',
      label: !collapsed ? 'ตั้งค่าและรายงาน' : null,
      children: [
        { key: '/RubricSettings', icon: <SettingOutlined />, label: 'ตั้งค่าเกณฑ์ประเมิน' },
        {
          key: '/ManageUsers',
          icon: <UserOutlined />,
          label: 'จัดการผู้ใช้งาน',
          hidden: userData.role !== 'department_head'
        }
      ],
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', danger: true },
  ];

  const filterMenuItems = (items) => {
    return items.reduce((acc, item) => {
      if (item.hidden) return acc;
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  return (
    <>
      <style>{`
        /* ปรับแต่ง Scrollbar สำหรับเมนู */
        .custom-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .menu-container::-webkit-scrollbar {
          width: 4px;
        }
        .menu-container::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        .ant-menu-item:hover, 
        .ant-menu-submenu-title:hover {
           background-color: #eff6ff !important;
           color: #2563eb !important;
           border-radius: 8px !important;
        }
        
        .ant-menu-item-selected {
           background-color: #e0e7ff !important;
           color: #4338ca !important;
           font-weight: 600;
           border-radius: 8px !important;
        }

        .ant-menu-light.ant-menu-root.ant-menu-vertical,
        .ant-menu-light.ant-menu-root.ant-menu-inline {
            border-inline-end: none !important;
        }

        .ant-layout-sider-trigger {
            background: #f8fafc !important;
            color: #64748b !important;
            border-top: 1px solid #f1f5f9;
        }
      `}</style>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth="80"
        width={280}
        theme="light"
        className="custom-sider shadow-xl h-screen sticky top-0 left-0 z-50 border-r border-slate-100"
      >
        {/* Logo Section */}
        <div className={`p-6 flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <ProjectFilled className="text-white text-xl" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-sm font-black text-slate-800 leading-tight tracking-tight">
                ระบบบันทึกโปรเจคนักเรียน
              </h1>
              <Tag color="blue" className="text-[9px] px-1 py-0 m-0 border-none font-bold uppercase">
                หน้าแอดมินเด้อ
              </Tag>
            </div>
          )}
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto menu-container px-3">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filterMenuItems(rawMenuItems)}
            onClick={(e) => e.key === 'logout' ? handleLogout() : navigate(e.key)}
            className="border-none font-medium"
          />
        </div>

        {/* Fixed User Profile Section */}
        <div className="p-4 bg-white border-t border-slate-50 mt-auto">
          <div className={`bg-slate-50 rounded-2xl flex items-center transition-all duration-300 shadow-sm border border-slate-100 hover:bg-slate-100 cursor-pointer ${collapsed ? 'p-1 justify-center' : 'p-3 gap-3'}`}>
            <Avatar
              size={collapsed ? 32 : 40}
              src={userData.avatar_url}
              className="bg-indigo-600 text-white font-bold flex-shrink-0 border-2 border-white shadow-sm"
            >
              {!userData.avatar_url && (userData.full_name !== 'กำลังโหลด...' ? userData.full_name.charAt(0).toUpperCase() : <UserOutlined />)}
            </Avatar>
            
            {!collapsed && (
              <div className="overflow-hidden w-full">
                <Text className="text-[12px] font-bold text-slate-800 block truncate">
                  {userData.full_name}
                </Text>
                <Text className="text-[10px] text-slate-400 block truncate italic">
                  {getRoleLabel(userData.role)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </Sider>
    </>
  );
};

export default AdminSidebar;