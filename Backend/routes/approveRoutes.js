import express from 'express';
import * as approveController from '../controllers/approveController.js';

const router = express.Router();

// ดึงข้อมูลทั้งหมด: GET /api/approve/all
router.get('/all', approveController.getPendingProjects);
router.put('/update-status/:id', approveController.updateProjectStatus);

export default router;