import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type EndpointStatus = "working" | "upstream-issue";

const STATUS_CONFIG: Record<
  EndpointStatus,
  { label: string; className: string }
> = {
  working: {
    label: "Working",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  "upstream-issue": {
    label: "Upstream Issue",
    className:
      "border-red-500/20 bg-red-500/10 text-red-400 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
  },
};

interface EndpointStatusBadgeProps {
  status: EndpointStatus;
}

export function EndpointStatusBadge({ status }: EndpointStatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "absolute top-3 right-3 pointer-events-none font-normal",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
