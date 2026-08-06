import { useEffect, useRef, useState } from "react";
import {
  Menu, X, ArrowRight, ChevronsDown, Gauge, Timer, Flag,
  LayoutGrid, BookOpen, CircleDot,
} from "lucide-react";

/* ==========================================================================
   IMSA HUB · página de rolagem com vídeo cronometrado pelo scroll

   UM único <video>, sem autoplay, sem loop, e .play() nunca é chamado.
   O quadro 0 É o estado inicial: quem chega vê um still. A rolagem é a
   única coisa que move o playhead. Todo o conteúdo, inclusive a abertura,
   vive dentro do mesmo palco fixo — não há seção nenhuma acima dele.
   ========================================================================== */

const VIDEO = import.meta.env.BASE_URL + "midia/imsa-grid.mp4";

const CLASSES = [
  {
    id: "gtp", cor: "#f1f3f5", lado: "left", de: 0.06, ate: 0.28,
    kicker: "01 · GTP", titulo: "A classe rainha.", destaque: "rainha",
    sub: "Protótipos híbridos sob os regulamentos LMDh e LMH — os mesmos de Le Mans. Motor customizado por montadora, sistema híbrido padrão.",
    specs: [["POTÊNCIA", "~680 cv"], ["HÍBRIDO", "50 kW"], ["VOLTA", "1:33.8"]],
  },
  {
    id: "lmp2", cor: "#4c9aff", lado: "right", de: 0.30, ate: 0.52,
    kicker: "02 · LMP2", titulo: "Igualdade mecânica.", destaque: "Igualdade",
    sub: "Chassi Oreca 07 e motor Gibson V8 aspirado para todo mundo, sem híbrido. O que sobra é piloto e estratégia.",
    specs: [["CHASSI", "Oreca 07"], ["MOTOR", "Gibson V8"], ["VOLTA", "1:37.5"]],
  },
  {
    id: "gtdpro", cor: "#ff4f3e", lado: "left", de: 0.54, ate: 0.76,
    kicker: "03 · GTD PRO", titulo: "Fábrica contra fábrica.", destaque: "Fábrica",
    sub: "Carros GT3 derivados de modelos de rua, tocados por equipes oficiais com tripulação inteiramente profissional.",
    specs: [["TRIPULAÇÃO", "100% pro"], ["BASE", "GT3"], ["VOLTA", "1:44.5"]],
  },
  {
    id: "gtd", cor: "#2fd463", lado: "center", de: 0.78, ate: 1.00,
    kicker: "04 · GTD", titulo: "O mesmo carro, outra tripulação.", destaque: "tripulação",
    sub: "Os mesmíssimos GT3 da classe Pro. Muda quem dirige: é obrigatório escalar pilotos de graduação Prata ou Bronze.",
    specs: [["GRADUAÇÃO", "Prata / Bronze"], ["BASE", "GT3"], ["VOLTA", "1:45.5"]],
  },
];

const NAV = ["Classes", "Grid", "Calendário", "Regras"];

/* Opacidade de um beat dentro da sua janela de progresso, com bordas
   suaves para que só um texto seja legível de cada vez. */
function opacidadeDaJanela(p, de, ate, borda = 0.045) {
  if (p < de - borda || p > ate + borda) return 0;
  if (p < de) return (p - (de - borda)) / borda;
  if (p > ate) return 1 - (p - ate) / borda;
  return 1;
}

/* -------------------------------------------------------------------------- */

function Navbar() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6">
        <a href="#topo" className="flex items-baseline gap-2 animate-blur-fade-up" style={{ animationDelay: "0ms" }}>
          <span className="text-lg md:text-xl font-light tracking-[0.12em]">IMSA</span>
          <span className="mono hidden sm:inline text-[10px] tracking-[0.3em] text-[#9aa4ae]">
            / FAN HUB
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n, i) => (
            <a key={n} href="#topo"
               className="text-sm text-white/70 hover:text-white transition-colors animate-blur-fade-up"
               style={{ animationDelay: `${100 + i * 50}ms` }}>
              {n}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#grid"
             className="hidden lg:inline-flex liquid-glass rounded-full px-5 py-2 text-sm text-white items-center gap-2 animate-blur-fade-up"
             style={{ animationDelay: "300ms" }}>
            <LayoutGrid size={16} />
            Ver o grid
          </a>

          <button
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            className="lg:hidden w-10 h-10 liquid-glass rounded-full grid place-items-center animate-blur-fade-up"
            style={{ animationDelay: "300ms" }}>
            <span className="relative w-4 h-4 block">
              <Menu size={16} className={`absolute inset-0 transition-all duration-500 ${aberto ? "rotate-180 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
              <X size={16} className={`absolute inset-0 transition-all duration-500 ${aberto ? "rotate-0 scale-100 opacity-100" : "rotate-180 scale-50 opacity-0"}`} />
            </span>
          </button>
        </div>
      </div>

      {aberto && (
        <div className="lg:hidden bg-[#0c0f13]/95 backdrop-blur px-6 pb-6 flex flex-col gap-4">
          <div className="rule w-full" />
          {NAV.map((n) => (
            <a key={n} href="#topo" onClick={() => setAberto(false)}
               className="text-base text-white/75 hover:text-white transition-colors">
              {n}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */

function Trilho({ progresso, nome }) {
  return (
    <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-40">
      <div className="w-px h-40 bg-white/10 relative">
        <div className="absolute top-0 left-0 w-px bg-[#9aa4ae] transition-[height] duration-150"
             style={{ height: `${progresso * 100}%` }} />
      </div>
      <p className="mono mt-3 text-[10px] tracking-[0.25em] uppercase text-white/45 [writing-mode:vertical-rl]">
        {nome}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LinhaDeSpecs({ specs, cor, ativo, atraso }) {
  return (
    <div className={`mt-8 flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-0 ${ativo ? "animate-blur-fade-up" : "opacity-0"}`}
         style={{ animationDelay: `${atraso}ms` }}>
      {specs.map(([rotulo, valor], i) => (
        <div key={rotulo} className="flex-1 sm:px-5 first:sm:pl-0 flex flex-col gap-1
                                     sm:border-0 relative">
          {i > 0 && (
            <>
              <span className="rule-v hidden sm:block absolute left-0 top-0 h-full" />
              <span className="rule sm:hidden block w-full mb-3" />
            </>
          )}
          <span className="mono text-[10px] tracking-[0.28em] uppercase text-[#9aa4ae]">{rotulo}</span>
          <span className="mono text-sm text-white/85" style={{ color: cor }}>{valor}</span>
        </div>
      ))}
    </div>
  );
}

function Beat({ dados, ativo, opacidade }) {
  const alinhamento =
    dados.lado === "right" ? "items-end text-right"
    : dados.lado === "center" ? "items-center text-center"
    : "items-start text-left";

  const partes = dados.titulo.split(dados.destaque);

  return (
    <div
      aria-hidden={opacidade < 0.05}
      className={`absolute inset-0 flex flex-col justify-center ${alinhamento}
                  px-5 sm:px-8 md:px-12 lg:px-16 pb-24 sm:pb-16 pointer-events-none`}
      style={{ opacity: opacidade, transition: "opacity 220ms linear" }}>
      <div className={`w-full max-w-xl ${dados.lado === "center" ? "mx-auto" : dados.lado === "right" ? "ml-auto" : ""}`}>
        <p className={`mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase ${ativo ? "animate-blur-fade-up" : "opacity-0"}`}
           style={{ color: dados.cor, animationDelay: "0ms" }}>
          {dados.kicker}
        </p>

        <div className={`rule w-28 my-4 ${dados.lado === "right" ? "ml-auto" : dados.lado === "center" ? "mx-auto" : ""} ${ativo ? "animate-draw" : ""}`}
             style={{ animationDelay: "120ms" }} />

        <h2 className={`font-light leading-[1.02] text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${ativo ? "animate-blur-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}>
          {partes[0]}
          <span style={{ color: dados.cor }}>{dados.destaque}</span>
          {partes[1]}
        </h2>

        <p className={`mt-4 text-sm sm:text-base text-white/65 max-w-md ${dados.lado === "right" ? "ml-auto" : dados.lado === "center" ? "mx-auto" : ""} ${ativo ? "animate-blur-fade-up" : "opacity-0"}`}
           style={{ animationDelay: "320ms" }}>
          {dados.sub}
        </p>

        <LinhaDeSpecs specs={dados.specs} cor={dados.cor} ativo={ativo} atraso={440} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Abertura({ opacidade }) {
  return (
    <div
      aria-hidden={opacidade < 0.05}
      className="absolute inset-0 flex flex-col justify-end items-start text-left
                 pb-16 sm:pb-20 md:pb-28 px-5 sm:px-6 md:px-12"
      style={{ opacity: opacidade, transition: "opacity 220ms linear" }}>
      <div className="max-w-3xl">
        <div className="mono flex flex-wrap gap-x-6 gap-y-2 text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-white/50 mb-5 animate-blur-fade-up"
             style={{ animationDelay: "300ms" }}>
          <span className="flex items-center gap-2"><Gauge size={14} /> 4 CLASSES</span>
          <span className="flex items-center gap-2"><Flag size={14} /> 11 ETAPAS</span>
          <span className="flex items-center gap-2"><Timer size={14} /> ATÉ 24 HORAS</span>
        </div>

        <div className="rule w-[120px] mb-5 animate-draw" style={{ animationDelay: "340ms" }} />

        <p className="mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#9aa4ae] mb-4 animate-blur-fade-up"
           style={{ animationDelay: "380ms" }}>
          IMSA · WEATHERTECH SPORTSCAR CHAMPIONSHIP
        </p>

        <h1 className="font-light leading-[0.95] tracking-[-0.03em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-blur-fade-up"
            style={{ animationDelay: "450ms" }}>
          <span style={{ color: "#9aa4ae" }}>Quatro classes.</span><br />
          Uma pista.
        </h1>

        <p className="mt-5 text-sm sm:text-base md:text-lg text-white/60 max-w-lg animate-blur-fade-up"
           style={{ animationDelay: "560ms" }}>
          Carros com projetos completamente diferentes dividem o mesmo asfalto.
          Role para ver o grid inteiro passar.
        </p>

        <div className="mono mt-7 flex items-center gap-3 text-[10px] sm:text-[11px] tracking-[0.3em] text-white/40 animate-blur-fade-up"
             style={{ animationDelay: "680ms" }}>
          ROLE PARA PERCORRER
          <ChevronsDown size={16} className="animate-bob" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Final({ opacidade }) {
  return (
    <div
      aria-hidden={opacidade < 0.05}
      className="absolute inset-x-0 bottom-0 flex justify-center px-5 pb-10 sm:pb-14 pointer-events-none"
      style={{ opacity: opacidade, transition: "opacity 220ms linear" }}>
      <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto">
        <a href="#grid"
           className="rounded-full bg-[#9aa4ae] text-[#0c0f13] px-7 py-3 font-medium text-sm inline-flex items-center justify-center gap-2">
          Ver o grid <ArrowRight size={16} />
        </a>
        <a href="#regras"
           className="rounded-full liquid-glass px-7 py-3 text-white text-sm inline-flex items-center justify-center gap-2">
          <BookOpen size={16} /> Ler as regras
        </a>
      </div>
    </div>
  );
}

/* ========================================================================== */

export default function App() {
  const trilhaRef = useRef(null);
  const videoRef = useRef(null);
  const [progresso, setProgresso] = useState(0);

  /* ---- progresso da rolagem ----
     O vídeo roda sozinho em loop; a rolagem não mexe mais no playhead.
     Este progresso continua servindo às legendas e ao trilho lateral,
     para que só uma classe seja lida de cada vez. */
  useEffect(() => {
    const medir = () => {
      const el = trilhaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const curso = r.height - window.innerHeight;
      setProgresso(curso > 0 ? Math.min(1, Math.max(0, -r.top / curso)) : 0);
    };

    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  /* Alguns navegadores recusam o autoplay mesmo com muted; se isso
     acontecer, uma tentativa no primeiro toque resolve. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tentar = () => { const p = v.play(); if (p) p.catch(() => {}); };
    tentar();
    document.addEventListener("touchstart", tentar, { once: true, passive: true });
    document.addEventListener("click", tentar, { once: true });
    return () => {
      document.removeEventListener("touchstart", tentar);
      document.removeEventListener("click", tentar);
    };
  }, []);

  const opAbertura = opacidadeDaJanela(progresso, 0, 0.05, 0.03);
  const ativo = CLASSES.find((c) => progresso >= c.de - 0.05 && progresso <= c.ate + 0.05);
  const nomeDoBeat = progresso < 0.06 ? "ABERTURA" : (ativo ? ativo.kicker.split(" · ")[1] : "GTD");

  return (
    <>
      <Navbar />
      <Trilho progresso={progresso} nome={nomeDoBeat} />

      {/* trilha de rolagem: 360vh no celular para não virar uma eternidade */}
      <section id="topo" ref={trilhaRef} className="relative h-[360vh] md:h-[500vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">

          {/* muted e playsInline são obrigatórios: sem eles o autoplay é
              recusado no iOS e no Chrome mobile. */}
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 w-full h-full object-cover"
            src={VIDEO}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />

          {/* grade de prancheta */}
          <div className="absolute inset-0 z-[1] pointer-events-none"
               style={{
                 opacity: 0.1,
                 backgroundImage:
                   "repeating-linear-gradient(90deg, rgba(154,164,174,0.5) 0 1px, transparent 1px 40px)," +
                   "repeating-linear-gradient(0deg, rgba(154,164,174,0.5) 0 1px, transparent 1px 40px)",
               }} />

          {/* véu de leitura, só na base */}
          <div className="absolute inset-0 z-[2] pointer-events-none backdrop-blur-sm"
               style={{
                 WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 42%)",
                 maskImage: "linear-gradient(to top, black 0%, transparent 42%)",
                 background: "linear-gradient(to top, rgba(12,15,19,0.85), transparent 60%)",
               }} />

          {/* grão */}
          <div className="grain absolute inset-0 z-[3] pointer-events-none"
               style={{
                 opacity: 0.05,
                 mixBlendMode: "overlay",
                 backgroundImage:
                   "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
               }} />

          {/* legendas: abertura e os quatro beats, no mesmo palco */}
          <div className="absolute inset-0 z-10">
            <Abertura opacidade={opAbertura} />
            {CLASSES.map((c) => {
              const op = opacidadeDaJanela(progresso, c.de, c.ate);
              return <Beat key={c.id} dados={c} ativo={op > 0.6} opacidade={op} />;
            })}
            <Final opacidade={opacidadeDaJanela(progresso, 0.88, 1.0, 0.05)} />
          </div>
        </div>
      </section>

      <footer className="bg-[#0c0f13]">
        <div className="rule w-full" />
        <div className="px-5 sm:px-6 md:px-12 py-10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <CircleDot size={14} className="text-[#9aa4ae]" />
            <span className="mono tracking-[0.2em]">IMSA HUB — TEMPORADA 2026</span>
          </div>
          <p className="mono tracking-[0.2em]">CLASSES · GRID · CALENDÁRIO · REGRAS</p>
        </div>
        <p className="px-5 sm:px-6 md:px-12 pb-8 text-[11px] leading-relaxed text-white/25 max-w-3xl">
          Fan hub não-oficial, feito por fãs. IMSA, WeatherTech, GTP, LMP2 e GTD pertencem
          aos respectivos titulares. Projeto sem fins lucrativos.
        </p>
      </footer>
    </>
  );
}
