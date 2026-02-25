import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Table, Avatar, Tag, Typography, message, 
  Space, Button, Popconfirm, Modal, Form, Input, Select, Upload, Row, Col, Divider, Tooltip, Badge 
} from 'antd';
import { 
  UserOutlined, IdcardOutlined, MailOutlined, TeamOutlined, 
  StarFilled, EditOutlined, DeleteOutlined, UploadOutlined,
  SearchOutlined, HomeOutlined, BookOutlined, SafetyCertificateOutlined,
  PhoneOutlined, LockOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import AdminSidebar from './AdminSidebar';
import { userService } from '../services/userService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const ManageUsers = () => {
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [searchText, setSearchText] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  // Config
  const API_URL = "http://localhost:5000";

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- Functions ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await userService.getAllUsers();
      if (res?.data?.success || res?.success) {
        setUserList(res.data.data || res.data);
      }
    } catch (err) {
      message.error("ไม่สามารถดึงข้อมูลสมาชิกได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await userService.deleteUser(id);
      if (res?.data?.success || res?.success) {
        // ✅ เปลี่ยนข้อความแจ้งเตือนให้เป็นการลบข้อมูลถาวร
        message.success("ลบข้อมูลและรูปภาพผู้ใช้งานสำเร็จ");
        fetchData(); 
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setEditingId(record.id);
    
    // 1. จัดการรูปภาพ Preview
    if (record.profile_img) {
      setFileList([{
        uid: '-1',
        name: record.profile_img,
        status: 'done',
        url: `${API_URL}/uploads/profiles/${record.profile_img}?t=${Date.now()}`,
      }]);
    } else {
      setFileList([]);
    }
    
    // 2. เซ็ตค่าลง Form ให้ครบทุกฟิลด์ตาม Backend
    form.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
      email: record.email,
      phone: record.phone,
      status: record.status || 'active',
      password: '', // ปล่อยว่างไว้เสมอ ถ้าพิมพ์แปลว่าต้องการเปลี่ยนรหัส
      student_id: record.student_id,
      student_level: record.student_level,
      student_group: record.student_group
    });

    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      
      formData.append('full_name', values.full_name);
      formData.append('role', values.role);
      formData.append('status', values.status);
      
      if (values.email) formData.append('email', values.email);
      if (values.phone) formData.append('phone', values.phone);
      
      if (values.password && values.password.trim() !== '') {
        formData.append('password', values.password);
      }

      if (values.role === 'student') {
        formData.append('student_id', values.student_id || '');
        formData.append('student_level', values.student_level || '');
        formData.append('student_group', values.student_group || '');
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('profile_img', fileList[0].originFileObj);
      }

      const res = await userService.updateUser(editingId, formData);
      
      if (res?.data?.success || res?.success) {
        message.success("อัปเดตข้อมูลสำเร็จเรียบร้อย");
        handleCancel();
        fetchData();
      } else {
        throw new Error(res.message || "เซิร์ฟเวอร์ตอบกลับแต่ไม่สำเร็จ");
      }

    } catch (err) {
      console.error("Save Error:", err);
      const errorMsg = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการบันทึก";
      message.error(`อัปเดตไม่สำเร็จ: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper: ตรวจสอบไฟล์ก่อนอัปโหลด
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น!');
      return Upload.LIST_IGNORE;
    }
    return false; 
  };

  const getLevelColor = (level) => {
    if (!level) return 'default';
    if (level.includes('ปวช')) return 'orange';
    if (level.includes('ปวส')) return 'blue';
    return 'cyan';
  };

  // --- Filtering ---
  const filteredData = userList.filter(user => {
    const lowerSearch = searchText.toLowerCase();
    return (
      (user.full_name && user.full_name.toLowerCase().includes(lowerSearch)) ||
      (user.student_id && user.student_id.includes(lowerSearch)) ||
      (user.email && user.email.toLowerCase().includes(lowerSearch))
    );
  });

  // --- Table Columns ---
  const columns = [
    {
      title: 'โปรไฟล์',
      dataIndex: 'profile_img',
      key: 'profile',
      width: 80,
      align: 'center',
      render: (img, record) => (
        <Badge dot color={record.status === 'active' ? 'green' : 'red'} offset={[-8, 45]}>
          <Avatar 
            src={img ? `${API_URL}/uploads/profiles/${img}?t=${Date.now()}` : null} 
            size={50} 
            icon={<UserOutlined />}
            className={`shadow-sm border-2 ${record.status === 'active' ? 'border-green-100' : 'border-red-100 grayscale opacity-70'} bg-slate-200 text-slate-400`}
          />
        </Badge>
      )
    },
    {
      title: 'ข้อมูลพื้นฐาน',
      key: 'basic_info',
      width: 220,
      render: (_, record) => (
        <div className="flex flex-col justify-center">
          <Text strong className={`text-[15px] ${record.status === 'active' ? 'text-slate-800' : 'text-slate-400 line-through'} mb-0.5`}>
            {record.full_name}
          </Text>
          <Space size={4} className="text-slate-400 text-xs">
            {record.role === 'student' ? <IdcardOutlined /> : <SafetyCertificateOutlined />}
            {record.role === 'student' ? record.student_id || 'ไม่มีรหัส' : `ID: ${record.id}`}
          </Space>
        </div>
      )
    },
    {
      title: 'สังกัด / ระดับชั้น',
      key: 'affiliation',
      width: 160,
      render: (_, record) => (
        <>
          {record.role === 'student' ? (
            <div className="flex flex-col items-start gap-1">
              {record.student_level && <Tag color={getLevelColor(record.student_level)} className="m-0 border-0 font-medium">{record.student_level}</Tag>}
              {record.student_group && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">กลุ่ม {record.student_group}</span>}
            </div>
          ) : (
            <span className="text-slate-400 italic text-xs">- บุคลากร -</span>
          )}
        </>
      )
    },
    {
      title: 'การติดต่อ',
      key: 'contact',
      width: 220,
      render: (_, record) => (
        <div className="flex flex-col gap-1 text-slate-600 text-sm">
          {record.email ? <div><MailOutlined className="text-slate-400 mr-2" />{record.email}</div> : <span className="text-slate-300 text-xs italic">ไม่มีอีเมล</span>}
          {record.phone ? <div><PhoneOutlined className="text-slate-400 mr-2" />{record.phone}</div> : <span className="text-slate-300 text-xs italic">ไม่มีเบอร์โทร</span>}
        </div>
      )
    },
    {
      title: 'สถานะบัญชี',
      key: 'role_status',
      width: 150,
      align: 'center',
      render: (_, record) => {
        let config = { color: 'default', text: record.role, icon: <UserOutlined /> };
        switch(record.role) {
          case 'department_head': config = { color: 'gold', text: 'หัวหน้าแผนก', icon: <StarFilled /> }; break;
          case 'teacher': config = { color: 'geekblue', text: 'อาจารย์', icon: <TeamOutlined /> }; break;
          case 'student': config = { color: 'cyan', text: 'นักเรียน', icon: <BookOutlined /> }; break;
          default: break;
        }

        return (
          <div className="flex flex-col items-center gap-2">
            <Tag color={config.color} icon={config.icon} className="m-0 px-3 py-0.5 rounded-full text-[12px] font-medium border-0 shadow-sm w-full text-center">
              {config.text}
            </Tag>
            {record.status === 'active' 
              ? <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-full text-center"><CheckCircleOutlined className="mr-1"/>ใช้งานได้</span>
              : <span className="text-[11px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded w-full text-center"><StopOutlined className="mr-1"/>ระงับการใช้งาน</span>
            }
          </div>
        );
      }
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไขโปรไฟล์">
            <Button 
              type="primary" 
              ghost 
              shape="circle" 
              icon={<EditOutlined />} 
              onClick={() => handleEditClick(record)}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            />
          </Tooltip>
          
          {/* ✅ เปลี่ยน Tooltip และข้อความเป็น "ลบถาวร" และใช้ไอคอนถังขยะ */}
          <Tooltip title="ลบข้อมูลผู้ใช้งาน (ลบถาวร)">
            <Popconfirm
              title="ยืนยันการลบข้อมูล?"
              description={
                <div className="text-slate-500 mt-1">
                  ข้อมูลทั้งหมดรวมถึง <b>รูปภาพโปรไฟล์</b> <br/>
                  จะถูกลบออกจากฐานข้อมูลอย่างถาวร
                </div>
              }
              onConfirm={() => handleDelete(record.id)}
              okText="ลบถาวร"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true, className: "bg-red-500 hover:bg-red-600" }}
            >
              <Button 
                danger 
                shape="circle" 
                icon={<DeleteOutlined />} 
                className="bg-red-50 border-red-200 hover:bg-red-100 hover:text-red-600 text-red-400 transition-colors"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];

  // --- Render ---
  return (
    <Layout className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <Layout className="site-layout">
        <Content className="p-8">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Title level={3} className="!mb-1 !text-slate-800 flex items-center gap-3">
                  <TeamOutlined className="text-indigo-600" /> จัดการผู้ใช้งาน
                </Title>
                <Text className="text-slate-500">ดูแลและจัดการบัญชีผู้ใช้ บุคลากร และนักเรียนในระบบ</Text>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <Input 
                  prefix={<SearchOutlined className="text-slate-400" />} 
                  placeholder="ค้นหาชื่อ, รหัสนักศึกษา, อีเมล..." 
                  bordered={false}
                  className="w-72"
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Divider type="vertical" className="h-6" />
                <div className="pr-3 text-xs font-bold text-indigo-600 whitespace-nowrap">
                  {filteredData.length} รายการ
                </div>
              </div>
            </div>

            {/* Table Card */}
            <Card 
              className="rounded-2xl shadow-lg shadow-slate-200/50 border-0 overflow-hidden" 
              bodyStyle={{ padding: 0 }}
            >
              <Table 
                columns={columns} 
                dataSource={filteredData} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 1050 }}
                className="custom-table"
                rowClassName={(record) => record.status === 'inactive' ? 'bg-slate-50/50' : 'hover:bg-slate-50 transition-colors'}
              />
            </Card>

          </div>
        </Content>
      </Layout>

      {/* --- Edit Modal --- */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-slate-800 text-lg py-2 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
              <EditOutlined className="text-xl" />
            </div>
            <div>
              <div className="font-bold">แก้ไขข้อมูลโปรไฟล์</div>
              <div className="text-xs text-slate-400 font-normal mt-0.5">อัปเดตข้อมูลส่วนตัว บทบาท และการเข้าถึงระบบ</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="บันทึกการเปลี่ยนแปลง"
        cancelText="ยกเลิก"
        confirmLoading={loading}
        centered
        width={750}
        maskClosable={false}
        bodyStyle={{ padding: '24px' }}
        okButtonProps={{ className: "bg-indigo-600 shadow-md hover:bg-indigo-500", size: "large" }}
        cancelButtonProps={{ size: "large" }}
      >
        <Form form={form} layout="vertical" className="mt-2">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* ซ้าย: อัปโหลดรูปภาพ */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="bg-slate-50 w-full rounded-2xl p-6 flex flex-col items-center border border-slate-100">
                <Form.Item noStyle>
                  <Upload
                    listType="picture-circle"
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    accept="image/*"
                    showUploadList={{ showPreviewIcon: false }}
                    className="custom-upload-avatar"
                  >
                    {fileList.length < 1 && (
                      <div className="text-indigo-400 flex flex-col items-center hover:text-indigo-500 transition-colors">
                        <UploadOutlined className="text-2xl mb-2" />
                        <span className="text-xs font-medium">เปลี่ยนรูปภาพ</span>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
                <div className="text-[11px] text-slate-400 mt-4 text-center leading-relaxed">
                  รองรับไฟล์ .JPG, .PNG<br/>ขนาดไม่เกิน 2MB
                </div>
              </div>

              {/* Status & Role Display */}
              <div className="w-full mt-4 space-y-3">
                <Form.Item label={<span className="text-xs font-semibold text-slate-500">สถานะบัญชี</span>} name="status" className="mb-0">
                  <Select size="large">
                    <Option value="active"><Badge status="success" text="ใช้งาน (Active)" /></Option>
                    <Option value="inactive"><Badge status="error" text="ระงับ (Inactive)" /></Option>
                  </Select>
                </Form.Item>
                <Form.Item label={<span className="text-xs font-semibold text-slate-500">บทบาทผู้ใช้</span>} name="role" rules={[{ required: true }]}>
                  <Select size="large">
                    <Option value="student">นักเรียน (Student)</Option>
                    <Option value="teacher">อาจารย์ (Teacher)</Option>
                    <Option value="department_head">หัวหน้าแผนก (Head)</Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* ขวา: ข้อมูลฟอร์ม */}
            <div className="w-full md:w-2/3">
              <Divider orientation="left" className="!mt-0 !mb-4 text-slate-400 text-xs font-normal border-slate-200">
                ข้อมูลส่วนตัว (Personal Info)
              </Divider>
              
              <Form.Item label="ชื่อ-นามสกุล" name="full_name" rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}>
                <Input size="large" placeholder="ระบุชื่อ-นามสกุล" prefix={<UserOutlined className="text-slate-400 mr-1" />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="อีเมล" name="email">
                    <Input size="large" placeholder="example@email.com" prefix={<MailOutlined className="text-slate-400 mr-1" />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="เบอร์โทรศัพท์" name="phone">
                    <Input size="large" placeholder="08X-XXX-XXXX" prefix={<PhoneOutlined className="text-slate-400 mr-1" />} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" className="!my-4 text-slate-400 text-xs font-normal border-slate-200">
                ความปลอดภัย (Security)
              </Divider>

              <Form.Item 
                label="เปลี่ยนรหัสผ่านใหม่" 
                name="password" 
                tooltip="หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้"
              >
                <Input.Password size="large" placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน" prefix={<LockOutlined className="text-slate-400 mr-1" />} />
              </Form.Item>

              {/* ข้อมูลการเรียน */}
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
                {({ getFieldValue }) => 
                  getFieldValue('role') === 'student' ? (
                    <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mt-6 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold text-sm tracking-wide">
                        <BookOutlined /> ข้อมูลทางวิชาการ (Academic Info)
                      </div>
                      
                      <Form.Item label="รหัสนักศึกษา" name="student_id" rules={[{ required: true, message: 'กรุณากรอกรหัสนักศึกษา' }]}>
                        <Input size="large" prefix={<IdcardOutlined className="text-slate-400 mr-1" />} placeholder="รหัสนักศึกษา 11 หลัก" />
                      </Form.Item>

                      <Row gutter={16} className="mb-0">
                        <Col span={12}>
                          <Form.Item label="ระดับชั้น" name="student_level" className="mb-0">
                            <Select size="large" placeholder="เลือกระดับชั้น">
                              <Option value="ปวช. 1">ปวช. 1</Option>
                              <Option value="ปวช. 2">ปวช. 2</Option>
                              <Option value="ปวช. 3">ปวช. 3</Option>
                              <Option value="ปวส. 1">ปวส. 1</Option>
                              <Option value="ปวส. 2">ปวส. 2</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="กลุ่มเรียน" name="student_group" className="mb-0">
                            <Input size="large" placeholder="เช่น 1 หรือ 2" prefix={<HomeOutlined className="text-slate-400 mr-1" />} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ) : null
                }
              </Form.Item>

            </div>
          </div>
        </Form>
      </Modal>

      {/* --- CSS เพิ่มเติมเพื่อความสวยงาม --- */}
      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #475569;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
        }
        .ant-modal-content {
          border-radius: 20px;
          overflow: hidden;
        }
        .custom-upload-avatar .ant-upload.ant-upload-select-picture-circle {
          width: 110px;
          height: 110px;
          border: 2px dashed #cbd5e1;
          background-color: white;
          transition: all 0.3s;
        }
        .custom-upload-avatar .ant-upload.ant-upload-select-picture-circle:hover {
          border-color: #6366f1;
          background-color: #eef2ff;
        }
      `}</style>
    </Layout>
  );
};

export default ManageUsers;