# IAM Admin — Identity & Access Management

Centralized admin UI for the Payment Integrity Platform. Manage users,
roles, and app assignments across all the platform's apps (PayGuard,
ClaimGuard, FWA, COB).

Frontend-only. Calls the unified backend at `http://localhost:8001`.

## Run

```bash
cd frontend
npm install
npm run dev          # vite at http://localhost:5177
```

Configure backend URL (optional — defaults to `http://localhost:8001`):

```bash
echo "VITE_API_BASE_URL=http://localhost:8001" > frontend/.env.local
```

## Architecture

This app is part of the "one core backend, separate UI applications per
use case" pattern. The unified backend's `/api/users`, `/api/roles`, and
`/api/apps` endpoints power everything here.

| Page | What it does | Backend |
|---|---|---|
| Users | List/search users; assign + revoke roles inline; toggle active; create new user | `GET/POST/PATCH /api/users`, `POST/DELETE /api/users/{id}/roles/{role_id}` |
| Roles | Show all defined roles with their app grants (read-only) | `GET /api/roles` |
| Apps | Show registered apps with user counts (read-only) | `GET /api/apps` |

## Acting-as picker

Top-right "Acting as" dropdown sets `localStorage.iam.actorUserId`. The
axios interceptor in `src/api/client.ts` attaches that as
`actor_user_id=...` on POST/PATCH/DELETE so the backend records who
granted/revoked roles in `user_roles.granted_by_user_id`.

This is the same lightweight "pick a current user" pattern used elsewhere
on the platform until real auth lands.
