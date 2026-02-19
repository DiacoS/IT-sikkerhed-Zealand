# REST API - Bruger Auth

En simpel REST API med login, registrering og admin-panel. Bygget med Node.js, Express og JWT.
Bruger en JSON-fil som database (ingen MySQL/MongoDB setup nødvendigt).

Der er også en lille frontend med login/register side og et dashboard.

## Indhold

- [Kom i gang](#kom-i-gang)
- [Scripts](#scripts)
- [Swagger docs](#swagger-docs)
- [Tests](#tests)
- [Endpoints](#endpoints)
- [Config / secrets](#config--secrets)
- [Projektstruktur](#projektstruktur)

## Kom i gang

```bash
npm install
npm run dev
```

Serveren starter på `http://localhost:3000`

Der er en default admin bruger klar:
- Brugernavn: `admin`
- Password: `admin123`

## Scripts

| Script | Kommando | Hvad den gør |
|--------|----------|--------------|
| Start | `npm start` | Kører serveren med node |
| Dev | `npm run dev` | Kører med nodemon (auto-restart) |
| Test | `npm test` | Kører Jest tests |

## Swagger docs

API dokumentation er sat op med Swagger UI. Når serveren kører kan du åbne:

```
http://localhost:3000/api-docs
```

Alle endpoints er dokumenteret derinde med request/response eksempler.
Du kan også teste dem direkte fra Swagger UI - husk bare at sætte din Bearer token i "Authorize" knappen først for de beskyttede endpoints.

## Tests

Tests ligger i `__tests__/api.test.js` og bruger Jest + Supertest.

Kør dem med:

```bash
npm test
```

Hvad der testes:
- Admin oprettes automatisk og kan logge ind
- Login fejler med forkert password
- Admin kan reaktivere en deaktiveret konto
- Normal bruger kan IKKE tilgå admin endpoints

Testene bruger en separat test-database (`__tests__/test-users.json`) som bliver slettet efter hver test, så de påvirker ikke den rigtige data.

## Endpoints

### Auth (åbne)

| Metode | Endpoint | Beskrivelse |
|--------|----------|-------------|
| POST | `/api/auth/register` | Opret ny bruger |
| POST | `/api/auth/login` | Log ind, få JWT token |

### Auth (kræver token)

| Metode | Endpoint | Beskrivelse |
|--------|----------|-------------|
| GET | `/api/auth/me` | Hent din profil |
| PUT | `/api/auth/password` | Skift password |
| PUT | `/api/auth/deactivate` | Deaktiver din konto |

### Admin (kræver admin token)

| Metode | Endpoint | Beskrivelse |
|--------|----------|-------------|
| GET | `/api/admin/users` | Se alle brugere |
| PUT | `/api/admin/reactivate/:id` | Reaktiver en bruger |

## Config / secrets

Secrets styres i `config.js`. Som default bruger den hardcoded værdier til udvikling, men i produktion kan man sætte environment variables:

| Env variabel | Default | Beskrivelse |
|-------------|---------|-------------|
| `JWT_SECRET` | test-secret-key... | Secret til JWT signing |
| `SALT_ROUNDS` | 10 | Bcrypt salt rounds |
| `TOKEN_EXPIRY` | 1h | Hvor lang tid en token lever |

## Projektstruktur

```
├── app.js              # Alle routes og middleware
├── server.js           # Starter serveren
├── config.js           # JWT secret, salt rounds osv
├── user_db.json        # "Database" (JSON fil)
├── package.json
├── public/
│   ├── index.html      # Frontend
│   ├── app.js          # Frontend JS
│   └── style.css
└── __tests__/
    └── api.test.js     # Jest tests
```

## Tech stack

- Express
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- swagger-jsdoc + swagger-ui-express (API docs)
- Jest + Supertest (testing)
