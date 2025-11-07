# Harry Botter Portal

A modern Progressive Web App (PWA) for ticket management, built with Next.js, TypeScript, and TailwindCSS.

## Features

- 🎯 **Modern PWA**: Installable, offline-capable Progressive Web App
- 📱 **Responsive Design**: Optimized for both desktop and mobile
- 🎨 **Clean UI**: Minimal, professional design inspired by Notion, Linear, and Vercel
- ⚡ **Fast Performance**: Built with Next.js 14 and optimized for speed
- 🔍 **Advanced Filtering**: Search and filter tickets by multiple criteria
- 📊 **Status Indicators**: Color-coded status and type badges
- 🎭 **Smooth Animations**: Framer Motion for delightful transitions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Backend**: Supabase (via API routes)
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (required):
```bash
# Create .env.local file in the root directory
# Copy .env.example to .env.local and fill in your values
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

**Important**: The `.env.local` file is required for the app to work. Get your Supabase credentials from your Supabase project settings: https://app.supabase.com/project/_/settings/api

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
harrybotter-portal/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Navigation.tsx
│   ├── SearchableDropdown.tsx
│   ├── TicketForm.tsx
│   ├── TicketList.tsx
│   └── TicketDrawer.tsx
├── services/             # Service layer
│   └── supabase.ts       # Supabase client
├── types/                # TypeScript types
│   └── index.ts
└── public/               # Static assets
    └── manifest.json     # PWA manifest
```

## Features

### Submit Ticket Tab
- Multi-ticket submission
- Searchable dropdowns for users, projects, and assignees
- Dynamic form rows
- Type and priority selection

### Check Ticket Tab
- Advanced filtering (ID, title, requester, status, type)
- Pagination support
- Color-coded status and type badges
- Ticket detail drawer
- Real-time search highlighting

## PWA Support

The app is configured as a Progressive Web App with:
- Service worker for offline support
- Install prompt
- App manifest
- Responsive design

**Note**: You'll need to add your own PWA icons:
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/favicon.ico`

## License

Private - Internal use only

