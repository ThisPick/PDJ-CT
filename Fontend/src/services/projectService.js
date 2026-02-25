// แนะนำให้ใช้ Environment Variable ในการเก็บ URL
const API_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api/projects` 
  : 'http://localhost:5000/api/projects';

// 1. ดึงข้อมูลทั้งหมด
export const getAllProjects = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return await response.json();
};

// 2. ดึงข้อมูลตาม ID
export const getProjectById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Project not found');
  return await response.json();
};

// 3. เพิ่มข้อมูลใหม่ (รองรับ FormData สำหรับไฟล์ PDF)
export const createProject = async (formData) => {
  // รับ formData มาโดยตรงจากหน้า UI
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData, // ไม่ต้องตั้ง Header Content-Type เบราว์เซอร์จะจัดการให้เอง
  });
  if (!response.ok) throw new Error('Failed to create project');
  return await response.json();
};

// 4. แก้ไขข้อมูล (รองรับ FormData สำหรับไฟล์ PDF)
export const updateProject = async (id, formData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to update project');
  return await response.json();
};

// 5. ลบข้อมูล
export const deleteProject = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete project');
  return await response.json().catch(() => ({ success: true }));
};

// Export เป็น object เพื่อให้เรียกใช้แบบ projectService.method() ได้
const projectService = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};

export default projectService;