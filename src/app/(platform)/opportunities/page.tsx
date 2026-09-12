import { Download, Plus } from "lucide-react";
import { OpportunitiesTable } from "@/components/recovery/opportunities-table";
import { PageHeader } from "@/components/ui/page-header";

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Recovery operations"
        title="Recovery Opportunities"
        description="Prioritize, verify, and move evidence-backed findings from detection to realized value."
        actions={<><button className="secondary-button tall"><Download size={15}/> Export</button><button className="primary-button"><Plus size={15}/> New review</button></>}
      />
      <OpportunitiesTable/>
    </>
  );
}
