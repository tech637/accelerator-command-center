import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useNavigate, useParams } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Brain, CheckCircle, Sparkles, Clock, Tag, MessageSquare, Lock,
} from "lucide-react";

const stageColors: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  screening: "bg-accent/10 text-accent",
  shortlisted: "bg-accent/20 text-accent",
  interview: "bg-primary/10 text-foreground",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function ApplicationReview() {
  const { applicationId } = useParams();
  const { workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canAccess } = useRole();
  const [score, setScore] = useState([5]);
  const [recommendation, setRecommendation] = useState("shortlist");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { data: application } = useQuery({
    queryKey: ["application-review", workspaceId, applicationId],
    enabled: !!workspaceId && !!applicationId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !applicationId) return null;
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("id", applicationId)
        .single();
      return data;
    },
  });
  const { data: history = [] } = useQuery({
    queryKey: ["application-history", workspaceId, application?.startup_id],
    enabled: !!workspaceId && !!application?.startup_id && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId || !application?.startup_id) return [];
      const { data } = await supabase
        .from("startup_reviews")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("startup_id", application.startup_id)
        .order("review_date", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });
  const saveReview = useMutation({
    mutationFn: async () => {
      if (!supabase || !workspaceId || !applicationId) return;
      const mappedStatus =
        recommendation === "accept"
          ? "accepted"
          : recommendation === "interview"
            ? "interview"
            : recommendation === "reject"
              ? "rejected"
              : recommendation === "shortlist"
                ? "shortlisted"
                : "screening";

      await supabase
        .from("applications")
        .update({
          score: score[0],
          notes,
          status: mappedStatus,
        })
        .eq("workspace_id", workspaceId)
        .eq("id", applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-review", workspaceId, applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["pipeline", workspaceId] });
    },
  });

  const canReview = canAccess(["admin", "program_manager", "mentor"]);
  const payloadEntries = useMemo(() => {
    if (!application?.payload || typeof application.payload !== "object" || Array.isArray(application.payload)) return [];
    return Object.entries(application.payload).map(([k, v]) => ({ question: k, answer: String(v) }));
  }, [application?.payload]);

  const tagOptions = ["Risk", "Strong Team", "Weak Traction", "Great Market", "Regulatory Concern", "Strong Revenue"];

  useEffect(() => {
    if (!application) return;
    setScore([application.score ?? 5]);
    setNotes(application.notes ?? "");
    if (application.status === "accepted") setRecommendation("accept");
    else if (application.status === "interview") setRecommendation("interview");
    else if (application.status === "rejected") setRecommendation("reject");
    else if (application.status === "shortlisted") setRecommendation("shortlist");
    else setRecommendation("hold");
  }, [application]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left: Application responses */}
      <div className="flex-1 overflow-auto border-r">
        <div className="p-6 space-y-6 max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{application?.startup_name ?? "Application"}</h1>
                <Badge className={`text-xs capitalize ${stageColors[application?.status ?? "applied"]}`}>{application?.status ?? "applied"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {application?.applicant_name ?? "Applicant"} · {application?.industry ?? "—"} · Applied{" "}
                {application?.date_applied ? new Date(application.date_applied).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Revenue", value: application?.revenue ? `$${Math.round(application.revenue / 1000)}K` : "—" },
              { label: "Stage", value: application?.stage ?? "—" },
              { label: "AI Fit", value: application?.ai_fit ?? "—" },
              { label: "Industry", value: application?.industry ?? "—" },
            ].map((stat) => (
              <Card key={stat.label} className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sections */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Submitted Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payloadEntries.map((a) => (
                <div key={a.question}>
                  <p className="text-xs font-medium text-muted-foreground">{a.question}</p>
                  <p className="text-sm mt-0.5">{a.answer}</p>
                </div>
              ))}
              {payloadEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">No structured payload submitted for this application.</p>
              )}
            </CardContent>
          </Card>

          {/* Stage change history */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{entry.reviewer ?? "Reviewer"}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{new Date(entry.review_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium">Score {entry.score ?? "—"}</p>
                      {entry.flags && <p className="text-xs text-muted-foreground mt-0.5">{entry.flags}</p>}
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-xs text-muted-foreground">No review history yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right: Review panel */}
      <div className="w-96 overflow-auto bg-card shrink-0">
        <div className="p-5 space-y-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Panel</p>

          {/* AI Analysis */}
          <Card className="shadow-sm border-accent/20 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> AI Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-success/10 text-success">{application?.ai_fit ?? "n/a"} fit</Badge>
                <span className="text-[10px] text-muted-foreground">Model-assisted summary</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                <p className="text-xs leading-relaxed">
                  {application?.notes || "Use this panel to write your own assessment and recommendation."}
                </p>
              </div>
              <div className="p-2 rounded-md bg-accent/10 border border-accent/20">
                <p className="text-xs font-medium text-accent flex items-center gap-1">
                  <Brain className="h-3 w-3" /> Suggested Decision
                </p>
                <p className="text-xs mt-1">
                  {application?.ai_fit
                    ? `Current AI fit is ${application.ai_fit}. Set score, notes, and recommendation, then submit.`
                    : "No AI insight is available yet for this application. Set score and recommendation manually."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Reviewer controls */}
          {canReview ? (
            <>
              {/* Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">Score</p>
                  <span className="text-lg font-bold">{score[0]}</span>
                </div>
                <Slider value={score} onValueChange={setScore} min={1} max={10} step={0.5} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tagOptions.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tags.includes(tag) ? "default" : "outline"}
                      className={`text-xs cursor-pointer ${tags.includes(tag) ? "bg-accent text-accent-foreground" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Internal Notes
                </p>
                <Textarea
                  placeholder="Add review notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm min-h-[80px]"
                />
              </div>

              {/* Recommendation */}
              <div>
                <p className="text-xs font-medium mb-2">Recommendation</p>
                <Select value={recommendation} onValueChange={setRecommendation}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="shortlist">Shortlist</SelectItem>
                    <SelectItem value="interview">Move to Interview</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-1"
                  onClick={() => saveReview.mutate()}
                  disabled={saveReview.isPending}
                >
                  <CheckCircle className="h-4 w-4" /> Submit Review
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Lock className="h-5 w-5 mb-2" />
              <p className="text-sm font-medium">Review restricted</p>
              <p className="text-xs mt-1">You don't have permission to review applications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
