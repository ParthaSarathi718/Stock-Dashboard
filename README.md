# Stock Data Intelligence Dashboard

A production-level full-stack web application that fetches real-world stock market data, performs analysis (Moving Averages, Volatility, Linear Regression trends), and visualizes the intelligence on a stunning glassmorphic dashboard.

## Tech Stack
- **Backend:** Python, FastAPI, Pandas, yfinance, Scikit-learn, Cachetools
- **Frontend:** React, Vite, Recharts, Vanilla CSS (Premium Glassmorphism)
- **Deployment:** Docker, Render, Netlify

## Local Development (Without Docker)

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`
*The API will be running at http://localhost:8000/api/v1*

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`
*The UI will be running at http://localhost:5173*

## Running with Docker Compose
If you have Docker installed, you can spin up both services at once:
1. `docker-compose up --build`

Backend runs on port `8000`. Frontend runs on port `5173`.

## Production Deployment Steps

### Deploying Backend (Render / Railway)
1. Push this repository to GitHub.
2. In Render, create a new **Web Service**.
3. Point it to your repo, set the Root Directory to `backend`.
4. Environment: Python 3
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Deploying Frontend (Netlify / GitHub Pages)
1. In Netlify, create a new site from GitHub.
2. Build Settings:
   - Base Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `frontend/dist`
3. *Note: For production, remember to change the `API_BASE_URL` in `src/api.js` from `localhost:8000` to your actual Render API URL.*
