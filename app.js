
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
let currentUserId = null;
supabaseClient.auth.onAuthStateChange((_, session) => {
  const user = session && session.user ? session.user : null;
  if (user) {
    currentUserId = user.id;
    init(user.id, session.user.user_metadata?.theme);
  } else {
    currentUserId = null;
    auth.style.display = "block";
    app.style.display = "none";
  }
});

async function init(userId, userTheme) {
  auth.style.display = "none";
  app.style.display = "block";

  const { data: plan } = await supabaseClient
    .from("quit_plan")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!plan) {
    await supabaseClient.from("quit_plan").insert({
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
    const { count } = await supabaseClient
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

  // after init show feed and update profile/friends
  try{ showView && showView('feed'); }catch(e){}
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

// Compact app UI: navigation, friends and profile
const navFeed = document.getElementById('navFeed');
const navFriends = document.getElementById('navFriends');
const navProfile = document.getElementById('navProfile');
const friendEmailInput = document.getElementById('friendEmail');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendListEl = document.getElementById('friendList');
const avatarEl = document.getElementById('avatar');

function showView(name){
  const feed = document.getElementById('feedView');
  const friends = document.getElementById('friendsView');
  const profile = document.getElementById('profileView');
  feed.style.display = name==='feed'? 'block':'none';
  friends.style.display = name==='friends'? 'block':'none';
  profile.style.display = name==='profile'? 'block':'none';
}

function friendsKey(){ return 'qs_friends_' + (currentUserId || 'anon'); }
function loadFriends(){ try{ return JSON.parse(localStorage.getItem(friendsKey()) || '[]'); }catch(e){return []} }
function saveFriends(list){ localStorage.setItem(friendsKey(), JSON.stringify(list)); }

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

function renderFriends(){
  if(!friendListEl) return;
  const list = loadFriends();
  friendListEl.innerHTML = '';
  list.forEach((f,i)=>{
    const li = document.createElement('li');
    li.style.padding = '8px 6px';
    li.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
    li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">${escapeHtml(f.name||f.email)}</div><div class="muted" style="font-size:12px">${escapeHtml(f.email)}</div></div><div><button data-i="${i}" class="removeFriendBtn">Удалить</button></div></div>`;
    friendListEl.appendChild(li);
  });
  friendListEl.querySelectorAll('.removeFriendBtn').forEach(b=>b.addEventListener('click', e=>{
    const idx = +e.target.dataset.i;
    const arr = loadFriends(); arr.splice(idx,1); saveFriends(arr); renderFriends();
  }));
}

addFriendBtn?.addEventListener('click', ()=>{
  const em = friendEmailInput?.value?.trim();
  if(!em) return alert('Введите email друга');
  const list = loadFriends();
  if(list.find(x=>x.email===em)) return alert('Этот пользователь уже в друзьях');
  list.push({ email: em, name: em.split('@')[0] });
  saveFriends(list);
  friendEmailInput.value = '';
  renderFriends();
});

navFeed?.addEventListener('click', ()=>{ showView('feed'); });
navFriends?.addEventListener('click', ()=>{ showView('friends'); renderFriends(); });
navProfile?.addEventListener('click', ()=>{ showView('profile'); renderProfile(); });

async function renderProfile(){
  const info = document.getElementById('profileInfo');
  if(!info) return;
  try{
    const r = await supabaseClient.auth.getUser();
    const user = r?.data?.user || null;
    if(user){
      avatarEl.textContent = (user.email||'U').slice(0,2).toUpperCase();
      info.innerHTML = `<div style="font-weight:700">${escapeHtml(user.email||'')}</div><div class="muted" style="font-size:13px">id: ${escapeHtml(user.id||'')}</div>`;
    }else{
      info.textContent = 'Гость';
    }
  }catch(e){ info.textContent = 'Ошибка загрузки профиля'; }
}

// quick default view
showView('feed');
