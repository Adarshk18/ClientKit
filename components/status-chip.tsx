import type { DocStatus } from "@/lib/types";
import { statusLabel } from "@/lib/document-state";

const STYLES: Record<DocStatus, string> = {
  draft: "text-muted",
  sent: "text-ink",
  viewed: "text-muted",
  signed: "text-stamp",
  payment_sent: "text-stamp",
  paid: "text-stamp",
  expired: "text-[#7a4b12]",
  void: "text-muted",
};

export function StatusChip({ status }: { status: DocStatus }) {
  return (
    <span className={`text-[12px] tracking-wide ${STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
