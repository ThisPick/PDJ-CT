import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Button, Table, Tag, Modal, Form, Input, 
  InputNumber, Select, Switch, Space, Typography, Popconfirm, 
  message, Tooltip, Empty, Divider, Statistic, Badge 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SaveOutlined, EditOutlined, 
  SearchOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { rubricService } from '../services/rubricService';
import AdminSidebar from '../Adminpage/AdminSidebar';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Theme Colors
const COLORS = {
  primary: '#4F46E5', // Indigo
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#EF4444',  // Red
  bg: '#F3F4F6'       // Slate/Gray
};

/* -------------------------------------------------------------------------- */
/* Sub-Component: Form Modal (Clean Version)                                  */
/* -------------------------------------------------------------------------- */
const RubricForm = ({ visible, onCancel, onSave, initialValues, saving }) => {
  const [form] = Form.useForm();
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
        calculateTotal(initialValues.rubric_data);
      } else {
        form.setFieldsValue({
          academic_year: new Date().getFullYear() + 543,
          level: 'ปวส.2', 
          department: 'เทคโนโลยีคอมพิวเตอร์', 
          is_active: true,
          rubric_data: [{ item_name: '', description: '', max_score: 0 }]
        });
        setTotalScore(0);
      }
    }
  }, [visible, initialValues, form]);

  const calculateTotal = (items = []) => {
    const sum = items.reduce((acc, it) => acc + (Number(it?.max_score) || 0), 0);
    setTotalScore(sum);
  };

  return (
    <Modal 
      title={
        <div className="py-2">
           <Title level={4} style={{ margin: 0 }}>{initialValues ? "แก้ไขเกณฑ์การประเมิน" : "สร้างเกณฑ์การประเมินใหม่"}</Title>
           <Text type="secondary" style={{ fontSize: '14px' }}>กำหนดรายละเอียดและคะแนนให้ครบ 100 คะแนน</Text>
        </div>
      }
      open={visible} 
      onCancel={onCancel} 
      footer={null} 
      width={1000} 
      centered
      destroyOnClose
      className="rubric-modal"
      styles={{ body: { padding: '24px 32px' } }}
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={(v) => onSave({...v, total_full_score: totalScore})} 
        onValuesChange={(_, v) => calculateTotal(v.rubric_data)}
        size="large"
      >
        {/* Header Inputs */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
          <Row gutter={[24, 16]}>
            <Col span={16}>
              <Form.Item name="title" label={<span className="font-bold text-gray-600">ชื่อชุดเกณฑ์การประเมิน</span>} rules={[{required:true, message:'กรุณาระบุชื่อเกณฑ์'}]}>
                <Input placeholder="เช่น การประเมินโครงงานวิชาชีพ 1 (บทที่ 1-3)" style={{ borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="academic_year" label={<span className="font-bold text-gray-600">ปีการศึกษา</span>} rules={[{required:true}]}>
                <InputNumber className="w-full" style={{ borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="level" label={<span className="font-bold text-gray-600">ระดับชั้น</span>}>
                <Select style={{ borderRadius: '8px' }} options={[{value:'ปวช.3', label:'ปวช.3'}, {value:'ปวส.2', label:'ปวส.2'}]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label={<span className="font-bold text-gray-600">แผนก/สาขาวิชา</span>}>
                <Input style={{ borderRadius: '8px' }} placeholder="ระบุสาขาวิชา" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label={<span className="font-bold text-gray-600">สถานะ</span>} valuePropName="checked">
                 <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิด" className="bg-gray-300" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Rubric Items Section */}
        <div className="flex justify-between items-center mb-4">
             <Title level={5} style={{ margin: 0 }}>รายการหัวข้อประเมิน</Title>
             <Badge count={`${totalScore}/100`} style={{ backgroundColor: totalScore === 100 ? COLORS.success : COLORS.danger, fontSize: '14px', padding: '0 8px' }} />
        </div>

        <Form.List name="rubric_data">
          {(fields, { add, remove }) => (
            <div className="custom-scrollbar" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '8px', paddingBottom: '10px' }}>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} className="group relative bg-white p-5 rounded-xl border border-gray-200 mb-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
                  <div className="absolute top-4 right-4 opacity-100 lg:opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '18px' }} />} onClick={() => remove(name)} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                      <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold text-sm">
                          ลำดับที่ {index + 1}
                      </div>
                  </div>
                  
                  <Row gutter={16} align="top">
                    <Col span={18}>
                      <Form.Item {...restField} name={[name, 'item_name']} rules={[{required:true, message:'ใส่ชื่อหัวข้อ'}]} className="mb-3">
                        <Input placeholder="ชื่อหัวข้อ (เช่น ความสมบูรณ์ของเนื้อหา)" style={{ fontWeight: 500 }} variant="filled" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'description']} className="mb-0">
                        <TextArea placeholder="คำอธิบายเกณฑ์การให้คะแนนอย่างละเอียด..." autoSize={{ minRows: 2, maxRows: 4 }} variant="filled" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <div className="bg-gray-50 p-3 rounded-lg text-center h-full flex flex-col justify-center">
                          <Text type="secondary" className="text-xs mb-1 uppercase tracking-wide">คะแนนเต็ม</Text>
                          <Form.Item {...restField} name={[name, 'max_score']} rules={[{required:true}]} className="mb-0">
                            <InputNumber 
                                min={0} max={100} 
                                className="w-full input-score-lg" 
                                placeholder="0" 
                                controls={false}
                                style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, background: 'transparent', border: 'none' }}
                            />
                          </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
              
              <Button type="dashed" block onClick={() => add()} icon={<PlusOutlined />} size="large" className="h-14 text-lg border-indigo-300 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 mt-2">
                เพิ่มหัวข้อการประเมิน
              </Button>
            </div>
          )}
        </Form.List>

        {/* Footer Action Bar */}
        <div className="flex justify-between items-center p-4 mt-6 bg-slate-800 text-white rounded-xl shadow-lg">
          <div className="flex items-center gap-4 px-2">
            <div>
                <div className="text-xs text-gray-400 uppercase">คะแนนรวมทั้งหมด</div>
                <div className={`text-3xl font-black ${totalScore === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalScore} <span className="text-lg text-gray-500 font-normal">/ 100</span>
                </div>
            </div>
            {totalScore !== 100 && <div className="text-xs text-rose-300 bg-rose-900/50 px-2 py-1 rounded">ต้องรวมให้ได้ 100</div>}
          </div>
          <Space size="middle">
            <Button onClick={onCancel} size="large" className="bg-transparent text-white border-gray-600 hover:text-gray-300 hover:border-gray-500">ยกเลิก</Button>
            <Button 
              type="primary" 
              size="large" 
              loading={saving} 
              onClick={() => form.submit()}
              icon={<SaveOutlined />}
              disabled={totalScore !== 100}
              className="h-12 px-8 font-bold text-lg bg-indigo-600 hover:bg-indigo-500 border-none shadow-indigo-500/50 shadow-lg"
            >
              บันทึกข้อมูล
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */
const RubricSettings = () => {
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewData, setViewData] = useState(null);
  
  // State Filter
  const [q, setQ] = useState('');
  const [year, setYear] = useState(null);

  // User Data
  const userData = localStorage.getItem('user');
  const localUser = userData ? JSON.parse(userData) : {};
  const canManage = localUser.role === 'teacher' || localUser.role === 'department_head';

  const load = async () => { 
    setLoading(true); 
    try { 
      const data = await rubricService.getAll();
      setRubrics(Array.isArray(data) ? data : []); 
    } catch(e) {
      message.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally { 
      setLoading(false); 
    } 
  };
  
  useEffect(() => { load(); }, []);

  const filtered = rubrics.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) && (!year || r.academic_year === year));
  const years = [...new Set(rubrics.map(r => r.academic_year))].sort((a,b) => b-a);

  // Role Helper
  const getRoleLabel = (role) => {
    if (!role) return '';
    const r = String(role).toLowerCase();
    if (r === 'department_head') return 'หัวหน้าแผนก';
    if (r === 'teacher') return 'อาจารย์ผู้สอน';
    return role;
  };

  // --- Table Columns ---
  const columns = [
    { 
      title: 'ชื่อชุดเกณฑ์', 
      dataIndex: 'title',
      width: '30%',
      render: (t, r) => (
        <div className="flex flex-col py-2">
            <Text strong style={{ color: '#1e293b', fontSize: '16px' }}>{t}</Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                {r.department || 'ไม่ระบุแผนก'}
            </Text>
        </div>
      )
    },
    { 
      title: 'ระดับชั้น', 
      dataIndex: 'level', 
      align: 'center',
      width: '10%',
      render: (l) => <Tag color={l === 'ปวช.3' ? 'cyan' : 'geekblue'} className="rounded-md px-3 py-1 text-sm font-bold border-0">{l}</Tag> 
    },
    { 
      title: 'ปีการศึกษา', 
      dataIndex: 'academic_year', 
      align: 'center',
      width: '10%',
      render: (y) => (
        <span className="text-gray-600 font-bold text-lg">{y}</span>
      )
    },
    { 
      title: 'ผู้ดำเนินการ', 
      width: '20%',
      render: (_, record) => {
        const creator = { name: record.creator_name || record.full_name || 'System', role: record.creator_role || record.role };
        return (
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block w-full">
            <div className="flex flex-col">
                <Text style={{ fontSize: '13px', fontWeight: 600 }}>{creator.name}</Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>{getRoleLabel(creator.role)}</Text>
            </div>
          </div>
        );
      }
    },
    { 
      title: 'สถานะ', 
      dataIndex: 'is_active', 
      align: 'center',
      width: '10%',
      render: (v, r) => (
        <Switch 
          checked={v} 
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          disabled={!canManage} 
          onChange={async (c) => { await rubricService.toggleStatus(r.rubric_id, c); load(); }} 
          className={v ? "bg-emerald-500" : "bg-gray-300"}
        />
      )
    },
    { 
      title: 'จัดการ', 
      align: 'right', 
      fixed: 'right',
      width: '20%',
      render: (_, r) => (
        <Space size="small">
            <Button 
                type="default" 
                icon={<SearchOutlined />} 
                onClick={() => { setViewData(r); setViewModalVisible(true); }}
                className="rounded-lg border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-600"
            >
                ดูข้อมูล
            </Button>
          {canManage && (
            <>
              <Tooltip title="แก้ไข">
                <Button type="primary" ghost icon={<EditOutlined />} onClick={() => { setEditing({id: r.rubric_id, initial: r}); setModalVisible(true); }} className="rounded-lg border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" />
              </Tooltip>
              <Popconfirm 
                title="ลบเกณฑ์ประเมิน"
                description="คุณแน่ใจหรือไม่ที่จะลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                okText="ยืนยันลบ" 
                cancelText="ยกเลิก" 
                okButtonProps={{ danger: true }}
                onConfirm={async () => { await rubricService.delete(r.rubric_id); load(); }}
              >
                <Tooltip title="ลบ">
                  <Button danger icon={<DeleteOutlined />} className="rounded-lg border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="flex w-full min-h-screen bg-[#F8F9FA]">
      <AdminSidebar/>
      <div className="flex-1 p-6 lg:p-10 transition-all overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto">
          
          {/* --- Header Section --- */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <Title level={1} className="!mb-2 !font-black text-slate-800">
                ระบบจัดการเกณฑ์ประเมิน
              </Title>
              <Text className="text-slate-500 text-lg">กำหนดและบริหารจัดการ Criteria Scoring Rubrics สำหรับโครงการนักศึกษา</Text>
            </div>
            {canManage && (
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                onClick={() => { setEditing(null); setModalVisible(true); }} 
                className="h-14 px-8 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1"
              >
                สร้างเกณฑ์ใหม่
              </Button>
            )}
          </div>
          
          {/* --- Filter Section --- */}
          <Card className="mb-8 rounded-2xl shadow-sm border border-slate-200/60 bg-white" bordered={false} bodyStyle={{ padding: '24px' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={10}>
                <Input 
                  placeholder="ค้นหาชื่อเกณฑ์ / สาขาวิชา..." 
                  prefix={<SearchOutlined className="text-slate-400 text-lg" />} 
                  size="large"
                  allowClear
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  className="rounded-xl py-3 text-lg bg-slate-50 border-slate-200 hover:bg-white focus:bg-white"
                />
              </Col>
              <Col xs={24} md={6}>
                <Select 
                  placeholder="ปีการศึกษา" 
                  allowClear 
                  size="large"
                  className="w-full"
                  style={{ height: '52px' }}
                  value={year} 
                  onChange={v => setYear(v)} 
                  options={years.map(y => ({label: `ปีการศึกษา ${y}`, value: y}))} 
                />
              </Col>
              <Col xs={24} md={4}>
                <Button 
                  block
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={() => { setQ(''); setYear(null); }}
                  disabled={!q && !year}
                  className="h-[52px] rounded-xl text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-600"
                >
                  ล้างค่า
                </Button>
              </Col>
              <Col xs={24} md={4} className="text-right hidden md:block">
                 <div className="bg-indigo-50 inline-block px-4 py-2 rounded-lg">
                    <Text strong className="text-indigo-600 text-lg">{filtered.length}</Text> <Text className="text-indigo-400">รายการ</Text>
                 </div>
              </Col>
            </Row>
          </Card>

          {/* --- Data Table --- */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <Table 
              columns={columns} 
              dataSource={filtered} 
              loading={loading} 
              rowKey="rubric_id" 
              pagination={{ 
                  pageSize: 8, 
                  showTotal: (total) => <span className="text-gray-400 font-medium">ทั้งหมด {total} รายการ</span>,
                  className: "p-6"
              }}
              locale={{ 
                  emptyText: <Empty description={<span className="text-gray-400 text-lg">ไม่พบข้อมูลเกณฑ์ประเมิน</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-20" /> 
              }}
              rowClassName="hover:bg-slate-50 transition-colors cursor-default"
              size="middle"
            />
          </div>
        </div>
      </div>

      <RubricForm 
        visible={modalVisible} 
        saving={saving}
        onCancel={() => setModalVisible(false)} 
        onSave={async (v) => {
          setSaving(true);
          try {
            const userStr = localStorage.getItem('user');
            const u = userStr ? JSON.parse(userStr) : {};
            const currentUserId = u.id; 

            if (!currentUserId) {
              message.error("ไม่พบรหัสผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
              setSaving(false);
              return;
            }

            const payload = {
              title: v.title,
              academic_year: v.academic_year,
              level: v.level,
              department: v.department,
              is_active: v.is_active,
              rubric_data: v.rubric_data,
              total_full_score: v.total_full_score || 100, 
              updated_by: currentUserId 
            };

            if (editing) {
              await rubricService.update(editing.id, payload);
              message.success(`อัปเดตเกณฑ์เรียบร้อย`);
            } else {
              const createData = { ...payload, created_by: currentUserId };
              await rubricService.create(createData);
              message.success(`สร้างเกณฑ์ใหม่เรียบร้อย`);
            }

            setModalVisible(false);
            load(); 

          } catch (e) {
            console.error("Save Error:", e);
            message.error(e.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ");
          } finally {
            setSaving(false);
          }
        }}
        initialValues={editing?.initial} 
      />

      {/* --- View Detail Modal --- */}
      <Modal 
        title={
            <div className="flex flex-col border-b pb-4 mb-4">
                <span className="text-xl font-bold text-slate-800">รายละเอียดเกณฑ์ประเมิน</span>
                <span className="text-sm text-slate-400">โครงสร้างคะแนนและหัวข้อการประเมิน</span>
            </div>
        }
        open={viewModalVisible} 
        onCancel={() => setViewModalVisible(false)} 
        footer={[
            <Button key="close" type="primary" size="large" onClick={() => setViewModalVisible(false)} className="px-8 rounded-xl h-12 bg-slate-800 hover:bg-slate-700 border-none">ปิดหน้าต่าง</Button>
        ]}
        width={800}
        centered
        className="view-modal"
        styles={{ body: { padding: '0 24px 24px' } }}
      >
        <div className="grid grid-cols-3 gap-4 mb-6">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">ระดับชั้น</div>
              <div className="text-slate-800 text-lg font-bold">{viewData?.level}</div>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">สาขาวิชา</div>
              <div className="text-slate-800 text-lg font-bold">{viewData?.department || '-'}</div>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-xs uppercase font-bold mb-1">ปีการศึกษา</div>
              <div className="text-slate-800 text-lg font-bold">{viewData?.academic_year}</div>
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <Table
            dataSource={viewData?.rubric_data || []}
            pagination={false}
            rowKey={(r, i) => i}
            columns={[
                { title: '#', width: 60, align: 'center', render: (t, r, i) => <span className="text-slate-400 font-bold">{i + 1}</span> },
                { 
                title: 'หัวข้อการประเมิน', 
                dataIndex: 'item_name', 
                render: (t, r) => (
                    <div className="py-2">
                    <div className="text-base font-bold text-slate-700">{t}</div>
                    <div className="text-slate-500 mt-1 leading-relaxed">{r.description}</div>
                    </div>
                ) 
                },
                { title: 'คะแนน', dataIndex: 'max_score', align: 'center', width: 100, render: (s) => <div className="text-lg font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{s}</div> }
            ]}
            summary={(pageData) => {
                let total = 0;
                pageData.forEach(({ max_score }) => total += Number(max_score));
                return (
                <Table.Summary.Row className="bg-slate-50">
                    <Table.Summary.Cell index={0} colSpan={2} align="right"><span className="text-base font-bold text-slate-600 pr-4">คะแนนรวมสุทธิ</span></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center"><span className="text-2xl font-black text-emerald-500">{total}</span></Table.Summary.Cell>
                </Table.Summary.Row>
                );
            }}
            />
        </div>
      </Modal>

      {/* Custom Styles Injection */}
      <style jsx="true">{`
        .ant-table-thead > tr > th { 
            background: #f1f5f9 !important; 
            color: #475569 !important; 
            font-weight: 700 !important; 
            font-size: 15px !important;
            padding-top: 20px !important;
            padding-bottom: 20px !important;
        }
        .ant-modal-content { border-radius: 24px !important; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important; }
        .rubric-modal .ant-modal-header { border-bottom: 1px solid #e2e8f0; margin-bottom: 24px; padding-bottom: 16px; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .ant-input-number-input { font-weight: bold; }
      `}</style>
    </div>
  );
};

export default RubricSettings;