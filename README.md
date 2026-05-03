# 🛡️ OSIG Frontend

BACKEND : https://github.com/crossben/osig-backend

**Open Source Intelligence Gathering** - A modern, production-ready web application for ethical OSINT investigations.

## 📖 Overview

OSIG is a powerful open source intelligence gathering platform that helps researchers, investigators, and security professionals discover publicly available information about emails, usernames, domains, and phone numbers using ethical OSINT techniques.

### ✨ Key Features

- 🔍 **Multi-Target Scanning** - Email, username, domain, and phone number investigations
- 📊 **Relationship Mapping** - Interactive graph visualization of data connections
- 📈 **Progress Tracking** - Real-time scan monitoring with detailed module breakdowns
- 📄 **Professional Reports** - Generate PDF and JSON reports for documentation
- 🎯 **Risk Assessment** - Automatic risk flag identification and severity levels
- 🌙 **Dark Mode** - Beautiful UI with seamless light/dark theme switching
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🔐 **Secure Authentication** - JWT-based auth with automatic token refresh

---

## 🚀 Technology Stack

### Core Framework

- ⚡ **Next.js 16** - React framework with App Router
- 📘 **TypeScript 5** - Type-safe development
- 🎨 **Tailwind CSS 4** - Utility-first styling

### UI Components

- 🧩 **shadcn/ui** - Accessible component library built on Radix UI
- 🎭 **Heroicons** - Beautiful icon set
- 🌈 **Framer Motion** - Smooth animations
- 🌙 **next-themes** - Dark mode support

### State & Data Management

- 🐻 **Zustand** - Lightweight state management
- 🔄 **TanStack Query** - Server state synchronization
- 📡 **Axios** - HTTP client with interceptors

### Data Visualization

- 📊 **Recharts** - Beautiful charts and analytics
- 🕸️ **React Flow** - Interactive relationship graphs
- 📋 **TanStack Table** - Powerful data tables

### Forms & Validation

- 🎣 **React Hook Form** - Performant forms
- ✅ **Zod** - TypeScript-first validation

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **FastAPI Backend** running on port 8000

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd osig/frontend
   ```

2. **Install dependencies:**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env.local
   ```

4. **Update environment variables** in `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=OSIG
   ```

5. **Start development server:**

   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
src/
├── app/                      # Next.js App Router
│   └── page.tsx             # Main app with hash-based routing
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components (dashboard, etc.)
│   ├── error-boundary.tsx   # Global error handling
│   └── providers.tsx        # App-wide providers
├── features/                # Feature-specific components
│   ├── auth/               # Login, register, profile
│   ├── scans/              # Scan creation, history, details
│   ├── reports/            # Report generation and list
│   ├── graph/              # Relationship graph visualization
│   └── home/               # Landing home page
├── hooks/                   # Custom React hooks
│   ├── use-api.ts          # React Query API hooks
│   └── use-toast.ts        # Toast notifications
├── lib/                     # Utilities and configuration
│   ├── api.ts              # API service layer
│   ├── api-client.ts       # Axios client with interceptors
│   ├── env.ts              # Environment configuration
│   └── utils.ts            # Helper functions
├── store/                   # Zustand state stores
│   └── auth-store.ts       # Authentication state
└── types/                   # TypeScript type definitions
    └── index.ts            # Shared types
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `OSIG` |
| `NEXT_PUBLIC_SCAN_POLLING_INTERVAL` | Scan refresh interval (ms) | `3000` |
| `NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD` | Token refresh threshold (s) | `300` |

---

## 🌐 API Integration

The frontend communicates with a FastAPI backend via REST API:

### Authentication

- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with credentials
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

### Scans

- `GET /scans` - List all scans
- `POST /scans` - Create new scan
- `GET /scans/{id}` - Get scan details
- `GET /scans/{id}/details` - Get detailed scan results
- `GET /scans/{id}/graph` - Get relationship graph

### Reports

- `GET /reports` - List all reports
- `POST /reports` - Generate new report
- `GET /reports/{id}/download` - Download report file

### Auto Token Refresh

The API client automatically:

- Injects JWT tokens in request headers
- Refreshes tokens before expiration
- Logs out user if refresh fails
- Retries failed requests with new token

---

## 🎯 Features Guide

### 1. Landing Page

- Professional introduction to OSIG
- Feature highlights and how it works
- Legal & ethical usage information
- Login/Register CTAs

### 2. Authentication

- **Registration** - Create account with email, username, password
- **Login** - JWT-based authentication
- **Profile** - View and update user information

### 3. Scan Creation

- Select target type (email, username, domain, phone)
- Choose scan depth (quick or deep)
- Confirm legitimate use
- Real-time progress tracking

### 4. Scan History

- View all past and active scans
- Filter by status, type, date range
- Quick access to scan details
- Loading skeletons and empty states

### 5. Scan Details

- Real-time progress monitoring
- Module-by-module breakdown
- Results categorization
- Risk flag identification
- Action buttons (generate report, view graph)

### 6. Relationship Graph

- Interactive node visualization
- Drag and zoom functionality
- Node inspection panel
- Connection highlighting
- Risk level color coding

### 7. Reports

- Generate PDF or JSON reports
- View report list with status
- Download completed reports
- Track generation progress

---

## 🏃 Running the Application

### Development Mode

```bash
bun run dev
```

Runs on [http://localhost:3000](http://localhost:3000) with hot reload

### Production Build

```bash
bun run build
bun start
```

### Type Checking

```bash
bun x tsc --noEmit
```

### Linting

```bash
bun run lint
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow

- [ ] Register new account
- [ ] Login with credentials
- [ ] View profile page
- [ ] Logout successfully

#### Scan Workflow

- [ ] Create quick scan
- [ ] Create deep scan
- [ ] View scan progress in real-time
- [ ] Access completed scan details

#### Data Visualization

- [ ] View relationship graph
- [ ] Interact with graph nodes
- [ ] Inspect node details

#### Reports

- [ ] Generate PDF report
- [ ] Generate JSON report
- [ ] Download completed report

#### UI/UX

- [ ] Switch between light/dark themes
- [ ] Navigate via sidebar menu
- [ ] Hash-based routing works correctly
- [ ] Mobile responsive layout

---

## 🔒 Security

- **No Mock Data** - All endpoints connect to real backend API
- **JWT Authentication** - Secure token-based auth
- **Auto Token Refresh** - Seamless session management
- **HTTPS Ready** - Prepared for production deployment
- **Input Validation** - Zod schema validation on forms
- **XSS Protection** - React's built-in protection
- **CSRF Protection** - Via backend implementation

---

## 📱 Responsive Design

- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Adaptive layouts
- **Desktop Enhanced** - Full feature set on large screens
- **Touch Friendly** - Mobile gestures supported

---

## 🎨 UI Components

Built with shadcn/ui, includes:

- Forms (Input, Select, Checkbox, Switch)
- Feedback (Toast, Alert, Progress, Skeleton)
- Overlays (Dialog, Sheet, Popover, Tooltip)
- Navigation (Dropdown, Tabs, Breadcrumb)
- Data Display (Table, Card, Badge, Avatar)
- Layout (Separator, Scroll Area, Resizable Panels)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with modern React ecosystem
- UI components from shadcn/ui
- Icons from Heroicons
- Charts from Recharts
- Graph visualization from React Flow

---

## 📧 Support

For support or questions, please open an issue on GitHub.

---

**Built with ❤️ for the OSINT community** 🛡️
