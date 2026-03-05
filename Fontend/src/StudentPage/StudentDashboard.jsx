import React, { useState, useEffect, useRef } from 'react';
import { Layout, Table, Tag, Avatar, Input, Select, Switch, Modal, Spin, message, notification } from 'antd';
import { ProjectOutlined, RocketOutlined, CodeOutlined, UserOutlined, SearchOutlined, ReloadOutlined, TrophyFilled, BulbOutlined, TeamOutlined, FormOutlined, ToolOutlined, FundProjectionScreenOutlined, BookOutlined } from '@ant-design/icons';
import { getAllProjects } from '../services/projectService';
import { userService } from '../services/userService';
import StudentSidebar from '../StudentPage/Studentbar';
const { Content } = Layout;
const { Option } = Select;

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

const Burst=({active,x,y,color})=>!active?null:(
  <div className="pointer-events-none fixed z-[9999]" style={{left:x,top:y}}>
    {Array.from({length:14}).map((_,i)=>(
      <div key={i} style={{position:'absolute',width:6,height:6,borderRadius:'50%',background:color,animation:`burst .6s cubic-bezier(.16,1,.3,1) ${i*12}ms both`,transform:`rotate(${i*(360/14)}deg) translateX(0)`}} className="pdot"/>
    ))}
  </div>
);

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

const MagBtn=({children,onClick,className='',style={}})=>{
  const r=useRef();
  return(<button ref={r} onMouseMove={e=>{const b=r.current.getBoundingClientRect();const x=(e.clientX-b.left-b.width/2)*.22,y=(e.clientY-b.top-b.height/2)*.22;r.current.style.transform=`translate(${x}px,${y}px) scale(1.04)`;}} onMouseLeave={()=>{r.current.style.transform='translate(0,0) scale(1)';}} onClick={onClick} className={className} style={{transition:'transform .18s cubic-bezier(.34,1.56,.64,1)',...style}}>{children}</button>);
};

const StatCard=({title,value,icon,color,bg,delay=0})=>{
  const count=useCounter(value);
  const[burst,setBurst]=useState({active:false,x:0,y:0});
  const ref=useRef();
  const onH=()=>{sfx.sparkle();const r=ref.current.getBoundingClientRect();setBurst({active:true,x:r.left+r.width/2,y:r.top+r.height/2});setTimeout(()=>setBurst(b=>({...b,active:false})),700);};
  return(<><Burst {...burst} color={color}/><div ref={ref} onMouseEnter={onH} className="sc-e relative overflow-hidden rounded-2xl border bg-white cursor-pointer select-none" style={{borderColor:color+'40',animationDelay:delay+'ms','--c':color}}><div className="sc-sh"/><div className="relative z-10 p-5 md:p-6"><div className="flex items-center justify-between mb-3"><div className="rounded-xl p-3 text-2xl sc-ic" style={{background:bg,color}}>{icon}</div><div className="sc-orb" style={{background:color+'20'}}/></div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-[.15em] mb-1">{title}</p><p className="text-4xl md:text-5xl font-black tabular-nums" style={{color}}>{count.toLocaleString()}</p></div></div></>);
};

const SS={
  'สมบูรณ์':{bg:'#dcfce7',text:'#15803d',dot:'#22c55e'},
  'กำลังทำ':{bg:'#dbeafe',text:'#1d4ed8',dot:'#3b82f6'},
  'รออนุมัติหัวข้อ':{bg:'#fef9c3',text:'#a16207',dot:'#eab308'},
  'รออนุมัติเล่ม':{bg:'#fef9c3',text:'#a16207',dot:'#eab308'},
  'ล่าช้า':{bg:'#fee2e2',text:'#b91c1c',dot:'#ef4444'},
  'ไม่ผ่าน':{bg:'#fee2e2',text:'#b91c1c',dot:'#ef4444'},
};
const STEPS=[
  {icon:<TeamOutlined/>,color:'#0ea5e9',bg:'#e0f2fe',title:'1. คิดหัวข้อ & รวมกลุ่ม',desc:'รวมกลุ่มเพื่อน คิดไอเดีย หาข้อมูล'},
  {icon:<FormOutlined/>,color:'#f59e0b',bg:'#fffbeb',title:'2. เสนอหัวข้อโครงงาน',desc:'ยื่นเสนอผ่านระบบ รอรับการอนุมัติ'},
  {icon:<ToolOutlined/>,color:'#10b981',bg:'#f0fdf4',title:'3. พัฒนา & รายงาน 50%',desc:'ลงมือพัฒนา รายงานความคืบหน้า'},
  {icon:<FundProjectionScreenOutlined/>,color:'#8b5cf6',bg:'#faf5ff',title:'4. สอบป้องกัน 100%',desc:'นำเสนอต่อคณะกรรมการ'},
  {icon:<BookOutlined/>,color:'#ec4899',bg:'#fdf2f8',title:'5. ส่งเล่ม & เผยแพร่',desc:'ส่งเอกสาร เผยแพร่ผลงาน'},
];
const getAU=f=>{if(!f||f==='null'||f==='undefined')return null;if(f.startsWith('http'))return f;const b=(import.meta.env.VITE_API_BASE_URL||'https://reg.utc.ac.th').replace(/\/api\/?$/,'').replace(/\/$/,'');const c=f.startsWith('/')?f.slice(1):f;return c.includes('..')?null:`${b}/uploads/profiles/${c}`;};

export const StudentDashboard=()=>{
  const[user,setUser]=useState({full_name:'กำลังโหลด...',profile_img:null});
  const[raw,setRaw]=useState([]);
  const[filtered,setFiltered]=useState([]);
  const[loading,setLoading]=useState(true);
  const[refreshing,setRefreshing]=useState(false);
  const[ready,setReady]=useState(false);
  const[activeRow,setActiveRow]=useState(null);
  const[confetti,setConfetti]=useState(false);
  const[api,ctx]=notification.useNotification();
  const prev=useRef(null);
  const[s,setS]=useState('');
  const[fy,setFy]=useState(null);
  const[fc,setFc]=useState(null);
  const[fa,setFa]=useState(null);
  const[ff,setFf]=useState(false);
  const[modal,setModal]=useState(false);
  const[sel,setSel]=useState(null);

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
    let mx=0,my=0;
    const mv=e=>{mx=e.clientX;my=e.clientY;};
    document.addEventListener('mousemove',mv);
    let pr=dots.map(()=>({x:0,y:0}));
    let af;const tick=()=>{pr[0]={x:mx,y:my};for(let i=1;i<MAX;i++){pr[i].x+=(pr[i-1].x-pr[i].x)*.35;pr[i].y+=(pr[i-1].y-pr[i].y)*.35;}dots.forEach((d,i)=>{d.el.style.transform=`translate(${pr[i].x-2.5}px,${pr[i].y-2.5}px)`;});af=requestAnimationFrame(tick);};af=requestAnimationFrame(tick);
    return()=>{document.removeEventListener('mousemove',mv);cancelAnimationFrame(af);dots.forEach(d=>d.el.remove());};
  },[]);

  useEffect(()=>{
    (async()=>{
      const raw=localStorage.getItem('user')||sessionStorage.getItem('user');if(!raw)return;
      try{const p=JSON.parse(raw);setUser(p);const uid=p.id||p.userId;if(uid&&userService?.getProfile){const r=await userService.getProfile(uid);const d=r.data?.data||r.data;if(d){setUser(u=>({...u,...d,full_name:d.full_name||d.username||u.full_name}));localStorage.setItem('user',JSON.stringify(d));}}}catch(e){console.error(e);}
    })();
    fetch(true);
    const id=setInterval(()=>fetch(false),30000);
    return()=>clearInterval(id);
  },[]);

  const fetch=async(show=true)=>{
    if(show){setLoading(true);sfx.sweep();}setRefreshing(true);
    try{
      const r=await getAllProjects();let data=[];
      if(Array.isArray(r))data=r;else if(r&&Array.isArray(r.data))data=r.data;else if(r?.data&&Array.isArray(r.data.data))data=r.data.data;
      if(!data.length){setRaw([]);setFiltered([]);return;}
      const srt=[...data].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      if(prev.current!==null&&srt.length>prev.current){
        const n=srt.length-prev.current;sfx.bell();setConfetti(true);setTimeout(()=>setConfetti(false),2200);
        const k=`n_${Date.now()}`;
        api.info({key:k,message:<span className="font-black text-sky-700 text-base">มีผลงานใหม่เข้าสู่ระบบ! 🎉</span>,description:<span className="text-slate-600 text-sm">อัปโหลดโครงงานใหม่ <b className="text-sky-600">{n} รายการ</b></span>,placement:'topRight',duration:0,icon:<BulbOutlined className="text-yellow-500 blbn"/>,className:'notifs cursor-pointer',style:{borderRadius:18,border:'2px solid #0ea5e9',background:'linear-gradient(135deg,#fff,#f0f9ff)',boxShadow:'0 20px 40px -10px rgba(14,165,233,.28)'},onClick:()=>{sfx.chime();api.destroy(k);}});
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

  const clr=()=>{sfx.sweep();setS('');setFy(null);setFc(null);setFa(null);setFf(false);};
  const open=rec=>{sfx.whoosh();setSel(rec);setActiveRow(rec.project_id);setTimeout(()=>setActiveRow(null),600);setModal(true);};

  const total=filtered.length,pend=filtered.filter(p=>p.progress_status?.includes('รอ')).length,comp=filtered.filter(p=>p.progress_status==='สมบูรณ์').length,feat=filtered.filter(p=>p.is_featured===1||p.is_featured===true).length;
  const uY=[...new Set(raw.map(p=>p.academic_year).filter(Boolean))].sort((a,b)=>b-a);
  const uC=[...new Set(raw.map(p=>p.category).filter(Boolean))];
  const uA=[...new Set(raw.map(p=>p.advisor).filter(Boolean))];

  const cols=[
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ชื่อโครงงาน</span>,dataIndex:'title_th',key:'tt',width:'32%',render:(t,r)=>(<div><p className="font-black text-slate-800 text-sm leading-snug mb-1">{t}</p><p className="text-xs text-slate-400">{"👤 "}{r.student_name||r.creator_name||'ไม่ระบุ'}</p>{r.is_featured&&<span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full fba"><TrophyFilled className="text-amber-400"/> ยอดเยี่ยม</span>}</div>)},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ปีการศึกษา</span>,dataIndex:'academic_year',key:'yr',align:'center',width:'10%',render:t=><span className="font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl text-sm">{t||'-'}</span>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">ที่ปรึกษา</span>,dataIndex:'advisor',key:'adv',width:'16%',render:t=>t?<span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-full font-semibold"><UserOutlined className="text-sky-400"/>{t}</span>:<span className="text-slate-300">—</span>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">หมวดหมู่</span>,dataIndex:'category',key:'cat',width:'14%',render:t=><Tag color="cyan" className="text-xs px-2.5 py-1 border-0 rounded-full font-bold">{t||'—'}</Tag>},
    {title:<span className="font-black text-slate-500 text-xs tracking-widest">สถานะ</span>,dataIndex:'progress_status',key:'st',width:'16%',render:st=>{const sc=SS[st]||{bg:'#f1f5f9',text:'#64748b',dot:'#94a3b8'};return<span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{background:sc.bg,color:sc.text}}><span className="w-2 h-2 rounded-full sdot" style={{background:sc.dot}}/>{st||'ไม่ระบุ'}</span>;}},
    {title:'',key:'ac',align:'center',width:'12%',render:(_,r)=><button onClick={e=>{e.stopPropagation();sfx.pop();open(r);}} onMouseEnter={()=>sfx.tick(700,.04,.07)} className="dbt">ดูรายละเอียด</button>},
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
                <MagBtn onClick={()=>{sfx.sweep();fetch(true);}} className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg text-sm transition-all">
                  <ReloadOutlined className={refreshing?'animate-spin':''}/>รีเฟรชข้อมูล
                </MagBtn>
              </div>
            </div>

            <div className="io grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="โครงงานทั้งหมด" value={total} icon={<ProjectOutlined/>} color="#0ea5e9" bg="#e0f2fe" delay={0}/>
              <StatCard title="กำลังดำเนินการ" value={pend} icon={<CodeOutlined/>} color="#f59e0b" bg="#fffbeb" delay={80}/>
              <StatCard title="เสร็จสมบูรณ์" value={comp} icon={<RocketOutlined/>} color="#10b981" bg="#f0fdf4" delay={160}/>
              <StatCard title="Hall of Fame" value={feat} icon={<TrophyFilled/>} color="#8b5cf6" bg="#faf5ff" delay={240}/>
            </div>

            <div className="io bg-white/95 backdrop-blur-sm rounded-3xl shadow-md border border-white/80 overflow-hidden">
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
                    <Select size="large" className="w-full" placeholder="ทุกปี" value={fy} onChange={v=>{sfx.pop();setFy(v);}} allowClear>{uY.map(y=><Option key={y} value={y}>{y}</Option>)}</Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">หมวดหมู่</label>
                    <Select size="large" className="w-full" placeholder="ทุกหมวด" value={fc} onChange={v=>{sfx.pop();setFc(v);}} allowClear>{uC.map(c=><Option key={c} value={c}>{c}</Option>)}</Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ที่ปรึกษา</label>
                    <Select size="large" className="w-full" placeholder="ทุกคน" value={fa} onChange={v=>{sfx.pop();setFa(v);}} allowClear>{uA.map(a=><Option key={a} value={a}>{a}</Option>)}</Select>
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

              <div>
                <div className="px-6 md:px-8 pt-6 pb-2 flex items-center gap-3">
                  <ProjectOutlined className="text-lg text-sky-500 bg-sky-50 p-2 rounded-xl"/>
                  <h2 className="font-black text-slate-700 text-lg md:text-xl m-0">คลังโครงงานทั้งหมด</h2>
                  <span className="bg-sky-100 text-sky-600 text-xs font-black px-2.5 py-1 rounded-full cbdg">{filtered.length}</span>
                </div>
                {loading?(
                  <div className="py-24 text-center"><div className="inline-flex flex-col items-center gap-4"><div className="ldr"/><p className="text-slate-400 font-bold text-sm animate-pulse">กำลังโหลดข้อมูล...</p></div></div>
                ):(
                  <Table columns={cols} dataSource={filtered} rowKey="project_id"
                    pagination={{pageSize:10,showSizeChanger:false,className:'px-6 md:px-8 pb-6'}}
                    rowClassName={r=>`epr cursor-pointer ${activeRow===r.project_id?'rfl':''}`}
                    onRow={r=>({onClick:()=>{sfx.thud();open(r);},onMouseEnter:()=>sfx.tick(560,.03,.05)})}
                    className="etbl"/>
                )}
              </div>
            </div>
          </div>
        </Content>
      </Layout>

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
        .sti{transition:all .2s ease;}
        .stic{transition:transform .28s var(--sp);}
        .sti:hover .stic{transform:scale(1.18) rotate(-8deg);}
        @keyframes blbF{0%,100%{opacity:1}45%{opacity:.5}80%{opacity:.85}}
        .blb{animation:blbF 3.5s ease-in-out infinite;}
        .sinp:focus-within{box-shadow:0 0 0 3px rgba(14,165,233,.18)!important;}
        .etbl .ant-table{background:transparent!important;}
        .etbl .ant-table-thead > tr > th{background:#f0f9ff!important;font-size:11px!important;padding:13px 16px!important;color:#64748b!important;border-bottom:1px solid #bae6fd!important;font-weight:900!important;letter-spacing:.05em;}
        .etbl .ant-table-tbody > tr > td{padding:13px 16px!important;border-bottom:1px solid #f0f9ff!important;transition:background .15s;}
        .epr{transition:all .2s;}
        .epr:hover > td{background:#e0f2fe!important;}
        .epr:hover{box-shadow:inset 4px 0 0 #0ea5e9;}
        .epr:active{transform:scale(.999);}
        @keyframes rflA{0%{background:#bae6fd}100%{background:transparent}}
        .rfl > td{animation:rflA .5s ease forwards!important;}
        .dbt{position:relative;overflow:hidden;background:#e0f2fe;color:#0369a1;font-weight:700;font-size:11px;padding:6px 13px;border-radius:12px;border:1.5px solid #bae6fd;transition:all .18s var(--sp);cursor:pointer;}
        .dbt:hover{background:#0ea5e9;color:#fff;transform:translateY(-2px) scale(1.06);box-shadow:0 8px 20px -5px rgba(14,165,233,.4);}
        .dbt:active{transform:scale(.95);}
        @keyframes sdP{0%,100%{opacity:1}50%{opacity:.35}}
        .sdot{animation:sdP 2.2s ease-in-out infinite;}
        @keyframes fbP{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px rgba(251,191,36,.25)}}
        .fba{animation:fbP 2.5s ease-in-out infinite;}
        @keyframes cbP{0%{transform:scale(1.5)}100%{transform:scale(1)}}
        .cbdg{animation:cbP .35s var(--sp) both;}
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
        .ant-pagination-item{border-radius:10px!important;font-weight:700!important;transition:all .15s;}
        .ant-pagination-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(14,165,233,.28);}
        .ant-pagination-item-active{background:#0ea5e9!important;border-color:#0ea5e9!important;}
        .ant-pagination-item-active a{color:#fff!important;}
      `}</style>
    </Layout>
  );
};
export default StudentDashboard;