# Tesla Parts Project

## Stack
- **Backend:** FastAPI, SQLModel, PostgreSQL (prod) / SQLite (dev), JWT Auth.
- **Frontend (Admin & Shop):** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Deployment:** Docker, Nginx, Vercel/Render support.

## Project Structure
- `tesla-parts-backend/`: API server.
  - `routers/`: Endpoint definitions.
  - `services/`: Business logic (Telegram, Pricing, Images).
  - `models.py`: Database models (SQLModel).
  - `schemas.py`: Pydantic schemas for API validation.
- `tesla-parts-admin/`: React-based administration dashboard.
- `tesla-parts-shop/`: Public-facing React storefront.
- `docker-compose.yml`: Local development environment orchestration.

## Coding Standards

### General
- **Naming:** CamelCase for React components, camelCase for TS variables/functions, snake_case for Python.
- **Types:** Use TypeScript strictly; avoid `any`. Define shared types in `types.ts`.
- **Styling:** Use Tailwind CSS. Stick to the project's color palette (Tesla red, grays).

### Backend (FastAPI)
- Use **SQLModel** for both models and schemas where possible, or Pydantic for API-specific schemas.
- Place business logic in `services/`, keep routers thin.
- Use dependency injection for DB sessions and auth.

### Frontend (React)
- Functional components with `React.FC`.
- Use `lucide-react` for icons.
- Prefer explicit composition over complex inheritance.
- API calls should be centralized in `services/api.ts`.

## Core Workflows
- **Migrations:** Use provided migration scripts (`migrate_*.py`) for DB schema updates.
- **Testing:** Backend tests in `test_api.py` using `pytest`.
- **Deployment:** Follow `DEPLOYMENT.md` for standard procedures.
