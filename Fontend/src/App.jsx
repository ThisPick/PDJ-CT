import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Auth Pages ---
import { Login }         from './Page/Login';
import { ResetPassword } from './Page/ResetPassword';
import { Register }      from './Page/Register';

// --- Admin / Teacher Pages ---
import { AdminDashboard } from './Adminpage/AdminDashboard';
import ManageUsers        from './Adminpage/ManageUsers';
import RubricSettings     from './Adminpage/RubricSettings';
import ProjectSTD         from './Adminpage/ProjectSTD';
import ApproveProject     from './Adminpage/ApproveProject';
import EvaluationPage     from './Adminpage/EvaluationPage';
import MilestonePage      from './Adminpage/MilestonePage';

// --- Student Pages ---
import StudentDashboard from './StudentPage/StudentDashboard';
import Studentprofile   from './StudentPage/Studentprofile';
import ProjectArchive   from './StudentPage/ProjectArchive';
import Projectsubmit    from './StudentPage/Projectsubmit';

// --- Guest Dashboard (public, read-only) ---
import { GuestDashboard } from './GuestPage/GuestDashboard';

// --- Protection ---
import ProtectedRoute from './Adminpage/ProtectedRoute';

function App() {
  const token    = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  let userRole = null;
  try {
    if (userData) userRole = JSON.parse(userData).role;
  } catch (e) {
    console.error('User parsing error:', e);
  }

  // ถ้ามี token แล้ว → ไปหน้า dashboard ของ role ตัวเอง
  const getDashboardPath = () => {
    if (userRole === 'student')                               return '/StudentDashboard';
    if (userRole === 'teacher' || userRole === 'department_head') return '/Admindashboard';
    return '/guest';
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* ── 0. Root redirect ──────────────────────────────────────── */}
        <Route
          path="/"
          element={<Navigate to={token ? getDashboardPath() : '/guest'} replace />}
        />

        {/* ── 1. Guest (ไม่ต้อง login — read-only dashboard) ──────── */}
        <Route path="/guest" element={<GuestDashboard />} />

        {/* ── 2. Auth pages (ถ้ามี token แล้วจะ redirect ออก) ───────── */}
        <Route
          path="/login"
          element={token ? <Navigate to={getDashboardPath()} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to={getDashboardPath()} replace /> : <Register />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── 3. Zone A : department_head เท่านั้น ──────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['department_head']} />}>
          <Route path="/ApproveProject" element={<ApproveProject />} />
          <Route path="/ManageUsers"    element={<ManageUsers />} />
        </Route>

        {/* ── 4. Zone B : teacher + department_head ─────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'department_head']} />}>
          <Route path="/Admindashboard"       element={<AdminDashboard />} />
          <Route path="/RubricSettings"       element={<RubricSettings />} />
          <Route path="/ProjectSTD"           element={<ProjectSTD />} />
          <Route path="/EvaluationPage"       element={<EvaluationPage />} />
          <Route path="/Adminpage/Milestone"  element={<MilestonePage />} />
        </Route>

        {/* ── 5. Zone C : student ───────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/StudentDashboard" element={<StudentDashboard />} />
          <Route path="/Studentprofile"   element={<Studentprofile />} />
          <Route path="/ProjectArchive"   element={<ProjectArchive />} />
          <Route path="/Projectsubmit"    element={<Projectsubmit />} />
        </Route>

        {/* ── 6. Catch-all → guest ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/guest" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;