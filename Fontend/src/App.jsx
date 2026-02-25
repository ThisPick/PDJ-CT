import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Auth Pages ---
import { Login } from './Page/Login';
import { ResetPassword } from './Page/ResetPassword';
import { Register } from './Page/Register';

// --- Admin / Teacher Pages ---
import { AdminDashboard } from './Adminpage/AdminDashboard';
import ManageUsers from './Adminpage/ManageUsers';
import RubricSettings from './Adminpage/RubricSettings';
import ProjectSTD from './Adminpage/ProjectSTD'; 
import ApproveProject from './Adminpage/ApproveProject'; 
import EvaluationPage from './Adminpage/EvaluationPage'; 
import MilestonePage from './Adminpage/MilestonePage'; 

// --- 🎓 Student Pages (เพิ่มเข้ามาใหม่) ---
import StudentDashboard from './StudentPage/StudentDashboard';
import Studentprofile from './StudentPage/Studentprofile'; 
import ProjectArchive from './StudentPage/ProjectArchive';
import Projectsubmit from './StudentPage/Projectsubmit';// --- Protection ---
import ProtectedRoute from './Adminpage/ProtectedRoute';

function App() {
  // ✅ 1. เช็ค Token และ Role เพื่อ Redirect ให้ตรงกับประเภทผู้ใช้งาน
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  let userRole = null;
  try {
    if (userData) {
      userRole = JSON.parse(userData).role;
    }
  } catch (error) {
    console.error("User parsing error:", error);
  }

  // ✅ 2. ฟังก์ชันตรวจสอบว่าจะให้ไปหน้าไหนถ้ามี Token อยู่แล้ว
  const getDashboardPath = () => {
    if (userRole === 'student') return '/StudentDashboard';
    return '/Admindashboard'; // สำหรับครูและหัวหน้าแผนก
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- 1. Public Routes (หน้าทั่วไป) --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route 
          path="/login" 
          element={token ? <Navigate to={getDashboardPath()} replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={token ? <Navigate to={getDashboardPath()} replace /> : <Register />} 
        />
        <Route path="/reset-password" element={<ResetPassword />} />


        {/* --- 2. 🔒 ZONE A: เฉพาะหัวหน้าแผนก (Department Head) เท่านั้น --- */}
        <Route element={<ProtectedRoute allowedRoles={['department_head']} />}>
          <Route path="/ApproveProject" element={<ApproveProject />} />
          <Route path="/ManageUsers" element={<ManageUsers />} />
        </Route>


        {/* --- 3. 🔒 ZONE B: อาจารย์ และ หัวหน้าแผนก (Teacher & Head) --- */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'department_head']} />}>
          <Route path="/Admindashboard" element={<AdminDashboard />} />
          <Route path="/RubricSettings" element={<RubricSettings />} />
          <Route path="/ProjectSTD" element={<ProjectSTD />} />
          <Route path="/EvaluationPage" element={<EvaluationPage />} /> 
          <Route path="/Adminpage/Milestone" element={<MilestonePage />} /> 
        </Route>


        {/* --- 4. 🎓 ZONE C: นักเรียน (Student) --- */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            {/* ✅ ใส่หน้าของนักเรียนที่นี่ */}
            <Route path="/StudentDashboard" element={<StudentDashboard />} /> 
            <Route path="/Studentprofile" element={<Studentprofile />} />
            <Route path="/ProjectArchive" element={<ProjectArchive />} />
            <Route path="/Projectsubmit" element={<Projectsubmit/ >} />
        </Route>


        {/* --- 5. Catch-All (พิมพ์มั่ว ให้ดักไปหน้า Login) --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;