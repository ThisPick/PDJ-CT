import multer from 'multer';
/**
 * Global Error Handling Middleware
 * ฟังก์ชันนี้จะทำงานอัตโนมัติเมื่อมีการเรียกใช้ next(error) จาก Controller
 */
export const errorHandler = (err, req, res, next) => {
    // 1. ตรวจสอบ Log ในฝั่ง Server 
    console.error('❌ Error Log:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });

    // 2. กรณี Error มาจาก Multer (เรื่องอัปโหลดไฟล์)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)',
            });
        }
        return res.status(400).json({
            success: false,
            message: `Multer Error: ${err.message}`,
        });
    }

    // 3. กรณี Error ทั่วไป (เช่น SQL ผิด, หาไฟล์ไม่เจอ)
    const statusCode = err.status || 500;
    const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';

    res.status(statusCode).json({
        success: false,
        message: message,
        // ถ้าเป็นโหมดพัฒนา (Development) ให้ส่ง Stack trace ไปดูด้วย
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};