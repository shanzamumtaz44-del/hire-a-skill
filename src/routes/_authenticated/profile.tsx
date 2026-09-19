import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SkillBridge" },
      {
        name: "description",
        content: "Update your SkillBridge profile, hourly rate and the skills clients can find you by.",
      },
      { property: "og:title", content: "Your profile — SkillBridge" },
      { property: "og:description", content: "Manage your student or client profile details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUniversity(profile.university ?? "");
    setMajor(profile.major ?? "");
    setBio(profile.bio ?? "");
    setRate(profile.hourly_rate ? String(profile.hourly_rate) : "");
  }, [profile]);

  const skills = useQuery({
    queryKey: ["all-skills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skills").select("id, name, category").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mySkills = useQuery({
    queryKey: ["my-skills", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_skills")
        .select("skill_id")
        .eq("profile_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.skill_id);
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          university: university || null,
          major: major || null,
          bio: bio || null,
          hourly_rate: rate ? Number(rate) : null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile saved");
      await refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSkill = useMutation({
    mutationFn: async ({ skillId, on }: { skillId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase
          .from("profile_skills")
          .insert({ profile_id: user!.id, skill_id: skillId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profile_skills")
          .delete()
          .eq("profile_id", user!.id)
          .eq("skill_id", skillId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-skills"] });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selected = new Set(mySkills.data ?? []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>
              This is what clients and students see next to your projects and proposals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="uni">University / organisation</Label>
                  <Input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Course / role</Label>
                  <Input id="major" value={major} onChange={(e) => setMajor(e.target.value)} />
                </div>
              </div>
              {profile?.role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly rate (USD)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="1"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="bio">About you</Label>
                <Textarea id="bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {profile?.role === "student" && (
          <Card>
            <CardHeader>
              <CardTitle>Your skills</CardTitle>
              <CardDescription>
                Tap a skill to add or remove it — clients filter the talent directory by these.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.data?.map((s) => {
                const on = selected.has(s.id);
                return (
                  <Badge
                    key={s.id}
                    variant={on ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:border-primary"
                    onClick={() => toggleSkill.mutate({ skillId: s.id, on: !on })}
                  >
                    {s.name}
                  </Badge>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
