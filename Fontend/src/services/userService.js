import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://reg.utc.ac.th";

// 1. สร้าง Instance ของ Axios
const userAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/users`, 
  withCredentials: true,
});

// 2. Request Interceptor: แนบ Token ไปในทุก Request
userAPI.interceptors.request.use((config) => {
  // ✅ แก้ไข: ดึง Token จากทั้ง localStorage และ sessionStorage เพื่อความชัวร์
  const token = localStorage.getItem('token') || sessionStorage.getItem('token'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 3. Response Interceptor: ดักจับ 401 (Unauthorized) เพื่อ Logout อัตโนมัติ
userAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // หาก Token หมดอายุ หรือ บัญชีถูกระงับ (ได้รับ 401 Unauthorized)
    if (error.response?.status === 401) {
      // ✅ เคลียร์ข้อมูลขยะทิ้งทั้งหมด
      sessionStorage.clear();
      localStorage.clear(); 
      
      // หลีกเลี่ยงการรีไดเรกต์วนลูปถ้าอยู่หน้า login อยู่แล้ว
      if (window.location.pathname !== '/login') {
        window.location.href = "/login"; 
      }
    }
    return Promise.reject(error);
  }
);

export const userService = {
  /**
   * ✅ ฟังก์ชันดึง URL รูปภาพ พร้อม Query String ป้องกัน Cache (ทำให้รูปอัปเดตทันที)
   */
  getAvatarUrl: (fileName) => {
    if (!fileName || fileName === 'null' || fileName === 'undefined') return null;
    if (fileName.startsWith('http')) return fileName;
    return `${API_BASE_URL}/uploads/profiles/${fileName}?t=${new Date().getTime()}`;
  },

  // ดึงข้อมูลผู้ใช้ทั้งหมด
  getAllUsers: async () => {
    return await userAPI.get("/all");
  },

  // ดึงโปรไฟล์ตาม ID
  getProfile: async (id) => {
    if (!id || id === 'undefined' || id === 'null') {
      return Promise.reject(new Error("Invalid User ID"));
    }
    return await userAPI.get(`/profile/${id}`);
  },

  // อัปเดตข้อมูลผู้ใช้ (รองรับการส่งไฟล์รูปภาพผ่าน FormData)
  updateUser: async (id, formData) => {
    return await userAPI.put(`/update-profile/${id}`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      }
    });
  },

  // Soft Delete: เปลี่ยนสถานะเป็น inactive
  deleteUser: async (id) => {
    return await userAPI.delete(`/${id}`);
  },

  // อัปโหลดรูปโปรไฟล์แยก (ถ้ามี)
  uploadAvatar: async (id, formData) => {
    return await userAPI.post(`/upload-avatar/${id}`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      }
    });
  },

  // ✅ ฟังก์ชัน Logout เรียกใช้งานได้ง่ายๆ จากทุกหน้า
  logout: () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/login";
  }
};