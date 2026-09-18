import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project brief — SkillBridge" },
      {
        name: "description",
        content: "Read the full freelance brief and submit your proposal on SkillBridge.",
      },
      { property: "og:title", content: "Project brief — SkillBridge" },
      { property: "og:description", content: "Full brief details and live proposal form." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("7");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, category, description, budget, timeline, status, created_at, client_id, profiles(full_name, university)",
        )
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: myApplication } = useQuery({
    queryKey: ["my-application", projectId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, bid_amount")
        .eq("project_id", projectId)
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        project_id: projectId,
        student_id: user!.id,
        cover_letter: coverLetter,
        bid_amount: Number(bidAmount || 0),
        estimated_days: Number(estimatedDays || 7),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposal submitted!");
      setCoverLetter("");
      setBidAmount("");
      void queryClient.invalidateQueries({ queryKey: ["my-application", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-muted-foreground">This project no longer exists.</p>
          <Button asChild className="mt-4">
            <Link to="/projects">Back to job board</Link>
          </Button>
        </div>
      </div>
    );
  }

  const client = (project as { profiles?: { full_name?: string; university?: string } }).profiles;
  const isOwner = user?.id === project.client_id;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <Link
            to="/projects"
            className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All projects
          </Link>
          <Badge variant="secondary">{project.category}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{project.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Posted by {client?.full_name ?? "a client"}
            {project.status !== "open" ? ` · ${project.status.replace("_", " ")}` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-semibold">{formatMoney(project.budget)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="font-semibold">{project.timeline ?? "Flexible"}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-sm mt-8 max-w-none">
            <h2 className="text-lg font-semibold">Project brief</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{project.description}</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit a proposal</CardTitle>
              <CardDescription>
                Tell the client why you're the right student for this brief.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in as a student to apply for this project.
                  </p>
                  <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                    Sign in to apply
                  </Button>
                </div>
              )}

              {user && isOwner && (
                <p className="text-sm text-muted-foreground">
                  This is your project. Proposals appear in your dashboard.
                </p>
              )}

              {user && !isOwner && profile?.role === "client" && (
                <p className="text-sm text-muted-foreground">
                  Client accounts can't apply. Create a student account to send proposals.
                </p>
              )}

              {user && !isOwner && profile?.role === "student" && myApplication && (
                <p className="text-sm text-muted-foreground">
                  You applied with a bid of {formatMoney(myApplication.bid_amount)} · status{" "}
                  <span className="font-medium text-foreground">{myApplication.status}</span>.
                </p>
              )}

              {user && !isOwner && profile?.role === "student" && !myApplication && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    apply.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="bid">Your bid (USD)</Label>
                    <Input
                      id="bid"
                      type="number"
                      min="1"
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="days">Estimated days</Label>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      required
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover letter</Label>
                    <Textarea
                      id="cover"
                      rows={6}
                      required
                      placeholder="Share relevant coursework, projects or links…"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={apply.isPending}>
                    {apply.isPending ? "Sending…" : "Send proposal"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
