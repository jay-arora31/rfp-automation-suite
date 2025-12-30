# Frontend Project Context

## Overview

React TypeScript frontend for Vendor/RFP Management System with AI-powered features.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Bun** | Package Manager |
| **Tailwind CSS** | Utility-First Styling |
| **ShadCN/UI** | Component Library |
| **React Router** | Client-Side Routing |

---

## Backend API (Base URL: `http://localhost:3000`)

### Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| **Auth/Gmail** | `GET /api/auth/status`, `GET /api/auth/google`, `POST /api/auth/disconnect` |
| **Vendors** | `GET/POST /api/vendors`, `GET/PUT/DELETE /api/vendors/:id` |
| **RFPs** | `GET/POST /api/rfp`, `GET /api/rfp/:id`, `POST /api/rfp/:id/send`, `GET /api/rfp/:id/proposals`, `GET /api/rfp/:id/compare` |
| **Chat** | `POST /api/chat/rfp` (Conversational RFP creation) |
| **Proposals** | `GET /api/proposals/:id` |
| **Email** | `GET /api/email/status`, `POST /api/email/poll` |
| **Health** | `GET /health` |

---

## Key Features to Build

### Phase 1: Dashboard ✅

- [x] Project setup with Vite + Bun
- [x] Tailwind CSS configuration
- [x] ShadCN/UI integration
- [x] Dashboard layout with AI chat hero
- [x] Sidebar navigation with app layout

### Phase 2: Authentication & Gmail ✅

- [x] Gmail connection status
- [x] OAuth connect/disconnect
- [x] Settings page with Google account management

### Phase 3: Vendor Management ✅

- [x] Vendors list (paginated, searchable)
- [x] CRUD operations
- [x] Category filtering

### Phase 4: RFP Management ✅

- [x] RFP list with status filtering
- [x] AI-powered RFP creation (via chat)
- [x] Send RFP to vendors

### Phase 5: Chat-Based RFP Creation ✅

- [x] Chat interface
- [x] Conversational flow with AI responses

### Phase 6: Proposal Management

- [ ] Proposal viewing
- [ ] AI comparison & analysis

### Phase 7: Email Polling

- [ ] Status monitoring
- [ ] Manual trigger

---

## Folder Structure (Current)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN components (button, card, input, sidebar, etc.)
│   │   └── layout/
│   │       └── app-sidebar.tsx  # Main navigation sidebar
│   ├── pages/
│   │   ├── dashboard.tsx    # Main dashboard with AI chat hero
│   │   ├── dashboard.css    # Dashboard styles
│   │   ├── chat-rfp.tsx     # Chat-based RFP creation
│   │   ├── settings.tsx     # Settings & Gmail OAuth
│   │   └── settings.css     # Settings styles
│   ├── hooks/
│   │   └── use-mobile.tsx   # Mobile detection hook
│   ├── services/
│   │   ├── api.ts           # Axios instance configuration
│   │   └── authService.ts   # Auth/Gmail API calls
│   ├── types/
│   │   └── auth.ts          # Auth-related TypeScript types
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn helper)
│   ├── assets/              # Static assets
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles & design system
├── public/
├── tailwind.config.js
├── tsconfig.json
├── components.json          # ShadCN configuration
└── package.json
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Main dashboard with AI chat input |
| `/chat` | ChatRFP | Conversational RFP creation |
| `/vendors` | Placeholder | Vendor management (coming soon) |
| `/rfps` | Placeholder | RFP list management (coming soon) |
| `/email` | Placeholder | Email polling status (coming soon) |
| `/settings` | Settings | Google account & app settings |

---

## Notes

- CORS configured for `http://localhost:5173` (Vite default)
- Gmail OAuth required before sending RFPs
- AI processing may take 2-5 seconds
- Dark theme with purple accent (`#7C3AED`) as primary color
- Responsive sidebar with collapsible navigation
