# Data Analyzer — Backend

REST API built with **Hono** + **Drizzle ORM** on **Neon (PostgreSQL)**. Deployable on Vercel as a serverless function.

## Stack

- **Runtime**: Node.js / Vercel Serverless
- **Framework**: [Hono](https://hono.dev)
- **ORM**: Drizzle ORM
- **Database**: Neon (PostgreSQL serverless)
- **Auth**: JWT + bcrypt

---

## Setup locale

```bash
npm install
```

Crea un file `.env` nella root:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
```

Avvia il server di sviluppo:

```bash
npm run dev
# http://localhost:3000
```

---

## Deploy su Vercel

Le variabili d'ambiente vanno impostate nel pannello Vercel → **Settings → Environment Variables**:

| Variabile | Descrizione |
|---|---|
| `DATABASE_URL` | Connection string Neon |
| `JWT_SECRET` | Chiave per firmare i JWT |

Il file `vercel.json` redirige tutte le richieste a `api/index.ts`.

---

## API

Base URL: `https://<progetto>.vercel.app`

### Auth

| Metodo | Path | Descrizione | Auth richiesta |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registra un nuovo utente | No |
| `POST` | `/api/auth/login` | Login, restituisce un JWT | No |
| `GET` | `/api/auth/me` | Dati dell'utente corrente | Sì |

**Body register / login:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Risposta login / register:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "createdAt": "..." }
}
```

---

### Summaries

Tutte le route `/api/summaries/*` richiedono autenticazione.

Header da aggiungere:
```
Authorization: Bearer <token>
```

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/api/summaries` | Lista paginata dei domini |
| `GET` | `/api/summaries/:id` | Dettaglio singolo summary |
| `POST` | `/api/summaries/seed` | Carica i dati dal file JSON |

**Query params per `GET /api/summaries`:**

| Param | Tipo | Descrizione |
|---|---|---|
| `page` | number | Pagina corrente |
| `perPage` | number | Elementi per pagina (default: 10) |
| `domain` | string | Filtra per domain_name esatto |
| `search` | string | Ricerca parziale sul domain_name |

**Esempio risposta:**
```json
{
  "items": [...],
  "totalItems": 42,
  "page": 1,
  "perPage": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

---

## Struttura del progetto

```
src/
├── app.ts                  # App Hono (usata da locale e Vercel)
├── index.ts                # Entry point locale (serve su porta 3000)
├── db/
│   ├── index.ts            # Connessione Neon + Drizzle
│   ├── schema.ts           # Tabelle: users, summaries
│   └── seed.ts             # Import dati da JSON
├── routes/
│   ├── auth.routes.ts      # /api/auth/*
│   └── summaries.route.ts  # /api/summaries/*
├── middleware/
│   └── auth.middleware.ts  # Verifica JWT
└── lib/
    ├── utils.ts            # generateJwt
    └── summaries.types.ts  # Tipi TypeScript
api/
└── index.ts                # Handler Vercel serverless
```
