
const supabaseClient = supabase.createClient(
  "https://qixvkbivnohcngaicsgy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeHZrYml2bm9oY25nYWljc2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjUyODMsImV4cCI6MjA4NjE0MTI4M30.yCLN7qQasQoQT7wzZzyKip1JVgkcjOW4wOpDWKhpCh8"
);

const auth = document.getElementById("auth");
const app = document.getElementById("app");
const statusText = document.getElementById("status");
const limitText = document.getElementById("limit");
const btn = document.getElementById("puffBtn");
const ctx = document.getElementById("chart");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const themeToggle = document.getElementById("themeToggle");

let chart;

function applyTheme(name){
  document.body.classList.toggle('dark', name==='dark');
  themeToggle.textContent = name==='auto'? 'Авто' : (name==='dark'? 'Тёмная' : 'Светлая');
}

async function saveThemeForUser(theme){
  try{
    const user = supabaseClient.auth.getUser ? (await supabaseClient.auth.getUser()).data.user : null;
    if(user){
      await supabaseClient.auth.updateUser({ data: { theme } });
    }
  }catch(e){/* non-fatal */}
}

function loadStoredTheme(){
  const t = localStorage.getItem('qs_theme') || 'auto';
  if(t==='auto'){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark? 'dark' : 'light');
  }else applyTheme(t);
  themeToggle.dataset.theme = t;
}

async function login() {
  const email = emailInput.value;
  if(!email) return alert('Введите email');
  await supabaseClient.auth.signInWithOtp({ email });
  alert("Письмо отправлено");
}

async function logout() {
  await supabaseClient.auth.signOut();
}

// Подписка на изменение аутентификации
supabaseClient.auth.onAuthStateChange((_, session) => {
  const user = session && session.user ? session.user : null;
  if (user) init(user.id, session.user.user_metadata?.theme);
  else {
    auth.style.display = "block";
    app.style.display = "none";
  }
});

async function init(userId, userTheme) {
  auth.style.display = "none";
  app.style.display = "block";

  const { data: plan } = await supabase
    .from("quit_plan")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!plan) {
    await supabase.from("quit_plan").insert({
      user_id: userId,
      start_limit: 30,
      daily_step: 1,
      start_date: new Date().toISOString().split("T")[0]
    });
    return init(userId);
  }

  const days = Math.floor(
    (new Date() - new Date(plan.start_date)) / 86400000
  );

  const limit = Math.max(
    plan.start_limit - days * plan.daily_step,
    plan.min_limit || 0
  );

  async function todayCount() {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("puffs")
      .select("*", { count:"exact", head:true })
      .eq("user_id", userId)
      .gte("created_at", today);
    return count || 0;
  }

  async function addPuff() {
    await supabaseClient.from("puffs").insert({ user_id: userId });
    load();
  }

  async function graph() {
    const { data } = await supabaseClient
      .from("puffs")
      .select("created_at")
      .eq("user_id", userId);

    const daysMap = {};
    data.forEach(p => {
      const d = p.created_at.split("T")[0];
      daysMap[d] = (daysMap[d] || 0) + 1;
    });

    const labels = Object.keys(daysMap);
    const values = Object.values(daysMap);
    const limits = labels.map((_, i) =>
      Math.max(plan.start_limit - i * plan.daily_step, plan.min_limit || 0)
    );

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label:"Затяжки", data:values },
          { label:"Лимит", data:limits }
        ]
      }
    });
  }

  async function load() {
    const count = await todayCount();
    statusText.textContent =
      count === 0 ? "Сегодня без курения — красавчик."
      : count < limit ? "Ты идёшь лучше плана."
      : "Лимит достигнут. Остановиться сейчас — победа.";

    limitText.textContent = `Сегодняшний лимит: ${limit}`;
    btn.disabled = count >= limit;
    graph();
  }
  btn.onclick = addPuff;
  load();
  // apply theme preference: user metadata overrides local storage
  if(userTheme){
    applyTheme(userTheme);
    localStorage.setItem('qs_theme', userTheme);
  }else loadStoredTheme();
}

// UI handlers
loginBtn?.addEventListener('click', login);
logoutBtn?.addEventListener('click', async ()=>{ await logout(); location.reload(); });
themeToggle?.addEventListener('click', async ()=>{
  const cur = themeToggle.dataset.theme || localStorage.getItem('qs_theme') || 'auto';
  const next = cur==='auto'?'dark':(cur==='dark'?'light':'auto');
  localStorage.setItem('qs_theme', next);
  applyTheme(next);
  await saveThemeForUser(next);
  themeToggle.dataset.theme = next;
});

// initial theme on page load
loadStoredTheme();
