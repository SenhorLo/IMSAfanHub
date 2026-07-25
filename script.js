/* ==========================================================================
   IMSA HUB · interface

   Tudo que é lista na página (faixa de tráfego, classes, grid, calendário,
   tabela de pontos) é montado a partir de data.js. Nenhum conteúdo é
   duplicado entre HTML e JS.
   ========================================================================== */
(function () {
  "use strict";

  /* ========================================================================
     Utilitários
     ======================================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Escapa texto antes de injetar em template. Os dados são nossos, mas o
  // grid tem nomes com aspas e acentos — melhor não depender disso.
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  const ord = (n) => n + "º";

  // Cada classe referencia sua própria variável de cor do CSS.
  const classColor = (id) => `var(--${id})`;

  const byId = (id) => CLASSES.find((c) => c.id === id);

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Silhuetas de carro, vistas de lado, viradas para a direita.
     São duas porque a diferença real do grid é essa: protótipo puro de
     corrida (GTP e LMP2) contra carro de GT derivado de rua (GTD Pro e GTD).
     A cor continua identificando a classe específica.
     ------------------------------------------------------------------------ */
  const SILHUETAS = {
    // baixo, longo, cabine quase rente ao capô, asa alta e fina
    prototipo: `
      <path d="M2 6.2h13.4v2.3H2z"/>
      <path d="M7.6 7.4h2.2v4.2H7.6z"/>
      <path d="M61.5 18.5 57 12.4 45 10.4 36 8 26 7.5 17 8.8 10 10.4 4 12.4 3 18.5Z"/>
      <circle cx="16.6" cy="18" r="4.6"/>
      <circle cx="49" cy="18" r="4.6"/>`,
    // cabine alta e recuada, montantes inclinados, conjunto mais encorpado
    gt: `
      <path d="M3 6.6h13v2.3H3z"/>
      <path d="M8.4 7.8h2.2v3.9H8.4z"/>
      <path d="M61 18.5 59.4 13 52 11.5 45.5 5.6 41 4 27 3.6 20.6 5.6 15 11.5 5 13 4 18.5Z"/>
      <circle cx="17" cy="18" r="4.8"/>
      <circle cx="48" cy="18" r="4.8"/>`,
  };

  const carroSVG = (tipo) =>
    `<svg class="runner-svg" viewBox="0 0 64 24" aria-hidden="true" focusable="false">${
      SILHUETAS[tipo] || SILHUETAS.gt
    }</svg>`;

  /* ========================================================================
     1 · Faixa de tráfego
     Cada classe circula no seu tempo de volta real. O GTP alcança o GTD
     na tela porque alcança mesmo na pista.
     ======================================================================== */
  (function trafficBand() {
    const lane = $("#band");
    const legend = $("#bandLegend");
    if (!lane || !legend) return;

    const SEGUNDOS_POR_VOLTA = 0.1;   // 1s de pista ≈ 0,1s de animação
    const LINHAS = ["26%", "42%", "60%", "76%"];      // linhas de corrida
    const PARADOS = ["10%", "34%", "58%", "78%"];     // posições sem animação
    const maisLento = Math.max(...CLASSES.map((c) => c.lap));

    lane.innerHTML = CLASSES.map((c, i) => {
      const dur = (c.lap * SEGUNDOS_POR_VOLTA).toFixed(2);
      const trail = Math.round(40 + (maisLento - c.lap) * 4);   // rastro maior = mais rápido
      return `
        <div class="runner" style="--c:${classColor(c.id)};--y:${LINHAS[i]};--dur:${dur}s;--trail:${trail}px;--parado:${PARADOS[i]}">
          <span class="runner-car">${carroSVG(c.type)}</span>
        </div>`;
    }).join("");

    legend.innerHTML = CLASSES.map((c) => `
      <div>
        <i style="--c:${classColor(c.id)}"></i>
        <dt>${esc(c.plate)}</dt>
        <dd>${esc(c.lapLabel)}</dd>
      </div>`).join("");
  })();

  /* ========================================================================
     2 · Classes
     Lista ordenada: da mais rápida para a mais lenta. A ordem é informação.
     ======================================================================== */
  (function classList() {
    const list = $("#classList");
    if (!list) return;

    list.innerHTML = CLASSES.map((c) => `
      <li class="rank" data-class="${esc(c.id)}" style="--c:${classColor(c.id)}">
        <p class="rank-plate">${esc(c.plate)}</p>
        <div>
          <h3 class="rank-name">${esc(c.name)}</h3>
          <p class="rank-text">${esc(c.summary)}</p>
        </div>
        <dl class="rank-data">
          <div><dt>Placa</dt><dd>${esc(c.placa)}</dd></div>
          <div><dt>Volta ref.</dt><dd>${esc(c.lapLabel)}</dd></div>
          <div><dt>Tripulação</dt><dd>${esc(c.crew)}</dd></div>
        </dl>
      </li>`).join("");
  })();

  /* ========================================================================
     3 · Grid + filtro por classe
     ======================================================================== */
  (function grid() {
    const wrap = $("#cars");
    const filters = $("#filters");
    const panel = $("#lmp2Panel");
    const count = $("#gridCount");
    if (!wrap || !filters) return;

    if (count) {
      count.textContent = `${ENTRIES.length} carros listados · LMP2 em ficha técnica`;
    }

    /* ---- cards ---- */
    wrap.innerHTML = ENTRIES.map((e, i) => `
      <button class="car" data-class="${esc(e.cls)}" data-idx="${i}"
              style="--c:${classColor(e.cls)}" type="button">
        <span class="car-shot" style="--marca:${esc(BRAND[e.brand] || "#3B4653")}">
          <img loading="lazy" decoding="async" src="${esc(commons(e.img))}"
               alt="${esc(`#${e.num} ${e.team}, ${e.car}`)}">
        </span>
        <span class="car-body">
          <span class="car-top">
            <span class="car-num">#${esc(e.num)}</span>
            <span class="car-brand">${esc(e.brand)}</span>
          </span>
          <span class="car-model">${esc(e.car)}</span>
          <span class="car-team">${esc(e.team)}</span>
          <span class="car-drivers">${esc(e.drivers)}</span>
        </span>
      </button>`).join("");

    // Se a foto do Commons não carregar, o espaço vira a placa da montadora.
    $$(".car-shot img", wrap).forEach((img) => {
      img.addEventListener("error", () => {
        const shot = img.parentElement;
        shot.classList.add("car-shot--fallback");
        shot.innerHTML = `<span>#${esc(ENTRIES[+shot.closest(".car").dataset.idx].num)}</span>`;
      }, { once: true });
    });

    $$(".car", wrap).forEach((card) => {
      card.addEventListener("click", () => openCarSheet(ENTRIES[+card.dataset.idx]));
    });

    /* ---- ficha LMP2 ---- */
    const shot = $("#lmp2Shot");
    if (shot) {
      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.src = commons(LMP2.img);
      img.alt = "LMP2 · Oreca 07 no IMSA";
      shot.insertBefore(img, shot.firstChild);
      $("#lmp2Caption").textContent = LMP2.caption;
    }
    const specs = $("#lmp2Specs");
    if (specs) {
      specs.innerHTML = LMP2.specs.map((s) => `
        <div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join("");
    }

    /* ---- filtros ---- */
    const opcoes = [{ id: "todos", plate: "Todos" }].concat(CLASSES);

    filters.innerHTML = opcoes.map((o) => `
      <button class="filter" type="button" data-filter="${esc(o.id)}"
              aria-pressed="${o.id === "todos"}"
              ${o.id === "todos" ? "" : `style="--c:${classColor(o.id)}"`}>
        ${o.id === "todos" ? "" : "<i aria-hidden=\"true\"></i>"}${esc(o.plate)}
      </button>`).join("");

    function aplicar(alvo) {
      $$(".filter", filters).forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.filter === alvo));
      });

      $$(".car", wrap).forEach((card) => {
        card.hidden = alvo !== "todos" && card.dataset.class !== alvo;
      });

      // O grid some quando só o LMP2 está selecionado; a ficha some no oposto.
      wrap.hidden = alvo === "lmp2";
      if (panel) panel.hidden = alvo !== "todos" && alvo !== "lmp2";
    }

    filters.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".filter");
      if (btn) aplicar(btn.dataset.filter);
    });

    aplicar("todos");
  })();

  /* ========================================================================
     4 · Calendário
     ======================================================================== */
  (function calendar() {
    const list = $("#rounds");
    if (!list) return;
    const agora = new Date();

    list.innerHTML = SCHEDULE.map((r, i) => {
      const passou = new Date(r.end + "T23:59:59") < agora;
      return `
        <li>
          <button class="round ${passou ? "is-done" : ""} ${r.enduro ? "is-enduro" : ""}"
                  type="button" data-idx="${i}">
            <span class="round-top">
              <span class="round-num">Rodada ${r.round}</span>
              <span class="round-len">${esc(r.short)}</span>
            </span>
            <span class="round-map">
              <img loading="lazy" decoding="async" src="${esc(commons(r.map))}"
                   alt="Traçado do circuito ${esc(r.track)}">
            </span>
            <span class="round-name">${esc(r.name)}</span>
            <span class="round-track">${esc(r.track)}</span>
            <span class="round-meta"><span>${esc(r.date)}</span><span>${esc(r.loc)}</span></span>
          </button>
        </li>`;
    }).join("");

    $$(".round", list).forEach((btn) => {
      btn.addEventListener("click", () => openTrackSheet(SCHEDULE[+btn.dataset.idx]));
    });
  })();

  /* ========================================================================
     5 · Fichas (diálogos)
     Foco preso enquanto aberta, devolvido ao elemento de origem ao fechar.
     ======================================================================== */
  const FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let aberta = null;
  let focoAnterior = null;

  function abrir(sheet) {
    if (!sheet) return;
    focoAnterior = document.activeElement;
    sheet.hidden = false;
    aberta = sheet;
    document.body.style.overflow = "hidden";
    const primeiro = $(FOCAVEIS, sheet);
    if (primeiro) primeiro.focus();
  }

  function fechar() {
    if (!aberta) return;
    aberta.hidden = true;
    aberta = null;
    document.body.style.overflow = "";
    if (focoAnterior && typeof focoAnterior.focus === "function") focoAnterior.focus();
    focoAnterior = null;
  }

  document.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-close]")) fechar();
  });

  document.addEventListener("keydown", (ev) => {
    if (!aberta) return;

    if (ev.key === "Escape") {
      fechar();
      return;
    }

    if (ev.key !== "Tab") return;

    // Prende o foco dentro da ficha aberta.
    const alvos = $$(FOCAVEIS, aberta).filter((el) => el.offsetParent !== null);
    if (!alvos.length) return;
    const primeiro = alvos[0];
    const ultimo = alvos[alvos.length - 1];

    if (ev.shiftKey && document.activeElement === primeiro) {
      ev.preventDefault();
      ultimo.focus();
    } else if (!ev.shiftKey && document.activeElement === ultimo) {
      ev.preventDefault();
      primeiro.focus();
    }
  });

  function fatos(pares) {
    return pares.map(([rotulo, valor]) =>
      `<div><dt>${esc(rotulo)}</dt><dd>${esc(valor || "—")}</dd></div>`).join("");
  }

  function openTrackSheet(r) {
    const sheet = $("#trackSheet");
    if (!sheet) return;

    const img = $("#tsImg");
    img.src = commons(r.map);
    img.alt = "Traçado do circuito " + r.track;

    $("#tsRound").textContent = `Rodada ${r.round}${r.enduro ? " · Michelin Endurance Cup" : ""}`;
    $("#tsName").textContent = r.name;
    $("#tsLoc").textContent = `${r.track} · ${r.loc}`;
    $("#tsFacts").innerHTML = fatos([
      ["Data", r.date],
      ["Duração", r.len],
      ["Extensão", r.km],
      ["Curvas", r.turns],
      ["Tipo de pista", r.type],
      ["Formato", r.enduro ? "Endurance" : "Sprint"],
    ]);

    abrir(sheet);
  }

  function openCarSheet(e) {
    const sheet = $("#carSheet");
    if (!sheet) return;

    const img = $("#csImg");
    img.src = commons(e.img);
    img.alt = `${e.team} · ${e.car}`;

    const spec = CAR_SPECS[e.car] || {};
    const cls = byId(e.cls);

    $("#csClass").textContent = cls ? `${cls.plate} · ${cls.name}` : "";
    $("#csName").textContent = `#${e.num} · ${e.team}`;
    $("#csCar").textContent = e.car;
    $("#csFacts").innerHTML = fatos([
      ["Montadora", e.brand],
      ["Motor", spec.motor],
      ["Potência", spec.potencia],
      ["Tração", spec.tracao],
      ["Peso mín.", spec.peso],
      ["Regulamento", spec.reg],
      ["Pilotos", e.drivers],
    ]);

    abrir(sheet);
  }

  /* ========================================================================
     6 · Pontos · simulador e tabela
     ======================================================================== */
  (function points() {
    const body = $("#tableBody");
    const range = $("#posRange");
    const pos = $("#simPos");
    const race = $("#simRace");
    const quali = $("#simQuali");
    const total = $("#simTotal");
    const nota = $("#simNote");
    if (!range) return;

    if (body) {
      let html = "";
      for (let p = 1; p <= 12; p++) {
        html += `
          <button class="row" type="button" data-pos="${p}">
            <span class="row-pos">${ord(p)}</span>
            <span class="row-race">${racePoints(p)}</span>
            <span class="row-quali">${qualiPoints(p)}</span>
          </button>`;
      }
      body.innerHTML = html;

      $$(".row", body).forEach((row) => {
        row.addEventListener("click", () => {
          range.value = row.dataset.pos;
          atualizar(+row.dataset.pos);
        });
      });
    }

    function atualizar(p) {
      const r = racePoints(p);
      const q = qualiPoints(p);

      pos.textContent = ord(p);
      race.textContent = r;
      quali.textContent = q;
      total.textContent = r + q;

      nota.textContent = p === 1
        ? "Vitória com a pole: o máximo possível em um fim de semana de sprint."
        : `Terminando em ${ord(p)} na classe, o carro ainda leva ${r} pontos. No IMSA, ninguém sai zerado.`;

      if (body) {
        $$(".row", body).forEach((row) => {
          row.classList.toggle("is-active", +row.dataset.pos === p);
        });
      }
    }

    range.addEventListener("input", () => atualizar(+range.value));
    atualizar(+range.value);
  })();

  /* ========================================================================
     7 · Contagem para a próxima etapa
     ======================================================================== */
  (function countdown() {
    const nome = $("#nextName");
    const rodada = $("#nextRound");
    const onde = $("#nextWhere");
    const card = $("#nextCard");
    if (!nome) return;

    const agora = new Date();
    const proxima = SCHEDULE.find((r) => new Date(r.end + "T23:59:59") >= agora);

    if (!proxima) {
      nome.textContent = "Temporada encerrada";
      if (card) card.hidden = true;
      return;
    }

    nome.textContent = proxima.name;
    if (rodada) rodada.textContent = `Rodada ${proxima.round} de ${SCHEDULE.length}`;
    if (onde) onde.textContent = `${proxima.date} · ${proxima.track}, ${proxima.loc} · ${proxima.len}`;

    // O card inteiro abre a ficha da etapa — é a ação óbvia a partir daqui.
    if (card) card.addEventListener("click", () => openTrackSheet(proxima));

    const alvo = new Date(proxima.end + "T14:00:00").getTime();
    const campos = {
      cdD: $("#cdD"), cdH: $("#cdH"), cdM: $("#cdM"), cdS: $("#cdS"),
    };
    const set = (id, v) => {
      if (campos[id]) campos[id].textContent = String(v).padStart(2, "0");
    };

    let timer = null;

    function tick() {
      const resta = alvo - Date.now();

      if (resta <= 0) {
        set("cdD", 0); set("cdH", 0); set("cdM", 0); set("cdS", 0);
        clearInterval(timer);          // nada mais a contar
        return;
      }

      set("cdD", Math.floor(resta / 86400000));
      set("cdH", Math.floor((resta % 86400000) / 3600000));
      set("cdM", Math.floor((resta % 3600000) / 60000));
      set("cdS", Math.floor((resta % 60000) / 1000));
    }

    tick();
    timer = setInterval(tick, 1000);
  })();

  /* ========================================================================
     8 · Rolagem · barra fixa e parallax da abertura
     Um único listener em rAF cuida dos dois, para não disputar frame.
     ======================================================================== */
  (function scrollFX() {
    const bar = $("#topbar");
    const toggle = $("#menuToggle");
    const foto = $("#heroPhoto");
    const hero = $("#topo");

    // A foto desce a 30% da velocidade da página: o fundo fica para trás.
    const FATOR = 0.3;
    const parallaxAtivo = foto && hero && !prefersReducedMotion();

    let agendado = false;
    window.addEventListener("scroll", () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;

        if (bar) bar.classList.toggle("is-stuck", y > 32);

        if (parallaxAtivo) {
          // Só enquanto a abertura está à vista — depois não há o que mover.
          const limite = hero.offsetHeight;
          const desloc = Math.min(y, limite) * FATOR;
          foto.style.transform = `translate3d(0, ${desloc.toFixed(1)}px, 0)`;
        }

        agendado = false;
      });
    }, { passive: true });

    if (!bar || !toggle) return;

    const rotulo = $(".sr", toggle);

    toggle.addEventListener("click", () => {
      const aberto = bar.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(aberto));
      if (rotulo) rotulo.textContent = aberto ? "Fechar menu" : "Abrir menu";
    });

    $$(".menu a").forEach((a) => {
      a.addEventListener("click", () => {
        bar.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        if (rotulo) rotulo.textContent = "Abrir menu";
      });
    });
  })();

  // Marca no documento que o JS assumiu, caso o CSS precise reagir.
  document.documentElement.dataset.js = prefersReducedMotion() ? "reduced" : "on";
})();
