// ====== STATE & LOCAL STORAGE ======
const STORAGE_KEY = "trackFitnessState";

let state = {
  activities: [], // {id, date, type, duration, distance, notes}
  goals: {
    weeklyMinutes: 150,
    monthlyDistance: 40
  },
  profile: {
    name: "",
    units: "km",
    timezone: "",
    defaultActivities: ["Run", "Walk", "Bike", "Swim"]
  },
  auth: {
    currentUser: null, // email string
    users: [] // {name, email, password}
  }
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved state", e);
    }
  }
  // Ensure new auth field exists even if old data is loaded
  if (!state.auth) {
    state.auth = { currentUser: null, users: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ====== DATE HELPERS ======
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon ...
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameWeek(date, weekStart) {
  const d = new Date(date);
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function isSameMonth(date, monthDate) {
  const d = new Date(date);
  const m = new Date(monthDate);
  return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
}

function getWeekdayIndex(date) {
  // Monday=0 ... Sunday=6
  const d = new Date(date);
  let day = d.getDay(); // 0 Sun
  return day === 0 ? 6 : day - 1;
}

// ====== VIEW SWITCHING ======
let navButtons;

function showView(viewId) {
  // If not logged in, force Auth view (except when already on auth)
  if (!state.auth.currentUser && viewId !== "auth") {
    viewId = "auth";
  }

  document
    .querySelectorAll(".view")
    .forEach(v => v.classList.toggle("active", v.id === viewId));

  // Highlight nav only when logged in
  if (navButtons) {
    navButtons.forEach(btn => {
      const isActive =
        state.auth.currentUser && btn.dataset.view === viewId;
      btn.classList.toggle("active", isActive);
    });
  }
}

function updateAuthUI() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  if (state.auth.currentUser) {
    // Logged in
    logoutBtn.style.display = "inline-flex";
    showView("dashboard");
  } else {
    // Logged out
    logoutBtn.style.display = "none";
    showView("auth");
  }
}

// ====== NAVIGATION BUTTONS ======
function setupNav() {
  navButtons = document.querySelectorAll(".nav-link");
  const quickAddBtn = document.querySelector(".quick-add-btn");
  const logoutBtn = document.getElementById("logout-btn");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  quickAddBtn.addEventListener("click", () => showView("log"));

  logoutBtn.addEventListener("click", () => {
    if (confirm("Log out of Track Fitness?")) {
      state.auth.currentUser = null;
      saveState();
      updateAuthUI();
    }
  });
}

// ====== AUTH: LOGIN + SIGNUP ======
function setupAuth() {
  const btnShowLogin = document.getElementById("btn-show-login");
  const btnShowSignup = document.getElementById("btn-show-signup");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");

  const signupName = document.getElementById("signup-name");
  const signupEmail = document.getElementById("signup-email");
  const signupPassword = document.getElementById("signup-password");

  // Toggle between login and signup forms
  btnShowLogin.addEventListener("click", () => {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  });

  btnShowSignup.addEventListener("click", () => {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  });

  // Login
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const user = state.auth.users.find(u => u.email === email);
    if (!user || user.password !== password) {
      alert("Invalid email or password.");
      return;
    }

    state.auth.currentUser = email;
    saveState();

    // Optional: update profile name from user record
    if (user.name && !state.profile.name) {
      state.profile.name = user.name;
      saveState();
    }

    loginPassword.value = "";
    updateAuthUI();
  });

  // Signup
  signupForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = signupName.value.trim();
    const email = signupEmail.value.trim().toLowerCase();
    const password = signupPassword.value;

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const existing = state.auth.users.find(u => u.email === email);
    if (existing) {
      alert("An account with that email already exists. Try logging in.");
      return;
    }

    state.auth.users.push({ name, email, password });
    state.auth.currentUser = email;
    state.profile.name = name;
    saveState();

    // Clear fields
    signupPassword.value = "";
    updateAuthUI();
  });

  // If we already have a logged-in user saved, go straight to dashboard
  updateAuthUI();
}

// ====== LOG ACTIVITY: FORM + PRESET BUTTONS ======
function setupLogForm() {
  const form = document.getElementById("log-form");
  const dateInput = document.getElementById("date");
  const typeInput = document.getElementById("type");
  const durationInput = document.getElementById("duration");
  const distanceInput = document.getElementById("distance");
  const notesInput = document.getElementById("notes");

  // default date
  dateInput.value = todayISO();

  form.addEventListener("submit", e => {
    e.preventDefault();

    const activity = {
      id: Date.now(),
      date: dateInput.value || todayISO(),
      type: typeInput.value,
      duration: Number(durationInput.value) || 0,
      distance: Number(distanceInput.value) || 0,
      notes: notesInput.value.trim()
    };

    state.activities.push(activity);
    saveState();

    form.reset();
    dateInput.value = todayISO(); // keep today as default
    renderAll();
  });

  // preset chips in Log Activity section
  document.querySelectorAll(".chip[data-type]").forEach(chip => {
    chip.addEventListener("click", () => {
      typeInput.value = chip.dataset.type;
      durationInput.value = chip.dataset.duration;
    });
  });
}

// ====== HISTORY: FILTER BUTTONS + CLEAR ======
function setupHistoryFilters() {
  document
    .getElementById("filter-type")
    .addEventListener("change", renderHistory);
  document
    .getElementById("filter-from")
    .addEventListener("change", renderHistory);
  document
    .getElementById("filter-to")
    .addEventListener("change", renderHistory);
  document
    .getElementById("search-notes")
    .addEventListener("input", renderHistory);

  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("filter-type").value = "";
    document.getElementById("filter-from").value = "";
    document.getElementById("filter-to").value = "";
    document.getElementById("search-notes").value = "";
    renderHistory();
  });
}

function getFilteredActivities() {
  const type = document.getElementById("filter-type").value;
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;
  const notesSearch = document
    .getElementById("search-notes")
    .value.toLowerCase()
    .trim();

  return state.activities.filter(a => {
    if (type && a.type !== type) return false;
    if (from && a.date < from) return false;
    if (to && a.date > to) return false;
    if (notesSearch && !a.notes.toLowerCase().includes(notesSearch))
      return false;
    return true;
  });
}

function renderHistory() {
  const tbody = document.getElementById("history-body");
  tbody.innerHTML = "";

  const filtered = getFilteredActivities().sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  let totalMin = 0;
  let totalDist = 0;

  filtered.forEach(a => {
    totalMin += a.duration;
    totalDist += a.distance;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.date}</td>
      <td>${a.type}</td>
      <td>${a.duration} min</td>
      <td>${a.distance} km</td>
      <td>${a.notes || ""}</td>
      <td>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    // Edit button
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      const newDur = prompt("New duration (min):", a.duration);
      if (newDur !== null && newDur !== "") {
        a.duration = Number(newDur) || a.duration;
      }

      const newDist = prompt("New distance (km):", a.distance);
      if (newDist !== null && newDist !== "") {
        a.distance = Number(newDist) || a.distance;
      }

      const newNotes = prompt("New notes:", a.notes);
      if (newNotes !== null) {
        a.notes = newNotes;
      }

      saveState();
      renderAll();
    });

    // Delete button
    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Delete this activity?")) {
        state.activities = state.activities.filter(x => x.id !== a.id);
        saveState();
        renderAll();
      }
    });

    tbody.appendChild(tr);
  });

  document.getElementById(
    "history-total-min"
  ).textContent = `Total min: ${totalMin}`;
  document.getElementById(
    "history-total-dist"
  ).textContent = `Total distance: ${totalDist.toFixed(1)} km`;
}

// ====== DASHBOARD CARDS + WEEKLY BARS ======
function renderDashboard() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const weeklyTotals = Array(7).fill(0);
  let thisWeekMin = 0;
  let lastWeekMin = 0;
  let monthActivities = 0;

  state.activities.forEach(a => {
    if (isSameWeek(a.date, weekStart)) {
      thisWeekMin += a.duration;
      const idx = getWeekdayIndex(a.date);
      weeklyTotals[idx] += a.duration;
    }
    if (isSameWeek(a.date, lastWeekStart)) {
      lastWeekMin += a.duration;
    }
    if (isSameMonth(a.date, now)) {
      monthActivities += 1;
    }
  });

  const vsLast = thisWeekMin - lastWeekMin;

  document.getElementById("dash-week-min").textContent = thisWeekMin;
  document.getElementById(
    "dash-vs-last"
  ).textContent = `${vsLast >= 0 ? "+" : ""}${vsLast} vs last week`;
  document.getElementById("dash-activities").textContent = monthActivities;

  // streak = consecutive days up to today with any activity
  let streak = 0;
  const dates = new Set(state.activities.map(a => a.date));
  const cursor = new Date(now);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  document.getElementById("dash-streak").textContent = `${streak} days`;

  // weekly bars
  const barsContainer = document.getElementById("weekly-bars");
  barsContainer.innerHTML = "";
  const max = Math.max(...weeklyTotals, 1);
  weeklyTotals.forEach(total => {
    const bg = document.createElement("div");
    bg.className = "weekly-bar-bg";
    const fill = document.createElement("div");
    fill.className = "weekly-bar-fill";
    fill.style.height = `${(total / max) * 100}%`;
    bg.appendChild(fill);
    barsContainer.appendChild(bg);
  });

  renderGoalProgress();
}

// ====== GOALS: SAVE BUTTON + PROGRESS ======
function setupGoalsForm() {
  const form = document.getElementById("goals-form");
  const weeklyInput = document.getElementById("goal-weekly-min");
  const monthlyInput = document.getElementById("goal-monthly-dist");

  weeklyInput.value = state.goals.weeklyMinutes;
  monthlyInput.value = state.goals.monthlyDistance;

  form.addEventListener("submit", e => {
    e.preventDefault();
    state.goals.weeklyMinutes = Number(weeklyInput.value) || 0;
    state.goals.monthlyDistance = Number(monthlyInput.value) || 0;
    saveState();
    renderGoalProgress();
    alert("Goals saved");
  });
}

function renderGoalProgress() {
  const now = new Date();
  const weekStart = startOfWeek(now);

  let weeklyMin = 0;
  let monthlyDist = 0;

  state.activities.forEach(a => {
    if (isSameWeek(a.date, weekStart)) weeklyMin += a.duration;
    if (isSameMonth(a.date, now)) monthlyDist += a.distance;
  });

  const weeklyGoal = state.goals.weeklyMinutes || 0;
  const monthlyGoal = state.goals.monthlyDistance || 0;

  const weeklyPercent = weeklyGoal
    ? Math.min(100, (weeklyMin / weeklyGoal) * 100)
    : 0;
  const monthlyPercent = monthlyGoal
    ? Math.min(100, (monthlyDist / monthlyGoal) * 100)
    : 0;

  document.getElementById("weekly-goal-bar").style.width = weeklyPercent + "%";
  document.getElementById("monthly-goal-bar").style.width =
    monthlyPercent + "%";

  document.getElementById(
    "weekly-goal-text"
  ).textContent = `${weeklyMin} / ${weeklyGoal} min`;
  document.getElementById(
    "monthly-goal-text"
  ).textContent = `${monthlyDist.toFixed(1)} / ${monthlyGoal} km`;
}

// ====== PROFILE: SAVE BUTTON ======
function setupProfileForm() {
  const form = document.getElementById("profile-form");
  const nameInput = document.getElementById("profile-name");
  const unitsSelect = document.getElementById("units");
  const tzInput = document.getElementById("timezone");

  nameInput.value = state.profile.name;
  unitsSelect.value = state.profile.units;
  tzInput.value = state.profile.timezone;

  form.addEventListener("submit", e => {
    e.preventDefault();
    state.profile.name = nameInput.value.trim();
    state.profile.units = unitsSelect.value;
    state.profile.timezone = tzInput.value.trim();
    saveState();
    alert("Profile saved");
  });
}

// ====== RENDER ======
function renderAll() {
  renderDashboard();
  renderHistory();
}

// ====== INIT ======
loadState();

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupAuth();
  setupLogForm();
  setupHistoryFilters();
  setupGoalsForm();
  setupProfileForm();
  renderAll();
});
