import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — SkillBridge" },
      {
        name: "description",
        content: "Track the proposals you've sent or the projects you've posted on SkillBridge.",
      },
      { property: "og:title", content: "Your dashboard — SkillBridge" },
      { property: "og:description", content: "Proposals and posted projects in one place." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const isClient = profile?.role === "client";
  const queryClient = useQueryClient();

  const applications = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user && !isClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, cover_letter, bid_amount, estimated_days, status, created_at, projects(id, title, category, budget)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = useQuery({
    queryKey: ["my-projects", user?.id],
    enabled: !!user && isClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, category, budget, timeline, status, created_at, applications(id, cover_letter, bid_amount, estimated_days, status, student_id, profiles(full_name, university, major))",
        )
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposal updated");
      void queryClient.invalidateQueries({ queryKey: ["my-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "Your dashboard"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isClient ? "Projects you've posted and the proposals they received." : "Proposals you've sent to clients."}
        </p>

        {(loading || applications.isLoading || projects.isLoading) && (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        )}

        {!isClient && applications.data && (
          <div className="mt-8 space-y-4">
            {applications.data.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-muted-foreground">You haven't applied to anything yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/projects">Browse open projects</Link>
                </Button>
              </div>
            )}
            {applications.data.map((a) => {
              const project = (a as { projects?: { id: string; title: string; category: string; budget: number } }).projects;
              return (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{project?.category}</Badge>
                      <Badge variant={a.status === "accepted" ? "default" : "outline"}>
                        {a.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {project ? (
                        <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                          {project.title}
                        </Link>
                      ) : (
                        "Project removed"
                      )}
                    </CardTitle>
                    <CardDescription>
                      Your bid {formatMoney(a.bid_amount)} · {a.estimated_days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{a.cover_letter}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isClient && projects.data && (
          <div className="mt-8 space-y-6">
            {projects.data.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-muted-foreground">You haven't posted a project yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/post-project">Post your first project</Link>
                </Button>
              </div>
            )}
            {projects.data.map((p) => {
              const apps =
                (p as {
                  applications?: Array<{
                    id: string;
                    cover_letter: string;
                    bid_amount: number;
                    estimated_days: number;
                    status: string;
                    profiles?: { full_name?: string; university?: string; major?: string };
                  }>;
                }).applications ?? [];
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{p.category}</Badge>
                      <Badge variant="outline">{p.status.replace("_", " ")}</Badge>
                    </div>
                    <CardTitle className="text-lg">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                        {p.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {formatMoney(p.budget)} · {p.timeline ?? "Flexible"} · {apps.length} proposal
                      {apps.length === 1 ? "" : "s"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {apps.length === 0 && (
                      <p className="text-sm text-muted-foreground">No proposals yet.</p>
                    )}
                    {apps.map((a) => (
                      <div key={a.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{a.profiles?.full_name ?? "Student"}</p>
                            <p className="text-xs text-muted-foreground">
                              {[a.profiles?.major, a.profiles?.university].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatMoney(a.bid_amount)} · {a.estimated_days} days
                          </p>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                          {a.cover_letter}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {a.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => decide.mutate({ id: a.id, status: "accepted" })}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => decide.mutate({ id: a.id, status: "rejected" })}
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <Badge variant={a.status === "accepted" ? "default" : "outline"}>
                              {a.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
