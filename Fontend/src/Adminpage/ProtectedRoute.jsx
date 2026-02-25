import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();

  // ✅ 1. ดึง Token และข้อมูล User จาก LocalStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  let user = null;
  try {
    if (userData) {
      user = JSON.parse(userData);
    }
  } catch (e) {
    // ถ้าข้อมูล User พัง (JSON Error) ให้เคลียร์ทิ้งแล้วบังคับ Login ใหม่
    console.error("ข้อมูล User เสียหาย, ทำการลบออกจากระบบ...");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ✅ 2. ฟังก์ชันกำหนดหน้าแรกของแต่ละ Role (Redirect Logic)
  const getHomePath = (role) => {
    if (role === 'department_head' || role === 'teacher') {
      return '/AdminDashboard';   // สำหรับหัวหน้าแผนก และ ครู/อาจารย์
    }
    if (role === 'student') {
      return '/StudentDashboard'; // สำหรับนักศึกษา
    }
    return '/login'; // กรณีไม่มี Role หรือไม่รู้จัก
  };

  // 🚨 3. ถ้าไม่มี Token หรือ User -> ไล่ไป Login
  if (!token || !user) {
    // เก็บ state from ไว้ เพื่อให้ล็อกอินเสร็จแล้วเด้งกลับมาหน้าเดิมที่อยากเข้าได้
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🚫 4. ตรวจสอบสิทธิ์ (Role Check) สำหรับการแยกหน้า
  // ถ้ามีการกำหนด allowedRoles แต่ Role ของผู้ใช้ไม่อยู่ในนั้น -> ไม่อนุญาตให้เข้า
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`⛔ Access Denied: สิทธิ์ '${user.role}' ไม่สามารถเข้าถึงหน้านี้ได้`);
    
    // ดีดกลับไปหน้า Dashboard หลักของ Role ตัวเอง
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  // ✅ 5. ผ่านทุกด่าน -> อนุญาตให้เข้าถึงหน้าเว็บได้ (Render Component ลูกที่อยู่ภายใน)
  return <Outlet />;
};

export default ProtectedRoute;