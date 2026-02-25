import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// ปรับ RUBRIC_BASE ให้ชัวร์ว่าไม่มีปัญหาเรื่อง slash ซ้อน
const RUBRIC_BASE = `${API_BASE_URL}/api/rubrics`.replace(/\/$/, '');

const api = axios.create({
  baseURL: RUBRIC_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')?.trim();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ฟังก์ชันสำหรับ "ทำความสะอาด" ข้อมูลก่อนส่งไปฐานข้อมูล
const prepareData = (data) => {
  const processed = { ...data };
  // 🔍 ตรวจสอบฟิลด์ที่มักจะเป็น JSON (เช่น criteria, items, หรือ levels)
  // หากเป็น Object หรือ Array ให้ JSON.stringify ก่อนส่งเพื่อป้องกัน Syntax Error ใน Postgres
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'object' && processed[key] !== null) {
      processed[key] = JSON.stringify(processed[key]);
    }
  });
  return processed;
};

const handleResponse = async (request) => {
  try {
    const res = await request;
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    console.error('API Error:', message);
    throw new Error(message);
  }
};

export const rubricService = {
  // 1. ดึงเกณฑ์ทั้งหมด
  getAll: () => handleResponse(api.get('/')),

  // 2. ดึงเกณฑ์รายตัว
  getById: (id) => handleResponse(api.get(`/${id}`)),

  // 3. สร้างเกณฑ์ใหม่ (เพิ่ม prepareData)
  create: (rubricData) => handleResponse(api.post('/', prepareData(rubricData))),

  // 4. แก้ไขเกณฑ์ (เพิ่ม prepareData)
  update: (id, rubricData) => handleResponse(api.put(`/${id}`, prepareData(rubricData))),

  // 5. เปิด/ปิดสถานะ (PATCH)
  toggleStatus: (id, isActive) => 
    handleResponse(api.patch(`/${id}/status`, { is_active: isActive })),

  // 6. ลบเกณฑ์
  delete: (id) => handleResponse(api.delete(`/${id}`))
};