# CoreOS Hub

Internal dashboard for Core Automations LLC - a comprehensive automation agency management system.

## Features

- **Dashboard** - Overview of clients, projects, audit requests, and recent activity
- **Clients Management** - Full CRUD operations for client management
- **Projects Management** - Project tracking with client associations
- **Audit Requests Inbox** - Handle incoming audit requests from marketing website
- **System Builder** - AI-powered automation system design using Claude
- **Settings** - User profile and security settings

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: ShadCN/UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coreos-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
ALLOWED_EMAILS=user@example.com
```

5. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL from `supabase/schema.sql`

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following tables:

- `clients` - Client information
- `projects` - Project details linked to clients
- `audits` - Audit request submissions
- `system_builds` - AI-generated system designs

See `supabase/schema.sql` for the complete schema.

## Authentication

Authentication is handled through Supabase Auth with email/password. Access is restricted to whitelisted emails configured in the `ALLOWED_EMAILS` environment variable.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected routes with sidebar
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── audits/
│   │   ├── system-builder/
│   │   └── settings/
│   ├── api/             # API routes
│   ├── auth/            # Auth callback
│   └── login/           # Login page
├── components/
│   ├── layout/          # Layout components
│   └── ui/              # ShadCN UI components
├── lib/
│   ├── supabase/        # Supabase clients
│   └── utils.ts         # Utility functions
└── types/               # TypeScript types
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `ALLOWED_EMAILS` | Comma-separated list of allowed emails |

## License

Private - Core Automations LLC
