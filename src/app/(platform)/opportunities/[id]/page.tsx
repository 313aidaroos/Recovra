import { notFound } from "next/navigation";
import { OpportunityDetail } from "@/components/recovery/opportunity-detail";
import { opportunities } from "@/lib/platform-data";

export function generateStaticParams() {
  return opportunities.map(({ id }) => ({ id }));
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = opportunities.find((item) => item.id === id);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity}/>;
}
