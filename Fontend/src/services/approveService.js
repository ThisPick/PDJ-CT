import axios from 'axios';

// ตั้งค่า Base URL หลักของ Server (เช่น http://localhost:5000)
// ใช้ค่าจาก .env ถ้ามี หรือใช้ localhost เป็นค่าเริ่มต้น
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ตั้งค่าเส้นทางเฉพาะสำหรับระบบ Approve API
const APPROVE_API_URL = `${API_BASE_URL}/api/approve`;

const apiClient = axios.create({
    baseURL: APPROVE_API_URL,
    withCredentials: true,
});

const approveService = {
    /**
     * 1. ดึงข้อมูลโครงการทั้งหมด
     */
    getAllPendingProjects: async () => {
        try {
            const response = await apiClient.get('/all');
            return response.data;
        } catch (error) {
            console.error("Error fetching projects:", error);
            throw error;
        }
    },

    /**
     * 2. อัปเดตสถานะโครงการ
     */
    updateProjectStatus: async (id, data) => {
        try {
            const response = await apiClient.put(`/update-status/${id}`, data);
            return response.data;
        } catch (error) {
            console.error("Error updating project status:", error);
            throw error;
        }
    },

    /**
     * 3. ฟังก์ชันจัดการ Link ต่างๆ 🚀
     */
    
    // ดึง URL ของไฟล์ PDF จากโฟลเดอร์ uploads/pdf
    getPdfUrl: (pdfPath) => {
        if (!pdfPath) return null;
        
        // แปลงให้เป็น String และตัดช่องว่างหน้าหลัง
        let fileName = String(pdfPath).trim();

        // กรณีเก็บ Full URL ไว้แล้ว (เช่น ฝากไฟล์ที่อื่น) ให้คืนค่านั้นเลย
        if (fileName.startsWith('http')) {
            return fileName;
        }
        
        // เทคนิค: ตัด Path เดิมทิ้งทั้งหมด เอาแค่ชื่อไฟล์ตัวสุดท้าย (เพื่อความชัวร์)
        // ไม่ว่า DB จะเก็บมาเป็น "uploads/file.pdf" หรือ "pdf/file.pdf" หรือ "file.pdf"
        // เราจะดึงแค่ "file.pdf" มาใช้
        if (fileName.includes('/')) {
            fileName = fileName.split('/').pop();
        } else if (fileName.includes('\\')) { // เผื่อกรณี path เป็น backslash แบบ Windows
            fileName = fileName.split('\\').pop();
        }

        const cleanFileName = fileName;
        
        // ✅ แก้ไขจุดสำคัญ: เพิ่ม /pdf/ เข้าไปใน URL เพื่อให้ตรงกับโฟลเดอร์จริง
        // ผลลัพธ์จะเป็น: http://localhost:5000/uploads/pdf/ชื่อไฟล์.pdf
        return `${API_BASE_URL}/uploads/pdf/${cleanFileName}`;
    },

    getVideoUrl: (videoUrl) => videoUrl || null,
    getGithubUrl: (githubUrl) => githubUrl || null,
    getDriveUrl: (driveUrl) => driveUrl || null
};

export default approveService;