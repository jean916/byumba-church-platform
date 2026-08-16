# Byumba Anglican Church Platform — MVP Scaffold

This is a working starter build of the platform described in the requirements
document, covering the **Phase 1 MVP**: public website, self-registration,
diocese → parish structure, groups, announcements, and offerings with
admin-only totals. It's built to grow into Phase 2/3 without a rewrite.

## Structure

```
backend/     Django + Django REST Framework API
frontend/    React (Vite) site, Kinyarwanda + English
```

## Data model at a glance

```
Diocese (Byumba)
  └── Parish (any number — added/removed by a Diocese Admin)
        ├── Group (Mothers' Union, Fathers' Union, Youth Union, Amatorero, Children)
        ├── Announcement / Event
        ├── User (role: PARISH_ADMIN, GROUP_LEADER, or MEMBER)
        └── Offering (amount, purpose, method — visible only to that parish's
                       admin, the diocese admin, and the member who gave it)
```

Every model that matters is scoped to a `Parish`, and every `Parish` belongs
to a `Diocese` — so onboarding a second diocese later is just adding a new
`Diocese` row, not new code.

## Running the backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # create your first Diocese Admin
python manage.py runserver
```

The API runs at `http://localhost:8000`. Use `/admin/` (Django admin) to add
the Byumba Diocese and its first parishes quickly, or build out proper admin
dashboard screens in the React app over time.

Key endpoints:
- `POST /api/accounts/register/` — public self-registration
- `POST /api/auth/login/` — get a JWT (username + password)
- `GET /api/dioceses/parishes/` — list parishes (public)
- `GET /api/content/groups/`, `/api/content/announcements/`, `/api/content/events/`
- `GET /api/offerings/totals/` — aggregate totals only (admin roles)
- `GET/POST /api/offerings/` — individual records (admin roles see their
  scope; members see only their own)

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api` calls to the backend.

## What's built vs. what's next

**Built:** public Home/Parishes/Groups/Announcements pages, Kinyarwanda +
English toggle, self-registration form wired to the API, full data model
with parish-level isolation, offerings model with an aggregate-totals
endpoint that never exposes individual amounts to the wrong role.

**Not yet built (Phase 2 candidates):** an in-app admin dashboard UI (Django
admin covers this for now), member login/profile pages, group leader
posting tools, photo galleries, real MTN/Airtel Mobile Money API
integration (current version logs contributions for reconciliation rather
than auto-charging — see the requirements doc for why).

## Deploying with your own domain

Once you're ready to go live:
1. Point your domain's DNS to wherever you host the backend + frontend.
2. Set `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` env vars to your real domain.
3. Switch the database from SQLite to PostgreSQL (already wired via env vars in `settings.py`).
4. Serve the built frontend (`npm run build` → `dist/`) via any static host or the same server as the API.
