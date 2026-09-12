# Recovra Design System

## Personality
Premium, precise, calm, high-trust. A financial operations control room, not a crypto dashboard and not a generic blue SaaS template.

## Colors
- Background: near-black green `#07100D`
- Panel: `#0E1B16`
- Border: `#21362D`
- Primary recovery green: `#79E2A7`
- Success deep green: `#30BD78`
- Review amber: `#F2C66D`
- Risk red: `#F07E78`
- Primary text: `#EFF8F3`
- Muted text: `#8AA095`

## Status semantics
Green = verified/recovered/prevented.
Amber = pending/review/uncertain.
Red = leakage/high risk/rejected.
Blue should be rare and informational, not the core brand.

## Layout
Desktop command center uses compact left rail + sticky global search/top bar. Important money values above the fold. Tables are dense but readable. Evidence opens in a side panel/modal rather than navigating users away from the financial context.

## Interaction
- Hover should reveal additional certainty/action, not decorative motion.
- Filters preserve state in URL when real data is connected.
- Command palette searches vendor, invoice, finding, contract and recovery case.
- Charts must have accessible labels/tooltips.
- Mobile prioritizes metrics + opportunity queue; dense tables become cards.
