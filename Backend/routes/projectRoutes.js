import express from 'express';
const router = express.Router();
import * as projectController from '../controllers/projectController.js';
import pdjStdUpload from '../middlewares/PDJStdupload.js';

// เพิ่มโครงงาน
router.post('/', pdjStdUpload.single('pdf_file'), projectController.addProject);
// ดึงข้อมูล (ดูได้ทุกคน)
router.get('/', projectController.getProjects);
// แก้ไขโครงงาน
router.put('/:id', pdjStdUpload.single('pdf_file'), projectController.editProject);
// ลบโครงงาน
router.delete('/:id', projectController.removeProject);

export default router;