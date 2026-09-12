import { ArrowRight, BarChart3, Building2, CalendarRange, Download, FileBarChart2, Gauge, Layers3, ShieldCheck, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

const reports = [
  [FileBarChart2,"Executive Savings Report","CFO summary of monitored spend, verified recovery, realized value, and prevention."],
  [BarChart3,"Spend Analysis","Analyze spend movement by vendor, category, location, and module."],
  [TrendingUp,"Recovery Performance","Measure recovery rate, cycle time, claim outcomes, and owner performance."],
  [Building2,"Vendor Analysis","Compare discrepancy patterns, renewals, contract coverage, and anomaly risk."],
  [Layers3,"Module Performance","Track findings and value across logistics, cloud, SaaS, telecom, AP, and more."],
  [ShieldCheck,"Prevented Spend","Quantify controls that stopped future waste before payment or renewal."],
  [Gauge,"Recovery Pipeline","Review value progressing from detected to verified, submitted, and realized."],
  [CalendarRange,"Monthly CFO Report","A board-ready monthly summary with source-linked financial outcomes."],
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader eyebrow="Financial reporting" title="Reports" description="Turn evidence-backed recovery activity into clear executive, vendor, and operational reporting." actions={<div className="range-tabs"><button>30D</button><button className="selected">Quarter</button><button>YTD</button></div>}/>
      <section className="report-feature">
        <div><span className="eyebrow">September executive brief</span><h2>$664,544 in total value protected</h2><p>Includes $481,904 in confirmed recoveries and $182,640 in future spend prevented. Sample workspace values are clearly separated from unverified opportunity.</p><div><button className="primary-button"><Download size={15}/> Export PDF</button><button className="secondary-button tall">Preview report <ArrowRight size={15}/></button></div></div>
        <div className="report-bars">{[68,54,82,47,72,91,64,78].map((height,index)=><span style={{height:`${height}%`}} key={index}/>)}</div>
      </section>
      <section className="report-grid">{reports.map(([Icon,title,description])=><article className="panel" key={title as string}><span><Icon size={20}/></span><h3>{title as string}</h3><p>{description as string}</p><button>Open report <ArrowRight size={14}/></button></article>)}</section>
    </>
  );
}
