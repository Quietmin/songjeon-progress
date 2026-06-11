/* 송전선로 공사 공정관리 — 정적 웹앱 (localStorage 기반) */
"use strict";

/* ===== 기준 데이터 ===== */
const CHAIN = 20; // 체인 NO. 간격(m)
const TOTAL = 3448; // 전체 연장(m)
const OPENCUT_TOTAL = 3221; // 개착식 7단계 적용 총 연장(m)

const SECTIONS = [
  { id:1, name:"1구간", region:"수원", start:0,    end:320,  openLen:320 },
  { id:2, name:"2구간", region:"수원", start:320,  end:740,  openLen:420 },
  { id:3, name:"3구간", region:"수원", start:740,  end:1620, openLen:880 },
  { id:4, name:"4구간", region:"수원", start:1620, end:2320, openLen:700 },
  { id:5, name:"5구간", region:"용인", start:2320, end:2983, openLen:663 },
  { id:6, name:"6구간", region:"용인", start:2983, end:3232, openLen:22, mixed:true },
  { id:7, name:"7구간", region:"용인", start:3232, end:3448, openLen:216 },
];

const STAGES = ["터파기","ELP관 매설","차폐판 설치","되메우기","표층 메우기","가포장","본포장"];
const JACKING = [
  { key:"steel",        name:"강관압입",   total:48  },
  { key:"directional",  name:"지향성압입", total:179 },
];
const JACKING_TOTAL = 227;

/* 단계별 색(완료=초록 → 미착수 직전=옅은 초록). DESIGN.md 기반 */
const STAGE_COLORS = ["#cfe8d6","#a9d8b4","#84c896","#5db877","#3aa75e","#1f8f46","#006e25"];
const C_GREEN="#006e25", C_GOLD="#fabd00", C_GRAY="#d2dbe4", C_ORANGE="#FD7E14", C_NAVY="#002a5c";
const REGION_COLORS = { "수원":"#002a5c", "용인":"#006e25" };

/* ===== 상태 ===== */
const LS_KEY = "songjeon_v1";
let STATE = loadState();
let scaleMode = "ratio";  // ratio | real
let routeColorMode = "stage";
let calibrating = false;

function blankState(){ return { entries:[], jacking:[], route:{ image:null, points:[] } }; }
function loadState(){
  try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if(s && s.entries) { s.route = s.route||{image:null,points:[]}; s.jacking = s.jacking||[]; return s; } }
  catch(e){}
  return blankState();
}
function saveState(){ localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }

/* ===== 위치/구간 헬퍼 ===== */
const posOf = (no, m) => (Number(no)||0)*CHAIN + (Number(m)||0);
function chainLabel(pos){
  const no = Math.floor(pos/CHAIN); const m = Math.round((pos - no*CHAIN)*10)/10;
  return m ? `NO.${no}+${m}` : `NO.${no}`;
}
function sectionAt(pos){
  for(const s of SECTIONS){ if(pos >= s.start && pos < s.end) return s; }
  return pos >= TOTAL ? SECTIONS[SECTIONS.length-1] : SECTIONS[0];
}

/* 구간 [start,end) 라벨 */
function sectionChainRange(s){ return `NO.${Math.floor(s.start/CHAIN)}~${(s.end/CHAIN).toFixed(s.end%CHAIN?1:0)}`; }

/* ===== 인터벌 유니온 ===== */
function unionIntervals(list){
  const iv = list.map(e=>[Math.min(e.startPos,e.endPos), Math.max(e.startPos,e.endPos)])
                 .filter(([a,b])=>b>a).sort((x,y)=>x[0]-y[0]);
  const out=[];
  for(const [a,b] of iv){
    if(out.length && a <= out[out.length-1][1]) out[out.length-1][1] = Math.max(out[out.length-1][1], b);
    else out.push([a,b]);
  }
  return out;
}
function unionLength(list){ return unionIntervals(list).reduce((t,[a,b])=>t+(b-a),0); }
function overlapLength(list, lo, hi){
  return unionIntervals(list).reduce((t,[a,b])=>t+Math.max(0, Math.min(b,hi)-Math.max(a,lo)),0);
}

/* 공정별 누적(개착식 전체) */
function stageDone(stageIdx){
  return Math.min(OPENCUT_TOTAL, unionLength(STATE.entries.filter(e=>e.stage===stageIdx)));
}
/* 구간 내 공정별 누적 */
function stageDoneInSection(stageIdx, sec){
  const raw = overlapLength(STATE.entries.filter(e=>e.stage===stageIdx), sec.start, sec.end);
  return Math.min(raw, sec.openLen);
}
/* 압입 누적 */
function jackingDone(key){
  const j = JACKING.find(x=>x.key===key);
  return Math.min(j.total, unionLength(STATE.jacking.filter(e=>e.method===key)));
}
function jackingDoneTotal(){ return JACKING.reduce((t,j)=>t+jackingDone(j.key),0); }

/* ===== 진행률 ===== */
function sectionComposite(sec){
  let sum=0; for(let s=0;s<7;s++) sum += stageDoneInSection(s,sec);
  return sec.openLen>0 ? (sum/7)/sec.openLen*100 : 0;
}
function regionComposite(region){
  const secs = SECTIONS.filter(s=>s.region===region);
  let sum=0, len=0;
  for(const sec of secs){ for(let s=0;s<7;s++) sum += stageDoneInSection(s,sec); len += sec.openLen; }
  let done = sum/7;
  let total = len;
  if(region==="용인"){ done += jackingDoneTotal(); total += JACKING_TOTAL; }
  return total>0 ? done/total*100 : 0;
}
function overallComposite(){
  let sum=0; for(let s=0;s<7;s++) sum += stageDone(s);
  const openComposite = (sum/7);
  return (openComposite + jackingDoneTotal()) / (OPENCUT_TOTAL + JACKING_TOTAL) * 100;
}
function bonpojangPct(){ return (stageDone(6) + jackingDoneTotal()) / TOTAL * 100; }

const fmt = n => Math.round(n).toLocaleString();
const pct1 = n => (Math.round(n*10)/10).toFixed(1);

/* ===================================================================== */
/* 렌더링                                                                 */
/* ===================================================================== */
function renderAll(){ renderDashboard(); renderSettings(); renderEntryLog(); drawRoute(); }

/* ---------- 대시보드 ---------- */
function renderDashboard(){
  const today = STATE.entries.filter(e=>e.date===todayStr()).reduce((t,e)=>t+Math.abs(e.endPos-e.startPos),0);
  document.getElementById("dash-subtitle").textContent =
    `기준일 ${todayStr()} · 본포장 ${fmt(stageDone(6)+jackingDoneTotal())}m / ${fmt(TOTAL)}m`;

  // KPI
  const kpis = [
    { lbl:"종합 진행률", val:pct1(overallComposite())+"%", sub:"가중(균등) · 전체 기준", accent:C_NAVY },
    { lbl:"본포장 완료", val:pct1(bonpojangPct())+"%", sub:`${fmt(stageDone(6)+jackingDoneTotal())}m / ${fmt(TOTAL)}m`, accent:C_GREEN },
    { lbl:"수원 (1~4구간)", val:pct1(regionComposite("수원"))+"%", sub:"2,320m", accent:C_NAVY },
    { lbl:"용인 (5~7구간)", val:pct1(regionComposite("용인"))+"%", sub:`1,128m · 압입 ${pct1(jackingDoneTotal()/JACKING_TOTAL*100)}%`, accent:C_GREEN },
  ];
  document.getElementById("kpi-row").innerHTML = kpis.map(k=>`
    <div class="bg-white border border-border-subtle rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1" style="background:${k.accent}"></div>
      <p class="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">${k.lbl}</p>
      <p class="font-headline text-3xl font-bold text-kpi-navy mt-1">${k.val}</p>
      <p class="text-[12px] text-on-surface-variant mt-0.5">${k.sub}</p>
    </div>`).join("");

  // 범례: 7단계 + 미착수
  document.getElementById("section-legend").innerHTML =
    STAGES.map((nm,i)=>`<span class="flex items-center gap-1"><i class="w-3 h-3 rounded-sm inline-block" style="background:${STAGE_COLORS[i]}"></i>${nm}</span>`).join("")
    + `<span class="flex items-center gap-1"><i class="w-3 h-3 rounded-sm inline-block" style="background:${C_GRAY}"></i>미착수</span>`;

  // 구간별 바 (7단계 계단식 스택)
  const maxLen = Math.max(...SECTIONS.map(s=>s.openLen));
  document.getElementById("section-bars").innerHTML = SECTIONS.map(sec=>{
    const comp = sectionComposite(sec);
    const len = sec.openLen;
    const cum = []; for(let i=0;i<7;i++) cum.push(stageDoneInSection(i,sec));
    const head = cum[0];
    // 본포장 → 가포장 → … → 터파기 → 미착수
    let segs = cum[6]>0 ? `<div style="width:${cum[6]/len*100}%;background:${STAGE_COLORS[6]}" class="h-full" title="본포장 ${fmt(cum[6])}m"></div>` : "";
    for(let i=5;i>=0;i--){ const w=Math.max(0,cum[i]-cum[i+1]); if(w>0)
      segs += `<div style="width:${w/len*100}%;background:${STAGE_COLORS[i]}" class="h-full" title="${STAGES[i]} 누적 ${fmt(cum[i])}m"></div>`; }
    segs += `<div style="flex:1 1 auto;background:${C_GRAY}" class="h-full"></div>`;
    const trackW = scaleMode==="real" ? (len/maxLen*100) : 100;
    const headChain = head>0 ? chainLabel(sec.start+head) : "-";
    const mixedTag = sec.mixed ? `<span class="text-[10px] text-outline ml-1">+압입</span>` : "";
    return `<div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-on-surface">${sec.name} <span class="font-mono text-[11px] text-outline">${sec.region} · ${fmt(len)}m</span>${mixedTag}</span>
        <span class="font-mono text-[12px] text-primary font-semibold">${pct1(comp)}% <span class="text-outline">· 선단 ${headChain}</span></span>
      </div>
      <div class="flex h-5 rounded-full overflow-hidden bg-surface-dim" style="width:${trackW}%">${segs}</div>
    </div>`;
  }).join("");

  // 공정별 누적
  document.getElementById("stage-totals").innerHTML = STAGES.map((nm,i)=>{
    const d=stageDone(i); const p=d/OPENCUT_TOTAL*100;
    return `<div class="flex items-center gap-3">
      <span class="text-[13px] w-24 shrink-0">${i+1}. ${nm}</span>
      <div class="flex-1 h-3.5 rounded-full bg-surface-gray overflow-hidden"><div class="h-full rounded-full" style="width:${p}%;background:${STAGE_COLORS[i]}"></div></div>
      <span class="font-mono text-[12px] text-on-surface-variant w-28 text-right">${fmt(d)}m · ${pct1(p)}%</span>
    </div>`;
  }).join("") + `
    <div class="flex items-center gap-3 pt-2 border-t border-border-subtle mt-2">
      <span class="text-[13px] w-24 shrink-0">압입(6구간)</span>
      <div class="flex-1 h-3.5 rounded-full bg-surface-gray overflow-hidden"><div class="h-full rounded-full" style="width:${jackingDoneTotal()/JACKING_TOTAL*100}%;background:${C_NAVY}"></div></div>
      <span class="font-mono text-[12px] text-on-surface-variant w-28 text-right">${fmt(jackingDoneTotal())}m / ${JACKING_TOTAL}m</span>
    </div>`;

  // 현재 작업
  const chips=[];
  SECTIONS.forEach(sec=>{
    const comp=sectionComposite(sec);
    if(comp>0.01 && comp<99.99){
      let active=0; for(let s=0;s<7;s++){ if(stageDoneInSection(s,sec)>0.01) active=s; }
      const head=stageDoneInSection(0,sec);
      chips.push(`<span class="inline-flex items-center gap-2 text-[13px] bg-surface-container-low border border-border-subtle rounded-full px-3 py-1.5">
        <i class="w-2.5 h-2.5 rounded-full" style="background:${C_GOLD}"></i>${sec.name} · ${STAGES[active]} · <span class="font-mono">${chainLabel(sec.start+head)}</span></span>`);
    }
  });
  JACKING.forEach(j=>{ const d=jackingDone(j.key); if(d>0 && d<j.total)
    chips.push(`<span class="inline-flex items-center gap-2 text-[13px] bg-surface-container-low border border-border-subtle rounded-full px-3 py-1.5">
      <i class="w-2.5 h-2.5 rounded-full" style="background:${C_NAVY}"></i>${j.name} · <span class="font-mono">${fmt(d)}/${j.total}m</span></span>`); });
  document.getElementById("current-work").innerHTML = chips.length ? chips.join("") :
    `<p class="text-[13px] text-on-surface-variant">진행 중인 작업이 없습니다. 일일 입력에서 공정을 기록하세요.</p>`;
}

/* ---------- 일일 입력 ---------- */
function buildInputForm(){
  const wrap = document.getElementById("stage-inputs");
  wrap.innerHTML = STAGES.map((nm,i)=>`
    <div class="bg-surface-container-lowest p-3 border border-border-subtle rounded-xl hover:border-primary transition-colors">
      <div class="flex items-center gap-2 mb-2">
        <span class="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">${i+1}</span>
        <h4 class="font-bold text-on-surface text-sm">${nm}</h4>
      </div>
      <div class="space-y-2">
        ${posRow("시작", `s${i}`)}
        ${posRow("종료", `e${i}`)}
      </div>
    </div>`).join("");

  document.getElementById("jacking-inputs").innerHTML = JACKING.map((j,idx)=>`
    <div class="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-border-subtle flex-wrap gap-2">
      <div class="flex items-center gap-3">
        <span class="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">${8+idx}</span>
        <h4 class="font-bold text-on-surface text-sm">${j.name} <span class="text-[10px] text-outline font-normal">/${j.total}m</span></h4>
      </div>
      <div class="flex gap-3 items-center">
        ${jackRow("시작",`js${j.key}`)} ${jackRow("종료",`je${j.key}`)}
      </div>
    </div>`).join("");

  wrap.querySelectorAll("input").forEach(i=>i.addEventListener("input", updateTodayTotal));
  document.getElementById("jacking-inputs").querySelectorAll("input").forEach(i=>i.addEventListener("input", updateTodayTotal));
}
function posRow(label, id){
  return `<div class="flex items-center justify-between gap-2">
    <span class="text-[10px] text-outline font-bold w-6">${label}</span>
    <div class="flex items-center gap-1">
      <span class="text-[9px] text-outline">NO.</span>
      <input data-k="${id}n" class="w-12 border border-border-subtle rounded p-1 text-xs focus:ring-1 focus:ring-primary" placeholder="0" type="number"/>
      <span class="text-[10px] text-outline">+</span>
      <input data-k="${id}m" class="w-10 border border-border-subtle rounded p-1 text-xs focus:ring-1 focus:ring-primary" placeholder="0" type="number"/>
      <span class="text-[10px] text-outline">m</span>
    </div></div>`;
}
function jackRow(label, id){
  return `<div class="flex items-center gap-1">
    <span class="text-[10px] text-outline font-bold">${label}</span>
    <input data-k="${id}" class="w-14 border border-border-subtle rounded p-1 text-xs" placeholder="0" type="number"/>
    <span class="text-[10px] text-outline">m</span></div>`;
}
const val = k => { const el=document.querySelector(`[data-k="${k}"]`); return el? (Number(el.value)||0):0; };

function collectEntries(){
  const date = document.getElementById("input-date").value || todayStr();
  const open=[], jack=[];
  for(let i=0;i<7;i++){
    const sp=posOf(val(`s${i}n`),val(`s${i}m`)), ep=posOf(val(`e${i}n`),val(`e${i}m`));
    if(ep>sp) open.push({ id:uid(), date, stage:i, startPos:sp, endPos:ep });
  }
  JACKING.forEach(j=>{
    const sp=val(`js${j.key}`), ep=val(`je${j.key}`);
    if(ep>sp) jack.push({ id:uid(), date, method:j.key, startPos:sp, endPos:ep });
  });
  return { open, jack };
}
function updateTodayTotal(){
  const { open, jack } = collectEntries();
  const t = open.reduce((a,e)=>a+(e.endPos-e.startPos),0) + jack.reduce((a,e)=>a+(e.endPos-e.startPos),0);
  document.getElementById("today-total").textContent = fmt(t);
  validateLive(open);
}
function validateLive(open){
  const status = document.getElementById("validation-status");
  const err = validate(open);
  if(err){ status.className="inline-flex items-center gap-1 text-on-error bg-error px-2 py-0.5 rounded text-xs font-semibold";
    status.innerHTML=`<span class="material-symbols-outlined text-[14px]">error</span> 오류`; status.title=err; }
  else { status.className="inline-flex items-center gap-1 text-secondary bg-secondary-container px-2 py-0.5 rounded text-xs font-semibold";
    status.innerHTML=`<span class="material-symbols-outlined text-[14px]">check_circle</span> 정상`; status.title=""; }
}
/* 검증: 범위 + 계단식(터파기≥ELP≥…≥본포장) */
function validate(open){
  for(const e of open){
    if(e.startPos<0 || e.endPos>TOTAL) return `${STAGES[e.stage]}: 위치가 0~${TOTAL}m 범위를 벗어났습니다.`;
  }
  const tmp = STATE.entries.concat(open);
  const done = i => Math.min(OPENCUT_TOTAL, unionLength(tmp.filter(e=>e.stage===i)));
  for(let i=1;i<7;i++){
    if(done(i) > done(i-1)+0.01) return `계단식 위반: ${STAGES[i]}(${fmt(done(i))}m)가 ${STAGES[i-1]}(${fmt(done(i-1))}m)보다 앞설 수 없습니다.`;
  }
  return null;
}
function saveEntries(){
  const { open, jack } = collectEntries();
  if(open.length===0 && jack.length===0){ toast("입력된 값이 없습니다.", true); return; }
  const err = validate(open);
  if(err){ toast(err, true); return; }
  STATE.entries.push(...open); STATE.jacking.push(...jack); saveState();
  document.querySelectorAll("#entry-form input[type=number]").forEach(i=>i.value="");
  updateTodayTotal(); renderAll();
  toast(`저장 완료 · 개착 ${open.length}건, 압입 ${jack.length}건`);
}

/* ---------- 설정 ---------- */
function renderSettings(){
  document.getElementById("settings-sections").innerHTML = `
    <table class="w-full text-left">
      <thead><tr class="text-[11px] text-outline border-b border-border-subtle">
        <th class="py-1">구간</th><th>지역</th><th class="text-right">연장</th><th>체인 NO.</th><th class="text-right">진행</th></tr></thead>
      <tbody>${SECTIONS.map(s=>`<tr class="border-b border-border-subtle/60">
        <td class="py-1.5 font-semibold">${s.name}${s.mixed?' <span class="text-[10px] text-outline">혼합</span>':''}</td>
        <td>${s.region}</td>
        <td class="text-right font-mono">${fmt(s.openLen)}m</td>
        <td class="font-mono text-[11px]">${sectionChainRange(s)}</td>
        <td class="text-right font-mono text-primary">${pct1(sectionComposite(s))}%</td></tr>`).join("")}
      </tbody></table>
    <p class="text-[11px] text-on-surface-variant mt-3">6구간: 개착 22m만 7단계 적용 · 강관압입 48m / 지향성압입 179m 별도.</p>`;
  const bytes = new Blob([localStorage.getItem(LS_KEY)||""]).size;
  document.getElementById("storage-info").textContent =
    `저장 위치: 이 브라우저(localStorage) · 사용량 ${(bytes/1024).toFixed(1)} KB · 기록 ${STATE.entries.length+STATE.jacking.length}건`;
}
function renderEntryLog(){
  const all = STATE.entries.map(e=>({...e, type:"open"})).concat(STATE.jacking.map(e=>({...e, type:"jack"})))
    .sort((a,b)=> (b.date||"").localeCompare(a.date||"") || (b.id||0)-(a.id||0));
  document.getElementById("entry-count").textContent = `(${all.length}건)`;
  document.getElementById("entry-log").innerHTML = all.length ? all.map(e=>{
    const label = e.type==="open"
      ? `${STAGES[e.stage]} · ${chainLabel(e.startPos)}→${chainLabel(e.endPos)}`
      : `${JACKING.find(j=>j.key===e.method).name} · ${fmt(e.startPos)}→${fmt(e.endPos)}m`;
    return `<div class="py-1.5 flex items-center justify-between gap-2">
      <span><span class="font-mono text-[11px] text-outline mr-2">${e.date||""}</span>${label} <span class="text-outline">(${fmt(Math.abs(e.endPos-e.startPos))}m)</span></span>
      <button onclick="delEntry('${e.type}','${e.id}')" class="text-error text-[11px] hover:underline">삭제</button></div>`;
  }).join("") : `<p class="text-on-surface-variant py-2">기록 없음</p>`;
}
window.delEntry = (type,id)=>{
  if(type==="open") STATE.entries = STATE.entries.filter(e=>String(e.id)!==String(id));
  else STATE.jacking = STATE.jacking.filter(e=>String(e.id)!==String(id));
  saveState(); renderAll();
};

/* ---------- 백업 ---------- */
function exportJSON(){
  download("songjeon_data.json", JSON.stringify(STATE,null,2), "application/json");
}
function exportCSV(){
  const rows=[["date","type","stage_or_method","start","end","meters"]];
  STATE.entries.forEach(e=>rows.push([e.date,"개착",STAGES[e.stage],e.startPos,e.endPos,e.endPos-e.startPos]));
  STATE.jacking.forEach(e=>rows.push([e.date,"압입",JACKING.find(j=>j.key===e.method).name,e.startPos,e.endPos,e.endPos-e.startPos]));
  download("songjeon_data.csv", "﻿"+rows.map(r=>r.join(",")).join("\n"), "text/csv");
}
function importJSON(file){
  const r=new FileReader();
  r.onload=()=>{ try{ const s=JSON.parse(r.result); if(!s.entries) throw 0;
    STATE=Object.assign(blankState(),s); STATE.route=STATE.route||{image:null,points:[]}; STATE.jacking=STATE.jacking||[];
    saveState(); initRouteImg(); renderAll(); toast("가져오기 완료"); }
    catch(e){ toast("올바른 JSON이 아닙니다.", true); } };
  r.readAsText(file);
}

/* ---------- 노선도 ---------- */
function initRouteImg(){
  const img=document.getElementById("map-img"), ph=document.getElementById("map-placeholder"), svg=document.getElementById("map-svg");
  if(STATE.route.image){ img.src=STATE.route.image; img.classList.remove("hidden"); ph.classList.add("hidden"); svg.classList.remove("hidden"); }
  else { img.classList.add("hidden"); ph.classList.remove("hidden"); svg.classList.add("hidden"); }
}
function uploadMap(file){
  const r=new FileReader();
  r.onload=()=>{ const im=new Image(); im.onload=()=>{
      const max=1600, sc=Math.min(1, max/im.width); const c=document.createElement("canvas");
      c.width=im.width*sc; c.height=im.height*sc; c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      STATE.route.image=c.toDataURL("image/jpeg",0.85); saveState(); initRouteImg(); drawRoute(); toast("지도 업로드 완료 · 보정 모드로 노선을 그리세요");
    }; im.src=r.result; };
  r.readAsDataURL(file);
}
function svgPt(evt){
  const svg=document.getElementById("map-svg"); const r=svg.getBoundingClientRect();
  return { x:(evt.clientX-r.left)/r.width, y:(evt.clientY-r.top)/r.height };
}
function polyPx(pts, W, H){ return pts.map(p=>({x:p.x*W, y:p.y*H})); }
function segLengths(px){ const L=[]; for(let i=1;i<px.length;i++) L.push(Math.hypot(px[i].x-px[i-1].x, px[i].y-px[i-1].y)); return L; }
/* m 위치 → 폴리라인상의 점 */
function pointAtMeter(px, totalPxLen, m){
  let target=(m/TOTAL)*totalPxLen, acc=0;
  for(let i=1;i<px.length;i++){ const d=Math.hypot(px[i].x-px[i-1].x, px[i].y-px[i-1].y);
    if(acc+d>=target){ const t=d? (target-acc)/d:0; return { x:px[i-1].x+(px[i].x-px[i-1].x)*t, y:px[i-1].y+(px[i].y-px[i-1].y)*t }; } acc+=d; }
  return px[px.length-1];
}
/* m 구간 [a,b] → path */
function subPath(px, totalPxLen, a, b){
  const pa=(a/TOTAL)*totalPxLen, pb=(b/TOTAL)*totalPxLen; let acc=0, pts=[];
  const at=t=>pointAtMeter(px,totalPxLen,t);
  pts.push(at(a));
  for(let i=1;i<px.length;i++){ const d=Math.hypot(px[i].x-px[i-1].x, px[i].y-px[i-1].y);
    const segStart=acc, segEnd=acc+d;
    if(segEnd>pa && segStart<pb){ if(segStart>pa && segStart<pb) pts.push(px[i-1]); }
    acc=segEnd;
  }
  pts.push(at(b));
  return "M "+pts.map(p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
}
function drawRoute(){
  const svg=document.getElementById("map-svg"), img=document.getElementById("map-img");
  if(!STATE.route.image){ return; }
  const W=img.clientWidth||img.naturalWidth, H=img.clientHeight||img.naturalHeight;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const pts=STATE.route.points;
  let html="";
  if(pts.length>=2){
    const px=polyPx(pts,W,H); const total=segLengths(px).reduce((a,b)=>a+b,0);
    // 베이스 라인(미착수=회색)
    html+=`<path d="${subPath(px,total,0,TOTAL)}" fill="none" stroke="${C_GRAY}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(routeColorMode==="stage"){
      const done=stageDone(6), head=stageDone(0);
      if(head>0) html+=`<path d="${subPath(px,total,0,head)}" fill="none" stroke="${C_GOLD}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
      if(done>0) html+=`<path d="${subPath(px,total,0,done)}" fill="none" stroke="${C_GREEN}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
      // 선단 마커
      if(head>0){ const hp=pointAtMeter(px,total,head);
        html+=`<circle cx="${hp.x}" cy="${hp.y}" r="6" fill="${C_ORANGE}" class="head-pulse"/><circle cx="${hp.x}" cy="${hp.y}" r="6" fill="${C_ORANGE}"/>`; }
    } else {
      SECTIONS.forEach(sec=>{ html+=`<path d="${subPath(px,total,sec.start,sec.end)}" fill="none" stroke="${REGION_COLORS[sec.region]}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`; });
    }
  }
  // 보정 점
  pts.forEach((p,i)=>{ html+=`<circle cx="${p.x*W}" cy="${p.y*H}" r="4" fill="#fff" stroke="${C_NAVY}" stroke-width="2"/>`;
    if(i===0) html+=`<text x="${p.x*W+6}" y="${p.y*H-6}" font-size="11" fill="${C_NAVY}" font-family="monospace">0m</text>`;
    if(i===pts.length-1 && pts.length>1) html+=`<text x="${p.x*W+6}" y="${p.y*H-6}" font-size="11" fill="${C_NAVY}" font-family="monospace">${TOTAL}m</text>`; });
  svg.innerHTML=html;
  document.getElementById("route-status").textContent = calibrating
    ? `보정 중 · 점 ${pts.length}개 (노선을 따라 클릭)`
    : (pts.length>=2 ? `노선 점 ${pts.length}개 · 시점0m~종점${TOTAL}m` : "보정 모드를 켜고 노선을 따라 점을 찍으세요");
}

/* ===== 유틸 ===== */
function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
let _uid=Date.now(); function uid(){ return (_uid++).toString(36); }
function download(name, content, type){ const b=new Blob([content],{type}); const a=document.createElement("a");
  a.href=URL.createObjectURL(b); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function toast(msg, err){ const t=document.createElement("div");
  t.textContent=msg; t.className=`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-white ${err?'bg-error':'bg-secondary'}`;
  document.body.appendChild(t); setTimeout(()=>t.remove(), err?3500:2000); }

/* ===== 네비게이션 ===== */
function showView(v){
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("active", s.id==="view-"+v));
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active", a.dataset.view===v));
  if(v==="route") setTimeout(drawRoute,50);
  location.hash=v;
}

/* ===== 초기화 ===== */
function init(){
  buildInputForm();
  document.getElementById("input-date").value=todayStr();
  initRouteImg();
  renderAll();

  document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click", e=>{ e.preventDefault(); showView(a.dataset.view); }));
  document.getElementById("btn-save").addEventListener("click", saveEntries);
  document.getElementById("scale-ratio").addEventListener("click", ()=>setScaleMode("ratio"));
  document.getElementById("scale-real").addEventListener("click", ()=>setScaleMode("real"));
  document.getElementById("route-color-stage").addEventListener("click", ()=>{ routeColorMode="stage"; setRouteToggle(); drawRoute(); });
  document.getElementById("route-color-region").addEventListener("click", ()=>{ routeColorMode="region"; setRouteToggle(); drawRoute(); });

  document.getElementById("btn-export").addEventListener("click", exportJSON);
  document.getElementById("btn-export-csv").addEventListener("click", exportCSV);
  document.getElementById("import-file").addEventListener("change", e=>{ if(e.target.files[0]) importJSON(e.target.files[0]); });
  document.getElementById("btn-reset").addEventListener("click", ()=>{ if(confirm("모든 입력 기록과 노선 보정을 삭제합니다. 계속할까요?")){ STATE=blankState(); saveState(); initRouteImg(); renderAll(); toast("초기화 완료"); }});

  document.getElementById("map-file").addEventListener("change", e=>{ if(e.target.files[0]) uploadMap(e.target.files[0]); });
  document.getElementById("btn-calibrate").addEventListener("click", function(){ calibrating=!calibrating;
    this.classList.toggle("bg-primary", calibrating); this.classList.toggle("text-white", calibrating); drawRoute(); });
  document.getElementById("btn-undo-point").addEventListener("click", ()=>{ STATE.route.points.pop(); saveState(); drawRoute(); });
  document.getElementById("btn-clear-points").addEventListener("click", ()=>{ STATE.route.points=[]; saveState(); drawRoute(); });
  document.getElementById("map-svg").addEventListener("click", e=>{ if(!calibrating||!STATE.route.image) return;
    STATE.route.points.push(svgPt(e)); saveState(); drawRoute(); });
  window.addEventListener("resize", ()=>{ if(document.getElementById("view-route").classList.contains("active")) drawRoute(); });

  const start=(location.hash||"#dashboard").slice(1);
  showView(["dashboard","input","route","settings"].includes(start)?start:"dashboard");
}
function setScaleMode(m){ scaleMode=m;
  document.getElementById("scale-ratio").className=`px-4 py-1.5 ${m==="ratio"?"bg-primary text-white font-semibold":"text-on-surface-variant"}`;
  document.getElementById("scale-real").className=`px-4 py-1.5 ${m==="real"?"bg-primary text-white font-semibold":"text-on-surface-variant"}`;
  renderDashboard(); }
function setRouteToggle(){
  document.getElementById("route-color-stage").className=`px-3 py-1.5 ${routeColorMode==="stage"?"bg-primary text-white font-semibold":"text-on-surface-variant"}`;
  document.getElementById("route-color-region").className=`px-3 py-1.5 ${routeColorMode==="region"?"bg-primary text-white font-semibold":"text-on-surface-variant"}`; }

document.addEventListener("DOMContentLoaded", init);
