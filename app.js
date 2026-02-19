const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "REST API",
      version: "1.0.0",
      description: "REST API med bruger-authentication og admin-funktioner",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [path.join(__dirname, "app.js")],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let dbPath = path.join(__dirname, "user_db.json");

function setDbPath(p) { dbPath = p; }

function initDb() {
  const adminHash = bcrypt.hashSync("admin123", config.saltRounds);
  const data = {
    nextId: 2,
    users: [{ id: 1, username: "admin", password: adminHash, role: "admin", active: true }],
  };
  writeDb(data);
  return data;
}

function readDb() {
  try {
    const content = fs.readFileSync(dbPath, "utf-8").trim();
    if (!content) return initDb();
    return JSON.parse(content);
  } catch {
    return initDb();
  }
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Ingen token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], config.jwtSecret);
    const db = readDb();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user || !user.active) return res.status(403).json({ error: "Konto deaktiveret" });
    next();
  } catch {
    res.status(401).json({ error: "Ugyldig token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Kun admin" });
  next();
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Opret ny bruger
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: hemmeligt123
 *     responses:
 *       201:
 *         description: Bruger oprettet
 *       400:
 *         description: Brugernavn og password er påkrævet
 *       409:
 *         description: Brugernavn er allerede taget
 */
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Brugernavn og password er påkrævet" });

  const db = readDb();
  if (db.users.find((u) => u.username === username)) return res.status(409).json({ error: "Brugernavn er allerede taget" });

  const user = { id: db.nextId++, username, password: bcrypt.hashSync(password, config.saltRounds), role: "user", active: true };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log ind og modtag JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login lykkedes, returnerer JWT token
 *       400:
 *         description: Brugernavn og password er påkrævet
 *       401:
 *         description: Forkert brugernavn eller password
 *       403:
 *         description: Konto er deaktiveret
 */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Brugernavn og password er påkrævet" });

  const db = readDb();
  const user = db.users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: "Forkert brugernavn eller password" });
  if (!user.active) return res.status(403).json({ error: "Konto er deaktiveret" });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Forkert brugernavn eller password" });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: config.tokenExpiry });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Hent den aktuelle brugers profil
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brugeroplysninger
 *       401:
 *         description: Ingen eller ugyldig token
 *       403:
 *         description: Konto deaktiveret
 */
app.get("/api/auth/me", auth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({ id: user.id, username: user.username, role: user.role, active: user.active });
});

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Skift password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: admin123
 *               newPassword:
 *                 type: string
 *                 example: nytPassword456
 *     responses:
 *       200:
 *         description: Password ændret
 *       400:
 *         description: Nuværende og nyt password påkrævet
 *       401:
 *         description: Forkert nuværende password
 */
app.put("/api/auth/password", auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Nuværende og nyt password påkrævet" });

  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: "Forkert nuværende password" });

  user.password = bcrypt.hashSync(newPassword, config.saltRounds);
  writeDb(db);
  res.json({ message: "Password ændret" });
});

/**
 * @swagger
 * /api/auth/deactivate:
 *   put:
 *     summary: Deaktiver egen konto
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Konto deaktiveret
 *       401:
 *         description: Ingen eller ugyldig token
 */
app.put("/api/auth/deactivate", auth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  user.active = false;
  writeDb(db);
  res.json({ message: "Konto deaktiveret" });
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Hent alle brugere (kun admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste over alle brugere (uden passwords)
 *       401:
 *         description: Ingen eller ugyldig token
 *       403:
 *         description: Kun admin har adgang
 */
app.get("/api/admin/users", auth, adminOnly, (req, res) => {
  const db = readDb();
  res.json(db.users.map(({ password, ...u }) => u));
});

/**
 * @swagger
 * /api/admin/reactivate/{id}:
 *   put:
 *     summary: Genaktiver en bruger (kun admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Brugerens ID
 *     responses:
 *       200:
 *         description: Bruger genaktiveret
 *       401:
 *         description: Ingen eller ugyldig token
 *       403:
 *         description: Kun admin har adgang
 *       404:
 *         description: Bruger ikke fundet
 */
app.put("/api/admin/reactivate/:id", auth, adminOnly, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "Bruger ikke fundet" });

  user.active = true;
  writeDb(db);
  res.json({ message: `${user.username} er aktiveret igen` });
});

app.setDbPath = setDbPath;
app.writeDb = writeDb;
app.readDb = readDb;

module.exports = app;
