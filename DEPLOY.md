# Deploy frontend to Vercel

Repo: https://github.com/shubranshumishra22/codewithshub-frontend

## 1. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import `codewithshub-frontend`.
4. Vercel should auto-detect **Vite**. Confirm:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

5. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://brhgcqlyjuhfuhnsmliu.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key |

6. Click **Deploy**.

7. Copy your live URL, e.g. `https://codewithshub-frontend.vercel.app`.

## 2. Finish backend + Supabase setup

1. In **Render**, set `CLIENT_URL` to your Vercel URL and redeploy the API.
2. In **Supabase** → Authentication → URL Configuration:
   - **Site URL**: your Vercel URL
   - **Redirect URLs**: add your Vercel URL and `https://YOUR-APP.vercel.app/**`

## 3. Verify

1. Open your Vercel URL.
2. Sign up or log in.
3. Tick/untick a question on the DSA sheet.
4. Open the Progress dashboard.

## Notes

- `vercel.json` is included for React Router SPA routing.
- Rebuild on Vercel after changing any `VITE_*` variable.
