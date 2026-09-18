import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  role: "student" | "client";
  full_name: string;
  university: string | null;
  major: string | null;
  bio: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

async function ensureProfile(user: User): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, university, major, bio, avatar_url, hourly_rate")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      role: meta["role"] === "client" ? "client" : "student",
      full_name: meta["full_name"] ?? user.email?.split("@")[0] ?? "Member",
      university: meta["university"] ?? null,
      major: meta["major"] ?? null,
    })
    .select("id, role, full_name, university, major, bio, avatar_url, hourly_rate")
    .maybeSingle();

  return (created as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) {
        const p = await ensureProfile(nextSession.user);
        if (active) setProfile(p);
      } else {
        setProfile(null);
      }
      if (active) setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void load(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => load(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!session?.user) return;
    const p = await ensureProfile(session.user);
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
