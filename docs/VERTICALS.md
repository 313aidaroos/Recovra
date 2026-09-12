# Vertical Packs

Recovra uses a **Universal Recovery Engine**. Vertical packs define document types, operational truth, charge taxonomies, calculation rules and recovery playbooks.

## 1. Logistics & Parcel
Inputs: carrier invoices, contracts/rate cards, BOLs, manifests, tracking events, shipment dimensions/weights.
Findings: duplicate charges, DIM/weight errors, zone/rate mismatch, fuel/accessorial errors, late-service refunds, residential/address corrections, reclass/reweigh, minimum charge issues.

## 2. 3PL / Warehousing
Inputs: 3PL invoices, storage agreements, WMS inventory/activity.
Findings: pallet/bin storage mismatch, pick/pack overbilling, receiving/returns errors, duplicate activity, kitting fees, minimums, account fees.

## 3. Ocean / Air / Drayage
Inputs: freight invoices, booking/arrival data, contracts, container/chassis records.
Findings: detention/demurrage, chassis, wait time, port/storage, documentation/handling, fuel/security and route charges.

## 4. Fleet
Inputs: fuel cards, tolls, maintenance, rental/lease, telematics.
Findings: duplicate fuel/tolls, invalid vehicle charges, maintenance pricing, post-return rental fees, anomalous fuel usage.

## 5. AI Spend
Inputs: provider invoices, token/usage exports, enterprise seat lists, model logs.
Findings: inactive seats, overlapping tools, runaway agents, expensive model misuse, missing credits/discounts, contract-rate mismatch, anomalous consumption.

## 6. Cloud / Data Infrastructure
Inputs: AWS/Azure/GCP/cloud invoices, metering exports, commitments, tags.
Findings: idle/oversized resources, unused commitments, egress anomalies, abandoned environments, storage waste, contracted price mismatch.

## 7. SaaS
Inputs: contracts, invoices, SSO/SCIM or admin usage exports, employee roster.
Findings: inactive seats, duplicate subscriptions, incorrect tier, post-termination seats, missed volume discounts, renewal uplifts outside terms.

## 8. Telecom
Inputs: carrier bills, line inventory, contracts, HR/device inventory.
Findings: ghost lines, unused circuits/SIMs, roaming, plan mismatch, discount expiry, duplicate services, old locations.

## 9. Payments / Merchant Fees
Inputs: processor statements, pricing agreements, settlement/transaction files.
Findings: markup mismatch, unexpected gateway/monthly fees, duplicate fees, rate changes, chargeback/admin fees, pricing-plan drift.

## 10. Ecommerce / Marketplaces
Inputs: Amazon/marketplace settlements, FBA/3PL, carrier, returns, ad invoices.
Findings: fulfillment/storage discrepancies, fee/category mismatch, return inconsistencies, logistics leakage, duplicate services.

## 11. Manufacturing
Inputs: POs, supplier contracts, invoices, receiving, BOM/usage, freight, equipment/service contracts.
Findings: price/quantity mismatch, missed rebates, supplier surcharge errors, unreceived goods, freight leakage, equipment/service overbilling.

## 12. Distribution / Wholesale
Inputs: supplier agreements, POs, invoices, warehouse and delivery records.
Findings: contract price variance, volume rebate misses, freight, fuel, warehouse, supplier credit and delivery discrepancies.

## 13. Construction
Inputs: subcontractor agreements, change orders, POs, time/equipment records, invoices.
Findings: rental days after return, material quantity/price mismatch, unsupported change orders, duplicate invoices, labor-rate variance, disposal/delivery fees.

## 14. Utilities / Energy
Inputs: electric/gas/water/waste bills, tariffs/contracts, meter/location data.
Findings: meter/location mismatch, rate-class issues, demand anomalies, closed-site billing, contract-rate mismatch, duplicate service.

## 15. Property / Facilities
Inputs: vendor agreements, service logs, invoices, property/location registry.
Findings: unperformed service, closed property billing, duplicate maintenance, contract escalator mismatch, HVAC/elevator/landscaping/waste leakage.

## 16. Hospitality / Restaurants
Inputs: food/service vendor invoices, delivery platforms, utilities, linen, waste, POS/merchant contracts.
Findings: supplier price mismatch, commission/processor variance, duplicate/unused services, site-level anomalies.

## 17. Retail / Multi-location
Inputs: location registry, utilities, internet, security, cleaning, shipping, maintenance, POS and software invoices.
Findings: closed-location billing, price drift, duplicate vendor services, telecom/SaaS waste and logistics leakage.

## 18. Procurement / AP
Inputs: ERP/AP invoices, contracts, POs, receipts, vendor master and credits.
Findings: duplicate invoice/vendor, price/quantity mismatch, missing PO/receipt, discount/rebate misses, unauthorized fees, unapplied credits, contract violations.

## 19. Healthcare Administration (non-clinical)
Inputs: facility/vendor contracts, supplies, telecom, software, facilities and logistics invoices.
Findings: general vendor/AP leakage only. Clinical billing/coding or patient-care decisions are outside the default product without specialized compliance and domain controls.
