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
  /** Warna garis graf trend */
  garisGraf: string;
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
    garisGraf: "#FFFFFF",
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
    garisGraf: "#FFFFFF",
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
    garisGraf: "#3F2D05",
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
    garisGraf: "#FFFFFF",
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
    garisGraf: "#FFFFFF",
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
// Senarai lokasi utama Malaysia (lat/lon untuk cuaca Open-Meteo;
// stesen IPU dipilih secara automatik - stesen terdekat)
// ------------------------------------------------------------
export interface Lokasi {
  id: string;
  nama: string;
  negeri: string;
  lat: number;
  lon: number;
}

export const LOKASI: Lokasi[] = [
  { id: "kl", nama: "Kuala Lumpur", negeri: "W.P. Kuala Lumpur", lat: 3.139, lon: 101.6869 },
  { id: "putrajaya", nama: "Putrajaya", negeri: "W.P. Putrajaya", lat: 2.9264, lon: 101.6964 },
  { id: "shahalam", nama: "Shah Alam", negeri: "Selangor", lat: 3.0738, lon: 101.5183 },
  { id: "jb", nama: "Johor Bahru", negeri: "Johor", lat: 1.4927, lon: 103.7414 },
  { id: "melaka", nama: "Bandar Melaka", negeri: "Melaka", lat: 2.1896, lon: 102.2501 },
  { id: "seremban", nama: "Seremban", negeri: "Negeri Sembilan", lat: 2.7297, lon: 101.9381 },
  { id: "ipoh", nama: "Ipoh", negeri: "Perak", lat: 4.5975, lon: 101.0901 },
  { id: "penang", nama: "George Town", negeri: "Pulau Pinang", lat: 5.4141, lon: 100.3288 },
  { id: "langkawi", nama: "Langkawi", negeri: "Kedah", lat: 6.35, lon: 99.8 },
  { id: "alorsetar", nama: "Alor Setar", negeri: "Kedah", lat: 6.1248, lon: 100.3678 },
  { id: "kangar", nama: "Kangar", negeri: "Perlis", lat: 6.4299, lon: 100.2109 },
  { id: "kb", nama: "Kota Bharu", negeri: "Kelantan", lat: 6.1333, lon: 102.2386 },
  { id: "kt", nama: "Kuala Terengganu", negeri: "Terengganu", lat: 5.3297, lon: 103.1375 },
  { id: "kuantan", nama: "Kuantan", negeri: "Pahang", lat: 3.8121, lon: 103.3265 },
  { id: "kuching", nama: "Kuching", negeri: "Sarawak", lat: 1.5533, lon: 110.3592 },
  { id: "miri", nama: "Miri", negeri: "Sarawak", lat: 4.3995, lon: 113.9914 },
  { id: "kk", nama: "Kota Kinabalu", negeri: "Sabah", lat: 5.9804, lon: 116.0735 },
  { id: "sandakan", nama: "Sandakan", negeri: "Sabah", lat: 5.8402, lon: 118.1179 },
];

export function lokasiById(id: string): Lokasi {
  return LOKASI.find((l) => l.id === id) ?? LOKASI[0];
}

// Jarak haversine (km) - untuk cari stesen IPU terdekat
export function jarakKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ------------------------------------------------------------
// Format tarikh / masa Bahasa Melayu (sentiasa zon Asia/Kuala_Lumpur,
// tidak terjejas zon masa peranti pengguna)
// ------------------------------------------------------------
const ZON_MY = "Asia/Kuala_Lumpur";
const HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
const BULAN = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis",
];

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

export function formatHari(iso: string): string {
  return HARI[bahagianZonMY(iso).hari] ?? "—";
}

export function formatTarikhPendek(iso: string): string {
  const b = bahagianZonMY(iso);
  return `${b.tarikh} ${BULAN[b.bulan - 1] ?? ""}`;
}

export function formatJam(iso: string): string {
  const b = bahagianZonMY(iso);
  return `${String(b.jam).padStart(2, "0")}.${String(b.minit).padStart(2, "0")}`;
}
