import axios from "axios";

// ดึง Base URL จาก Environment หรือใช้ Localhost เป็นค่าเริ่มต้น
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AUTH_URL = `${API_BASE_URL}/api/auth`;

// ตั้งค่า axios ให้ส่ง Cookie ไปด้วยเสมอ (สำคัญสำหรับระบบที่ใช้ HTTP-only Cookie)
axios.defaults.withCredentials = true;

/**
 * 1. ฟังก์ชันเข้าสู่ระบบ (Login)
 */
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${AUTH_URL}/login`, credentials);
    
    if (response.data && response.data.user) {
      const { user } = response.data;
      // เก็บข้อมูล User ลง localStorage เพื่อใช้แสดงผลหน้าบ้าน
      localStorage.setItem("user", JSON.stringify(user));
      
      // เก็บ Token แยกไว้ (ถ้าหลังบ้านส่งมาให้ในรูปแบบ JSON)
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
    }
    return response.data;
  } catch (error) {
    console.error("❌ Login Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 2. ฟังก์ชันลงทะเบียน (Register) - แก้ไขให้สมบูรณ์
 */
export const register = async (userData) => {
  try {
    // ส่งข้อมูล userData (payload) ไปที่ /register
    const response = await axios.post(`${AUTH_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error("❌ Register Error:", error.response?.data || error.message);
    throw error; // ส่ง Error กลับไปที่หน้า Register.jsx เพื่อแสดง Alert
  }
};

/**
 * 3. ฟังก์ชันรีเซ็ตรหัสผ่าน (Reset Password)
 */
export const resetPassword = async (email, newPassword) => {
  try {
    const response = await axios.post(`${AUTH_URL}/reset-password`, { email, newPassword });
    return response.data;
  } catch (error) {
    console.error("❌ Reset Password Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 4. ฟังก์ชันออกจากระบบ (Logout)
 */
export const logout = async () => {
  try {
    // แจ้ง Server ให้ล้าง Cookie
    await axios.post(`${AUTH_URL}/logout`); 
  } catch (error) {
    console.error("❌ Logout Error (Server-side):", error);
  } finally {
    // ไม่ว่าจะเคลียร์ Cookie สำเร็จหรือไม่ ต้องล้างหน้าบ้านเสมอ
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    console.log("✅ Logged out successfully");
  }
  return { status: "success" };
};

/**
 * 5. Helper Functions
 */

// ดึงข้อมูล User ปัจจุบันจาก LocalStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// เช็คว่ามีสิทธิ์ (Role) ตรงตามที่กำหนดไหม
export const checkAuth = (allowedRoles = []) => {
  const user = getCurrentUser();
  if (!user) return false;
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
};