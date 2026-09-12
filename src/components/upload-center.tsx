"use client";
import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, FileText, PlugZap, UploadCloud } from "lucide-react";

export function UploadCenter(){
 const input=useRef<HTMLInputElement>(null); const [files,setFiles]=useState<string[]>([]);
 function add(list:FileList|null){ if(!list)return; setFiles(prev=>[...prev,...Array.from(list).map(f=>f.name)]); }
 return <>
  <section className="page-heading"><div><span className="eyebrow"><PlugZap size={14}/> Data intake</span><h1>Give Recovra the evidence.</h1><p>Upload contracts, invoices, rate sheets and operational exports. Connectors can replace manual uploads later.</p></div></section>
  <section className="ingest-grid">
   <article className="panel upload-panel"><div className="dropzone" onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(e.dataTransfer.files)}}><UploadCloud size={34}/><h3>Drop files here</h3><p>PDF, CSV, XLSX, images or JSON</p><button>Select files</button><input ref={input} type="file" multiple hidden onChange={e=>add(e.target.files)}/></div>
   {files.length>0&&<div className="uploaded-list">{files.map((f,i)=><div key={f+i}><span className="file-icon">{f.endsWith('.csv')||f.endsWith('.xlsx')?<FileSpreadsheet size={17}/>:<FileText size={17}/>}</span><div><strong>{f}</strong><small>Demo queue · ready for extraction connector</small></div><CheckCircle2 size={18}/></div>)}</div>}</article>
   <article className="panel connector-panel"><span className="panel-kicker">Connector roadmap</span><h3>Connect the systems you already use</h3><p>Prioritize real connectors by signed customer demand, not by logo count.</p><div className="connector-list">{["ERP / AP","Parcel & freight","Cloud & AI","SaaS / identity","Payments","Telecom / utilities"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong><small>{i<2?'Priority':'Planned'}</small></div>)}</div></article>
  </section>
 </>;
}
