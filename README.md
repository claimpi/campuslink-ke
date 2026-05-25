# CampusLink KE 🎓

Kenya's premier student networking platform. Connect with students across Kenyan universities, join WhatsApp groups, and build your campus network.

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Database + Storage)

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/claimpi/campuslink-ke
cd campuslink-ke
npm install
```

### 2. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Get your Project URL and Anon Key from Settings → API

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Deploy to Vercel
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables
4. Deploy!

## Pages
- `/` — Homepage
- `/discover` — Browse Students
- `/groups` — WhatsApp Groups
- `/pricing` — Pricing
- `/login` — Login
- `/register` — Register
- `/admin` — Admin Dashboard
- `/profile/[id]` — Student Profile

## Payments
All payments via M-Pesa to **0790166252**. Admin approves manually.

## Contact
WhatsApp: [wa.me/254790166252](https://wa.me/254790166252)
