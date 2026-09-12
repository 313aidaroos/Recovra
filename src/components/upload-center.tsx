"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FolderSearch2,
  PlugZap,
  ScanLine,
  UploadCloud,
} from "lucide-react";
import { documents } from "@/lib/platform-data";
import { PageHeader } from "./ui/page-header";
import { StatusBadge } from "./ui/status-badge";

export function UploadCenter() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);

  function add(list: FileList | null) {
    if (!list) return;
    setFiles((previous) => [...previous, ...Array.from(list).map((file) => file.name)]);
  }

  return (
    <>
      <PageHeader eyebrow="Document intelligence" title="Document Center" description="Upload, classify, extract, match, and audit the source evidence behind every recovery." actions={<button className="primary-button" onClick={() => input.current?.click()}><UploadCloud size={15}/> Upload documents</button>}/>
      <section className="document-stats">
        {[["248","Documents monitored"],["18","Processing"],["7","Need review"],["96.4%","Extraction confidence"]].map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>
      <section className="ingest-grid">
        <article className="panel upload-panel">
          <div className="dropzone" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); add(event.dataTransfer.files); }}>
            <UploadCloud size={34}/><h3>Drop source documents here</h3><p>PDF, CSV, XLSX, images, JSON, purchase orders, BOLs and usage exports</p><button>Select files</button>
            <input ref={input} type="file" multiple hidden onChange={(event) => add(event.target.files)}/>
          </div>
          {files.length > 0 && <div className="uploaded-list">{files.map((file, index) => <div key={`${file}-${index}`}><span className="file-icon">{file.endsWith(".csv") || file.endsWith(".xlsx") ? <FileSpreadsheet size={17}/> : <FileText size={17}/>}</span><div><strong>{file}</strong><small>Demo queue · uploaded locally · persistence connector pending</small></div><CheckCircle2 size={18}/></div>)}</div>}
        </article>
        <article className="panel extraction-flow">
          <span className="panel-kicker">Processing pipeline</span><h3>From source to evidence</h3><p>Each stage preserves document provenance and confidence. Low-confidence fields stop for human review.</p>
          <div className="pipeline-steps">
            <div><span><UploadCloud size={17}/></span><div><strong>Uploaded</strong><small>Immutable source + SHA-256</small></div><i/></div>
            <div><span><ScanLine size={17}/></span><div><strong>Parsing & extraction</strong><small>Fields retain page/row location</small></div><i/></div>
            <div><span><FolderSearch2 size={17}/></span><div><strong>Matching & audit</strong><small>Vendor, contract and activity linked</small></div><i/></div>
            <div><span><PlugZap size={17}/></span><div><strong>Evidence ready</strong><small>Calculation trace generated</small></div></div>
          </div>
        </article>
      </section>
      <section className="panel document-table">
        <div className="panel-title-row"><div><span className="panel-kicker">Processing queue</span><h3>Recent documents</h3></div><div className="range-tabs"><button className="selected">All</button><button>Needs review</button><button>Failed</button></div></div>
        <div className="table-wrap"><table><thead><tr><th>Document</th><th>Type</th><th>Vendor</th><th>Status</th><th>Uploaded</th><th>Source detail</th><th>Action</th></tr></thead><tbody>
          {documents.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><StatusBadge>{row[3]}</StatusBadge></td><td>{row[4]}</td><td>{row[5]}</td><td><button className="table-action">{row[3] === "Needs Review" ? "Review fields" : "Open"}</button></td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
