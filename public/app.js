const API = "/api";
let token = localStorage.getItem("token");
const $ = (id) => document.getElementById(id);

$("show-register").addEventListener("click", (e) => { e.preventDefault(); show("register"); });
$("show-login").addEventListener("click", (e) => { e.preventDefault(); show("login"); });

function show(page) {
  $("login-page").hidden = page !== "login";
  $("register-page").hidden = page !== "register";
  $("dashboard").hidden = page !== "dashboard";
  $("dashboard").classList.toggle("visible", page === "dashboard");
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-error").hidden = true;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: $("login-user").value, password: $("login-pass").value }),
  });
  const data = await res.json();

  if (!res.ok) {
    $("login-error").textContent = data.error;
    $("login-error").hidden = false;
    return;
  }

  token = data.token;
  localStorage.setItem("token", token);
  openDashboard(data.user);
});

$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("reg-error").hidden = true;

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: $("reg-user").value, password: $("reg-pass").value }),
  });
  const data = await res.json();

  if (!res.ok) {
    $("reg-error").textContent = data.error;
    $("reg-error").hidden = false;
    return;
  }

  show("login");
});

async function openDashboard(user) {
  if (!user) {
    const res = await fetch(`${API}/auth/me`, { headers: authHeader() });
    if (!res.ok) { logout(); return; }
    user = await res.json();
  }

  $("nav-user").textContent = `${user.username} (${user.role})`;
  show("dashboard");

  $("admin-section").hidden = user.role !== "admin";
  if (user.role === "admin") loadUsers();
}

$("pw-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch(`${API}/auth/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ currentPassword: $("pw-current").value, newPassword: $("pw-new").value }),
  });
  const data = await res.json();
  const msg = $("pw-msg");
  msg.textContent = res.ok ? data.message : data.error;
  msg.className = res.ok ? "msg" : "msg error";
  msg.hidden = false;
  if (res.ok) $("pw-form").reset();
});

$("deactivate-btn").addEventListener("click", async () => {
  if (!confirm("Er du sikker på du vil deaktivere din konto?")) return;
  await fetch(`${API}/auth/deactivate`, { method: "PUT", headers: authHeader() });
  logout();
});

async function loadUsers() {
  const res = await fetch(`${API}/admin/users`, { headers: authHeader() });
  const users = await res.json();
  $("users-table").innerHTML = users.map((u) => `
    <tr>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.role}</td>
      <td><span class="badge ${u.active ? "active" : "inactive"}">${u.active ? "Aktiv" : "Inaktiv"}</span></td>
      <td>${!u.active ? `<button onclick="reactivate(${u.id})">Aktiver</button>` : ""}</td>
    </tr>
  `).join("");
}

async function reactivate(id) {
  await fetch(`${API}/admin/reactivate/${id}`, { method: "PUT", headers: authHeader() });
  loadUsers();
}

$("logout-btn").addEventListener("click", logout);

function logout() {
  token = null;
  localStorage.removeItem("token");
  show("login");
}

function authHeader() {
  return { Authorization: `Bearer ${token}` };
}

if (token) openDashboard();
else show("login");
