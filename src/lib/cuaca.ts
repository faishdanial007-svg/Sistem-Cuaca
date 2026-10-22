// ============================================================
// Perpustakaan kongsi: kod cuaca WMO, tahap IPU DOE Malaysia,
// dan senarai lokasi utama Malaysia.
// ============================================================

export type IkonCuaca =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "thunder"
  | "snow";

export interface KodCuacaInfo {
  label: string;
  ikon: IkonCuaca;
}

// Pemetaan kod cuaca WMO -> penerangan Bahasa Melayu + ikon
export const KOD_CUACA: Record<number, KodCuacaInfo> = {
  0: { label: "Langit Cerah", ikon: "sun" },
  1: { label: "Cerah Sedikit", ikon: "sun" },
  2: { label: "Sebahagian Berawan", ikon: "cloud-sun" },
  3: { label: "Berawan Penuh", ikon: "cloud" },
  45: { label: "Berkabus", ikon: "fog" },
  48: { label: "Kabus Beku", ikon: "fog" },
  51: { label: "Gerimis Ringan", ikon: "drizzle" },
  53: { label: "Gerimis", ikon: "drizzle" },
  55: { label: "Gerimis Padat", ikon: "drizzle" },
  56: { label: "Gerimis Beku", ikon: "drizzle" },
  57: { label: "Gerimis Beku Padat", ikon: "drizzle" },
  61: { label: "Hujan Ringan", ikon: "rain" },
  63: { label: "Hujan Sederhana", ikon: "rain" },
  65: { label: "Hujan Lebat", ikon: "heavy-rain" },
  66: { label: "Hujan Beku", ikon: "rain" },
  67: { label: "Hujan Beku Lebat", ikon: "heavy-rain" },
  71: { label: "Salji Ringan", ikon: "snow" },
  73: { label: "Salji", ikon: "snow" },
  75: { label: "Salji Lebat", ikon: "snow" },
  77: { label: "Butir Salji", ikon: "snow" },
  80: { label: "Hujan Batang Ringan", ikon: "rain" },
  81: { label: "Hujan Batang", ikon: "rain" },
  82: { label: "Hujan Batang Deras", ikon: "heavy-rain" },
  85: { label: "Hujan Salji", ikon: "snow" },
  86: { label: "Hujan Salji Lebat", ikon: "snow" },
  95: { label: "Hujan Petir", ikon: "thunder" },
  96: { label: "Petir & Hujan Batu", ikon: "thunder" },
  99: { label: "Petir & Hujan Batu Deras", ikon: "thunder" },
};

export function infoKodCuaca(kod: number | null | undefined): KodCuacaInfo {
  if (kod == null) return { label: "—", ikon: "cloud" };
  return KOD_CUACA[kod] ?? { label: "Tidak Diketahui", ikon: "cloud" };
}

// ------------------------------------------------------------
// Tahap IPU (Indeks Pencemaran Udara) - standard rasmi DOE Malaysia
// ------------------------------------------------------------
export type TahapIPU =
  | "baik"
  | "sederhana"
  | "tidak-sihat"
  | "sangat-tidak-sihat"
  | "berbahaya"
  | "tiada";

export interface InfoTahapIPU {
  label: string;
  min: number;
  max: number;
  /** Warna utama tahap (hex) */
  warna: string;
  /** Warna teks yang sesuai di atas latar warna tahap */
  warnaTeks: string;
  /** Warna lembut untuk latar badge (rgba) */
  warnaLatar: string;
}

// Warna rasmi ikut klasifikasi APIMS DOE: hijau / biru / kuning / oren / merah
// (dilaraskan sedikit supaya lebih selesa di mata namun masih jelas maksudnya)
export const TAHAP_IPU: Record<Exclude<TahapIPU, "tiada">, InfoTahapIPU> = {
  baik: {
    label: "Baik",
    min: 0,
    max: 50,
    warna: "#2E9E5B",
    warnaTeks: "#FFFFFF",
    warnaLatar: "rgba(46,158,91,0.14)",
  },
  sederhana: {
    label: "Sederhana",
    min: 51,
    max: 100,
    warna: "#3D7FC1",
    warnaTeks: "#FFFFFF",
    warnaLatar: "rgba(61,127,193,0.14)",
  },
  "tidak-sihat": {
    label: "Tidak Sihat",
    min: 101,
    max: 200,
    warna: "#D9A514",
    warnaTeks: "#3D2E05",
    warnaLatar: "rgba(217,165,20,0.16)",
  },
  "sangat-tidak-sihat": {
    label: "Sangat Tidak Sihat",
    min: 201,
    max: 300,
    warna: "#E0722F",
    warnaTeks: "#FFFFFF",
    warnaLatar: "rgba(224,114,47,0.15)",
  },
  berbahaya: {
    label: "Berbahaya",
    min: 301,
    max: 500,
    warna: "#C93B3B",
    warnaTeks: "#FFFFFF",
    warnaLatar: "rgba(201,59,59,0.14)",
  },
};

export const SUSUNAN_TAHAP: Exclude<TahapIPU, "tiada">[] = [
  "baik",
  "sederhana",
  "tidak-sihat",
  "sangat-tidak-sihat",
  "berbahaya",
];

// ------------------------------------------------------------
// Gaya kad penuh mengikut tahap IPU - keseluruhan latar kad
// mengambil warna tahap dengan teks berkontras selesa di mata
// ------------------------------------------------------------
export interface GayaKadTahap {
  /** Warna latar kad penuh */
  latar: string;
  /** Warna bingkai kad */
  bingkai: string;
  /** Warna teks utama (tajuk, nilai besar) */
  teks: string;
  /** Warna teks kurang penting */
  kurang: string;
  /** Warna sub-tajuk uppercase */
  sub: string;
  /** Latar tile dalaman */
  tile: string;
  /** Latar badge tahap (terbalik supaya jelas) */
  chipLatar: string;
  /** Warna teks badge tahap */
  chipTeks: string;
}

export const GAYA_KAD: Record<Exclude<TahapIPU, "tiada">, GayaKadTahap> = {
  baik: {
    latar: "rgba(46,158,91,0.88)",
    bingkai: "rgba(255,255,255,0.5)",
    teks: "#FFFFFF",
    kurang: "rgba(255,255,255,0.8)",
    sub: "rgba(255,255,255,0.92)",
    tile: "rgba(255,255,255,0.25)",
    chipLatar: "rgba(255,255,255,0.92)",
    chipTeks: "#1E7A43",
  },
  sederhana: {
    latar: "rgba(61,127,193,0.88)",
    bingkai: "rgba(255,255,255,0.5)",
    teks: "#FFFFFF",
    kurang: "rgba(255,255,255,0.8)",
    sub: "rgba(255,255,255,0.92)",
    tile: "rgba(255,255,255,0.25)",
    chipLatar: "rgba(255,255,255,0.92)",
    chipTeks: "#2A6398",
  },
  "tidak-sihat": {
    latar: "rgba(233,197,74,0.92)",
    bingkai: "rgba(255,255,255,0.6)",
    teks: "#3F2D05",
    kurang: "rgba(63,45,5,0.72)",
    sub: "#7A5E10",
    tile: "rgba(255,255,255,0.45)",
    chipLatar: "rgba(255,255,255,0.88)",
    chipTeks: "#8F6F08",
  },
  "sangat-tidak-sihat": {
    latar: "rgba(224,114,47,0.9)",
    bingkai: "rgba(255,255,255,0.5)",
    teks: "#FFFFFF",
    kurang: "rgba(255,255,255,0.82)",
    sub: "rgba(255,255,255,0.94)",
    tile: "rgba(255,255,255,0.25)",
    chipLatar: "rgba(255,255,255,0.92)",
    chipTeks: "#B4501A",
  },
  berbahaya: {
    latar: "rgba(201,59,59,0.9)",
    bingkai: "rgba(255,255,255,0.5)",
    teks: "#FFFFFF",
    kurang: "rgba(255,255,255,0.82)",
    sub: "rgba(255,255,255,0.94)",
    tile: "rgba(255,255,255,0.25)",
    chipLatar: "rgba(255,255,255,0.92)",
    chipTeks: "#A62E2E",
  },
};

export function tahapDariNilai(nilai: number | null | undefined): TahapIPU {
  if (nilai == null || Number.isNaN(nilai)) return "tiada";
  const n = Math.round(nilai);
  if (n <= 50) return "baik";
  if (n <= 100) return "sederhana";
  if (n <= 200) return "tidak-sihat";
  if (n <= 300) return "sangat-tidak-sihat";
  return "berbahaya";
}

export function infoTahap(tahap: TahapIPU): InfoTahapIPU | null {
  if (tahap === "tiada") return null;
  return TAHAP_IPU[tahap];
}

// Pemetaan label kelas Inggeris APIMS -> Bahasa Melayu
export function kelasKeBM(kelas: string | null | undefined): string | null {
  if (!kelas) return null;
  const k = kelas.trim().toLowerCase();
  if (k === "good") return "Baik";
  if (k === "moderate") return "Sederhana";
  if (k === "unhealthy") return "Tidak Sihat";
  if (k === "very unhealthy") return "Sangat Tidak Sihat";
  if (k === "hazardous") return "Berbahaya";
  return null;
}

// Pencemar dominan (PARAM_SYMBOL APIMS)
export function peneranganPencemar(sym: string | null | undefined): string | null {
  if (!sym) return null;
  const s = sym.trim().toUpperCase();
  if (s === "**" || s === "" || s === "NA" || s === "N/A") return null;
  const map: Record<string, string> = {
    PM25: "PM2.5",
    PM10: "PM10",
    O3: "Ozon (O3)",
    CO: "Karbon Monoksida (CO)",
    SO2: "Sulfur Dioksida (SO2)",
    NO2: "Nitrogen Dioksida (NO2)",
  };
  return map[s] ?? s;
}

// ------------------------------------------------------------
// Negeri pilihan (2 sahaja): Perak & Selangor.
// Koordinat = ibu negeri (untuk cuaca sebenar Open-Meteo).
// idApims = nilai STATE_NAME dalam API APIMS DOE.
// ------------------------------------------------------------
export interface Negeri {
  id: string;
  nama: string;
  idApims: string;
  ibu: string;
  lat: number;
  lon: number;
}

export const NEGERI_PILIHAN: Negeri[] = [
  { id: "perak", nama: "Perak", idApims: "PERAK", ibu: "Ipoh", lat: 4.5975, lon: 101.0901 },
  { id: "selangor", nama: "Selangor", idApims: "SELANGOR", ibu: "Shah Alam", lat: 3.0738, lon: 101.5183 },
];

export function negeriById(id: string): Negeri {
  return NEGERI_PILIHAN.find((n) => n.id === id) ?? NEGERI_PILIHAN[0];
}

// ------------------------------------------------------------
// Pemetaan stesen APIMS DOE -> daerah (kunci = STATION_ID).
// Digunakan untuk memaparkan jerebu mengikut daerah sebenar.
// ------------------------------------------------------------
export interface InfoStesenDaerah {
  daerah: string;
  tempat: string;
}

export const DAERAH_STESEN: Record<string, InfoStesenDaerah> = {
  // Perak
  CA10A: { daerah: "Larut, Matang dan Selama", tempat: "Taiping" },
  CA11A: { daerah: "Kinta", tempat: "Tasek Ipoh" },
  CA12A: { daerah: "Kinta", tempat: "Pegoh, Ipoh" },
  CA13A: { daerah: "Manjung", tempat: "Seri Manjung" },
  CA14A: { daerah: "Muallim", tempat: "Tanjung Malim" },
  // Selangor
  CA18B: { daerah: "Kuala Selangor", tempat: "Kuala Selangor" },
  CA19B: { daerah: "Petaling", tempat: "Petaling Jaya" },
  CA20B: { daerah: "Petaling", tempat: "Shah Alam" },
  CA21B: { daerah: "Klang", tempat: "Klang" },
  CA22B: { daerah: "Kuala Langat", tempat: "Banting" },
  MCAQM001: { daerah: "Klang", tempat: "Johan Setia" },
};

// ------------------------------------------------------------
// Format masa Bahasa Melayu (sentiasa zon Asia/Kuala_Lumpur,
// tidak terjejas zon masa peranti pengguna)
// ------------------------------------------------------------
const ZON_MY = "Asia/Kuala_Lumpur";

function bahagianZonMY(iso: string): { hari: number; tarikh: number; bulan: number; jam: number; minit: number } {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZON_MY,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const ambil = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const hariShort = parts.find((p) => p.type === "weekday")?.value ?? "";
  const petaHari: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hari: petaHari[hariShort] ?? d.getDay(),
    tarikh: ambil("day"),
    bulan: ambil("month"),
    jam: ambil("hour") % 24,
    minit: ambil("minute"),
  };
}

export function formatJam(iso: string): string {
  const b = bahagianZonMY(iso);
  return `${String(b.jam).padStart(2, "0")}.${String(b.minit).padStart(2, "0")}`;
}
