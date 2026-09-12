import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const money = (n:number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

export function MetricCard({ label, value, delta, tone="default", note }: { label:string; value:number; delta?:number; tone?:"default"|"good"|"warn"; note?:string }) {
  return <article className={`metric-card ${tone}`}>
    <div className="metric-head"><span>{label}</span>{typeof delta === "number" && <span className={`delta ${delta>=0?"up":"down"}`}>{delta>=0?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {Math.abs(delta)}%</span>}</div>
    <strong>{money(value)}</strong>
    {note && <small>{note}</small>}
  </article>
}
