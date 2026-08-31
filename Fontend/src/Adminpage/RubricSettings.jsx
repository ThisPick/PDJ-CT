import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, Row, Col, Button, Table, Tag, Modal, Form, Input, 
  InputNumber, Select, Switch, Space, Typography, Popconfirm, 
  Tooltip, Empty, Badge
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SaveOutlined, EditOutlined, 
  SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  BellOutlined, FireOutlined, StarOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { rubricService } from '../services/rubricService';
import AdminSidebar from '../Adminpage/AdminSidebar';

const { Title, Text } = Typography;
const { TextArea } = Input;

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔊 Web Audio Sound Engine                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const useSoundEngine = () => {
  const ctx = useRef(null);
  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctx.current;
  };

  const play = useCallback((type) => {
    const ac = getCtx();
    const now = ac.currentTime;

    const configs = {
      click: [
        { freq: 880, dur: 0.06, vol: 0.12, type: 'sine', delay: 0 },
      ],
      success: [
        { freq: 523, dur: 0.12, vol: 0.15, type: 'sine', delay: 0 },
        { freq: 659, dur: 0.12, vol: 0.15, type: 'sine', delay: 0.1 },
        { freq: 784, dur: 0.18, vol: 0.15, type: 'sine', delay: 0.2 },
        { freq: 1047, dur: 0.25, vol: 0.12, type: 'sine', delay: 0.32 },
      ],
      error: [
        { freq: 200, dur: 0.15, vol: 0.2, type: 'sawtooth', delay: 0 },
        { freq: 150, dur: 0.25, vol: 0.2, type: 'sawtooth', delay: 0.12 },
      ],
      delete: [
        { freq: 440, dur: 0.08, vol: 0.15, type: 'sine', delay: 0 },
        { freq: 330, dur: 0.08, vol: 0.15, type: 'sine', delay: 0.08 },
        { freq: 220, dur: 0.15, vol: 0.12, type: 'sine', delay: 0.16 },
      ],
      confirm: [
        { freq: 600, dur: 0.08, vol: 0.12, type: 'sine', delay: 0 },
        { freq: 800, dur: 0.1, vol: 0.12, type: 'sine', delay: 0.1 },
      ],
      open: [
        { freq: 400, dur: 0.08, vol: 0.1, type: 'sine', delay: 0 },
        { freq: 600, dur: 0.12, vol: 0.1, type: 'sine', delay: 0.07 },
      ],
      notification: [
        { freq: 880, dur: 0.08, vol: 0.1, type: 'sine', delay: 0 },
        { freq: 1100, dur: 0.12, vol: 0.1, type: 'sine', delay: 0.1 },
      ],
    };

    (configs[type] || configs.click).forEach(({ freq, dur, vol, type: wt, delay }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = wt;
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(vol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.01);
    });
  }, []);

  return play;
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔔 Beautiful Notification System                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
const NOTIF_TYPES = {
  success: {
    icon: '✦',
    gradient: 'linear-gradient(135deg, #059669, #10B981)',
    border: '#6EE7B7',
    glow: 'rgba(16,185,129,0.35)',
    label: 'สำเร็จ',
    accent: '#34D399',
  },
  error: {
    icon: '✕',
    gradient: 'linear-gradient(135deg, #DC2626, #EF4444)',
    border: '#FCA5A5',
    glow: 'rgba(239,68,68,0.35)',
    label: 'ข้อผิดพลาด',
    accent: '#F87171',
  },
  info: {
    icon: '◈',
    gradient: 'linear-gradient(135deg, #4F46E5, #6366F1)',
    border: '#A5B4FC',
    glow: 'rgba(99,102,241,0.35)',
    label: 'ข้อมูล',
    accent: '#818CF8',
  },
  warning: {
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
    border: '#FCD34D',
    glow: 'rgba(245,158,11,0.35)',
    label: 'คำเตือน',
    accent: '#FBBF24',
  },
};

const NotificationItem = ({ notif, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  const t = NOTIF_TYPES[notif.type] || NOTIF_TYPES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(notif.id), 400);
    }, notif.duration || 4000);
    return () => clearTimeout(timer);
  }, [notif.id, notif.duration, onRemove]);

  return (
    <div
      style={{
        animation: exiting
          ? 'notifExit 0.4s cubic-bezier(0.4,0,0.2,1) forwards'
          : 'notifEnter 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
        marginBottom: '12px',
        position: 'relative',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${t.border}30`,
        boxShadow: `0 8px 32px ${t.glow}, 0 0 0 1px rgba(255,255,255,0.05) inset`,
        minWidth: '340px',
        maxWidth: '420px',
        cursor: 'pointer',
      }}
      onClick={() => { setExiting(true); setTimeout(() => onRemove(notif.id), 400); }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: t.gradient }} />

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '2px',
        background: t.gradient, borderRadius: '0 0 0 18px',
        animation: `notifProgress ${notif.duration || 4000}ms linear forwards`,
        width: '100%',
        transformOrigin: 'left',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px' }}>
        {/* Icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: t.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: '#fff', fontWeight: 900,
          boxShadow: `0 4px 12px ${t.glow}`,
        }}>
          {t.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: t.accent, fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.label}</span>
          </div>
          <div style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 600, lineHeight: 1.5 }}>{notif.message}</div>
          {notif.description && (
            <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>{notif.description}</div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setExiting(true); setTimeout(() => onRemove(notif.id), 400); }}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#64748B', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', transition: 'background 0.2s' }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => (
  <div style={{
    position: 'fixed', top: '24px', right: '24px',
    zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    pointerEvents: 'none',
  }}>
    {notifications.map(n => (
      <div key={n.id} style={{ pointerEvents: 'all' }}>
        <NotificationItem notif={n} onRemove={onRemove} />
      </div>
    ))}
  </div>
);

let _notifId = 0;
const useNotification = (sound) => {
  const [notifs, setNotifs] = useState([]);
  const show = useCallback((type, message, description, duration) => {
    const id = ++_notifId;
    setNotifs(prev => [...prev, { id, type, message, description, duration: duration || 4000 }]);
    if (sound) {
      const soundMap = { success: 'success', error: 'error', info: 'notification', warning: 'confirm' };
      sound(soundMap[type] || 'notification');
    }
  }, [sound]);
  const remove = useCallback((id) => setNotifs(prev => prev.filter(n => n.id !== id)), []);
  return { notifs, show, remove };
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🎨 Animated Stats Card                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
const StatsCard = ({ icon, value, label, color, delay }) => (
  <div style={{
    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
    borderRadius: '20px', padding: '20px 24px',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: '16px',
    animation: `fadeSlideUp 0.6s ease ${delay}s both`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.1)`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
  >
    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: `0 4px 16px ${color}60` }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 📝 Rubric Form Modal                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const RubricForm = ({ visible, onCancel, onSave, initialValues, saving, sound }) => {
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
          rubric_data: [{ item_name: '', description: '', max_score: 0 }],
        });
        setTotalScore(0);
      }
    }
  }, [visible, initialValues, form]);

  const calculateTotal = (items = []) => {
    const sum = items.reduce((acc, it) => acc + (Number(it?.max_score) || 0), 0);
    setTotalScore(sum);
  };

  const isValid = totalScore === 100;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={() => { sound?.('click'); onCancel(); }}
      footer={null}
      width={1060}
      centered
      destroyOnClose
      styles={{
        content: { borderRadius: '28px', overflow: 'hidden', padding: 0, boxShadow: '0 32px 80px rgba(0,0,0,0.25)' },
        body: { padding: 0 },
        mask: { backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.7)' },
      }}
    >
      {/* Modal Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', padding: '28px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: '#818CF8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {initialValues ? '✦ แก้ไขเกณฑ์' : '✦ สร้างใหม่'}
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>
            {initialValues ? 'แก้ไขเกณฑ์การประเมิน' : 'สร้างเกณฑ์การประเมินใหม่'}
          </Title>
          <Text style={{ color: '#A5B4FC', fontSize: '14px' }}>กำหนดรายละเอียดและคะแนนให้รวมได้ 100 คะแนนพอดี</Text>
        </div>
      </div>

      {/* Form Body */}
      <div style={{ padding: '32px 36px', background: '#FAFBFF' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => onSave({ ...v, total_full_score: totalScore })}
          onValuesChange={(_, v) => calculateTotal(v.rubric_data)}
          size="large"
        >
          {/* Info Section */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>ข้อมูลพื้นฐาน</div>
            <Row gutter={[20, 0]}>
              <Col span={16}>
                <Form.Item name="title" label={<span style={{ fontWeight: 700, color: '#374151' }}>ชื่อชุดเกณฑ์การประเมิน</span>} rules={[{ required: true, message: 'กรุณาระบุชื่อเกณฑ์' }]}>
                  <Input placeholder="เช่น การประเมินโครงงานวิชาชีพ 1 (บทที่ 1-3)" style={{ borderRadius: '12px', borderColor: '#E2E8F0' }} onClick={() => sound?.('click')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="academic_year" label={<span style={{ fontWeight: 700, color: '#374151' }}>ปีการศึกษา</span>} rules={[{ required: true }]}>
                  <InputNumber className="w-full" style={{ borderRadius: '12px', borderColor: '#E2E8F0', width: '100%' }} onClick={() => sound?.('click')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="level" label={<span style={{ fontWeight: 700, color: '#374151' }}>ระดับชั้น</span>}>
                  <Select style={{ borderRadius: '12px' }} options={[{ value: 'ปวช.3', label: 'ปวช.3' }, { value: 'ปวส.2', label: 'ปวส.2' }]} onFocus={() => sound?.('click')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="department" label={<span style={{ fontWeight: 700, color: '#374151' }}>แผนก/สาขาวิชา</span>}>
                  <Input style={{ borderRadius: '12px', borderColor: '#E2E8F0' }} placeholder="ระบุสาขาวิชา" onClick={() => sound?.('click')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="is_active" label={<span style={{ fontWeight: 700, color: '#374151' }}>สถานะการใช้งาน</span>} valuePropName="checked">
                  <Switch checkedChildren="✓ เปิดใช้งาน" unCheckedChildren="ปิด" onChange={() => sound?.('click')} style={{ height: '32px' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Rubric Items */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>รายการหัวข้อประเมิน</div>
              <div style={{
                padding: '6px 16px', borderRadius: '50px',
                background: isValid ? 'linear-gradient(135deg, #059669, #10B981)' : 'linear-gradient(135deg, #DC2626, #EF4444)',
                color: '#fff', fontWeight: 800, fontSize: '13px',
                boxShadow: isValid ? '0 4px 12px rgba(16,185,129,0.4)' : '0 4px 12px rgba(239,68,68,0.4)',
                transition: 'all 0.3s',
              }}>
                {totalScore}/100 {isValid ? '✓' : ''}
              </div>
            </div>

            <Form.List name="rubric_data">
              {(fields, { add, remove }) => (
                <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '6px' }}>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div key={key} style={{
                      background: '#F8FAFF', borderRadius: '16px', padding: '20px',
                      border: '1px solid #E2E8F0', marginBottom: '12px',
                      transition: 'all 0.2s', position: 'relative',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                          ลำดับที่ {index + 1}
                        </div>
                        <Button
                          type="text" danger
                          icon={<DeleteOutlined />}
                          onClick={() => { sound?.('delete'); remove(name); }}
                          style={{ borderRadius: '10px', height: '32px' }}
                        />
                      </div>
                      <Row gutter={16}>
                        <Col span={18}>
                          <Form.Item {...restField} name={[name, 'item_name']} rules={[{ required: true, message: 'ใส่ชื่อหัวข้อ' }]} style={{ marginBottom: '10px' }}>
                            <Input placeholder="ชื่อหัวข้อการประเมิน..." style={{ borderRadius: '10px', fontWeight: 600, borderColor: '#E2E8F0' }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'description']} style={{ marginBottom: 0 }}>
                            <TextArea placeholder="คำอธิบายเกณฑ์การให้คะแนน..." autoSize={{ minRows: 2, maxRows: 3 }} style={{ borderRadius: '10px', borderColor: '#E2E8F0' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: '14px', padding: '16px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #C7D2FE' }}>
                            <div style={{ fontSize: '10px', color: '#6366F1', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>คะแนนเต็ม</div>
                            <Form.Item {...restField} name={[name, 'max_score']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                              <InputNumber min={0} max={100} controls={false} style={{ textAlign: 'center', fontSize: '32px', fontWeight: 900, color: '#4F46E5', width: '100%', background: 'transparent', border: 'none', boxShadow: 'none' }} />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Button
                    type="dashed" block onClick={() => { sound?.('click'); add(); }}
                    icon={<PlusOutlined />} size="large"
                    style={{ height: '52px', borderRadius: '14px', borderColor: '#A5B4FC', color: '#4F46E5', background: '#EEF2FF', fontWeight: 700, fontSize: '15px', marginTop: '8px' }}
                  >
                    + เพิ่มหัวข้อการประเมิน
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '20px', padding: '20px 28px', marginTop: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>คะแนนรวม</div>
                <div style={{ fontSize: '40px', fontWeight: 900, lineHeight: 1, color: isValid ? '#34D399' : '#F87171', transition: 'color 0.3s' }}>
                  {totalScore}
                  <span style={{ fontSize: '16px', color: '#475569', fontWeight: 400 }}> / 100</span>
                </div>
              </div>
              {!isValid && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '8px 14px', color: '#F87171', fontSize: '12px', fontWeight: 700 }}>
                  ⚠ ต้องรวมให้ได้ 100 คะแนน
                </div>
              )}
            </div>
            <Space size="middle">
              <Button onClick={() => { sound?.('click'); onCancel(); }} size="large" style={{ borderRadius: '12px', height: '48px', color: '#94A3B8', borderColor: '#334155', background: 'transparent', fontWeight: 600 }}>
                ยกเลิก
              </Button>
              <Button
                type="primary" size="large" loading={saving}
                onClick={() => { if (isValid) { sound?.('confirm'); form.submit(); } }}
                icon={<SaveOutlined />}
                disabled={!isValid}
                style={{
                  height: '48px', paddingInline: '32px', fontWeight: 800, fontSize: '16px', borderRadius: '12px',
                  background: isValid ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : undefined,
                  border: 'none',
                  boxShadow: isValid ? '0 8px 24px rgba(99,102,241,0.5)' : undefined,
                  transition: 'all 0.3s',
                }}
              >
                บันทึกข้อมูล
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🏠 Main Page                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
const RubricSettings = () => {
  const sound = useSoundEngine();
  const { notifs, show: notify, remove: removeNotif } = useNotification(sound);

  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [q, setQ] = useState('');
  const [year, setYear] = useState(null);

  const userData = localStorage.getItem('user');
  const localUser = userData ? JSON.parse(userData) : {};
  const canManage = localUser.role === 'teacher' || localUser.role === 'department_head';

  const load = async () => {
    setLoading(true);
    try {
      const data = await rubricService.getAll();
      setRubrics(Array.isArray(data) ? data : []);
    } catch {
      notify('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rubrics.filter(r =>
    r.title.toLowerCase().includes(q.toLowerCase()) &&
    (!year || r.academic_year === year)
  );
  const years = [...new Set(rubrics.map(r => r.academic_year))].sort((a, b) => b - a);
  const activeCount = rubrics.filter(r => r.is_active).length;

  const getRoleLabel = (role) => {
    if (!role) return '';
    const r = String(role).toLowerCase();
    if (r === 'department_head') return 'หัวหน้าแผนก';
    if (r === 'teacher') return 'อาจารย์ผู้สอน';
    return role;
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await rubricService.delete(id);
      notify('success', 'ลบเกณฑ์สำเร็จ', 'รายการถูกลบออกจากระบบแล้ว');
      load();
    } catch {
      notify('error', 'ลบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDeletingId(null);
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'ชื่อชุดเกณฑ์',
      dataIndex: 'title',
      width: '30%',
      render: (t, r) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px', marginBottom: '4px' }}>{t}</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
            {r.department || 'ไม่ระบุแผนก'}
          </div>
        </div>
      ),
    },
    {
      title: 'ระดับชั้น',
      dataIndex: 'level',
      align: 'center',
      width: '10%',
      render: (l) => (
        <span style={{
          padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
          background: l === 'ปวช.3' ? 'linear-gradient(135deg, #0891B2, #06B6D4)' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
          color: '#fff', boxShadow: l === 'ปวช.3' ? '0 2px 8px rgba(6,182,212,0.3)' : '0 2px 8px rgba(99,102,241,0.3)',
        }}>
          {l}
        </span>
      ),
    },
    {
      title: 'ปีการศึกษา',
      dataIndex: 'academic_year',
      align: 'center',
      width: '10%',
      render: (y) => <span style={{ fontWeight: 800, color: '#334155', fontSize: '16px' }}>{y}</span>,
    },
    {
      title: 'ผู้ดำเนินการ',
      width: '20%',
      render: (_, record) => {
        const creator = { name: record.creator_name || record.full_name || 'System', role: record.creator_role || record.role };
        return (
          <div style={{ background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px 12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{creator.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{getRoleLabel(creator.role)}</div>
          </div>
        );
      },
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
          onChange={async (c) => {
            sound?.('confirm');
            await rubricService.toggleStatus(r.rubric_id, c);
            notify('info', `${c ? 'เปิด' : 'ปิด'}ใช้งานเกณฑ์แล้ว`, r.title);
            load();
          }}
          style={{ background: v ? '#10B981' : '#CBD5E1' }}
        />
      ),
    },
    {
      title: 'จัดการ',
      align: 'right',
      fixed: 'right',
      width: '22%',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="default"
            icon={<SearchOutlined />}
            onClick={() => { sound?.('open'); setViewData(r); setViewModalVisible(true); }}
            style={{ borderRadius: '10px', fontWeight: 600, borderColor: '#E2E8F0', color: '#64748B', height: '36px' }}
          >
            ดูข้อมูล
          </Button>
          {canManage && (
            <>
              <Tooltip title="แก้ไข">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => { sound?.('open'); setEditing({ id: r.rubric_id, initial: r }); setModalVisible(true); }}
                  style={{ borderRadius: '10px', background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4F46E5', height: '36px' }}
                />
              </Tooltip>
              <Popconfirm
                title={<span style={{ fontWeight: 700 }}>ยืนยันการลบ?</span>}
                description={<span style={{ color: '#64748B' }}>ไม่สามารถกู้คืนข้อมูลได้ภายหลัง</span>}
                okText="ลบทิ้งเลย"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true, style: { borderRadius: '8px', fontWeight: 700 } }}
                cancelButtonProps={{ style: { borderRadius: '8px' } }}
                onConfirm={() => { sound?.('delete'); handleDelete(r.rubric_id); }}
                onOpenChange={(open) => { if (open) sound?.('warning'); }}
                icon={<DeleteOutlined style={{ color: '#EF4444' }} />}
              >
                <Tooltip title="ลบ">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingId === r.rubric_id}
                    style={{ borderRadius: '10px', background: '#FFF1F2', borderColor: '#FECDD3', color: '#EF4444', height: '36px' }}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4FF' }}>
      {/* Notification Portal */}
      <NotificationContainer notifications={notifs} onRemove={removeNotif} />

      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px 40px', overflowX: 'hidden' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px', animation: 'fadeSlideUp 0.6s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#6366F1', fontSize: '12px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '2px', background: 'linear-gradient(90deg, #4F46E5, #6366F1)', display: 'inline-block', borderRadius: '2px' }} />
                  ระบบประเมินโครงงาน
                </div>
                <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>
                  เกณฑ์การประเมิน
                </h1>
                <p style={{ color: '#64748B', fontSize: '16px', margin: '8px 0 0', fontWeight: 500 }}>
                  บริหารจัดการ Scoring Rubrics สำหรับโครงการนักศึกษา
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => { sound?.('open'); setEditing(null); setModalVisible(true); }}
                  style={{
                    height: '52px', padding: '0 28px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    color: '#fff', border: 'none', borderRadius: '16px',
                    fontSize: '16px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)'; }}
                >
                  <PlusOutlined style={{ fontSize: '18px' }} />
                  สร้างเกณฑ์ใหม่
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatsCard icon="📋" value={rubrics.length} label="ทั้งหมด" color="linear-gradient(135deg, #4F46E5, #6366F1)" delay={0} />
            <StatsCard icon="✅" value={activeCount} label="เปิดใช้งาน" color="linear-gradient(135deg, #059669, #10B981)" delay={0.08} />
            <StatsCard icon="📅" value={years.length} label="ปีการศึกษา" color="linear-gradient(135deg, #D97706, #F59E0B)" delay={0.16} />
            <StatsCard icon="🔍" value={filtered.length} label="ผลการค้นหา" color="linear-gradient(135deg, #0891B2, #06B6D4)" delay={0.24} />
          </div>

          {/* Filter Bar */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '20px 24px',
            border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
            animation: 'fadeSlideUp 0.6s ease 0.3s both',
          }}>
            <Input
              placeholder="ค้นหาชื่อเกณฑ์ / สาขาวิชา..."
              prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: '16px' }} />}
              size="large"
              allowClear
              value={q}
              onChange={e => { sound?.('click'); setQ(e.target.value); }}
              style={{ flex: '1 1 280px', borderRadius: '12px', borderColor: '#E2E8F0', height: '48px' }}
            />
            <Select
              placeholder="ปีการศึกษา"
              allowClear
              size="large"
              value={year}
              onChange={v => { sound?.('click'); setYear(v); }}
              options={years.map(y => ({ label: `ปีการศึกษา ${y}`, value: y }))}
              style={{ flex: '0 0 200px', height: '48px' }}
            />
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => { sound?.('click'); setQ(''); setYear(null); }}
              disabled={!q && !year}
              style={{ height: '48px', borderRadius: '12px', borderColor: '#E2E8F0', color: '#64748B', fontWeight: 600 }}
            >
              ล้างค่า
            </Button>
          </div>

          {/* Table */}
          <div style={{
            background: '#fff', borderRadius: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E8EEFF',
            overflow: 'hidden', animation: 'fadeSlideUp 0.6s ease 0.4s both',
          }}>
            <Table
              columns={columns}
              dataSource={filtered}
              loading={loading}
              rowKey="rubric_id"
              pagination={{
                pageSize: 8,
                showTotal: (total) => <span style={{ color: '#94A3B8', fontWeight: 600 }}>ทั้งหมด {total} รายการ</span>,
                style: { padding: '16px 24px' },
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <div style={{ color: '#94A3B8', fontSize: '16px', fontWeight: 600 }}>ไม่พบข้อมูลเกณฑ์ประเมิน</div>
                    <div style={{ color: '#CBD5E1', fontSize: '13px', marginTop: '8px' }}>ลองค้นหาด้วยคำค้นอื่น หรือเพิ่มเกณฑ์ใหม่</div>
                  </div>
                ),
              }}
              rowClassName={() => 'rubric-row'}
              size="middle"
            />
          </div>
        </div>
      </div>

      {/* Rubric Form Modal */}
      <RubricForm
        visible={modalVisible}
        saving={saving}
        onCancel={() => setModalVisible(false)}
        sound={sound}
        onSave={async (v) => {
          setSaving(true);
          try {
            const userStr = localStorage.getItem('user');
            const u = userStr ? JSON.parse(userStr) : {};
            const currentUserId = u.id;
            if (!currentUserId) {
              notify('error', 'ไม่พบรหัสผู้ใช้งาน', 'กรุณาเข้าสู่ระบบใหม่');
              setSaving(false);
              return;
            }
            const payload = {
              title: v.title, academic_year: v.academic_year, level: v.level,
              department: v.department, is_active: v.is_active, rubric_data: v.rubric_data,
              total_full_score: v.total_full_score || 100, updated_by: currentUserId,
            };
            if (editing) {
              await rubricService.update(editing.id, payload);
              notify('success', 'อัปเดตเกณฑ์สำเร็จ! ✦', `"${v.title}" ถูกบันทึกเรียบร้อยแล้ว`);
            } else {
              await rubricService.create({ ...payload, created_by: currentUserId });
              notify('success', 'สร้างเกณฑ์ใหม่สำเร็จ! ✦', `"${v.title}" ถูกเพิ่มเข้าระบบแล้ว`);
            }
            setModalVisible(false);
            load();
          } catch (e) {
            notify('error', 'บันทึกข้อมูลไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
          } finally {
            setSaving(false);
          }
        }}
        initialValues={editing?.initial}
      />

      {/* View Detail Modal */}
      <Modal
        title={null}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={820}
        centered
        styles={{
          content: { borderRadius: '24px', overflow: 'hidden', padding: 0 },
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.6)' },
        }}
      >
        <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }} />
          <div style={{ color: '#818CF8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>◈ รายละเอียดเกณฑ์</div>
          <div style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: 900 }}>{viewData?.title}</div>
          <div style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>โครงสร้างคะแนนและหัวข้อการประเมิน</div>
        </div>

        <div style={{ padding: '28px 32px', background: '#FAFBFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'ระดับชั้น', value: viewData?.level },
              { label: 'สาขาวิชา', value: viewData?.department || '-' },
              { label: 'ปีการศึกษา', value: viewData?.academic_year },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{item.label}</div>
                <div style={{ color: '#1E293B', fontSize: '18px', fontWeight: 800 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <Table
              dataSource={viewData?.rubric_data || []}
              pagination={false}
              rowKey={(r, i) => i}
              size="middle"
              columns={[
                { title: '#', width: 60, align: 'center', render: (_, __, i) => <span style={{ color: '#CBD5E1', fontWeight: 800 }}>{i + 1}</span> },
                {
                  title: 'หัวข้อการประเมิน', dataIndex: 'item_name',
                  render: (t, r) => (
                    <div style={{ padding: '6px 0' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px', marginBottom: '4px' }}>{t}</div>
                      <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5 }}>{r.description}</div>
                    </div>
                  ),
                },
                {
                  title: 'คะแนน', dataIndex: 'max_score', align: 'center', width: 100,
                  render: (s) => (
                    <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', color: '#4F46E5', fontWeight: 900, fontSize: '20px', borderRadius: '10px', padding: '4px 12px', border: '1px solid #C7D2FE' }}>
                      {s}
                    </div>
                  ),
                },
              ]}
              summary={(pageData) => {
                const total = pageData.reduce((s, { max_score }) => s + Number(max_score), 0);
                return (
                  <Table.Summary.Row style={{ background: '#F0FDF4' }}>
                    <Table.Summary.Cell index={0} colSpan={2} align="right">
                      <span style={{ fontWeight: 800, color: '#374151', paddingRight: '16px', fontSize: '15px' }}>คะแนนรวมสุทธิ</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <span style={{ fontWeight: 900, fontSize: '28px', color: '#10B981' }}>{total}</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={() => { sound?.('click'); setViewModalVisible(false); }}
              style={{
                height: '48px', padding: '0 32px', background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </Modal>

      {/* Global Styles */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes notifEnter {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes notifExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(60px) scale(0.9); }
        }
        @keyframes notifProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .rubric-row:hover td { background: #F8FAFF !important; }
        .rubric-row td { transition: background 0.15s; }
        .ant-table-thead > tr > th {
          background: #F8FAFF !important; color: #475569 !important;
          font-weight: 800 !important; font-size: 13px !important;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 2px solid #E2E8F0 !important;
          padding-top: 18px !important; padding-bottom: 18px !important;
        }
        .ant-switch-checked { background: #10B981 !important; }
        .ant-input:focus, .ant-input-focused { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        .ant-select-focused .ant-select-selector { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        .ant-pagination-item-active { border-color: #6366F1 !important; background: #4F46E5 !important; }
        .ant-pagination-item-active a { color: #fff !important; }
        .ant-btn-primary { background: #4F46E5 !important; border-color: #4F46E5 !important; }
        .ant-btn-primary:hover { background: #4338CA !important; border-color: #4338CA !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
    </div>
  );
};

export default RubricSettings;