# Worklog

---
Task ID: 1
Agent: Main agent (Z.ai)
Task: Bina sistem cuaca & IPU Malaysia 1-page (Next.js) dengan reka bentuk gradien oren mesra mata, data cuaca & IPU sebenar via API, warna tahap IPU, responsive semua peranti.

Work Log:
- Initialized fullstack environment (curl init-fullstack.sh)
- Probe & sahkan API sebenar: Open-Meteo (cuaca 7 hari + current + hourly) ✅
- Terokai API IPU rasmi: data.gov.my (404/down), api.doe.gov.my (perlu kunci), akhirnya jumpa endpoint dalaman APIMS melalui network capture agent-browser: https://eqms.doe.gov.my/api3/publicportalapims/{mapcaqm,apiranking,statelist,datatrendchart,apitablehourly} — data sebenar 68 stesen CAQM DOE Malaysia
- Bina src/lib/cuaca.ts: pemetaan kod cuaca WMO→BM+ikon, tahap IPU DOE (Baik/Sederhana/Tidak Sihat/Sangat Tidak Sihat/Berbahaya dengan warna rasmi dilaraskan), 18 lokasi Malaysia, haversine, format masa zon Asia/Kuala_Lumpur
- Bina /api/ipu (proksi APIMS + cache 5 min + trend 24 jam) dan /api/weather (proksi Open-Meteo + cache 10 min, slice 12 jam)
- Bina src/components/panel-cuaca.tsx (ikon cuaca lucide, SkalaIPU 5 segmen + penanda, Sparkline SVG berwarna ikut tahap, skeleton, kad ralat)
- Bina src/app/page.tsx: 1-page mobile-first, gradien senja oren lembut (#FFF4E3→#FBB878) + teks perang tua kontras selesa, kad kaca putih/60 backdrop-blur, kad IPU besar + skala + trend, cuaca semasa, strip 12 jam scroll, ramalan 7 hari (gaya rujukan), kedudukan IPU tertinggi, footer sumber data; auto-refresh 10 minit; Select lokasi shadcn
- Kemaskini layout.tsx (lang="ms", metadata BM) + globals.css (scrollbar-lembut)
- Lint bersih; verifikasi agent-browser: desktop 1440px (2 kolum) & mobile iPhone 390px (stack 1 kolum), penukar lokasi KL→Kuantan berfungsi (IPU 143 Kuning "Tidak Sihat" → 76 Biru "Sederhana", sparkline ikut warna), tiada ralat konsol

Stage Summary:
- Deliverable: Sistem Cuaca & IPU Malaysia 1-page (Next.js 16 + TS + Tailwind 4)
- API sebenar: APIMS DOE Malaysia (IPU/jerebu 68 stesen) + Open-Meteo (cuaca)
- Fail utama: src/lib/cuaca.ts, src/app/api/ipu/route.ts, src/app/api/weather/route.ts, src/components/panel-cuaca.tsx, src/app/page.tsx
- Nota: endpoint APIMS ditemui melalui pemerhatian rangkaian portal rasmi; cache server-side melindungi server DOE; semua masa dipapar zon Malaysia

---
Task ID: 2
Agent: Main agent (Z.ai)
Task: Iterasi 2 - kad IPU berwarna penuh ikut tahap, ramalan disahkan data sebenar, kedudukan IPU tertinggi sebenar (bukan hijau).

Work Log:
- Tambah GAYA_KAD dalam src/lib/cuaca.ts: latar kad penuh, teks/kurang/sub, tile, garis graf, chip terbalik bagi 5 tahap (kuning gelap teks perang; hijau/biru/oren/merah teks putih)
- /api/ipu: buang endpoint apiranking (rupanya papar stesen terbersih/hijau); kedudukan kini diisih menurun daripada 68 stesen mapcaqm - papar 5 tertinggi sebenar (163 Nilai, 159 Bukit Rambai, 155 Klang/Seremban/Johan Setia - semua Unhealthy)
- panel-cuaca.tsx: SkalaIPU terima warnaLabel/warnaJulat, Sparkline terima warnaGaris + kelegapan gradien diturunkan 0.28->0.16
- page.tsx: kad Bacaan IPU latar penuh warna tahap (transisi 500ms), semua teks kad ikut gaya kontras, chip tahap latar putih, ranking chip warna penuh tahap, nota "Data ramalan sebenar Open-Meteo zon Asia/Kuala_Lumpur" pada kad ramalan
- Lint bersih; verifikasi agent-browser desktop 1440 & iPhone 390: kad IPU kuning penuh (IPU 140 Tidak Sihat), nilai ramalan UI = API (26/34 = round(25.7/33.8)), tiada ralat konsol

Stage Summary:
- Kad IPU kini berwarna penuh ikut tahap IPU secara automatik
- Kedudukan IPU Tertinggi memaparkan stesen paling terjejas (kuning/oren/merah)
- Ramalan 7 hari disahkan data sebenar Open-Meteo dan dilabel sumber

---
Task ID: 3
Agent: Z.ai (utama)
Task: Buang bahagian "Trend IPU 24 Jam" daripada sistem Cuaca & IPU (permintaan pengguna: "trend ipu 24 jam buang")

Work Log:
- page.tsx: buang medan `trend`/`trendStation` daripada interface ResponIPU, state `trend`, useEffect fetch trend, blok JSX "Trend IPU 24 Jam", import `Sparkline`; laraskan skeleton kad IPU h-44 -> h-40
- api/ipu/route.ts: buang cawangan `trendStateId`, interface TrendMentah/TitikTrend, fungsi tarikhHariIniMY(), medan trend/trendStation dalam respons; tanda tangan GET() tanpa param
- panel-cuaca.tsx: buang komponen Sparkline sepenuhnya
- lib/cuaca.ts: buang properti `garisGraf` daripada GayaKadTahap & semua entri GAYA_KAD (tidak lagi digunakan)
- Lint bersih (eslint .), tsc tiada ralat dalam src/
- Verifikasi agent-browser: desktop 1440px & mobile 390px — teks "Trend IPU 24 Jam" tiada, kad IPU kuning penuh (KL 140 Tidak Sihat), ranking menurun (Nilai 163 -> Bukit Rambai 159 -> Klang 155...), tiada ralat konsol

Stage Summary:
- Ciri Trend IPU 24 Jam dibuang sepenuhnya (UI + state + API proksi + komponen graf)
- Ranking IPU Tertinggi kekal isihan menurun (Berbahaya/tertinggi di atas) seperti permintaan sebelum ini
- Kad IPU kekal penuh warna ikut tahap (GAYA_KAD)
- Semua data kekal sebenar: APIMS DOE (IPU) + Open-Meteo (cuaca/ramalan)

---
Task ID: 4
Agent: Z.ai (utama)
Task: Fokuskan sistem kepada 2 negeri (Perak & Selangor) dengan paparan jerebu mengikut daerah (permintaan: "buat real data dan buat 2 negeri sahaja iaitu perak dan selangor. bila pengguna pilih perak...paparkan semua daerah yang terjejas dengan jerebu sama juga seperti selangor")

Work Log:
- Dapatkan senarai stesen sebenar APIMS: 5 stesen Perak (CA10A Taiping, CA11A Tasek Ipoh, CA12A Pegoh Ipoh, CA13A Seri Manjung, CA14A Tanjung Malim), 6 stesen Selangor (CA18B Kuala Selangor, CA19B PJ, CA20B Shah Alam, CA21B Klang, CA22B Banting, MCAQM001 Johan Setia)
- lib/cuaca.ts: ganti LOKASI/jarakKm/lokasiById dengan NEGERI_PILIHAN (perak: ibu Ipoh 4.5975,101.0901; selangor: ibu Shah Alam 3.0738,101.5183) + DAERAH_STESEN (pemetaan STATION_ID -> daerah: Larut Matang Selama, Kinta, Manjung, Muallim, Kuala Selangor, Petaling, Klang, Kuala Langat)
- page.tsx: state negeriId (lalai selangor), buang stesenTerdekat; tambah kumpulanDaerah useMemo (tapis STATE_NAME, kumpul ikut daerah, maks ikut stesen, isih menurun - teruk di atas); kad IPU = ikhtisar negeri penuh lebar (daerah paling teruk + tile bilangan daerah terjejas & stesen); bahagian baharu "Daerah Terjejas Jerebu" grid kad daerah (tint warnaLatar ikut tahap maks, chip nilai warna tahap, baris stesen, penanda TERTINGGI); buang bahagian "IPU Tertinggi di Malaysia"; struktur grid baharu: IPU (span2) -> Daerah (span2) -> Cuaca + 12jam -> Ramalan (span2); cuaca = ibu negeri
- Lint & tsc bersih; agent-browser: desktop 1440 Selangor (kad kuning, Klang TERTINGGI 155, 4/4 daerah, 6 stesen), desktop Perak (kad biru, Manjung 95, Kinta 2 stesen, cuaca Ipoh), mobile 390 (1-kolum rapi); tiada ralat konsol

Stage Summary:
- Sistem kini fokus 2 negeri sahaja: Perak & Selangor, semua data sebenar (APIMS DOE + Open-Meteo)
- Pemilihan negeri memaparkan SEMUA daerah berstesen dengan bacaan IPU masa nyata, warna ikut tahap, diisih paling teruk dahulu
- Cuaca sekarang + ramalan menggunakan koordinat ibu negeri (Ipoh / Shah Alam)
