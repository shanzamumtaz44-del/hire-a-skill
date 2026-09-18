CREATE TYPE public.app_role AS ENUM ('student', 'client');
CREATE TYPE public.project_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL DEFAULT '',
  university TEXT,
  major TEXT,
  bio TEXT,
  avatar_url TEXT,
  hourly_rate NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);

CREATE TABLE public.profile_skills (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, skill_id)
);
GRANT SELECT, INSERT, DELETE ON public.profile_skills TO authenticated;
GRANT SELECT ON public.profile_skills TO anon;
GRANT ALL ON public.profile_skills TO service_role;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile skills viewable by everyone" ON public.profile_skills FOR SELECT USING (true);
CREATE POLICY "Users add own skills" ON public.profile_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users remove own skills" ON public.profile_skills FOR DELETE TO authenticated USING (auth.uid() = profile_id);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL DEFAULT '',
  budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  timeline TEXT,
  status public.project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Clients insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = client_id);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL DEFAULT '',
  bid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_days INTEGER NOT NULL DEFAULT 7,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Project owners view applications" ON public.applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = applications.project_id AND p.client_id = auth.uid()));
CREATE POLICY "Students submit own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own applications" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Project owners update applications" ON public.applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = applications.project_id AND p.client_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = applications.project_id AND p.client_id = auth.uid()));
CREATE POLICY "Students delete own applications" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.skills (name, category) VALUES
  ('React', 'Web Development'),
  ('Next.js', 'Web Development'),
  ('Python', 'Data & AI'),
  ('Data Analysis', 'Data & AI'),
  ('Machine Learning', 'Data & AI'),
  ('UI Design', 'Design'),
  ('Figma', 'Design'),
  ('Illustration', 'Design'),
  ('Copywriting', 'Writing'),
  ('Technical Writing', 'Writing'),
  ('SEO', 'Marketing'),
  ('Social Media', 'Marketing'),
  ('Video Editing', 'Video & Audio'),
  ('Motion Graphics', 'Video & Audio'),
  ('Tutoring', 'Academic Support'),
  ('Research Assistance', 'Academic Support');