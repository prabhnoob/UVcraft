// geo.ts — coordinate helpers + authoritative building dataset
// All GPS coords derived from UVic Nov-2025 campus PDF + Google Maps satellite

// Ring Road centre: 48.46310°N, 123.31170°W
export const LAT0 =  48.46310;
export const LON0 = -123.31170;
const LAT_M = 111320;
const LON_M = 111320 * Math.cos(LAT0 * Math.PI / 180);

/** Convert GPS → local XZ metres (X=east, Z=-north) */
export function gps(lat: number, lon: number): [number, number] {
  return [(lon - LON0) * LON_M, -(lat - LAT0) * LAT_M];
}

// Map-calibrated visual placements from the supplied UVic campus map crop.
// X points east, Z points south, with the academic quad kept near the scene centre.
export const MAP_PLACEMENTS: Record<string, [number, number]> = {
  "McPherson Library": [225, 78],
  "Mearns Centre (Library wing)": [290, 88],
  "Clearihue Bldg — North wing": [190, -104],
  "Clearihue Bldg — South wing": [188, -58],
  "Clearihue Bldg — West wing": [142, -80],
  "Cornett Bldg": [-18, -70],
  "Business & Economics Bldg": [-62, -220],
  "David Turpin Bldg": [-145, -165],
  "MacLaurin Bldg": [-150, 92],
  "Human & Social Development Bldg": [-286, 22],
  "Elliott Bldg": [170, 190],
  "Bob Wright Centre": [235, 222],
  "Engineering ECS": [22, 328],
  "Engineering EOW": [178, 326],
  "Engineering ELW": [92, 368],
  "Petch Bldg": [126, 232],
  "Cunningham Bldg": [-40, 222],
  "Medical Sciences Bldg": [-126, 258],
  "Murray & Anne Fraser Bldg": [-310, -190],
  "Fine Arts Bldg": [-360, 85],
  "Visual Arts Bldg": [-335, 55],
  "Phoenix Theatre": [-320, 25],
  "Saunders Bldg": [-250, 75],
  "Continuing Studies Bldg": [-232, -118],
  "Student Union Bldg": [282, -120],
  "Campus Services Bldg": [205, -235],
  "Jamie Cassels Centre": [96, -170],
  "David Strong Bldg": [-50, -125],
  "First Peoples House": [88, -42],
  "Halpern Centre": [330, -70],
  "Health & Wellness Centre": [38, -160],
  "Multifaith Centre": [90, -158],
  "CARSA": [180, -350],
  "CARSA Parkade": [238, -350],
  "McKinnon Bldg": [118, -308],
  "Ian Stewart Complex": [68, -330],
  "Čeqʷəŋín (Cheko'nien) House": [370, -35],
  "Sŋéqə (Sngequ) House": [405, -20],
  "District Energy Plant": [0, 315],
};

const DEG = Math.PI / 180;

export const MAP_ROTATIONS: Record<string, number> = {
  "McPherson Library": 0,
  "Mearns Centre (Library wing)": 0,
  "Clearihue Bldg — North wing": 0,
  "Clearihue Bldg — South wing": 0,
  "Clearihue Bldg — West wing": 0,
  "Cornett Bldg": 0,
  "Business & Economics Bldg": -3 * DEG,
  "David Turpin Bldg": -15 * DEG,
  "MacLaurin Bldg": 0,
  "Human & Social Development Bldg": 0,
  "Elliott Bldg": 0,
  "Bob Wright Centre": 0,
  "Engineering ECS": -8 * DEG,
  "Engineering EOW": 18 * DEG,
  "Engineering ELW": 8 * DEG,
  "Petch Bldg": 0,
  "Cunningham Bldg": 0,
  "Medical Sciences Bldg": 3 * DEG,
  "Murray & Anne Fraser Bldg": 2 * DEG,
  "Fine Arts Bldg": -8 * DEG,
  "Visual Arts Bldg": -6 * DEG,
  "Phoenix Theatre": -5 * DEG,
  "Saunders Bldg": 3 * DEG,
  "Continuing Studies Bldg": -4 * DEG,
  "Student Union Bldg": -8 * DEG,
  "Campus Services Bldg": -22 * DEG,
  "Jamie Cassels Centre": 0,
  "David Strong Bldg": 0,
  "First Peoples House": 0,
  "Halpern Centre": -10 * DEG,
  "Health & Wellness Centre": 0,
  "Multifaith Centre": 0,
  "CARSA": 0,
  "CARSA Parkade": 0,
  "McKinnon Bldg": -8 * DEG,
  "Ian Stewart Complex": -8 * DEG,
  "Čeqʷəŋín (Cheko'nien) House": 0,
  "Sŋéqə (Sngequ) House": 0,
  "District Energy Plant": -14 * DEG,
};

export const CALIBRATION_POINTS = [
  { id: "QUAD", label: "Quad centre", x: 20, z: 38, color: "#f6e58d" },
  { id: "LIB", label: "McPherson Library", x: 225, z: 78, color: "#f4d03f" },
  { id: "CLE", label: "Clearihue", x: 174, z: -80, color: "#85c1e9" },
  { id: "MAC", label: "MacLaurin", x: -150, z: 92, color: "#d7b98f" },
  { id: "MSB", label: "Medical Sciences", x: -126, z: 258, color: "#a9dfbf" },
  { id: "ECS", label: "Engineering", x: 22, z: 328, color: "#aed6f1" },
];

export function buildingPosition(building: { name: string; lat: number; lon: number }): [number, number] {
  return MAP_PLACEMENTS[building.name] ?? gps(building.lat, building.lon);
}

export function buildingRotation(building: { name: string }) {
  return MAP_ROTATIONS[building.name] ?? 0;
}

export interface BuildingDef {
  name: string;
  abbr: string;
  lat: number; lon: number;   // footprint centre GPS
  fw: number;  fd: number;    // footprint width (E-W) × depth (N-S) in metres
  floors: number;
  flH: number;                // floor-to-floor height metres
  color: string;
  roofColor: string;
  winColor: string;
  info: string;
  special?: string;           // 'library'|'carsa'|'dtb'|'jcc'|'sub'|'fph'|'clearihue'|'engineering'
}

export const BUILDINGS: BuildingDef[] = [
  // ─── Academic core ──────────────────────────────────────────────

  {
    name:"McPherson Library", abbr:"LIB",
    lat:48.46395, lon:-123.31425,
    fw:65, fd:48, floors:4, flH:4.2,
    color:"#c4b890", roofColor:"#8a7a5a", winColor:"#1a2e48",
    info:"1964 · Precast concrete + exposed granite aggregate · George Norris relief panels",
    special:"library",
  },
  {
    name:"Mearns Centre (Library wing)", abbr:"MCL",
    lat:48.46420, lon:-123.31335,
    fw:30, fd:26, floors:3, flH:4.2,
    color:"#ccbf98", roofColor:"#8a7a5a", winColor:"#2a4060",
    info:"2008 addition · glass atrium",
  },
  {
    name:"Clearihue Bldg — North wing", abbr:"CLE",
    lat:48.46350, lon:-123.31155,
    fw:88, fd:20, floors:3, flH:4.0,
    color:"#c4aa80", roofColor:"#9a8860", winColor:"#1a2e48",
    info:"1961 · Oldest academic building · U-shaped quad plan",
    special:"clearihue",
  },
  {
    name:"Clearihue Bldg — South wing", abbr:"CLE",
    lat:48.46290, lon:-123.31155,
    fw:88, fd:20, floors:3, flH:4.0,
    color:"#c4aa80", roofColor:"#9a8860", winColor:"#1a2e48",
    info:"1961",
  },
  {
    name:"Clearihue Bldg — West wing", abbr:"CLE",
    lat:48.46320, lon:-123.31220,
    fw:18, fd:24, floors:3, flH:4.0,
    color:"#c4aa80", roofColor:"#9a8860", winColor:"#1a2e48",
    info:"1961",
  },
  {
    name:"Cornett Bldg", abbr:"COR",
    lat:48.46390, lon:-123.31240,
    fw:58, fd:32, floors:3, flH:4.0,
    color:"#b8a070", roofColor:"#8a7050", winColor:"#1a2e48",
    info:"1967 · Social sciences · Horizontal spandrel banding",
  },
  {
    name:"Business & Economics Bldg", abbr:"BEC",
    lat:48.46430, lon:-123.31395,
    fw:52, fd:32, floors:4, flH:4.0,
    color:"#b09070", roofColor:"#806040", winColor:"#1a2e48",
    info:"4 floors · Business + economics faculty",
  },
  {
    name:"David Turpin Bldg", abbr:"DTB",
    lat:48.46265, lon:-123.31210,
    fw:58, fd:36, floors:5, flH:4.2,
    color:"#7a9680", roofColor:"#3a7840", winColor:"#1b4050",
    info:"5F · LEED · Sedum / grass roof · 4 tiered lecture theatres",
    special:"dtb",
  },
  {
    name:"MacLaurin Bldg", abbr:"MAC",
    lat:48.46200, lon:-123.31055,
    fw:52, fd:32, floors:3, flH:4.0,
    color:"#a08060", roofColor:"#786040", winColor:"#1a2e48",
    info:"3F · Arts & Education",
  },
  {
    name:"Human & Social Development Bldg", abbr:"HSD",
    lat:48.46330, lon:-123.31530,
    fw:58, fd:36, floors:5, flH:4.2,
    color:"#8a7060", roofColor:"#604040", winColor:"#1b3050",
    info:"5F · West campus · Social work, public health, education",
  },
  {
    name:"Elliott Bldg", abbr:"ELL",
    lat:48.46250, lon:-123.31030,
    fw:52, fd:32, floors:4, flH:4.0,
    color:"#8a8070", roofColor:"#606050", winColor:"#1a2e48",
    info:"4F · Chemistry + Physics · Climenhaga Observatory dome on roof",
    special:"observatory",
  },
  {
    name:"Bob Wright Centre", abbr:"BWC",
    lat:48.46185, lon:-123.30960,
    fw:58, fd:36, floors:6, flH:4.2,
    color:"#6a8090", roofColor:"#405060", winColor:"#1a3050",
    info:"6F · 137,000 sqft · Earth & Ocean Sciences · SciCafé · Rooftop telescope dome",
    special:"bwc",
  },
  {
    name:"Engineering ECS", abbr:"ECS",
    lat:48.46280, lon:-123.30870,
    fw:58, fd:40, floors:5, flH:4.2,
    color:"#607080", roofColor:"#405060", winColor:"#1a2a3a",
    info:"5F · Engineering & Computer Science main building",
    special:"engineering",
  },
  {
    name:"Engineering EOW", abbr:"EOW",
    lat:48.46320, lon:-123.30940,
    fw:36, fd:28, floors:4, flH:4.2,
    color:"#566878", roofColor:"#405060", winColor:"#1a2a3a",
    info:"4F · Engineering Office Wing",
  },
  {
    name:"Engineering ELW", abbr:"ELW",
    lat:48.46225, lon:-123.30850,
    fw:46, fd:32, floors:4, flH:4.2,
    color:"#4e6070", roofColor:"#405060", winColor:"#1a2a3a",
    info:"4F · Engineering Lab Wing",
  },
  {
    name:"Petch Bldg", abbr:"PET",
    lat:48.46295, lon:-123.30970,
    fw:36, fd:26, floors:3, flH:4.0,
    color:"#7a8870", roofColor:"#506050", winColor:"#1a2e48",
    info:"3F · Biology + Biochemistry",
  },
  {
    name:"Cunningham Bldg", abbr:"CUN",
    lat:48.46260, lon:-123.30955,
    fw:32, fd:24, floors:3, flH:4.0,
    color:"#7a8070", roofColor:"#506050", winColor:"#1a2e48",
    info:"3F · Biology",
  },
  {
    name:"Medical Sciences Bldg", abbr:"MSB",
    lat:48.46165, lon:-123.30885,
    fw:42, fd:30, floors:4, flH:4.0,
    color:"#7a8870", roofColor:"#506050", winColor:"#1b3040",
    info:"4F · Medical sciences + pharmacy",
  },
  {
    name:"Murray & Anne Fraser Bldg", abbr:"FRA",
    lat:48.46205, lon:-123.31130,
    fw:50, fd:32, floors:3, flH:4.0,
    color:"#8b3a2b", roofColor:"#6b2518", winColor:"#1a2a38",
    info:"3F · Law · Red brick + brutalist concrete banding",
  },
  {
    name:"Fine Arts Bldg", abbr:"FAC",
    lat:48.46285, lon:-123.31490,
    fw:42, fd:30, floors:2, flH:4.0,
    color:"#9a8075", roofColor:"#705060", winColor:"#1a2e48",
    info:"2F · Fine Arts faculty",
  },
  {
    name:"Visual Arts Bldg", abbr:"VAC",
    lat:48.46315, lon:-123.31555,
    fw:28, fd:24, floors:2, flH:4.0,
    color:"#907870", roofColor:"#605050", winColor:"#1a2e48",
    info:"2F · Visual arts studios",
  },
  {
    name:"Phoenix Theatre", abbr:"PHX",
    lat:48.46335, lon:-123.31575,
    fw:26, fd:22, floors:2, flH:4.5,
    color:"#806070", roofColor:"#504060", winColor:"#1a2e48",
    info:"2F + fly tower · Theatre & performance arts",
    special:"phoenix",
  },
  {
    name:"Saunders Bldg", abbr:"SAU",
    lat:48.46218, lon:-123.31455,
    fw:38, fd:26, floors:2, flH:4.0,
    color:"#909888", roofColor:"#686860", winColor:"#1a2e48",
    info:"2F",
  },
  {
    name:"Continuing Studies Bldg", abbr:"CSB",
    lat:48.46440, lon:-123.31335,
    fw:38, fd:26, floors:3, flH:4.0,
    color:"#908878", roofColor:"#686050", winColor:"#1a2e48",
    info:"3F",
  },

  // ─── Student services ────────────────────────────────────────────

  {
    name:"Student Union Bldg", abbr:"SUB",
    lat:48.46245, lon:-123.31350,
    fw:58, fd:44, floors:3, flH:4.0,
    color:"#c89850", roofColor:"#9a7035", winColor:"#2a1e10",
    info:"1962–65 · Mid-Century Modern · John Di Castri · Pilotis columns · Cinecenta",
    special:"sub",
  },
  {
    name:"Campus Services Bldg", abbr:"CSE",
    lat:48.46215, lon:-123.31430,
    fw:36, fd:26, floors:2, flH:4.0,
    color:"#c0a060", roofColor:"#8a7040", winColor:"#1a1a1a",
    info:"2F · Bookstore + food services",
  },
  {
    name:"Jamie Cassels Centre", abbr:"JCC",
    lat:48.46270, lon:-123.31305,
    fw:55, fd:42, floors:3, flH:4.0,
    color:"#585858", roofColor:"#4a8060", winColor:"#1a2e48",
    info:"1978 · Distinctive patinated copper roof · Farquhar Auditorium · 15,329 m²",
    special:"jcc",
  },
  {
    name:"David Strong Bldg", abbr:"DSB",
    lat:48.46298, lon:-123.31392,
    fw:36, fd:26, floors:4, flH:4.0,
    color:"#888070", roofColor:"#606050", winColor:"#1a2e48",
    info:"4F · Admin",
  },
  {
    name:"First Peoples House", abbr:"FPH",
    lat:48.46313, lon:-123.31265,
    fw:24, fd:18, floors:2, flH:4.0,
    color:"#8b6040", roofColor:"#6b4020", winColor:"#2a1810",
    info:"2F · Coast Salish longhouse · Cedar posts · LEED Gold · Storm pond",
    special:"fph",
  },
  {
    name:"Halpern Centre", abbr:"HAL",
    lat:48.46225, lon:-123.31390,
    fw:28, fd:20, floors:2, flH:4.0,
    color:"#9a9080", roofColor:"#6a6050", winColor:"#1a2e48",
    info:"2F · Graduate students centre",
  },
  {
    name:"Health & Wellness Centre", abbr:"HWC",
    lat:48.46365, lon:-123.31308,
    fw:32, fd:24, floors:3, flH:4.0,
    color:"#8a9880", roofColor:"#607060", winColor:"#1a2e48",
    info:"3F · Student health services",
  },
  {
    name:"Multifaith Centre", abbr:"MUL",
    lat:48.46350, lon:-123.31190,
    fw:20, fd:16, floors:2, flH:4.0,
    color:"#a09080", roofColor:"#706860", winColor:"#1a2e48",
    info:"2F · Interfaith sacred space",
  },

  // ─── Athletics ───────────────────────────────────────────────────

  {
    name:"CARSA", abbr:"CAR",
    lat:48.46140, lon:-123.30980,
    fw:75, fd:60, floors:2, flH:5.5,
    color:"#1e1e1e", roofColor:"#111111", winColor:"#40a0be",
    info:"2015 · $77M · 190,000 sqft · LEED Gold · 16m climbing tower",
    special:"carsa",
  },
  {
    name:"CARSA Parkade", abbr:"PKD",
    lat:48.46140, lon:-123.30870,
    fw:22, fd:60, floors:4, flH:3.0,
    color:"#505050", roofColor:"#3a3a3a", winColor:"#1a1a1a",
    info:"4F · Parkade with vine-covered precast",
    special:"parkade",
  },
  {
    name:"McKinnon Bldg", abbr:"MCK",
    lat:48.46182, lon:-123.31105,
    fw:52, fd:40, floors:3, flH:4.5,
    color:"#7a7a70", roofColor:"#555555", winColor:"#1a1a2a",
    info:"3F · 1975 · Pool + gym + Sports Hall of Fame",
    special:"mckinnon",
  },
  {
    name:"Ian Stewart Complex", abbr:"ISC",
    lat:48.46155, lon:-123.31110,
    fw:48, fd:40, floors:2, flH:5.5,
    color:"#5a7080", roofColor:"#405060", winColor:"#1a3040",
    info:"2F · Ice rink",
    special:"ianstewart",
  },

  // ─── Residences ──────────────────────────────────────────────────

  {
    name:"Čeqʷəŋín (Cheko'nien) House", abbr:"CHK",
    lat:48.46100, lon:-123.31215,
    fw:32, fd:18, floors:10, flH:3.4,
    color:"#7a9090", roofColor:"#506070", winColor:"#2a4a6a",
    info:"2023 · Passive House · 398 beds · Largest capital project in UVic history",
  },
  {
    name:"Sŋéqə (Sngequ) House", abbr:"SNG",
    lat:48.46100, lon:-123.31135,
    fw:32, fd:18, floors:10, flH:3.4,
    color:"#6a8080", roofColor:"#405060", winColor:"#2a4a6a",
    info:"2023 · Passive House · 385 beds",
  },

  // ─── Infrastructure ──────────────────────────────────────────────

  {
    name:"District Energy Plant", abbr:"DEP",
    lat:48.46075, lon:-123.31280,
    fw:30, fd:22, floors:2, flH:5.0,
    color:"#606860", roofColor:"#454840", winColor:"#1a1a1a",
    info:"2F · District energy plant + EV charging hub",
  },
];
