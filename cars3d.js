/* ==========================================================================
   IMSA HUB · os quatro carros da fila, em 3D, vistos de frente

   Três classes usam modelos reais, baixados do Sketchfab e reduzidos para a
   web (texturas removidas, malha decimada, posições quantizadas):

     GTP      Aston Martin Valkyrie LM   por vecarz     CC BY-NC-SA
     GTD PRO  Ford Mustang GT3           por vecarz     CC BY-NC-SA
     GTD      Porsche 992 GT3 R "Roxy"   por toddeppe   CC Attribution

   O LMP2 segue com geometria construída aqui: o Oreca 07 do Sketchfab não
   é liberado para download. Quando houver um arquivo, basta acrescentar a
   entrada em MODELOS e ele passa a usar o modelo real.

   As texturas foram descartadas de propósito: os carros são repintados com
   a cor da placa de cada classe, como pedido. Era nelas que estava quase
   todo o peso — 157 MB no total viraram 4,1 MB.

   Cada arquivo veio numa escala e orientação diferente, então nada disso é
   fixado no código: a normalização é medida em tempo de execução.
   ========================================================================== */

/* giroY é medido, não adivinhado. A primeira versão tentava deduzir para
   onde o carro aponta procurando a asa traseira nos pontos altos, e errou
   em dois dos três: a Valkyrie e o Mustang ficaram de costas. Cada arquivo
   tem sua convenção, então a volta certa vira constante conferida na tela. */
const MODELOS = {
  gtp:    { arquivo: "modelos/gtp-valkyrie.glb",   giroY: 0 },
  gtdpro: { arquivo: "modelos/gtdpro-mustang.glb", giroY: 0 },
  gtd:    { arquivo: "modelos/gtd-911.glb",        giroY: 0 },
};

/* Todos entram na mesma caixa: escala uniforme, sem deformar, até caber.
   Os arquivos vêm com proporções diferentes entre si, então igualar a
   largura real não bastava — um ficava bem maior que o outro na tela. */
const CAIXA = { largura: 2.35, altura: 1.30 };

/* Perfil frontal do Oreca 07, usado enquanto não há modelo do LMP2.
   Meia-silhueta do centro para fora, em metros; o código espelha. */
/* A carroceria é estreita de propósito, 1,58 m contra os 1,895 do carro
   real: na primeira versão ela tinha a largura cheia e engolia as rodas,
   e o resultado na tela era um bloco, não um carro. Aqui as rodas passam
   por fora e a silhueta volta a ser legível. */
const ORECA = {
  largura: 1.58, altura: 1.045, comprimento: 4.745,
  meiaFrente: [
    [0.00, 0.46], [0.22, 0.48], [0.40, 0.53],
    [0.58, 0.72], [0.70, 0.78], [0.79, 0.60], [0.79, 0.11],
  ],
  cabine: { largura: 0.92, altura: 0.28, comprimento: 1.50, topo: 1.045, z: -0.05 },
  asa:    { largura: 1.86, altura: 1.11, z: -2.00, corda: 0.40 },
  splitter: { largura: 1.92, prof: 0.30, y: 0.05 },
  farois: [[0.44, 0.56, 0.17, 0.07]],
  roda: { raio: 0.35, largura: 0.33, dx: 0.80, dz: 1.45 },
  barbatana: { altura: 0.32, comprimento: 1.50, z: -1.20 },
};

/* Peças que NÃO recebem a cor da classe.

   Os padrões são estreitos de propósito. Na primeira versão eu usei termos
   largos e dois materiais de carroceria foram parar aqui: CHASSIS_CARBON,
   que é o corpo da Valkyrie, caiu em "carbon" e deixou o carro quase preto;
   e Light_grey_metallic_plastic caiu em "light" e virou farol aceso.
   Por isso a carroceria não é mais decidida por nome — ver abaixo. */
const PECAS = [
  { re: /\btyres?\b|\btires?\b|\brubber\b/i, cor: 0x0b0d10, metal: 0.0,  rugos: 0.95 },
  { re: /\bglass\b|\bwindows?\b|windshield/i, cor: 0x0a0e13, metal: 0.35, rugos: 0.12 },
  { re: /\brims?\b|\bwheels?\b/i,      cor: 0x1c2129, metal: 0.75, rugos: 0.35 },
  { re: /\bmirror\b/i,                 cor: 0x2a313b, metal: 0.85, rugos: 0.20 },
  { re: /\binterior\b|\bcockpit\b|\bseats?\b/i, cor: 0x111519, metal: 0.15, rugos: 0.75 },
  { re: /\bplastic\b/i,                cor: 0x14181e, metal: 0.25, rugos: 0.62 },
  { re: /headlight|taillight|\blamp\b/i, cor: 0xfff2cf, metal: 0.0, rugos: 0.30, brilha: true },
];

/* "carbon" ficou de fora de propósito: o corpo da Valkyrie chama-se
   CHASSIS_CARBON, e uma regra sobre esse termo pintava o carro de preto. */

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
    THREE = await import("three");
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

  /* Câmera longe com ângulo estreito: os quatro ficam quase de frente, sem
     os das pontas aparecerem de lado. */
  const camera = new THREE.PerspectiveCamera(12, 1, 1, 300);
  camera.position.set(0, 2.05, 46);
  camera.lookAt(0, 0.62, 0);

  /* ---- luz de autódromo ---- */
  cena.add(new THREE.HemisphereLight(0xa8bed8, 0x0b0e12, 1.15));

  const principal = new THREE.DirectionalLight(0xffffff, 2.6);
  principal.position.set(6, 16, 20);
  cena.add(principal);

  const lateral = new THREE.DirectionalLight(0x9fc0ff, 1.15);
  lateral.position.set(-14, 7, 9);
  cena.add(lateral);

  const contraluz = new THREE.DirectionalLight(0xffffff, 0.75);
  contraluz.position.set(0, 6, -18);
  cena.add(contraluz);

  /* ---- render sob demanda: a cena é parada ---- */
  let pedido = null;
  function desenhar() {
    if (pedido !== null) return;
    pedido = requestAnimationFrame(() => {
      pedido = null;
      renderer.render(cena, camera);
    });
  }

  /* --------------------------------------------------------------------
     Normalização: cada arquivo veio numa escala e orientação. Mede e
     corrige, em vez de confiar em constante escrita à mão.
     -------------------------------------------------------------------- */
  /* Caixa por percentil, não Box3 pura.

     O arquivo do Mustang traz geometria dispersa que a Box3 abraça: a caixa
     saía com 2,3 m de altura para um carro que ocupa pouco mais de 1,3, e
     ao encaixá-la o carro visível encolhia à metade dos outros. Cortando
     as pontas em 1,5%, a caixa passa a descrever o carro, não os resíduos. */
  function caixaRobusta(raiz) {
    const xs = [], ys = [], zs = [];
    const v = new THREE.Vector3();
    raiz.updateMatrixWorld(true);
    raiz.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      const pos = o.geometry.attributes.position;
      const passo = Math.max(1, Math.floor(pos.count / 4000));
      for (let i = 0; i < pos.count; i += passo) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        xs.push(v.x); ys.push(v.y); zs.push(v.z);
      }
    });
    if (!xs.length) {
      const b = new THREE.Box3().setFromObject(raiz);
      return { min: b.min, max: b.max, dim: b.getSize(new THREE.Vector3()) };
    }
    const faixa = (arr) => {
      arr.sort((a, b) => a - b);
      const p = (q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];
      return [p(0.015), p(0.985)];
    };
    const [x0, x1] = faixa(xs), [y0, y1] = faixa(ys), [z0, z1] = faixa(zs);
    return {
      min: new THREE.Vector3(x0, y0, z0),
      max: new THREE.Vector3(x1, y1, z1),
      dim: new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0),
    };
  }

  function normalizar(raiz, giroGraus) {
    // 1. vira o carro para a câmera, com a volta conferida na tela
    raiz.rotation.y = (giroGraus || 0) * Math.PI / 180;
    raiz.updateMatrixWorld(true);

    // 2. escala uniforme até caber na caixa comum: nenhum domina os outros
    let caixa = caixaRobusta(raiz);
    if (caixa.dim.x > 0 && caixa.dim.y > 0) {
      raiz.scale.multiplyScalar(
        Math.min(CAIXA.largura / caixa.dim.x, CAIXA.altura / caixa.dim.y)
      );
    }
    raiz.updateMatrixWorld(true);

    // 3. assenta no chão e centraliza
    caixa = caixaRobusta(raiz);
    raiz.position.x -= (caixa.min.x + caixa.max.x) / 2;
    raiz.position.z -= (caixa.min.z + caixa.max.z) / 2;
    raiz.position.y -= caixa.min.y;
    raiz.updateMatrixWorld(true);
  }

  /* --------------------------------------------------------------------
     Repintura: a carroceria recebe a cor da placa, o resto vira peça.
     -------------------------------------------------------------------- */
  function repintar(raiz, cor) {
    const pintura = new THREE.MeshStandardMaterial({
      color: cor, metalness: 0.16, roughness: 0.40, side: THREE.DoubleSide,
    });

    /* Underscore conta como caractere de palavra, então \btyre\b não casa
       com EXT_TYRE. Trocar _ e - por espaço antes de testar resolve, e sem
       isso os 36 mil triângulos de pneu da Valkyrie passavam por carroceria. */
    const limpo = (m) => ((m && m.name) || "").replace(/[_\-]+/g, " ");
    const classificar = (m) => PECAS.find((p) => p.re.test(limpo(m))) || null;

    /* Como achar a carroceria: é a malha de MAIOR CAIXA ENVOLVENTE, ou
       seja, a casca externa que envolve o carro inteiro.

       Nem contagem de triângulos nem nome servem. No 911 o material com
       mais triângulos é o interior, e o que envolve o carro todo chama-se
       "Glass" — batizado errado no arquivo. Confiar no nome pintava o carro
       de preto; confiar no tamanho da malha pintava o interior.

       Pneu, roda, interior, espelho, lâmpada e plástico ficam fora da
       disputa. Vidro continua concorrendo, justamente por causa do 911. */
    const FORA_DA_DISPUTA = /\btyres?\b|\btires?\b|\brubber\b|\brims?\b|\bwheels?\b|\binterior\b|\bcockpit\b|\bseats?\b|\bmirror\b|\bplastic\b|headlight|taillight|\blamp\b/i;

    const caixas = new Map();
    raiz.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      if (FORA_DA_DISPUTA.test(limpo(o.material))) return;
      const b = new THREE.Box3().setFromObject(o);
      const atual = caixas.get(o.material.uuid);
      if (atual) atual.union(b); else caixas.set(o.material.uuid, b);
    });

    let corpo = null, maior = -1;
    const s = new THREE.Vector3();
    caixas.forEach((b, chave) => {
      b.getSize(s);
      const vol = s.x * s.y * s.z;
      if (vol > maior) { maior = vol; corpo = chave; }
    });

    const cache = new Map();
    raiz.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const antigo = o.material;

      // reconhecida como peça vira peça; o resto é pintura da classe
      const peca = antigo.uuid === corpo ? null : classificar(antigo);

      if (!peca) {
        o.material = pintura;
      } else {
        if (!cache.has(peca)) {
          cache.set(peca, new THREE.MeshStandardMaterial({
            color: peca.cor,
            metalness: peca.metal,
            roughness: peca.rugos,
            emissive: peca.brilha ? peca.cor : 0x000000,
            emissiveIntensity: peca.brilha ? 1.1 : 0,
            side: THREE.DoubleSide,
          }));
        }
        o.material = cache.get(peca);
      }
      if (antigo.dispose) antigo.dispose();
    });
  }

  /* --------------------------------------------------------------------
     Oreca de reserva, construído aqui
     -------------------------------------------------------------------- */
  function montarOreca(cor) {
    const spec = ORECA;
    const g = new THREE.Group();

    const pintura = new THREE.MeshStandardMaterial({
      color: cor, metalness: 0.14, roughness: 0.42,
    });
    const preto = new THREE.MeshStandardMaterial({
      color: 0x151a21, metalness: 0.25, roughness: 0.6,
    });
    const vidro = new THREE.MeshStandardMaterial({
      color: 0x0a0e13, metalness: 0.4, roughness: 0.16,
    });
    const borracha = new THREE.MeshStandardMaterial({
      color: 0x0e1116, metalness: 0, roughness: 0.95,
    });
    const farolMat = new THREE.MeshStandardMaterial({
      color: 0xfff4d0, emissive: 0xffe9a8, emissiveIntensity: 1.4, roughness: 0.3,
    });

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
      }), pintura);
    corpo.position.z = -spec.comprimento / 2;
    g.add(corpo);

    const cab = spec.cabine;
    const teto = new THREE.Mesh(
      new THREE.BoxGeometry(cab.largura, cab.altura, cab.comprimento), vidro);
    teto.position.set(0, cab.topo - cab.altura / 2, cab.z);
    g.add(teto);

    const sp = spec.splitter;
    const splitter = new THREE.Mesh(
      new THREE.BoxGeometry(sp.largura, 0.035, sp.prof), preto);
    splitter.position.set(0, sp.y, spec.comprimento / 2 - sp.prof / 2 + 0.06);
    g.add(splitter);

    const asa = spec.asa;
    const plano = new THREE.Mesh(
      new THREE.BoxGeometry(asa.largura, 0.05, asa.corda), preto);
    plano.position.set(0, asa.altura, asa.z);
    g.add(plano);
    [-1, 1].forEach((lado) => {
      const la = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.30, asa.corda + 0.10), preto);
      la.position.set(lado * asa.largura / 2, asa.altura - 0.10, asa.z);
      g.add(la);
    });

    const b = spec.barbatana;
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, b.altura, b.comprimento), preto);
    fin.position.set(0, cab.topo - 0.02 + b.altura / 2 - 0.14, b.z);
    g.add(fin);

    const zF = spec.comprimento / 2 - 0.02;
    spec.farois.forEach(([x, y, larg, alt]) => {
      [-1, 1].forEach((lado) => {
        const luz = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, 0.07), farolMat);
        luz.position.set(lado * x, y, zF);
        g.add(luz);
      });
    });

    const rd = spec.roda;
    [1, -1].forEach((fr) => {
      [-1, 1].forEach((lado) => {
        const roda = new THREE.Mesh(
          new THREE.CylinderGeometry(rd.raio, rd.raio, rd.largura, 20), borracha);
        roda.rotation.z = Math.PI / 2;
        roda.position.set(lado * rd.dx, rd.raio, fr * rd.dz);
        g.add(roda);
      });
    });

    return g;
  }

  /* --------------------------------------------------------------------
     Monta a fila: uma coluna por classe
     -------------------------------------------------------------------- */
  const estilo = getComputedStyle(document.documentElement);
  const corDaClasse = (id) =>
    new THREE.Color((estilo.getPropertyValue("--" + id) || "#ffffff").trim());

  const VAO = 13.2;
  const COLUNA = VAO / 4;
  const grupos = [];

  function encaixar(obj, i) {
    obj.position.x += (i - 1.5) * COLUNA;
    cena.add(obj);
    grupos[i] = obj;
    desenhar();
  }

  // Reserva imediata, para a fila nunca ficar vazia enquanto o GLB chega
  CLASSES.forEach((c, i) => {
    if (MODELOS[c.id]) return;                 // esse vem de arquivo
    const oreca = montarOreca(corDaClasse(c.id));
    normalizar(oreca, 0);              // mesma caixa que os modelos reais
    encaixar(oreca, i);
  });

  let carregador = null;
  try {
    const mod = await import("three/addons/loaders/GLTFLoader.js");
    carregador = new mod.GLTFLoader();
  } catch (e) {
    carregador = null;
  }

  if (carregador) {
    // Em paralelo: cada carro aparece assim que o próprio arquivo chega
    CLASSES.forEach((c, i) => {
      const m = MODELOS[c.id];
      if (!m) return;
      carregador.load(m.arquivo, (gltf) => {
        const raiz = gltf.scene;
        normalizar(raiz, m.giroY);
        repintar(raiz, corDaClasse(c.id));
        const suporte = new THREE.Group();
        suporte.add(raiz);
        encaixar(suporte, i);
      }, undefined, () => {
        // arquivo faltando ou corrompido: cai na geometria de reserva
        const oreca = montarOreca(corDaClasse(c.id));
    normalizar(oreca, 0);              // mesma caixa que os modelos reais
    encaixar(oreca, i);
      });
    });
  } else {
    CLASSES.forEach((c, i) => {
      if (!MODELOS[c.id]) return;
      const oreca = montarOreca(corDaClasse(c.id));
    normalizar(oreca, 0);              // mesma caixa que os modelos reais
    encaixar(oreca, i);
    });
  }

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

  redimensionar();
  if (window.ResizeObserver) new ResizeObserver(redimensionar).observe(palco);
  else window.addEventListener("resize", redimensionar);
  window.addEventListener("load", redimensionar);

  /* ---- leve reação ao ponteiro ----
     Os carros ficam de frente e só acompanham o ponteiro de leve. Ao sair,
     mantêm o lado por onde ele saiu, em vez de voltar ao centro. */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const AMPLITUDE = 0.16;             // radianos, pouco mais de 9 graus

    const olharPara = (clientX) => {
      const r = palco.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, ((clientX - r.left) / r.width - 0.5) * 2));
      grupos.forEach((g) => { if (g) g.rotation.y = nx * AMPLITUDE; });
      desenhar();
    };

    palco.parentElement.addEventListener("pointermove",
      (ev) => olharPara(ev.clientX), { passive: true });

    /* Usa a coordenada do próprio evento de saída: se o ponteiro sai
       rápido, o último pointermove estaria defasado e a pose ficaria errada. */
    palco.parentElement.addEventListener("pointerleave",
      (ev) => olharPara(ev.clientX), { passive: true });
  }

  palco.classList.add("is-3d");
})();
