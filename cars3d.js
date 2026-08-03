/* ==========================================================================
   IMSA HUB · os quatro carros da fila, em 3D, vistos de frente

   Nota sobre a origem dos modelos: procurei modelos prontos destes carros
   e não há caminho legítimo. O Sketchfab exige conta autenticada para
   baixar qualquer arquivo, inclusive os gratuitos, e os exemplares de lá
   passam de 900 mil triângulos — dezenas de MB para algo de 250 px na
   tela. TurboSquid e CGTrader são pagos. Então a geometria é construída
   aqui, com as medidas de fábrica e a assinatura frontal de cada carro:

     GTP      Porsche 963 (LMDh)   2000 mm de largura, 1060 de altura
              frente baixa e larga, farol de quatro pontos
     LMP2     Oreca 07             1895 × 1045, nariz central saliente
     GTD PRO  Porsche 911 GT3 R    para-lamas dianteiros altos, farol redondo
     GTD      Ford Mustang GT3     frente reta e alta, farol de três barras

   As cores são as das placas de classe, como pedido — sem pintura real.

   A cena é estática: renderiza sob demanda, não em laço. Só há novo quadro
   quando o ponteiro move, a janela muda de tamanho ou o tema recarrega.
   ========================================================================== */

const FONTE_THREE = "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

/* --------------------------------------------------------------------------
   Perfil FRONTAL de cada carro, em metros.
   Meia-silhueta do centro (x = 0) para fora, do topo do capô até a base.
   O código espelha para montar o contorno fechado. y = 0 é o chão.
   -------------------------------------------------------------------------- */
const CARROS = {
  // Porsche 963 — protótipo LMDh: rasteiro, largo, para-lamas marcados
  gtp: {
    largura: 2.00, altura: 1.06, comprimento: 5.10,
    meiaFrente: [
      [0.00, 0.42], [0.34, 0.45], [0.58, 0.55],
      [0.78, 0.74], [0.92, 0.80], [1.00, 0.66], [1.00, 0.12],
    ],
    cabine: { largura: 1.06, altura: 0.30, comprimento: 1.60, topo: 1.06, z: -0.10 },
    asa:    { largura: 1.90, altura: 1.13, z: -2.15, corda: 0.42 },
    splitter: { largura: 2.04, prof: 0.34, y: 0.055 },
    farois: [ [0.44, 0.52, 0.13, 0.055], [0.62, 0.56, 0.13, 0.055] ],  // quatro pontos
    roda: { raio: 0.36, largura: 0.32, dx: 0.86, dz: 1.55 },
    barbatana: { altura: 0.30, comprimento: 1.60, z: -1.30 },
  },

  // Oreca 07 — LMP2: mais estreito, nariz central saliente, barbatana alta
  lmp2: {
    largura: 1.895, altura: 1.045, comprimento: 4.745,
    meiaFrente: [
      [0.00, 0.48], [0.26, 0.50], [0.48, 0.54],
      [0.70, 0.72], [0.84, 0.78], [0.948, 0.62], [0.948, 0.11],
    ],
    cabine: { largura: 1.00, altura: 0.30, comprimento: 1.50, topo: 1.045, z: -0.05 },
    asa:    { largura: 1.80, altura: 1.11, z: -2.00, corda: 0.40 },
    splitter: { largura: 1.94, prof: 0.30, y: 0.05 },
    farois: [ [0.52, 0.58, 0.19, 0.075] ],
    roda: { raio: 0.35, largura: 0.31, dx: 0.80, dz: 1.45 },
    barbatana: { altura: 0.32, comprimento: 1.50, z: -1.20 },
  },

  // Porsche 911 GT3 R — para-lamas dianteiros mais altos que o capô central
  gtdpro: {
    largura: 2.05, altura: 1.30, comprimento: 4.62,
    meiaFrente: [
      [0.00, 0.76], [0.30, 0.78], [0.54, 0.84],
      [0.78, 1.00], [0.92, 1.02], [1.025, 0.86], [1.025, 0.14],
    ],
    cabine: { largura: 1.46, altura: 0.42, comprimento: 1.80, topo: 1.30, z: -0.35 },
    asa:    { largura: 1.92, altura: 1.44, z: -1.95, corda: 0.44 },
    splitter: { largura: 2.10, prof: 0.30, y: 0.06 },
    farois: [ [0.74, 0.90, 0.20, 0.20] ],       // redondo, no alto do para-lama
    faroisRedondos: true,
    roda: { raio: 0.34, largura: 0.32, dx: 0.88, dz: 1.36 },
    barbatana: null,
  },

  // Ford Mustang GT3 — frente reta e alta, farol de três barras
  gtd: {
    largura: 2.05, altura: 1.32, comprimento: 4.80,
    meiaFrente: [
      [0.00, 0.92], [0.42, 0.93], [0.72, 0.92],
      [0.88, 0.98], [1.025, 0.90], [1.025, 0.14],
    ],
    cabine: { largura: 1.50, altura: 0.40, comprimento: 1.70, topo: 1.32, z: -0.45 },
    asa:    { largura: 1.95, altura: 1.46, z: -2.05, corda: 0.44 },
    splitter: { largura: 2.12, prof: 0.32, y: 0.06 },
    farois: [ [0.66, 0.76, 0.055, 0.16], [0.76, 0.76, 0.055, 0.16], [0.86, 0.76, 0.055, 0.16] ],
    roda: { raio: 0.34, largura: 0.32, dx: 0.88, dz: 1.42 },
    barbatana: null,
  },
};

/* -------------------------------------------------------------------------- */

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
  if (!document.getElementById("lineupStage")) return false;
  if (typeof CLASSES === "undefined") return false;
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
    return;                       // sem CDN, ficam os marcadores de reserva
  }

  const palco = document.getElementById("lineupStage");

  const cena = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = "lineup-canvas";
  palco.appendChild(renderer.domElement);

  /* Câmera longe com ângulo estreito: os quatro carros ficam quase de
     frente, sem o dos cantos aparecer de lado. */
  const camera = new THREE.PerspectiveCamera(12, 1, 1, 300);
  const ALTURA_CAMERA = 2.05;
  camera.position.set(0, ALTURA_CAMERA, 46);
  camera.lookAt(0, 0.62, 0);

  /* ---- luz: refletor de autódromo ---- */
  cena.add(new THREE.HemisphereLight(0xa8bed8, 0x0b0e12, 1.05));

  const principal = new THREE.DirectionalLight(0xffffff, 2.5);
  principal.position.set(6, 16, 20);
  cena.add(principal);

  const lateral = new THREE.DirectionalLight(0x9fc0ff, 1.1);
  lateral.position.set(-14, 7, 9);
  cena.add(lateral);

  const contraluz = new THREE.DirectionalLight(0xffffff, 0.7);
  contraluz.position.set(0, 6, -18);
  cena.add(contraluz);

  /* ---- materiais compartilhados ---- */
  const vidro = new THREE.MeshStandardMaterial({
    color: 0x0a0e13, metalness: 0.4, roughness: 0.16,
  });
  const borracha = new THREE.MeshStandardMaterial({
    color: 0x0e1116, metalness: 0, roughness: 0.95,
  });
  const preto = new THREE.MeshStandardMaterial({
    color: 0x151a21, metalness: 0.25, roughness: 0.6,
  });
  const farolMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d0, emissive: 0xffe9a8, emissiveIntensity: 1.4,
    metalness: 0, roughness: 0.3,
  });

  /* --------------------------------------------------------------------
     Monta um carro a partir da meia-silhueta frontal
     -------------------------------------------------------------------- */
  function montar(spec, cor) {
    const g = new THREE.Group();

    // Metalness baixo: sem environment map, material metálico devolve
    // cinza e a placa branca do GTP deixaria de ser branca.
    const pintura = new THREE.MeshStandardMaterial({
      color: cor, metalness: 0.14, roughness: 0.42,
    });

    /* corpo: espelha a meia-silhueta e extruda para trás */
    const meia = spec.meiaFrente;
    const forma = new THREE.Shape();
    forma.moveTo(-meia[0][0], meia[0][1]);
    for (let i = 1; i < meia.length; i++) forma.lineTo(-meia[i][0], meia[i][1]);
    forma.lineTo(-meia[meia.length - 1][0], 0.045);
    forma.lineTo(meia[meia.length - 1][0], 0.045);
    for (let i = meia.length - 1; i >= 0; i--) forma.lineTo(meia[i][0], meia[i][1]);
    forma.closePath();

    const corpo = new THREE.Mesh(
      new THREE.ExtrudeGeometry(forma, {
        depth: spec.comprimento, bevelEnabled: true,
        bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 4,
      }),
      pintura
    );
    corpo.position.z = -spec.comprimento + spec.comprimento / 2;
    g.add(corpo);

    /* cabine */
    const cab = spec.cabine;
    const teto = new THREE.Mesh(
      new THREE.BoxGeometry(cab.largura, cab.altura, cab.comprimento), vidro
    );
    teto.position.set(0, cab.topo - cab.altura / 2, cab.z);
    g.add(teto);

    /* splitter dianteiro */
    const sp = spec.splitter;
    const splitter = new THREE.Mesh(
      new THREE.BoxGeometry(sp.largura, 0.035, sp.prof), preto
    );
    splitter.position.set(0, sp.y, spec.comprimento / 2 - sp.prof / 2 + 0.06);
    g.add(splitter);

    /* asa traseira, com as duas laterais */
    const asa = spec.asa;
    const plano = new THREE.Mesh(
      new THREE.BoxGeometry(asa.largura, 0.05, asa.corda), preto
    );
    plano.position.set(0, asa.altura, asa.z);
    g.add(plano);

    [-1, 1].forEach((lado) => {
      const lateralAsa = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.30, asa.corda + 0.10), preto
      );
      lateralAsa.position.set(lado * asa.largura / 2, asa.altura - 0.10, asa.z);
      g.add(lateralAsa);
    });

    /* barbatana, só protótipo */
    if (spec.barbatana) {
      const b = spec.barbatana;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, b.altura, b.comprimento), preto
      );
      fin.position.set(0, cab.topo - 0.02 + b.altura / 2 - 0.14, b.z);
      g.add(fin);
    }

    /* faróis: a assinatura frontal de cada carro */
    const zFarol = spec.comprimento / 2 - 0.02;
    spec.farois.forEach(([x, y, larg, alt]) => {
      [-1, 1].forEach((lado) => {
        const luz = spec.faroisRedondos
          ? new THREE.Mesh(
              new THREE.CylinderGeometry(larg / 2, larg / 2, 0.07, 14), farolMat)
          : new THREE.Mesh(new THREE.BoxGeometry(larg, alt, 0.07), farolMat);
        if (spec.faroisRedondos) luz.rotation.x = Math.PI / 2;
        luz.position.set(lado * x, y, zFarol);
        g.add(luz);
      });
    });

    /* rodas */
    const rd = spec.roda;
    [1, -1].forEach((frente) => {
      [-1, 1].forEach((lado) => {
        const roda = new THREE.Mesh(
          new THREE.CylinderGeometry(rd.raio, rd.raio, rd.largura, 20), borracha
        );
        roda.rotation.z = Math.PI / 2;          // eixo da roda ao longo de X
        roda.position.set(lado * rd.dx, rd.raio, frente * rd.dz);
        g.add(roda);
      });
    });

    return g;
  }

  /* --------------------------------------------------------------------
     Um carro por classe, alinhado com a coluna de texto correspondente
     -------------------------------------------------------------------- */
  const estilo = getComputedStyle(document.documentElement);
  const corDaClasse = (id) =>
    new THREE.Color((estilo.getPropertyValue("--" + id) || "#ffffff").trim());

  const VAO = 13.2;                         // metros visíveis na largura
  const COLUNA = VAO / 4;

  const grupos = CLASSES.map((c, i) => {
    const spec = CARROS[c.id] || CARROS.gtd;
    const obj = montar(spec, corDaClasse(c.id));
    // centro da coluna i, na mesma grade de quatro do texto
    obj.position.x = (i - 1.5) * COLUNA;
    cena.add(obj);
    return obj;
  });

  /* ---- dimensionamento ---- */
  function redimensionar() {
    /* clientWidth, não getBoundingClientRect: o rect inclui transform, e a
       animação de entrada mexeria na medida. */
    const w = palco.clientWidth;
    const h = palco.clientHeight;
    if (!w || !h) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const distancia = camera.position.length();
    const fovH = 2 * Math.atan((VAO / 2) / distancia);
    camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(fovH / 2) / camera.aspect)
    );
    camera.updateProjectionMatrix();
    desenhar();
  }

  /* ---- render sob demanda: a cena é parada ---- */
  let pedido = null;
  function desenhar() {
    if (pedido !== null) return;
    pedido = requestAnimationFrame(() => {
      pedido = null;
      renderer.render(cena, camera);
    });
  }

  redimensionar();
  if (window.ResizeObserver) new ResizeObserver(redimensionar).observe(palco);
  else window.addEventListener("resize", redimensionar);
  window.addEventListener("load", redimensionar);

  /* ---- leve reação ao ponteiro, para dar volume ----
     Não é rotação automática: os carros ficam de frente, e só acompanham
     de leve o ponteiro. Quem pede movimento reduzido não recebe nada. */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const AMPLITUDE = 0.16;             // radianos, pouco mais de 9 graus

    palco.parentElement.addEventListener("pointermove", (ev) => {
      const r = palco.getBoundingClientRect();
      if (!r.width) return;
      const nx = ((ev.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1
      grupos.forEach((g) => { g.rotation.y = nx * AMPLITUDE; });
      desenhar();
    }, { passive: true });

    palco.parentElement.addEventListener("pointerleave", () => {
      grupos.forEach((g) => { g.rotation.y = 0; });
      desenhar();
    }, { passive: true });
  }

  palco.classList.add("is-3d");
})();
