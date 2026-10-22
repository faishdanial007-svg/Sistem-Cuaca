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
  LocateFixed,
} from "lucide-react";

import {
  NEGERI_PILIHAN,
  DAERAH_STESEN,
  GAYA_KAD,
  infoKodCuaca,
  infoTahap,
  jarakKm,
  negeriById,
  peneranganPencemar,
  tahapDariNilai,
  formatJam,
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

interface StesenDaerah {
  id: string;
  tempat: string;
  daerah: string;
  ipu: number | null;
  pencemar: string | null;
  masaBacaan: string | null;
}

interface KumpulanDaerah {
  daerah: string;
  stesen: StesenDaerah[];
  /** IPU tertinggi dalam daerah ini */
  maks: number; // -1 = tiada bacaan sah
  tahap: TahapIPU;
}

const SELANG_AUTO = 10 * 60 * 1000; // 10 minit

type StatusLokasi = "meminta" | "berjaya" | "gagal" | "tiada-sokongan";

export default function HalamanCuaca() {
  const [negeriId, setNegeriId] = useState("selangor");
  const negeri = negeriById(negeriId);

  const [dataIPU, setDataIPU] = useState<ResponIPU | null>(null);
  const [dataCuaca, setDataCuaca] = useState<ResponCuaca | null>(null);
  const [muatIPU, setMuatIPU] = useState(true);
  const [muatCuaca, setMuatCuaca] = useState(true);
  const [ralatIPU, setRalatIPU] = useState<string | null>(null);
  const [ralatCuaca, setRalatCuaca] = useState<string | null>(null);
  const [segarkan, setSegarkan] = useState(false);
  const [masaKemasKini, setMasaKemasKini] = useState<string | null>(null);

  // ---------- deteksi lokasi telefon pengguna (Geolocation API) ----------
  const [statusLokasi, setStatusLokasi] = useState<StatusLokasi | null>(null);
  const [lokasiPengguna, setLokasiPengguna] = useState<{ lat: number; lon: number } | null>(null);
  const refNegeriLokasi = useRef<string | null>(null);

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
        const res = await fetch(`/api/weather?lat=${negeri.lat}&lon=${negeri.lon}`, {
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
    [negeri.lat, negeri.lon],
  );

  // Muat apabila negeri bertukar
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

  // ---------- kesan lokasi telefon pengguna ----------
  const kesanLokasi = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusLokasi("tiada-sokongan");
      return;
    }
    setStatusLokasi("meminta");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasiPengguna({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatusLokasi("berjaya");
      },
      () => setStatusLokasi("gagal"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Kesan lokasi secara automatik sekali apabila halaman dibuka
  useEffect(() => {
    kesanLokasi();
  }, [kesanLokasi]);

  // ---------- kumpul stesen mengikut daerah bagi negeri terpilih ----------
  const kumpulanDaerah = useMemo<KumpulanDaerah[]>(() => {
    const senarai = (dataIPU?.stations ?? []).filter(
      (s) =>
        s.negeri.trim().toUpperCase() === negeri.idApims &&
        DAERAH_STESEN[s.id] != null,
    );
    const peta = new Map<string, StesenDaerah[]>();
    for (const s of senarai) {
      const info = DAERAH_STESEN[s.id];
      const senaraiDlm = peta.get(info.daerah) ?? [];
      senaraiDlm.push({
        id: s.id,
        tempat: info.tempat,
        daerah: info.daerah,
        ipu: s.ipu,
        pencemar: s.pencemar,
        masaBacaan: s.masaBacaan,
      });
      peta.set(info.daerah, senaraiDlm);
    }
    const kumpulan: KumpulanDaerah[] = [];
    for (const [daerah, stesen] of peta) {
      const nilaiSah = stesen
        .map((x) => x.ipu)
        .filter((v): v is number => v != null);
      const maks = nilaiSah.length > 0 ? Math.max(...nilaiSah) : -1;
      kumpulan.push({
        daerah,
        stesen: [...stesen].sort((a, b) => (b.ipu ?? -1) - (a.ipu ?? -1)),
        maks,
        tahap: tahapDariNilai(maks >= 0 ? maks : null),
      });
    }
    // Daerah paling teruk dahulu (berbahaya/tidak sihat di atas)
    return kumpulan.sort((a, b) => b.maks - a.maks);
  }, [dataIPU, negeri.idApims]);

  // ---------- stesen DOE paling hampir dengan lokasi telefon pengguna ----------
  const stesenTerdekat = useMemo<{ stesen: StesenKlien; jarak: number } | null>(() => {
    if (!lokasiPengguna || !dataIPU) return null;
    let terbaik: { stesen: StesenKlien; jarak: number } | null = null;
    for (const s of dataIPU.stations) {
      if (s.ipu == null || DAERAH_STESEN[s.id] == null) continue; // hanya stesen daerah Perak/Selangor
      const j = jarakKm(lokasiPengguna.lat, lokasiPengguna.lon, s.lat, s.lon);
      if (terbaik == null || j < terbaik.jarak) terbaik = { stesen: s, jarak: j };
    }
    return terbaik;
  }, [lokasiPengguna, dataIPU]);

  // Tukar negeri secara automatik mengikut lokasi pengguna (sekali bagi setiap deteksi)
  useEffect(() => {
    if (!stesenTerdekat) return;
    const id = NEGERI_PILIHAN.find(
      (n) => n.idApims === stesenTerdekat.stesen.negeri.trim().toUpperCase(),
    )?.id;
    if (id && refNegeriLokasi.current !== id) {
      refNegeriLokasi.current = id;
      setNegeriId(id);
    }
  }, [stesenTerdekat]);

  // ---------- nilai terbitan ----------
  const daerahTeruk = kumpulanDaerah.find((k) => k.maks >= 0) ?? null;
  const stesenTeruk = daerahTeruk?.stesen[0] ?? null;
  // Kad atas: keutamaan bacaan stesen paling hampir dengan lokasi telefon pengguna
  // (jika berjaya dikesan & stesen itu dalam negeri terpilih); jika tidak,
  // papar bacaan daerah paling teruk negeri terpilih.
  const stesenLokasi =
    statusLokasi === "berjaya" &&
    stesenTerdekat &&
    stesenTerdekat.stesen.negeri.trim().toUpperCase() === negeri.idApims
      ? stesenTerdekat.stesen
      : null;
  const daerahLokasi = stesenLokasi ? (DAERAH_STESEN[stesenLokasi.id] ?? null) : null;
  const nilaiIPU = stesenLokasi
    ? stesenLokasi.ipu
    : daerahTeruk && daerahTeruk.maks >= 0
      ? daerahTeruk.maks
      : null;
  const tahap: TahapIPU = tahapDariNilai(nilaiIPU);
  const info = infoTahap(tahap);
  // Gaya kad penuh ikut tahap (kuning bila Tidak Sihat, biru bila Sederhana, dll.)
  const gaya = tahap !== "tiada" ? GAYA_KAD[tahap as Exclude<TahapIPU, "tiada">] : null;
  const labelTahap = info?.label ?? "Tiada Bacaan";
  const bilDaerah = kumpulanDaerah.length;
  const bilTerjejas = kumpulanDaerah.filter((k) => k.maks > 50).length;
  const bilStesen = kumpulanDaerah.reduce((n, k) => n + k.stesen.length, 0);
  const fmtJarak = (km: number) => (km < 10 ? km.toFixed(1) : String(Math.round(km)));

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
              Perak &amp; Selangor · Masa Nyata
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
              <Select value={negeriId} onValueChange={setNegeriId}>
                <SelectTrigger
                  aria-label="Pilih negeri"
                  className="h-11 w-full rounded-full border-white/70 bg-white/60 pl-9 pr-3 text-[15px] font-semibold text-[#45220D] shadow-sm backdrop-blur-xl focus:ring-2 focus:ring-[#E89A1D]/50 data-[placeholder]:text-[#9A7350]"
                >
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl border-white/70 bg-white/95 backdrop-blur-xl">
                  {NEGERI_PILIHAN.map((l) => (
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
          {/* ============ KAD IPU - IKHTISAR NEGERI (penuh lebar) ============ */}
          <motion.section {...anim(0.05)} className="lg:col-span-2" aria-label="Indeks Pencemaran Udara">
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
                      <Gauge size={14} aria-hidden="true" />{" "}
                      {stesenLokasi ? "Bacaan IPU · Sekitar Anda" : `Bacaan IPU · ${negeri.nama}`}
                    </p>
                    <p
                      className="mt-1 truncate text-xl font-bold"
                      style={{ color: gaya?.teks ?? "#45220D" }}
                    >
                      {stesenLokasi && daerahLokasi
                        ? daerahLokasi.daerah
                        : daerahTeruk
                          ? daerahTeruk.daerah
                          : negeri.nama}
                    </p>
                    <p className="text-xs" style={{ color: gaya?.kurang ?? "#9A7350" }}>
                      {stesenLokasi && daerahLokasi
                        ? `Stesen ${stesenLokasi.id} · ${daerahLokasi.tempat}`
                        : stesenTeruk
                          ? `Stesen ${stesenTeruk.id} · ${stesenTeruk.tempat}`
                          : "Menunggu data stesen…"}
                    </p>
                    {statusLokasi === "meminta" && (
                      <p
                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium"
                        style={{ color: gaya?.kurang ?? "#9A7350" }}
                      >
                        <span
                          className="h-1.5 w-1.5 animate-pulse rounded-full"
                          style={{ backgroundColor: gaya?.teks ?? "#B0723A" }}
                          aria-hidden="true"
                        />
                        Mengesan lokasi telefon anda…
                      </p>
                    )}
                    {stesenLokasi && stesenTerdekat && (
                      <p
                        className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold"
                        style={{ color: gaya?.kurang ?? "#9A7350" }}
                      >
                        <LocateFixed size={12} aria-hidden="true" />
                        Mengikut lokasi telefon anda · {fmtJarak(stesenTerdekat.jarak)} km
                      </p>
                    )}
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
                          style={{ color: gaya?.teks ?? "#45220D" }}
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
                        {stesenTeruk?.masaBacaan && (
                          <p>
                            Bacaan jam{" "}
                            <b style={{ color: gaya?.teks ?? "#7A4A28" }}>
                              {formatJam(stesenTeruk.masaBacaan)}
                            </b>
                          </p>
                        )}
                        {peneranganPencemar(stesenTeruk?.pencemar) ? (
                          <p>
                            Dominan:{" "}
                            <b style={{ color: gaya?.teks ?? "#7A4A28" }}>
                              {peneranganPencemar(stesenTeruk?.pencemar)}
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

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
                      <div
                        className="rounded-2xl px-3 py-2"
                        style={{ backgroundColor: gaya?.tile ?? "rgba(255,255,255,0.45)" }}
                      >
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: gaya?.kurang ?? "#9A7350" }}
                        >
                          Daerah terjejas jerebu
                        </p>
                        <p
                          className="text-[15px] font-bold"
                          style={{ color: gaya?.teks ?? "#45220D" }}
                        >
                          {bilTerjejas} / {bilDaerah} daerah
                        </p>
                      </div>
                      <div
                        className="rounded-2xl px-3 py-2"
                        style={{ backgroundColor: gaya?.tile ?? "rgba(255,255,255,0.45)" }}
                      >
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: gaya?.kurang ?? "#9A7350" }}
                        >
                          Stesen DOE dipantau
                        </p>
                        <p
                          className="text-[15px] font-bold"
                          style={{ color: gaya?.teks ?? "#45220D" }}
                        >
                          {bilStesen} stesen
                        </p>
                      </div>
                    </div>

                    {statusLokasi === "gagal" && (
                      <button
                        onClick={kesanLokasi}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition active:scale-[0.99] sm:max-w-md"
                        style={{
                          backgroundColor: gaya?.tile ?? "rgba(255,255,255,0.45)",
                          color: gaya?.teks ?? "#45220D",
                        }}
                      >
                        <LocateFixed size={14} aria-hidden="true" />
                        Guna lokasi telefon untuk bacaan lebih tepat
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.section>

            {/* ============ DAERAH TERJEJAS JEREBU ============ */}
            <motion.section
              {...anim(0.1)}
              className="lg:col-span-2"
              aria-label="Daerah terjejas jerebu"
            >
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                    <MapPin size={14} aria-hidden="true" /> Daerah Terjejas Jerebu ·{" "}
                    {negeri.nama}
                  </p>
                  {bilDaerah > 0 && (
                    <p className="text-[11px] font-medium text-[#9A7350]">
                      {bilTerjejas} daripada {bilDaerah} daerah melebihi bacaan Baik
                    </p>
                  )}
                </div>

                {muatIPU && !dataIPU ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Kerangka key={i} className="h-[118px] w-full rounded-[22px]" />
                    ))}
                  </div>
                ) : kumpulanDaerah.length === 0 ? (
                  <p className="mt-4 text-sm text-[#9A7350]">
                    Tiada data stesen daerah buat masa ini. Sila cuba segarkan.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {kumpulanDaerah.map((k, i) => {
                      const infoD = infoTahap(k.tahap);
                      const aksen = infoD?.warna ?? "#8D8378";
                      return (
                        <div
                          key={k.daerah}
                          className="relative rounded-[22px] border p-4"
                          style={{
                            backgroundColor:
                              infoD?.warnaLatar ?? "rgba(141,131,120,0.12)",
                            borderColor: `${aksen}55`,
                          }}
                        >
                          {i === 0 && bilDaerah > 1 && k.maks >= 0 && (
                            <span
                              className="absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white shadow-sm"
                              style={{ backgroundColor: aksen }}
                            >
                              Tertinggi
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[16px] font-bold text-[#45220D]">
                                {k.daerah}
                              </p>
                              <p className="text-[10.5px] font-medium text-[#9A7350]">
                                {k.stesen.length === 1
                                  ? "1 stesen DOE"
                                  : `${k.stesen.length} stesen DOE`}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span
                                className="inline-flex rounded-full px-3 py-1 text-[15px] font-bold shadow-sm"
                                style={
                                  infoD
                                    ? {
                                        backgroundColor: infoD.warna,
                                        color: infoD.warnaTeks,
                                      }
                                    : {
                                        backgroundColor: "rgba(141,131,120,0.2)",
                                        color: "#6B5E52",
                                      }
                                }
                              >
                                {k.maks >= 0 ? k.maks : "--"}
                              </span>
                              <p
                                className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                                style={{ color: aksen }}
                              >
                                {infoD?.label ?? "Tiada Bacaan"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2.5 flex flex-col gap-1.5">
                            {k.stesen.map((s) => {
                              const tS = tahapDariNilai(s.ipu);
                              const infoS = infoTahap(tS);
                              return (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between gap-2 rounded-xl bg-white/55 px-3 py-1.5"
                                >
                                  <p className="min-w-0 truncate text-[12.5px] font-medium text-[#5C3A1E]">
                                    {s.tempat}
                                  </p>
                                  <p
                                    className="shrink-0 text-[13.5px] font-bold"
                                    style={{
                                      color: infoS
                                        ? WARNA_NILAI_KAD[
                                            tS as Exclude<TahapIPU, "tiada">
                                          ]
                                        : "#8D8378",
                                    }}
                                  >
                                    {s.ipu ?? "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dataIPU && kumpulanDaerah.length > 0 && (
                  <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-[#9A7350]">
                    <RotateCw size={11} aria-hidden="true" />
                    Bacaan masa nyata APIMS DOE · auto segar setiap 10 minit
                  </p>
                )}
              </div>
            </motion.section>

            {/* ============ CUACA SEMASA ============ */}
            <motion.section {...anim(0.15)} aria-label="Cuaca semasa">
              <div className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-[0_14px_40px_-16px_rgba(146,84,28,0.28)] backdrop-blur-xl sm:p-6">
                <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#B0723A]">
                  <Thermometer size={14} aria-hidden="true" /> Cuaca Sekarang · {negeri.ibu}
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
            <motion.section {...anim(0.2)} aria-label="Ramalan jam-harian">
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
              Bacaan IPU dikemas kini setiap jam oleh DOE · Fokus kawasan: Perak &amp; Selangor ·
              Rujukan rasmi: eqms.doe.gov.my ·
              {masaKemasKini && ` Kemas kini halaman ${formatJam(masaKemasKini)}`}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
