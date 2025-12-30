# AI-Powered RFP Management System

An intelligent Request for Proposal (RFP) management system that streamlines the procurement workflow using AI. Create RFPs through natural language, automatically send to vendors via email, parse responses with AI, and get intelligent recommendations for vendor selection.

![Tech Stack](https://img.shields.io/badge/React-19.x-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Setup](#-project-setup)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Design Decisions & Assumptions](#-design-decisions--assumptions)
- [AI Tools Usage](#-ai-tools-usage)

---

## ✨ Features

### 1. Natural Language RFP Creation
- Chat-based interface to describe procurement needs
- AI extracts structured data (items, quantities, specifications, budget, terms)
- Real-time preview before creating RFP

### 2. Vendor Management
- Store and manage vendor master data
- Categorize vendors (Technology, Office Supplies, etc.)
- Select multiple vendors for each RFP

### 3. Email Integration (Gmail)
- OAuth2-based Gmail integration
- Automated RFP delivery with professional PDF attachments
- Email threading for vendor communications
- Auto-reply for incomplete proposals

### 4. AI-Powered Response Parsing
- Automatic parsing of vendor email responses
- Attachment extraction (PDF, DOCX, XLSX, CSV, TXT)
- Structured data extraction (pricing, delivery, warranty)
- Missing information detection and follow-up

### 5. Intelligent Proposal Comparison
- AI-driven vendor ranking with scoring
- Detailed reasoning for each recommendation
- Strengths/weaknesses analysis per vendor
- One-click vendor award

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Lucide Icons |
| **Backend** | Node.js, Express 5, Prisma ORM |
| **Database** | PostgreSQL |
| **AI Provider** | OpenAI GPT-4 |
| **Email** | Gmail API (OAuth2) |
| **PDF Generation** | PDFKit |
| **File Parsing** | pdf-parse, mammoth (DOCX), xlsx |

### Key Libraries

**Frontend:**
- `react-router-dom` - Routing
- `axios` - HTTP client
- `@radix-ui/*` - UI primitives
- `class-variance-authority` - Component variants

**Backend:**
- `prisma` - Database ORM
- `googleapis` - Gmail API
- `openai` - AI integration
- `node-cron` - Email polling scheduler
- `pdfkit` - PDF generation
- `joi` - Request validation

---

## 🚀 Project Setup

### Prerequisites

- **Node.js** >= 18.x
- **Bun** >= 1.x (for frontend)
- **PostgreSQL** >= 14.x
- **OpenAI API Key**
- **Google Cloud Project** with Gmail API enabled

### 1. Clone Repository

```bash
git clone <repository-url>
cd Aerchain-Assignment
```

### 2. Environment Configuration

Create `.env` files for both frontend and backend:

**Backend (`backend/.env`):**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rfp_management"

# OpenAI
OPENAI_API_KEY="sk-..."

# Google OAuth (Gmail)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for OAuth redirect)
FRONTEND_URL="http://localhost:5173"
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Google Cloud Setup (Gmail Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Configure OAuth consent screen:
   - User Type: External
   - Add scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed sample vendors
node src/db/seeds/vendors.js

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies (using Bun)
bun install

# Start development server
bun run dev
```

Frontend runs on `http://localhost:5173`

### 6. Connect Gmail

1. Open `http://localhost:5173`
2. Go to **Settings** page
3. Click **Connect Gmail**
4. Authorize the application
5. Email integration is now active!

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

---

### Authentication Endpoints

#### `GET /auth/google`
Initiate Google OAuth flow for Gmail integration.

**Response:** Redirects to Google OAuth consent screen

---

#### `GET /auth/google/callback`
Handle OAuth callback from Google.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Authorization code from Google |

**Response:** Redirects to frontend with status

---

#### `GET /auth/status`
Check Gmail connection status.

**Response:**
```json
{
  "connected": true,
  "email": "user@gmail.com"
}
```

---

#### `POST /auth/disconnect`
Disconnect Gmail account.

**Response:**
```json
{
  "success": true,
  "message": "Gmail disconnected"
}
```

---

### Chat Endpoints

#### `POST /chat/rfp`
Process chat message for RFP creation.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "I need 20 laptops with 16GB RAM..." }
  ]
}
```

**Response (collecting):**
```json
{
  "message": "Here's your RFP summary...",
  "status": "preview",
  "collectedData": {
    "title": "Laptop Procurement",
    "items": [{ "name": "Laptop", "quantity": 20, "specifications": ["16GB RAM"] }],
    "budget": 50000,
    "deliveryDays": 30
  },
  "readyForPreview": true
}
```

**Response (confirmed):**
```json
{
  "message": "Your RFP has been created!",
  "status": "confirmed",
  "rfp": {
    "id": 1,
    "title": "Laptop Procurement",
    "status": "draft"
  }
}
```

---

### RFP Endpoints

#### `POST /rfp`
Create RFP from structured data.

**Request Body:**
```json
{
  "title": "Office Equipment Procurement",
  "rawInput": "Original user input...",
  "items": [
    {
      "name": "Laptop",
      "quantity": 20,
      "specifications": ["16GB RAM", "512GB SSD"],
      "warranty": "1 year"
    }
  ],
  "budget": 50000,
  "currency": "USD",
  "deliveryDays": 30,
  "paymentTerms": "Net 30",
  "warrantyTerms": "1 year minimum"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Office Equipment Procurement",
  "status": "draft",
  "items": [...],
  "createdAt": "2024-12-30T10:00:00Z"
}
```

---

#### `GET /rfp`
List all RFPs with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | - | Filter by status |

**Response:**
```json
{
  "rfps": [...],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

---

#### `GET /rfp/:id`
Get single RFP with vendors and proposals.

**Response:**
```json
{
  "id": 1,
  "title": "Office Equipment",
  "status": "sent",
  "items": [...],
  "vendors": [
    {
      "id": 1,
      "vendorId": 5,
      "name": "Tech Supplies Inc",
      "email": "vendor@tech.com",
      "status": "responded",
      "sentAt": "2024-12-30T10:00:00Z"
    }
  ],
  "proposals": [
    {
      "id": 1,
      "vendorId": 5,
      "totalPrice": 45000,
      "items": [...]
    }
  ]
}
```

---

#### `POST /rfp/:id/send`
Send RFP to selected vendors via email.

**Request Body:**
```json
{
  "vendorIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFP sent to 3 vendors",
  "results": [
    { "vendorId": 1, "success": true },
    { "vendorId": 2, "success": true },
    { "vendorId": 3, "success": true }
  ]
}
```

---

#### `POST /rfp/:id/comparison/trigger`
Trigger AI comparison of proposals (runs in background).

**Response:**
```json
{
  "status": "pending",
  "message": "Comparison started"
}
```

---

#### `GET /rfp/:id/comparison/status`
Poll comparison status.

**Response:**
```json
{
  "status": "completed",
  "comparisonId": 1
}
```

---

#### `GET /rfp/:id/comparison`
Get comparison results.

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "comparison": {
    "summary": "After analyzing all proposals...",
    "recommendation": {
      "vendorId": 5,
      "vendorName": "Tech Supplies Inc",
      "reason": "Best combination of price and warranty",
      "confidence": 0.85
    },
    "rankings": [
      {
        "rank": 1,
        "vendorId": 5,
        "vendorName": "Tech Supplies Inc",
        "score": 0.92,
        "totalPrice": 45000,
        "reasoning": "...",
        "pros": ["Competitive pricing", "Extended warranty"],
        "cons": ["Longer delivery time"]
      }
    ]
  },
  "completedAt": "2024-12-30T10:05:00Z"
}
```

---

#### `POST /rfp/:id/award`
Award RFP to a vendor.

**Request Body:**
```json
{
  "vendorId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFP awarded to Tech Supplies Inc",
  "rfp": {
    "id": 1,
    "status": "awarded",
    "awardedVendorId": 5,
    "awardedAt": "2024-12-30T10:10:00Z"
  }
}
```

---

### Vendor Endpoints

#### `GET /vendors`
List all vendors.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `search` | string | Search by name/email |
| `category` | string | Filter by category |

**Response:**
```json
{
  "vendors": [
    {
      "id": 1,
      "name": "Tech Supplies Inc",
      "email": "vendor@tech.com",
      "category": "Technology"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

---

#### `POST /vendors`
Create a new vendor.

**Request Body:**
```json
{
  "name": "Tech Supplies Inc",
  "email": "vendor@tech.com",
  "phone": "+1-555-0100",
  "category": "Technology",
  "address": "123 Tech St",
  "notes": "Preferred vendor for laptops"
}
```

---

#### `PUT /vendors/:id`
Update vendor.

---

#### `DELETE /vendors/:id`
Delete vendor.

---

### Error Responses

All endpoints may return:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": {} // Optional validation details
}
```

**HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🗄 Database Schema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UserSettings  │     │     Vendor      │     │       Rfp       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ googleTokens    │     │ name            │     │ title           │
│ connectedEmail  │     │ email           │     │ items (JSON)    │
└─────────────────┘     │ category        │     │ budget          │
                        │ phone           │     │ status          │
                        │ address         │     │ awardedVendorId │
                        └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 │     ┌─────────────────┤
                                 │     │                 │
                        ┌────────┴─────┴───┐    ┌───────┴────────┐
                        │    RfpVendor     │    │  RfpComparison │
                        ├──────────────────┤    ├────────────────┤
                        │ rfpId            │    │ rfpId          │
                        │ vendorId         │    │ status         │
                        │ status           │    │ comparisonData │
                        │ emailThreadId    │    │ completedAt    │
                        │ partialData      │    └────────────────┘
                        └────────┬─────────┘
                                 │
                        ┌────────┴─────────┐
                        │    Proposal      │
                        ├──────────────────┤
                        │ rfpId            │
                        │ vendorId         │
                        │ totalPrice       │
                        │ deliveryDays     │
                        │ parsedData       │
                        └────────┬─────────┘
                                 │
                        ┌────────┴─────────┐
                        │  ProposalItem    │
                        ├──────────────────┤
                        │ proposalId       │
                        │ itemName         │
                        │ quantity         │
                        │ unitPrice        │
                        │ warranty         │
                        └──────────────────┘
```

---

## 🎯 Design Decisions & Assumptions

### Data Model Design

1. **RFP Items as JSON**: Items are stored as JSONB in PostgreSQL for flexibility. Each item has: name, quantity, specifications (array), description, and warranty.

2. **Proposal Items Table**: Vendor responses are parsed into a separate `ProposalItem` table for detailed per-item tracking (unit price, warranty per item).

3. **RfpVendor Junction Table**: Tracks the relationship between RFPs and vendors, including email thread IDs for proper email threading and partial proposal data for multi-email responses.

### AI Integration

1. **Chat-based RFP Creation**: Used conversational AI to extract structured data from natural language. The AI identifies items, quantities, specifications, budget, and terms in a single pass.

2. **Response Parsing**: Vendor emails are parsed using GPT-4 with specific prompts to extract pricing, delivery, payment terms, and warranty. Supports both email body and attachments.

3. **Comparison Logic**: AI compares proposals on multiple dimensions:
   - Price competitiveness (weighted)
   - Delivery timeline
   - Warranty coverage
   - Payment terms favorability
   - Completeness of response

### Email System

1. **Gmail API Choice**: Used Gmail API over SMTP/IMAP for:
   - Better threading support
   - Reliable delivery
   - Attachment handling
   - OAuth2 security

2. **Email Polling**: Background job polls every 1 minute for new vendor responses.

3. **Auto-Reply for Incomplete Proposals**: If AI detects missing required information, system automatically sends a follow-up email requesting specific details.

### Assumptions

1. **Single User**: System designed for single procurement manager (no multi-tenancy).

2. **Vendor Response Format**: Vendors reply to the same email thread. System handles both inline text and attachments.

3. **Currency**: Default USD, but stored per-RFP.

4. **Email Threading**: Vendors keep `[RFP-XX]` in subject line for tracking.

5. **Pricing Format**: AI handles various formats (per unit, total, tables, etc.)

---

## 🤖 AI Tools Usage

### Tools Used

1. **Cursor IDE with Claude** - Primary development environment
2. **OpenAI GPT-4** - Production AI features

### What AI Helped With

| Area | Contribution |
|------|--------------|
| **Boilerplate** | Initial project structure, Prisma schema, API routes |
| **UI Components** | shadcn/ui integration, Tailwind styling, responsive layouts |
| **AI Prompts** | Crafting effective prompts for RFP parsing and comparison |
| **Debugging** | Email threading issues, PDF generation, attachment parsing |
| **Refactoring** | Component modularization, CSS modules conversion |

### Notable Approaches

1. **Structured Output Prompts**: Designed prompts that return JSON for reliable parsing:
```
Extract the following from vendor email:
- items: array of { name, quantity, unitPrice, warranty }
- deliveryDays: number
- paymentTerms: string
Return as JSON only.
```

2. **Multi-turn Conversation**: Chat system maintains context across messages for natural RFP creation.

3. **Confidence Scoring**: Comparison includes confidence levels to help users trust recommendations.

### Learnings

1. **Prompt Engineering**: Clear, structured prompts with examples produce more reliable outputs.

2. **Error Handling**: AI can return unexpected formats; robust parsing with fallbacks is essential.

3. **User Experience**: Showing AI reasoning (not just results) builds trust.

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database, OAuth, OpenAI config
│   │   ├── controllers/    # Route handlers
│   │   ├── jobs/           # Background jobs (email poller)
│   │   ├── middlewares/    # Error handling, validation
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   │   ├── aiService.js
│   │   │   ├── gmailService.js
│   │   │   ├── pdfGenerator.js
│   │   │   └── ...
│   │   └── utils/          # Prompts, validators
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── server.js           # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Sidebar, header
│   │   │   ├── rfp/        # RFP detail components
│   │   │   └── ui/         # shadcn components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API clients
│   │   ├── styles/         # CSS modules
│   │   └── types/          # TypeScript interfaces
│   └── index.html
│
└── README.md
```

---

## 🚧 Known Limitations

1. **Single Gmail Account**: Only one Gmail can be connected at a time
2. **No Real-time Updates**: Email responses require polling (1 min interval)
3. **Attachment Size**: Large attachments may timeout during parsing
4. **No Edit RFP**: Once created, RFPs cannot be edited (by design for audit trail)

---

## 🔮 Future Improvements

- [ ] Real-time notifications via WebSocket
- [ ] Multi-user support with authentication
- [ ] RFP templates for common procurement types
- [ ] Vendor performance tracking over time
- [ ] Export comparison reports to PDF
- [ ] Support for multiple email providers

---

## 📄 License

MIT License - feel free to use this project as a reference.

