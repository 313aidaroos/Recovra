"use client";
import { useMemo, useState } from "react";
import { Check, Plus, Search, ShieldCheck } from "lucide-react";
import { modules } from "@/lib/modules";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

export function ModuleDirectory(){
 const [q,setQ]=useState(""); const [category,setCategory]=useState("All");
 const [active,setActive]=useState<string[]>(["logistics","3pl","ai","cloud","saas","ap"]);
 const categories=["All",...Array.from(new Set(modules.map(m=>m.category)))];
 const list=useMemo(()=>modules.filter(m=>(category==="All"||m.category===category)&&(`${m.name} ${m.description} ${m.examples.join(" ")}`.toLowerCase().includes(q.toLowerCase()))),[q,category]);
 return <>
  <section className="page-heading"><div><span className="eyebrow"><ShieldCheck size={14}/> Universal Recovery Engine</span><h1>Industry Modules</h1><p>Activate vertical packs that reuse the same evidence, reconciliation, recovery, and prevention backbone.</p></div><span className="sample-label">Opportunity values are demo data</span></section>
  <div className="directory-toolbar"><label><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search modules or findings…"/></label><div className="category-scroll">{categories.map(c=><button className={c===category?"selected":""} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div></div>
  <section className="module-grid">{list.map(({slug,name,category,description,icon:Icon,status,examples,found})=><article className="module-card" key={slug}>
    <div className="module-card-top"><span className="module-icon"><Icon size={22}/></span><span className={`module-status ${status}`}>{status}</span></div>
    <span className="card-category">{category}</span><h3>{name}</h3><p>{description}</p>
    <div className="example-chips">{examples.map(x=><span key={x}>{x}</span>)}</div>
    <div className="module-card-foot"><div><small>Sample opportunity</small><strong>{found?money(found):"Connect data"}</strong></div><button className={active.includes(slug)?"module-active":""} onClick={()=>setActive(current=>current.includes(slug)?current.filter(item=>item!==slug):[...current,slug])}>{active.includes(slug)?<><Check size={12}/> Active</>:<><Plus size={12}/> Activate</>}</button></div>
  </article>)}</section>
 </>;
}
