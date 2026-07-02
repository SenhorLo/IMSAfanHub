/* ==========================================================================
   IMSA HUB · interações
   ========================================================================== */

/* ---------- Render dos cards de equipe ---------- */
function teamCard(e, i) {
  const color = BRAND[e.brand] || "#888";
  const imgHtml = e.img
    ? `<div class="team-photo"><img loading="lazy" src="${commons(e.img)}" alt="#${e.num} ${e.team} · ${e.car}"></div>`
    : `<div class="team-photo team-photo--empty"><span>#${e.num}</span><small>${e.brand}</small></div>`;
  return `
    <article class="team" style="--brand:${color}" data-idx="${i}" tabindex="0" role="button" aria-label="Ver ${e.team}">
      ${imgHtml}
      <div class="team-info">
        <div class="team-top">
          <span class="team-num">#${e.num}</span>
          <span class="team-brand">${e.brand}</span>
        </div>
        <h3 class="team-car">${e.car}</h3>
        <p class="team-name">${e.team}</p>
        <p class="team-drivers">${e.drivers}</p>
      </div>
    </article>`;
}

function renderGrid(id, list, classLabel) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = list.map((e, i) => teamCard(e, i)).join("");
  el.querySelectorAll(".team").forEach(card => {
    const e = list[+card.dataset.idx];
    const open = () => openCar(e, classLabel);
    card.addEventListener("click", open);
    card.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); }
    });
  });
}

renderGrid("gtpGrid", GTP, "GTP · Grand Touring Prototype");
renderGrid("proGrid", GTDPRO, "GTD PRO · GT Daytona Pro");
renderGrid("gtdGrid", GTD, "GTD · GT Daytona");

/* ---------- Imagem única dos LMP2 ---------- */
(function lmp2Image() {
  const fig = document.getElementById("lmp2Figure");
  if (!fig || typeof LMP2_IMG === "undefined") return;
  const img = new Image();
  img.loading = "lazy";
  img.src = commons(LMP2_IMG);
  img.alt = "LMP2 · Oreca 07";
  fig.insertBefore(img, fig.firstChild);
})();

/* ---------- Tabs GTD Pro / GTD ---------- */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab;
    document.querySelectorAll("[data-tabpanel]").forEach(p => {
      p.classList.toggle("hidden", p.dataset.tabpanel !== target);
    });
  });
});

/* ---------- Calendário: grid de pistas + modal ---------- */
(function renderTracks() {
  const el = document.getElementById("timeline");
  if (!el) return;
  const now = new Date();

  el.innerHTML = SCHEDULE.map((r, i) => {
    const done = new Date(r.end + "T23:59:59") < now;
    const mapHtml = r.map
      ? `<img loading="lazy" src="${commons(r.map)}" alt="Traçado ${r.track}">`
      : "";
    return `
      <button class="track-card ${done ? "done" : ""} ${r.enduro ? "enduro" : ""}" data-idx="${i}">
        <div class="tc-top">
          <span class="tc-round">R${r.round}</span>
          ${r.enduro ? '<span class="tc-badge">Endurance ★</span>' : ""}
        </div>
        <div class="tc-map">${mapHtml}</div>
        <p class="tc-name">${r.name}</p>
        <p class="tc-track">${r.track}</p>
        <div class="tc-meta">
          <span>${r.loc}</span>
          <span class="tc-date">${r.date} · ${r.len}</span>
        </div>
      </button>`;
  }).join("");

  el.querySelectorAll(".track-card").forEach(card => {
    card.addEventListener("click", () => openTrack(SCHEDULE[+card.dataset.idx]));
  });
})();

/* ---------- Modais (pista e carro) ---------- */
function openModal(el) {
  if (!el) return;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModals() {
  document.querySelectorAll(".modal.open").forEach(m => {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
}

// Modal de pista
const trackModal = document.getElementById("trackModal");
function openTrack(r) {
  if (!trackModal) return;
  const img = document.getElementById("mImg");
  img.src = r.map ? commons(r.map) : "";
  img.alt = "Traçado " + r.track;
  document.getElementById("mRound").textContent =
    "Rodada " + r.round + (r.enduro ? " · Michelin Endurance Cup" : "");
  document.getElementById("mName").textContent = r.name;
  document.getElementById("mLoc").textContent = r.track + " · " + r.loc;
  document.getElementById("mFacts").innerHTML = `
    <li><span>Data</span><b>${r.date}</b></li>
    <li><span>Duração</span><b>${r.len}</b></li>
    <li><span>Extensão</span><b>${r.km || "—"}</b></li>
    <li><span>Curvas</span><b>${r.turns != null ? r.turns : "—"}</b></li>
    <li><span>Tipo de pista</span><b>${r.type || "—"}</b></li>
    <li><span>Local</span><b>${r.loc}</b></li>
    <li><span>Formato</span><b>${r.enduro ? "Endurance (longa duração)" : "Sprint"}</b></li>`;
  openModal(trackModal);
}

// Modal de carro
const carModal = document.getElementById("carModal");
function openCar(e, classLabel) {
  if (!carModal) return;
  const img = document.getElementById("cImg");
  const wrap = img.parentElement;
  if (e.img) {
    img.src = commons(e.img);
    img.alt = e.team + " · " + e.car;
    img.style.display = "";
    wrap.classList.remove("modal-map--empty");
    wrap.dataset.brand = "";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    wrap.classList.add("modal-map--empty");
    wrap.dataset.brand = "#" + e.num;
  }
  wrap.style.setProperty("--brand", BRAND[e.brand] || "#888");
  const s = (typeof CAR_SPECS !== "undefined" && CAR_SPECS[e.car]) || {};
  document.getElementById("cClass").textContent = classLabel || "";
  document.getElementById("cName").textContent = "#" + e.num + " · " + e.team;
  document.getElementById("cCar").textContent = e.car;
  document.getElementById("cFacts").innerHTML = `
    <li><span>Montadora</span><b>${e.brand}</b></li>
    <li><span>Motor</span><b>${s.motor || "—"}</b></li>
    <li><span>Potência</span><b>${s.potencia || "—"}</b></li>
    <li><span>Tração</span><b>${s.tracao || "—"}</b></li>
    <li><span>Peso mín.</span><b>${s.peso || "—"}</b></li>
    <li><span>Regulamento</span><b>${s.reg || "—"}</b></li>
    <li><span>Pilotos</span><b>${e.drivers}</b></li>`;
  openModal(carModal);
}

document.querySelectorAll(".modal [data-close]").forEach(b =>
  b.addEventListener("click", closeModals)
);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModals(); });

/* ---------- Pontuação: simulador + tabela ---------- */
(function points() {
  const base = { 1: 350, 2: 320, 3: 300, 4: 280, 5: 260 };
  const racePts = p => (p <= 5 ? base[p] : Math.max(260 - (p - 5) * 10, 0));
  const qualiPts = p => Math.round(racePts(p) / 10);
  const ord = p => p + "º";

  // Tabela (top 12)
  const body = document.getElementById("ptableBody");
  if (body) {
    let html = "";
    for (let p = 1; p <= 12; p++) {
      html += `<div class="ptr" data-pos="${p}">
        <span class="ptr-pos">${ord(p)}</span>
        <span class="ptr-race">${racePts(p)}</span>
        <span class="ptr-quali">${qualiPts(p)}</span>
      </div>`;
    }
    body.innerHTML = html;
  }

  // Simulador
  const range = document.getElementById("posRange");
  const elPos = document.getElementById("simPos");
  const elRace = document.getElementById("simRace");
  const elQuali = document.getElementById("simQuali");
  const elTotal = document.getElementById("simTotal");
  const elNote = document.getElementById("simNote");

  function update(p) {
    const r = racePts(p), q = qualiPts(p);
    if (elPos) elPos.textContent = ord(p);
    if (elRace) elRace.textContent = r;
    if (elQuali) elQuali.textContent = q;
    if (elTotal) elTotal.textContent = r + q;
    if (elNote) {
      elNote.textContent = p === 1
        ? "Vitória + pole: o máximo possível num fim de semana de Sprint."
        : `Terminando em ${ord(p)} na classe, ainda leva ${r} pontos — no IMSA, ninguém sai zerado.`;
    }
    if (body) {
      body.querySelectorAll(".ptr").forEach(row =>
        row.classList.toggle("active", +row.dataset.pos === p)
      );
    }
  }

  if (range) {
    range.addEventListener("input", () => update(+range.value));
    body && body.querySelectorAll(".ptr").forEach(row =>
      row.addEventListener("click", () => { range.value = row.dataset.pos; update(+row.dataset.pos); })
    );
    update(+range.value);
  }
})();

/* ---------- Countdown para a próxima etapa ---------- */
(function countdown() {
  const now = new Date();
  const next = SCHEDULE.find(r => new Date(r.end + "T23:59:59") >= now);
  const raceEl = document.getElementById("cdRace");

  if (!next) {
    if (raceEl) raceEl.textContent = "Temporada encerrada";
    return;
  }
  if (raceEl) raceEl.textContent = next.name;
  const target = new Date(next.end + "T14:00:00").getTime();

  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v).padStart(2, "0");
  };

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      set("cdD", 0); set("cdH", 0); set("cdM", 0); set("cdS", 0);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    set("cdD", d); set("cdH", h); set("cdM", m); set("cdS", s);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ---------- Nav: fundo ao rolar + menu mobile ---------- */
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
});

const toggle = document.getElementById("navToggle");
if (toggle) {
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  document.querySelectorAll(".nav-links a").forEach(a =>
    a.addEventListener("click", () => nav.classList.remove("open"))
  );
}

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("in");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".section-head, .cclass, .team, .track-card, .score-card, .dyn, .spec")
  .forEach(el => { el.classList.add("reveal"); io.observe(el); });
