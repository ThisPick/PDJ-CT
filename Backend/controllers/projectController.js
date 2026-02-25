import Project from '../models/projectModel.js';
import fs from 'fs';
import path from 'path';

export const addProject = async (req, res) => {
    try {
        // 1. รับค่า advisor เพิ่มเติมจาก req.body
        const { created_by, creator_id, user_id, student_id, student_name, advisor } = req.body;

        const userId = created_by || creator_id || user_id;

        if (!userId) {
            return res.status(400).json({ error: "ต้องระบุ ID ผู้ใช้งาน (created_by)" });
        }

        const projectData = {
            ...req.body,
            created_by: userId,
            student_id: student_id,
            student_name: student_name,
            advisor: advisor, // 👈 เพิ่มบรรทัดนี้เพื่อให้ค่า advisor ส่งไปยัง Model
            progress_status: req.body.progress_status || 'รออนุมัติหัวข้อ',
            is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
            feedback: req.body.feedback || '', 
            pdf_file_path: req.file ? req.file.filename : null
        };

        const newProject = await Project.create(projectData);
        res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ", data: newProject });

    } catch (err) {
        console.error("Add Project Error:", err);
        res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

export const editProject = async (req, res) => {
    try {
        const { id } = req.params;
        const oldProject = await Project.findById(id);
        if (!oldProject) return res.status(404).json({ error: "ไม่พบข้อมูลโครงงานที่ต้องการแก้ไข" });

        // ตรวจสอบค่า boolean สำหรับ is_featured (เพราะ FormData ส่งมาเป็น String)
        const isFeatured = req.body.is_featured === 'true' || req.body.is_featured === true;

        const updateData = {
            ...req.body,
            is_featured: isFeatured, // 👈 แปลงให้เป็น Boolean ก่อนส่งเข้า DB
            pdf_file_path: req.file ? req.file.filename : oldProject.pdf_file_path
        };

        if (req.file && oldProject.pdf_file_path) {
            const oldPath = path.join('uploads/pdf/', oldProject.pdf_file_path);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const updated = await Project.update(id, updateData);
        res.json({ message: "แก้ไขข้อมูลสำเร็จ", data: updated });

    } catch (err) {
        console.error("Edit Project Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getProjects = async (req, res) => {
    try {
        const projects = await Project.findAll();
        res.json(projects);
    } catch (err) {
        console.error("Get Projects Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const removeProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findById(id); 
        if (!project) return res.status(404).json({ error: "ไม่พบข้อมูลโครงงาน" });

        await Project.delete(id);

        if (project.pdf_file_path) {
            const filePath = path.join('uploads/pdf/', project.pdf_file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.json({ message: "ลบโครงงานและไฟล์เรียบร้อย" });

    } catch (err) {
        console.error("Delete Project Error:", err);
        res.status(500).json({ error: err.message });
    }
};