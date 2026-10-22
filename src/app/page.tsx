"use client";

// ============================================================
// Sistem Cuaca & IPU Malaysia - Halaman tunggal
// Data sebenar: APIMS DOE Malaysia (IPU/jerebu) + Open-Meteo (cuaca)
// Reka bentuk: gradien senja oren lembut, kontras mesra mata,
// responsive mobile-first.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  RefreshCw,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Thermometer,
  SunDim,
  Gauge,
  RotateCw,
} from "lucide-react";

import {
  LOKASI,
  GAYA_KAD,
  infoKodCuaca,
  infoTahap,
  jarakKm,
  kelasKeBM,
  lokasiById,
  peneranganPencemar,
  tahapDariNilai,
  formatHari,
  formatJam,
  formatTarikhPendek,
  type TahapIPU,
} from "@/lib/cuaca";
import {
  IkonCuaca,
  SkalaIPU,
  KadSkeleton,
  KadRalat,
  Kerangka,
  WARNA_NILAI_KAD,
} from "@/components/panel-cuaca";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ------------------------------------------------------------
// Jenis data daripada API dalaman
// ------------------------------------------------------------
interface StesenKlien {
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

interface ResponIPU {
  ok: boolean;
  updatedAt: string;
  stations: StesenKlien[];
  ranking: {
    stesen: string;
    lokasi: string;
    negeri: string;
    ipu: number;
    pencemar: string | null;
    kelas: string | null;
  }[];
  ralat?: string;
}

interface HariCuaca {
  tarikh: string;
  kod: number | null;
  tMaks: number | null;
  tMin: number | null;
  hujan: number | null;
  hujanMm: number | null;
  matahariTerbit: string;
  matahariTerbenam: string;
  uvMaks: number | null;
}

interface ResponCuaca {
  ok: boolean;
  updatedAt: string;
  current: {
    masa: string;
    suhu: number | null;
    rasa: number | null;
    kelembapan: number | null;
    kod: number | null;
    siang: boolean;
    angin: number | null;
  };
  daily: HariCuaca[];
  hourly: { masa: string; suhu: number | null; kod: number | null; hujan: number | null }[];
  ralat?: string;
}

const SELANG_AUTO = 10 * 60 * 1000; // 10 minit

export default function HalamanCuaca() {
  const [locId, setLocId] = useState("kl");
  const lokasi = lokasiById(locId);

  const [dataIPU, setDataIPU] = useState<ResponIPU | null>(null);
  const [dataCuaca, setDataCuaca] = useState<ResponCuaca | null>(null);
  const [muatIPU, setMuatIPU] = useState(true);
  const [muatCuaca, setMuatCuaca] = useState(true);
  const [ralatIPU, setRalatIPU] = useState<string | null>(null);
  const [ralatCuaca, setRalatCuaca] = useState<string | null>(null);
  const [segarkan, setSegarkan] = useState(false);
  const [masaKemasKini, setMasaKemasKini] = useState<string | null>(null);
  const pertamaKali = useRef(true);

  // ---------- pemuatan data ----------
  const muatIPUSekarang = useCallback(async (senyap = false) => {
    if (!senyap) setMuatIPU(true);
    setRalatIPU(null);
    try {
      const res = await fetch("/api/ipu", { cache: "no-store" });
      const json = (await res.json()) as ResponIPU;
      if (!res.ok || !json.ok) throw new Error(json.ralat ?? "HTTP ralat");
      setDataIPU(json);
      setMasaKemasKini(json.updatedAt);
    } catch (e) {
      setRalatIPU(e instanceof Error ? e.message : "Gagal memuatkan data IPU");
    } finally {
      setMuatIPU(false);
    }
  }, []);

  const muatCuacaSekarang = useCallback(
    async (senyap = false) => {
      if (!senyap) setMuatCuaca(true);
      setRalatCuaca(null);
      try {
        const res = await fetch(`/api/weather?lat=${lokasi.lat}&lon=${lokasi.lon}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as ResponCuaca;
        if (!res.ok || !json.ok) throw new Error(json.ralat ?? "HTTP ralat");
        setDataCuaca(json);
      } catch (e) {
        setRalatCuaca(e instanceof Error ? e.message : "Gagal memuatkan data cuaca");
      } finally {
        setMuatCuaca(false);
      }
    },
    [lokasi.lat, lokasi.lon],
  );

  // Muat apabila lokasi bertukar
  useEffect(() => {
    muatIPUSekarang();
    muatCuacaSekarang();
  }, [muatIPUSekarang, muatCuacaSekarang]);

  // Auto segar setiap 10 minit
  useEffect(() => {
    const t = setInterval(() => {
      muatIPUSekarang(true);
      muatCuacaSekarang(true);
    }, SELANG_AUTO);
    return () => clearInterval(t);
  }, [muatIPUSekarang, muatCuacaSekarang]);

  // Butang segarkan manual
  const padaSegarkan = useCallback(async () => {
    setSegarkan(true);
    await Promise.all([muatIPUSekarang(true), muatCuacaSekarang(true)]);
    setTimeout(() => setSegarkan(false), 600);
  }, [muatIPUSekarang, muatCuacaSekarang]);

  // ---------- stesen IPU terdekat ----------
  const stesenTerdekat = useMemo<StesenKlien | null>(() => {
    const senarai = dataIPU?.stations ?? [];
    if (senarai.length === 0) return null;
    const sah = senarai.filter((s) => s.ipu != null);
    const kolam = sah.length > 0 ? sah : senarai;
    let terbaik = kolam[0];
    let terkecil = Infinity;
    for (const s of kolam) {
      const d = jarakKm(lokasi.lat, lokasi.lon, s.lat, s.lon);
      if (d < terkecil) {
        terkecil = d;
        terbaik = s;
      }
    }
    return terbaik;
  }, [dataIPU, lokasi.lat, lokasi.lon]);

  // ---------- nilai terbitan ----------
  const nilaiIPU = stesenTerdekat?.ipu ?? null;
  const tahap: TahapIPU = tahapDariNilai(nilaiIPU);
  const info = infoTahap(tahap);
  // Gaya kad penuh ikut tahap (kuning bila Tidak Sihat, biru bila Sederhana, dll.)
  const gaya = tahap !== "tiada" ? GAYA_KAD[tahap as Exclude<TahapIPU, "tiada">] : null;
  const warnaNilai =
    tahap !== "tiada" ? WARNA_NILAI_KAD[tahap as Exclude<TahapIPU, "tiada">] : "#8D8378";

  const kelasBM = kelasKeBM(stesenTerdekat?.kelas ?? null);
  const labelTahap = info?.label ?? kelasBM ?? "Tiada Bacaan";

  const cuacaSekarang = dataCuaca?.current ?? null;
  const infoCuacaSekarang = infoKodCuaca(cuacaSekarang?.kod);
  const hariIni = dataCuaca?.daily?.[0] ?? null;

  const anim = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  });

  return (
    <div
      className="relative min-h-screen w-full overflow-x-clip"
      style={{
        background:
          "linear-gradient(168deg, #FFF4E3 0%, #FFE8CC 34%, #FFD8B2 62%, #FFC48E 88%, #FBB878 100%)",
      }}
    >
      {/* Hiasan latar lembut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full opacity-60 blur-3xl sm:h-96 sm:w-96"
          style={{ background: "radial-gradient(circle, #FFD9A8 0%, rgba(255,217,168,0) 70%)" }}
        />
        <div
          className="absolute bottom-[-8%] left-[-12%] h-80 w-80 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #FFE9C9 0%, rgba(255,233,201,0) 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-6 sm:max-w-xl sm:px-6 lg:max-w-5xl lg:px-8">
        {/* ================= HEADER ================= */}
        <motion.header {...anim(0)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B0723A]">
              Malaysia · Masa Nyata
            </p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight text-[#45220D] sm:text-3xl">
              Cuaca &amp; Jerebu
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-[228px]">
              <MapPin
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#B0723A]"
                aria-hidden="true"
              />
              <Select value={locId} onValueChange={setLocId}>
                <SelectTrigger
                  aria-label="Pilih lokasi"
                  className="h-11 w-full rounded-full border-white/70 bg-white/60 pl-9 pr-3 text-[15px] font-semibold text-[#45220D] shadow-sm backdrop-blur-xl focus:ring-2 focus:ring-[#E89A1D]/50 data-[placeholder]:text-[#9A7350]"
                >
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl border-white/70 bg-white/95 backdrop-blur-xl">
                  {LOKASI.map((l) => (
                    <SelectItem
                      key={l.id}
                      value={l.id}
                      textValue={l.nama}
                      className="rounded-xl text-[15px] text-[#45220D] focus:bg-[#FFE8CC] data-[highlighted]:bg-[#FFE8CC]"
                    >
                      {l.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={padaSegarkan}
              aria-label="Segarkan data sekarang"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#B0723A] shadow-sm backdrop-blur-xl transition hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B0723A] active:scale-95"
            >
              <RefreshCw size={18} className={segarkan ? "animate-spin" : ""} aria-hidden="true" />
            </button>
          </div>
        </motion.header>

        {/* ================= KANDUNGAN UTAMA ================= */}
        <main className="mt-4 grid flex-1 grid-cols-1 gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          {/* ---------- Kolum kiri: IPU + cuaca semasa + jam ---------- */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* ============ KAD IPU ============ */}
            <motion.section {...anim(0.05)} aria-label="Indeks Pencemaran Udara">
              <div
                className="rounded-[28px] border p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl transition-colors duration-500 sm:p-6"
                style={{
                  backgroundColor: gaya?.latar ?? "rgba(255,255,255,0.6)",
                  borderColor: gaya?.bingkai ?? "rgba(255,255,255,0.7)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: gaya?.sub ?? "#B0723A" }}
                    >
                      <Gauge size={14} aria-hidden="true" /> Bacaan IPU
                    </p>
                    <p
                      className="mt-1 truncate text-xl font-bold"
                      style={{ color: gaya?.teks ?? "#45220D" }}
                    >
                      {lokasi.nama}
                    </p>
                    <p className="text-xs" style={{ color: gaya?.kurang ?? "#9A7350" }}>
                      {stesenTerdekat
                        ? `Stesen ${stesenTerdekat.id} · ${stesenTerdekat.lokasi}`
                        : "Mencari stesen terdekat…"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm"
                    style={
                      gaya
                        ? { backgroundColor: gaya.chipLatar, color: gaya.chipTeks }
                        : { backgroundColor: "rgba(141,131,120,0.2)", color: "#6B5E52" }
                    }
                  >
                    {labelTahap}
                  </span>
                </div>

                {muatIPU && !dataIPU ? (
                  <KadSkeleton tinggi="h-40" />
                ) : ralatIPU ? (
                  <div className="mt-4">
                    <KadRalat mesej={ralatIPU} onCubaSemula={() => muatIPUSekarang()} />
                  </div>
                ) : (
                  <>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div className="flex items-end gap-2.5">
                        <span
                          className="text-[68px] font-bold leading-none tracking-tight sm:text-[76px]"
                          style={{ color: gaya?.teks ?? warnaNilai }}
                        >
                          {nilaiIPU ?? "--"}
                        </span>
                        <span
                          className="pb-2.5 text-sm font-semibold"
                          style={{ color: gaya?.kurang ?? "#9A7350" }}
                        >
                          IPU
                        </span>
                      </div>
                      <div
                        className="pb-2 text-right text-[11.5px] leading-snug"
                        style={{ color: gaya?.kurang ?? "#9A7350" }}
                      >
                        {stesenTerdekat?.masaBacaan && (
                          <p>
                            Bacaan jam{" "}
                            <b style={{ color: gaya?.teks ?? "#7A4A28" }}>
                              {formatJam(stesenTerdekat.masaBacaan)}
                            </b>
                          </p>
                        )}
                        {peneranganPencemar(stesenTerdekat?.pencemar) ? (
                          <p>
                            Dominan:{" "}
                            <b style={{ color: gaya?.teks ?? "#7A4A28" }}>
                              {peneranganPencemar(stesenTerdekat?.pencemar)}
                            </b>
                          </p>
                        ) : (
                          <p>Tiada pencemar dominan</p>
                        )}
                      </div>
                    </div>

                    <SkalaIPU
                      nilai={nilaiIPU}
                      warnaLabel={gaya?.teks}
                      warnaJulat={gaya?.kurang}
                    />
                  </>
                )}
              </div>
            </motion.section>

            {/* ============ CUACA SEMASA ============ */}
            <motion.section {...anim(0.1)} aria-label="Cuaca semasa">
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                  <Thermometer size={14} aria-hidden="true" /> Cuaca Sekarang
                </p>
                {muatCuaca && !dataCuaca ? (
                  <KadSkeleton tinggi="h-40" />
                ) : ralatCuaca ? (
                  <div className="mt-4">
                    <KadRalat mesej={ralatCuaca} onCubaSemula={() => muatCuacaSekarang()} />
                  </div>
                ) : (
                  <>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[52px] font-bold leading-none tracking-tight text-[#45220D]">
                          {cuacaSekarang?.suhu != null
                            ? Math.round(cuacaSekarang.suhu)
                            : "--"}
                          °C
                        </p>
                        <p className="mt-1.5 text-[15px] font-semibold text-[#7A4A28]">
                          {infoCuacaSekarang.label}
                        </p>
                        <p className="text-xs text-[#9A7350]">
                          Rasa seperti{" "}
                          {cuacaSekarang?.rasa != null
                            ? `${Math.round(cuacaSekarang.rasa)}°`
                            : "--"}
                          ° · {cuacaSekarang?.siang ? "Siang" : "Malam"}
                        </p>
                      </div>
                      <IkonCuaca ikon={infoCuacaSekarang.ikon} size={84} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        {
                          ikon: <Droplets size={15} aria-hidden="true" />,
                          label: "Kelembapan",
                          nilai:
                            cuacaSekarang?.kelembapan != null
                              ? `${Math.round(cuacaSekarang.kelembapan)}%`
                              : "--",
                        },
                        {
                          ikon: <Wind size={15} aria-hidden="true" />,
                          label: "Angin",
                          nilai:
                            cuacaSekarang?.angin != null
                              ? `${Math.round(cuacaSekarang.angin)} km/j`
                              : "--",
                        },
                        {
                          ikon: <SunDim size={15} aria-hidden="true" />,
                          label: "UV Maks",
                          nilai:
                            hariIni?.uvMaks != null ? `${Math.round(hariIni.uvMaks)}` : "--",
                        },
                        {
                          ikon: <Droplets size={15} aria-hidden="true" />,
                          label: "Peluang Hujan",
                          nilai: hariIni?.hujan != null ? `${hariIni.hujan}%` : "--",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-2xl border border-white/60 bg-white/55 px-3 py-2.5"
                        >
                          <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#9A7350]">
                            {s.ikon}
                            {s.label}
                          </p>
                          <p className="mt-0.5 text-[15px] font-bold text-[#45220D]">
                            {s.nilai}
                          </p>
                        </div>
                      ))}
                    </div>

                    {hariIni && (
                      <div className="mt-3 flex items-center justify-between text-xs font-medium text-[#9A7350]">
                        <span className="flex items-center gap-1.5">
                          <Sunrise size={14} className="text-[#E89A1D]" aria-hidden="true" />
                          Terbit {formatJam(hariIni.matahariTerbit)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Sunset size={14} className="text-[#C96F2E]" aria-hidden="true" />
                          Terbenam {formatJam(hariIni.matahariTerbenam)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.section>

            {/* ============ JAM-HARIAN (12 JAM) ============ */}
            <motion.section {...anim(0.15)} aria-label="Ramalan jam-harian">
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                  12 Jam Akan Datang
                </p>
                {muatCuaca && !dataCuaca ? (
                  <div className="mt-3 flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Kerangka key={i} className="h-[86px] w-16 shrink-0 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="scrollbar-lembut -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                    {(dataCuaca?.hourly ?? []).map((h) => {
                      const infoH = infoKodCuaca(h.kod);
                      return (
                        <div
                          key={h.masa}
                          className="flex w-[66px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-white/60 bg-white/55 py-3"
                        >
                          <p className="text-[11px] font-semibold text-[#9A7350]">
                            {formatJam(h.masa)}
                          </p>
                          <IkonCuaca ikon={infoH.ikon} size={24} />
                          <p className="text-[14px] font-bold text-[#45220D]">
                            {h.suhu != null ? Math.round(h.suhu) : "--"}°
                          </p>
                          <p className="flex items-center gap-0.5 text-[10px] text-[#7C8FA5]">
                            <Droplets size={9} aria-hidden="true" />
                            {h.hujan != null ? `${h.hujan}%` : "--"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* ---------- Kolum kanan: ramalan 7 hari + kedudukan ---------- */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* ============ RAMALAN 7 HARI ============ */}
            <motion.section {...anim(0.2)} aria-label="Ramalan cuaca 7 hari">
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                  Ramalan 7 Hari · {lokasi.nama}
                </p>
                {muatCuaca && !dataCuaca ? (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Kerangka key={i} className="h-[58px] w-full rounded-[22px]" />
                    ))}
                  </div>
                ) : ralatCuaca ? (
                  <div className="mt-4">
                    <KadRalat mesej={ralatCuaca} onCubaSemula={() => muatCuacaSekarang()} />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {(dataCuaca?.daily ?? []).map((h, i) => {
                      const infoH = infoKodCuaca(h.kod);
                      const labelHari = i === 0 ? "Hari Ini" : formatHari(h.tarikh);
                      return (
                        <div
                          key={h.tarikh}
                          className="flex items-center justify-between gap-2 rounded-[22px] border border-white/60 bg-white/55 px-4 py-3 transition-colors hover:bg-white/80"
                        >
                          <div className="w-[96px] shrink-0">
                            <p className="text-[15px] font-bold text-[#45220D]">{labelHari}</p>
                            <p className="text-[11px] font-medium text-[#9A7350]">
                              {formatTarikhPendek(h.tarikh)}
                            </p>
                          </div>
                          <div className="hidden min-w-0 flex-1 truncate text-right text-[11.5px] font-medium text-[#9A7350] sm:block">
                            {infoH.label}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <p className="flex items-center gap-0.5 text-[12px] font-medium text-[#7C8FA5]">
                              <Droplets size={11} aria-hidden="true" />
                              {h.hujan != null ? `${h.hujan}%` : "--"}
                            </p>
                            <p className="text-[15px]">
                              <span className="font-medium text-[#9A7350]">
                                {h.tMin != null ? Math.round(h.tMin) : "--"}°
                              </span>{" "}
                              <span className="font-bold text-[#45220D]">
                                {h.tMaks != null ? Math.round(h.tMaks) : "--"}°
                              </span>
                            </p>
                            <IkonCuaca ikon={infoH.ikon} size={30} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3.5 text-center text-[10.5px] text-[#A98A6C]">
                  Data ramalan sebenar · Open-Meteo · zon Asia/Kuala_Lumpur
                </p>
              </div>
            </motion.section>

            {/* ============ KEDUDUKAN IPU TERTINGGI ============ */}
            <motion.section {...anim(0.25)} aria-label="Kedudukan IPU tertinggi di Malaysia">
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                  IPU Tertinggi di Malaysia
                </p>
                {muatIPU && !dataIPU ? (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Kerangka key={i} className="h-10 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    {(dataIPU?.ranking?.length ?? 0) > 0 ? (
                      <div className="mt-4 flex flex-col gap-2">
                        {(dataIPU?.ranking ?? []).slice(0, 5).map((r, i) => {
                          const t = tahapDariNilai(r.ipu);
                          const infoR = infoTahap(t);
                          return (
                            <div
                              key={r.stesen}
                              className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/55 px-3.5 py-2.5"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFE8CC] text-[12px] font-bold text-[#B0723A]">
                                {i + 1}
                              </span>
                              <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#45220D]">
                                {r.lokasi}
                              </p>
                              <span
                                className="shrink-0 rounded-full px-3 py-1 text-[13px] font-bold"
                                style={
                                  infoR
                                    ? { backgroundColor: infoR.warna, color: infoR.warnaTeks }
                                    : { backgroundColor: "rgba(141,131,120,0.2)", color: "#6B5E52" }
                                }
                              >
                                {r.ipu}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#9A7350]">
                        Data kedudukan tidak tersedia buat masa ini.
                      </p>
                    )}

                    {dataIPU && (
                      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[#9A7350]">
                        <RotateCw size={11} aria-hidden="true" />
                        Bacaan tertinggi {formatJam(dataIPU.updatedAt)} · auto setiap 10 minit
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.section>
          </div>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="mt-8 pb-[env(safe-area-inset-bottom)]">
          <div className="rounded-[22px] border border-white/60 bg-white/45 px-5 py-4 text-center backdrop-blur-xl">
            <p className="text-[11.5px] leading-relaxed text-[#8A5A33]">
              Sumber data sebenar:{" "}
              <b className="font-semibold text-[#7A4A28]">APIMS · Jabatan Alam Sekitar (DOE) Malaysia</b>{" "}
              untuk Indeks Pencemaran Udara (IPU) &amp;{" "}
              <b className="font-semibold text-[#7A4A28]">Open-Meteo</b> untuk cuaca.
            </p>
            <p className="mt-1 text-[10.5px] text-[#A98A6C]">
              Bacaan IPU dikemas kini setiap jam oleh DOE · Rujukan rasmi: eqms.doe.gov.my ·
              {masaKemasKini && ` Kemas kini halaman ${formatJam(masaKemasKini)}`}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
