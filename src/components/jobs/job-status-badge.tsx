import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING: { label: "待处理", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  PROCESSING: { label: "处理中", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  SUCCESS: { label: "成功", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  FAILED: { label: "失败", className: "bg-red-100 text-red-700 hover:bg-red-100" },
} as const;

export function JobStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  return <Badge className={cn("border-0", config.className)}>{config.label}</Badge>;
}
