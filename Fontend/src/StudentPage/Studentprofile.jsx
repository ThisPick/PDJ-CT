import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Card, Typography, Avatar, Form, Input, Button, 
  Select, Upload, Row, Col, Divider, message, Popconfirm, Tag, Space, Modal
} from 'antd';
import { 
  UserOutlined, MailOutlined, IdcardOutlined, LockOutlined, 
  CameraOutlined, BookOutlined, HomeOutlined, StopOutlined,
  SaveOutlined, PictureOutlined
} from '@ant-design/icons';
import StudentSidebar from './Studentbar'; 
import { userService } from '../services/userService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Studentprofile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  
  // สถานะและ Ref สำหรับระบบกล้อง WebRTC
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMyProfile();
    // คืนค่า (Cleanup) กล้องเมื่อเปลี่ยนหน้าต่าง
    return () => stopCamera();
  }, []);

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      const savedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const userId = savedUser.id || savedUser.userId;

      if (!userId) {
        message.error("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const res = await userService.getProfile(userId);
      const data = res.data?.data || res.data;
      
      setUserData(data);
      if (data.profile_img) {
        setPreviewImage(`${API_URL}/uploads/profiles/${data.profile_img}`);
      }

      form.setFieldsValue({
        full_name: data.full_name,
        email: data.email,
        student_id: data.student_id,
        student_level: data.student_level,
        student_group: data.student_group,
      });
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const beforeImageUpload = (file) => {
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i);
    if (!isImage) {
      message.error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleImageChange = ({ fileList }) => {
    setFileList(fileList);
    if (fileList[0]) {
      const reader = new FileReader();
      reader.onload = e => setPreviewImage(e.target.result);
      reader.readAsDataURL(fileList[0].originFileObj);
    } else {
      setPreviewImage(userData?.profile_img ? `${API_URL}/uploads/profiles/${userData.profile_img}` : null);
    }
  };

  // ✅ ฟังก์ชันเปิดกล้องในเบราว์เซอร์ (WebRTC)
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } // บังคับใช้กล้องหน้า
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      message.error("ไม่สามารถเข้าถึงกล้องได้ ตรวจสอบว่าเว็บทำงานบน HTTPS/Localhost หรือคุณบล็อกกล้องไว้หรือไม่");
      setIsCameraOpen(false);
    }
  };

  // ✅ ฟังก์ชันปิดกล้อง
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  // ✅ ฟังก์ชันแคปเจอร์ภาพจากวีดีโอ
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // แปลงภาพจาก Canvas เป็น File
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          const newFileList = [{
            uid: '-1',
            name: file.name,
            status: 'done',
            originFileObj: file,
          }];
          setFileList(newFileList);
          
          const reader = new FileReader();
          reader.onload = e => setPreviewImage(e.target.result);
          reader.readAsDataURL(file);
          
          stopCamera(); // ปิดกล้องหลังถ่ายเสร็จ
          message.success("ถ่ายรูปสำเร็จ อย่าลืมกดบันทึกการเปลี่ยนแปลง");
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      formData.append('full_name', values.full_name);
      formData.append('email', values.email || '');
      formData.append('student_id', values.student_id);
      formData.append('student_level', values.student_level || '');
      formData.append('student_group', values.student_group || '');

      if (values.new_password) {
        formData.append('password', values.new_password);
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('profile_img', fileList[0].originFileObj);
      }

      const res = await userService.updateUser(userData.id, formData);
      
      if (res.data?.success || res.success) {
        message.success("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว ระบบกำลังอัปเดต...");
        setTimeout(() => {
          window.location.reload(); 
        }, 1500); 
      }
    } catch (err) {
      console.error("Update Error:", err);
      message.error("เกิดข้อผิดพลาด: " + (err.response?.data?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await userService.updateUser(userData.id, { status: 'inactive' });
      message.warning("ระงับบัญชีเรียบร้อยแล้ว");
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      message.error("ระงับบัญชีไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen bg-[#f8fafc]">
      <StudentSidebar />
      <Layout className="site-layout">
        <Content className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-6">
              <Title level={3} className="!mb-1">ตั้งค่าโปรไฟล์ส่วนตัว</Title>
              <Text className="text-slate-500">จัดการข้อมูลนักศึกษาและรหัสผ่านของคุณ</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleUpdate}>
              <Row gutter={[24, 24]}>
                
                <Col xs={24} md={8}>
                  <Card className="rounded-2xl shadow-sm text-center">
                    
                    <div className="mb-6">
                      <Avatar 
                        size={130} 
                        src={previewImage || null} 
                        icon={<UserOutlined />} 
                        className="border-4 border-white shadow-md bg-indigo-50 text-indigo-200 mb-4"
                      />
                      
                      <div className="flex justify-center gap-2">
                        {/* 1. ปุ่มเลือกรูปจากเครื่อง */}
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          beforeUpload={beforeImageUpload}
                          onChange={handleImageChange}
                        >
                          <Button 
                            icon={<PictureOutlined />} 
                            className="bg-slate-50 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg"
                          >
                            เลือกรูป
                          </Button>
                        </Upload>

                        {/* 2. ปุ่มถ่ายรูป (จะเด้งหน้าต่างขึ้นมาเปิดกล้องเลย) */}
                        <Button 
                          type="primary" 
                          ghost 
                          icon={<CameraOutlined />} 
                          className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          onClick={startCamera}
                        >
                          ถ่ายรูป
                        </Button>
                      </div>
                    </div>

                    <Title level={4} className="!mb-0">{userData?.full_name}</Title>
                    <Text type="secondary" className="block mb-4">{userData?.student_id}</Text>
                    
                    <Divider />
                    
                    <Space direction="vertical" className="w-full">
                      <Tag color="green" className="w-full py-1 rounded-md text-base">กำลังใช้งาน (Active)</Tag>
                      
                      <Popconfirm
                        title="ยืนยันการระงับบัญชี?"
                        description="หากระงับบัญชี คุณจะต้องติดต่อแอดมินเพื่อเปิดใช้งานใหม่"
                        onConfirm={handleDeactivate}
                        okText="ยืนยัน"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true }}
                      >
                        <Button block danger type="text" icon={<StopOutlined />} className="mt-2">
                          ระงับบัญชีของฉัน
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={16}>
                  <Card className="rounded-2xl shadow-sm" title="แก้ไขข้อมูลพื้นฐาน">
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item label="รหัสนักศึกษา (ไม่สามารถแก้ไขได้)" name="student_id">
                          <Input prefix={<IdcardOutlined />} size="large" disabled className="bg-slate-50 text-slate-500 font-medium" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="ชื่อ-นามสกุล" name="full_name" rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}>
                          <Input prefix={<UserOutlined />} size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="อีเมล" name="email" rules={[{ type: 'email', message: 'อีเมลไม่ถูกต้อง' }]}>
                          <Input prefix={<MailOutlined />} size="large" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 mt-2">
                      <Text strong className="text-indigo-600 mb-4 block"><BookOutlined /> ข้อมูลแผนก/ชั้นเรียน</Text>
                      <Row gutter={12}>
                        <Col span={14}>
                          <Form.Item label="ระดับชั้น" name="student_level" className="mb-0">
                            <Select size="large">
                              <Option value="ปวช. 1">ปวช. 1</Option>
                              <Option value="ปวช. 2">ปวช. 2</Option>
                              <Option value="ปวช. 3">ปวช. 3</Option>
                              <Option value="ปวส. 1">ปวส. 1</Option>
                              <Option value="ปวส. 2">ปวส. 2</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item label="กลุ่ม" name="student_group" className="mb-0">
                            <Input prefix={<HomeOutlined />} size="large" placeholder="เช่น 1, 2" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider titlePlacement="left"><Text type="secondary" className="text-xs font-semibold uppercase">ความปลอดภัย</Text></Divider>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="รหัสผ่านใหม่" name="new_password">
                          <Input.Password prefix={<LockOutlined />} size="large" placeholder="ว่างไว้เพื่อใช้รหัสเดิม" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          label="ยืนยันรหัสผ่าน" 
                          name="confirm_password"
                          dependencies={['new_password']}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                                return Promise.reject(new Error('รหัสผ่านที่ระบุไม่ตรงกัน'));
                              },
                            }),
                          ]}
                        >
                          <Input.Password prefix={<LockOutlined />} size="large" placeholder="ยืนยันรหัสผ่านใหม่" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />} 
                      size="large" 
                      block 
                      loading={loading}
                      className="mt-6 bg-indigo-600 hover:bg-indigo-500 h-12 rounded-lg text-base font-medium"
                    >
                      บันทึกการเปลี่ยนแปลงทั้งหมด
                    </Button>
                  </Card>
                </Col>
              </Row>
            </Form>

            {/* ✅ กล่อง Modal สำหรับแสดงกล้องสด */}
            <Modal
              title={<span className="text-indigo-600">ถ่ายรูปโปรไฟล์</span>}
              open={isCameraOpen}
              onCancel={stopCamera}
              footer={null}
              destroyOnClose
              centered
            >
              <div className="flex flex-col items-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full max-w-sm rounded-lg bg-black object-cover aspect-square mb-4 border border-slate-200"
                />
                {/* ซ่อน Canvas ไว้ใช้เก็บภาพตอนถ่าย */}
                <canvas ref={canvasRef} className="hidden" />
                
                <Button 
                  type="primary" 
                  size="large" 
                  shape="round"
                  icon={<CameraOutlined />} 
                  onClick={capturePhoto}
                  className="bg-indigo-600 px-8"
                >
                  กดแชะภาพ
                </Button>
              </div>
            </Modal>

          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Studentprofile;