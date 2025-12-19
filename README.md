# Christmas Planner

A comprehensive web application for planning and organizing everything related to Christmas - from wishlists to calendars, all shareable with family and friends.

## Features

- **User Authentication** - Secure login and signup with email/password
- **Wishlist Management** - Create and share wishlists with product links and images
- **Shared Calendars** - Plan events, set reminders, and collaborate with family
- **Notifications** - Email and in-app reminders for important events
- **Image Uploads** - Upload product images for wishlist items
- **Family Collaboration** - Share wishlists and calendars, mark items as purchased

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Notifications**: Resend for emails, Supabase Edge Functions for scheduling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier)
- A Resend account (free tier) for email notifications

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd christmas-planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Supabase and Resend credentials.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Setting Up Supabase

1. Create a new project at [https://app.supabase.com](https://app.supabase.com)
2. Run the database migrations (coming soon)
3. Copy your project URL and anon key to `.env.local`
4. Set up Row Level Security policies (instructions coming soon)

## Project Structure

```
christmas-planner/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions
└── public/               # Static assets
```

## Development Roadmap

- [x] Project setup
- [ ] Database schema and migrations
- [ ] Authentication pages
- [ ] Wishlist features
- [ ] Calendar features
- [ ] Notification system
- [ ] Deployment

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## License

MIT
