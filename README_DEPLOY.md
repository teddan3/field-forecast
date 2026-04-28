Deploying to Vercel (frontend) and preparing backend

Overview
- Frontend is a Vite + React app configured to build to `dist/`. Vercel will deploy this automatically when connected to GitHub.
- Backend is Laravel and intended to run on a PHP host (Render/Fly/Heroku) or via Docker. For now we will deploy the frontend to Vercel to preview live behavior.

Vercel setup (frontend)
1. Go to vercel.com and import the GitHub repository `teddan3/field-forecast`.
2. During setup, Vercel will detect a Vite app. Use these build settings if prompted:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
3. Set the required Environment Variables in Vercel project settings (Environment → Environment Variables):
   - VITE_API_FOOTBALL_KEY = a84a42e0EME9M9cSy9FvfHvcx2gMPkp1H5Dj4YaKufPRsAyon8Tf
   - VITE_API_FOOTBALL_BASE_URL = https://v3.football.api-sports.io
   - VITE_ODDS_API_KEY = d9ea526938474b6a9189d9fc1d6e17a8
   - VITE_API_URL = https://your-backend.example.com (if you have backend; optional)
4. Deploy. Vercel will run `npm run build` and publish the site.

Backend preview (local)
- To run the Laravel backend locally you can use Docker:
  - Install Docker
  - Copy backend/.env.example to backend/.env and set DB_* to your local DB or use the docker-compose.yml in repo which sets up Postgres and Redis.
  - Run: docker-compose up --build
  - Once the app is running, run migrations inside the container or adapt to your host.

CI
- A GitHub Actions workflow is present at .github/workflows/ci.yml that runs frontend build and backend unit tests on pushes/PRs to main.

Security notes
- Do NOT commit .env or secrets. Use Vercel environment variables and host-specific envs for backend.
