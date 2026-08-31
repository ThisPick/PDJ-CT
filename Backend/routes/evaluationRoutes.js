import express from 'express';
import {
  getAllEvaluations,
  getDataById,
  getScoreHistory,
  saveChanges,
} from '../controllers/evaluationController.js';

const router = express.Router();

// ดึงข้อมูลทั้งหมด
router.get('/', getAllEvaluations);

// ดึงประวัติคะแนนของโปรเจกต์ (ต้องอยู่ก่อน /:id)
router.get('/history/:id', getScoreHistory);

// ดึงข้อมูลรายตัว
router.get('/:id', getDataById);

// บันทึกคะแนน
router.post('/update', saveChanges);

export default router;