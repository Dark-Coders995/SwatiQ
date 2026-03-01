## Pharmacy Inventory & Dashboard

Full‑stack pharmacy inventory and sales dashboard.
The frontend is built with React + TypeScript + Vite and deployed on **Vercel**.
The backend is a Flask + SQLAlchemy API using SQLite, deployed on **Render.com**.

### High‑Level Architecture

- **Frontend (Vercel)**:
  - React + TypeScript + Vite SPA in the `frontend/` folder.
  - Talks to the backend via REST endpoints under the `/api` prefix.
  - In local development, Vite proxies `/api` to the Flask backend.
- **Backend (Render.com)**:
  - Flask application in the `backend/` folder.
  - Uses SQLAlchemy ORM with a SQLite database (`pharmacy.db` in `backend/`).
  - Exposes JSON APIs under `/api/dashboard/*` and `/api/inventory/*`.
  - Seeds initial demo data on startup and keeps medicine status fields in sync.

### Environments & URLs

- **Local development**
  - **Backend**: `http://localhost:5000`
  - **Frontend (Vite dev)**: `http://localhost:5173`
  - **Proxy**: Vite proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.ts`).
- **Production**
  - **Backend (Render)**: `https://pharmacy-backend.onrender.com`  
    - Replace this with your actual Render service URL if different.
  - **Frontend (Vercel)**: `https://your-frontend-app.vercel.app`  
    - Configure Vercel rewrites or environment variables so that frontend `/api/*`
      calls reach the Render backend.

### Running the Backend Locally (Flask)

From the `backend/` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python3 app.py
```

- **Base URL**: `http://localhost:5000`
- **API prefix**: All endpoints are under `/api/*`.
- **Database**: A SQLite file `pharmacy.db` is created automatically in `backend/`.
- **Error handling**:
  - All responses follow a common envelope:

```json
{
  "success": true,
  "data": { "... endpoint specific ..." },
  "error": null
}
```

On errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "validation_error",
    "message": "Invalid request body.",
    "details": { "... optional structured details ..." }
  }
}
```

### Running the Frontend Locally (React + Vite)

From the `frontend/` directory:

```bash
npm install
npm run dev
```

- **Dev server**: `http://localhost:5173`
- **API access**:
  - All frontend API clients call relative paths like `/api/inventory/medicines`.
  - During local development, these are proxied to `http://localhost:5000`.

### API Contract (OpenAPI)

- **Source of truth**: `openapi.yaml` at the project root.
- **Spec version**: OpenAPI 3.0.3.
- **Groups**:
  - **Inventory**: `/api/inventory/*`
  - **Dashboard**: `/api/dashboard/*`
- **Top‑level response shape**:
  - All success responses:
    - `success: true`
    - `data: <endpoint specific payload>`
    - `error: null`
  - All error responses:
    - `success: false`
    - `data: null`
    - `error: { code, message, details? }`

You can explore the contract with any OpenAPI viewer, for example:

```bash
npx @redocly/cli preview-docs openapi.yaml
```

or by importing `openapi.yaml` into Swagger UI, Postman, or Insomnia.

### Key Backend Endpoints (Summary)

- **Inventory**
  - **GET** `/api/inventory/overview`  
    Returns overall inventory metrics (total items, active stock, low stock, total inventory value).
  - **GET** `/api/inventory/medicines`  
    Lists medicines with optional filters: `search`, `status`, `category`.
  - **POST** `/api/inventory/medicines`  
    Creates a new medicine record.
  - **PUT** `/api/inventory/medicines/{medicine_id}`  
    Updates an existing medicine record (partial updates allowed).
  - **PATCH** `/api/inventory/medicines/{medicine_id}/status`  
    Overrides the computed status of a medicine (`active`, `low_stock`, `expired`, `out_of_stock`).

- **Dashboard**
  - **GET** `/api/dashboard/today-sales-summary`  
    Returns total sales amount, percentage change vs. yesterday, and order count for today.
  - **GET** `/api/dashboard/items-sold-today`  
    Returns the total number of items sold today.
  - **GET** `/api/dashboard/low-stock-items`  
    Returns low‑stock medicines (supports `limit` query param).
  - **GET** `/api/dashboard/purchase-orders-summary`  
    Returns pending purchase order count and total purchase order value.
  - **GET** `/api/dashboard/recent-sales`  
    Returns the most recent sales (supports `limit` query param).

For complete request/response schemas, consult `openapi.yaml`.

### Deployment Notes

- **Backend (Render.com)**
  - **Build & runtime**:
    - Python version should match your local environment.
    - Install dependencies from `backend/requirements.txt`.
  - **Start command** (examples):
    - Simple: `python app.py`
    - Or with Gunicorn: `gunicorn 'app:create_app()'`
  - Ensure the working directory is `backend/` so the SQLite file and imports resolve correctly.

- **Frontend (Vercel)**
  - **Build command**: `npm run build` (from `frontend/`).
  - **Output directory**: `frontend/dist`.
  - Configure environment or rewrites so that `/api/*` requests from the frontend are routed
    to the Render backend (e.g., via Vercel rewrites or an exposed public backend URL).

