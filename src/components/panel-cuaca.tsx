"use client";

// ============================================================
// Komponen paparan kecil untuk sistem Cuaca & IPU.
// ============================================================

import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  Snowflake,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import type { IkonCuaca as JenisIkon } from "@/lib/cuaca";
import {
  SUSUNAN_TAHAP,
  TAHAP_IPU,
  tahapDariNilai,
  type TahapIPU,
} from "@/lib/cuaca";

// ------------------------------------------------------------
// Ikon cuaca dengan warna lembut selesa di mata
// ------------------------------------------------------------
const PETAKAN_WARNA_IKON: Record<JenisIkon, string> = {
  sun: "text-[#E89A1D]",
  "cloud-sun": "text-[#E89A1D]",
  cloud: "text-[#8D8378]",
  fog: "text-[#A79E93]",
  drizzle: "text-[#7C8FA5]",
  rain: "text-[#71869E]",
  "heavy-rain": "text-[#5F7489]",
  thunder: "text-[#5F7489]",
  snow: "text-[#7C8FA5]",
};

export function IkonCuaca({
  ikon,
  size = 28,
  className = "",
}: {
  ikon: JenisIkon;
  size?: number;
  className?: string;
}) {
  const peta: Record<JenisIkon, React.ReactNode> = {
    sun: <Sun size={size} strokeWidth={2.2} />,
    "cloud-sun": <CloudSun size={size} strokeWidth={2.2} />,
    cloud: <Cloud size={size} strokeWidth={2.2} />,
    fog: <CloudFog size={size} strokeWidth={2.2} />,
    drizzle: <CloudDrizzle size={size} strokeWidth={2.2} />,
    rain: <CloudRain size={size} strokeWidth={2.2} />,
    "heavy-rain": <CloudRainWind size={size} strokeWidth={2.2} />,
    thunder: <CloudLightning size={size} strokeWidth={2.2} />,
    snow: <Snowflake size={size} strokeWidth={2.2} />,
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${PETAKAN_WARNA_IKON[ikon]} ${className}`}
      aria-hidden="true"
    >
      {peta[ikon]}
    </span>
  );
}

// ------------------------------------------------------------
// Warna teks nilai IPU pada kad cerah (kontras mencukupi)
// ------------------------------------------------------------
export const WARNA_NILAI_KAD: Record<Exclude<TahapIPU, "tiada">, string> = {
  baik: "#1E7A43",
  sederhana: "#2A6398",
  "tidak-sihat": "#8F6F08",
  "sangat-tidak-sihat": "#B4501A",
  berbahaya: "#A62E2E",
};

// ------------------------------------------------------------
// Skala IPU 5 tahap dengan penanda bacaan semasa
// ------------------------------------------------------------
export function SkalaIPU({ nilai }: { nilai: number | null }) {
  const posisi =
    nilai == null
      ? null
      : Math.min(100, Math.max(0, (nilai / 500) * 100));
  const tahap = tahapDariNilai(nilai);

  return (
    <div className="mt-5">
      <div className="relative">
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {SUSUNAN_TAHAP.map((t) => (
            <div
              key={t}
              className="h-full flex-1"
              style={{ backgroundColor: TAHAP_IPU[t].warna }}
            />
          ))}
        </div>
        {posisi != null && (
          <div
            className="absolute -top-[5px] z-10 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${posisi}%` }}
          >
            <div
              className={`h-[22px] w-[22px] rounded-full border-[3px] border-white shadow-md ${
                tahap !== "tiada" ? "" : "bg-stone-400"
              }`}
              style={
                tahap !== "tiada"
                  ? { backgroundColor: TAHAP_IPU[tahap as Exclude<TahapIPU, "tiada">].warna }
                  : undefined
              }
              role="img"
              aria-label={`Penanda bacaan IPU pada skala: ${nilai}`}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex w-full">
        {SUSUNAN_TAHAP.map((t) => (
          <div key={t} className="flex-1 text-center">
            <p
              className="text-[9.5px] font-semibold leading-tight sm:text-[11px]"
              style={{ color: WARNA_NILAI_KAD[t] }}
            >
              {TAHAP_IPU[t].label}
            </p>
            <p className="text-[8.5px] text-[#9A7350] sm:text-[10px]">
              {TAHAP_IPU[t].min}–{TAHAP_IPU[t].max}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Graf garis kecil (sparkline) SVG untuk trend IPU 24 jam
// ------------------------------------------------------------
export function Sparkline({
  nilai,
  lebar = 300,
  tinggi = 64,
}: {
  nilai: (number | null)[];
  lebar?: number;
  tinggi?: number;
}) {
  const sah = nilai
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null && !Number.isNaN(p.v));
  if (sah.length < 2) return null;

  const maksV = Math.max(...sah.map((p) => p.v), 100);
  const minV = Math.min(...sah.map((p) => p.v), 0);
  const julat = Math.max(maksV - minV, 1);
  const pad = 6;

  const titik = sah.map((p) => {
    const x = pad + (p.i / (nilai.length - 1)) * (lebar - pad * 2);
    const y = tinggi - pad - ((p.v - minV) / julat) * (tinggi - pad * 2);
    return { x, y, v: p.v };
  });

  const garis = titik.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const luas = `M${titik[0].x.toFixed(1)},${tinggi - pad} L${garis.replace(/ /g, " L")} L${titik[titik.length - 1].x.toFixed(1)},${tinggi - pad} Z`;
  const terakhir = titik[titik.length - 1];
  const tahapAkhir = tahapDariNilai(terakhir.v);
  const warnaAkhir =
    tahapAkhir === "tiada"
      ? "#8D8378"
      : TAHAP_IPU[tahapAkhir as Exclude<TahapIPU, "tiada">].warna;

  const idGradien = `gradien-ipu-${Math.abs(terakhir.v)}-${titik.length}`;

  return (
    <svg
      viewBox={`0 0 ${lebar} ${tinggi}`}
      className="h-16 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Graf trend IPU 24 jam"
    >
      <defs>
        <linearGradient id={idGradien} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={warnaAkhir} stopOpacity="0.28" />
          <stop offset="100%" stopColor={warnaAkhir} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={luas} fill={`url(#${idGradien})`} />
      <polyline
        points={garis}
        fill="none"
        stroke={warnaAkhir}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={terakhir.x}
        cy={terakhir.y}
        r="4"
        fill={warnaAkhir}
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}

// ------------------------------------------------------------
// Skeleton semasa memuatkan
// ------------------------------------------------------------
export function Kerangka({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/50 ${className}`} />;
}

export function KadSkeleton({ tinggi = "h-40" }: { tinggi?: string }) {
  return (
    <div
      className={`rounded-[26px] border border-white/70 bg-white/40 p-6 ${tinggi}`}
      aria-hidden="true"
    >
      <Kerangka className="h-4 w-32" />
      <Kerangka className="mt-4 h-12 w-28" />
      <Kerangka className="mt-4 h-3 w-full" />
      <Kerangka className="mt-2 h-3 w-3/4" />
    </div>
  );
}

// ------------------------------------------------------------
// Kad ralat dengan butang cuba semula
// ------------------------------------------------------------
export function KadRalat({
  mesej,
  onCubaSemula,
}: {
  mesej: string;
  onCubaSemula: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[26px] border border-white/70 bg-white/60 p-6 text-center backdrop-blur-xl"
    >
      <AlertTriangle className="mx-auto text-[#B4501A]" size={30} aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-[#5C3A1E]">{mesej}</p>
      <button
        onClick={onCubaSemula}
        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[#B4501A] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#9A4415] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4501A]"
      >
        <RotateCw size={15} aria-hidden="true" />
        Cuba Semula
      </button>
    </div>
  );
}
