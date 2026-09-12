import {
  Bot, Boxes, Building2, Cloud, Construction, CreditCard, Factory, HardHat,
  Hotel, Landmark, PackageCheck, RadioTower, Receipt, Server, ShoppingBag,
  Store, Truck, UtilityPole, Warehouse, type LucideIcon
} from "lucide-react";

export type RecovraModule = {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  status: "live" | "beta" | "planned";
  examples: string[];
  found: number;
};

export const modules: RecovraModule[] = [
  { slug:"logistics", name:"Logistics", category:"Supply Chain", description:"Freight, parcel, surcharges, weights, zones and service failures.", icon:Truck, status:"live", examples:["Fuel/accessorial mismatch","DIM & weight","Duplicate charges"], found:91320 },
  { slug:"3pl", name:"3PL & Warehouse", category:"Supply Chain", description:"Storage, pick/pack, receiving, returns and activity reconciliation.", icon:Warehouse, status:"beta", examples:["Storage mismatch","Pick/pack overbilling","Duplicate activity"], found:39200 },
  { slug:"fleet", name:"Fleet", category:"Operations", description:"Fuel cards, tolls, rentals, maintenance and vehicle-level leakage.", icon:PackageCheck, status:"planned", examples:["Ghost vehicles","Fuel anomalies","Post-return rentals"], found:14800 },
  { slug:"ai", name:"AI Spend", category:"Technology", description:"Models, tokens, agents, enterprise seats and AI vendor contracts.", icon:Bot, status:"beta", examples:["Runaway agents","Inactive seats","Model cost routing"], found:82410 },
  { slug:"cloud", name:"Cloud", category:"Technology", description:"Cloud infrastructure, data platforms, commitments and egress.", icon:Cloud, status:"beta", examples:["Idle compute","Unused commitments","Egress anomalies"], found:68400 },
  { slug:"saas", name:"SaaS", category:"Technology", description:"Licenses, renewals, usage and overlapping software contracts.", icon:Server, status:"beta", examples:["Inactive seats","Duplicate tools","Renewal uplift"], found:71290 },
  { slug:"telecom", name:"Telecom", category:"Technology", description:"Mobile, fiber, circuits, VoIP, SIMs and site connectivity.", icon:RadioTower, status:"planned", examples:["Ghost lines","Closed-site billing","Plan mismatch"], found:43810 },
  { slug:"payments", name:"Payments", category:"Finance", description:"Merchant processing, gateway, settlement and contractual fee checks.", icon:CreditCard, status:"planned", examples:["Markup mismatch","Unexpected fees","Pricing drift"], found:35600 },
  { slug:"ap", name:"Procurement & AP", category:"Finance", description:"Universal PO, contract, receipt, invoice and credit reconciliation.", icon:Receipt, status:"beta", examples:["Duplicate invoice","Price variance","Unapplied credits"], found:128964 },
  { slug:"ecommerce", name:"Ecommerce", category:"Commerce", description:"Marketplace, fulfillment, returns, carrier and storage leakage.", icon:ShoppingBag, status:"planned", examples:["FBA/storage","Returns mismatch","Marketplace fees"], found:28750 },
  { slug:"manufacturing", name:"Manufacturing", category:"Industry", description:"Supplier, material, PO, equipment and service-contract recovery.", icon:Factory, status:"planned", examples:["PO price variance","Missed rebates","Unreceived goods"], found:51600 },
  { slug:"distribution", name:"Distribution", category:"Industry", description:"Wholesale purchasing, warehouse, delivery and supplier credits.", icon:Boxes, status:"planned", examples:["Supplier credits","Volume rebates","Delivery charges"], found:33700 },
  { slug:"construction", name:"Construction", category:"Industry", description:"Materials, equipment, subcontractors, labor and change-order checks.", icon:HardHat, status:"planned", examples:["Rental overrun","Labor rate","Change orders"], found:22140 },
  { slug:"utilities", name:"Utilities", category:"Facilities", description:"Electric, gas, water, waste and multi-location rate validation.", icon:UtilityPole, status:"planned", examples:["Rate class","Closed-site bill","Meter mismatch"], found:24910 },
  { slug:"property", name:"Property", category:"Facilities", description:"Facilities vendors, maintenance, landscaping, HVAC and waste.", icon:Building2, status:"planned", examples:["Unperformed service","Duplicate maintenance","Escalator mismatch"], found:19800 },
  { slug:"hospitality", name:"Hospitality", category:"Multi-location", description:"Hotels and restaurants across food, platforms, utilities and services.", icon:Hotel, status:"planned", examples:["Supplier pricing","Platform commissions","Unused service"], found:17100 },
  { slug:"retail", name:"Retail", category:"Multi-location", description:"Location-level utilities, telecom, shipping, cleaning and maintenance.", icon:Store, status:"planned", examples:["Closed-location billing","Duplicate vendors","Shipping leakage"], found:21350 },
  { slug:"enterprise", name:"Enterprise Control", category:"Platform", description:"ERP-connected spend monitoring and prevent-before-pay controls.", icon:Landmark, status:"planned", examples:["Pre-payment hold","Renewal control","Cross-module leakage"], found:0 },
];
