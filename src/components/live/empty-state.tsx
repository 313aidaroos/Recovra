import Link from "next/link";
import { UploadCloud } from "lucide-react";

export function EmptyState({ title, description, actionHref = "/documents", actionLabel = "Upload documents" }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="panel empty-state">
      <span className="empty-icon"><UploadCloud size={22}/></span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={actionHref} className="primary-button">{actionLabel}</Link>
    </section>
  );
}
