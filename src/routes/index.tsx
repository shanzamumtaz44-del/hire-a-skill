import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Briefcase, Clock, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, CATEGORY_BLURBS, formatMoney } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge — Paid freelance projects for students" },
      {
        name: "description",
        content:
          "SkillBridge is the campus marketplace where students win real freelance work and clients hire affordable student talent.",
      },
      { property: "og:title", content: "SkillBridge — Paid freelance projects for students" },
      {
        property: "og:description",
        content: "Browse student-friendly briefs, send proposals, and get paid for your skills.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: latest } = useQuery({
    queryKey: ["latest-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, category, budget, timeline, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-accent/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Badge variant="secondary" className="mb-5 gap-1">
            <Sparkles className="size-3" /> Built for university students
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Turn your coursework skills into <span className="text-primary">paid freelance work</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            SkillBridge connects students with clients who need design, code, writing and research
            done — small briefs, fair budgets, real experience for your portfolio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/projects">
                Find work <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Hire a student</Link>
            </Button>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Briefcase, label: "Real briefs", value: "Posted by clients" },
              { icon: Clock, label: "Short timelines", value: "Fits around classes" },
              { icon: BadgeCheck, label: "Student-first", value: "Set your own rate" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 text-primary" />
                <div>
                  <dt className="font-medium">{label}</dt>
                  <dd className="text-sm text-muted-foreground">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Explore by category</h2>
        <p className="mt-1 text-muted-foreground">Pick the lane that matches your degree.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.filter((c) => c !== "General").map((category) => (
            <Link
              key={category}
              to="/projects"
              search={{ category }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60 hover:bg-secondary/40"
            >
              <p className="font-medium group-hover:text-primary">{category}</p>
              <p className="mt-2 text-sm text-muted-foreground">{CATEGORY_BLURBS[category]}</p>
            </Link>
          ))}
        </div>
      </section>

      {latest && latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Freshly posted</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">See all</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {latest.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    {p.category}
                  </Badge>
                  <CardTitle className="text-base">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                      {p.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{formatMoney(p.budget)}</span>
                  <span>{p.timeline ?? "Flexible"}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
          SkillBridge — the campus freelance marketplace.
        </div>
      </footer>
    </div>
  );
}
