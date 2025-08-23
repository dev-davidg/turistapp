
(() => {
  const STORE_USER = "hikesk_user_v1";

  async function fetchJSON(url){ const r = await fetch(url); if(!r.ok) throw new Error(url); return r.json(); }

  async function getRemoteData(){
    const [challenges, events] = await Promise.all([
      fetchJSON('data/challenges.json'),
      fetchJSON('data/events.json')
    ]);
    const user = JSON.parse(localStorage.getItem(STORE_USER) || '{"nick":"guest","joinedChallenges":[],"joinedEvents":[],"progress":{}}');
    return { user, challenges, events };
  }
  function setUser(u){ localStorage.setItem(STORE_USER, JSON.stringify(u)); }

  function bindLogout(){
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const u = JSON.parse(localStorage.getItem(STORE_USER) || '{"nick":"guest"}');
      const reset = { nick: u.nick || "guest", joinedChallenges: [], joinedEvents: [], progress: {} };
      setUser(reset);
      location.href = "login.html";
    });
  }

  function renderChallengeCard(ch, user) {
    const id = ch.id;
    const joined = user.joinedChallenges && user.joinedChallenges.includes(id);
    const items = ch.multiDay ? ch.checkpoints : ch.peaks;
    const total = items?.length || 0;
    const done = (user.progress[id] || []).filter(Boolean).length;
    const percent = total ? Math.round((done/total)*100) : 0;

    const chips = [];
    if (ch.multiDay) chips.push('Viacdňová');

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 flex flex-col justify-between card-hover';
    const link = document.createElement('a');
    link.href = `challenge.html?id=${id}`;
    link.className = 'flex-1 block';
    link.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">🏔️ ${ch.title}</h3>
      <p class="text-sm text-gray-600 mb-2">${ch.description}</p>
      ${chips.length ? `<div class="flex gap-2 mb-2">${chips.map(c => `<span class="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">${c}</span>`).join('')}</div>` : ''}
      <p class="text-xs text-gray-500 mb-1">Progres: ${done}/${total} · ${percent}%</p>
      <div class="h-2 bg-stone-200 rounded-full overflow-hidden"><div class="bg-green-600 h-2" style="width:${percent}%"></div></div>
    `;
    card.appendChild(link);

    const btn = document.createElement('button');
    btn.className = `mt-3 px-3 py-1 rounded text-white ${joined ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`;
    btn.textContent = joined ? '↩️ Odpojiť sa' : '➕ Zapoj sa';
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      user.joinedChallenges = user.joinedChallenges || [];
      if (joined) user.joinedChallenges = user.joinedChallenges.filter(cid => cid !== id);
      else {
        if (!user.joinedChallenges.includes(id)) user.joinedChallenges.push(id);
        if (!user.progress[id]) user.progress[id] = new Array(total).fill(false);
      }
      setUser(user); location.reload();
    });
    card.appendChild(btn);
    return card;
  }

  function renderEventCard(ev, user) {
    const id = ev.id;
    const joined = user.joinedEvents && user.joinedEvents.includes(id);

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 card-hover';
    const date = new Date(ev.dateTime);
    const dateStr = !isNaN(date) ? date.toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' }) : ev.dateTime;
    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">📅 ${ev.name}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${ev.address || 'Miesto stretnutia'}</p>
      <p class="text-sm text-gray-600 mb-3">🕒 ${dateStr}</p>
      <div class="flex gap-2">
        <a href="event.html?id=${id}" class="px-3 py-1 rounded border text-gray-700 hover:bg-stone-50">Detaily</a>
        <button class="px-3 py-1 rounded text-white ${joined ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}">
          ${joined ? '❌ Zrušiť účasť' : '📍 Zúčastním sa'}
        </button>
      </div>
    `;
    const btn = card.querySelector('button');
    btn.addEventListener('click', () => {
      user.joinedEvents = user.joinedEvents || [];
      if (joined) user.joinedEvents = user.joinedEvents.filter(eid => eid !== id);
      else if (!user.joinedEvents.includes(id)) user.joinedEvents.push(id);
      setUser(user); location.reload();
    });
    return card;
  }

  async function pageIndex(){
    const d = await getRemoteData();
    const user = d.user;
    const greet = document.getElementById("greeting");
    if (greet) greet.textContent = `Ahoj, @${user.nick}!`;

    const chList = document.getElementById("challengesList");
    d.challenges.forEach(ch => chList.appendChild(renderChallengeCard(ch, user)));

    const evList = document.getElementById("eventsList");
    d.events.forEach(e => evList.appendChild(renderEventCard(e, user)));
  }
  async function pageEvents(){
    const d = await getRemoteData();
    const user = d.user;
    const ev = document.getElementById("eventsList");
    d.events.forEach(e => ev.appendChild(renderEventCard(e, user)));
  }
  async function pageEvent(){
    const d = await getRemoteData();
    const params = new URLSearchParams(location.search);
    const event = d.events.find(x => x.id === params.get("id")) || d.events[0];
    document.getElementById("eventTitle").textContent = `📅 ${event.name}`;
    document.getElementById("eventMeta").textContent = `📍 ${event.address} · 🕒 ${new Date(event.dateTime).toLocaleString('sk-SK')}`;

    const map = L.map('map').setView([event.lat, event.lon], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
    L.marker([event.lat, event.lon]).addTo(map);

    const chatKey = "chat_" + event.id;
    const chat = JSON.parse(localStorage.getItem(chatKey) || "[]");
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = chat.map(m => `<div class="bg-white rounded border p-2"><strong>@${m.nick}:</strong> ${m.text}</div>`).join("");
    document.getElementById("chatSend").addEventListener("click", () => {
      const input = document.getElementById("chatInput");
      if (!input.value.trim()) return;
      chat.push({ nick: d.user.nick, text: input.value.trim(), at: Date.now() });
      localStorage.setItem(chatKey, JSON.stringify(chat));
      location.reload();
    });
  }
  async function pageChallenge(){
    const d = await getRemoteData();
    const params = new URLSearchParams(location.search);
    const ch = d.challenges.find(x => x.id === params.get("id")) || d.challenges[0];
    const user = d.user;

    document.getElementById("challengeTitle").textContent = `🏔️ ${ch.title}`;
    document.getElementById("challengeDesc").textContent = ch.description;
    const chips = document.getElementById("chips");
    chips.innerHTML = ch.multiDay ? `<span class="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">Viacdňová</span>` : "";

    const items = ch.multiDay ? ch.checkpoints : ch.peaks;
    const total = items.length;
    const done = (user.progress[ch.id] || []).filter(Boolean).length;
    const percent = total ? Math.round((done/total)*100) : 0;
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressText").textContent = `Progres: ${done}/${total} · ${percent}%`;

    const center = items[0] ? [items[0].lat, items[0].lon] : [48.7, 19.7];
    const map = L.map('map').setView(center, 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
    items.forEach(it => L.marker([it.lat, it.lon]).addTo(map).bindPopup(it.name));

    const list = document.getElementById("itemsList");
    list.innerHTML = items.map((it, idx) => {
      const checked = (user.progress[ch.id] || [])[idx] ? "checked" : "";
      return `<li class="my-1"><label class="flex items-center gap-2"><input data-idx="${idx}" type="checkbox" class="accent-green-700" ${checked}/> <span>📍 ${it.name}</span></label></li>`;
    }).join("");
    list.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const i = Number(e.target.getAttribute("data-idx"));
        const u = d.user;
        u.progress[ch.id] = u.progress[ch.id] || new Array(total).fill(false);
        u.progress[ch.id][i] = e.target.checked;
        setUser(u);
        location.reload();
      });
    });
  }
  function pageProfile(){
    const u = JSON.parse(localStorage.getItem(STORE_USER) || '{"nick":"guest","badges":[]}');
    document.getElementById("profileName").textContent = "@" + (u.nick || "guest");
    document.getElementById("profileMeta").textContent = "LVL 1 | Hobby: turistika, cyklo";
    const badges = document.getElementById("badges");
    badges.innerHTML = (u.badges || ["4-stit-yolo"]).map(b => `<span class="px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-700 border border-amber-200">🏅 ${b}</span>`).join("");
  }
  function pageLogin(){
    const btn = document.getElementById("loginBtn");
    const nick = document.getElementById("nick");
    btn.addEventListener("click", () => {
      const v = (nick.value || "").trim() || "guest";
      const u = JSON.parse(localStorage.getItem(STORE_USER) || "{}");
      u.nick = v; localStorage.setItem(STORE_USER, JSON.stringify(u));
      location.href = "index.html";
    });
  }

  function init(){
    bindLogout();
    if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("serviceworker.js"); } catch(e){} }
    const page = document.body.getAttribute("data-page") || "index";
    if (page === "index") return pageIndex();
    if (page === "events") return pageEvents();
    if (page === "event") return pageEvent();
    if (page === "challenge") return pageChallenge();
    if (page === "profile") return pageProfile();
    if (page === "login") return pageLogin();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
