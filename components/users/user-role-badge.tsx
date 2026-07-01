import {
  USER_ROLE_LABELS,
  type UserRoleKey,
} from "@/lib/users/roles";
import { cn } from "@/lib/utils";

const roleStyles: Record<UserRoleKey, string> = {
  admin: "bg-kartex-navy/10 text-kartex-navy border-kartex-navy/20",
  salesperson: "bg-kartex-gold/15 text-kartex-navy border-kartex-gold/30",
  warehouse: "bg-blue-50 text-blue-900 border-blue-200",
  driver: "bg-muted text-muted-foreground border-border",
};

type UserRoleBadgeProps = {
  role: UserRoleKey;
  className?: string;
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        roleStyles[role],
        className,
      )}
    >
      {USER_ROLE_LABELS[role]}
    </span>
  );
}
