# REST API - Auth system

Lavet som del af IT-sikkerhed paa Zealand Naestved.

Et REST API med login, registrering, JWT tokens og et admin panel. 
Bruger en JSON fil som database saa man slipper for at saette en hel database server op.
Der er ogsaa en lille frontend hvor man kan logge ind, oprette brugere osv.

---

## Kom i gang

```bash
npm install
npm run dev
```

Koerer paa `http://localhost:3000`

Admin login: `admin` / `admin123`

---

## Swagger

Swagger UI koerer paa:

```
http://localhost:3000/api-docs
```

Der kan man se alle endpoints, hvad de forventer og hvad de returnerer. Man kan ogsaa teste dem direkte derfra - bare husk at trykke "Authorize" og smid din Bearer token ind foerst.

---

## Koer tests

```bash
npm test
```

Bruger Jest + Supertest. Testene ligger i `__tests__/api.test.js`.

Der testes bl.a.:
- At admin oprettes automatisk og kan logge ind
- At login fejler med forkert password
- At admin kan reaktivere en deaktiveret konto
- At en normal bruger ikke kan tilgaa admin endpoints

Testene har deres egen test-database som slettes efter hver koersel, saa den rigtige data ikke bliver fucked.

---

## Endpoints

**Aabne:**

| Metode | Endpoint | Hvad den goer |
|--------|----------|--------------|
| POST | `/api/auth/register` | Opret bruger |
| POST | `/api/auth/login` | Log ind, faa token |

**Kraever token:**

| Metode | Endpoint | Hvad den goer |
|--------|----------|--------------|
| GET | `/api/auth/me` | Se din profil |
| PUT | `/api/auth/password` | Skift password |
| PUT | `/api/auth/deactivate` | Deaktiver din konto |

**Admin only:**

| Metode | Endpoint | Hvad den goer |
|--------|----------|--------------|
| GET | `/api/admin/users` | Se alle brugere |
| PUT | `/api/admin/reactivate/:id` | Aktiver en bruger igen |

---

## Flat File Database

Hele "databasen" er bare en JSON fil. Ingen MySQL, ingen MongoDB, bare en fil.

Hvorfor det virker fint her:
- Ingen opsaetning overhovedet, det virker bare
- Filen kan kopieres og flyttes som man vil
- Man kan aabne den i notepad og se hvad der ligger i den
- Til et lille projekt som det her er det rigeligt

### CRUD funktioner

| Funktion | Hvad den goer |
|----------|-------------|
| `create_user(...)` | Opret bruger - data krypteres og password hashes |
| `get_user(person_id)` | Hent en bruger - dekrypterer data |
| `get_all_users()` | Hent alle brugere |
| `update_user(person_id, **kwargs)` | Opdater felter paa en bruger |
| `delete_user(person_id)` | Slet en bruger |

### Kryptering og hashing

Data er krypteret med Fernet (AES-128-CBC) saa selv hvis nogen faar fat i JSON filen kan de ikke laese noget uden noeglen.

Passwords er hashed med SHA-256 - envejs, kan ikke genskabes.

Saadan ser data ud i `users.json`:

```json
{
  "person_id": 1,
  "first_name": "gAAAAABn...",
  "last_name": "gAAAAABn...",
  "address": "gAAAAABn...",
  "street_number": "gAAAAABn...",
  "password": "ef92b778bafe771207...",
  "enabled": true
}
```

Python tests til flat file db:

```bash
python -m unittest test_flat_file_db -v
python -m unittest test_kryptering -v
```

SE IMAGE MAPPEN FOR SCREENSHOTS

---

## Test design

### Graensevaerditest

```javascript
function erPasswordGyldigt(password) {
  return password.length >= 8;
}
console.log(" Graensevaerditest: Password min 8 tegn \n");
console.log("7 tegn:", erPasswordGyldigt("1234567"));
console.log("8 tegn:", erPasswordGyldigt("12345678"));
console.log("9 tegn:", erPasswordGyldigt("123456789"));
```

Tester om password validering virker korrekt ved graensen - 7 tegn (for kort), 8 tegn (praecis nok), 9 tegn (over). Kun 8+ bliver godkendt.

### CRUD Test

Se testfilen i projektet.

Tester at Create, Read, Update og Delete virker for brugere, og at password-reglen (min 8 tegn) bliver haandhaevet ved oprettelse og opdatering.

### Cycle Test

```javascript
function loginForsoeg(forsoegListe) {
  let maxForsoeg = 3;
  let count = 0;

  for (let korrekt of forsoegListe) {
    count++;

    if (korrekt === true) {
      return "Login godkendt";
    }

    if (count === maxForsoeg) {
      return "Konto laast";
    }
  }

  return "Login fejlede";
}
console.log("Cycle test - Login forsoeg\n");

console.log(loginForsoeg([true]));                // lykkes foerste gang
console.log(loginForsoeg([false, false, true]));   // lykkes efter et par fejl
console.log(loginForsoeg([false, false, false]));  // rammer max -> laast
console.log(loginForsoeg([false]));                // fejler uden at ramme max
```

Tester login flowet - at det stopper ved succes eller efter 3 forkerte forsoeg (brute-force beskyttelse).

### Test-pyramiden

Mange unit tests, faerre integration tests, faa systemtests. Det goer fejl nemmere at finde og tests hurtigere at koere.

### Decision Table - Login & Password-regler

**Betingelser:**
- C1: Er password mindst 8 tegn?
- C2: Er login korrekt?
- C3: Er antal loginforsoeg <= 3?

**Handlinger:**
- A1: Opret / opdater bruger
- A2: Giv adgang
- A3: Afvis login
- A4: Laas konto

| Regel | C1: >= 8 tegn | C2: Korrekt login | C3: <= 3 forsoeg | A1: Opret/Opdater | A2: Adgang | A3: Afvis | A4: Laas |
| ----- | ------------ | ----------------- | -------------- | ----------------- | ---------- | --------- | ------- |
| R1    | Ja           | -                 | -              | Ja                | -          | -         | -       |
| R2    | Nej          | -                 | -              | Nej               | -          | -         | -       |
| R3    | -            | Ja                | Ja             | -                 | Ja         | -         | -       |
| R4    | -            | Nej               | Ja             | -                 | -          | Ja        | -       |
| R5    | -            | Nej               | Nej            | -                 | -          | -         | Ja      |

---

## Config

Secrets ligger i `config.js`. Bruger hardcoded vaerdier til dev, men kan overskrives med env variables:

| Variabel | Default | Hvad |
|----------|---------|------|
| `JWT_SECRET` | test-secret-key... | JWT signing |
| `SALT_ROUNDS` | 10 | Bcrypt rounds |
| `TOKEN_EXPIRY` | 1h | Token levetid |

---

## Struktur

```
app.js              # Routes og middleware
server.js           # Starter serveren
config.js           # Config/secrets
user_db.json        # JSON "database"
package.json
public/
  index.html
  app.js
  style.css
__tests__/
  api.test.js
```

## Tech

Express, bcryptjs, jsonwebtoken, swagger-jsdoc, swagger-ui-express, Jest, Supertest

---

Repository er public. Zealand - Sjaellands Erhvervsakademi, Naestved.