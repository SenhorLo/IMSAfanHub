/* ==========================================================================
   IMSA HUB · carros em 3D na faixa de tráfego (Three.js)

   Os três modelos são extrudados a partir do perfil lateral de carros reais
   do grid, com as medidas de fábrica:

     GTP   · Porsche 963 (LMDh)      5100 × 2000 × 1060 mm, entre-eixos 3148
     LMP2  · Oreca 07                4745 × 1895 × 1045 mm, entre-eixos 3005
     GT3   · Corvette Z06 GT3.R      ~4630 × 2050 × ~1200 mm, entre-eixos ~2725

   Por isso o protótipo aparece longo e rasteiro e o GT3 aparece curto e
   alto: a diferença na tela é a diferença real entre os carros.

   O módulo é conservador de propósito. Ele só assume a faixa se houver
   WebGL, se o sistema não pedir movimento reduzido e se a conexão não
   estiver em modo de economia. Em qualquer outro caso a silhueta em SVG
   continua no lugar e o Three.js nem chega a ser baixado.
   ========================================================================== */

const FONTE_THREE = "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

/* --------------------------------------------------------------------------
   Perfis laterais, em metros, do fundo (traseira) para a frente.
   x = 0 é a traseira, y = 0 é o assoalho.
   -------------------------------------------------------------------------- */
const MODELOS = {
  // Porsche 963 — LMDh: nariz muito baixo, cabine recuada, cauda longa
  prototipoGTP: {
    comprimento: 5.10, largura: 2.00, altura: 1.06, entreEixos: 3.148,
    balancoDianteiro: 1.05,
    raioRoda: 0.36, larguraRodaD: 0.30, larguraRodaT: 0.35,
    perfil: [
      [0.00, 0.22], [0.10, 0.70], [0.55, 0.76], [1.35, 0.79], [1.95, 0.83],
      [2.30, 0.99], [2.70, 1.06], [3.20, 1.05], [3.62, 0.84], [3.95, 0.68],
      [4.25, 0.71], [4.62, 0.48], [4.95, 0.30], [5.10, 0.17], [5.10, 0.07],
      [4.40, 0.05], [0.55, 0.05], [0.00, 0.10],
    ],
    cabine: { de: 2.28, ate: 3.60, base: 0.84, topo: 1.05 },
    asa: { de: 0.05, ate: 0.62, altura: 1.11, largura: 1.90 },
    barbatana: { de: 0.62, ate: 2.30, base: 0.78, topo: 1.09 },
  },

  // Oreca 07 — LMP2: mesma família, porém mais curto e com cabine adiantada
  prototipoLMP2: {
    comprimento: 4.745, largura: 1.895, altura: 1.045, entreEixos: 3.005,
    balancoDianteiro: 0.97,
    raioRoda: 0.35, larguraRodaD: 0.29, larguraRodaT: 0.34,
    perfil: [
      [0.00, 0.22], [0.09, 0.68], [0.50, 0.73], [1.25, 0.76], [1.80, 0.80],
      [2.12, 0.96], [2.50, 1.045], [2.98, 1.03], [3.36, 0.82], [3.66, 0.66],
      [3.94, 0.69], [4.30, 0.46], [4.60, 0.28], [4.745, 0.16], [4.745, 0.06],
      [4.10, 0.05], [0.50, 0.05], [0.00, 0.10],
    ],
    cabine: { de: 2.10, ate: 3.34, base: 0.80, topo: 1.02 },
    asa: { de: 0.04, ate: 0.58, altura: 1.09, largura: 1.80 },
    barbatana: { de: 0.58, ate: 2.12, base: 0.75, topo: 1.07 },
  },

  // Corvette Z06 GT3.R — GT3: silhueta de carro de rua, estufa alta
  gt3: {
    comprimento: 4.63, largura: 2.05, altura: 1.20, entreEixos: 2.725,
    balancoDianteiro: 1.03,
    raioRoda: 0.34, larguraRodaD: 0.30, larguraRodaT: 0.33,
    perfil: [
      [0.00, 0.26], [0.12, 0.82], [0.55, 0.88], [1.00, 0.92], [1.45, 1.14],
      [1.95, 1.20], [2.72, 1.19], [3.22, 0.96], [3.60, 0.84], [3.98, 0.86],
      [4.32, 0.58], [4.55, 0.40], [4.63, 0.22], [4.63, 0.08], [4.00, 0.05],
      [0.50, 0.05], [0.00, 0.12],
    ],
    cabine: { de: 1.42, ate: 3.24, base: 0.90, topo: 1.19 },
    asa: { de: 0.00, ate: 0.56, altura: 1.34, largura: 1.90 },
    barbatana: null,
  },
};

// Qual carro representa cada classe do grid
const MODELO_DA_CLASSE = {
  gtp: "prototipoGTP",
  lmp2: "prototipoLMP2",
  gtdpro: "gt3",
  gtd: "gt3",
};

/* --------------------------------------------------------------------------
   Portões: sem qualquer um deles, o SVG continua e nada é baixado
   -------------------------------------------------------------------------- */
function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

function deveRenderizar() {
  if (!document.getElementById("band")) return false;
  if (typeof CLASSES === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  return temWebGL();
}

/* ========================================================================== */

(async function iniciar() {
  if (!deveRenderizar()) return;

  let THREE;
  try {
    THREE = await import(FONTE_THREE);
  } catch (e) {
    return;                      // CDN fora do ar: a silhueta em SVG fica
  }

  const lane = document.getElementById("band");

  /* ---- cena ---- */
  const cena = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = "band-canvas";
  lane.appendChild(renderer.domElement);

  /* Distância grande com ângulo pequeno: quase ortográfico. Dá profundidade
     sem deformar os carros que estão nas pontas da faixa. */
  const camera = new THREE.PerspectiveCamera(11, 1, 1, 400);
  camera.position.set(7, 15, 60);
  camera.lookAt(0, 0.45, 0);

  /* ---- luz: refletor de autódromo à noite ---- */
  cena.add(new THREE.HemisphereLight(0x9fb6d4, 0x0a0d11, 1.15));

  const refletor = new THREE.DirectionalLight(0xffffff, 2.4);
  refletor.position.set(10, 26, 14);
  cena.add(refletor);

  const contraluz = new THREE.DirectionalLight(0x8fb2ff, 0.9);
  contraluz.position.set(-16, 9, -12);
  cena.add(contraluz);

  /* ---- material auxiliar ---- */
  const vidro = new THREE.MeshStandardMaterial({
    color: 0x0b0f14, metalness: 0.45, roughness: 0.18,
  });
  const borracha = new THREE.MeshStandardMaterial({
    color: 0x101317, metalness: 0.0, roughness: 0.95,
  });
  const asaMat = new THREE.MeshStandardMaterial({
    color: 0x161b22, metalness: 0.3, roughness: 0.55,
  });

  /* --------------------------------------------------------------------
     Monta um carro a partir do perfil lateral
     -------------------------------------------------------------------- */
  function montarCarro(spec, cor) {
    const grupo = new THREE.Group();

    const forma = new THREE.Shape();
    spec.perfil.forEach(([x, y], i) => {
      if (i === 0) forma.moveTo(x, y);
      else forma.lineTo(x, y);
    });
    forma.closePath();

    const carroceria = new THREE.Mesh(
      new THREE.ExtrudeGeometry(forma, {
        depth: spec.largura, bevelEnabled: true,
        bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 2, curveSegments: 6,
      }),
      /* Metalness baixo de propósito: sem environment map, material
         metálico devolve cinza, e a placa branca do GTP deixaria de ser
         branca. Aqui a cor da classe precisa sobreviver à iluminação. */
      new THREE.MeshStandardMaterial({
        color: cor, metalness: 0.12, roughness: 0.46,
      })
    );
    carroceria.position.z = -spec.largura / 2;
    grupo.add(carroceria);

    // Estufa escura, um fio mais larga que a carroceria para aparecer nos flancos
    const cab = spec.cabine;
    const vidros = new THREE.Mesh(
      new THREE.BoxGeometry(cab.ate - cab.de, cab.topo - cab.base, spec.largura * 1.01),
      vidro
    );
    vidros.position.set((cab.de + cab.ate) / 2, (cab.base + cab.topo) / 2, 0);
    grupo.add(vidros);

    // Asa traseira e flapes laterais
    const asa = spec.asa;
    const plano = new THREE.Mesh(
      new THREE.BoxGeometry(asa.ate - asa.de, 0.05, asa.largura), asaMat
    );
    plano.position.set((asa.de + asa.ate) / 2, asa.altura, 0);
    grupo.add(plano);

    [-1, 1].forEach((lado) => {
      const flape = new THREE.Mesh(
        new THREE.BoxGeometry(asa.ate - asa.de + 0.08, 0.30, 0.035), asaMat
      );
      flape.position.set((asa.de + asa.ate) / 2, asa.altura - 0.10,
                         lado * asa.largura / 2);
      grupo.add(flape);
    });

    // Barbatana: só os protótipos têm
    if (spec.barbatana) {
      const b = spec.barbatana;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(b.ate - b.de, b.topo - b.base, 0.03), asaMat
      );
      fin.position.set((b.de + b.ate) / 2, (b.base + b.topo) / 2, 0);
      grupo.add(fin);
    }

    // Rodas, posicionadas pelo entre-eixos real
    const eixoD = spec.comprimento - spec.balancoDianteiro;
    const eixoT = eixoD - spec.entreEixos;

    [[eixoD, spec.larguraRodaD], [eixoT, spec.larguraRodaT]].forEach(([x, larg]) => {
      [-1, 1].forEach((lado) => {
        const roda = new THREE.Mesh(
          new THREE.CylinderGeometry(spec.raioRoda, spec.raioRoda, larg, 18),
          borracha
        );
        roda.rotation.x = Math.PI / 2;      // eixo da roda ao longo de Z
        roda.position.set(x, spec.raioRoda,
                          lado * (spec.largura / 2 - larg / 2 - 0.015));
        grupo.add(roda);
      });
    });

    // Origem no meio do carro, para posicionar pelo centro
    grupo.children.forEach((m) => { m.position.x -= spec.comprimento / 2; });

    return grupo;
  }

  /* --------------------------------------------------------------------
     Um carro por classe, na cor da placa e na linha de corrida dela
     -------------------------------------------------------------------- */
  const estilo = getComputedStyle(document.documentElement);
  const corDaClasse = (id) =>
    new THREE.Color((estilo.getPropertyValue("--" + id) || "#ffffff").trim());

  const LINHAS_Z = [-2.6, -0.9, 0.9, 2.6];     // linhas de corrida na pista
  const VAO = 26;                               // metros visíveis na largura
  const SEGUNDOS_POR_VOLTA = 0.1;               // mesma escala da versão CSS

  const carros = CLASSES.map((c, i) => {
    const spec = MODELOS[MODELO_DA_CLASSE[c.id]] || MODELOS.gt3;
    const obj = montarCarro(spec, corDaClasse(c.id));
    obj.position.z = LINHAS_Z[i] ?? 0;
    cena.add(obj);
    return { obj, periodo: c.lap * SEGUNDOS_POR_VOLTA, fase: i * 0.11 };
  });

  /* ---- dimensionamento ---- */
  function redimensionar() {
    /* clientWidth/Height, não getBoundingClientRect: o rect inclui o
       transform, e a animação de entrada deixa a faixa em scaleX 0.35.
       Medir por ali dimensionaria o canvas a 35% e ele sairia borrado
       quando a animação terminasse. */
    const w = lane.clientWidth;
    const h = lane.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Mantém o vão horizontal constante, seja qual for a altura da faixa
    const distancia = camera.position.length();
    const fovH = 2 * Math.atan((VAO / 2) / distancia);
    camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(fovH / 2) / camera.aspect)
    );
    camera.updateProjectionMatrix();
  }

  redimensionar();
  if (window.ResizeObserver) new ResizeObserver(redimensionar).observe(lane);
  else window.addEventListener("resize", redimensionar);
  // Se a faixa ainda media zero na primeira passada, o load resolve.
  window.addEventListener("load", redimensionar);

  /* ---- laço ---- */
  let raf = null;
  let tempo = 0;
  let ultimo = performance.now();

  function quadro(agora) {
    const dt = Math.min((agora - ultimo) / 1000, 0.05);   // trava after-tab-switch
    ultimo = agora;
    tempo += dt;

    carros.forEach(({ obj, periodo, fase }) => {
      const p = ((tempo / periodo) + fase) % 1;
      obj.position.x = -VAO * 0.6 + p * VAO * 1.2;
    });

    renderer.render(cena, camera);
    raf = requestAnimationFrame(quadro);
  }

  function tocar() {
    if (raf === null) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); }
  }
  function parar() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  // Fora da tela não há o que animar
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? tocar() : parar()))
      .observe(lane);
  } else {
    tocar();
  }
  document.addEventListener("visibilitychange", () =>
    document.hidden ? parar() : tocar());

  tocar();

  // Só agora a silhueta em SVG sai de cena: o 3D já está desenhando
  lane.classList.add("is-3d");
})();
