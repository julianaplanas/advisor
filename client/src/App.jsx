import { useState, useEffect, useRef } from "react";
import { api } from "./api.js";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DEFAULT_PORTFOLIO = [
  { id:"nvda",   platform:"eToro",      name:"NVDA",               value:2800, type:"stock",  region:"US",     ticker:"NVDA",    annualFee:0,    invested:2800, units:null },
  { id:"sxr8",   platform:"eToro",      name:"SXR8 (S&P 500 ETF)", value:2400, type:"etf",    region:"US",     ticker:"SXR8.DE", annualFee:0.07, invested:2400, units:null },
  { id:"qdve",   platform:"eToro",      name:"QDVE (Tech ETF)",    value:1800, type:"etf",    region:"US",     ticker:"QDVE.MI", annualFee:0.35, invested:1800, units:null },
  { id:"net",    platform:"eToro",      name:"NET",                value:900,  type:"stock",  region:"US",     ticker:"NET",     annualFee:0,    invested:900,  units:null },
  { id:"aapl",   platform:"eToro",      name:"AAPL",               value:850,  type:"stock",  region:"US",     ticker:"AAPL",    annualFee:0,    invested:850,  units:null },
  { id:"msft",   platform:"eToro",      name:"MSFT",               value:820,  type:"stock",  region:"US",     ticker:"MSFT",    annualFee:0,    invested:820,  units:null },
  { id:"meli",   platform:"eToro",      name:"MELI",               value:750,  type:"stock",  region:"EM",     ticker:"MELI",    annualFee:0,    invested:750,  units:null },
  { id:"ddog",   platform:"eToro",      name:"DDOG",               value:600,  type:"stock",  region:"US",     ticker:"DDOG",    annualFee:0,    invested:600,  units:null },
  { id:"vrtx",   platform:"eToro",      name:"VRTX",               value:550,  type:"stock",  region:"US",     ticker:"VRTX",    annualFee:0,    invested:550,  units:null },
  { id:"abbv",   platform:"eToro",      name:"ABBV",               value:500,  type:"stock",  region:"US",     ticker:"ABBV",    annualFee:0,    invested:500,  units:null },
  { id:"vgwd",   platform:"eToro",      name:"VGWD (Dividend ETF)",value:480,  type:"etf",    region:"EU",     ticker:"VHYD.AS", annualFee:0.29, invested:480,  units:null },
  { id:"idem",   platform:"eToro",      name:"IDEM (Italy ETF)",   value:320,  type:"etf",    region:"EU",     ticker:"IDEM.MI", annualFee:0.35, invested:320,  units:null },
  { id:"bayn",   platform:"eToro",      name:"BAYN",               value:290,  type:"stock",  region:"EU",     ticker:"BAYN.DE", annualFee:0,    invested:290,  units:null },
  { id:"ypf",    platform:"eToro",      name:"YPF",                value:280,  type:"stock",  region:"EM",     ticker:"YPF",     annualFee:0,    invested:280,  units:null },
  { id:"vrns",   platform:"eToro",      name:"VRNS",               value:210,  type:"stock",  region:"US",     ticker:"VRNS",    annualFee:0,    invested:210,  units:null },
  { id:"other",  platform:"eToro",      name:"Other",              value:390,  type:"stock",  region:"US",     ticker:null,      annualFee:0,    invested:390,  units:null },
  { id:"eth",    platform:"Binance",    name:"ETH",                value:2149, type:"crypto", region:"Crypto", ticker:"ETH",     annualFee:0,    invested:2149, units:null },
  { id:"btc",    platform:"Binance",    name:"BTC",                value:1329, type:"crypto", region:"Crypto", ticker:"BTC",     annualFee:0,    invested:1329, units:null },
  { id:"sol",    platform:"Binance",    name:"SOL",                value:334,  type:"crypto", region:"Crypto", ticker:"SOL",     annualFee:0,    invested:334,  units:null },
  { id:"stable", platform:"Binance",    name:"USDT/DAI",           value:125,  type:"crypto", region:"Crypto", ticker:null,      annualFee:0,    invested:125,  units:null },
  { id:"amw",    platform:"BBVA Spain", name:"Amundi World Eq.",   value:2720, type:"fund",   region:"Global", ticker:null,      annualFee:0.38, invested:2720, units:null },
  { id:"amb",    platform:"BBVA Spain", name:"Amundi Bond Agg.",   value:304,  type:"fund",   region:"Global", ticker:null,      annualFee:0.15, invested:304,  units:null },
  { id:"rev",    platform:"Revolut",    name:"Emergency Cash",     value:2001, type:"cash",   region:"EU",     ticker:null,      annualFee:0,    invested:2001, units:null },
];

const RESEARCH_PRESETS = [
  { id:"spain-tax",        label:"🇪🇸 Spain tax on investments",         query:"Spain investment tax 2026: capital gains rates, BBVA fund tax efficiency, ETF taxation for residents." },
  { id:"argentina-escape", label:"🇦🇷 Getting money out of ARS",         query:"Best legal strategies 2026 for Argentine residents to move ARS savings into USD or EUR. MEP dollar, CCL, Cedears." },
  { id:"bold-etfs",        label:"📈 Bold but diversified ETFs",          query:"Best high-growth ETFs 2026 for aggressive long-term investing. Thematic, EM, small cap, on eToro or BBVA." },
  { id:"crypto-strategy",  label:"₿ Crypto long-term strategy",           query:"Bitcoin Ethereum long-term hold 2026. DCA during dips. Tax treatment of crypto gains in Spain." },
  { id:"dual-resident",    label:"🌍 Spain + Argentina dual tax strategy", query:"Investment tax optimisation for someone with assets in Spain and Argentina 2026. Double taxation treaties, where to book gains." },
];

const PLATFORM_COLORS = { "eToro":"#00C896","Binance":"#F0B90B","BBVA Spain":"#004A97","Revolut":"#666" };
const TYPE_COLORS     = { stock:"#6366f1",etf:"#22d3ee",crypto:"#f59e0b",fund:"#10b981",cash:"#94a3b8" };
const REGION_COLORS   = { US:"#6366f1",EU:"#3b82f6",EM:"#f59e0b",Crypto:"#f97316",Global:"#10b981" };
const C = { bg:"#0b0f1a",surf:"#111827",bdr:"#1e293b",acc:"#22d3ee",text:"#e2e8f0",mut:"#64748b",sub:"#475569" };

// ─── ASSET LOOKUP ─────────────────────────────────────────────────────────────
// Type a known ticker → all fields auto-fill. User only needs name + invested.
const ASSET_LOOKUP = {
  // US Stocks
  NVDA:  { name:"NVDA",  ticker:"NVDA",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  AAPL:  { name:"AAPL",  ticker:"AAPL",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  MSFT:  { name:"MSFT",  ticker:"MSFT",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  AMZN:  { name:"AMZN",  ticker:"AMZN",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  GOOGL: { name:"GOOGL", ticker:"GOOGL",   type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  GOOG:  { name:"GOOG",  ticker:"GOOG",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  META:  { name:"META",  ticker:"META",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  TSLA:  { name:"TSLA",  ticker:"TSLA",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  NET:   { name:"NET",   ticker:"NET",     type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  DDOG:  { name:"DDOG",  ticker:"DDOG",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  VRTX:  { name:"VRTX",  ticker:"VRTX",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  ABBV:  { name:"ABBV",  ticker:"ABBV",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  MELI:  { name:"MELI",  ticker:"MELI",    type:"stock", region:"EM",     platform:"eToro",      annualFee:0 },
  YPF:   { name:"YPF",   ticker:"YPF",     type:"stock", region:"EM",     platform:"eToro",      annualFee:0 },
  VRNS:  { name:"VRNS",  ticker:"VRNS",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  AMD:   { name:"AMD",   ticker:"AMD",     type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  INTC:  { name:"INTC",  ticker:"INTC",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  NFLX:  { name:"NFLX",  ticker:"NFLX",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  CRM:   { name:"CRM",   ticker:"CRM",     type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  SHOP:  { name:"SHOP",  ticker:"SHOP",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  COIN:  { name:"COIN",  ticker:"COIN",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  PLTR:  { name:"PLTR",  ticker:"PLTR",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  SNOW:  { name:"SNOW",  ticker:"SNOW",    type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  V:     { name:"V",     ticker:"V",       type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  MA:    { name:"MA",    ticker:"MA",      type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  JPM:   { name:"JPM",   ticker:"JPM",     type:"stock", region:"US",     platform:"eToro",      annualFee:0 },
  TS:    { name:"TS (Tenaris)", ticker:"TS", type:"stock", region:"EM",   platform:"eToro",      annualFee:0 },
  // EU Stocks
  BAYN:  { name:"BAYN",  ticker:"BAYN.DE", type:"stock", region:"EU",     platform:"eToro",      annualFee:0 },
  SAP:   { name:"SAP",   ticker:"SAP.DE",  type:"stock", region:"EU",     platform:"eToro",      annualFee:0 },
  ASML:  { name:"ASML",  ticker:"ASML",    type:"stock", region:"EU",     platform:"eToro",      annualFee:0 },
  // ETFs
  SXR8:  { name:"SXR8 (S&P 500 ETF)",  ticker:"SXR8.DE", type:"etf", region:"US",     platform:"eToro", annualFee:0.07 },
  VWCE:  { name:"VWCE (World ETF)",     ticker:"VWCE.DE", type:"etf", region:"Global", platform:"eToro", annualFee:0.22 },
  QDVE:  { name:"QDVE (Tech ETF)",      ticker:"QDVE.DE", type:"etf", region:"US",     platform:"eToro", annualFee:0.35 },
  IDEM:  { name:"IDEM (Italy ETF)",     ticker:"IDEM.MI", type:"etf", region:"EU",     platform:"eToro", annualFee:0.35 },
  VHYD:  { name:"VHYD (Dividend ETF)",  ticker:"VHYD.AS", type:"etf", region:"EU",     platform:"eToro", annualFee:0.29 },
  VGWD:  { name:"VGWD (Dividend ETF)",  ticker:"VHYD.AS", type:"etf", region:"EU",     platform:"eToro", annualFee:0.29 },
  CSPX:  { name:"CSPX (S&P 500 ETF)",  ticker:"CSPX.L",  type:"etf", region:"US",     platform:"eToro", annualFee:0.07 },
  QQQ:   { name:"QQQ (NASDAQ ETF)",    ticker:"QQQ",     type:"etf", region:"US",     platform:"eToro", annualFee:0.20 },
  SPY:   { name:"SPY (S&P 500 ETF)",   ticker:"SPY",     type:"etf", region:"US",     platform:"eToro", annualFee:0.09 },
  VTI:   { name:"VTI (US Total Mkt)",  ticker:"VTI",     type:"etf", region:"US",     platform:"eToro", annualFee:0.03 },
  EQQQ:  { name:"EQQQ (NASDAQ ETF)",   ticker:"EQQQ.L",  type:"etf", region:"US",     platform:"eToro", annualFee:0.30 },
  // Crypto
  BTC:    { name:"BTC",   ticker:"BTC",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  ETH:    { name:"ETH",   ticker:"ETH",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  SOL:    { name:"SOL",   ticker:"SOL",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  BNB:    { name:"BNB",   ticker:"BNB",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  MATIC:  { name:"MATIC", ticker:"MATIC", type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  ADA:    { name:"ADA",   ticker:"ADA",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  AVAX:   { name:"AVAX",  ticker:"AVAX",  type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  LINK:   { name:"LINK",  ticker:"LINK",  type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  XRP:    { name:"XRP",   ticker:"XRP",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  DOT:    { name:"DOT",   ticker:"DOT",   type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  USDT:   { name:"USDT",  ticker:null,    type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
  USDC:   { name:"USDC",  ticker:null,    type:"crypto", region:"Crypto", platform:"Binance", annualFee:0 },
};

const PLATFORM_FEE_INFO = {
  "eToro":      { rate:"0% commission",        note:"Spread on each trade (0.09%–3%). $5 withdrawal. 1.5% currency conversion if non-USD." },
  "Binance":    { rate:"0.1% per trade",        note:"0.075% if paying fees in BNB. Network fees on withdrawal." },
  "BBVA Spain": { rate:"No transaction fee",    note:"Fund TER baked into price. No buy/sell fees for own funds." },
  "Revolut":    { rate:"1 free trade/mo (Std)", note:"€1 per trade after free allowance. Unlimited on paid plans." },
};

const SYSTEM_PROMPT = (ctx) =>
  `You are a frank, knowledgeable personal investment advisor with full memory of all previous conversations.

Portfolio context (always up to date):
${ctx}

Rules:
- You remember everything discussed previously — reference it naturally when relevant.
- Be specific, direct, and actionable. Use the user's actual asset names.
- Use markdown: ## sections, **bold**, - bullets, tables when comparing.
- When given a proposed allocation, give a clear verdict, your reasoning, and your alternative if different.
- Always add a brief caveat that you're not a licensed financial advisor.
- Never repeat the full portfolio back unless asked.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function groupBy(positions, key) {
  const g = {};
  positions.forEach(p => { g[p[key]] = (g[p[key]] || 0) + p.value; });
  return g;
}

function buildContext(positions, profile = {}) {
  const total = positions.reduce((s, p) => s + p.value, 0);
  const totalInvested = positions.reduce((s, p) => s + (p.invested ?? p.value), 0);
  const totalPnl = total - totalInvested;
  const byPlat = {};
  positions.forEach(p => {
    if (!byPlat[p.platform]) byPlat[p.platform] = [];
    byPlat[p.platform].push(p);
  });
  const lines = Object.entries(byPlat).map(([plat, pos]) => {
    const t = pos.reduce((s, p) => s + p.value, 0);
    const posLines = pos.map(p => {
      const invested = p.invested ?? p.value;
      const pnl = p.value - invested;
      const pnlPct = invested > 0 ? (pnl / invested * 100).toFixed(1) : "0";
      const pnlStr = pnl !== 0 ? ` (P&L: ${pnl >= 0 ? "+" : ""}€${Math.round(pnl)}, ${pnl >= 0 ? "+" : ""}${pnlPct}%)` : "";
      const feeStr = p.annualFee > 0 ? ` TER:${p.annualFee}%` : "";
      const lotsStr = p.lots?.length > 1 ? ` ${p.lots.length} purchases` : p.lots?.[0]?.date ? ` since ${p.lots[0].date}` : "";
      return `  • ${p.name} [${p.type}/${p.region}]: €${Math.round(p.value)}${pnlStr}${feeStr}${lotsStr}`;
    });
    return `${plat} (€${Math.round(t)}):\n${posLines.join("\n")}`;
  });
  return `${lines.join("\n\n")}

TOTAL: €${Math.round(total)} | Invested: €${Math.round(totalInvested)} | Overall P&L: ${totalPnl >= 0 ? "+" : ""}€${Math.round(totalPnl)} (${(totalPnl / totalInvested * 100).toFixed(1)}%)

Income & currency context:
- Income in TWO currencies: Argentine Pesos (ARS) and Euros (EUR). Strategy differs per currency.
- ARS: capital controls + inflation → exit pesos fast. Method: Binance P2P (buy BTC/ETH/USDT). Alternatives: MEP dollar, CCL, Cedears.
- EUR: standard long-term investing → ETFs (eToro/BBVA), funds, direct positions.
- Factor in which currency new money is coming from when advising.
- Tax exposure in Spain and Argentina. Comfortable locking money long-term. Wants bold but not reckless growth.

User profile:
- Residence: ${profile.residence||"Spain"}
- Taxes paid in: ${profile.taxCountry||"Spain"}
- Employment: ${profile.employment||"Autónoma in Spain"}${profile.extra?`\n- ${profile.extra}`:""}`;

}

// ─── MARKDOWN ─────────────────────────────────────────────────────────────────
function InlineMd({ text }) {
  const parts = []; let rem = text, k = 0;
  while (rem.length > 0) {
    const bm = rem.match(/\*\*(.+?)\*\*/), cm = rem.match(/`(.+?)`/);
    const nb = bm ? rem.indexOf(bm[0]) : Infinity, nc = cm ? rem.indexOf(cm[0]) : Infinity;
    if (nb===Infinity&&nc===Infinity){parts.push(<span key={k++}>{rem}</span>);break;}
    if(nb<=nc){if(nb>0)parts.push(<span key={k++}>{rem.slice(0,nb)}</span>);parts.push(<strong key={k++} style={{color:"#e2e8f0"}}>{bm[1]}</strong>);rem=rem.slice(nb+bm[0].length);}
    else{if(nc>0)parts.push(<span key={k++}>{rem.slice(0,nc)}</span>);parts.push(<code key={k++} style={{background:"#1e293b",color:"#22d3ee",padding:"1px 5px",borderRadius:3,fontSize:11}}>{cm[1]}</code>);rem=rem.slice(nc+cm[0].length);}
  }
  return <>{parts}</>;
}

function Markdown({ text }) {
  const lines = text.split("\n"); const els = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("|") && i+1<lines.length && /^\|?[\s\-|:]+\|/.test(lines[i+1])) {
      const tl = []; while (i<lines.length&&lines[i].includes("|")){tl.push(lines[i]);i++;}
      const pr = r=>r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
      const hdrs=pr(tl[0]); const rows=tl.slice(2).map(pr);
      els.push(<div key={`t${i}`} style={{overflowX:"auto",margin:"12px 0"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{hdrs.map((h,hi)=><th key={hi} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#22d3ee",borderBottom:"1px solid #1e293b",whiteSpace:"nowrap"}}><InlineMd text={h}/></th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} style={{background:ri%2===0?"transparent":"#0d1117"}}>{row.map((cell,ci)=><td key={ci} style={{padding:"7px 12px",color:"#cbd5e1",borderBottom:"1px solid #1a2030",verticalAlign:"top"}}><InlineMd text={cell}/></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if(!line.trim()){els.push(<div key={i} style={{height:8}}/>);i++;continue;}
    if(line.startsWith("## ")) els.push(<div key={i} style={{fontSize:14,fontWeight:700,color:"#f8fafc",margin:"16px 0 8px",borderBottom:"1px solid #1e293b",paddingBottom:5}}>{line.slice(3)}</div>);
    else if(line.startsWith("### ")) els.push(<div key={i} style={{fontSize:13,fontWeight:700,color:"#22d3ee",margin:"12px 0 5px"}}>{line.slice(4)}</div>);
    else if(line.startsWith("# ")) els.push(<div key={i} style={{fontSize:16,fontWeight:700,color:"#f8fafc",margin:"14px 0 8px"}}>{line.slice(2)}</div>);
    else if(line.startsWith("- ")||line.startsWith("* ")) els.push(<div key={i} style={{display:"flex",gap:8,margin:"4px 0"}}><span style={{color:"#22d3ee",flexShrink:0}}>✦</span><span style={{fontSize:13,color:"#cbd5e1",lineHeight:1.65}}><InlineMd text={line.slice(2)}/></span></div>);
    else if(/^\d+\.\s/.test(line)){const n=line.match(/^(\d+)\./)[1];els.push(<div key={i} style={{display:"flex",gap:8,margin:"4px 0"}}><span style={{color:"#22d3ee",flexShrink:0,fontWeight:700,minWidth:18}}>{n}.</span><span style={{fontSize:13,color:"#cbd5e1",lineHeight:1.65}}><InlineMd text={line.replace(/^\d+\.\s/,"")}/></span></div>);}
    else if(line.startsWith("---")) els.push(<hr key={i} style={{border:"none",borderTop:"1px solid #1e293b",margin:"12px 0"}}/>);
    else els.push(<p key={i} style={{fontSize:13,color:"#cbd5e1",lineHeight:1.7,margin:"3px 0"}}><InlineMd text={line}/></p>);
    i++;
  }
  return <div>{els}</div>;
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function Donut({ data, colors, size=130, onClick }) {
  const [hov, setHov] = useState(null);
  const total = Object.values(data).reduce((s,v)=>s+v,0);
  let cum=0;
  const cx=size/2,cy=size/2,r=size*0.4,inn=size*0.24;
  const slices = Object.entries(data).map(([label,value])=>{
    const pct=value/total; const a0=cum*2*Math.PI-Math.PI/2; cum+=pct; const a1=cum*2*Math.PI-Math.PI/2;
    const x1=cx+r*Math.cos(a0),y1=cy+r*Math.sin(a0),x2=cx+r*Math.cos(a1),y2=cy+r*Math.sin(a1);
    const ix1=cx+inn*Math.cos(a0),iy1=cy+inn*Math.sin(a0),ix2=cx+inn*Math.cos(a1),iy2=cy+inn*Math.sin(a1);
    return {label,value,pct,path:`M ${x1} ${y1} A ${r} ${r} 0 ${pct>0.5?1:0} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inn} ${inn} 0 ${pct>0.5?1:0} 0 ${ix1} ${iy1} Z`};
  });
  const hS=hov?slices.find(s=>s.label===hov):null;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{cursor:onClick?"pointer":"default",flexShrink:0}} onClick={onClick}>
      {slices.map(s=><path key={s.label} d={s.path} fill={colors[s.label]||"#64748b"} opacity={hov===null?0.88:hov===s.label?1:0.3} style={{transition:"opacity 0.15s"}} onMouseEnter={()=>setHov(s.label)} onMouseLeave={()=>setHov(null)}/>)}
      <circle cx={cx} cy={cy} r={inn-2} fill="#0f172a"/>
      {hS?<><text x={cx} y={cy-4} textAnchor="middle" fill="#f8fafc" fontSize={size*0.09} fontWeight="700">{(hS.pct*100).toFixed(0)}%</text><text x={cx} y={cy+size*0.1} textAnchor="middle" fill="#64748b" fontSize={size*0.065}>{hS.label}</text></>
        :onClick&&<text x={cx} y={cy+4} textAnchor="middle" fill="#2d3f55" fontSize={size*0.065}>zoom</text>}
    </svg>
  );
}
function Legend({ data, colors }) {
  const total = Object.values(data).reduce((s,v)=>s+v,0);
  return <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:0}}>{Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([label,value])=><div key={label} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:colors[label]||"#64748b",flexShrink:0}}/><span style={{fontSize:11,color:"#94a3b8",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span><span style={{fontSize:11,color:"#e2e8f0",fontWeight:600,flexShrink:0}}>{((value/total)*100).toFixed(0)}%</span></div>)}</div>;
}
function ChartModal({ title, data, colors, onClose }) {
  const total = Object.values(data).reduce((s,v)=>s+v,0);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:16,padding:24,width:"100%",maxWidth:360}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#475569",fontSize:22,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><Donut data={data} colors={colors} size={190}/></div>
        {Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([label,value])=>{const pct=(value/total)*100;return <div key={label} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:2,background:colors[label]||"#64748b"}}/><span style={{fontSize:12,color:"#94a3b8"}}>{label}</span></div><div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:"#475569"}}>€{Math.round(value).toLocaleString()}</span><span style={{fontSize:12,color:"#e2e8f0",fontWeight:700,minWidth:38,textAlign:"right"}}>{pct.toFixed(1)}%</span></div></div><div style={{height:4,background:"#1e293b",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:colors[label]||"#64748b",borderRadius:2}}/></div></div>;})}
      </div>
    </div>
  );
}

// ─── APPLY CHANGES MODAL ──────────────────────────────────────────────────────
// Shows AI-extracted investment changes, lets user edit values, then applies them
function ApplyModal({ changes, positions, onApply, onClose }) {
  // Each change: { mode:"update"|"add", positionId?:string, name, platform, type, region, addAmount, newTotal, currentValue }
  const [rows, setRows] = useState(changes.map(c => ({ ...c, confirmed: true })));

  function updateRow(i, field, val) {
    setRows(rs => rs.map((r, ri) => ri === i ? { ...r, [field]: val } : r));
  }

  function apply() {
    const confirmed = rows.filter(r => r.confirmed);
    onApply(confirmed);
  }

  const inp = { background:"#0d1117", border:"1px solid #1e293b", borderRadius:6, padding:"5px 9px", color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", width:"90px", boxSizing:"border-box" };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 0 0"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111827",border:"1px solid #1e293b",borderTop:"2px solid #22d3ee",borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxWidth:500,maxHeight:"85vh",overflowY:"auto"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:14,fontWeight:700,color:"#f8fafc"}}>Apply to Portfolio</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#475569",fontSize:22,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
        </div>
        <p style={{fontSize:11,color:"#64748b",marginBottom:18}}>Review what the AI suggested. Edit amounts, uncheck what you don't want, then confirm.</p>

        {rows.map((row, i) => {
          const existing = positions.find(p => p.id === row.positionId);
          const currentVal = existing ? existing.value : 0;
          const newTotal = row.mode === "update"
            ? currentVal + parseFloat(row.addAmount || 0)
            : parseFloat(row.addAmount || 0);

          return (
            <div key={i} style={{background: row.confirmed ? "#0d1826" : "#0f1117", border:`1px solid ${row.confirmed ? "#1e3a5f" : "#1e293b"}`, borderRadius:10, padding:14, marginBottom:10, opacity: row.confirmed ? 1 : 0.5, transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <input type="checkbox" checked={row.confirmed} onChange={e=>updateRow(i,"confirmed",e.target.checked)}
                  style={{marginTop:2,width:16,height:16,accentColor:"#22d3ee",cursor:"pointer",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div>
                      <span style={{fontSize:13,fontWeight:700,color:"#f8fafc"}}>{row.name}</span>
                      <span style={{fontSize:11,color:"#475569",marginLeft:8}}>{row.platform}</span>
                    </div>
                    <span style={{fontSize:10,color: row.mode==="add" ? "#f59e0b" : "#22d3ee", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em"}}>
                      {row.mode==="add" ? "new position" : "top up"}
                    </span>
                  </div>

                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    {row.mode==="update" && (
                      <div style={{fontSize:11,color:"#475569"}}>
                        Current: <strong style={{color:"#94a3b8"}}>€{Math.round(currentVal).toLocaleString()}</strong>
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,color:"#64748b"}}>{row.mode==="update" ? "+ add" : "amount"}</span>
                      <span style={{fontSize:12,color:"#64748b"}}>€</span>
                      <input
                        type="number"
                        value={row.addAmount}
                        onChange={e=>updateRow(i,"addAmount",e.target.value)}
                        style={inp}
                        min="0"
                      />
                    </div>
                    {row.mode==="update" && (
                      <div style={{fontSize:11,color:"#64748b"}}>
                        → new total: <strong style={{color:"#34d399"}}>€{Math.round(newTotal).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>

                  {row.mode==="add" && (
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      {["platform","type","region"].map(field=>(
                        <div key={field} style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:10,color:"#475569",textTransform:"uppercase"}}>{field}</span>
                          <select value={row[field]} onChange={e=>updateRow(i,field,e.target.value)}
                            style={{...inp,width:"auto",padding:"3px 6px",cursor:"pointer"}}>
                            {field==="platform" && [...Object.keys(PLATFORM_COLORS),"Other"].map(v=><option key={v}>{v}</option>)}
                            {field==="type" && ["stock","etf","crypto","fund","cash"].map(v=><option key={v}>{v}</option>)}
                            {field==="region" && ["US","EU","EM","Crypto","Global"].map(v=><option key={v}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid #1e293b",background:"none",color:"#64748b",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={apply} style={{flex:2,padding:"12px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#0ea5e9,#22d3ee)",color:"#0b0f1a",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            ✓ Apply {rows.filter(r=>r.confirmed).length} change{rows.filter(r=>r.confirmed).length!==1?"s":""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e) { e.preventDefault(); setLoading(true); setError(""); try { await api.login(username, password); onLogin(); } catch { setError("Invalid credentials"); } setLoading(false); }
  const inp = {width:"100%",background:"#0d1117",border:"1px solid #1e293b",borderRadius:8,padding:"12px 14px",color:"#e2e8f0",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  return (
    <div style={{minHeight:"100vh",background:"#0b0f1a",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Mono','Fira Code',monospace"}}>
      <div style={{width:"100%",maxWidth:340}}>
        <p style={{fontSize:22,fontWeight:700,color:"#f8fafc",marginBottom:4,letterSpacing:"-0.5px"}}>⬡ Portfolio Advisor</p>
        <p style={{fontSize:12,color:"#64748b",marginBottom:32}}>Sign in to access your portfolio</p>
        <form onSubmit={submit}>
          <div style={{marginBottom:14}}><div style={{fontSize:10,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Username</div><input style={inp} value={username} onChange={e=>setUsername(e.target.value)} autoFocus autoComplete="username"/></div>
          <div style={{marginBottom:20}}><div style={{fontSize:10,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Password</div><input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></div>
          {error&&<div style={{fontSize:12,color:"#f87171",marginBottom:14,padding:"8px 12px",background:"#2d1010",borderRadius:6}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:loading?"#1a2030":"linear-gradient(135deg,#0ea5e9,#22d3ee)",color:loading?"#64748b":"#0b0f1a",fontWeight:700,fontSize:14,cursor:loading?"default":"pointer",fontFamily:"inherit"}}>{loading?"Signing in…":"Sign In →"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed]               = useState(null);
  const [positions, setPositions]         = useState(DEFAULT_PORTFOLIO);
  const [newMoney, setNewMoney]           = useState(500);
  const [allocation, setAllocation]       = useState({"SXR8/VWCE ETF":0,"BBVA Amundi Fund":0,BTC:0,ETH:0,"EU Dividend ETF":0,"EM ETF":0,Cash:0});
  const [tab, setTab]                     = useState("allocate");
  const [researchId, setResearchId]       = useState(null);
  const [researchText, setResearchText]   = useState("");
  const [resLoading, setResLoading]       = useState(false);
  const [chatMessages, setChatMessages]   = useState([]);
  const [chatInput, setChatInput]         = useState("");
  const [chatLoading, setChatLoading]     = useState(false);
  const [modal, setModal]                 = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [editVal, setEditVal]             = useState("");
  const [editingInvestedId, setEditingInvestedId] = useState(null);
  const [editInvestedVal, setEditInvestedVal]     = useState("");
  const [editLots, setEditLots]           = useState([]);
  const [newPos, setNewPos]               = useState({platform:"eToro",name:"",invested:"",annualFee:"",ticker:"",type:"stock",region:"US",purchaseDate:"",units:null});
  const [showAddForm, setShowAddForm]     = useState(false);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [addingPos, setAddingPos]         = useState(false);
  const [addError, setAddError]           = useState("");
  const [savedFlash, setSavedFlash]       = useState(false);
  // Apply modal state
  const [applyChanges, setApplyChanges]   = useState(null);
  const [extracting, setExtracting]       = useState(false);
  const [priceData, setPriceData]         = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [profile, setProfile]             = useState({ residence:"Spain", taxCountry:"Spain", employment:"Autónoma in Spain", extra:"" });
  const [editingProfile, setEditingProfile] = useState(false);
  const skipSavesRef = useRef(2);  // skip first 2 position saves: initial render + DB load
  const chatEndRef = useRef(null);

  useEffect(() => { api.me().then(()=>setAuthed(true)).catch(()=>setAuthed(false)); window.addEventListener("auth:logout",()=>setAuthed(false)); }, []);

  useEffect(() => {
    if (!authed) return;
    api.storageGet("portfolio-positions").then(r=>{
      const v=JSON.parse(r.value);
      if(Array.isArray(v)&&v.length>0) {
        // Backfill ticker from ASSET_LOOKUP for positions saved before tickers were tracked
        const fixed = v.map(p => {
          if (p.ticker) return p;
          const key = p.name?.trim().toUpperCase().split(' ')[0]; // e.g. "NVDA", "SXR8", "ETH"
          const match = ASSET_LOOKUP[key] || ASSET_LOOKUP[p.name?.trim().toUpperCase()];
          return match ? { ...p, ticker: match.ticker } : p;
        });
        setPositions(fixed);
      }
    }).catch(()=>{});
    api.storageGet("chat-history").then(r=>{const v=JSON.parse(r.value);if(Array.isArray(v)&&v.length>0)setChatMessages(v);}).catch(()=>{});
    api.storageGet("user-profile").then(r=>{const v=JSON.parse(r.value);if(v&&typeof v==="object")setProfile(v);}).catch(()=>{});
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    // Skip the first 2 saves: (1) initial render with defaults, (2) DB load overwrite
    if (skipSavesRef.current > 0) { skipSavesRef.current--; return; }
    api.storageSet("portfolio-positions", JSON.stringify(positions)).catch(()=>{});
  }, [positions, authed]);
  useEffect(() => { if(!authed)return; api.storageSet("chat-history",JSON.stringify(chatMessages)).catch(()=>{}); }, [chatMessages, authed]);
  useEffect(() => { if(!authed)return; api.storageSet("user-profile",JSON.stringify(profile)).catch(()=>{}); }, [profile, authed]);

  // Auto-refresh prices when a position with units has no price data yet
  useEffect(() => {
    if (!authed || pricesLoading) return;
    const needsPrice = positions.some(p => p.units > 0 && p.ticker && !priceData[p.id]);
    if (needsPrice) refreshPrices();
  }, [positions, authed]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatMessages, chatLoading]);

  function saveValue(id){const num=parseFloat(editVal);if(!isNaN(num)&&num>=0){setPositions(ps=>ps.map(p=>p.id===id?{...p,value:num}:p));flash();}setEditingId(null);}
  function saveInvested(id){const num=parseFloat(editInvestedVal);if(!isNaN(num)&&num>=0){setPositions(ps=>ps.map(p=>p.id===id?{...p,invested:num}:p));flash();}setEditingInvestedId(null);}
  function deletePosition(id){setPositions(ps=>ps.filter(p=>p.id!==id));}
  async function addPosition() {
    if (!newPos.name.trim() || !newPos.invested) return;
    const investedAmt = parseFloat(newPos.invested) || 0;
    setAddError("");
    let units = null;

    const ticker = newPos.ticker || null;
    const directUnits = parseFloat(newPos.units);
    if (directUnits > 0) {
      units = directUnits;
    } else if (ticker && newPos.purchaseDate) {
      setAddingPos(true);
      try {
        const { priceEur } = await api.priceAtDate(ticker, newPos.purchaseDate);
        units = investedAmt / priceEur;
      } catch {
        setAddError(`Couldn't fetch price for ${ticker} on ${newPos.purchaseDate}. Check the ticker or try a different date.`);
        setAddingPos(false);
        return;
      }
      setAddingPos(false);
    }

    const newLot = { date: newPos.purchaseDate || null, invested: investedAmt, units };

    // Check if position already exists (match by ticker or name)
    const existing = positions.find(p =>
      (ticker && p.ticker && p.ticker.toUpperCase() === ticker.toUpperCase()) ||
      p.name.toLowerCase() === newPos.name.trim().toLowerCase()
    );

    if (existing) {
      setPositions(ps => ps.map(p => {
        if (p.id !== existing.id) return p;
        // If position has no lots yet, wrap its existing data as a legacy lot so we don't lose it
        const existingLots = p.lots && p.lots.length > 0
          ? p.lots
          : [{ date: null, invested: p.invested ?? p.value, units: p.units ?? null }];
        const lots = [...existingLots, newLot];
        const totalInvested = lots.reduce((s, l) => s + l.invested, 0);
        // Sum only lots that have valid units — partial is fine, null lots just aren't auto-tracked
        const knownUnits = lots.filter(l => l.units != null && !isNaN(l.units) && l.units > 0);
        const totalUnits = knownUnits.length > 0 ? knownUnits.reduce((s, l) => s + l.units, 0) : null;
        return { ...p, lots, invested: totalInvested, units: totalUnits, value: totalInvested };
      }));
    } else {
      setPositions(ps => [...ps, {
        ...newPos,
        id: Date.now().toString(),
        value: investedAmt,
        invested: investedAmt,
        annualFee: parseFloat(newPos.annualFee) || 0,
        ticker,
        units: (units != null && !isNaN(units) && units > 0) ? units : null,
        lots: [newLot],
      }]);
    }

    setNewPos({platform:"eToro",name:"",invested:"",annualFee:"",ticker:"",type:"stock",region:"US",purchaseDate:"",units:null});
    setShowAddForm(false);
    setShowAdvancedAdd(false);
    flash();
  }
  function flash(){setSavedFlash(true);setTimeout(()=>setSavedFlash(false),1800);}
  function clearChat(){if(!window.confirm("Clear the entire conversation history? This cannot be undone."))return;setChatMessages([]);}

  async function refreshPrices() {
    setPricesLoading(true);
    try {
      const tickers = {};
      positions.forEach(p => {
        const t = p.ticker || ASSET_LOOKUP[p.name?.trim().toUpperCase().split(' ')[0]]?.ticker;
        if (t) tickers[p.id] = t;
      });
      const result = await api.prices(tickers);
      const prices = result.prices || {};
      setPriceData(prices);
      setPositions(ps => ps.map(p => {
        const lp = prices[p.id];
        if (lp && p.units != null && p.units > 0) {
          return { ...p, value: Math.round(p.units * lp.priceEur * 100) / 100 };
        }
        return p;
      }));
    } catch (e) { console.error("Price refresh failed:", e); }
    setPricesLoading(false);
  }

  const portfolioContext = buildContext(positions, profile);

  async function aiChat(userMessage, currentHistory) {
    const msgs = [...currentHistory, {role:"user", content:userMessage}];
    setChatMessages(msgs); setChatLoading(true);
    try {
      const { content } = await api.ai(SYSTEM_PROMPT(portfolioContext), msgs);
      setChatMessages([...msgs, {role:"assistant", content}]);
    } catch { setChatMessages([...msgs, {role:"assistant", content:"Something went wrong. Try again."}]); }
    setChatLoading(false);
  }

  async function getAdvice() {
    const summary = Object.entries(allocation).filter(([,v])=>v>0).map(([k,v])=>`${k}: €${v}`).join(", ")||"nothing allocated yet";
    const prompt = `I have €${newMoney} to invest. Proposed allocation: ${summary}.\n\nGive me:\n1. Clear verdict — good use of money?\n2. Reasoning based on my specific holdings\n3. Your concrete alternative if different\n\nBe direct. Use my actual asset names. Factor in which currency this is likely from.`;
    setTab("ask");
    await aiChat(prompt, chatMessages);
  }

  async function sendChat() {
    if(!chatInput.trim()||chatLoading)return;
    const msg=chatInput.trim(); setChatInput("");
    await aiChat(msg, chatMessages);
  }

  // ── Extract investment changes from the last AI response ──────────────────
  async function extractChanges() {
    setExtracting(true);
    const lastAssistant = [...chatMessages].reverse().find(m=>m.role==="assistant");
    if (!lastAssistant) { setExtracting(false); return; }

    const positionsSummary = positions.map(p=>`id:${p.id} name:"${p.name}" platform:"${p.platform}" type:${p.type} region:${p.region} currentValue:${p.value}`).join("\n");

    const extractPrompt = `Based on this advisor message, extract all specific investment actions recommended (amounts to invest in specific assets).

ADVISOR MESSAGE:
${lastAssistant.content}

CURRENT PORTFOLIO POSITIONS:
${positionsSummary}

Return ONLY a JSON array. No explanation, no markdown, no code fences. Each item must be:
{
  "mode": "update" | "add",
  "positionId": "<existing id from portfolio, or null if new>",
  "name": "<asset name>",
  "platform": "<platform>",
  "type": "stock"|"etf"|"crypto"|"fund"|"cash",
  "region": "US"|"EU"|"EM"|"Crypto"|"Global",
  "addAmount": <number, the amount to add in EUR>
}

Rules:
- Only include items with a specific euro amount mentioned
- For existing positions, match by name and set positionId
- For new positions, set positionId to null
- If no specific amounts, return []`;

    try {
      const { content } = await api.ai(
        "You are a data extractor. Return only valid JSON arrays. No explanation.",
        [{ role:"user", content:extractPrompt }]
      );
      const clean = content.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setApplyChanges(parsed);
      } else {
        alert("No specific investment amounts found in the last message. Try asking the advisor for a concrete allocation first.");
      }
    } catch (e) {
      alert("Couldn't extract changes. Make sure the advisor gave specific amounts.");
    }
    setExtracting(false);
  }

  // ── Apply confirmed changes to portfolio ──────────────────────────────────
  function applyToPortfolio(confirmedChanges) {
    setPositions(current => {
      let updated = [...current];
      confirmedChanges.forEach(change => {
        const amount = parseFloat(change.addAmount) || 0;
        if (amount <= 0) return;
        if (change.mode === "update" && change.positionId) {
          updated = updated.map(p =>
            p.id === change.positionId
              ? { ...p, value: p.value + amount, invested: (p.invested ?? p.value) + amount }
              : p
          );
        } else {
          updated.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            name: change.name,
            platform: change.platform,
            type: change.type,
            region: change.region,
            value: amount,
            invested: amount,
            units: null,
          });
        }
      });
      return updated;
    });
    setApplyChanges(null);
    flash();
    setTab("portfolio");
  }

  async function runResearch(preset) {
    setResearchId(preset.id);setResearchText("");setResLoading(true);
    try { const { content } = await api.ai(`Sharp financial research assistant. User has portfolio in Spain (BBVA, eToro), Revolut, Binance, income in ARS and EUR. Wants bold long-term growth. Use markdown: ## sections, **bold**, - bullets. Specific numbers, actionable. Under 450 words.`,[{role:"user",content:preset.query}]); setResearchText(content); }
    catch { setResearchText("Research failed. Try again."); }
    setResLoading(false);
  }

  const base=positions.reduce((s,p)=>s+p.value,0); const allocated=Object.values(allocation).reduce((s,v)=>s+v,0); const remaining=newMoney-allocated;
  const byRegion=groupBy(positions,"region"); const byType=groupBy(positions,"type");
  const projPos=[...positions,...Object.entries(allocation).filter(([,v])=>v>0).map(([name,value])=>({name,value,id:"proj-"+name,type:name.includes("ETF")||name.includes("Fund")?"etf":name==="Cash"?"cash":"crypto",region:name==="BTC"||name==="ETH"?"Crypto":name.includes("EM")?"EM":name.includes("EU")?"EU":"Global",platform:"New"}))];
  const projByRegion=groupBy(projPos,"region"); const projByType=groupBy(projPos,"type");
  const platforms=[...new Set(positions.map(p=>p.platform))];
  const msgCount=chatMessages.filter(m=>m.role==="assistant").length;
  const hasLastAdvice=chatMessages.length>0&&chatMessages[chatMessages.length-1].role==="assistant";

  const card={background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:10,padding:16,marginBottom:14};
  const lbl={fontSize:11,color:C.mut,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontWeight:700};
  const inp={background:"#0d1117",border:`1px solid ${C.bdr}`,borderRadius:6,padding:"6px 10px",color:C.text,fontSize:12,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"};

  if(authed===null)return <div style={{minHeight:"100vh",background:"#0b0f1a",display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontFamily:"monospace"}}>Loading…</div>;
  if(!authed)return <Login onLogin={()=>setAuthed(true)}/>;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Mono','Fira Code','Courier New',monospace",paddingBottom:60}}>

      <div style={{borderBottom:`1px solid ${C.bdr}`}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"18px 32px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"baseline",gap:16}}>
              <p style={{fontSize:18,fontWeight:700,color:"#f8fafc",margin:0,letterSpacing:"-0.5px"}}>⬡ Portfolio Advisor</p>
              <p style={{fontSize:13,color:C.mut,margin:0}}>Total: <strong style={{color:"#34d399",fontSize:15}}>€{Math.round(base).toLocaleString()}</strong>{(()=>{const ti=positions.reduce((s,p)=>s+(p.invested??p.value),0);const pnl=base-ti;if(!ti||pnl===0)return null;const pct=(pnl/ti)*100;return <span style={{color:pnl>=0?"#34d399":"#f87171",marginLeft:6}}>{pnl>=0?"+":""}{Math.round(pnl).toLocaleString()}€ ({pct.toFixed(1)}%)</span>;})()}<span style={{color:C.sub}}> · {positions.length} positions{msgCount>0?` · ${msgCount} AI messages`:""}</span></p>
            </div>
            <button onClick={()=>api.logout().finally(()=>setAuthed(false))} style={{fontSize:11,color:C.sub,background:"none",border:`1px solid ${C.bdr}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit"}}>sign out</button>
          </div>
          <div style={{display:"flex",gap:4}}>
            {[["allocate","💰 Allocate"],["breakdown","📊 Breakdown"],["portfolio","✏️ Portfolio"],["research","🔍 Research"],["ask","💬 Advisor"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",background:"none",border:"none",borderBottom:tab===t?`2px solid ${C.acc}`:"2px solid transparent",color:tab===t?C.acc:C.sub,textTransform:"uppercase",letterSpacing:"0.05em",position:"relative"}}>
                {l}{t==="ask"&&msgCount>0&&<span style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:C.acc}}/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 32px"}}>

        {tab==="allocate"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20,alignItems:"start"}}>
            <div>
              <div style={card}><div style={lbl}>New Money to Allocate</div><div style={{display:"flex",alignItems:"center",gap:12}}><input type="range" min={100} max={5000} step={50} value={newMoney} onChange={e=>setNewMoney(+e.target.value)} style={{flex:1,accentColor:C.acc}}/><span style={{fontSize:18,fontWeight:700,color:C.acc,minWidth:58,textAlign:"right"}}>€{newMoney}</span></div></div>
              <div style={{background:remaining<0?"#2d1010":remaining===0?"#0d2d1a":"#161c2a",border:`1px solid ${remaining<0?"#ef4444":remaining===0?"#10b981":C.bdr}`,borderRadius:8,padding:"10px 14px",fontSize:12,marginBottom:14,color:remaining<0?"#f87171":remaining===0?"#34d399":C.mut,display:"flex",justifyContent:"space-between"}}><span>{remaining<0?"⚠ Over-allocated by":remaining===0?"✓ Fully allocated":"Unallocated"}</span><span style={{fontWeight:700}}>{remaining<0?`-€${Math.abs(remaining)}`:`€${remaining}`}</span></div>
              <div style={card}><div style={lbl}>Where to put it</div>{Object.entries(allocation).map(([key,val])=><div key={key} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:"#94a3b8"}}>{key}</span><span style={{fontSize:12,fontWeight:700,color:C.acc}}>€{val}</span></div><input type="range" min={0} max={newMoney} step={25} value={val} onChange={e=>setAllocation(a=>({...a,[key]:+e.target.value}))} style={{width:"100%",accentColor:C.acc}}/></div>)}</div>
            </div>
            <div style={{position:"sticky",top:20}}>
              <div style={{...card,background:"#0d1f16",border:"1px solid #134e2a",marginBottom:14}}><div style={lbl}>Projected Total</div><div style={{fontSize:28,fontWeight:700,color:"#34d399"}}>€{Math.round(base+allocated).toLocaleString()}</div><div style={{fontSize:12,color:C.sub,marginTop:4}}>+€{allocated} · {((allocated/base)*100).toFixed(1)}% growth</div></div>
              <button onClick={getAdvice} disabled={chatLoading} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:chatLoading?"#1a2030":"linear-gradient(135deg,#0ea5e9,#22d3ee)",color:chatLoading?C.mut:"#0b0f1a",fontWeight:700,fontSize:13,cursor:chatLoading?"default":"pointer",fontFamily:"'DM Mono',monospace",letterSpacing:"0.04em",marginBottom:8}}>{chatLoading?"⟳ Thinking…":"✦ Get AI Advice on This Allocation →"}</button>
              <div style={{fontSize:11,color:C.mut,textAlign:"center",marginBottom:16}}>{msgCount>0?`Adds to your ongoing conversation (${msgCount} messages so far)`:"Starts a new conversation in the Advisor tab"}</div>
              <div style={card}>
                <div style={lbl}>Platform Fees Reference</div>
                {Object.entries(PLATFORM_FEE_INFO).map(([plat,info])=>(
                  <div key={plat} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.bdr}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:7,height:7,borderRadius:2,background:PLATFORM_COLORS[plat]||"#64748b"}}/>
                        <span style={{fontSize:12,fontWeight:700,color:C.text}}>{plat}</span>
                      </div>
                      <span style={{fontSize:12,color:C.acc,fontWeight:600}}>{info.rate}</span>
                    </div>
                    <div style={{fontSize:11,color:C.sub}}>{info.note}</div>
                  </div>
                ))}
                <div style={{fontSize:11,color:C.sub,paddingTop:2}}>ETF/fund annual fees (TER) are shown per position in the Portfolio tab. These are separate from transaction costs.</div>
              </div>

              {/* Profile card */}
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editingProfile?12:8}}>
                  <div style={lbl}>Your Profile</div>
                  <button onClick={()=>setEditingProfile(v=>!v)} style={{fontSize:11,color:C.acc,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{editingProfile?"done":"edit"}</button>
                </div>
                {editingProfile
                  ? <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[["residence","Residence"],["taxCountry","Taxes paid in"],["employment","Employment"],["extra","Additional context"]].map(([field,label])=>(
                        <div key={field}>
                          <div style={{fontSize:10,color:C.mut,marginBottom:3}}>{label.toUpperCase()}</div>
                          <input style={inp} value={profile[field]||""} onChange={e=>setProfile(p=>({...p,[field]:e.target.value}))} placeholder={field==="extra"?"e.g. married, 2 kids, retiring in 20 years…":""}/>
                        </div>
                      ))}
                    </div>
                  : <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {[["Residence",profile.residence],["Taxes",profile.taxCountry],["Employment",profile.employment],profile.extra&&["Context",profile.extra]].filter(Boolean).map(([label,val])=>(
                        <div key={label} style={{display:"flex",gap:8,fontSize:12}}>
                          <span style={{color:C.sub,minWidth:80}}>{label}</span>
                          <span style={{color:C.text}}>{val}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>
        </>}

        {tab==="breakdown"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
            {[{title:"By Region — Now",data:byRegion,colors:REGION_COLORS},{title:"By Region — After",data:projByRegion,colors:REGION_COLORS},{title:"By Type — Now",data:byType,colors:TYPE_COLORS},{title:"By Type — After",data:projByType,colors:TYPE_COLORS}].map(({title,data,colors})=>(
              <div key={title} style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:10,padding:16}}><div style={lbl}>{title}</div><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><Donut data={data} colors={colors} size={130} onClick={()=>setModal({title,data,colors})}/><Legend data={data} colors={colors}/></div></div>
            ))}
          </div>
          <div style={card}><div style={lbl}>By Platform</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{platforms.map(plat=>{const pv=positions.filter(p=>p.platform===plat).reduce((s,p)=>s+p.value,0);const pct=(pv/base)*100;return <div key={plat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:2,background:PLATFORM_COLORS[plat]||"#64748b"}}/><span style={{fontSize:12,color:"#94a3b8"}}>{plat}</span></div><div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:C.sub}}>€{Math.round(pv).toLocaleString()}</span><span style={{fontSize:12,color:C.text,fontWeight:700,minWidth:36,textAlign:"right"}}>{pct.toFixed(1)}%</span></div></div><div style={{height:5,background:"#1e293b",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:PLATFORM_COLORS[plat]||"#64748b",borderRadius:2}}/></div></div>;})}
          </div></div>
        </>}

        {tab==="portfolio"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,color:savedFlash?"#34d399":C.mut,transition:"color 0.3s"}}>{savedFlash?"✓ Saved":"Tap a value to edit"}</span>
              <button onClick={refreshPrices} disabled={pricesLoading} style={{fontSize:11,color:pricesLoading?C.sub:C.acc,background:"none",border:`1px solid ${C.bdr}`,borderRadius:6,padding:"3px 9px",cursor:pricesLoading?"default":"pointer",fontFamily:"inherit"}}>{pricesLoading?"⟳ fetching…":"⟳ live prices"}</button>
            </div>
            <button onClick={()=>setShowAddForm(f=>!f)} style={{fontSize:11,fontWeight:700,color:C.acc,background:"none",border:`1px solid ${C.acc}22`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit"}}>{showAddForm?"cancel":"+ add position"}</button>
          </div>
          {showAddForm&&(()=>{
            const match = ASSET_LOOKUP[newPos.name.trim().toUpperCase()];
            const ticker = match?.ticker || newPos.ticker;
            const existingPos = newPos.name.trim() ? positions.find(p =>
              (ticker && p.ticker && p.ticker.toUpperCase() === ticker.toUpperCase()) ||
              p.name.toLowerCase() === newPos.name.trim().toLowerCase()
            ) : null;
            const lotsCount = existingPos?.lots?.length || (existingPos ? 1 : 0);
            return <div style={{...card,borderColor:"#1e3a5f",background:"#0d1826",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={lbl}>{existingPos ? "Add Purchase" : "New Position"}</div>
                {existingPos
                  ? <span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>+ adding to existing {existingPos.name} · {lotsCount} purchase{lotsCount!==1?"s":""} so far</span>
                  : match&&<span style={{fontSize:10,color:"#34d399",fontWeight:700}}>✓ {match.name} recognized — {match.type} · {match.region} · {match.platform}</span>}
              </div>

              {/* Primary fields */}
              {(()=>{
                const isCrypto = (match?.type||newPos.type)==="crypto";
                const coinLabel = newPos.name?.trim().toUpperCase().split(" ")[0] || "coins";
                const hasDirectUnits = parseFloat(newPos.units) > 0;
                return <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div>
                      <div style={{fontSize:10,color:C.mut,marginBottom:4}}>TICKER / NAME</div>
                      <input autoFocus style={{...inp,borderColor:match?"#134e2a":C.bdr}} placeholder="e.g. NVDA, BTC, SXR8" value={newPos.name}
                        onChange={e=>{
                          const raw=e.target.value;
                          const m=ASSET_LOOKUP[raw.trim().toUpperCase()];
                          if(m) setNewPos(p=>({...p,name:m.name,ticker:m.ticker||"",type:m.type,region:m.region,platform:m.platform,annualFee:m.annualFee}));
                          else setNewPos(p=>({...p,name:raw}));
                        }}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:C.mut,marginBottom:4}}>PLATFORM</div>
                      <select style={{...inp,cursor:"pointer"}} value={newPos.platform} onChange={e=>setNewPos(p=>({...p,platform:e.target.value}))}>
                        {[...Object.keys(PLATFORM_COLORS),"Other"].map(pl=><option key={pl}>{pl}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:C.mut,marginBottom:4}}>AMOUNT INVESTED (€)</div>
                      <input style={inp} type="number" placeholder="e.g. 500" value={newPos.invested} onChange={e=>setNewPos(p=>({...p,invested:e.target.value}))}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:C.mut,marginBottom:4}}>{isCrypto?`${coinLabel} OWNED`:"SHARES OWNED"}</div>
                      <input style={{...inp,borderColor:hasDirectUnits?"#134e2a":C.bdr}} type="number" placeholder={isCrypto?"e.g. 0.5":"e.g. 3.2"} step="any" value={newPos.units||""} onChange={e=>setNewPos(p=>({...p,units:e.target.value}))}/>
                      <div style={{fontSize:9,color:hasDirectUnits?"#34d399":C.sub,marginTop:3}}>
                        {hasDirectUnits?"✓ will use live price to track value":"from Binance / broker — skips date lookup"}
                      </div>
                    </div>
                    <div style={{gridColumn:"span 2"}}>
                      <div style={{fontSize:10,color:C.mut,marginBottom:4}}>DATE OF PURCHASE {hasDirectUnits&&<span style={{color:C.sub,fontWeight:400}}>(optional — for record only)</span>}</div>
                      <input style={inp} type="date" value={newPos.purchaseDate} onChange={e=>setNewPos(p=>({...p,purchaseDate:e.target.value}))}/>
                      {!hasDirectUnits&&newPos.ticker&&newPos.purchaseDate&&<div style={{fontSize:9,color:"#34d399",marginTop:3}}>✓ {isCrypto?"coins":"shares"} will be calculated from price on that date</div>}
                      {!hasDirectUnits&&(!newPos.ticker||!newPos.purchaseDate)&&<div style={{fontSize:9,color:C.sub,marginTop:3}}>or enter {isCrypto?"coins":"shares"} owned above to skip this</div>}
                    </div>
                  </div>
                </>;
              })()}

              {/* Customize toggle — only for new positions */}
              {!existingPos&&<>
                <button onClick={()=>setShowAdvancedAdd(v=>!v)} style={{fontSize:11,color:C.sub,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:showAdvancedAdd?10:14}}>
                  {showAdvancedAdd?"▾ hide details":"▸ customize type, region, fees"}
                </button>
                {showAdvancedAdd&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10,paddingTop:8,borderTop:`1px solid ${C.bdr}`}}>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:4}}>TYPE</div><select style={{...inp,cursor:"pointer"}} value={newPos.type} onChange={e=>setNewPos(p=>({...p,type:e.target.value}))}>{["stock","etf","crypto","fund","cash"].map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:4}}>REGION</div><select style={{...inp,cursor:"pointer"}} value={newPos.region} onChange={e=>setNewPos(p=>({...p,region:e.target.value}))}>{["US","EU","EM","Crypto","Global"].map(r=><option key={r}>{r}</option>)}</select></div>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:4}}>ANNUAL FEE %</div><input style={inp} type="number" placeholder="0" step="0.01" value={newPos.annualFee} onChange={e=>setNewPos(p=>({...p,annualFee:e.target.value}))}/></div>
                  <div style={{gridColumn:"span 3"}}><div style={{fontSize:10,color:C.mut,marginBottom:4}}>TICKER (for price fetch)</div><input style={inp} placeholder="e.g. AAPL, BTC, SXR8.DE" value={newPos.ticker||""} onChange={e=>setNewPos(p=>({...p,ticker:e.target.value}))}/></div>
                </div>}
              </>}

              {addError&&<div style={{fontSize:11,color:"#f87171",background:"#2d1010",border:"1px solid #4e1313",borderRadius:6,padding:"8px 12px",marginBottom:10}}>{addError}</div>}

              <button onClick={addPosition} disabled={addingPos} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:addingPos?"#1a2030":C.acc,color:addingPos?C.mut:"#0b0f1a",fontWeight:700,fontSize:12,cursor:addingPos?"default":"pointer",fontFamily:"inherit"}}>
                {addingPos?"⟳ Fetching historical price…":existingPos?`Add Purchase to ${existingPos.name}`:"Add Position"}
              </button>
            </div>;
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"start"}}>
          {platforms.map(plat=>{
            const platPos=positions.filter(p=>p.platform===plat);
            const platTotal=platPos.reduce((s,p)=>s+p.value,0);
            return <div key={plat} style={{...card,marginBottom:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:9,height:9,borderRadius:2,background:PLATFORM_COLORS[plat]||"#64748b"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:C.text}}>{plat}</span>
                </div>
                <span style={{fontSize:12,color:C.acc,fontWeight:700}}>€{Math.round(platTotal).toLocaleString()}</span>
              </div>
              {platPos.map(pos=>{
                const invested = pos.invested ?? pos.value;
                const lp = priceData[pos.id];
                const isAuto = !!(lp && pos.units > 0);
                const noTicker = !pos.ticker;
                const hasPartialLots = pos.lots && pos.lots.some(l => !l.units) && pos.lots.some(l => l.units > 0);
                // current value: auto if units+price, else manual only for no-ticker assets
                const currentValue = isAuto
                  ? Math.round(pos.units * lp.priceEur * 100) / 100
                  : noTicker ? pos.value : invested;
                const pnl = currentValue - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                const isCrypto = pos.type==="crypto";
                const coinLabel = pos.name.trim().toUpperCase().split(" ")[0];
                const isEditing = editingId===pos.id;
                const fmtUnits = pos.units>0 ? (pos.units<0.01?pos.units.toFixed(6):pos.units<1?pos.units.toFixed(4):pos.units<100?parseFloat(pos.units.toFixed(4)):Math.round(pos.units)) : null;

                return <div key={pos.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.bdr}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      {/* Name row — click to expand edit */}
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={()=>{
                          if(isEditing){setEditingId(null);}
                          else{
                            const lots = pos.lots && pos.lots.length>0
                              ? pos.lots.map(l=>({invested:l.invested?.toString()||"",units:l.units?.toString()||"",date:l.date||""}))
                              : [{invested:invested.toString(),units:pos.units?.toString()||"",date:""}];
                            setEditLots(lots);
                            setEditVal(pos.value.toString());
                            setEditingId(pos.id);
                            setEditingInvestedId(null);
                          }
                        }} style={{fontSize:12,color:C.text,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>
                          {pos.name}
                          <span style={{fontSize:10,color:C.acc,marginLeft:5}}>{isEditing?"▾":"✎"}</span>
                        </button>
                        {!isEditing&&fmtUnits&&<span style={{fontSize:10,color:C.sub}}>{fmtUnits} {coinLabel}</span>}
                        {!isEditing&&pos.lots?.length>1&&<span style={{fontSize:10,color:C.sub}}>{pos.lots.length} purchases{hasPartialLots&&<span style={{color:"#f59e0b"}}> · partial</span>}</span>}
                      </div>
                      <div style={{fontSize:10,color:C.sub,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{color:TYPE_COLORS[pos.type]||C.sub}}>{pos.type}</span>
                        <span>· {pos.region}</span>
                        {pos.annualFee>0&&<span style={{color:"#f59e0b",background:"#1a150a",border:"1px solid #3d2e0a",borderRadius:3,padding:"0 4px"}}>{pos.annualFee}% p.a.</span>}
                        {lp&&<span style={{color:lp.change24h>=0?"#34d399":"#f87171",background:lp.change24h>=0?"#0a1f14":"#1f0a0a",border:`1px solid ${lp.change24h>=0?"#134e2a":"#4e1313"}`,borderRadius:3,padding:"0 4px",whiteSpace:"nowrap"}}>€{lp.priceEur<10?lp.priceEur.toFixed(4):lp.priceEur<100?lp.priceEur.toFixed(2):Math.round(lp.priceEur).toLocaleString()}/{isCrypto?"coin":"unit"} {lp.change24h>=0?"+":""}{lp.change24h.toFixed(1)}%</span>}
                        {noTicker&&pos.type==="fund"&&<span style={{color:C.sub,fontSize:10,fontStyle:"italic"}}>BBVA → Valor total</span>}
                        {noTicker&&pos.type==="cash"&&<span style={{color:C.sub,fontSize:10,fontStyle:"italic"}}>manual</span>}
                      </div>

                      {/* ── Expanded edit panel ── */}
                      {isEditing&&<div style={{marginTop:8,padding:10,background:"#0d1826",border:`1px solid #1e3a5f`,borderRadius:8}}>
                        {/* Hint per platform */}
                        {pos.platform==="eToro"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:9,color:C.acc}}>eToro → Invertido: put Unidades + avg price ($)</span>
                          {editLots.length>1&&<button onClick={()=>{
                            const totalInv = editLots.reduce((s,l)=>s+parseFloat(l.invested||0),0);
                            const totalU = editLots.reduce((s,l)=>s+(parseFloat(l.units)||0),0);
                            setEditLots([{invested:totalInv.toString(),units:totalU?totalU.toString():"",date:""}]);
                          }} style={{fontSize:10,color:"#f59e0b",background:"none",border:`1px solid #3d2e0a`,borderRadius:4,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>merge into 1</button>}
                        </div>}
                        {pos.platform==="Binance"&&<div style={{fontSize:9,color:C.acc,marginBottom:8}}>Binance → Spot wallet → coin amount + cost basis</div>}
                        {pos.type==="fund"&&<div style={{fontSize:9,color:C.acc,marginBottom:8}}>BBVA → Aportaciones + Valor total de la inversión</div>}

                        {/* Per-lot editing */}
                        {editLots.map((lot,li)=>(
                          <div key={li} style={{display:"grid",gridTemplateColumns:noTicker?"1fr 1fr":pos.platform==="eToro"?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:editLots.length>1?6:8,paddingBottom:editLots.length>1&&li<editLots.length-1?6:0,borderBottom:editLots.length>1&&li<editLots.length-1?`1px solid ${C.bdr}`:"none"}}>
                            {editLots.length>1&&<div style={{gridColumn:noTicker?"span 2":pos.platform==="eToro"?"span 4":"span 3",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:10,color:C.acc,fontWeight:700}}>Purchase {li+1}</span>
                              <button onClick={()=>setEditLots(ls=>ls.filter((_,i)=>i!==li))} style={{fontSize:11,color:"#ef4444",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>remove</button>
                            </div>}
                            <div>
                              <div style={{fontSize:10,color:C.mut,marginBottom:3}}>{pos.type==="fund"?"APORTACIONES (€)":"INVESTED (€)"}</div>
                              <input type="number" value={lot.invested} onChange={e=>setEditLots(ls=>ls.map((l,i)=>i===li?{...l,invested:e.target.value}:l))} style={{...inp,padding:"4px 7px"}}/>
                            </div>
                            {!noTicker&&<div>
                              <div style={{fontSize:10,color:C.mut,marginBottom:3}}>{isCrypto?`${coinLabel} BOUGHT`:"UNIDADES"}</div>
                              <input type="number" step="any" value={lot.units} onChange={e=>{
                                const newUnits=e.target.value;
                                setEditLots(ls=>ls.map((l,i)=>{
                                  if(i!==li)return l;
                                  const updated={...l,units:newUnits};
                                  // Auto-calc invested from units × avgPrice if avgPrice is set
                                  if(l.avgPrice&&parseFloat(newUnits)>0) updated.invested=(parseFloat(newUnits)*parseFloat(l.avgPrice)).toFixed(2);
                                  return updated;
                                }));
                              }} placeholder={isCrypto?"e.g. 0.5":"e.g. 14.8428"} style={{...inp,padding:"4px 7px"}}/>
                            </div>}
                            {!noTicker&&pos.platform==="eToro"&&<div>
                              <div style={{fontSize:10,color:C.mut,marginBottom:3}}>AVG PRICE ($)</div>
                              <input type="number" step="any" value={lot.avgPrice||""} onChange={e=>{
                                const price=e.target.value;
                                setEditLots(ls=>ls.map((l,i)=>{
                                  if(i!==li)return l;
                                  const updated={...l,avgPrice:price};
                                  if(parseFloat(l.units)>0&&parseFloat(price)>0) updated.invested=(parseFloat(l.units)*parseFloat(price)).toFixed(2);
                                  return updated;
                                }));
                              }} placeholder="e.g. 153.43" style={{...inp,padding:"4px 7px"}}/>
                            </div>}
                            <div>
                              <div style={{fontSize:10,color:C.mut,marginBottom:3}}>DATE</div>
                              <input type="date" value={lot.date} onChange={e=>setEditLots(ls=>ls.map((l,i)=>i===li?{...l,date:e.target.value}:l))} style={{...inp,padding:"4px 7px"}}/>
                            </div>
                          </div>
                        ))}

                        {/* Fund/cash: current value field */}
                        {noTicker&&<div style={{marginBottom:8}}>
                          <div style={{fontSize:10,color:C.mut,marginBottom:3}}>CURRENT VALUE (€)</div>
                          <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...inp,padding:"4px 7px",width:120}}/>
                        </div>}

                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <button onClick={()=>{
                            const lots = editLots.map(l=>({date:l.date||null,invested:parseFloat(l.invested)||0,units:parseFloat(l.units)||null}));
                            const totalInvested = lots.reduce((s,l)=>s+l.invested,0);
                            const knownUnits = lots.filter(l=>l.units!=null&&l.units>0);
                            const totalUnits = knownUnits.length>0?knownUnits.reduce((s,l)=>s+l.units,0):null;
                            const v = parseFloat(editVal);
                            setPositions(ps=>ps.map(p=>{
                              if(p.id!==pos.id) return p;
                              return {...p, lots, invested:totalInvested, units:totalUnits, value:noTicker&&!isNaN(v)&&v>=0?v:totalInvested};
                            }));
                            setEditingId(null);flash();
                          }} style={{padding:"5px 14px",background:C.acc,border:"none",borderRadius:5,color:"#0b0f1a",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
                          <button onClick={()=>setEditingId(null)} style={{padding:"5px 12px",background:"none",border:`1px solid ${C.bdr}`,borderRadius:5,color:C.mut,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        </div>
                      </div>}
                    </div>

                    {/* Right side — value display */}
                    {!isEditing&&<div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <div style={{textAlign:"right"}}>
                        {isAuto
                          ? <div style={{fontSize:14,fontWeight:700,color:C.text}}>€{currentValue.toLocaleString()}<span style={{fontSize:9,color:"#34d399",marginLeft:4}}>live</span></div>
                          : <div style={{fontSize:14,fontWeight:700,color:C.text}}>€{currentValue.toLocaleString()}</div>
                        }
                        <div style={{fontSize:10,marginTop:2,display:"flex",gap:5,justifyContent:"flex-end",alignItems:"center"}}>
                          <span style={{color:C.sub}}>{pos.type==="fund"?"aportaciones":"paid"} €{Math.round(invested).toLocaleString()}</span>
                          {pnl!==0&&<span style={{color:pnl>=0?"#34d399":"#f87171"}}>{pnl>=0?"+":""}{Math.round(pnl)}€ ({pnlPct.toFixed(1)}%)</span>}
                        </div>
                      </div>
                      <button onClick={()=>deletePosition(pos.id)} style={{fontSize:14,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:"2px 4px",lineHeight:1}}>×</button>
                    </div>}
                    {isEditing&&<button onClick={()=>deletePosition(pos.id)} style={{fontSize:14,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:"2px 4px",lineHeight:1,alignSelf:"flex-start"}}>×</button>}
                  </div>
                </div>;
              })}
            </div>;
          })}
          </div>
        </>}

        {tab==="research"&&<>
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20,alignItems:"start"}}>
            <div style={card}><div style={lbl}>Topics</div><div style={{fontSize:11,color:C.sub,marginBottom:12}}>AI-powered · ~10s · separate from advisor</div>{RESEARCH_PRESETS.map(p=><button key={p.id} onClick={()=>runResearch(p)} disabled={resLoading} style={{width:"100%",padding:"10px 12px",marginBottom:8,borderRadius:8,textAlign:"left",border:researchId===p.id?`1px solid ${C.acc}`:`1px solid ${C.bdr}`,background:researchId===p.id?"#0f2231":C.surf,color:researchId===p.id?C.acc:"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{p.label}</button>)}</div>
            <div style={{background:"#0d1117",border:`1px solid ${C.bdr}`,borderRadius:10,padding:24,minHeight:200}}>
              {!resLoading&&!researchText&&<div style={{color:C.sub,fontSize:12}}>Select a topic to the left to run a research query.</div>}
              {resLoading&&<span style={{color:C.sub}}>⟳ Thinking…</span>}
              {!resLoading&&researchText&&<Markdown text={researchText}/>}
            </div>
          </div>
        </>}

        {tab==="ask"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:11,color:C.mut}}>{msgCount>0?<span style={{color:"#34d399"}}>✓ {msgCount} message{msgCount!==1?"s":""} · always saved</span>:<span>Your advisor remembers everything across sessions</span>}</div>
            {msgCount>0&&<button onClick={clearChat} style={{fontSize:11,color:"#ef4444",background:"none",border:"1px solid #3d1515",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>clear all</button>}
          </div>

          <div style={{background:"#0d1117",border:`1px solid ${C.bdr}`,borderRadius:10,padding:chatMessages.length>0?16:20,marginBottom:12,minHeight:300,maxHeight:"calc(100vh - 320px)",overflowY:"auto"}}>
            {chatMessages.length===0&&!chatLoading&&(
              <div style={{color:C.sub,fontSize:12,lineHeight:1.8}}>
                <div style={{color:C.acc,fontWeight:700,marginBottom:12}}>Your personal investment advisor</div>
                <div>✦ Go to <strong style={{color:C.text}}>Allocate</strong> → <strong style={{color:C.text}}>Get AI Advice</strong> to analyse a proposed investment</div>
                <div style={{marginTop:6}}>✦ Or just ask anything below — your portfolio is always in context</div>
                <div style={{marginTop:6}}>✦ Every message is saved across sessions</div>
                <div style={{marginTop:6}}>✦ After advice, tap <strong style={{color:C.text}}>Apply to Portfolio</strong> to pre-fill changes</div>
              </div>
            )}
            {chatMessages.map((m,i)=>(
              <div key={i} style={{marginBottom:18,display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{fontSize:10,color:C.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{m.role==="user"?"You":"Advisor"}</div>
                <div style={{maxWidth:"92%",padding:"12px 14px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.role==="user"?"#1e3a5f":"#131f30",color:m.role==="user"?"#bae6fd":"#cbd5e1",fontSize:13,lineHeight:1.65}}>
                  {m.role==="user"?<span style={{whiteSpace:"pre-wrap"}}>{m.content}</span>:<Markdown text={m.content}/>}
                </div>
                {/* Apply button appears after every advisor message */}
                {m.role==="assistant" && i===chatMessages.length-1 && !chatLoading && (
                  <button
                    onClick={extractChanges}
                    disabled={extracting}
                    style={{marginTop:8,padding:"7px 14px",borderRadius:8,border:`1px solid ${C.acc}44`,background:extracting?"#0d1117":"#0a1f2e",color:extracting?C.mut:C.acc,fontSize:11,fontWeight:600,cursor:extracting?"default":"pointer",fontFamily:"'DM Mono',monospace",alignSelf:"flex-start",transition:"all 0.15s"}}
                  >
                    {extracting?"⟳ Reading advice…":"⊕ Apply to Portfolio"}
                  </button>
                )}
              </div>
            ))}
            {chatLoading&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",marginBottom:14}}>
                <div style={{fontSize:10,color:C.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>Advisor</div>
                <div style={{padding:"12px 14px",borderRadius:"12px 12px 12px 2px",background:"#131f30",color:C.mut,fontSize:13}}>thinking…</div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          <div style={{display:"flex",gap:8}}>
            <input style={{flex:1,background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"11px 13px",color:C.text,fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder="Ask anything about your portfolio…" disabled={chatLoading}/>
            <button onClick={sendChat} disabled={chatLoading} style={{padding:"11px 18px",background:chatLoading?C.bdr:C.acc,border:"none",borderRadius:8,color:"#0b0f1a",fontWeight:700,fontSize:14,cursor:chatLoading?"default":"pointer",fontFamily:"'DM Mono',monospace"}}>→</button>
          </div>
        </>}

      </div>

      {modal&&<ChartModal {...modal} onClose={()=>setModal(null)}/>}
      {applyChanges&&<ApplyModal changes={applyChanges} positions={positions} onApply={applyToPortfolio} onClose={()=>setApplyChanges(null)}/>}
    </div>
  );
}
