# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Add PWA Icons** (Required)
   
   You need to add the following icon files to the `public/` directory:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
   - `favicon.ico` (standard favicon)
   
   You can generate these using tools like:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

3. **Environment Variables** (Optional)
   
   Create a `.env.local` file if you want to override the default Supabase configuration:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_KEY=your_key
   ```
   
   Note: Default values are already configured in the code.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
harrybotter-portal/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (Supabase integration)
│   │   ├── users/
│   │   ├── team-members/
│   │   ├── projects/
│   │   └── tickets/
│   ├── globals.css         # Global styles with Tailwind
│   ├── layout.tsx          # Root layout with PWA metadata
│   ├── page.tsx            # Main page component
│   └── not-found.tsx       # 404 page
├── components/             # React Components
│   ├── Navigation.tsx      # Tab navigation
│   ├── SearchableDropdown.tsx  # Reusable dropdown component
│   ├── TicketForm.tsx      # Submit ticket form
│   ├── TicketList.tsx      # Check ticket list with filters
│   └── TicketDrawer.tsx    # Ticket detail drawer
├── services/               # Service Layer
│   └── supabase.ts         # Supabase client
├── types/                  # TypeScript Types
│   └── index.ts            # All type definitions
├── public/                 # Static Assets
│   └── manifest.json       # PWA manifest
├── next.config.js          # Next.js config with PWA
├── tailwind.config.js      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Features Implemented

### ✅ PWA Support
- Service worker for offline capability
- Install prompt
- App manifest configured
- Responsive design

### ✅ Submit Ticket Tab
- Multi-ticket submission
- Searchable dropdowns (users, projects, assignees)
- Dynamic form rows (add/remove)
- Type and priority selection
- Clean, modern UI

### ✅ Check Ticket Tab
- Advanced filtering (ID, title, requester, status, type)
- Pagination (20 tickets per page)
- Color-coded status badges
- Color-coded type badges
- Ticket detail drawer
- Real-time search with highlighting
- Results count display

### ✅ Modern UI/UX
- Smooth animations (Framer Motion)
- Responsive design (mobile & desktop)
- Clean, minimal aesthetic
- Consistent spacing and typography
- System font (Inter) for readability

## API Routes

All API routes are in `app/api/`:

- `GET /api/users` - Get all users
- `GET /api/team-members` - Get team members
- `GET /api/projects` - Get all projects
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Submit new tickets

## Notes

- The app uses Supabase for data storage (same as original Google Apps Script)
- Default Supabase credentials are embedded (can be overridden with env vars)
- PWA service worker is disabled in development mode
- All components are client-side rendered for interactivity
- TypeScript is strictly typed for better code quality

## Troubleshooting

### PWA not working?
- Make sure you've added the icon files
- Check that `next.config.js` has PWA enabled
- Service worker is disabled in development - test in production build

### API errors?
- Check Supabase credentials
- Verify network connectivity
- Check browser console for detailed error messages

### Build errors?
- Make sure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run lint`
- Verify Node.js version (18+)

