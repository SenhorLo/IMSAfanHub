/* ==========================================================================
   IMSA HUB · dados da temporada 2026
   WeatherTech SportsCar Championship

   Fontes: entry list oficial IMSA / Wikipedia (out 2025 – jan 2026).
   Imagens: Wikimedia Commons, via hotlink em Special:FilePath.
   `img` é a foto do carro DAQUELA equipe no IMSA (acervo Watkins Glen 2023–2025).
   Onde a livery exata não existe no Commons, usa-se o carro IMSA mais próximo
   do mesmo modelo — marcado com [~] no comentário da linha.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1 · CLASSES
   Fonte única para a faixa de tráfego do topo e para a tabela de classes.
   `lap` é o tempo de referência em segundos no traçado de Daytona (aprox.,
   base de classificação). A faixa animada usa esses valores para mover cada
   classe no ritmo real — é por isso que o GTP alcança o GTD na tela.
   -------------------------------------------------------------------------- */
const CLASSES = [
  {
    id: "gtp",
    plate: "GTP",
    name: "Grand Touring Prototype",
    placa: "Preta",
    type: "prototipo",
    lap: 93.8,
    lapLabel: "1:33.8",
    crew: "Ouro / Platina",
    summary:
      "A categoria rainha. Protótipos híbridos LMDh e LMH, os mesmos regulamentos de Le Mans, com motor customizado por montadora e sistema híbrido padrão de 50 kW.",
  },
  {
    id: "lmp2",
    plate: "LMP2",
    name: "Le Mans Prototype 2",
    placa: "Azul",
    type: "prototipo",
    lap: 97.5,
    lapLabel: "1:37.5",
    crew: "Prata / Bronze obrigatório",
    summary:
      "Igualdade mecânica total: chassi Oreca 07 e motor Gibson V8 aspirado para todo mundo, sem híbrido. A diferença fica por conta do piloto e da estratégia.",
  },
  {
    id: "gtdpro",
    plate: "GTD PRO",
    name: "GT Daytona Pro",
    placa: "Vermelha",
    type: "gt",
    lap: 104.5,
    lapLabel: "1:44.5",
    crew: "100% profissional",
    summary:
      "Carros GT3 derivados de modelos de rua, tocados por equipes oficiais de fábrica com tripulação inteiramente profissional.",
  },
  {
    id: "gtd",
    plate: "GTD",
    name: "GT Daytona",
    placa: "Verde",
    type: "gt",
    lap: 105.5,
    lapLabel: "1:45.5",
    crew: "Prata / Bronze obrigatório",
    summary:
      "Os mesmíssimos GT3 da classe Pro. Muda a tripulação: é obrigatório escalar pilotos de graduação Prata ou Bronze.",
  },
];

/* --------------------------------------------------------------------------
   2 · MONTADORAS
   Cor de destaque por marca, usada na lateral dos cards de equipe.
   -------------------------------------------------------------------------- */
const BRAND = {
  Porsche: "#d5001c",
  Cadillac: "#a4884f",
  BMW: "#1c69d4",
  Acura: "#c8102e",
  "Aston Martin": "#00594f",
  Chevrolet: "#d1a856",
  Ferrari: "#d40000",
  Lamborghini: "#b9982a",
  Lexus: "#8b94a3",
  "Mercedes-AMG": "#00a19b",
  McLaren: "#ff5f00",
  Ford: "#3a6ea5",
};

/* --------------------------------------------------------------------------
   3 · FICHA TÉCNICA POR MODELO
   Valores aproximados. Os GT3 variam de acordo com o BoP de cada etapa.
   -------------------------------------------------------------------------- */
const CAR_SPECS = {
  // GTP — LMDh / LMH
  "Porsche 963":               { motor: "V8 4.6L biturbo + híbrido",     potencia: "~680 cv (máx. ~500 kW)", tracao: "Traseira (RWD)", peso: "~1.030 kg", reg: "LMDh · híbrido 50 kW" },
  "Cadillac V-Series.R":       { motor: "V8 5.5L aspirado + híbrido",    potencia: "~680 cv (máx. ~500 kW)", tracao: "Traseira (RWD)", peso: "~1.030 kg", reg: "LMDh · híbrido 50 kW" },
  "BMW M Hybrid V8":           { motor: "V8 4.0L biturbo + híbrido",     potencia: "~680 cv (máx. ~500 kW)", tracao: "Traseira (RWD)", peso: "~1.030 kg", reg: "LMDh · híbrido 50 kW" },
  "Acura ARX-06":              { motor: "V6 2.4L biturbo + híbrido",     potencia: "~680 cv (máx. ~500 kW)", tracao: "Traseira (RWD)", peso: "~1.030 kg", reg: "LMDh · híbrido 50 kW" },
  "Aston Martin Valkyrie":     { motor: "V12 6.5L aspirado (Cosworth)",  potencia: "~680 cv",                tracao: "Traseira (RWD)", peso: "~1.030 kg", reg: "LMH · sem híbrido no IMSA" },
  // GT3 — GTD Pro / GTD
  "Corvette Z06 GT3.R":        { motor: "V8 5.5L aspirado (flat-plane)", potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Ford Mustang GT3 Evo":      { motor: "V8 5.4L aspirado",              potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Ferrari 296 GT3 Evo":       { motor: "V6 3.0L biturbo",               potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Lamborghini Huracán GT3":   { motor: "V10 5.2L aspirado",             potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Lexus RC F GT3":            { motor: "V8 5.4L aspirado",              potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "BMW M4 GT3 Evo":            { motor: "6 cil. em linha 3.0L biturbo",  potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Porsche 911 GT3 R (992.2)": { motor: "6 cil. boxer 4.2L aspirado",    potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Aston Martin Vantage GT3":  { motor: "V8 4.0L biturbo",               potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
  "Mercedes-AMG GT3 Evo":      { motor: "V8 6.3L aspirado",              potencia: "~500–570 cv (BoP)",      tracao: "Traseira (RWD)", peso: "~1.300 kg", reg: "GT3" },
};

/* --------------------------------------------------------------------------
   4 · GRID
   Cada entrada carrega o id da classe, para o filtro e a cor da placa.
   -------------------------------------------------------------------------- */
const ENTRIES = [
  // ---- GTP · placa preta ----
  { cls: "gtp", num: "6",  team: "Porsche Penske Motorsport",        car: "Porsche 963",           brand: "Porsche",      drivers: "Estre · Vanthoor · Nasr",         img: "Penske 963 6 WGI23 03.jpg" },
  { cls: "gtp", num: "7",  team: "Porsche Penske Motorsport",        car: "Porsche 963",           brand: "Porsche",      drivers: "Campbell · Jaminet · Makowiecki", img: "Penske 963 7 WGI23 05.jpg" },
  { cls: "gtp", num: "5",  team: "JDC–Miller MotorSports",           car: "Porsche 963",           brand: "Porsche",      drivers: "van der Helm · Heinrich",         img: "JDC GTP WGI25 01.jpg" },
  { cls: "gtp", num: "10", team: "Cadillac Wayne Taylor Racing",     car: "Cadillac V-Series.R",   brand: "Cadillac",     drivers: "Albuquerque · R. Taylor",         img: "WTR GTP 10 WGI25 01.jpg" },
  { cls: "gtp", num: "40", team: "Cadillac Wayne Taylor Racing",     car: "Cadillac V-Series.R",   brand: "Cadillac",     drivers: "J. Taylor · Deletraz",            img: "WTR GTP 40 WGI25 03.jpg" },
  { cls: "gtp", num: "31", team: "Cadillac Whelen (Action Express)", car: "Cadillac V-Series.R",   brand: "Cadillac",     drivers: "Aitken · Bamber · Vesti",         img: "Whelen Cadillac WGI24 01.jpg" },
  { cls: "gtp", num: "24", team: "BMW M Team WRT",                   car: "BMW M Hybrid V8",       brand: "BMW",          drivers: "S. van der Linde · Eng",          img: "BMW GTP 24 WGI25 01.jpg" },
  { cls: "gtp", num: "25", team: "BMW M Team WRT",                   car: "BMW M Hybrid V8",       brand: "BMW",          drivers: "D. Vanthoor · Wittmann",          img: "BMW GTP 25 WGI25 04.jpg" },
  { cls: "gtp", num: "60", team: "Acura Meyer Shank Racing",         car: "Acura ARX-06",          brand: "Acura",        drivers: "Blomqvist · Braun",               img: "MSR GTP 60 WGI25 01.jpg" },
  { cls: "gtp", num: "93", team: "Acura Meyer Shank Racing",         car: "Acura ARX-06",          brand: "Acura",        drivers: "Yelloly · Fittipaldi",            img: "MSR GTP 93 WGI25 01.jpg" },
  { cls: "gtp", num: "23", team: "Aston Martin THOR Team",           car: "Aston Martin Valkyrie", brand: "Aston Martin", drivers: "De Angelis · Gunn",               img: "HOR Valkyrie WGI25 02.jpg" },

  // ---- GTD PRO · placa vermelha ----
  { cls: "gtdpro", num: "3",  team: "Corvette Racing by Pratt Miller", car: "Corvette Z06 GT3.R",      brand: "Chevrolet",   drivers: "García · Catsburg",      img: "Pratt Miller Corvette 3 WGI25 03.jpg" },
  { cls: "gtdpro", num: "4",  team: "Corvette Racing by Pratt Miller", car: "Corvette Z06 GT3.R",      brand: "Chevrolet",   drivers: "Sims · Milner",          img: "Pratt Miller Corvette 4 WGI25 03.jpg" },
  { cls: "gtdpro", num: "64", team: "Ford Racing",                     car: "Ford Mustang GT3 Evo",    brand: "Ford",        drivers: "Barker · Olsen",         img: "Multimatic Mustang 64 WGI24 01.jpg" },
  { cls: "gtdpro", num: "65", team: "Ford Racing",                     car: "Ford Mustang GT3 Evo",    brand: "Ford",        drivers: "Mies · Rockenfeller",    img: "Multimatic Mustang 65 WGI24 01.jpg" },
  { cls: "gtdpro", num: "62", team: "Risi Competizione",               car: "Ferrari 296 GT3 Evo",     brand: "Ferrari",     drivers: "Rigon · Serra",          img: "Risi Ferrari WGI23 01.jpg" },
  { cls: "gtdpro", num: "9",  team: "Pfaff Motorsports",               car: "Lamborghini Huracán GT3", brand: "Lamborghini", drivers: "Mitchell · Caldarelli",  img: "Pfaff Lambo WGI25 01.jpg" },
  { cls: "gtdpro", num: "14", team: "Vasser Sullivan Racing",          car: "Lexus RC F GT3",          brand: "Lexus",       drivers: "Barnicoat · Hawksworth", img: "VSR Lexus 14 WGI25 01.jpg" },
  { cls: "gtdpro", num: "1",  team: "Paul Miller Racing",              car: "BMW M4 GT3 Evo",          brand: "BMW",         drivers: "De Phillippi · Verhagen", img: "PMR BMW 1 WGI25 04.jpg" },

  // ---- GTD · placa verde ----
  { cls: "gtd", num: "77",  team: "AO Racing “Rexy”",        car: "Porsche 911 GT3 R (992.2)", brand: "Porsche",      drivers: "King · Tandy",                    img: "AO Porsche WGI25 01.jpg" },
  { cls: "gtd", num: "911", team: "Manthey Racing",          car: "Porsche 911 GT3 R (992.2)", brand: "Porsche",      drivers: "Bachler · Feller",                img: "2024 6 Hours of Spa-Francorchamps Manthey EMA Porsche 911 GT3 R No.91 (DSC02368).jpg" }, // Manthey estreia no IMSA em 2026 — foto do mesmo carro/equipe no WEC
  { cls: "gtd", num: "27",  team: "Heart of Racing Team",    car: "Aston Martin Vantage GT3",  brand: "Aston Martin", drivers: "Barrichello · Gamble · Robichon", img: "Heart of Racing GTD WGI25 01.jpg" },
  { cls: "gtd", num: "21",  team: "AF Corse USA",            car: "Ferrari 296 GT3 Evo",       brand: "Ferrari",      drivers: "Fuoco · Mann",                    img: "AF GT3 WGI25 01.jpg" },
  { cls: "gtd", num: "12",  team: "Vasser Sullivan Racing",  car: "Lexus RC F GT3",            brand: "Lexus",        drivers: "Pedersen · Telitz",               img: "VSR Lexus 12 WGI25 06.jpg" },
  { cls: "gtd", num: "16",  team: "Myers Riley Motorsports", car: "Ford Mustang GT3 Evo",      brand: "Ford",         drivers: "Fraga · Monk",                    img: "Gradient Mustang WGI25 12.jpg" }, // [~] Mustang GT3 IMSA (Gradient) — livery Riley #16 não está no Commons
  { cls: "gtd", num: "13",  team: "AWA / 13 Autosport",      car: "Corvette Z06 GT3.R",        brand: "Chevrolet",    drivers: "Bell · Fidani · Kern",            img: "AWA Corvette WGI25 01.jpg" },
  { cls: "gtd", num: "48",  team: "Winward Racing",          car: "Mercedes-AMG GT3 Evo",      brand: "Mercedes-AMG", drivers: "Hart · Stolz",                    img: "Winward AMG WGI25 01.jpg" },
];

/* --------------------------------------------------------------------------
   5 · LMP2
   Não há lista de inscritos por carro aqui: a classe é definida pelo pacote
   técnico único, então ela aparece como ficha, não como grade de equipes.
   -------------------------------------------------------------------------- */
const LMP2 = {
  img: "PR1 Oreca WGI25 01.jpg",
  caption: "Oreca 07 — o chassi único de toda a classe. Na foto, a PR1/Mathiasen no IMSA.",
  specs: [
    { value: "Oreca 07",     label: "Chassi único homologado" },
    { value: "Gibson GK428", label: "V8 4.2L aspirado" },
    { value: "Sem híbrido",  label: "Puro motor a combustão" },
    { value: "12 carros",    label: "Full-season em 2026" },
  ],
};

/* --------------------------------------------------------------------------
   6 · CALENDÁRIO 2026
   `end` alimenta o contador e a ordenação. `map` é o traçado no Commons.
   -------------------------------------------------------------------------- */
const SCHEDULE = [
  { round: 1,  name: "Rolex 24 At Daytona",             track: "Daytona International Speedway", loc: "Flórida",         date: "24–25 Jan", len: "24 horas",    short: "24H",   end: "2026-01-25", enduro: true,  km: "5,729 km", turns: 12, type: "Misto — infield + oval inclinado",       map: "Daytona International Speedway Road Course 2024.svg" },
  { round: 2,  name: "Mobil 1 Twelve Hours of Sebring", track: "Sebring International Raceway",  loc: "Flórida",         date: "21 Mar",    len: "12 horas",    short: "12H",   end: "2026-03-21", enduro: true,  km: "6,019 km", turns: 17, type: "Aeródromo — concreto e asfalto",         map: "Sebring International Raceway.svg" },
  { round: 3,  name: "Acura Grand Prix of Long Beach",  track: "Long Beach Street Circuit",      loc: "Califórnia",      date: "18 Abr",    len: "100 minutos", short: "100'",  end: "2026-04-18", enduro: false, km: "3,167 km", turns: 11, type: "Circuito de rua",                        map: "Long Beach Street Circuit IndyCar.svg" },
  { round: 4,  name: "WeatherTech Raceway Laguna Seca", track: "Laguna Seca",                    loc: "Califórnia",      date: "3 Mai",     len: "2h40",        short: "2H40",  end: "2026-05-03", enduro: false, km: "3,602 km", turns: 11, type: "Misto permanente — Corkscrew",           map: "Laguna seca layout.svg" },
  { round: 5,  name: "Chevrolet Detroit Grand Prix",    track: "Detroit Street Circuit",         loc: "Michigan",        date: "30 Mai",    len: "100 minutos", short: "100'",  end: "2026-05-30", enduro: false, km: "2,640 km", turns: 9,  type: "Circuito de rua",                        map: "TrackMap Detroit-2023.png" },
  { round: 6,  name: "Sahlen's Six Hours of The Glen",  track: "Watkins Glen International",     loc: "Nova York",       date: "28 Jun",    len: "6 horas",     short: "6H",    end: "2026-06-28", enduro: true,  km: "5,552 km", turns: 11, type: "Misto permanente rápido",                map: "Watkins Glen International Long Circuit 2024.svg" },
  { round: 7,  name: "Chevrolet GP at CTMP",            track: "Canadian Tire Motorsport Park",  loc: "Ontário, Canadá", date: "12 Jul",    len: "2h40",        short: "2H40",  end: "2026-07-12", enduro: false, km: "3,957 km", turns: 10, type: "Misto permanente ondulado",              map: "Mosport-CTMP.svg" },
  { round: 8,  name: "Motul SportsCar GP",              track: "Road America",                   loc: "Wisconsin",       date: "2 Ago",     len: "6 horas",     short: "6H",    end: "2026-08-02", enduro: true,  km: "6,515 km", turns: 14, type: "Misto permanente",                       map: "Road America.svg" },
  { round: 9,  name: "Michelin GT Challenge",           track: "VIRginia International Raceway", loc: "Virgínia",        date: "23 Ago",    len: "2h40",        short: "2H40",  end: "2026-08-23", enduro: false, km: "5,263 km", turns: 17, type: "Misto permanente",                       map: "Virginia International Raceway - Full Course.svg" },
  { round: 10, name: "Battle on the Bricks",            track: "Indianapolis Motor Speedway",    loc: "Indiana",         date: "20 Set",    len: "2h40",        short: "2H40",  end: "2026-09-20", enduro: false, km: "3,925 km", turns: 14, type: "Misto interno — infield + reta",         map: "Indianapolis Motor Speedway Road Course 2024.svg" },
  { round: 11, name: "Motul Petit Le Mans",             track: "Road Atlanta",                   loc: "Geórgia",         date: "3 Out",     len: "10 horas",    short: "10H",   end: "2026-10-03", enduro: true,  km: "4,088 km", turns: 12, type: "Misto permanente",                       map: "Road Atlanta track map.png" },
];

/* --------------------------------------------------------------------------
   7 · PONTUAÇÃO
   Do 1º ao 5º a queda é maior; a partir do 5º cai de 10 em 10 por posição.
   A classificação vale exatamente 10% da corrida.
   -------------------------------------------------------------------------- */
const POINTS_TOP5 = { 1: 350, 2: 320, 3: 300, 4: 280, 5: 260 };

function racePoints(pos) {
  return pos <= 5 ? POINTS_TOP5[pos] : Math.max(260 - (pos - 5) * 10, 0);
}

function qualiPoints(pos) {
  return Math.round(racePoints(pos) / 10);
}

/* --------------------------------------------------------------------------
   8 · UTILIDADES
   -------------------------------------------------------------------------- */

// Monta a URL estável de hotlink do Wikimedia Commons.
function commons(file) {
  return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file);
}
