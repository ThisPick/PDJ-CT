import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Table, Tag, Avatar, Input,
  Select, Switch, Modal, message, notification, Tooltip
} from 'antd';
import {
  ProjectOutlined, RocketOutlined, CodeOutlined, UserOutlined,
  SearchOutlined, ReloadOutlined, TrophyFilled, BulbOutlined,
  TeamOutlined, FormOutlined, ToolOutlined, FundProjectionScreenOutlined,
  BookOutlined, BarChartOutlined, LockOutlined, LoginOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, Sector, Legend,
} from 'recharts';
import { getAllProjects } from '../services/projectService';
import { userService }    from '../services/userService';
import GuestSidebar       from '../GuestPage/GuestSidebar';
import { useNavigate }    from 'react-router-dom';

const { Content } = Layout;
const { Option }  = Select;

const isLoggedIn = () => !!localStorage.getItem('token');

const getAvatarUrl = f => {
  if (!f || f === 'null' || f === 'undefined') return null;
  if (f.startsWith('http')) return f;
  const base = (import.meta.env.VITE_API_BASE_URL || 'https://reg.utc.ac.th')
    .replace(/\/api\/?$/, '').replace(/\/$/, '');
  const clean = f.startsWith('/') ? f.slice(1) : f;
  return clean.includes('..') ? null : `${base}/uploads/profiles/${clean}`;
};

/* ── SOUND ENGINE ── */
class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  _ctx() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; }
  _play(fn) { if (!this.enabled) return; try { fn(this._ctx()); } catch(e){} }
  tick(freq=880,dur=0.06,vol=0.15){ this._play(ctx=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sine';o.frequency.value=freq; g.gain.setValueAtTime(vol,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur); o.start();o.stop(ctx.currentTime+dur); }); }
  pop(){ this._play(ctx=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='triangle'; o.frequency.setValueAtTime(320,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(900,ctx.currentTime+0.05); g.gain.setValueAtTime(0.22,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.09); o.start();o.stop(ctx.currentTime+0.09); }); }
  chime(){ this._play(ctx=>{ [523.25,659.25,783.99].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sine';o.frequency.value=f; const t=ctx.currentTime+i*0.1; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.18,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.35); o.start(t);o.stop(t+0.35); }); }); }
  sweep(){ this._play(ctx=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sawtooth'; o.frequency.setValueAtTime(110,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.18); g.gain.setValueAtTime(0.08,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.2); o.start();o.stop(ctx.currentTime+0.2); }); }
  bell(){ this._play(ctx=>{ [880,1108,1320].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sine';o.frequency.value=f; const t=ctx.currentTime+i*0.06; g.gain.setValueAtTime(0.14,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6); o.start(t);o.stop(t+0.6); }); }); }
  whoosh(){ this._play(ctx=>{ const len=Math.ceil(ctx.sampleRate*0.22),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len); const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(); f.type='bandpass'; f.frequency.setValueAtTime(200,ctx.currentTime); f.frequency.linearRampToValueAtTime(2000,ctx.currentTime+0.22); g.gain.setValueAtTime(0.1,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.22); src.buffer=buf;src.connect(f);f.connect(g);g.connect(ctx.destination); src.start();src.stop(ctx.currentTime+0.22); }); }
  thud(){ this._play(ctx=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sine'; o.frequency.setValueAtTime(180,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(55,ctx.currentTime+0.13); g.gain.setValueAtTime(0.28,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.15); o.start();o.stop(ctx.currentTime+0.15); }); }
}
const sfx = new SoundEngine();

/* ── PARTICLE BURST ── */
const ParticleBurst = ({ active, x, y, color }) => {
  if (!active) return null;
  return (
    <div className="pb-host" style={{ left:x, top:y }}>
      {Array.from({length:12}).map((_,i) => (
        <div key={i} className="pb-dot" style={{ background:color, '--angle':`${i*30}deg`, animationDelay:`${i*15}ms` }} />
      ))}
    </div>
  );
};

/* ── COUNTER ── */
const useCounter = (target, dur=1400) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let n=0; const inc=target/(dur/16);
    const id=setInterval(()=>{ n+=inc; if(n>=target){setVal(target);clearInterval(id);}else setVal(Math.floor(n)); },16);
    return ()=>clearInterval(id);
  }, [target]);
  return val;
};

/* ── MAG BUTTON ── */
const MagBtn = ({ children, onClick, className='', style={}, disabled=false }) => {
  const ref=useRef();
  const onMove=e=>{ if(disabled)return; const r=ref.current.getBoundingClientRect(); const x=(e.clientX-r.left-r.width/2)*0.22,y=(e.clientY-r.top-r.height/2)*0.22; ref.current.style.transform=`translate(${x}px,${y}px) scale(1.04)`; };
  const onLeave=()=>{ ref.current.style.transform='translate(0,0) scale(1)'; };
  return <button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={disabled?undefined:onClick} disabled={disabled} className={className} style={{transition:'transform .18s cubic-bezier(0.34,1.56,0.64,1)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,...style}}>{children}</button>;
};

/* ── STAT CARD ── */
const StatCard = ({ title, value, icon, color, bg, delay=0 }) => {
  const count=useCounter(value);
  const [burst,setBurst]=useState({active:false,x:0,y:0});
  const ref=useRef();
  const onHover=()=>{ sfx.tick(440+Math.random()*300,0.05,0.08); const r=ref.current.getBoundingClientRect(); setBurst({active:true,x:r.left+r.width/2,y:r.top+r.height/2}); setTimeout(()=>setBurst(b=>({...b,active:false})),600); };
  return (<>
    <ParticleBurst {...burst} color={color} />
    <div ref={ref} onMouseEnter={onHover} className="sc-card" style={{'--c':color,'--bg':bg,animationDelay:delay+'ms'}}>
      <div className="sc-shine"/>
      <div className="sc-body">
        <div className="sc-top">
          <div className="sc-icon" style={{background:bg,color}}>{icon}</div>
          <div className="sc-orb" style={{background:color+'1a'}}/>
        </div>
        <p className="sc-label">{title}</p>
        <p className="sc-value" style={{color}}>{count.toLocaleString()}</p>
      </div>
    </div>
  </>);
};

/* ── GUEST LOCK ── */
const GuestLock = ({ children, isGuest, tipText='กรุณาเข้าสู่ระบบเพื่อใช้งาน' }) => {
  if (!isGuest) return children;
  return <Tooltip title={<span style={{display:'flex',alignItems:'center',gap:6}}><LockOutlined/> {tipText}</span>} color="#1a2744" placement="top"><div style={{display:'contents'}}>{children}</div></Tooltip>;
};

/* ── CHART YEAR FILTER (Ant Design Select) ──
   ดึง uYears จาก rawProjects โดยตรง แสดงเฉพาะปีที่มีข้อมูลจริง */
const ChartYearFilter = ({ years, value, onChange }) => (
  <div className="cyf-wrap">
    <CalendarOutlined className="cyf-icon"/>
    <span className="cyf-label">ปี:</span>
    <Select
      size="small"
      value={value ?? '__all__'}
      onChange={v => { sfx.pop(); onChange(v==='__all__' ? null : String(v)); }}
      popupMatchSelectWidth={false}
      className="cyf-select"
      style={{minWidth:108}}
    >
      <Option value="__all__"><span style={{fontWeight:700,color:'#64748b'}}>ทั้งหมด</span></Option>
      {years.map(y => <Option key={y} value={String(y)}><span style={{fontWeight:700}}>{y}</span></Option>)}
    </Select>
  </div>
);

/* ── DONUT ACTIVE SHAPE ── */
const ActiveDonutShape = props => {
  const {cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value}=props;
  return (
    <g>
      <text x={cx} y={cy-14} textAnchor="middle" fill="#1e293b" style={{fontWeight:900,fontSize:12}}>{payload.name}</text>
      <text x={cx} y={cy+9}  textAnchor="middle" fill={fill}    style={{fontWeight:900,fontSize:22}}>{value}</text>
      <text x={cx} y={cy+28} textAnchor="middle" fill="#94a3b8" style={{fontSize:11}}>{(percent*100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+7} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
      <Sector cx={cx} cy={cy} innerRadius={outerRadius+10} outerRadius={outerRadius+14} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
    </g>
  );
};

/* ── CUSTOM TOOLTIP ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:12,padding:'10px 14px',boxShadow:'0 12px 28px rgba(0,0,0,.12)',minWidth:140}}>
      {label && <p style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{label}</p>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:p.color||p.fill,flexShrink:0}}/>
          <span style={{fontWeight:900,color:'#1e293b',fontSize:14}}>{(p.value||0).toLocaleString()} โครงงาน</span>
        </div>
      ))}
    </div>
  );
};

/* ── THEME ── */
const STATUS_STYLES = {
  'สมบูรณ์':         {bg:'#dcfce7',text:'#15803d',dot:'#22c55e'},
  'กำลังทำ':         {bg:'#dbeafe',text:'#1d4ed8',dot:'#3b82f6'},
  'รออนุมัติหัวข้อ': {bg:'#fef9c3',text:'#a16207',dot:'#eab308'},
  'รออนุมัติเล่ม':   {bg:'#fef9c3',text:'#a16207',dot:'#eab308'},
  'ล่าช้า':           {bg:'#fee2e2',text:'#b91c1c',dot:'#ef4444'},
  'ไม่ผ่าน':          {bg:'#fee2e2',text:'#b91c1c',dot:'#ef4444'},
};
const STEPS = [
  {icon:<TeamOutlined/>,                 color:'#c9922a',bg:'#fff8ee',title:'1. คิดหัวข้อ & รวมกลุ่ม',  desc:'รวมกลุ่มเพื่อน คิดไอเดียสร้างสรรค์ หาข้อมูล'},
  {icon:<FormOutlined/>,                 color:'#1e2d40',bg:'#eef3ff',title:'2. เสนอหัวข้อโครงงาน',     desc:'ยื่นเสนอผ่านระบบ รอรับการอนุมัติจากที่ปรึกษา'},
  {icon:<ToolOutlined/>,                 color:'#10b981',bg:'#f0fdf4',title:'3. พัฒนา & รายงาน 50%',    desc:'ลงมือพัฒนาชิ้นงาน รายงานความคืบหน้า'},
  {icon:<FundProjectionScreenOutlined/>, color:'#8b5cf6',bg:'#faf5ff',title:'4. สอบป้องกัน 100%',       desc:'นำเสนอผลงานฉบับสมบูรณ์ต่อคณะกรรมการ'},
  {icon:<BookOutlined/>,                 color:'#b03a2e',bg:'#fdf2f2',title:'5. ส่งเล่ม & เผยแพร่',     desc:'ส่งเอกสาร เผยแพร่ผลงานลงคลังโครงงาน'},
];
const CHART_COLORS=['#1e2d40','#c9922a','#10b981','#b03a2e','#8b5cf6','#ec4899','#0891b2','#6366f1'];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export const GuestDashboard = () => {
  const navigate=useNavigate();
  const guest=!isLoggedIn();

  const [user,setUser]                        =useState({full_name:guest?'ผู้เยี่ยมชม':'กำลังโหลด...',profile_img:null});
  const [rawProjects,setRawProjects]          =useState([]);
  const [filteredProjects,setFilteredProjects]=useState([]);
  const [loading,setLoading]                  =useState(true);
  const [isRefreshing,setIsRefreshing]        =useState(false);
  const [pageReady,setPageReady]              =useState(false);
  const [activeRow,setActiveRow]              =useState(null);
  const [api,contextHolder]                   =notification.useNotification();
  const prevCount=useRef(null);

  /* ── ตัวกรองตาราง ── */
  const [searchText,setSearchText]=useState('');
  const [filterYear,setFilterYear]=useState(null);
  const [filterCat, setFilterCat] =useState(null);
  const [filterAdv, setFilterAdv] =useState(null);
  const [filterFeat,setFilterFeat]=useState(false);
  const [modal,   setModal]       =useState(false);
  const [selected,setSelected]    =useState(null);

  /* ── ตัวกรองปีแต่ละ Chart (อิสระต่อกัน ดึงจาก rawProjects) ── */
  const [statusYear, setStatusYear]=useState(null);
  const [catYear,    setCatYear]   =useState(null);
  const [advYear,    setAdvYear]   =useState(null);
  const [activePieIdx,setActivePieIdx]=useState(0);

  /* ── lifecycle ── */
  useEffect(()=>{setTimeout(()=>setPageReady(true),80);},[]);

  useEffect(()=>{
    if(!pageReady)return;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('io-in');io.unobserve(e.target);}});
    },{threshold:0.07});
    document.querySelectorAll('.io').forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },[pageReady,loading]);

  useEffect(()=>{
    if(!guest){
      (async()=>{
        const raw=localStorage.getItem('user')||sessionStorage.getItem('user');
        if(!raw)return;
        try{
          const p=JSON.parse(raw);setUser(p);
          const uid=p.id||p.userId;
          if(uid&&userService?.getProfile){
            const res=await userService.getProfile(uid);
            const d=res.data?.data||res.data;
            if(d){setUser(u=>({...u,...d,full_name:d.full_name||d.username||u.full_name}));localStorage.setItem('user',JSON.stringify(d));}
          }
        }catch(e){console.error(e);}
      })();
    }
    fetchData(true);
    const id=setInterval(()=>fetchData(false),30000);
    return()=>clearInterval(id);
  },[]);

  const fetchData=async(show=true)=>{
    if(show){setLoading(true);sfx.sweep();}
    setIsRefreshing(true);
    try{
      const res=await getAllProjects();
      let data=[];
      if(Array.isArray(res))                            data=res;
      else if(res&&Array.isArray(res.data))             data=res.data;
      else if(res?.data&&Array.isArray(res.data.data))  data=res.data.data;
      if(!data.length){setRawProjects([]);setFilteredProjects([]);return;}
      const sorted=[...data].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      if(!guest&&prevCount.current!==null&&sorted.length>prevCount.current){
        const n=sorted.length-prevCount.current; sfx.bell();
        const key=`n_${Date.now()}`;
        api.info({key,
          message:<span style={{fontWeight:900,color:'#1e2d40',fontSize:15}}>มีผลงานใหม่เข้าสู่ระบบ! 🎉</span>,
          description:<span style={{color:'#64748b',fontSize:13}}>อัปโหลดโครงงานใหม่ <b style={{color:'#c9922a'}}>{n} รายการ</b></span>,
          placement:'topRight',duration:0,
          icon:<BulbOutlined style={{color:'#c9922a'}} className="notif-bulb"/>,
          className:'notif-gold',
          style:{borderRadius:16,border:'2px solid #c9922a33',background:'linear-gradient(135deg,#fff,#fffbf0)',boxShadow:'0 20px 40px -10px rgba(201,146,42,.22)'},
          onClick:()=>{sfx.chime();api.destroy(key);}
        });
      }
      prevCount.current=sorted.length;
      setRawProjects(sorted);
      if(show)sfx.chime();
    }catch{if(show)message.error('ไม่สามารถโหลดข้อมูลได้');}
    finally{setLoading(false);setTimeout(()=>setIsRefreshing(false),500);}
  };

  /* ── filter pipeline ── */
  useEffect(()=>{
    if(guest){setFilteredProjects(rawProjects);return;}
    let r=rawProjects;
    const lc=searchText.toLowerCase();
    if(searchText) r=r.filter(p=>(p.title_th||'').toLowerCase().includes(lc)||(p.student_name||'').toLowerCase().includes(lc)||(p.creator_name||'').toLowerCase().includes(lc));
    if(filterYear) r=r.filter(p=>String(p.academic_year)===String(filterYear));
    if(filterCat)  r=r.filter(p=>p.category===filterCat);
    if(filterAdv)  r=r.filter(p=>p.advisor===filterAdv);
    if(filterFeat) r=r.filter(p=>p.is_featured===1||p.is_featured===true);
    setFilteredProjects(r);
  },[searchText,filterYear,filterCat,filterAdv,filterFeat,rawProjects]);

  const clearFilters=()=>{if(guest)return;sfx.sweep();setSearchText('');setFilterYear(null);setFilterCat(null);setFilterAdv(null);setFilterFeat(false);};
  const openDetail=rec=>{if(guest)return;sfx.whoosh();setSelected(rec);setActiveRow(rec.project_id);setTimeout(()=>setActiveRow(null),600);setModal(true);};

  /* ── derived ── */
  const total   =filteredProjects.length;
  const pending =filteredProjects.filter(p=>p.progress_status?.includes('รอ')).length;
  const complete=filteredProjects.filter(p=>p.progress_status==='สมบูรณ์').length;
  const featured=filteredProjects.filter(p=>p.is_featured===1||p.is_featured===true).length;

  /* ปีที่มีข้อมูลจริง (ใช้ร่วมกันทุก Select) */
  const uYears=[...new Set(rawProjects.map(p=>p.academic_year).filter(Boolean))].sort((a,b)=>b-a);
  const uCats =[...new Set(rawProjects.map(p=>p.category).filter(Boolean))];
  const uAdvs =[...new Set(rawProjects.map(p=>p.advisor).filter(Boolean))];

  /* ────────────────────────────────────────────────
     CHART DATA — แต่ละ chart กรองด้วย state ของตัวเอง
  ──────────────────────────────────────────────── */
  const poolByYear=yr=>yr?rawProjects.filter(p=>String(p.academic_year)===String(yr)):rawProjects;

  /* Chart 1 — สถานะ: Donut interactive, กรองด้วย statusYear */
  const statusData=(()=>{
    const pool=poolByYear(statusYear);
    const counts={};
    Object.keys(STATUS_STYLES).forEach(s=>{counts[s]=0;});
    pool.forEach(p=>{const s=p.progress_status||'ไม่ระบุ';counts[s]=(counts[s]||0)+1;});
    return Object.entries(counts).filter(([,v])=>v>0)
      .map(([name,value])=>({name,value,color:STATUS_STYLES[name]?.dot||'#94a3b8'}));
  })();

  /* Chart 2 — หมวดหมู่: Horizontal Bar, กรองด้วย catYear */
  const categoryData=(()=>{
    const pool=poolByYear(catYear);
    const counts={};
    pool.forEach(p=>{const c=p.category||'ไม่ระบุ';counts[c]=(counts[c]||0)+1;});
    return Object.entries(counts)
      .map(([name,value],i)=>({name,value,color:CHART_COLORS[i%CHART_COLORS.length]}))
      .sort((a,b)=>b.value-a.value);
  })();

  /* Chart 3 — แนวโน้มรายปี: Line (แกน X คือปี ไม่กรองปี) */
  const yearData=(()=>{
    const counts={};
    rawProjects.forEach(p=>{const y=p.academic_year||'ไม่ระบุ';counts[y]=(counts[y]||0)+1;});
    return Object.entries(counts)
      .map(([name,value])=>({name:String(name),value}))
      .sort((a,b)=>parseInt(a.name)-parseInt(b.name));
  })();

  /* Chart 4 — ที่ปรึกษา Top-8: Horizontal Bar, กรองด้วย advYear */
  const advisorData=(()=>{
    const pool=poolByYear(advYear);
    const counts={};
    pool.forEach(p=>{const a=p.advisor||'ไม่ระบุ';counts[a]=(counts[a]||0)+1;});
    return Object.entries(counts)
      .map(([name,value],i)=>({name,value,color:CHART_COLORS[i%CHART_COLORS.length]}))
      .sort((a,b)=>b.value-a.value).slice(0,8);
  })();

  /* ── TABLE COLUMNS ── */
  const columns=[
    { title:<span className="col-hd">ชื่อโครงงาน</span>, dataIndex:'title_th', key:'title_th', width:'32%',
      render:(t,r)=>(
        <div>
          <p className="tbl-title">{t}</p>
          <p className="tbl-sub">👤 {r.student_name||r.creator_name||'ไม่ระบุ'}</p>
          {r.is_featured&&<span className="feat-pill"><TrophyFilled style={{color:'#c9922a',fontSize:10}}/> ยอดเยี่ยม</span>}
        </div>
      )},
    { title:<span className="col-hd">ปีการศึกษา</span>, dataIndex:'academic_year', key:'year', align:'center', width:'10%',
      render:t=><span className="year-badge">{t||'-'}</span>},
    { title:<span className="col-hd">ที่ปรึกษา</span>, dataIndex:'advisor', key:'adv', width:'16%',
      render:t=>t?<span className="adv-pill"><UserOutlined style={{color:'#c9922a',fontSize:11}}/>{t}</span>:<span style={{color:'#cbd5e1'}}>—</span>},
    { title:<span className="col-hd">หมวดหมู่</span>, dataIndex:'category', key:'cat', width:'14%',
      render:t=><Tag style={{background:'#fff8ee',color:'#92400e',border:'1.5px solid #c9922a44',borderRadius:20,fontWeight:700,fontSize:12,padding:'2px 12px'}}>{t||'—'}</Tag>},
    { title:<span className="col-hd">สถานะ</span>, dataIndex:'progress_status', key:'status', width:'16%',
      render:s=>{const sc=STATUS_STYLES[s]||{bg:'#f1f5f9',text:'#64748b',dot:'#94a3b8'};return <span className="status-pill" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s||'ไม่ระบุ'}</span>;}},
    { title:'', key:'act', align:'center', width:'12%',
      render:(_,r)=>guest
        ?<Tooltip title={<span style={{display:'flex',alignItems:'center',gap:6}}><LockOutlined/> กรุณาเข้าสู่ระบบ</span>} color="#1a2744"><button className="det-btn det-btn-locked" disabled><LockOutlined style={{marginRight:4}}/>ล็อก</button></Tooltip>
        :<button onClick={e=>{e.stopPropagation();sfx.pop();openDetail(r);}} className="det-btn" onMouseEnter={()=>sfx.tick(600,0.04,0.07)}>ดูรายละเอียด</button>},
  ];

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <Layout className={`gd-root ${pageReady?'gd-ready':''}`}>
      {contextHolder}
      <div className="gd-mesh" aria-hidden/>
      <GuestSidebar/>
      <Layout className="gd-inner">
        <Content className="gd-content gd-scroll">
          <div className="gd-wrap">

            {/* GUEST BANNER */}
            {guest&&(
              <div className="io guest-banner">
                <div className="gb-left">
                  <div className="gb-icon"><LockOutlined/></div>
                  <div>
                    <p className="gb-title">คุณกำลังดูในโหมดผู้เยี่ยมชม (Read-Only)</p>
                    <p className="gb-sub">ฟีเจอร์ทั้งหมดจะถูกล็อก กรุณาเข้าสู่ระบบเพื่อใช้งานเต็มรูปแบบ</p>
                  </div>
                </div>
                <button className="gb-login-btn" onClick={()=>navigate('/login')}><LoginOutlined/> เข้าสู่ระบบ</button>
              </div>
            )}

            {/* HERO */}
            <div className="io hero-card">
              <div className="hero-stripe"/>
              <div className="hero-body">
                <div className="hero-left">
                  <div className="hero-av-wrap">
                    <Avatar size={68} src={guest?null:getAvatarUrl(user.profile_img)} icon={<UserOutlined/>} className="hero-av"/>
                    <span className="hero-dot"/>
                  </div>
                  <div>
                    <h1 className="hero-title">
                      {guest?<>ยินดีต้อนรับ&nbsp;<span className="hero-name">ผู้เยี่ยมชม</span>&nbsp;👋</>
                            :<>สวัสดี,&nbsp;<span className="hero-name">{user.full_name}</span>&nbsp;✌️</>}
                    </h1>
                    <p className="hero-sub">{guest?'สำรวจภาพรวมโครงงาน — เข้าสู่ระบบเพื่อใช้งานฟีเจอร์ทั้งหมด':'สำรวจไอเดียและดูภาพรวมผลงานโครงงานทั้งหมดในแผนก'}</p>
                  </div>
                </div>
                <GuestLock isGuest={guest} tipText="กรุณาเข้าสู่ระบบเพื่อรีเฟรชข้อมูล">
                  <MagBtn onClick={()=>{sfx.sweep();fetchData(true);}} disabled={guest} className="refresh-btn">
                    <ReloadOutlined className={isRefreshing?'spin-icon':''}/> รีเฟรชข้อมูล
                  </MagBtn>
                </GuestLock>
              </div>
            </div>

            {/* STATS */}
            <div className="io stats-grid">
              <StatCard title="โครงงานทั้งหมด" value={total}    icon={<ProjectOutlined/>} color="#1e2d40" bg="#eef3ff" delay={0}  />
              <StatCard title="กำลังดำเนินการ"  value={pending}  icon={<CodeOutlined/>}    color="#c9922a" bg="#fff8ee" delay={80} />
              <StatCard title="เสร็จสมบูรณ์"    value={complete} icon={<RocketOutlined/>}  color="#10b981" bg="#f0fdf4" delay={160}/>
              <StatCard title="Hall of Fame"     value={featured} icon={<TrophyFilled/>}    color="#b03a2e" bg="#fdf2f2" delay={240}/>
            </div>

            {/* CHARTS */}
            <div className="io panel">
              <div className="panel-head">
                <div className="panel-icon" style={{background:'#fff8ee',color:'#c9922a'}}><BarChartOutlined/></div>
                <h2 className="panel-title">รายงานสถิติข้อมูล</h2>
              </div>
              <div className="charts-grid">

                {/* Chart 1 — สถานะ: Donut + year filter */}
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div>
                      <h3 className="chart-title">สถานะของโครงงาน</h3>
                      <p className="chart-sub">hover / คลิก slice เพื่อดูรายละเอียด</p>
                    </div>
                    {uYears.length>0&&<ChartYearFilter years={uYears} value={statusYear} onChange={v=>{setStatusYear(v);setActivePieIdx(0);}}/>}
                  </div>
                  {statusYear&&<div className="yr-tag"><CalendarOutlined/> ปี {statusYear}</div>}
                  <div className="chart-body" style={{height:300}}>
                    {statusData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie activeIndex={activePieIdx} activeShape={ActiveDonutShape} data={statusData}
                            cx="50%" cy="47%" innerRadius={68} outerRadius={100} dataKey="value"
                            onMouseEnter={(_,idx)=>{sfx.tick(500+idx*60,0.04,0.07);setActivePieIdx(idx);}}
                            onClick={(_,idx)=>{sfx.pop();setActivePieIdx(idx);}} style={{cursor:'pointer'}}>
                            {statusData.map((e,i)=><Cell key={i} fill={e.color} stroke="white" strokeWidth={2}/>)}
                          </Pie>
                          <RTooltip content={<ChartTip/>}/>
                          <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:11,fontWeight:700,color:'#475569'}}>{v}</span>}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{statusYear?` ในปี ${statusYear}`:''}</p>}
                  </div>
                </div>

                {/* Chart 2 — หมวดหมู่: Horizontal Bar + year filter */}
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div>
                      <h3 className="chart-title">จำนวนโครงงานตามหมวดหมู่</h3>
                      <p className="chart-sub">เรียงจากมากไปน้อย</p>
                    </div>
                    {uYears.length>0&&<ChartYearFilter years={uYears} value={catYear} onChange={setCatYear}/>}
                  </div>
                  {catYear&&<div className="yr-tag"><CalendarOutlined/> ปี {catYear}</div>}
                  <div className="chart-body" style={{height:300}}>
                    {categoryData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{left:110,right:28,top:4,bottom:4}} barSize={16}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/>
                          <XAxis type="number" stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false}/>
                          <YAxis dataKey="name" type="category" width={105} tick={{fontSize:11,fill:'#475569',fontWeight:700}} stroke="none"/>
                          <RTooltip content={<ChartTip/>} cursor={{fill:'#fff8ee50'}}/>
                          <Bar dataKey="value" radius={[0,10,10,0]} onMouseEnter={()=>sfx.tick(520,0.04,0.06)} onClick={()=>sfx.pop()}>
                            {categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{catYear?` ในปี ${catYear}`:''}</p>}
                  </div>
                </div>

                {/* Chart 3 — แนวโน้มรายปี: Line (ไม่กรองปี เพราะแกน X คือปี) */}
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div>
                      <h3 className="chart-title">แนวโน้มจำนวนโครงงานรายปี</h3>
                      <p className="chart-sub">แสดงทุกปีการศึกษา</p>
                    </div>
                    <span className="all-years-badge">ทุกปี</span>
                  </div>
                  <div className="chart-body" style={{height:300}}>
                    {yearData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={yearData} margin={{left:0,right:24,top:10,bottom:10}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize:11,fontWeight:700}}/>
                          <YAxis stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false}/>
                          <RTooltip content={<ChartTip/>}/>
                          <Line type="monotone" dataKey="value" stroke="#c9922a" strokeWidth={3}
                            dot={{fill:'#c9922a',r:5,strokeWidth:2,stroke:'white'}}
                            activeDot={{r:8,strokeWidth:2,stroke:'white',fill:'#1e2d40',onMouseEnter:()=>sfx.tick(560,0.05,0.08)}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล</p>}
                  </div>
                </div>

                {/* Chart 4 — ที่ปรึกษา Top-8: Horizontal Bar + year filter */}
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div>
                      <h3 className="chart-title">จำนวนโครงงานตามที่ปรึกษา (Top 8)</h3>
                      <p className="chart-sub">8 อันดับที่มีโครงงานมากที่สุด</p>
                    </div>
                    {uYears.length>0&&<ChartYearFilter years={uYears} value={advYear} onChange={setAdvYear}/>}
                  </div>
                  {advYear&&<div className="yr-tag"><CalendarOutlined/> ปี {advYear}</div>}
                  <div className="chart-body" style={{height:300}}>
                    {advisorData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={advisorData} layout="vertical" margin={{left:105,right:28,top:4,bottom:4}} barSize={16}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/>
                          <XAxis type="number" stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false}/>
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11,fill:'#475569',fontWeight:700}} stroke="none"/>
                          <RTooltip content={<ChartTip/>} cursor={{fill:'#fff8ee50'}}/>
                          <Bar dataKey="value" radius={[0,10,10,0]} onMouseEnter={()=>sfx.tick(480,0.04,0.06)} onClick={()=>sfx.pop()}>
                            {advisorData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{advYear?` ในปี ${advYear}`:''}</p>}
                  </div>
                </div>

              </div>
            </div>

            {/* STEPS + FILTER + TABLE */}
            <div className="io panel">

              <div className="steps-head">
                <div className="panel-icon" style={{background:'#fff8ee',color:'#c9922a'}}><BulbOutlined/></div>
                <h2 className="panel-title">ขั้นตอนและแนวปฏิบัติในการทำโครงงาน</h2>
              </div>
              <div className="steps-mobile">
                {STEPS.map((s,i)=>(
                  <div key={i} className="step-m" onMouseEnter={()=>sfx.tick(400+i*90,0.06,0.07)}>
                    <div className="step-m-track">
                      <div className="step-icon" style={{background:s.bg,color:s.color}}>{s.icon}</div>
                      {i<STEPS.length-1&&<div className="step-line" style={{background:s.color+'30'}}/>}
                    </div>
                    <div className="step-m-body"><p className="step-title">{s.title}</p><p className="step-desc">{s.desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="steps-desktop">
                {STEPS.map((s,i)=>(
                  <div key={i} className="step-d" onMouseEnter={()=>sfx.tick(400+i*90,0.06,0.07)}>
                    <div className="step-d-top">
                      <div className="step-icon step-icon-d" style={{background:s.bg,color:s.color}}>{s.icon}</div>
                      {i<STEPS.length-1&&<div className="step-conn" style={{background:`linear-gradient(to right,${s.color}50,${STEPS[i+1].color}40)`}}/>}
                    </div>
                    <p className="step-title step-title-d">{s.title}</p>
                    <p className="step-desc">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className={`filter-zone ${guest?'filter-zone-locked':''}`}>
                <div className="filter-head">
                  <div className="panel-icon" style={{background:'#eef3ff',color:'#1e2d40',fontSize:18}}><SearchOutlined/></div>
                  <h2 className="panel-title">ค้นหาคลังโครงงาน</h2>
                  {guest&&<span className="lock-badge"><LockOutlined/> ล็อกสำหรับผู้เยี่ยมชม</span>}
                </div>
                <div className="filter-grid">
                  <div className="filter-col-2">
                    <label className="filter-label">ค้นหา</label>
                    <GuestLock isGuest={guest}><Input size="large" placeholder="ชื่อโครงงาน, นักศึกษา..." value={searchText} disabled={guest} onChange={e=>{if(guest)return;sfx.tick(600,0.03,0.05);setSearchText(e.target.value);}} className="filter-inp" allowClear/></GuestLock>
                  </div>
                  <div>
                    <label className="filter-label">ปีการศึกษา</label>
                    <GuestLock isGuest={guest}><Select size="large" style={{width:'100%'}} placeholder="ทุกปี" value={filterYear} disabled={guest} onChange={v=>{if(guest)return;sfx.pop();setFilterYear(v);}} allowClear>{uYears.map(y=><Option key={y} value={y}>{y}</Option>)}</Select></GuestLock>
                  </div>
                  <div>
                    <label className="filter-label">หมวดหมู่</label>
                    <GuestLock isGuest={guest}><Select size="large" style={{width:'100%'}} placeholder="ทุกหมวด" value={filterCat} disabled={guest} onChange={v=>{if(guest)return;sfx.pop();setFilterCat(v);}} allowClear>{uCats.map(c=><Option key={c} value={c}>{c}</Option>)}</Select></GuestLock>
                  </div>
                  <div>
                    <label className="filter-label">ที่ปรึกษา</label>
                    <GuestLock isGuest={guest}><Select size="large" style={{width:'100%'}} placeholder="ทุกคน" value={filterAdv} disabled={guest} onChange={v=>{if(guest)return;sfx.pop();setFilterAdv(v);}} allowClear>{uAdvs.map(a=><Option key={a} value={a}>{a}</Option>)}</Select></GuestLock>
                  </div>
                  <div className="filter-hof">
                    <label className="filter-label filter-label-gold"><TrophyFilled/> Hall of Fame</label>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <GuestLock isGuest={guest}><Switch checked={filterFeat} disabled={guest} onChange={v=>{if(guest)return;v?sfx.chime():sfx.tick();setFilterFeat(v);}} style={{background:filterFeat?'#c9922a':undefined}}/></GuestLock>
                      <GuestLock isGuest={guest}><button onClick={clearFilters} disabled={guest} onMouseEnter={()=>{if(!guest)sfx.tick(260,0.04,0.06);}} className={`clear-btn ${guest?'clear-btn-disabled':''}`}>ล้างทั้งหมด</button></GuestLock>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div>
                <div className="tbl-header">
                  <div className="panel-icon" style={{background:'#fff8ee',color:'#c9922a'}}><ProjectOutlined/></div>
                  <h2 className="panel-title">คลังโครงงานทั้งหมด</h2>
                  <span className="cnt-badge">{filteredProjects.length}</span>
                </div>
                {loading?(
                  <div className="loading-wrap"><div className="ld-ring"/><p className="ld-text">กำลังโหลดข้อมูล...</p></div>
                ):(
                  <Table columns={columns} dataSource={filteredProjects} rowKey="project_id"
                    pagination={{pageSize:10,showSizeChanger:false,showTotal:(t,r)=><span style={{fontSize:11,fontWeight:700,color:'#94a3b8'}}>แสดง {r[0]}–{r[1]} จาก {t} รายการ</span>,className:'tbl-pager'}}
                    rowClassName={r=>`ep-row ${guest?'ep-row-guest':''} ${activeRow===r.project_id?'ep-row-flash':''}`}
                    onRow={r=>({onClick:()=>{if(!guest){sfx.thud();openDetail(r);}},onMouseEnter:()=>{if(!guest)sfx.tick(500,0.03,0.05);}})}
                    className="ep-tbl"/>
                )}
              </div>
            </div>

          </div>
        </Content>
      </Layout>

      {/* MODAL */}
      {!guest&&(
        <Modal open={modal} onCancel={()=>{sfx.tick(380,0.07);setModal(false);}} footer={null} width="min(760px,95vw)" centered styles={{body:{padding:0}}} className="ep-modal">
          {selected&&(()=>{
            const sc=STATUS_STYLES[selected.progress_status]||{bg:'#f1f5f9',text:'#64748b',dot:'#94a3b8'};
            const rows=[
              {e:'👤',l:'ผู้จัดทำ',  v:selected.student_name||selected.creator_name||'ไม่ระบุ'},
              {e:'🧑',l:'ที่ปรึกษา', v:selected.advisor||'—'},
              {e:'🗂', l:'หมวดหมู่',  v:selected.category||'—'},
              {e:'📚',l:'ระดับชั้น',  v:selected.project_level||'—'},
              {e:'📅',l:'ปีการศึกษา',v:selected.academic_year||'—'},
            ];
            return (
              <div className="m-anim">
                <div className="m-hero">
                  <div className="m-hero-bg"/>
                  {selected.is_featured&&<div className="m-feat-tag"><TrophyFilled/> ผลงานยอดเยี่ยม</div>}
                  <div className="m-hero-body">
                    <h2 className="m-title">{selected.title_th}</h2>
                    <p className="m-sub">{selected.title_en||''}</p>
                  </div>
                </div>
                <div className="m-body">
                  {rows.map((r,i)=>(
                    <div key={i} className="m-row" style={{animationDelay:(i*55+80)+'ms'}}>
                      <span className="m-emoji">{r.e}</span>
                      <span className="m-label">{r.l}</span>
                      <span className="m-val">{r.v}</span>
                    </div>
                  ))}
                  <div className="m-row" style={{paddingTop:16}}>
                    <span className="m-emoji">🚦</span>
                    <span className="m-label">สถานะ</span>
                    <span className="m-status" style={{background:sc.bg,color:sc.text}}>
                      <span className="m-status-dot" style={{background:sc.dot}}/>{selected.progress_status||'ไม่ระบุ'}
                    </span>
                  </div>
                </div>
                <div className="m-footer">
                  <MagBtn onClick={()=>{sfx.tick(380,0.07);setModal(false);}} className="m-close-btn">ปิดหน้าต่าง</MagBtn>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;900&family=Sarabun:wght@300;400;500;600&display=swap');
        :root{--primary:#1e2d40;--gold:#c9922a;--gold-lt:#f0c040;--red:#b03a2e;--bg:#f4f6f8;--spring:cubic-bezier(0.34,1.56,0.64,1);--out:cubic-bezier(0.16,1,0.3,1);}
        .gd-root{min-height:100vh;display:flex;flex-direction:row;background:var(--bg);transition:opacity .7s;opacity:0;font-family:'Sarabun',sans-serif;}
        .gd-ready{opacity:1;}
        .gd-mesh{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 70% 40% at 5% 0%,#c9922a0e,transparent),radial-gradient(ellipse 60% 50% at 95% 100%,#1e2d400d,transparent);}
        .gd-inner{background:transparent;flex:1;min-width:0;}
        .gd-content{padding:24px;height:100vh;overflow-y:auto;}
        .gd-wrap{max-width:1600px;margin:0 auto;padding-bottom:96px;display:flex;flex-direction:column;gap:20px;}
        .gd-scroll::-webkit-scrollbar{width:6px;}
        .gd-scroll::-webkit-scrollbar-track{background:#f1f5f9;}
        .gd-scroll::-webkit-scrollbar-thumb{background:#c9922a55;border-radius:99px;}
        .gd-scroll::-webkit-scrollbar-thumb:hover{background:#c9922a;}
        .io{opacity:0;transform:translateY(24px);transition:opacity .6s var(--out),transform .6s var(--out);}
        .io-in{opacity:1!important;transform:translateY(0)!important;}

        @keyframes gbIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
        .guest-banner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:16px 24px;justify-content:space-between;border-radius:18px;background:linear-gradient(135deg,var(--primary) 0%,#2c4a6e 60%,#1a3850 100%);border:1px solid rgba(255,255,255,.15);box-shadow:0 12px 40px -10px rgba(30,45,64,.4);animation:gbIn .6s var(--out) both;}
        .gb-left{display:flex;align-items:center;gap:12px;}
        .gb-icon{padding:10px;border-radius:12px;background:rgba(255,255,255,.15);color:var(--gold-lt);font-size:18px;}
        .gb-title{font-family:'Kanit',sans-serif;font-weight:700;color:white;font-size:15px;margin:0;}
        .gb-sub{color:rgba(255,255,255,.7);font-size:12px;margin:2px 0 0;}
        .gb-login-btn{display:flex;align-items:center;gap:8px;background:white;color:var(--primary);font-family:'Kanit',sans-serif;font-weight:700;padding:10px 24px;border-radius:14px;border:none;box-shadow:0 6px 20px rgba(0,0,0,.15);cursor:pointer;font-size:14px;transition:all .2s var(--spring);white-space:nowrap;}
        .gb-login-btn:hover{background:var(--gold-lt);transform:translateY(-2px) scale(1.04);}

        @keyframes hIn{from{opacity:0;transform:translateY(-18px) scale(.97)}to{opacity:1;transform:none}}
        .hero-card{border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.9);box-shadow:0 16px 48px -10px rgba(30,45,64,.12),0 0 0 1px rgba(201,146,42,.08);animation:hIn .75s var(--out) both;}
        @keyframes stripe{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
        .hero-stripe{height:3px;background:linear-gradient(90deg,var(--primary),var(--gold),var(--red),var(--gold),var(--primary));background-size:300% 300%;animation:stripe 5s ease infinite;}
        .hero-body{background:rgba(255,255,255,.97);backdrop-filter:blur(8px);padding:20px 28px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;}
        .hero-left{display:flex;align-items:center;gap:16px;}
        .hero-av-wrap{position:relative;}
        @keyframes avF{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .hero-av{border:4px solid #fff8ee!important;box-shadow:0 0 0 2px #c9922a33;animation:avF 5s ease-in-out infinite;}
        @keyframes dotP{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.4}}
        .hero-dot{position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#22c55e;border-radius:50%;border:2px solid white;animation:dotP 2s ease-in-out infinite;}
        @keyframes ttl{from{opacity:0;letter-spacing:.2em}to{opacity:1;letter-spacing:normal}}
        .hero-title{font-family:'Kanit',sans-serif;font-weight:900;font-size:clamp(18px,3vw,28px);color:#1e293b;margin:0;animation:ttl .9s .15s var(--out) both;}
        .hero-name{background:linear-gradient(135deg,var(--primary),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero-sub{color:#94a3b8;font-size:13px;margin:4px 0 0;}
        .refresh-btn{display:flex;align-items:center;gap:8px;background:var(--primary);color:white;font-family:'Kanit',sans-serif;font-weight:700;font-size:13px;padding:10px 20px;border-radius:14px;border:none;box-shadow:0 6px 16px rgba(30,45,64,.3);transition:background .2s,transform .18s var(--spring);}
        .refresh-btn:hover{background:var(--gold);}
        @keyframes spinA{to{transform:rotate(360deg)}}
        .spin-icon{animation:spinA .6s linear infinite;}

        .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
        @media(min-width:1024px){.stats-grid{grid-template-columns:repeat(4,1fr);}}
        @keyframes scIn{from{opacity:0;transform:scale(.82) translateY(18px)}to{opacity:1;transform:none}}
        .sc-card{position:relative;overflow:hidden;border-radius:20px;border:1px solid var(--c,#1e2d40)40;background:white;cursor:default;user-select:none;animation:scIn .55s var(--spring) both;transition:transform .22s var(--spring),box-shadow .22s ease;}
        .sc-card:hover{transform:translateY(-7px) scale(1.025);box-shadow:0 20px 40px -10px var(--c,rgba(30,45,64,.3));}
        .sc-shine{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.22),transparent 60%);pointer-events:none;opacity:0;transition:opacity .3s;}
        .sc-card:hover .sc-shine{opacity:1;}
        .sc-body{position:relative;z-index:1;padding:20px 22px;}
        .sc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .sc-icon{border-radius:14px;padding:10px;font-size:20px;transition:transform .3s var(--spring);}
        .sc-card:hover .sc-icon{transform:rotate(-12deg) scale(1.22);}
        @keyframes orbP{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
        .sc-orb{width:40px;height:40px;border-radius:50%;opacity:.4;animation:orbP 3s ease-in-out infinite;}
        .sc-label{font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;}
        .sc-value{font-family:'Kanit',sans-serif;font-size:clamp(32px,4vw,44px);font-weight:900;margin:0;}

        .pb-host{position:fixed;pointer-events:none;z-index:9999;}
        @keyframes pbD{0%{transform:rotate(var(--angle,0deg)) translateX(0) scale(1);opacity:1}100%{transform:rotate(var(--angle,0deg)) translateX(42px) scale(0);opacity:0}}
        .pb-dot{position:absolute;width:7px;height:7px;border-radius:50%;animation:pbD .55s var(--out) both;}

        .panel{background:rgba(255,255,255,.97);backdrop-filter:blur(8px);border-radius:22px;border:1px solid rgba(255,255,255,.8);box-shadow:0 8px 28px rgba(30,45,64,.07);overflow:hidden;}
        .panel-head,.steps-head{display:flex;align-items:center;gap:12px;padding:22px 28px;border-bottom:1px solid #f1f5f9;}
        .panel-icon{padding:10px;border-radius:14px;font-size:18px;line-height:1;}
        .panel-title{font-family:'Kanit',sans-serif;font-weight:900;color:#1e293b;font-size:18px;margin:0;}

        /* ─── chart year filter select ─── */
        .cyf-wrap{display:flex;align-items:center;gap:5px;flex-shrink:0;}
        .cyf-icon{color:var(--gold);font-size:12px;}
        .cyf-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
        .cyf-select .ant-select-selector{border-radius:10px!important;border-color:#e2e8f0!important;background:#fafafa!important;font-size:12px!important;}
        .cyf-select .ant-select-selector:hover{border-color:var(--gold)!important;}
        .cyf-select.ant-select-focused .ant-select-selector{border-color:var(--gold)!important;box-shadow:0 0 0 2px rgba(201,146,42,.2)!important;}
        .cyf-select .ant-select-selection-item{color:var(--gold)!important;font-weight:800!important;}
        .cyf-select .ant-select-arrow{color:var(--gold)!important;}

        .charts-grid{display:grid;grid-template-columns:1fr;gap:24px;padding:24px 28px;}
        @media(min-width:1024px){.charts-grid{grid-template-columns:1fr 1fr;}}
        .chart-card{border-radius:18px;background:#f8fafc;padding:20px 22px;border:1px solid rgba(201,146,42,.1);transition:all .3s;}
        .chart-card:hover{box-shadow:0 10px 30px -10px rgba(30,45,64,.14);border-color:rgba(201,146,42,.2);}
        .chart-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:4px;}
        .chart-title{font-family:'Kanit',sans-serif;font-weight:700;color:#334155;font-size:14px;margin:0 0 2px;}
        .chart-sub{font-size:11px;color:#94a3b8;margin:0 0 8px;}
        .chart-body{display:flex;align-items:center;justify-content:center;}
        .no-data{color:#94a3b8;font-size:13px;padding:40px 0;}
        .yr-tag{display:inline-flex;align-items:center;gap:5px;background:#fff8ee;color:var(--gold);border:1.5px solid #c9922a33;font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;margin-bottom:10px;font-family:'Kanit',sans-serif;}
        .all-years-badge{display:inline-flex;align-items:center;background:#f0fdf4;color:#15803d;border:1.5px solid #22c55e33;font-size:10px;font-weight:800;padding:4px 10px;border-radius:50px;white-space:nowrap;align-self:flex-start;margin-top:2px;font-family:'Kanit',sans-serif;}

        .steps-mobile{display:flex;flex-direction:column;gap:0;padding:20px 28px;}
        @media(min-width:768px){.steps-mobile{display:none;}}
        .step-m{display:flex;gap:16px;align-items:stretch;}
        .step-m-track{display:flex;flex-direction:column;align-items:center;}
        .step-icon{border-radius:14px;padding:10px;font-size:16px;transition:transform .28s var(--spring);}
        .step-m:hover .step-icon{transform:scale(1.18) rotate(-8deg);}
        .step-line{width:2px;flex:1;min-height:18px;margin:4px 0;}
        .step-m-body{padding-bottom:16px;padding-top:2px;flex:1;}
        .step-title{font-family:'Kanit',sans-serif;font-weight:700;color:#1e293b;font-size:13px;margin:0 0 2px;}
        .step-desc{font-size:12px;color:#94a3b8;line-height:1.6;margin:0;}
        .steps-desktop{display:none;}
        @media(min-width:768px){.steps-desktop{display:flex;align-items:start;gap:0;padding:22px 28px;border-bottom:1px solid #f1f5f9;}}
        .step-d{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 8px;cursor:default;}
        .step-d-top{position:relative;width:100%;display:flex;justify-content:center;margin-bottom:12px;}
        .step-icon-d{width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,.06);}
        .step-d:hover .step-icon-d{transform:scale(1.14) rotate(-8deg);box-shadow:0 8px 24px rgba(0,0,0,.12);}
        .step-conn{position:absolute;top:28px;left:60%;right:0;height:2px;}
        .step-title-d{font-size:11px;}

        .filter-zone{padding:24px 28px;background:#fafafa;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;position:relative;}
        .filter-zone-locked::after{content:'';position:absolute;inset:0;background:rgba(248,250,252,.55);backdrop-filter:blur(2px);pointer-events:none;z-index:10;border-radius:inherit;}
        .filter-head{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .lock-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#c9922a;background:#fff8ee;border:1px solid #c9922a33;padding:4px 12px;border-radius:50px;}
        .filter-grid{display:grid;grid-template-columns:1fr;gap:12px;}
        @media(min-width:640px){.filter-grid{grid-template-columns:repeat(2,1fr);}}
        @media(min-width:1024px){.filter-grid{grid-template-columns:2fr 1fr 1fr 1fr 1fr;}}
        .filter-col-2{}
        @media(min-width:640px){.filter-col-2{grid-column:span 2;}}
        @media(min-width:1024px){.filter-col-2{grid-column:span 1;}}
        .filter-label{display:block;font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px;}
        .filter-label-gold{color:#c9922a;}
        .filter-inp{border-radius:12px!important;}
        .filter-hof{display:flex;flex-direction:column;justify-content:space-between;}
        .clear-btn{font-size:12px;font-weight:700;color:#94a3b8;background:none;border:none;cursor:pointer;transition:color .2s;padding:0;}
        .clear-btn:hover{color:#b03a2e;}
        .clear-btn-disabled{cursor:not-allowed;opacity:.4;}

        .tbl-header{display:flex;align-items:center;gap:12px;padding:22px 28px 10px;}
        .cnt-badge{background:#fff8ee;color:var(--gold);border:1.5px solid #c9922a33;font-size:11px;font-weight:900;padding:3px 10px;border-radius:50px;font-family:'Kanit',sans-serif;}
        .loading-wrap{padding:80px 0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ld-ring{width:44px;height:44px;border-radius:50%;border:4px solid #f1f5f9;border-top-color:var(--gold);animation:spin .7s linear infinite;}
        .ld-text{color:#94a3b8;font-weight:700;font-size:13px;}

        .ep-tbl .ant-table{background:transparent!important;}
        .ep-tbl .ant-table-thead>tr>th{background:#fafafa!important;font-size:11px!important;padding:12px 16px!important;border-bottom:2px solid #f1f5f9!important;}
        .ep-tbl .ant-table-tbody>tr>td{padding:13px 16px!important;border-bottom:1px solid #f8fafc!important;transition:background .15s;}
        .ep-row{transition:all .2s;}
        .ep-row:not(.ep-row-guest):hover>td{background:#fff8ee!important;}
        .ep-row:not(.ep-row-guest):hover{box-shadow:inset 4px 0 0 var(--gold);cursor:pointer;}
        @keyframes rFlash{0%{background:#fff8ee}100%{background:transparent}}
        .ep-row-flash>td{animation:rFlash .5s ease forwards!important;}
        .ep-row-guest{cursor:default;}
        .col-hd{font-size:11px;font-weight:900;color:#64748b;letter-spacing:.06em;}
        .tbl-title{font-family:'Kanit',sans-serif;font-weight:700;color:#1e293b;font-size:13px;line-height:1.4;margin:0 0 4px;}
        .tbl-sub{font-size:12px;color:#94a3b8;margin:0;}
        .feat-pill{display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:11px;font-weight:700;color:#92400e;background:#fff8ee;border:1px solid #c9922a44;padding:2px 9px;border-radius:50px;}
        .year-badge{font-family:'Kanit',sans-serif;font-weight:700;color:#1e293b;background:#f1f5f9;padding:4px 10px;border-radius:10px;font-size:13px;}
        .adv-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;background:#fafafa;border:1.5px solid #e2e8f0;color:#475569;padding:5px 10px;border-radius:50px;font-weight:600;}
        .status-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:50px;}
        @keyframes dotBlink{0%,100%{opacity:1}50%{opacity:.3}}
        .status-dot{width:8px;height:8px;border-radius:50%;animation:dotBlink 2.2s ease-in-out infinite;}
        .det-btn{position:relative;overflow:hidden;background:#fff8ee;color:var(--gold);font-family:'Kanit',sans-serif;font-weight:700;font-size:11px;padding:6px 14px;border-radius:12px;border:1.5px solid #c9922a44;transition:all .18s var(--spring);cursor:pointer;}
        .det-btn:hover{background:var(--gold);color:white;transform:translateY(-2px) scale(1.06);box-shadow:0 8px 20px -5px rgba(201,146,42,.45);}
        .det-btn-locked{background:#f1f5f9!important;color:#94a3b8!important;border-color:#e2e8f0!important;cursor:not-allowed!important;opacity:.7;}
        .det-btn-locked:hover{transform:none!important;box-shadow:none!important;}
        .tbl-pager{padding:16px 28px 24px!important;}
        .ant-pagination-item{border-radius:10px!important;font-weight:700!important;}
        .ant-pagination-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(201,146,42,.28);}
        .ant-pagination-item-active{background:var(--gold)!important;border-color:var(--gold)!important;}
        .ant-pagination-item-active a{color:white!important;}

        .ep-modal .ant-modal-content{border-radius:22px!important;overflow:hidden;padding:0;box-shadow:0 40px 80px -20px rgba(0,0,0,.22);}
        .ep-modal .ant-modal-close{top:12px;right:12px;transition:transform .2s;}
        .ep-modal .ant-modal-close:hover{color:#b03a2e;transform:rotate(90deg) scale(1.2);}
        @keyframes mIn{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:none}}
        .m-anim{animation:mIn .38s var(--spring) both;}
        .m-hero{background:linear-gradient(135deg,var(--primary),#2c4a6e 50%,#1a3850);min-height:130px;display:flex;align-items:flex-end;position:relative;overflow:hidden;padding:28px 32px;border-radius:22px 22px 0 0;}
        .m-hero-bg{position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 10px);}
        @keyframes featSlide{from{transform:translateX(35px)}to{transform:none}}
        .m-feat-tag{position:absolute;top:0;right:0;background:linear-gradient(to left,#c9922a,#f0c040);color:#78350f;font-family:'Kanit',sans-serif;font-weight:900;font-size:12px;padding:8px 20px;border-radius:0 0 0 16px;z-index:20;animation:featSlide .38s .18s var(--spring) both;}
        .m-hero-body{position:relative;z-index:10;}
        .m-title{font-family:'Kanit',sans-serif;font-weight:900;color:white;font-size:clamp(18px,3vw,26px);line-height:1.3;margin:0 0 6px;text-shadow:0 2px 8px rgba(0,0,0,.2);}
        .m-sub{color:rgba(255,255,255,.65);font-size:13px;margin:0;}
        .m-body{padding:20px 28px;}
        @keyframes mRow{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .m-row{display:flex;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid #f8fafc;animation:mRow .32s var(--out) both;}
        .m-row:last-child{border-bottom:none;}
        .m-emoji{font-size:18px;width:26px;text-align:center;flex-shrink:0;}
        .m-label{font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.12em;text-transform:uppercase;width:88px;flex-shrink:0;}
        .m-val{font-family:'Kanit',sans-serif;font-weight:700;color:#1e293b;font-size:14px;}
        .m-status{display:inline-flex;align-items:center;gap:8px;font-family:'Kanit',sans-serif;font-weight:900;font-size:13px;padding:7px 16px;border-radius:20px;}
        .m-status-dot{width:10px;height:10px;border-radius:50%;}
        .m-footer{padding:8px 28px 24px;display:flex;justify-content:flex-end;}
        .m-close-btn{background:var(--primary);color:white;font-family:'Kanit',sans-serif;font-weight:700;font-size:13px;padding:12px 28px;border-radius:14px;border:none;cursor:pointer;box-shadow:0 6px 16px rgba(30,45,64,.3);transition:background .2s;}
        .m-close-btn:hover{background:var(--gold);}

        @keyframes notifIn{from{transform:translateX(100%) scale(.92)}to{transform:translateX(0) scale(1)}}
        .notif-gold{animation:notifIn .38s var(--spring) both!important;}
        @keyframes bulbB{0%,100%{transform:scale(1)}40%{transform:scale(1.45);filter:drop-shadow(0 0 6px #c9922a)}}
        .notif-bulb{animation:bulbB 1.2s ease-in-out infinite;}
        .recharts-surface{overflow:visible!important;}
        .recharts-tooltip-wrapper{border-radius:12px!important;}
        @media(max-width:640px){
          .gd-content{padding:14px;}
          .hero-body{padding:16px 18px;}
          .panel-head,.steps-head,.filter-head,.tbl-header{padding:16px 18px;}
          .filter-zone,.m-body,.m-footer{padding-left:18px;padding-right:18px;}
          .charts-grid{padding:16px 18px;}
          .chart-card-head{flex-direction:column;align-items:flex-start;}
        }
      `}</style>
    </Layout>
  );
};

export default GuestDashboard;