# UIS Dashboard

Modern React dashboard for the Unified Intelligence System (UIS) dental practice management platform.

![React](https://img.shields.io/badge/React-18.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue)

## Features

- 🔐 **Authentication** - JWT-based login (demo mode accepts any credentials)
- 📅 **Schedule View** - Weekly calendar with appointment management
- 📋 **Today's Appointments** - Timeline view of daily schedule
- 👥 **Patient Management** - List, search, and detailed patient profiles
- 👨‍⚕️ **Provider Management** - Staff directory and schedules
- 📊 **Analytics** - Practice metrics and insights (Dentamind AI ready)

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Apollo Client (GraphQL)
- React Router (navigation)

## Deploy to Azure (via GitHub)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `uis-dashboard`
3. Make it Private (recommended)
4. **Don't** initialize with README
5. Create repository

### Step 2: Push This Code

```bash
# In the uis-dashboard-github folder:
git init
git add .
git commit -m "Initial commit - UIS Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/uis-dashboard.git
git push -u origin main
```

### Step 3: Create Azure Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a resource → Search "Static Web App" → Create
3. Fill in:
   - **Name**: `uis-dashboard`
   - **Plan type**: `Free`
   - **Source**: `GitHub`
   - **Organization**: Your GitHub username
   - **Repository**: `uis-dashboard`
   - **Branch**: `main`
   - **Build Presets**: `React`
   - **App location**: `/`
   - **Output location**: `dist`
4. Click "Review + create" → "Create"

### Step 4: Done!

Azure automatically:
- Adds the deployment token to your GitHub repo secrets
- Triggers the first build
- Deploys your dashboard

Your dashboard will be live at: `https://uis-dashboard-xxxxx.azurestaticapps.net`

## API Connection

The dashboard connects to:
```
https://uis-api-demo.kindwater-f937fbe0.eastus.azurecontainerapps.io/graphql
```

To change, update `src/services/apollo.ts` or set `VITE_API_URL` environment variable.

## Local Development

```bash
npm install
npm run dev
# Opens http://localhost:3000
```

## Project Structure

```
├── src/
│   ├── components/
│   │   └── DashboardLayout.tsx    # Main layout with sidebar
│   ├── pages/
│   │   ├── LoginPage.tsx          # Authentication
│   │   ├── SchedulePage.tsx       # Weekly calendar
│   │   ├── TodayPage.tsx          # Today's appointments
│   │   ├── PatientsPage.tsx       # Patient list
│   │   ├── PatientDetailPage.tsx  # Patient profile
│   │   ├── ProvidersPage.tsx      # Staff directory
│   │   └── AnalyticsPage.tsx      # Metrics dashboard
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state management
│   ├── services/
│   │   └── apollo.ts              # GraphQL client
│   └── App.tsx                    # Router setup
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml  # CI/CD pipeline
└── package.json
```

## License

Proprietary - My IT Copilot LLC
