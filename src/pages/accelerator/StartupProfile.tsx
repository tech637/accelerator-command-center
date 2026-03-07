import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Lock } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const milestoneStatusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success",
  "on-track": "bg-accent/10 text-accent",
  "at-risk": "bg-destructive/10 text-destructive",
};

export default function StartupProfile() {
  const { startupId } = useParams();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canAccess } = useRole();
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewScore, setReviewScore] = useState("3");
  const [reviewFlags, setReviewFlags] = useState("");
  const [reviewActions, setReviewActions] = useState("");
  const { data: startup } = useQuery({
    queryKey: ["startup", workspaceId, startupId],
    enabled: !!workspaceId && !!startupId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !startupId) return null;
      const { data } = await supabase
        .from("startups")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("id", startupId)
        .maybeSingle();
      return data;
    },
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ["startup-milestones", workspaceId, startupId],
    enabled: !!workspaceId && !!startupId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !startupId) return [];
      const { data } = await supabase
        .from("startup_milestones")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["startup-reviews", workspaceId, startupId],
    enabled: !!workspaceId && !!startupId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !startupId) return [];
      const { data } = await supabase
        .from("startup_reviews")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("startup_id", startupId)
        .order("review_date", { ascending: false });
      return data ?? [];
    },
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["startup-documents", workspaceId, startupId],
    enabled: !!workspaceId && !!startupId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !startupId) return [];
      const { data } = await supabase
        .from("startup_documents")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const addReview = useMutation({
    mutationFn: async () => {
      if (!supabase || !workspaceId || !startupId) return;
      await supabase.from("startup_reviews").insert({
        workspace_id: workspaceId,
        startup_id: startupId,
        score: Number(reviewScore),
        flags: reviewFlags || null,
        actions: reviewActions || null,
        reviewer: "Reviewer",
      });
    },
    onSuccess: () => {
      setReviewScore("3");
      setReviewFlags("");
      setReviewActions("");
      queryClient.invalidateQueries({ queryKey: ["startup-reviews", workspaceId, startupId] });
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/accelerator/cohorts")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{startup?.name ?? "Startup"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{startup?.stage ?? "—"}</Badge>
            <Badge variant="outline" className="text-xs">{startup?.industry ?? "—"}</Badge>
            <Badge className="text-xs bg-warning/10 text-warning">{startup?.status ?? "on-track"}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
          <TabsTrigger value="milestones" className="text-xs">Milestones & OKRs</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs">Review Logs</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Founder Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Name</span><span className="text-sm font-medium">{startup?.founder_name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Email</span><span className="text-sm">{startup?.founder_email ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Industry</span><span className="text-sm">{startup?.industry ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Stage</span><span className="text-sm">{startup?.stage ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Location</span><span className="text-sm">{startup?.location ?? "—"}</span></div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Traction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Revenue</span><span className="text-sm font-medium">{startup?.revenue ? `$${Math.round(startup.revenue / 1000)}K` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Runway</span><span className="text-sm">{startup?.runway_months ? `${startup.runway_months} months` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Burn Multiple</span><span className="text-sm">{startup?.burn_multiple ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Team Size</span><span className="text-sm">{startup?.team_size ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Last Review</span><span className="text-sm">{startup?.last_review_date ? new Date(startup.last_review_date).toLocaleDateString() : "—"}</span></div>
              </CardContent>
            </Card>
          </div>
          {/* KPI Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: startup?.revenue ? `$${Math.round(startup.revenue / 1000)}K` : "—", change: "" },
              { label: "Runway", value: startup?.runway_months ? `${startup.runway_months} mo` : "—", change: "" },
              { label: "Burn Multiple", value: startup?.burn_multiple ? `${startup.burn_multiple}x` : "—", change: "" },
              { label: "Team Size", value: String(startup?.team_size ?? "—"), change: "" },
            ].map((kpi) => (
              <Card key={kpi.label} className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-lg font-bold mt-1">{kpi.value}</p>
                  {kpi.change && <p className="text-xs text-success mt-0.5">{kpi.change}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financials Tab (READ-ONLY) */}
        <TabsContent value="financials" className="space-y-6 mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Financial metrics are now sourced from startup records. Add additional finance integrations as needed.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4 mt-6">
          {milestones.map((m) => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium">{m.title}</h3>
                    <Badge className={`text-xs ${milestoneStatusStyles[m.status]}`}>
                      {m.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{m.owner ?? "Owner"}</span>
                    <span>Due: {m.due_date ? new Date(m.due_date).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
                <Progress value={m.progress} className="h-1.5" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{m.progress}%</span>
                  {canAccess(["admin", "program_manager", "mentor"]) && (
                    <span className="text-xs text-muted-foreground">Collaborative comments can be added in review logs.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {milestones.length === 0 && (
            <Card className="shadow-sm"><CardContent className="p-4 text-sm text-muted-foreground">No milestones yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4 mt-6">
          {canAccess(["admin", "program_manager", "mentor"]) && (
            <Card className="shadow-sm">
              <CardContent className="p-4 grid gap-3 md:grid-cols-4">
                <input className="border rounded px-2 py-1 text-sm" value={reviewScore} onChange={(e) => setReviewScore(e.target.value)} />
                <input className="border rounded px-2 py-1 text-sm md:col-span-1" value={reviewFlags} onChange={(e) => setReviewFlags(e.target.value)} placeholder="Flags" />
                <input className="border rounded px-2 py-1 text-sm md:col-span-1" value={reviewActions} onChange={(e) => setReviewActions(e.target.value)} placeholder="Actions" />
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => addReview.mutate()}>Add Review</Button>
              </CardContent>
            </Card>
          )}


          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Reviewer</TableHead>
                  <TableHead className="text-xs font-semibold">Score</TableHead>
                  <TableHead className="text-xs font-semibold">Red Flags</TableHead>
                  <TableHead className="text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{new Date(r.review_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{r.reviewer ?? "Reviewer"}</TableCell>
                    <TableCell className="text-sm">{r.score ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.flags}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.actions}</TableCell>
                  </TableRow>
                ))}
                {reviews.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-xs text-muted-foreground">No reviews yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Documents uploaded to Supabase metadata table.</span>
          </div>
          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">File Name</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm font-medium">{d.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.type ?? "—"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.size ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-xs text-muted-foreground">No documents yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
