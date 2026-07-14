# 🎨 CodeWithShub - Frontend Client

> The client-side Single Page Application (SPA) for CodeWithShub, a high-fidelity interactive roadmap platform for SDE interview preparation and DSA mastery.

---

## 💻 Tech Stack

*   **Framework Core:** [React 18](https://react.dev/) + [Vite](https://vite.dev/) (for sub-second HMR and optimized asset compilation)
*   **Styling & UI:** [Tailwind CSS v3](https://tailwindcss.com/) (utility-first, featuring custom glassmorphism systems)
*   **Interactions & Motion:** [Framer Motion](https://www.framer.com/motion/) (orchestrating smooth, hardware-accelerated orbits and sways)
*   **Routing:** [React Router Dom v6](https://reactrouter.com/) (declarative client-side routing with route guards)
*   **Server State & Sync:** [TanStack Query v5 (React Query)](https://tanstack.com/query/latest) (handling caching, loading states, and background synchronization)
*   **Data Visualization:** [Recharts](https://recharts.org/) (circular progress gauges and performance charting)
*   **Iconography:** [Lucide React](https://lucide.dev/) (vector outline icon system)

---

## 📂 Directory Layout

```directory
client/
├── public/                  # Static assets (favicons, site logs)
├── src/
│   ├── components/          # Reusable structural and visual elements
│   │   ├── FloatingNavbar.jsx   # Floating backdrop-blurred navbar
│   │   ├── GetInterviewReady.jsx # Priority Syllabus checklist visualizer
│   │   ├── RevisionTerminal.jsx  # Interactive sandbox evaluation console
│   │   └── SiteFooter.jsx        # Footer layout
│   ├── context/             # React Context providers (AuthContext)
│   ├── hooks/               # Custom lifecycle and queries hooks
│   ├── lib/                 # Axios API definitions & Supabase clients
│   ├── pages/               # High-fidelity dashboard views
│   │   ├── LeaderboardPage.jsx   # Streak tracker and global ranking list
│   │   ├── LoginPage.jsx         # Sign-in forms
│   │   ├── ProgressPage.jsx      # Completion analytics charts
│   │   ├── ResumeAIPage.jsx      # ATS scanning and keyword grading dashboard
│   │   ├── RoadmapPage.jsx       # Interactive track nodes & floating card animations
│   │   └── SheetPage.jsx         # DSA topic questions worksheets
│   ├── App.jsx              # Main router map
│   ├── main.jsx             # React DOM injection point
│   └── index.css            # Custom utility classes & global theme values
├── tailwind.config.js       # Custom animations, fonts, and dark theme extensions
├── vite.config.js           # Vite dev servers and asset proxies
└── vercel.json              # Vercel deployment directives for single-page routing
```

---

## ⚡ Development Setup

### Prerequisites

Ensure you have [Node.js (v18+)](https://nodejs.org/) and `npm` installed.

### 1. Environment Configurations

Copy the environment template in the client directory and populate your keys:
```bash
cp .env.example .env
```

Your `.env` should contain:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api
```

### 2. Dependency Installation

Install the package modules:
```bash
npm install
```

### 3. Running Local Server

Boot Vite hot-reloading development server:
```bash
npm run dev
```
The client dashboard will compile and open at `http://localhost:5173/`.

### 4. Compiling Production Build

Verify compilation output or build code for deployment:
```bash
# Compiles optimized, minified bundle under dist/ directory
npm run build

# Review the production build locally
npm run preview
```

---

## 🚀 Deployment (Vercel)

This frontend client is configured for seamless deployment on Vercel. 
The custom `vercel.json` config routes all sub-paths back to `index.html` to allow React Router to handle history states correctly:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Simply connect this subdirectory repository to your Vercel Dashboard, select **Vite** as the framework preset, configure your environment variables, and trigger a deployment.
