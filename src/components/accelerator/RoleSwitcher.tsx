import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  program_manager: "Program Manager",
  mentor: "Mentor",
};

export function RoleSwitcher() {
  const { role } = useRole();
  return (
    <div className="px-4 py-2 border-t border-sidebar-border">
      <p className="text-xs text-muted-foreground mb-1 font-medium">Your role</p>
      <Badge variant="outline" className="text-xs">
        {roleLabel[role] ?? role}
      </Badge>
    </div>
  );
}
