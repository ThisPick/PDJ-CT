import express from 'express';
import rubricController from '../controllers/rubricController.js';

const router = express.Router();

router.get('/', rubricController.getAllRubrics);
router.get('/:id', rubricController.getRubricById); // แก้เป็นชื่อให้ตรง
router.post('/', rubricController.createRubric);
router.put('/:id', rubricController.updateRubric);
router.patch('/:id/status', rubricController.toggleStatus); // แก้เป็นชื่อให้ตรง
router.delete('/:id', rubricController.deleteRubric);

export default router;