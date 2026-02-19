const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../app");

const TEST_DB = path.join(__dirname, "test-users.json");

beforeEach(() => {
  app.setDbPath(TEST_DB);
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function getToken(username, password) {
  const res = await request(app).post("/api/auth/login").send({ username, password });
  return res.body.token;
}

test("Admin oprettes automatisk og kan logge ind", async () => {
  const res = await request(app).post("/api/auth/login").send({ username: "admin", password: "admin123" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
  expect(res.body.user.role).toBe("admin");
});

test("Login fejler med forkert password", async () => {
  const res = await request(app).post("/api/auth/login").send({ username: "admin", password: "forkert" });
  expect(res.status).toBe(401);
});



test("Admin reaktiverer en konto", async () => {
  await request(app).post("/api/auth/register").send({ username: "inaktiv", password: "1234" });
  const userToken = await getToken("inaktiv", "1234");
  await request(app).put("/api/auth/deactivate").set("Authorization", `Bearer ${userToken}`);

  const adminToken = await getToken("admin", "admin123");
  const user = app.readDb().users.find((u) => u.username === "inaktiv");

  const res = await request(app).put(`/api/admin/reactivate/${user.id}`).set("Authorization", `Bearer ${adminToken}`);
  expect(res.status).toBe(200);

  const login = await request(app).post("/api/auth/login").send({ username: "inaktiv", password: "1234" });
  expect(login.status).toBe(200);
});


test("Normal bruger kan ikke tilgå admin endpoints", async () => {
  await request(app).post("/api/auth/register").send({ username: "normal", password: "1234" });
  const token = await getToken("normal", "1234");
  const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(403);
});
