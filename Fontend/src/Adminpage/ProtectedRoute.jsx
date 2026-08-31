import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();

  // ✅ 1. ดึง Token และข้อมูล User จาก LocalStorage
  const token    = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  let user = null;
  try {
    if (userData) user = JSON.parse(userData);
  } catch (e) {
    console.error('ข้อมูล User เสียหาย, ทำการลบออกจากระบบ...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ✅ 2. หน้าแรกของแต่ละ Role
  const getHomePath = (role) => {
    if (role === 'department_head' || role === 'teacher') return '/Admindashboard';
    if (role === 'student')                               return '/StudentDashboard';
    return '/guest';
  };

  // 🚨 3. ไม่มี Token / User → ส่งไปหน้า Guest (read-only dashboard)
  if (!token || !user) {
    return <Navigate to="/guest" state={{ from: location }} replace />;
  }

  // 🚫 4. Role ไม่ตรงกับ allowedRoles → ดีดกลับ Dashboard ของ Role ตัวเอง
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`⛔ Access Denied: สิทธิ์ '${user.role}' ไม่สามารถเข้าถึงหน้านี้ได้`);
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  // ✅ 5. ผ่านทุกด่าน
  return <Outlet />;
};

export default ProtectedRoute;