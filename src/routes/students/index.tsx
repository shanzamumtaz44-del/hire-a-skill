import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Student talent directory — SkillBridge" },
      {
        name: "description",
        content:
          "Browse student freelancers by skill, university and hourly rate, then invite them to your project.",
      },
      { property: "og:title", content: "Student talent directory — SkillBridge" },
      {
        property: "og:description",
        content: "Find student freelancers by skill, course and hourly rate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentDirectory,
});

type StudentRow = {
  id: string;
  full_name: string;
  university: string | null;
  major: string | null;
  bio: string | null;
  hourly_rate: number | null;
  profile_skills: { skills: { name: string } | null }[] | null;
};

function StudentDirectory() {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, university, major, bio, hourly_rate, profile_skills(skills(name))")
        .eq("role", "student")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as StudentRow[];
    },
  });

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((s) => s.profile_skills?.forEach((ps) => ps.skills && set.add(ps.skills.name)));
    return [...set].sort();
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      const names = s.profile_skills?.map((ps) => ps.skills?.name ?? "") ?? [];
      const matchesTerm =
        !term ||
        [s.full_name, s.university, s.major, s.bio, ...names]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      const matchesSkill = !skill || names.includes(skill);
      return matchesTerm && matchesSkill;
    });
  }, [data, q, skill]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Student talent</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "Loading students…" : `${filtered.length} students available for briefs.`}
        </p>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, course, university or skill…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {allSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={skill === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSkill(null)}
            >
              All skills
            </Badge>
            {allSkills.map((s) => (
              <Badge
                key={s}
                variant={skill === s ? "default" : "outline"}
                className="cursor-pointer transition-colors hover:border-primary"
                onClick={() => setSkill(skill === s ? null : s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}

          {!isLoading && filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">
              No students match this search yet.
            </p>
          )}

          {filtered.map((s) => (
            <Card key={s.id} className="transition-all hover:-translate-y-0.5 hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {s.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <CardTitle className="text-base">{s.full_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{s.major ?? "Student"}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="size-3.5" /> {s.university ?? "University student"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.profile_skills?.slice(0, 4).map((ps) =>
                    ps.skills ? (
                      <Badge key={ps.skills.name} variant="secondary" className="text-xs">
                        {ps.skills.name}
                      </Badge>
                    ) : null,
                  )}
                </div>
                <p className="text-sm font-semibold">
                  {s.hourly_rate ? `${formatMoney(s.hourly_rate)}/hr` : "Rate on request"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-6 text-center">
          <p className="font-medium">Need one of these students on your project?</p>
          <Button asChild className="mt-3">
            <Link to="/post-project">Post a project</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
