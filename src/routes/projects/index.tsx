import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, formatMoney } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

type ProjectSearch = { q: string; category: string; sort: "newest" | "budget_high" | "budget_low" };

export const Route = createFileRoute("/projects/")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    category: typeof search["category"] === "string" ? search["category"] : "all",
    sort:
      search["sort"] === "budget_high" || search["sort"] === "budget_low"
        ? search["sort"]
        : "newest",
  }),
  head: () => ({
    meta: [
      { title: "Student job board — SkillBridge" },
      {
        name: "description",
        content: "Search open freelance briefs by category and budget, and send a proposal today.",
      },
      { property: "og:title", content: "Student job board — SkillBridge" },
      { property: "og:description", content: "Open freelance briefs for university students." },
    ],
  }),
  component: JobBoard,
});

function JobBoard() {
  const { q, category, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/projects" });

  const setSearch = (patch: Partial<ProjectSearch>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["projects", q, category, sort],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("id, title, category, description, budget, timeline, created_at, profiles(full_name)")
        .eq("status", "open");

      if (category !== "all") query = query.eq("category", category);
      if (q.trim()) query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);

      query =
        sort === "budget_high"
          ? query.order("budget", { ascending: false })
          : sort === "budget_low"
            ? query.order("budget", { ascending: true })
            : query.order("created_at", { ascending: false });

      const { data, error } = await query.limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Open projects</h1>
        <p className="mt-1 text-muted-foreground">
          Briefs posted by clients looking for student freelancers.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search projects…"
              value={q}
              onChange={(e) => setSearch({ q: e.target.value })}
            />
          </div>
          <Select value={category} onValueChange={(v) => setSearch({ category: v })}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSearch({ sort: v as ProjectSearch["sort"] })}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="budget_high">Budget: high to low</SelectItem>
              <SelectItem value="budget_low">Budget: low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 space-y-4">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}

          {!isLoading && data?.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No projects match your filters yet.
            </p>
          )}

          {data?.map((p) => (
            <Card key={p.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{p.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {(p as { profiles?: { full_name?: string } }).profiles?.full_name ?? "Client"}
                  </span>
                </div>
                <CardTitle className="text-lg">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                    {p.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-semibold">{formatMoney(p.budget)}</span>
                  <span className="text-muted-foreground">{p.timeline ?? "Flexible"}</span>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="ml-auto font-medium text-primary hover:underline"
                  >
                    View brief
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
