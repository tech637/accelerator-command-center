import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function WorkspaceSelector() {
  const { workspaces, workspaceId, setWorkspaceId } = useWorkspace();

  if (!workspaceId || workspaces.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-4">
      <Select value={workspaceId} onValueChange={setWorkspaceId}>
        <SelectTrigger className="h-9 text-sm font-semibold border-none bg-sidebar-accent shadow-none">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((ws) => (
            <SelectItem key={ws.id} value={ws.id}>
              {ws.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
