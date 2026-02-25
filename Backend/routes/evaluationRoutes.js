import express from 'express';
import { getAllEvaluations, getDataById, saveChanges } from '../controllers/evaluationController.js';

const router = express.Router();

// ✅ เพิ่มบรรทัดนี้เพื่อแก้ Error 404 (ดึงข้อมูลทั้งหมด)
router.get('/', getAllEvaluations);

// ดึงข้อมูลรายคน
router.get('/:id', getDataById);

// บันทึกคะแนน
router.post('/update', saveChanges);

export default router;