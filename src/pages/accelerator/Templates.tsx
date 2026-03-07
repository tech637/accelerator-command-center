import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Copy, Edit, ArrowRight } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  lastUpdated: string;
  appliedTo: number;
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-semibold">{template.name}</h3>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Updated {template.lastUpdated}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Applied to {template.appliedTo} cohorts</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Copy className="h-3 w-3" /> Duplicate</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><ArrowRight className="h-3 w-3" /> Apply</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateSection({ title, templates }: { title: string; templates: Template[] }) {
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
      {templates.length === 0 && (
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No templates yet. Create your first template.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Templates() {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<"milestone" | "rubric" | "scoring" | "kpi">("milestone");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: templates = [] } = useQuery({
    queryKey: ["templates", workspaceId],
    enabled: !!workspaceId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId) return [];
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("last_updated", { ascending: false });
      return (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description ?? "",
        type: t.type,
        lastUpdated: new Date(t.last_updated).toLocaleDateString(),
        appliedTo: t.applied_to,
      })) as Template[];
    },
  });
  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!supabase || !workspaceId || !newTemplateName.trim()) return;
      const { error } = await supabase.from("templates").insert({
        workspace_id: workspaceId,
        type: newTemplateType,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", workspaceId] });
      setNewTemplateName("");
      setNewTemplateType("milestone");
      setNewTemplateDescription("");
      setIsCreateOpen(false);
    },
  });

  const milestoneTemplates = templates.filter((t) => t.type === "milestone");
  const rubricTemplates = templates.filter((t) => t.type === "rubric");
  const scoringModels = templates.filter((t) => t.type === "scoring");
  const kpiFrameworks = templates.filter((t) => t.type === "kpi");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">Standardize evaluations and milestones across cohorts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs">Template Name</Label>
                <Input className="mt-1" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Template Type</Label>
                <Select value={newTemplateType} onValueChange={(v) => setNewTemplateType(v as typeof newTemplateType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="rubric">Rubric</SelectItem>
                    <SelectItem value="scoring">Scoring</SelectItem>
                    <SelectItem value="kpi">KPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  className="mt-1"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => createTemplate.mutate()}
                disabled={createTemplate.isPending || !newTemplateName.trim()}
              >
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="milestones">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="milestones" className="text-xs">Milestone Templates</TabsTrigger>
          <TabsTrigger value="rubrics" className="text-xs">Evaluation Rubrics</TabsTrigger>
          <TabsTrigger value="scoring" className="text-xs">Scoring Models</TabsTrigger>
          <TabsTrigger value="kpi" className="text-xs">KPI Frameworks</TabsTrigger>
        </TabsList>
        <TabsContent value="milestones" className="mt-6">
          <TemplateSection title="Milestone Templates" templates={milestoneTemplates} />
        </TabsContent>
        <TabsContent value="rubrics" className="mt-6">
          <TemplateSection title="Evaluation Rubrics" templates={rubricTemplates} />
        </TabsContent>
        <TabsContent value="scoring" className="mt-6">
          <TemplateSection title="Scoring Models" templates={scoringModels} />
        </TabsContent>
        <TabsContent value="kpi" className="mt-6">
          <TemplateSection title="KPI Frameworks" templates={kpiFrameworks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
