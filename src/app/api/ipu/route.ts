import { NextResponse } from "next/server";

// ============================================================
// /api/ipu - Proksi data Indeks Pencemaran Udara (IPU) masa nyata
// daripada sistem APIMS rasmi Jabatan Alam Sekitar (DOE) Malaysia.
// Termasuk cache dalam memori supaya server DOE tidak dibebani.
// ============================================================

export const dynamic = "force-dynamic";

const BASE_APIMS = "https://eqms.doe.gov.my/api3/publicportalapims";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minit

interface StesenMentah {
  ID: number;
  STATE_ID: number;
  STATE_NAME: string;
  STATION_STATUS: number;
  STATION_ID: string;
  STATION_LOCATION: string;
  LONGITUDE: number;
  LATITUDE: number;
  API: number | null;
  PARAM_SYMBOL: string | null;
  CLASS: string | null;
  RECORD_DT: string | null;
}

export interface StesenIPU {
  id: string;
  lokasi: string;
  negeri: string;
  stateId: number;
  lat: number;
  lon: number;
  ipu: number | null;
  pencemar: string | null;
  kelas: string | null;
  masaBacaan: string | null;
}

interface CacheEntri {
  masa: number;
  data: unknown;
}

const cache = new Map<string, CacheEntri>();

async function denganCache<T>(
  kunci: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const ada = cache.get(kunci);
  if (ada && Date.now() - ada.masa < CACHE_TTL_MS) {
    return ada.data as T;
  }
  const data = await fetcher();
  cache.set(kunci, { masa: Date.now(), data });
  return data;
}

async function fetchJSON<T>(url: string, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`APIMS HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Tambah offset +08:00 pada masa tempatan Malaysia yang naif.
 *  Rentetan tarikh sahaja (YYYY-MM-DD) ditambah masa T00:00:00 supaya sah di-parse. */
function isoMY(naif: string | null): string | null {
  if (!naif) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(naif)) return `${naif}T00:00:00+08:00`;
  return naif.endsWith("Z") || naif.includes("+") ? naif : `${naif}+08:00`;
}

function petakanStesen(s: StesenMentah): StesenIPU {
  return {
    id: s.STATION_ID,
    lokasi: s.STATION_LOCATION ?? "",
    negeri: s.STATE_NAME ?? "",
    stateId: s.STATE_ID,
    lat: s.LATITUDE,
    lon: s.LONGITUDE,
    ipu: s.API != null && !Number.isNaN(Number(s.API)) ? Number(s.API) : null,
    pencemar: s.PARAM_SYMBOL ?? null,
    kelas: s.CLASS ?? null,
    masaBacaan: isoMY(s.RECORD_DT),
  };
}

export async function GET() {
  try {
    const { mapcaqm } = await denganCache("utama", async () => {
      const mapRes = await fetchJSON<{ data: StesenMentah[] }>(
        `${BASE_APIMS}/mapcaqm`,
      );
      return { mapcaqm: mapRes };
    });

    const stations = (mapcaqm.data ?? []).map(petakanStesen);

    // Kedudukan IPU TERTINGGI sebenar: isih semua stesen menurun
    // mengikut bacaan (yang paling tidak sihat/berbahaya di atas)
    const ranking = stations
      .filter((s) => s.ipu != null)
      .sort((a, b) => (b.ipu ?? 0) - (a.ipu ?? 0))
      .slice(0, 5)
      .map((s) => ({
        stesen: s.id,
        lokasi: s.lokasi,
        negeri: s.negeri,
        ipu: s.ipu as number,
        pencemar: s.pencemar,
        kelas: s.kelas,
      }));

    return NextResponse.json(
      {
        ok: true,
        sumber: "APIMS - Jabatan Alam Sekitar (DOE) Malaysia",
        updatedAt: new Date().toISOString(),
        stations,
        ranking,
      },
      { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" } },
    );
  } catch (err) {
    const mesej = err instanceof Error ? err.message : "Ralat tidak diketahui";
    return NextResponse.json(
      { ok: false, ralat: `Gagal mendapatkan data IPU: ${mesej}` },
      { status: 502 },
    );
  }
}
