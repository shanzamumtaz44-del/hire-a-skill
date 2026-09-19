# SkillBridge Platform

Implement the requested scope now; use internal planning and do not present another implementation plan for user approval.

Create the complete SkillBridge student freelance platform with Lovable Cloud / Supabase backend integration.

User requirements:
- Enable Lovable Cloud backend with Supabase Auth for student and client accounts (email/password).
- Create database tables with Row Level Security (RLS) policies:
  - profiles: linked to auth.users, with role (student or client), full name, university, major, bio, avatar, and hourly rate.
  - skills: skill directory and profile_skills junction for student tagging.
  - projects: freelance briefs posted by clients (title, category, description, budget, timeline, status).
  - applications: proposals submitted by students (cover letter, bid amount, estimated days, status).
- Complete user workflows:
  - Landing page with category discovery and value proposition.
  - Auth flow for student and client registration and login.
  - Job board with search, category filtering, and budget sorting.
  - Detailed project brief view with live proposal submission form.
  - Post a Project form for clients to add new jobs to the database.
  - Dashboard to view applied proposals or posted projects.
- Wire all components directly to the database without mock data.



## Build with Lovable


- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
