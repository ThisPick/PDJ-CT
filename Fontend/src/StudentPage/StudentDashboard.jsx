import React, { useState, useEffect, useRef } from 'react';
import { Layout, Table, Tag, Avatar, Input, Select, Switch, Modal, message, notification } from 'antd';
import {
  ProjectOutlined, RocketOutlined, CodeOutlined, UserOutlined, SearchOutlined,
  ReloadOutlined, TrophyFilled, BulbOutlined, TeamOutlined, FormOutlined, ToolOutlined,
  FundProjectionScreenOutlined, BookOutlined, BarChartOutlined, CalendarOutlined,
  LeftOutlined, RightOutlined
} from '@ant-design/icons';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, Sector, Legend } from 'recharts';
import { getAllProjects } from '../services/projectService';
import { userService } from '../services/userService';
import StudentSidebar from '../StudentPage/Studentbar';

const { Content } = Layout;
const { Option } = Select;

/* ── SOUND ENGINE ── */
class SFX {
  constructor(){this.c=null;}
  _g(){if(!this.c)this.c=new(window.AudioContext||window.webkitAudioContext)();return this.c;}
  _r(fn){try{fn(this._g());}catch(e){}}
  tick(f=880,d=.06,v=.14){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.start();o.stop(c.currentTime+d);});}
  pop(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='triangle';o.frequency.setValueAtTime(320,c.currentTime);o.frequency.exponentialRampToValueAtTime(900,c.currentTime+.05);g.gain.setValueAtTime(.22,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.09);o.start();o.stop(c.currentTime+.09);});}
  chime(){this._r(c=>{[523.25,659.25,783.99].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;const t=c.currentTime+i*.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.start(t);o.stop(t+.35);});});}
  whoosh(){this._r(c=>{const n=Math.ceil(c.sampleRate*.22),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.setValueAtTime(200,c.currentTime);f.frequency.linearRampToValueAtTime(2000,c.currentTime+.22);g.gain.setValueAtTime(.1,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.22);s.buffer=buf;s.connect(f);f.connect(g);g.connect(c.destination);s.start();s.stop(c.currentTime+.22);});}
  bell(){this._r(c=>{[880,1108,1320].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;const t=c.currentTime+i*.06;g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.0001,t+.6);o.start(t);o.stop(t+.6);});});}
  sweep(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sawtooth';o.frequency.setValueAtTime(110,c.currentTime);o.frequency.exponentialRampToValueAtTime(440,c.currentTime+.18);g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.2);o.start();o.stop(c.currentTime+.2);});}
  thud(){this._r(c=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(180,c.currentTime);o.frequency.exponentialRampToValueAtTime(55,c.currentTime+.13);g.gain.setValueAtTime(.28,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.15);o.start();o.stop(c.currentTime+.15);});}
  sparkle(){this._r(c=>{[1046,1318,1568,2093].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;const t=c.currentTime+i*.07;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.start(t);o.stop(t+.28);});});}
}
const sfx = new SFX();

/* ── PARTICLE BURST ── */
const Burst=({active,x,y,color})=>!active?null:(
  <div className="pointer-events-none fixed z-[9999]" style={{left:x,top:y}}>
    {Array.from({length:14}).map((_,i)=>(
      <div key={i} style={{position:'absolute',width:6,height:6,borderRadius:'50%',background:color,
        animation:`burst .6s cubic-bezier(.16,1,.3,1) ${i*12}ms both`,
        transform:`rotate(${i*(360/14)}deg) translateX(0)`}} className="pdot"/>
    ))}
  </div>
);

/* ── COUNTER ── */
const useCounter=(target,dur=1500)=>{
  const[v,setV]=useState(0);
  useEffect(()=>{
    if(!target){setV(0);return;}
    let n=0;const inc=target/(dur/16);
    const id=setInterval(()=>{n+=inc;if(n>=target){setV(target);clearInterval(id);}else setV(Math.floor(n));},16);
    return()=>clearInterval(id);
  },[target]);
  return v;
};

/* ── MAG BUTTON ── */
const MagBtn=({children,onClick,className='',style={}})=>{
  const r=useRef();
  return(<button ref={r}
    onMouseMove={e=>{const b=r.current.getBoundingClientRect();const x=(e.clientX-b.left-b.width/2)*.22,y=(e.clientY-b.top-b.height/2)*.22;r.current.style.transform=`translate(${x}px,${y}px) scale(1.04)`;}}
    onMouseLeave={()=>{r.current.style.transform='translate(0,0) scale(1)';}}
    onClick={onClick} className={className}
    style={{transition:'transform .18s cubic-bezier(.34,1.56,.64,1)',...style}}>{children}</button>);
};

/* ── STAT CARD ── */
const StatCard=({title,value,icon,color,bg,delay=0})=>{
  const count=useCounter(value);
  const[burst,setBurst]=useState({active:false,x:0,y:0});
  const ref=useRef();
  const onH=()=>{sfx.sparkle();const r=ref.current.getBoundingClientRect();setBurst({active:true,x:r.left+r.width/2,y:r.top+r.height/2});setTimeout(()=>setBurst(b=>({...b,active:false})),700);};
  return(<><Burst {...burst} color={color}/>
    <div ref={ref} onMouseEnter={onH} className="sc-e relative overflow-hidden rounded-2xl border bg-white cursor-pointer select-none" style={{borderColor:color+'40',animationDelay:delay+'ms','--c':color}}>
      <div className="sc-sh"/>
      <div className="relative z-10 p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="rounded-xl p-3 text-2xl sc-ic" style={{background:bg,color}}>{icon}</div>
          <div className="sc-orb" style={{background:color+'20'}}/>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[.15em] mb-1">{title}</p>
        <p className="text-4xl md:text-5xl font-black tabular-nums" style={{color}}>{count.toLocaleString()}</p>
      </div>
    </div>
  </>);
};

/* ── CHART YEAR FILTER ── */
const ChartYearFilter=({years,value,onChange})=>(
  <div className="cyf-wrap">
    <CalendarOutlined className="cyf-icon"/>
    <span className="cyf-label">ปี:</span>
    <Select size="small" value={value??'__all__'}
      onChange={v=>{sfx.pop();onChange(v==='__all__'?null:String(v));}}
      popupMatchSelectWidth={false} className="cyf-select" style={{minWidth:108}}>
      <Option value="__all__"><span style={{fontWeight:700,color:'#64748b'}}>ทั้งหมด</span></Option>
      {years.map(y=><Option key={y} value={String(y)}><span style={{fontWeight:700}}>{y}</span></Option>)}
    </Select>
  </div>
);

/* ── DONUT ACTIVE SHAPE ── */
const ActiveDonutShape=props=>{
  const{cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value}=props;
  return(
    <g>
      <text x={cx} y={cy-14} textAnchor="middle" fill="#1e293b" style={{fontWeight:900,fontSize:12}}>{payload.name}</text>
      <text x={cx} y={cy+9}  textAnchor="middle" fill={fill}    style={{fontWeight:900,fontSize:22}}>{value}</text>
      <text x={cx} y={cy+28} textAnchor="middle" fill="#94a3b8" style={{fontSize:11}}>{(percent*100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+7} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
      <Sector cx={cx} cy={cy} innerRadius={outerRadius+10} outerRadius={outerRadius+14} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
    </g>
  );
};

/* ── TOOLTIPS ── */
const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:'white',border:'1px solid #bae6fd',borderRadius:12,padding:'10px 14px',boxShadow:'0 12px 28px rgba(14,165,233,.15)',minWidth:160}}>
      {label&&<p style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</p>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:p.color||p.fill,flexShrink:0}}/>
          <span style={{fontWeight:700,color:'#475569',fontSize:12}}>{p.name}: </span>
          <span style={{fontWeight:900,color:'#0c4a6e',fontSize:13}}>{(p.value||0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};
const AdvisorTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  const total=payload.reduce((s,p)=>s+(p.value||0),0);
  return(
    <div style={{background:'white',border:'1px solid #bae6fd',borderRadius:14,padding:'12px 16px',boxShadow:'0 12px 28px rgba(14,165,233,.18)',minWidth:200}}>
      <p style={{fontSize:12,fontWeight:900,color:'#0c4a6e',marginBottom:8,borderBottom:'1px solid #e0f2fe',paddingBottom:6}}>{label}</p>
      {payload.filter(p=>p.value>0).map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:4}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{width:9,height:9,borderRadius:'50%',background:p.fill,flexShrink:0}}/>
            <span style={{fontWeight:700,color:'#475569',fontSize:11}}>{p.name}</span>
          </div>
          <span style={{fontWeight:900,color:p.fill,fontSize:13}}>{p.value}</span>
        </div>
      ))}
      <div style={{borderTop:'1px solid #e0f2fe',marginTop:6,paddingTop:6,display:'flex',justifyContent:'space-between'}}>
        <span style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase'}}>รวม</span>
        <span style={{fontSize:13,fontWeight:900,color:'#0369a1'}}>{total} โครงงาน</span>
      </div>
    </div>
  );
};

/* ── THEME ── */
const SS={
  'สมบูรณ์':        {bg:'#dcfce7',text:'#15803d',dot:'#22c55e'},
  'กำลังทำ':        {bg:'#dbeafe',text:'#1d4ed8',dot:'#3b82f6'},
  'รออนุมัติหัวข้อ':{bg:'#fef9c3',text:'#a16207',dot:'#eab308'},
  'รออนุมัติเล่ม':  {bg:'#fef9c3',text:'#a16207',dot:'#f59e0b'},
  'ล่าช้า':          {bg:'#fee2e2',text:'#b91c1c',dot:'#ef4444'},
  'ไม่ผ่าน':         {bg:'#fee2e2',text:'#b91c1c',dot:'#f87171'},
};
const STATUS_COLORS={
  'สมบูรณ์':'#22c55e','กำลังทำ':'#3b82f6','รออนุมัติหัวข้อ':'#eab308',
  'รออนุมัติเล่ม':'#f59e0b','ล่าช้า':'#ef4444','ไม่ผ่าน':'#f87171','ไม่ระบุ':'#94a3b8',
};
const CHART_COLORS=['#0ea5e9','#14b8a6','#f59e0b','#8b5cf6','#10b981','#ec4899','#0369a1','#6366f1'];
const STEPS=[
  {icon:<TeamOutlined/>,                color:'#0ea5e9',bg:'#e0f2fe',title:'1. คิดหัวข้อ & รวมกลุ่ม',    desc:'รวมกลุ่มเพื่อน คิดไอเดีย หาข้อมูล'},
  {icon:<FormOutlined/>,                color:'#f59e0b',bg:'#fffbeb',title:'2. เสนอหัวข้อโครงงาน',       desc:'ยื่นเสนอผ่านระบบ รอรับการอนุมัติ'},
  {icon:<ToolOutlined/>,                color:'#10b981',bg:'#f0fdf4',title:'3. พัฒนา & รายงาน 50%',      desc:'ลงมือพัฒนา รายงานความคืบหน้า'},
  {icon:<FundProjectionScreenOutlined/>,color:'#8b5cf6',bg:'#faf5ff',title:'4. สอบป้องกัน 100%',         desc:'นำเสนอต่อคณะกรรมการ'},
  {icon:<BookOutlined/>,                color:'#ec4899',bg:'#fdf2f8',title:'5. ส่งเล่ม & เผยแพร่',        desc:'ส่งเอกสาร เผยแพร่ผลงาน'},
];
const getAU=f=>{if(!f||f==='null'||f==='undefined')return null;if(f.startsWith('http'))return f;const b=(import.meta.env.VITE_API_BASE_URL||'https://reg.utc.ac.th').replace(/\/api\/?$/,'').replace(/\/$/,'');const c=f.startsWith('/')?f.slice(1):f;return c.includes('..')?null:`${b}/uploads/profiles/${c}`;};

/* ════════════════════════════════════════════
   🎨  CUSTOM PAGINATION — แสดงใต้ตารางทันที
════════════════════════════════════════════ */
const PAGE_SIZE = 5;

const CustomPagination = ({ current, total, onChange }) => {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const from = (current - 1) * PAGE_SIZE + 1;
  const to   = Math.min(current * PAGE_SIZE, total);

  const go = (pg) => {
    if (pg < 1 || pg > totalPages || pg === current) return;
    sfx.pop();
    onChange(pg);
  };

  const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="cpg-root">
      {/* rainbow accent line */}
      <div className="cpg-accent" />

      {/* LEFT — info */}
      <div className="cpg-left">
        <span className="cpg-badge">
          {from}–{to} <span className="cpg-of">จาก</span> {total}
        </span>
        <span className="cpg-sub">หน้า {current} / {totalPages}</span>
      </div>

      {/* CENTER — controls */}
      <div className="cpg-center">
        <button
          className={`cpg-arrow ${current === 1 ? 'cpg-off' : 'cpg-on'}`}
          onClick={() => go(current - 1)}
          disabled={current === 1}
        >
          <LeftOutlined />
        </button>

        <div className="cpg-nums">
          {allPages.map((pg, idx) => {
            const show = pg === 1 || pg === totalPages || Math.abs(pg - current) <= 1;
            const gap  = idx > 0 && allPages[idx - 1] < pg - 1;
            if (!show) return null;
            return (
              <React.Fragment key={pg}>
                {gap && <span className="cpg-dots-mid">···</span>}
                <button
                  onClick={() => go(pg)}
                  className={`cpg-num ${pg === current ? 'cpg-num-active' : 'cpg-num-idle'}`}
                >
                  {pg}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button
          className={`cpg-arrow ${current === totalPages ? 'cpg-off' : 'cpg-on'}`}
          onClick={() => go(current + 1)}
          disabled={current === totalPages}
        >
          <RightOutlined />
        </button>
      </div>

      {/* RIGHT — dot strip */}
      <div className="cpg-strip">
        {allPages.map(pg => (
          <button
            key={pg}
            onClick={() => go(pg)}
            title={`หน้า ${pg}`}
            className={`cpg-dot ${pg === current ? 'cpg-dot-active' : 'cpg-dot-idle'}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export const StudentDashboard=()=>{
  const[user,setUser]           =useState({full_name:'กำลังโหลด...',profile_img:null});
  const[raw,setRaw]             =useState([]);
  const[filtered,setFiltered]   =useState([]);
  const[loading,setLoading]     =useState(true);
  const[refreshing,setRefreshing]=useState(false);
  const[ready,setReady]         =useState(false);
  const[activeRow,setActiveRow] =useState(null);
  const[confetti,setConfetti]   =useState(false);
  const[api,ctx]                =notification.useNotification();
  const prev=useRef(null);

  const[s,setS]   =useState('');
  const[fy,setFy] =useState(null);
  const[fc,setFc] =useState(null);
  const[fa,setFa] =useState(null);
  const[ff,setFf] =useState(false);
  const[modal,setModal]=useState(false);
  const[sel,setSel]   =useState(null);

  /* pagination */
  const[tablePage,setTablePage]=useState(1);
  const prevSig=useRef('');

  const[statusYear,  setStatusYear]  =useState(null);
  const[catYear,     setCatYear]     =useState(null);
  const[advYear,     setAdvYear]     =useState(null);
  const[activePieIdx,setActivePieIdx]=useState(0);

  useEffect(()=>{setTimeout(()=>setReady(true),80);},[]);
  useEffect(()=>{
    if(!ready)return;
    const io=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('io-in');io.unobserve(x.target);}});},{threshold:.07});
    document.querySelectorAll('.io').forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },[ready,loading]);

  useEffect(()=>{
    const dots=[];const MAX=10;
    for(let i=0;i<MAX;i++){const d=document.createElement('div');d.style.cssText=`position:fixed;pointer-events:none;z-index:99999;width:${5+i*.5}px;height:${5+i*.5}px;border-radius:50%;opacity:${.45-i*.035};background:rgba(14,165,233,${.35-i*.02});transition:transform ${50+i*22}ms ease;`;document.body.appendChild(d);dots.push({el:d,x:0,y:0});}
    let mx=0,my=0;const mv=e=>{mx=e.clientX;my=e.clientY;};
    document.addEventListener('mousemove',mv);
    let pr=dots.map(()=>({x:0,y:0}));let af;
    const tick=()=>{pr[0]={x:mx,y:my};for(let i=1;i<MAX;i++){pr[i].x+=(pr[i-1].x-pr[i].x)*.35;pr[i].y+=(pr[i-1].y-pr[i].y)*.35;}dots.forEach((d,i)=>{d.el.style.transform=`translate(${pr[i].x-2.5}px,${pr[i].y-2.5}px)`;});af=requestAnimationFrame(tick);};af=requestAnimationFrame(tick);
    return()=>{document.removeEventListener('mousemove',mv);cancelAnimationFrame(af);dots.forEach(d=>d.el.remove());};
  },[]);

  useEffect(()=>{
    (async()=>{
      const stored=localStorage.getItem('user')||sessionStorage.getItem('user');if(!stored)return;
      try{const p=JSON.parse(stored);setUser(p);const uid=p.id||p.userId;if(uid&&userService?.getProfile){const r=await userService.getProfile(uid);const d=r.data?.data||r.data;if(d){setUser(u=>({...u,...d,full_name:d.full_name||d.username||u.full_name}));localStorage.setItem('user',JSON.stringify(d));}}}catch(e){console.error(e);}
    })();
    fetchData(true);
    const id=setInterval(()=>fetchData(false),30000);
    return()=>clearInterval(id);
  },[]);

  const fetchData=async(show=true)=>{
    if(show){setLoading(true);sfx.sweep();}setRefreshing(true);
    try{
      const r=await getAllProjects();let data=[];
      if(Array.isArray(r))data=r;else if(r&&Array.isArray(r.data))data=r.data;else if(r?.data&&Array.isArray(r.data.data))data=r.data.data;
      if(!data.length){setRaw([]);setFiltered([]);return;}
      const srt=[...data].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      if(prev.current!==null&&srt.length>prev.current){
        const n=srt.length-prev.current;sfx.bell();setConfetti(true);setTimeout(()=>setConfetti(false),2200);
        const k=`n_${Date.now()}`;
        api.info({key:k,
          message:<span className="font-black text-sky-700 text-base">มีผลงานใหม่เข้าสู่ระบบ! 🎉</span>,
          description:<span className="text-slate-600 text-sm">อัปโหลดโครงงานใหม่ <b className="text-sky-600">{n} รายการ</b></span>,
          placement:'topRight',duration:0,icon:<BulbOutlined className="text-yellow-500 blbn"/>,
          className:'notifs cursor-pointer',
          style:{borderRadius:18,border:'2px solid #0ea5e9',background:'linear-gradient(135deg,#fff,#f0f9ff)',boxShadow:'0 20px 40px -10px rgba(14,165,233,.28)'},
          onClick:()=>{sfx.chime();api.destroy(k);}});
      }
      prev.current=srt.length;setRaw(srt);if(show)sfx.chime();
    }catch(e){if(show)message.error('ไม่สามารถโหลดข้อมูลได้');}
    finally{setLoading(false);setTimeout(()=>setRefreshing(false),500);}
  };

  useEffect(()=>{
    let r=raw;const lc=s.toLowerCase();
    if(s)r=r.filter(p=>(p.title_th||'').toLowerCase().includes(lc)||(p.student_name||'').toLowerCase().includes(lc)||(p.creator_name||'').toLowerCase().includes(lc));
    if(fy)r=r.filter(p=>String(p.academic_year)===String(fy));
    if(fc)r=r.filter(p=>p.category===fc);
    if(fa)r=r.filter(p=>p.advisor===fa);
    if(ff)r=r.filter(p=>p.is_featured===1||p.is_featured===true);
    setFiltered(r);
  },[s,fy,fc,fa,ff,raw]);

  /* reset page on filter change */
  const filterSig=`${s}|${fy}|${fc}|${fa}|${ff}`;
  if(prevSig.current!==filterSig){prevSig.current=filterSig;if(tablePage!==1)setTablePage(1);}

  const clr=()=>{sfx.sweep();setS('');setFy(null);setFc(null);setFa(null);setFf(false);setTablePage(1);};
  const open=rec=>{sfx.whoosh();setSel(rec);setActiveRow(rec.project_id);setTimeout(()=>setActiveRow(null),600);setModal(true);};

  /* paginated slice */
  const pagedData=filtered.slice((tablePage-1)*PAGE_SIZE, tablePage*PAGE_SIZE);

  const total=filtered.length,pend=filtered.filter(p=>p.progress_status?.includes('รอ')).length,comp=filtered.filter(p=>p.progress_status==='สมบูรณ์').length,feat=filtered.filter(p=>p.is_featured===1||p.is_featured===true).length;
  const uY=[...new Set(raw.map(p=>p.academic_year).filter(Boolean))].sort((a,b)=>b-a);
  const uC=[...new Set(raw.map(p=>p.category).filter(Boolean))];
  const uA=[...new Set(raw.map(p=>p.advisor).filter(Boolean))];

  const poolByYear=yr=>yr?raw.filter(p=>String(p.academic_year)===String(yr)):raw;
  const statusData=(()=>{const pool=poolByYear(statusYear);const counts={};Object.keys(SS).forEach(k=>{counts[k]=0;});pool.forEach(p=>{const k=p.progress_status||'ไม่ระบุ';counts[k]=(counts[k]||0)+1;});return Object.entries(counts).filter(([,v])=>v>0).map(([name,value])=>({name,value,color:SS[name]?.dot||'#94a3b8'}));})();
  const categoryData=(()=>{const pool=poolByYear(catYear);const counts={};pool.forEach(p=>{const c=p.category||'ไม่ระบุ';counts[c]=(counts[c]||0)+1;});return Object.entries(counts).map(([name,value],i)=>({name,value,color:CHART_COLORS[i%CHART_COLORS.length]})).sort((a,b)=>b.value-a.value);})();
  const yearData=(()=>{const counts={};raw.forEach(p=>{const y=p.academic_year||'ไม่ระบุ';counts[y]=(counts[y]||0)+1;});return Object.entries(counts).map(([name,value])=>({name:String(name),value})).sort((a,b)=>parseInt(a.name)-parseInt(b.name));})();
  const allStatuses=Object.keys(SS);
  const advisorStatusData=(()=>{const pool=poolByYear(advYear);const map={};pool.forEach(p=>{const adv=p.advisor||'ไม่ระบุ';const st=p.progress_status||'ไม่ระบุ';if(!map[adv])map[adv]={};map[adv][st]=(map[adv][st]||0)+1;});const rows=Object.entries(map).map(([name,statMap])=>{const row={name};let total=0;allStatuses.forEach(st=>{row[st]=statMap[st]||0;total+=row[st];});Object.entries(statMap).forEach(([st,v])=>{if(!allStatuses.includes(st)){row['ไม่ระบุ']=(row['ไม่ระบุ']||0)+v;total+=v;}});row._total=total;return row;});return rows.sort((a,b)=>b._total-a._total).slice(0,10);})();
  const activeStatuses=(()=>{const set=new Set();advisorStatusData.forEach(r=>allStatuses.forEach(st=>{if(r[st]>0)set.add(st);}));if(advisorStatusData.some(r=>(r['ไม่ระบุ']||0)>0))set.add('ไม่ระบุ');return[...set];})();
  const advChartHeight=Math.max(300,advisorStatusData.length*46+40);

  const cols=[
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ชื่อโครงงาน</span>,dataIndex:'title_th',key:'tt',width:'32%',
      render:(t,r)=>(<div><p className="font-black text-slate-800 text-sm leading-snug mb-1">{t}</p><p className="text-xs text-slate-400">{"👤 "}{r.student_name||r.creator_name||'ไม่ระบุ'}</p>{r.is_featured&&<span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full fba"><TrophyFilled className="text-amber-400"/> ยอดเยี่ยม</span>}</div>)},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ปีการศึกษา</span>,dataIndex:'academic_year',key:'yr',align:'center',width:'10%',
      render:t=><span className="font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl text-sm">{t||'-'}</span>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ที่ปรึกษา</span>,dataIndex:'advisor',key:'adv',width:'16%',
      render:t=>t?<span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-full font-semibold"><UserOutlined className="text-sky-400"/>{t}</span>:<span className="text-slate-300">—</span>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">หมวดหมู่</span>,dataIndex:'category',key:'cat',width:'14%',
      render:t=><Tag color="cyan" className="text-xs px-2.5 py-1 border-0 rounded-full font-bold">{t||'—'}</Tag>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">สถานะ</span>,dataIndex:'progress_status',key:'st',width:'16%',
      render:st=>{const sc=SS[st]||{bg:'#f1f5f9',text:'#64748b',dot:'#94a3b8'};return<span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{background:sc.bg,color:sc.text}}><span className="w-2 h-2 rounded-full sdot" style={{background:sc.dot}}/>{st||'ไม่ระบุ'}</span>;}},
    {title:'',key:'ac',align:'center',width:'12%',
      render:(_,r)=><button onClick={e=>{e.stopPropagation();sfx.pop();open(r);}} onMouseEnter={()=>sfx.tick(700,.04,.07)} className="dbt">ดูรายละเอียด</button>},
  ];

  return(
    <Layout className={`min-h-screen flex flex-col md:flex-row bg-[#f0fbff] transition-opacity duration-700 ${ready?'opacity-100':'opacity-0'}`}>
      {ctx}
      <div className="mesh" aria-hidden="true"/>
      {confetti&&<div className="cfwrap" aria-hidden="true">{Array.from({length:30}).map((_,i)=><div key={i} className="cf" style={{'--cx':`${Math.random()*100}vw`,'--cy':`${-15-Math.random()*10}px`,'--cr':`${Math.random()*360}deg`,'--cd':`${.3+Math.random()*1.4}s`,background:`hsl(${Math.random()*360},80%,60%)`}}/>)}</div>}
      <StudentSidebar/>

      <Layout className="bg-transparent flex-1 min-w-0">
        <Content className="p-4 md:p-8 h-screen overflow-y-auto cs">
          <div className="mx-auto w-full max-w-[1600px] pb-24 space-y-5">

            {/* HERO */}
            <div className="io hsc overflow-hidden rounded-3xl">
              <div className="h-2 w-full stps"/>
              <div className="bg-white/95 backdrop-blur-sm p-5 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar size={68} src={getAU(user.profile_img)} icon={<UserOutlined/>} className="border-4 border-sky-100 shadow-lg avs"/>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white pls"/>
                  </div>
                  <div>
                    <h1 className="font-black text-xl md:text-3xl text-slate-800 m-0 ttls">
                      {"สวัสดี, "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-teal-500 wvt">{user.full_name}</span>{" ✌️"}
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">นักศึกษา • สำรวจไอเดียและดูภาพรวมผลงานโครงงานทั้งหมดในแผนก</p>
                  </div>
                </div>
                <MagBtn onClick={()=>{sfx.sweep();fetchData(true);}} className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg text-sm transition-all">
                  <ReloadOutlined className={refreshing?'animate-spin':''}/> รีเฟรชข้อมูล
                </MagBtn>
              </div>
            </div>

            {/* STATS */}
            <div className="io grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="โครงงานทั้งหมด" value={total} icon={<ProjectOutlined/>} color="#0ea5e9" bg="#e0f2fe" delay={0}/>
              <StatCard title="กำลังดำเนินการ"  value={pend}  icon={<CodeOutlined/>}    color="#f59e0b" bg="#fffbeb" delay={80}/>
              <StatCard title="เสร็จสมบูรณ์"    value={comp}  icon={<RocketOutlined/>}  color="#10b981" bg="#f0fdf4" delay={160}/>
              <StatCard title="Hall of Fame"      value={feat}  icon={<TrophyFilled/>}    color="#8b5cf6" bg="#faf5ff" delay={240}/>
            </div>

            {/* CHARTS */}
            <div className="io bg-white/95 backdrop-blur-sm rounded-3xl shadow-md border border-white/80 overflow-hidden">
              <div className="flex items-center gap-3 px-6 md:px-8 pt-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-2xl bg-sky-50"><BarChartOutlined className="text-sky-500 text-xl"/></div>
                <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">รายงานสถิติข้อมูล</h2>
              </div>
              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div><h3 className="chart-title">สถานะของโครงงาน</h3><p className="chart-sub">hover / คลิก slice เพื่อดูรายละเอียด</p></div>
                    {uY.length>0&&<ChartYearFilter years={uY} value={statusYear} onChange={v=>{setStatusYear(v);setActivePieIdx(0);}}/>}
                  </div>
                  {statusYear&&<div className="yr-tag"><CalendarOutlined/> ปี {statusYear}</div>}
                  <div style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {statusData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie activeIndex={activePieIdx} activeShape={ActiveDonutShape} data={statusData} cx="50%" cy="47%" innerRadius={68} outerRadius={100} dataKey="value"
                            onMouseEnter={(_,idx)=>{sfx.tick(500+idx*60,.04,.07);setActivePieIdx(idx);}} onClick={(_,idx)=>{sfx.pop();setActivePieIdx(idx);}} style={{cursor:'pointer'}}>
                            {statusData.map((e,i)=><Cell key={i} fill={e.color} stroke="white" strokeWidth={2}/>)}
                          </Pie>
                          <RTooltip content={<ChartTip/>}/><Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:11,fontWeight:700,color:'#475569'}}>{v}</span>}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{statusYear?` ในปี ${statusYear}`:''}</p>}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div><h3 className="chart-title">จำนวนโครงงานตามหมวดหมู่</h3><p className="chart-sub">เรียงจากมากไปน้อย</p></div>
                    {uY.length>0&&<ChartYearFilter years={uY} value={catYear} onChange={setCatYear}/>}
                  </div>
                  {catYear&&<div className="yr-tag"><CalendarOutlined/> ปี {catYear}</div>}
                  <div style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {categoryData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{left:110,right:28,top:4,bottom:4}} barSize={16}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false}/>
                          <XAxis type="number" stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false}/>
                          <YAxis dataKey="name" type="category" width={105} tick={{fontSize:11,fill:'#475569',fontWeight:700}} stroke="none"/>
                          <RTooltip content={<ChartTip/>} cursor={{fill:'#f0f9ff'}}/>
                          <Bar dataKey="value" radius={[0,10,10,0]} onMouseEnter={()=>sfx.tick(520,.04,.06)} onClick={()=>sfx.pop()}>
                            {categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{catYear?` ในปี ${catYear}`:''}</p>}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-card-head">
                    <div><h3 className="chart-title">แนวโน้มจำนวนโครงงานรายปี</h3><p className="chart-sub">แสดงทุกปีการศึกษา</p></div>
                    <span className="all-yrs-badge">ทุกปี</span>
                  </div>
                  <div style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {yearData.length>0?(
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={yearData} margin={{left:0,right:24,top:10,bottom:10}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe"/>
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize:11,fontWeight:700}}/>
                          <YAxis stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false}/>
                          <RTooltip content={<ChartTip/>}/>
                          <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3}
                            dot={{fill:'#0ea5e9',r:5,strokeWidth:2,stroke:'white'}}
                            activeDot={{r:8,strokeWidth:2,stroke:'white',fill:'#0c4a6e',onMouseEnter:()=>sfx.tick(560,.05,.08)}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล</p>}
                  </div>
                </div>
                <div className="chart-card adv-chart-card">
                  <div className="chart-card-head">
                    <div><h3 className="chart-title">สถานะโครงงานรายชื่อครูที่ปรึกษา</h3><p className="chart-sub">Top 10 ที่ปรึกษา · แยกตามสถานะโครงงาน</p></div>
                    {uY.length>0&&<ChartYearFilter years={uY} value={advYear} onChange={setAdvYear}/>}
                  </div>
                  <div className="adv-meta-row">
                    {advYear?<div className="yr-tag"><CalendarOutlined/> ปีการศึกษา {advYear}</div>:<div className="all-yrs-badge">ทุกปีการศึกษา</div>}
                    {advisorStatusData.length>0&&<span className="adv-count-badge">{advisorStatusData.length} ที่ปรึกษา · {advisorStatusData.reduce((s,r)=>s+r._total,0)} โครงงาน</span>}
                  </div>
                  {activeStatuses.length>0&&(
                    <div className="adv-legend">
                      {activeStatuses.map(st=>(
                        <div key={st} className="adv-legend-item">
                          <span className="adv-legend-dot" style={{background:STATUS_COLORS[st]||'#94a3b8'}}/><span className="adv-legend-label">{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{height:advChartHeight,display:'flex',alignItems:'center',justifyContent:'center',overflowY:'auto'}}>
                    {advisorStatusData.length>0?(
                      <ResponsiveContainer width="100%" height={advChartHeight}>
                        <BarChart data={advisorStatusData} layout="vertical" margin={{left:118,right:36,top:6,bottom:6}} barSize={20}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false}/>
                          <XAxis type="number" stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false} tickLine={false}/>
                          <YAxis dataKey="name" type="category" width={114}
                            tick={({x,y,payload})=>(
                              <text x={x-4} y={y} dy={4} textAnchor="end" fill="#334155" fontSize={11} fontWeight={700}>
                                {payload.value.length>14?payload.value.slice(0,13)+'…':payload.value}
                              </text>
                            )} stroke="none"/>
                          <RTooltip content={<AdvisorTip/>} cursor={{fill:'rgba(14,165,233,.07)'}}/>
                          {activeStatuses.map(st=>(
                            <Bar key={st} dataKey={st} name={st} stackId="a" fill={STATUS_COLORS[st]||'#94a3b8'}
                              onMouseEnter={()=>sfx.tick(500,.04,.06)} onClick={()=>sfx.pop()}/>
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    ):<p className="no-data">ไม่มีข้อมูล{advYear?` ในปี ${advYear}`:''}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* STEPS + FILTER + TABLE */}
            <div className="io bg-white/95 backdrop-blur-sm rounded-3xl shadow-md border border-white/80 overflow-hidden">

              {/* Steps */}
              <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-amber-50"><BulbOutlined className="text-amber-500 text-xl blb"/></div>
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">ขั้นตอนและแนวปฏิบัติในการทำโครงงาน</h2>
                </div>
                <div className="flex flex-col gap-0 md:hidden">
                  {STEPS.map((st,i)=>(
                    <div key={i} className="flex gap-4 items-stretch sti" onMouseEnter={()=>sfx.tick(350+i*100,.06,.07)}>
                      <div className="flex flex-col items-center">
                        <div className="rounded-2xl p-2.5 stic" style={{background:st.bg,color:st.color}}>{st.icon}</div>
                        {i<STEPS.length-1&&<div className="w-0.5 flex-1 min-h-[18px] my-1" style={{background:st.color+'30'}}/>}
                      </div>
                      <div className="pb-4 pt-0.5 flex-1"><p className="font-black text-slate-700 text-sm">{st.title}</p><p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{st.desc}</p></div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:flex items-start gap-0">
                  {STEPS.map((st,i)=>(
                    <div key={i} className="flex-1 flex flex-col items-center text-center px-2 sti group cursor-default" onMouseEnter={()=>sfx.tick(350+i*100,.06,.07)}>
                      <div className="relative w-full flex justify-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg stic" style={{background:st.bg,color:st.color}}>{st.icon}</div>
                        {i<STEPS.length-1&&<div className="absolute top-7 left-[60%] right-0 h-0.5" style={{background:`linear-gradient(to right,${st.color}50,${STEPS[i+1].color}40)`}}/>}
                      </div>
                      <p className="font-black text-slate-700 text-xs mt-3 leading-snug">{st.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter */}
              <div className="p-6 md:p-8 bg-slate-50/60 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <SearchOutlined className="text-lg text-sky-500 bg-sky-50 p-2 rounded-xl"/>
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">ค้นหาคลังโครงงาน</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ค้นหา</label>
                    <Input size="large" placeholder="ชื่อโครงงาน, นักศึกษา..." value={s} onChange={e=>{sfx.tick(700,.03,.05);setS(e.target.value);}} className="rounded-xl sinp" allowClear/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ปีการศึกษา</label>
                    <Select size="large" className="w-full" placeholder="ทุกปี" value={fy} onChange={v=>{sfx.pop();setFy(v);}} allowClear>
                      {uY.map(y=><Option key={y} value={y}>{y}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">หมวดหมู่</label>
                    <Select size="large" className="w-full" placeholder="ทุกหมวด" value={fc} onChange={v=>{sfx.pop();setFc(v);}} allowClear>
                      {uC.map(c=><Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ที่ปรึกษา</label>
                    <Select size="large" className="w-full" placeholder="ทุกคน" value={fa} onChange={v=>{sfx.pop();setFa(v);}} allowClear>
                      {uA.map(a=><Option key={a} value={a}>{a}</Option>)}
                    </Select>
                  </div>
                  <div className="flex flex-col justify-between">
                    <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5"><TrophyFilled/> Hall of Fame</label>
                    <div className="flex items-center gap-3">
                      <Switch checked={ff} onChange={v=>{v?sfx.sparkle():sfx.tick();setFf(v);}} className={ff?'bg-purple-500':'bg-slate-300'}/>
                      <button onClick={clr} onMouseEnter={()=>sfx.tick(260,.04,.06)} className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">ล้างทั้งหมด</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ════ TABLE + INLINE PAGINATION ════ */}
              <div>
                {/* header */}
                <div className="px-6 md:px-8 pt-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProjectOutlined className="text-lg text-sky-500 bg-sky-50 p-2 rounded-xl"/>
                    <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">คลังโครงงานทั้งหมด</h2>
                    <span className="bg-sky-100 text-sky-600 text-xs font-black px-2.5 py-1 rounded-full cbdg">{filtered.length}</span>
                  </div>
                  {!loading && filtered.length > PAGE_SIZE && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                      หน้า <span className="text-sky-500 font-black mx-0.5">{tablePage}</span> / {Math.ceil(filtered.length / PAGE_SIZE)}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="py-24 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="ldr"/>
                      <p className="text-slate-400 font-bold text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Table
                      columns={cols}
                      dataSource={pagedData}
                      rowKey="project_id"
                      pagination={false}
                      rowClassName={r=>`epr cursor-pointer ${activeRow===r.project_id?'rfl':''}`}
                      onRow={r=>({onClick:()=>{sfx.thud();open(r);},onMouseEnter:()=>sfx.tick(560,.03,.05)})}
                      className="etbl"
                      locale={{emptyText:(
                        <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                          <span className="text-5xl" style={{animation:'floatA 3s ease-in-out infinite'}}>🔍</span>
                          <p className="font-bold text-base">ไม่มีโครงงานที่ตรงกับเงื่อนไข</p>
                          <button onClick={clr} className="px-5 py-2 bg-sky-50 text-sky-600 font-bold rounded-xl text-sm hover:bg-sky-100 transition-colors border border-sky-200">ล้างตัวกรอง</button>
                        </div>
                      )}}
                    />

                    {/* ─── Pagination แสดงใต้ตารางทันที ─── */}
                    <CustomPagination
                      current={tablePage}
                      total={filtered.length}
                      onChange={setTablePage}
                    />
                  </>
                )}
              </div>
            </div>

          </div>
        </Content>
      </Layout>

      {/* MODAL */}
      <Modal open={modal} onCancel={()=>{sfx.tick(380,.07);setModal(false);}} footer={null} width="min(760px,95vw)" centered styles={{body:{padding:0}}} className="emod">
        {sel&&(()=>{
          const sc=SS[sel.progress_status]||{bg:'#f1f5f9',text:'#64748b',dot:'#94a3b8'};
          const rows=[{e:'👤',l:'ผู้จัดทำ',v:sel.student_name||sel.creator_name||'ไม่ระบุ'},{e:'🧑‍🏫',l:'ที่ปรึกษา',v:sel.advisor||'—'},{e:'🗂',l:'หมวดหมู่',v:sel.category||'—'},{e:'📚',l:'ระดับชั้น',v:sel.project_level||'—'},{e:'📅',l:'ปีการศึกษา',v:sel.academic_year||'—'}];
          return(
            <div className="manim">
              <div className="mhero relative overflow-hidden p-7 md:p-9 rounded-t-2xl">
                <div className="mhbg"/>
                {sel.is_featured&&<div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-300 text-amber-900 font-black text-xs px-5 py-2 rounded-bl-2xl z-20 fbn"><TrophyFilled/> ผลงานยอดเยี่ยม</div>}
                <div className="relative z-10">
                  <h2 className="font-black text-white text-xl md:text-3xl leading-tight mb-2 drop-shadow">{sel.title_th}</h2>
                  <p className="text-sky-100 font-semibold text-sm">{sel.title_en||''}</p>
                </div>
              </div>
              <div className="p-6 md:p-8">
                {rows.map((r,i)=><div key={i} className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0 mrow" style={{animationDelay:(i*55+80)+'ms'}}><span className="text-xl w-7 text-center">{r.e}</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 shrink-0">{r.l}</span><span className="font-bold text-slate-800 text-sm">{r.v}</span></div>)}
                <div className="flex items-center gap-4 pt-4">
                  <span className="text-xl w-7 text-center">🚦</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 shrink-0">สถานะ</span>
                  <span className="inline-flex items-center gap-2 font-black text-sm px-4 py-2 rounded-2xl" style={{background:sc.bg,color:sc.text}}><span className="w-2.5 h-2.5 rounded-full" style={{background:sc.dot}}/>{sel.progress_status||'ไม่ระบุ'}</span>
                </div>
              </div>
              <div className="px-6 md:px-8 pb-7 flex justify-end">
                <MagBtn onClick={()=>{sfx.tick(380,.07);setModal(false);}} className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-lg">ปิดหน้าต่าง</MagBtn>
              </div>
            </div>
          );
        })()}
      </Modal>

      <style>{`
        :root{--sp:cubic-bezier(.34,1.56,.64,1);--out:cubic-bezier(.16,1,.3,1);}
        .mesh{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 80% 50% at 10% 0%,#bae6fd44,transparent),radial-gradient(ellipse 60% 60% at 90% 100%,#a7f3d044,transparent);}
        .cfwrap{position:fixed;inset:0;pointer-events:none;z-index:99998;overflow:hidden;}
        .cf{position:absolute;width:9px;height:9px;border-radius:2px;left:var(--cx);top:var(--cy);animation:cfFall var(--cd,1s) ease-in var(--cd,0s) both;transform:rotate(var(--cr,0deg));}
        @keyframes cfFall{0%{transform:translateY(0) rotate(var(--cr)) scale(1);opacity:1}100%{transform:translateY(110vh) rotate(calc(var(--cr) + 720deg)) scale(.4);opacity:0}}
        .io{opacity:0;transform:translateY(26px);transition:opacity .6s var(--out),transform .6s var(--out);}
        .io-in{opacity:1!important;transform:translateY(0)!important;}
        @keyframes hIn{from{opacity:0;transform:translateY(-20px) scale(.97)}to{opacity:1;transform:none}}
        .hsc{border:1px solid rgba(255,255,255,.85);box-shadow:0 20px 60px -10px rgba(14,165,233,.14);animation:hIn .75s var(--out) both;}
        @keyframes sA{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
        .stps{background:linear-gradient(to right,#0ea5e9,#14b8a6,#22c55e,#0ea5e9);background-size:300% 300%;animation:sA 5s ease infinite;}
        @keyframes avS{0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-5px) rotate(1.5deg)}70%{transform:translateY(-3px) rotate(-1deg)}}
        .avs{animation:avS 5s ease-in-out infinite;}
        @keyframes plsA{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.4}}
        .pls{animation:plsA 2s ease-in-out infinite;}
        @keyframes tIn{from{opacity:0;letter-spacing:.22em}to{opacity:1;letter-spacing:normal}}
        .ttls{animation:tIn .9s .15s var(--out) both;}
        @keyframes wv{0%,100%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(30deg)}}
        .wvt{animation:wv 4s ease-in-out infinite;}
        @keyframes scIn{from{opacity:0;transform:scale(.82) translateY(18px)}to{opacity:1;transform:none}}
        .sc-e{animation:scIn .55s var(--sp) both;transition:transform .22s var(--sp),box-shadow .22s ease;}
        .sc-e:hover{transform:translateY(-7px) scale(1.025);box-shadow:0 20px 40px -10px var(--c,rgba(14,165,233,.3));}
        .sc-e:active{transform:scale(.96);}
        .sc-sh{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.22),transparent 60%);pointer-events:none;opacity:0;transition:opacity .3s;}
        .sc-e:hover .sc-sh{opacity:1;}
        .sc-ic{transition:transform .3s var(--sp);}
        .sc-e:hover .sc-ic{transform:rotate(-12deg) scale(1.22);}
        @keyframes orbP{0%,100%{transform:scale(1)}50%{transform:scale(1.45)}}
        .sc-orb{width:44px;height:44px;border-radius:50%;position:absolute;right:14px;bottom:14px;opacity:.3;animation:orbP 3.2s ease-in-out infinite;}
        @keyframes burst{0%{transform:rotate(var(--a,0deg)) translateX(0) scale(1);opacity:1}100%{transform:rotate(var(--a,0deg)) translateX(44px) scale(0);opacity:0}}
        .pdot{animation:burst .6s var(--out) both;transform-origin:center;}
        .cyf-wrap{display:flex;align-items:center;gap:5px;flex-shrink:0;}
        .cyf-icon{color:#0ea5e9;font-size:12px;}
        .cyf-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
        .cyf-select .ant-select-selector{border-radius:10px!important;border-color:#bae6fd!important;background:#f0f9ff!important;font-size:12px!important;}
        .cyf-select .ant-select-selector:hover{border-color:#0ea5e9!important;}
        .cyf-select.ant-select-focused .ant-select-selector{border-color:#0ea5e9!important;box-shadow:0 0 0 2px rgba(14,165,233,.2)!important;}
        .cyf-select .ant-select-selection-item{color:#0369a1!important;font-weight:800!important;}
        .cyf-select .ant-select-arrow{color:#0ea5e9!important;}
        .charts-grid{display:grid;grid-template-columns:1fr;gap:20px;padding:20px 24px 24px;}
        @media(min-width:1024px){.charts-grid{grid-template-columns:1fr 1fr;}}
        .chart-card{border-radius:18px;background:#f8fafc;padding:18px 20px;border:1px solid #e0f2fe;transition:all .3s;}
        .chart-card:hover{box-shadow:0 10px 30px -10px rgba(14,165,233,.18);border-color:#bae6fd;}
        .chart-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:4px;}
        .chart-title{font-family:inherit;font-weight:800;color:#0c4a6e;font-size:14px;margin:0 0 2px;}
        .chart-sub{font-size:11px;color:#94a3b8;margin:0 0 8px;}
        .no-data{color:#94a3b8;font-size:13px;padding:40px 0;}
        .yr-tag{display:inline-flex;align-items:center;gap:5px;background:#e0f2fe;color:#0369a1;border:1.5px solid #bae6fd;font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;margin-bottom:10px;}
        .all-yrs-badge{display:inline-flex;align-items:center;background:#f0fdf4;color:#15803d;border:1.5px solid #22c55e33;font-size:10px;font-weight:800;padding:4px 10px;border-radius:50px;white-space:nowrap;align-self:flex-start;margin-top:2px;}
        .adv-chart-card{grid-column:1/-1;}
        .adv-meta-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;}
        .adv-count-badge{font-size:11px;font-weight:700;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;padding:3px 10px;border-radius:50px;}
        .adv-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin-bottom:12px;padding:10px 14px;background:#fff;border-radius:12px;border:1px solid #e0f2fe;}
        .adv-legend-item{display:flex;align-items:center;gap:6px;}
        .adv-legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
        .adv-legend-label{font-size:11px;font-weight:700;color:#475569;}
        .sti{transition:all .2s ease;}
        .stic{transition:transform .28s var(--sp);}
        .sti:hover .stic{transform:scale(1.18) rotate(-8deg);}
        @keyframes blbF{0%,100%{opacity:1}45%{opacity:.5}80%{opacity:.85}}
        .blb{animation:blbF 3.5s ease-in-out infinite;}
        .sinp:focus-within{box-shadow:0 0 0 3px rgba(14,165,233,.18)!important;}
        .etbl .ant-table{background:transparent!important;}
        .etbl .ant-table-thead>tr>th{background:#f0f9ff!important;font-size:11px!important;padding:13px 16px!important;color:#64748b!important;border-bottom:1px solid #bae6fd!important;font-weight:900!important;letter-spacing:.05em;}
        .etbl .ant-table-tbody>tr>td{padding:13px 16px!important;border-bottom:1px solid #f0f9ff!important;transition:background .15s;}
        .epr{transition:all .2s;}
        .epr:hover>td{background:#e0f2fe!important;}
        .epr:hover{box-shadow:inset 4px 0 0 #0ea5e9;}
        .epr:active{transform:scale(.999);}
        @keyframes rflA{0%{background:#bae6fd}100%{background:transparent}}
        .rfl>td{animation:rflA .5s ease forwards!important;}
        .dbt{position:relative;overflow:hidden;background:#e0f2fe;color:#0369a1;font-weight:700;font-size:11px;padding:6px 13px;border-radius:12px;border:1.5px solid #bae6fd;transition:all .18s var(--sp);cursor:pointer;}
        .dbt:hover{background:#0ea5e9;color:#fff;transform:translateY(-2px) scale(1.06);box-shadow:0 8px 20px -5px rgba(14,165,233,.4);}
        .dbt:active{transform:scale(.95);}
        @keyframes sdP{0%,100%{opacity:1}50%{opacity:.35}}
        .sdot{animation:sdP 2.2s ease-in-out infinite;}
        @keyframes fbP{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px rgba(251,191,36,.25)}}
        .fba{animation:fbP 2.5s ease-in-out infinite;}
        @keyframes cbP{0%{transform:scale(1.5)}100%{transform:scale(1)}}
        .cbdg{animation:cbP .35s var(--sp) both;}

        /* ═══════════════════════════════════════
           CUSTOM PAGINATION STYLES
        ═══════════════════════════════════════ */
        .cpg-root{
          position:relative;
          display:flex;align-items:center;justify-content:space-between;
          flex-wrap:wrap;gap:14px;
          padding:16px 24px 20px;
          background:linear-gradient(135deg,#f0f9ff 0%,#f8fafc 40%,#ecfdf5 100%);
          border-top:1px solid #e0f2fe;
          overflow:hidden;
        }
        /* shimmering top accent */
        .cpg-accent{
          position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,#0ea5e9,#14b8a6,#22c55e,#0ea5e9);
          background-size:200% 100%;
          animation:cpgShimmer 3s linear infinite;
        }
        @keyframes cpgShimmer{0%{background-position:0 0}100%{background-position:200% 0}}
        /* left info */
        .cpg-left{display:flex;flex-direction:column;gap:2px;}
        .cpg-badge{
          display:inline-flex;align-items:center;gap:5px;
          font-size:13px;font-weight:900;color:#0369a1;
          background:linear-gradient(135deg,#e0f2fe,#f0fdf4);
          border:1.5px solid #bae6fd;
          padding:4px 12px;border-radius:50px;
          box-shadow:0 2px 8px rgba(14,165,233,.15);
        }
        .cpg-of{font-size:11px;font-weight:700;color:#64748b;}
        .cpg-sub{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;padding-left:2px;}
        /* center controls */
        .cpg-center{display:flex;align-items:center;gap:5px;}
        .cpg-arrow{
          width:38px;height:38px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          border:2px solid #bae6fd;background:white;
          color:#0369a1;font-size:13px;
          cursor:pointer;outline:none;
          transition:all .22s cubic-bezier(.34,1.56,.64,1);
        }
        .cpg-on:hover{
          background:#0ea5e9;color:white;border-color:#0ea5e9;
          transform:translateY(-4px) scale(1.14);
          box-shadow:0 10px 26px -4px rgba(14,165,233,.5);
        }
        .cpg-on:active{transform:scale(.9);}
        .cpg-off{opacity:.25;cursor:not-allowed;}
        .cpg-nums{display:flex;align-items:center;gap:4px;}
        .cpg-num{
          min-width:38px;height:38px;padding:0 6px;
          border-radius:12px;border:2px solid #e0f2fe;
          background:white;color:#475569;
          font-size:12px;font-weight:900;
          cursor:pointer;outline:none;
          display:flex;align-items:center;justify-content:center;
          transition:all .22s cubic-bezier(.34,1.56,.64,1);
        }
        .cpg-num-idle:hover{
          background:#e0f2fe;color:#0369a1;border-color:#7dd3fc;
          transform:translateY(-4px) scale(1.1);
          box-shadow:0 8px 18px -4px rgba(14,165,233,.3);
        }
        .cpg-num-idle:active{transform:scale(.9);}
        .cpg-num-active{
          background:linear-gradient(135deg,#0ea5e9,#0369a1) !important;
          color:white !important;border-color:transparent !important;
          box-shadow:0 10px 28px -4px rgba(14,165,233,.6) !important;
          transform:scale(1.1) !important;
        }
        .cpg-dots-mid{
          min-width:28px;height:38px;display:flex;align-items:center;
          justify-content:center;font-size:10px;font-weight:900;
          color:#94a3b8;letter-spacing:.15em;user-select:none;
        }
        /* right dot strip */
        .cpg-strip{
          display:flex;align-items:center;gap:6px;
          padding:8px 16px;background:white;
          border:2px solid #e0f2fe;border-radius:50px;
          box-shadow:0 2px 8px rgba(14,165,233,.08);
        }
        .cpg-dot{
          width:8px;height:8px;border-radius:50%;
          background:#bae6fd;border:none;cursor:pointer;padding:0;
          outline:none;transition:all .25s cubic-bezier(.34,1.56,.64,1);
        }
        .cpg-dot:hover{background:#7dd3fc;transform:scale(1.6);}
        .cpg-dot-active{
          background:linear-gradient(135deg,#0ea5e9,#14b8a6) !important;
          width:22px !important;border-radius:5px !important;
          box-shadow:0 3px 12px rgba(14,165,233,.55);
        }
        @media(max-width:640px){
          .cpg-strip{display:none;}
          .cpg-root{padding:12px 16px 16px;gap:10px;}
        }

        @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ldr{width:46px;height:46px;border-radius:50%;border:4px solid #bae6fd;border-top-color:#0ea5e9;animation:spin .75s linear infinite;}
        @keyframes nfIn{from{transform:translateX(100%) scale(.92)}to{transform:translateX(0) scale(1)}}
        .notifs{animation:nfIn .38s var(--sp) both;}
        @keyframes blbB{0%,100%{transform:scale(1)}40%{transform:scale(1.45);filter:drop-shadow(0 0 6px #fbbf24)}}
        .blbn{animation:blbB 1.2s ease-in-out infinite;}
        .emod .ant-modal-content{border-radius:22px!important;overflow:hidden;padding:0;box-shadow:0 40px 80px -20px rgba(0,0,0,.2);}
        .emod .ant-modal-close{top:12px;right:12px;transition:transform .2s,color .2s;}
        .emod .ant-modal-close:hover{color:#ef4444;transform:rotate(90deg) scale(1.2);}
        @keyframes mIn{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:none}}
        .manim{animation:mIn .38s var(--sp) both;}
        .mhero{background:linear-gradient(135deg,#0c4a6e,#0369a1 45%,#0d9488);min-height:130px;display:flex;align-items:flex-end;}
        .mhbg{position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 10px);}
        @keyframes mR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .mrow{animation:mR .32s var(--out) both;}
        @keyframes fBn{from{transform:translateX(35px)}to{transform:none}}
        .fbn{animation:fBn .38s .18s var(--sp) both;}
        .cs::-webkit-scrollbar{width:7px;}
        .cs::-webkit-scrollbar-track{background:#f0f9ff;}
        .cs::-webkit-scrollbar-thumb{background:#7dd3fc;border-radius:99px;border:2px solid #f0f9ff;}
        .cs::-webkit-scrollbar-thumb:hover{background:#0ea5e9;}
        .recharts-surface{overflow:visible!important;}
        @media(max-width:640px){.charts-grid{padding:14px 16px;gap:14px;}.chart-card-head{flex-direction:column;align-items:flex-start;}}
      `}</style>
    </Layout>
  );
};
export default StudentDashboard;