import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Users, Calendar, Lock } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const severityColor: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export default function AcceleratorDashboard() {
  const { role } = useRole();
  const { workspaceId } = useWorkspace();
  const isLimited = role === "mentor";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", workspaceId],
    enabled: !!workspaceId && !!supabase,
    queryFn: async () => {
      if (!supabase || !workspaceId) return null;

      const [cohortsRes, startupsRes, reviewsRes] = await Promise.all([
        supabase.from("cohorts").select("id, name, status").eq("workspace_id", workspaceId),
        supabase
          .from("startups")
          .select("id, name, cohort_id, revenue, burn_multiple, runway_months, status")
          .eq("workspace_id", workspaceId),
        supabase
          .from("startup_reviews")
          .select("id, reviewer, review_date, startups(name)")
          .eq("workspace_id", workspaceId)
          .order("review_date", { ascending: true })
          .limit(5),
      ]);

      const cohorts = cohortsRes.data ?? [];
      const startups = startupsRes.data ?? [];
      const reviews = reviewsRes.data ?? [];

      const startupsByCohort = new Map<string, number>();
      const revenueByCohort = new Map<string, number>();
      for (const s of startups) {
        if (s.cohort_id) {
          startupsByCohort.set(s.cohort_id, (startupsByCohort.get(s.cohort_id) ?? 0) + 1);
          revenueByCohort.set(s.cohort_id, (revenueByCohort.get(s.cohort_id) ?? 0) + (s.revenue ?? 0));
        }
      }

      const cohortSummary = cohorts.map((c) => ({
        name: c.name,
        startups: startupsByCohort.get(c.id) ?? 0,
        health: "good",
      }));

      const revenueData = cohorts.map((c) => ({
        cohort: c.name,
        revenue: revenueByCohort.get(c.id) ?? 0,
      }));

      const flaggedStartups = startups
        .filter((s) => s.status !== "on-track" || (s.burn_multiple ?? 0) > 3 || (s.runway_months ?? 999) < 4)
        .slice(0, 6)
        .map((s) => ({
          name: s.name,
          issue:
            (s.burn_multiple ?? 0) > 3
              ? "Burn multiple > 3x"
              : (s.runway_months ?? 999) < 4
                ? "Runway < 4 months"
                : `Status: ${s.status}`,
          severity: s.status === "critical" || (s.runway_months ?? 999) < 4 ? "high" : "medium",
        }));

      const upcomingReviews = reviews.map((r) => ({
        startup: r.startups?.name ?? "Startup",
        date: new Date(r.review_date).toLocaleDateString(),
        reviewer: r.reviewer ?? "Unassigned",
      }));

      const activeCohorts = cohorts.filter((c) => c.status === "active").length;
      const totalRevenue = startups.reduce((sum, s) => sum + (s.revenue ?? 0), 0);

      return {
        cohortSummary,
        revenueData,
        flaggedStartups,
        upcomingReviews,
        activeCohorts,
        totalStartups: startups.length,
        avgRevenue: startups.length ? totalRevenue / startups.length : 0,
      };
    },
  });

  const cohortSummary = data?.cohortSummary ?? [];
  const revenueData = data?.revenueData ?? [];
  const flaggedStartups = data?.flaggedStartups ?? [];
  const upcomingReviews = data?.upcomingReviews ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Portfolio health overview</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="Filter by cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Cohorts</p>
              <Users className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold mt-1">{isLoading ? "..." : data?.activeCohorts ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{isLoading ? "Loading..." : `${data?.totalStartups ?? 0} startups total`}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Revenue</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `$${Math.round((data?.avgRevenue ?? 0) / 1000)}K`}</p>
            <p className="text-xs text-muted-foreground mt-1">From startup records</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Flagged</p>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold mt-1">{isLoading ? "..." : flaggedStartups.length}</p>
            <p className="text-xs text-destructive mt-1">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming Reviews</p>
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold mt-1">{isLoading ? "..." : upcomingReviews.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Scheduled in data</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue Distribution by Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="cohort" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(24, 44%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cohortSummary.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.startups} startups</p>
                </div>
                <Badge variant={c.health === "good" ? "outline" : "destructive"} className="text-xs">
                  {c.health === "good" ? "Healthy" : "At Risk"}
                </Badge>
              </div>
            ))}
            {cohortSummary.length === 0 && (
              <p className="text-xs text-muted-foreground">No cohorts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Flagged Startups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLimited ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Lock className="h-5 w-5 mb-2" />
                <p className="text-sm">Restricted view</p>
              </div>
            ) : (
              <div className="space-y-2">
                {flaggedStartups.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.issue}</p>
                    </div>
                    <Badge className={`text-xs ${severityColor[s.severity]}`}>{s.severity}</Badge>
                  </div>
                ))}
                {flaggedStartups.length === 0 && (
                  <p className="text-xs text-muted-foreground">No flagged startups.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Upcoming Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReviews.map((r) => (
                <div key={`${r.startup}-${r.date}`} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{r.startup}</p>
                    <p className="text-xs text-muted-foreground">{r.reviewer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
              ))}
              {upcomingReviews.length === 0 && (
                <p className="text-xs text-muted-foreground">No upcoming reviews.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
