/* ==========================================================================
   IMSA HUB · coreografia de movimento (GSAP + ScrollTrigger)

   Regra da casa: todo movimento aqui usa gsap.from(). Nada é escondido pelo
   CSS. Se o GSAP não carregar — CDN fora do ar, rede bloqueada —, nenhuma
   animação roda e a página aparece inteira, no estado natural. Animação é
   camada, nunca requisito para ler o conteúdo.

   O movimento serve o assunto: a régua se desenha na ordem do calendário,
   as classes entram da mais rápida para a mais lenta, a pista é traçada
   antes dos carros entrarem nela.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  /* Se o GSAP demorou a chegar (CDN lento), a página provavelmente já
     pintou. Animar a entrada agora faria o conteúdo sumir para reaparecer.
     Nesse caso a abertura entra pronta e só as revelações de rolagem valem. */
  const comecoTardio = performance.now() > 1200;   // ms desde a navegação

  /* Revelações dos cards, guardadas para poder concluí-las na marra: o
     filtro pode mostrar um card cujo gatilho de rolagem ainda não disparou,
     e ele sairia do hidden ainda em opacidade zero. */
  const revelacoesGrid = [];

  function garantirCardsVisiveis() {
    revelacoesGrid.forEach((tween) => {
      if (tween && tween.progress() < 1) tween.progress(1);
    });
  }

  /* Tudo vive dentro do matchMedia: quando o sistema pede movimento
     reduzido, o GSAP reverte sozinho e a página fica estática. */
  mm.add("(prefers-reduced-motion: no-preference)", () => {

    /* ====================================================================
       1 · Abertura · um momento coreografado, não efeitos espalhados
       A pista é desenhada da esquerda para a direita e só então os carros
       entram nela — a ordem importa mais que a duração.
       ==================================================================== */
    const abertura = gsap.timeline({
      paused: comecoTardio,          // chegou tarde: a abertura já está pronta
      defaults: { ease: "power3.out", duration: 0.7 },
    });

    abertura
      .from(".hero-scene", { opacity: 0, duration: 1.2 }, 0)
      .from(".hero-kicker", { opacity: 0, y: 12 }, 0.1)
      .from(".hero-logo", { opacity: 0, y: 18 }, 0.22)
      .from(".hero-title", { opacity: 0, y: 26 }, 0.36)
      .from(".band-lane", {
        scaleX: 0.35, opacity: 0, transformOrigin: "left center", duration: 0.9,
      }, 0.5)
      // Só opacidade nos carros: o transform é da animação de volta em CSS.
      .from(".runner", { opacity: 0, duration: 0.5, stagger: 0.08 }, 0.95)
      .from(".band-legend > div", { opacity: 0, x: -12, duration: 0.45, stagger: 0.07 }, 1.0)
      .from(".band-note", { opacity: 0, duration: 0.5 }, 1.1)
      .from(".next", { opacity: 0, y: 18 }, 1.2);

    // Agora que a timeline existe, saltar para o fim se a chegada foi tarde.
    if (comecoTardio) abertura.progress(1).kill();

    /* ====================================================================
       2 · Cabeçalhos de seção
       ==================================================================== */
    gsap.utils.toArray(".head").forEach((head) => {
      gsap.from(head.children, {
        scrollTrigger: { trigger: head, start: "top 82%", once: true },
        opacity: 0, y: 18, duration: 0.6, stagger: 0.08, ease: "power3.out",
      });
    });

    /* ====================================================================
       3 · Classes · entram na ordem em que estão listadas, da mais rápida
       para a mais lenta. O escalonamento reforça que a ordem é informação.
       ==================================================================== */
    gsap.from(".rank", {
      scrollTrigger: { trigger: ".ranks", start: "top 78%", once: true },
      opacity: 0, y: 26, duration: 0.55, stagger: 0.1, ease: "power3.out",
    });

    /* ====================================================================
       4 · Grid · escalonamento por grade, um grupo de cada vez.
       clearProps devolve o controle ao filtro: sem isso o GSAP deixaria
       opacidade inline e brigaria com o hidden da busca.
       ==================================================================== */
    gsap.utils.toArray(".fleet").forEach((grupo) => {
      revelacoesGrid.push(
        gsap.from(grupo.querySelectorAll(".car"), {
          scrollTrigger: { trigger: grupo, start: "top 80%", once: true },
          opacity: 0, y: 20, scale: 0.97, duration: 0.5, ease: "power2.out",
          stagger: { each: 0.045, grid: "auto", from: "start" },
          clearProps: "opacity,transform",
        })
      );
    });

    /* ====================================================================
       5 · Régua da temporada · as etapas sobem da linha de base na ordem
       do calendário. É a temporada sendo disputada em ordem.
       ==================================================================== */
    gsap.from(".rail-bar", {
      scrollTrigger: { trigger: ".rail-wrap", start: "top 82%", once: true },
      scaleY: 0, transformOrigin: "bottom center",
      duration: 0.5, stagger: 0.055, ease: "power2.out",
    });

    gsap.from(".rail-num", {
      scrollTrigger: { trigger: ".rail-wrap", start: "top 82%", once: true },
      opacity: 0, duration: 0.4, stagger: 0.055, ease: "none", delay: 0.15,
    });

    gsap.from(".rail-months span", {
      scrollTrigger: { trigger: ".rail-wrap", start: "top 82%", once: true },
      opacity: 0, duration: 0.5, stagger: 0.03, delay: 0.3,
    });

    /* ====================================================================
       6 · Etapas e blocos de regra
       ==================================================================== */
    gsap.from(".rounds > li", {
      scrollTrigger: { trigger: ".rounds", start: "top 82%", once: true },
      opacity: 0, y: 20, duration: 0.5, ease: "power2.out",
      stagger: { each: 0.05, grid: "auto", from: "start" },
      clearProps: "opacity,transform",
    });

    gsap.from(".rule", {
      scrollTrigger: { trigger: ".rules", start: "top 82%", once: true },
      opacity: 0, y: 24, duration: 0.6, stagger: 0.12, ease: "power3.out",
    });

    gsap.from(".note", {
      scrollTrigger: { trigger: ".notes", start: "top 85%", once: true },
      opacity: 0, y: 18, duration: 0.5, stagger: 0.06, ease: "power2.out",
    });
  });

  /* ======================================================================
     Recalcular posições quando o layout muda
     Filtro e busca escondem cards e mudam a altura da página; sem isso os
     gatilhos abaixo do grid ficariam apontando para o lugar errado.
     ====================================================================== */
  const recalcular = (() => {
    let id = null;
    return () => {
      clearTimeout(id);
      id = setTimeout(() => ScrollTrigger.refresh(), 180);
    };
  })();

  const filtros = document.getElementById("filters");
  const busca = document.getElementById("gridSearch");

  // Concluir antes de recalcular: um card revelado pela busca não pode
  // ficar preso em opacidade zero porque o grupo dele nunca foi rolado.
  const aoInteragirComGrid = () => { garantirCardsVisiveis(); recalcular(); };

  if (filtros) filtros.addEventListener("click", aoInteragirComGrid);
  if (busca) busca.addEventListener("input", aoInteragirComGrid);

  // As fotos do Commons chegam depois e empurram o layout.
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
