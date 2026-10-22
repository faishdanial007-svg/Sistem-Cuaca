import { NextRequest, NextResponse } from "next/server";

// ============================================================
// /api/weather - Proksi data cuaca Open-Meteo (percuma, tanpa kunci)
// untuk lokasi di Malaysia: cuaca semasa + ramalan 7 hari + jam-harian.
// Cache dalam memori 10 minit.
// ============================================================

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minit

interface CacheEntri {
  masa: number;
  data: unknown;
}

const cache = new Map<string, CacheEntri>();

async function denganCache<T>(kunci: string, fetcher: () => Promise<T>): Promise<T> {
  const ada = cache.get(kunci);
  if (ada && Date.now() - ada.masa < CACHE_TTL_MS) return ada.data as T;
  const data = await fetcher();
  cache.set(kunci, { masa: Date.now(), data });
  return data;
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    is_day?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
  };
}

/** Tambah offset +08:00 pada masa tempatan Malaysia yang naif.
 *  Rentetan tarikh sahaja (YYYY-MM-DD) ditambah masa T00:00:00 supaya sah di-parse. */
function isoMY(naif: string | undefined | null): string {
  if (!naif) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(naif)) return `${naif}T00:00:00+08:00`;
  return naif.endsWith("Z") || naif.includes("+") ? naif : `${naif}+08:00`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = sp.get("lat");
  const lon = sp.get("lon");

  if (!lat || !lon || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    return NextResponse.json(
      { ok: false, ralat: "Parameter lat & lon diperlukan" },
      { status: 400 },
    );
  }

  const kunci = `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&timezone=Asia%2FKuala_Lumpur&forecast_days=7`;

  try {
    const data = await denganCache(kunci, async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
        return (await res.json()) as OpenMeteoResponse;
      } finally {
        clearTimeout(timer);
      }
    });

    const c = data.current ?? {};

    // Slice 12 jam akan datang dari hourly
    const hourlyTime = data.hourly?.time ?? [];
    const idxSekarang = Math.max(
      0,
      hourlyTime.findIndex((t) => new Date(isoMY(t)).getTime() > Date.now() - 60 * 60 * 1000),
    );
    const potongan = (arr: (number | string | null)[] | undefined, offs: number) =>
      (arr ?? []).slice(offs, offs + 12);

    const hourly = hourlyTime.slice(idxSekarang, idxSekarang + 12).map((t, i) => ({
      masa: isoMY(t),
      suhu: potongan(data.hourly?.temperature_2m, idxSekarang)[i] ?? null,
      kod: potongan(data.hourly?.weather_code, idxSekarang)[i] ?? null,
      hujan: potongan(data.hourly?.precipitation_probability, idxSekarang)[i] ?? null,
    }));

    const daily = (data.daily?.time ?? []).map((t, i) => ({
      tarikh: isoMY(t),
      kod: data.daily?.weather_code?.[i] ?? null,
      tMaks: data.daily?.temperature_2m_max?.[i] ?? null,
      tMin: data.daily?.temperature_2m_min?.[i] ?? null,
      hujan: data.daily?.precipitation_probability_max?.[i] ?? null,
      hujanMm: data.daily?.precipitation_sum?.[i] ?? null,
      matahariTerbit: isoMY(data.daily?.sunrise?.[i]),
      matahariTerbenam: isoMY(data.daily?.sunset?.[i]),
      uvMaks: data.daily?.uv_index_max?.[i] ?? null,
    }));

    return NextResponse.json(
      {
        ok: true,
        sumber: "Open-Meteo",
        updatedAt: new Date().toISOString(),
        current: {
          masa: isoMY(c.time),
          suhu: c.temperature_2m ?? null,
          rasa: c.apparent_temperature ?? null,
        kelembapan: c.relative_humidity_2m ?? null,
          kod: c.weather_code ?? null,
          siang: c.is_day === 1,
          angin: c.wind_speed_10m ?? null,
        },
        daily,
        hourly,
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
    );
  } catch (err) {
    const mesej = err instanceof Error ? err.message : "Ralat tidak diketahui";
    return NextResponse.json(
      { ok: false, ralat: `Gagal mendapatkan data cuaca: ${mesej}` },
      { status: 502 },
    );
  }
}
