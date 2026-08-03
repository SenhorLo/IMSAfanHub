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

  /* ========================================================================
     1 · Fila de largada
     Os quatro carros lado a lado, de frente, com o tempo de volta e o
     intervalo para a classe mais rápida logo abaixo. Os modelos em 3D
     entram por cars3d.js; aqui fica o texto, que é o conteúdo.
     ======================================================================== */
  (function lineup() {
    const palco = $("#lineupStage");
    const info = $("#lineupInfo");
    if (!palco || !info) return;

    // O intervalo para a classe mais rápida é o dado que resume o multiclasse.
    const maisRapida = Math.min(...CLASSES.map((c) => c.lap));

    /* Marcadores de reserva: é o que aparece enquanto o 3D carrega, e o que
       fica para sempre se não houver WebGL. Não fingem ser carro. */
    palco.innerHTML = CLASSES.map((c) => `
      <div class="lineup-slot" style="--c:${classColor(c.id)}">
        <span class="lineup-slot-plate">${esc(c.plate)}</span>
      </div>`).join("");

    info.innerHTML = CLASSES.map((c) => {
      const gap = c.lap - maisRapida;
      // Curto de propósito: em quatro colunas num celular, "por volta"
      // quebraria em três linhas. A nota abaixo já explica o intervalo.
      const gapTxt = gap === 0
        ? "referência"
        : `+${gap.toFixed(1).replace(".", ",")} s/volta`;

      return `
        <li class="lineup-col" style="--c:${classColor(c.id)}">
          <p class="lineup-plate">${esc(c.plate)}</p>
          <p class="lineup-car">${esc(c.modelo)}</p>
          <p class="lineup-kind">${esc(c.modeloNota)}</p>
          <p class="lineup-lap">${esc(c.lapLabel)}</p>
          <p class="lineup-gap${gap === 0 ? " is-ref" : ""}">${esc(gapTxt)}</p>
        </li>`;
    }).join("");
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

    /* ---- cards, agrupados por classe ----
       É assim que a própria modalidade publica lista de inscritos: primeiro
       a classe, depois os carros dentro dela. Em "Todos", os grupos dão
       leitura ao que senão seria um bloco único de 27 cards. */
    const card = (e, i) => `
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
      </button>`;

    const comCards = CLASSES.filter((c) => ENTRIES.some((e) => e.cls === c.id));

    wrap.innerHTML = comCards.map((c) => {
      const daClasse = ENTRIES
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.cls === c.id);
      const marcas = new Set(daClasse.map(({ e }) => e.brand)).size;

      return `
        <section class="fleet" data-class="${esc(c.id)}" style="--c:${classColor(c.id)}">
          <header class="fleet-head">
            <span class="fleet-plate">${esc(c.plate)}</span>
            <h3 class="fleet-name">${esc(c.name)}</h3>
            <span class="fleet-count" data-total="${daClasse.length}">
              ${daClasse.length} carros · ${marcas} ${marcas === 1 ? "montadora" : "montadoras"}
            </span>
          </header>
          <div class="fleet-grid">${daClasse.map(({ e, i }) => card(e, i)).join("")}</div>
        </section>`;
    }).join("");

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

    /* ---- filtro de classe + busca por texto ---- */
    const busca = $("#gridSearch");
    const status = $("#gridStatus");
    const vazio = $("#gridEmpty");
    const limpar = $("#gridReset");

    // Índice de busca: um texto por carro, sem acento, montado uma vez só.
    // Escapes explícitos: o intervalo de marcas combinantes não sobrevive
    // bem a cópia/colagem se escrito com os caracteres literais.
    const semAcento = (s) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const indice = ENTRIES.map((e) =>
      semAcento([e.num, e.team, e.car, e.brand, e.drivers].join(" ")));

    // O LMP2 é ficha, não card, mas precisa responder à busca como os outros.
    const indiceLMP2 = semAcento(
      ["LMP2", "Le Mans Prototype 2", "Oreca 07", "Gibson GK428", "protótipo"]
        .concat(LMP2.specs.map((s) => s.value + " " + s.label))
        .join(" "));

    let classeAtual = "todos";
    let termo = "";

    function aplicar() {
      $$(".filter", filters).forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.filter === classeAtual));
      });

      const q = semAcento(termo.trim());
      let visiveis = 0;

      $$(".car", wrap).forEach((card) => {
        const i = +card.dataset.idx;
        const daClasse = classeAtual === "todos" || card.dataset.class === classeAtual;
        const casa = !q || indice[i].includes(q);
        const mostra = daClasse && casa;
        card.hidden = !mostra;
        if (mostra) visiveis++;
      });

      // Um grupo sem nenhum card visível não deve deixar o cabeçalho órfão.
      $$(".fleet", wrap).forEach((grupo) => {
        const vivos = $$(".car", grupo).filter((c) => !c.hidden).length;
        grupo.hidden = vivos === 0;
        const contador = $(".fleet-count", grupo);
        const total = +contador.dataset.total;
        contador.textContent = vivos === total
          ? contador.dataset.rotulo
          : `${vivos} de ${total} carros`;
      });

      // O LMP2 não tem card: aparece como ficha quando a busca não o exclui.
      const mostraPainel =
        (classeAtual === "todos" || classeAtual === "lmp2") &&
        (!q || indiceLMP2.includes(q));
      if (panel) panel.hidden = !mostraPainel;

      wrap.hidden = visiveis === 0;
      if (vazio) vazio.hidden = visiveis > 0 || mostraPainel;

      if (status) {
        const emClasse = classeAtual === "todos"
          ? ""
          : ` em ${byId(classeAtual) ? byId(classeAtual).plate : classeAtual}`;
        const paraTermo = q ? ` para “${termo.trim()}”` : "";

        if (!q && classeAtual === "todos") {
          status.textContent = "";
        } else if (visiveis === 0 && mostraPainel) {
          // Dizer "0 carros" ao lado da ficha visível do LMP2 confunde.
          status.textContent = `LMP2 não tem lista por carro${paraTermo} — veja a ficha técnica`;
        } else {
          status.textContent =
            `${visiveis} ${visiveis === 1 ? "carro" : "carros"}${emClasse}${paraTermo}`;
        }
      }
    }

    // Guarda o rótulo original de cada grupo para poder restaurá-lo.
    $$(".fleet-count", wrap).forEach((el) => {
      el.dataset.rotulo = el.textContent.trim();
    });

    filters.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".filter");
      if (!btn) return;
      classeAtual = btn.dataset.filter;
      aplicar();
    });

    if (busca) busca.addEventListener("input", () => { termo = busca.value; aplicar(); });

    if (limpar) {
      limpar.addEventListener("click", () => {
        classeAtual = "todos";
        termo = "";
        if (busca) busca.value = "";
        aplicar();
        if (busca) busca.focus();
      });
    }

    aplicar();
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

    /* ---- régua da temporada ----
       Posiciona cada etapa pela data real dentro da janela da temporada,
       para o intervalo entre as corridas ficar visível. */
    const rail = $("#rail");
    const meses = $("#railMonths");
    if (!rail) return;

    const dia = (s) => new Date(s + "T12:00:00").getTime();
    const inicio = dia(SCHEDULE[0].end);
    const fim = dia(SCHEDULE[SCHEDULE.length - 1].end);
    const vao = fim - inicio;
    const pos = (s) => ((dia(s) - inicio) / vao) * 92 + 4;   // 4%..96%, com folga nas bordas

    const proximaIdx = SCHEDULE.findIndex((r) => new Date(r.end + "T23:59:59") >= agora);

    rail.innerHTML = SCHEDULE.map((r, i) => {
      const passou = new Date(r.end + "T23:59:59") < agora;
      const estados = [
        passou ? "is-done" : "",
        r.enduro ? "is-enduro" : "",
        i === proximaIdx ? "is-next" : "",
      ].filter(Boolean).join(" ");
      // Prova longa fica mais alta: a altura carrega a duração.
      const altura = r.enduro ? 100 : 62;

      return `
        <li>
          <button class="rail-tick ${estados}" type="button" data-idx="${i}"
                  style="--x:${pos(r.end).toFixed(2)}%;--h:${altura}%"
                  aria-label="${esc(`Rodada ${r.round}, ${r.name}, ${r.date}, ${r.len}`)}">
            <span class="rail-num" aria-hidden="true">${r.round}</span>
            <span class="rail-bar" aria-hidden="true"></span>
          </button>
        </li>`;
    }).join("");

    $$(".rail-tick", rail).forEach((btn) => {
      btn.addEventListener("click", () => openTrackSheet(SCHEDULE[+btn.dataset.idx]));
    });

    if (meses) {
      const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out"];
      meses.innerHTML = nomes.map((nome, m) => {
        const marca = new Date(2026, m, 1).getTime();
        if (marca < inicio || marca > fim) return "";
        const x = ((marca - inicio) / vao) * 92 + 4;
        return `<span style="--x:${x.toFixed(2)}%">${nome}</span>`;
      }).join("");
    }
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
    const barra = $("#progress");

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

        if (barra) {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          const pct = total > 0 ? Math.min(y / total, 1) * 100 : 0;
          barra.style.width = pct.toFixed(2) + "%";
        }

        agendado = false;
      });
    }, { passive: true });

    /* ---- seção atual no menu ----
       A página é longa; sem isso o leitor perde a referência de onde está. */
    const links = $$(".menu a[href^='#']");
    const secoes = links
      .map((a) => ({ a, sec: document.getElementById(a.getAttribute("href").slice(1)) }))
      .filter(({ sec }) => sec);

    if (secoes.length && "IntersectionObserver" in window) {
      const visiveis = new Set();

      const marcar = () => {
        // Entre as seções à vista, a que estiver mais acima manda.
        let escolhida = null;
        secoes.forEach(({ sec }) => {
          if (!visiveis.has(sec)) return;
          if (!escolhida || sec.offsetTop < escolhida.offsetTop) escolhida = sec;
        });
        secoes.forEach(({ a, sec }) => {
          if (sec === escolhida) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      };

      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((en) => {
          if (en.isIntersecting) visiveis.add(en.target);
          else visiveis.delete(en.target);
        });
        marcar();
      }, { rootMargin: "-45% 0px -45% 0px" });

      secoes.forEach(({ sec }) => obs.observe(sec));
    }

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
