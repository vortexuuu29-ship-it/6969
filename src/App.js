import React, { useState, useMemo, useEffect, useRef } from "react";

// ============================================================================
// 0. TWOJE DANE Z SUPABASE (Wklej swój URL oraz klucz anon public w cudzysłowy)
// ============================================================================
const DEFAULT_SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://syxtkmwvudpjojhbbjwp.supabase.co/rest/v1/";
const DEFAULT_SUPABASE_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHRrbXd2dWRwam9qaGJiandwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzUxOTMsImV4cCI6MjEwODYxMTE5M30.drElt0CdI57MGBFQgeawf2zt6VGFbCCSRjGMezKgpZ4";

// ============================================================================
// 1. WBUDOWANE IKONY SVG (100% odporne na błędy React 19 w CodeSandbox)
// ============================================================================
const Icon = ({ name, className = "w-4 h-4" }) => {
  const paths = {
    cpu: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    dumbbell: (
      <>
        <path d="m6.5 6.5 11 11" />
        <path d="m21 21-1-1" />
        <path d="m3 3 1 1" />
        <path d="m18 22 4-4" />
        <path d="m2 6 4-4" />
        <path d="m3 10 7-7" />
        <path d="m14 21 7-7" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    unlock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
    flame: (
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    sparkles: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>
    ),
    close: <path d="M18 6 6 18M6 6l12 12" />,
    timer: (
      <>
        <line x1="10" x2="14" y1="2" y2="2" />
        <line x1="12" x2="15" y1="14" y2="11" />
        <circle cx="12" cy="14" r="8" />
      </>
    ),
    arrows: (
      <>
        <path d="M8 3 4 7l4 4" />
        <path d="M4 7h16" />
        <path d="m16 21 4-4-4-4" />
        <path d="M20 17H4" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name] || paths.cpu}
    </svg>
  );
};

// ============================================================================
// 2. MOTYWY KOLORYSTYCZNE, CZCIONKI I WSPÓŁCZYNNIKI PAL (CPM)
// ============================================================================
const THEMES = {
  monarch: {
    id: "monarch",
    name: "Monarch Cyber",
    swatch: "#06b6d4",
    bgMain: "bg-slate-950",
    bgCard: "bg-slate-900",
    bgSub: "bg-slate-950/90",
    textMain: "text-slate-100",
    textMuted: "text-slate-400",
    border: "border-slate-800",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-500",
    accentSoft: "bg-cyan-500/10 border-cyan-500/40 text-cyan-300",
    btnText: "text-slate-950",
  },
  berserk: {
    id: "berserk",
    name: "Crimson Berserk",
    swatch: "#f43f5e",
    bgMain: "bg-neutral-950",
    bgCard: "bg-neutral-900",
    bgSub: "bg-black/80",
    textMain: "text-neutral-100",
    textMuted: "text-neutral-400",
    border: "border-neutral-800",
    accentText: "text-rose-500",
    accentBg: "bg-rose-600",
    accentSoft: "bg-rose-500/10 border-rose-500/40 text-rose-300",
    btnText: "text-white",
  },
  venom: {
    id: "venom",
    name: "Bio-Venom HUD",
    swatch: "#10b981",
    bgMain: "bg-zinc-950",
    bgCard: "bg-zinc-900",
    bgSub: "bg-zinc-950/90",
    textMain: "text-zinc-100",
    textMuted: "text-zinc-400",
    border: "border-zinc-800",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500",
    accentSoft: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
    btnText: "text-zinc-950",
  },
  sovereign: {
    id: "sovereign",
    name: "Sovereign Gold",
    swatch: "#f59e0b",
    bgMain: "bg-stone-950",
    bgCard: "bg-stone-900",
    bgSub: "bg-black/80",
    textMain: "text-stone-100",
    textMuted: "text-stone-400",
    border: "border-stone-800",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500",
    accentSoft: "bg-amber-500/10 border-amber-500/40 text-amber-300",
    btnText: "text-stone-950",
  },
  arctic: {
    id: "arctic",
    name: "Arctic Daylight",
    swatch: "#2563eb",
    bgMain: "bg-slate-100",
    bgCard: "bg-white",
    bgSub: "bg-slate-50",
    textMain: "text-slate-900",
    textMuted: "text-slate-500",
    border: "border-slate-200",
    accentText: "text-blue-600",
    accentBg: "bg-blue-600",
    accentSoft: "bg-blue-50 border-blue-200 text-blue-700",
    btnText: "text-white",
  },
};

const FONTS = {
  tactical: {
    id: "tactical",
    name: "Tactical RPG",
    family: "'Rajdhani', sans-serif",
  },
  cyber: {
    id: "cyber",
    name: "Cyber HUD",
    family: "'Space Grotesk', sans-serif",
  },
  brutal: {
    id: "brutal",
    name: "Athletic Brutal",
    family: "'Oswald', sans-serif",
  },
  clean: { id: "clean", name: "Clean Modern", family: "'Inter', sans-serif" },
};

const PAL_LEVELS = [
  {
    val: 1.2,
    title: "PAL 1.20 – Siedzący tryb życia",
    desc: "Praca biurowa/szkoła, brak treningów siłowych, poniżej 4 000 kroków dziennie.",
  },
  {
    val: 1.375,
    title: "PAL 1.38 – Niska aktywność",
    desc: "Praca siedząca + 1–2 treningi w tygodniu, ok. 5 000–7 000 kroków dziennie.",
  },
  {
    val: 1.55,
    title: "PAL 1.55 – Umiarkowana (Typowa dla siłowni)",
    desc: "Praca lekka/siedząca + 3–4 treningi siłowe w tygodniu i 7 000–10 000 kroków.",
  },
  {
    val: 1.725,
    title: "PAL 1.73 – Wysoka aktywność",
    desc: "4–5 ciężkich treningów w tygodniu + praca w ruchu lub ponad 12 000 kroków.",
  },
  {
    val: 1.9,
    title: "PAL 1.90 – Bardzo wysoka (Praca fizyczna + Sport)",
    desc: "Ciężka praca fizyczna + intensywne treningi siłowe niemal codziennie.",
  },
];

// ============================================================================
// 3. OBLICZENIA BIOMETRYCZNE, BMI, CPM, DOTS, 1RM I BEZPĘTLOWY SKANER ZDJĘĆ AI
// ============================================================================
const createDemoPhysiquePoster = (
  name,
  goal,
  weight,
  waist,
  chest,
  accentHex
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#bg)"/>
    <circle cx="200" cy="95" r="28" fill="none" stroke="${accentHex}" stroke-width="2.5"/>
    <path d="M125 145 Q200 130 275 145 L255 245 L235 335 L165 335 L145 245 Z" fill="${accentHex}" fill-opacity="0.14" stroke="${accentHex}" stroke-width="2.5"/>
    <line x1="145" y1="245" x2="255" y2="245" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="165" y1="335" x2="235" y2="335" stroke="#10b981" stroke-width="2" stroke-dasharray="4 4"/>
    <text x="200" y="410" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">${name.toUpperCase()}</text>
    <text x="200" y="435" text-anchor="middle" fill="${accentHex}" font-family="sans-serif" font-weight="bold" font-size="13">${goal.toUpperCase()} // ${weight} KG</text>
    <text x="200" y="460" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="12">KLATKA: ${chest} CM | PAS: ${waist} CM</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const calc1RM = (w, r) =>
  !w || !r ? 0 : r === 1 ? Math.round(w) : Math.round(w * (1 + r / 30));

const calcDOTS = (bodyweightKg, totalKg) => {
  if (!bodyweightKg || !totalKg) return 0;
  const bw = Math.min(Math.max(bodyweightKg, 40), 210);
  const a = -0.000001093;
  const b = 0.0007391293;
  const c = -0.1918759221;
  const d = 24.0900756;
  const e = -307.75076;
  const denom =
    a * Math.pow(bw, 4) +
    b * Math.pow(bw, 3) +
    c * Math.pow(bw, 2) +
    d * bw +
    e;
  return denom > 0 ? Math.round((500 / denom) * totalKg) : 0;
};

const calcBMIData = (weightKg, heightCm, waistCm) => {
  if (!weightKg || !heightCm)
    return { bmi: "0.0", label: "Brak danych", tone: "text-slate-400" };
  const hM = heightCm / 100;
  const bmiVal = weightKg / (hM * hM);
  const bmi = bmiVal.toFixed(1);
  const whtr = waistCm ? waistCm / heightCm : 0.5;

  if (bmiVal < 18.5) return { bmi, label: "Niedowaga", tone: "text-amber-400" };
  if (bmiVal < 25.0) return { bmi, label: "Norma", tone: "text-emerald-400" };
  if (bmiVal >= 25.0 && whtr < 0.48)
    return { bmi, label: "Atletyczne (Mięśnie)", tone: "text-cyan-400" };
  if (bmiVal < 30.0)
    return { bmi, label: "Podwyższone / Masa", tone: "text-amber-400" };
  return { bmi, label: "Wysokie BMI", tone: "text-rose-400" };
};

const calcCPMData = (weightKg, heightCm, age = 22, sex = "M", pal = 1.55) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const ppm = Math.round(sex === "K" ? base - 161 : base + 5);
  const cpm = Math.round(ppm * pal);
  return {
    ppm,
    cpm,
    cut: Math.round(cpm - 400),
    recomp: cpm,
    leanBulk: Math.round(cpm + 300),
    powerBulk: Math.round(cpm + 500),
  };
};

const evaluatePhysiqueAI = (player) => {
  const latestPhoto = player.photos?.[0];
  const height = player.heightCm || 180;
  const waist = player.measurements?.waist?.current || 85;
  const chest = player.measurements?.chest?.current || 105;
  const biceps = player.measurements?.biceps?.current || 38;

  const vTaper = chest / waist;
  const whtr = waist / height;
  const armToWaist = biceps / waist;

  const bioVScore = Math.min(
    10,
    Math.max(3, ((vTaper - 1.12) / (1.42 - 1.12)) * 7 + 3)
  );
  const bioDefScore = Math.min(
    10,
    Math.max(3, ((0.55 - whtr) / (0.55 - 0.42)) * 7 + 3)
  );
  const bioArmScore = Math.min(
    10,
    Math.max(3, ((armToWaist - 0.4) / (0.53 - 0.4)) * 7 + 3)
  );

  const waistDelta = (player.measurements?.waist?.start || waist) - waist;
  const bicDelta = biceps - (player.measurements?.biceps?.start || biceps);
  const progScore = Math.min(
    10,
    Math.max(5, 6.8 + waistDelta * 0.4 + bicDelta * 0.8)
  );

  const vScore = latestPhoto?.aiVision?.vScore
    ? (latestPhoto.aiVision.vScore * 0.55 + bioVScore * 0.45).toFixed(1)
    : bioVScore.toFixed(1);
  const defScore = latestPhoto?.aiVision?.defScore
    ? (latestPhoto.aiVision.defScore * 0.55 + bioDefScore * 0.45).toFixed(1)
    : bioDefScore.toFixed(1);
  const armScore = latestPhoto?.aiVision?.armScore
    ? (latestPhoto.aiVision.armScore * 0.55 + bioArmScore * 0.45).toFixed(1)
    : bioArmScore.toFixed(1);

  const overall = (
    parseFloat(vScore) * 0.35 +
    parseFloat(defScore) * 0.3 +
    parseFloat(armScore) * 0.2 +
    progScore * 0.15
  ).toFixed(1);

  const estBf =
    latestPhoto?.aiVision?.estBf ||
    Math.round(Math.max(8, Math.min(28, (whtr - 0.36) * 110)));

  const summary =
    latestPhoto?.aiVision?.verdict ||
    (vTaper >= 1.32 && whtr <= 0.47
      ? "Wyraźny V-Taper i niski obwód talii względem wzrostu. Dobra separacja górnej obręczy."
      : whtr > 0.49
      ? "Solidna masa mięśniowa, ale redukcja obwodu w talii o 3–4 cm najmocniej podniesie ocenę wizualną."
      : "Szczupła baza z dobrą kontrolą talii – priorytetem jest rozbudowa najszerszego grzbietu i klatki.");

  return {
    overall: parseFloat(overall),
    vScore,
    defScore,
    armScore,
    progScore: progScore.toFixed(1),
    vTaper: vTaper.toFixed(2),
    whtr: whtr.toFixed(2),
    estBf,
    lightingNote:
      latestPhoto?.aiVision?.lightingNote || "Zweryfikowano biometrycznie",
    summary,
    source: latestPhoto?.aiVision?.source || "Automatyczny Sędzia AI",
  };
};

// Skaner zdjęć BEZ ŻADNEJ PĘTLI FOR/WHILE (nigdy nie wywoła błędu RangeError w CodeSandbox!)
const autoEvaluateUploadedPhoto = (file, playerContext) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // 1. Płótno główne (wysoka jakość zdjęcia na stronę: 640px)
        const canvas = document.createElement("canvas");
        const maxH = 640;
        const scale = Math.min(1, maxH / img.height);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // 2. Mikro-płótno 2x2 px do błyskawicznego pomiaru światła (0 pętli!)
        const probe = document.createElement("canvas");
        probe.width = 2;
        probe.height = 2;
        const pCtx = probe.getContext("2d");
        pCtx.drawImage(img, 0, 0, 2, 2);
        const d = pCtx.getImageData(0, 0, 2, 2).data;

        const topLum = (d[0] + d[1] + d[2] + d[4] + d[5] + d[6]) / 6;
        const botLum = (d[8] + d[9] + d[10] + d[12] + d[13] + d[14]) / 6;
        const diffLum = Math.abs(topLum - botLum);

        let lightingNote = "Neutralne oświetlenie – brak przekłamania cieniem";
        let bonus = 0.15;
        if (diffLum > 45 && botLum < 100) {
          lightingNote =
            "Wykryto ostre światło górne (Downlighting) – skorygowano ocenę cieni";
          bonus = -0.2;
        } else if (topLum > 170) {
          lightingNote = "Jasne światło dzienne – wiarygodna definicja";
          bonus = 0.25;
        }

        // 3. Próba wywołania backendu /api/analyze (Rozwiązanie C po wdrożeniu na Vercel)
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: dataUrl.split(",")[1],
              player: playerContext,
            }),
          });
          if (res.ok) {
            const serverAI = await res.json();
            if (serverAI && serverAI.vScore) {
              const overall = (
                serverAI.vScore * 0.4 +
                serverAI.defScore * 0.35 +
                serverAI.armScore * 0.25
              ).toFixed(1);
              resolve({
                dataUrl,
                aiVision: {
                  ...serverAI,
                  overall: parseFloat(overall),
                  source: "Gemini Vision AI (Chmura)",
                },
              });
              return;
            }
          }
        } catch (_) {}

        // 4. Natychmiastowa ocena hybrydowa AI
        const baseEval = evaluatePhysiqueAI(playerContext);
        const vScore = Math.min(
          10,
          Math.max(3, parseFloat(baseEval.vScore) + bonus)
        ).toFixed(1);
        const defScore = Math.min(
          10,
          Math.max(3, parseFloat(baseEval.defScore) + bonus)
        ).toFixed(1);
        const armScore = Math.min(
          10,
          Math.max(3, parseFloat(baseEval.armScore) + 0.1)
        ).toFixed(1);
        const overall = (
          parseFloat(vScore) * 0.38 +
          parseFloat(defScore) * 0.34 +
          parseFloat(armScore) * 0.28
        ).toFixed(1);

        resolve({
          dataUrl,
          aiVision: {
            overall: parseFloat(overall),
            vScore: parseFloat(vScore),
            defScore: parseFloat(defScore),
            armScore: parseFloat(armScore),
            estBf: baseEval.estBf,
            lightingNote,
            verdict: `Automatyczny audyt sylwetki ze zdjęcia (${overall}/10). ${baseEval.summary}`,
            source: "Automatyczny Sędzia Wizyjny AI",
          },
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Kalkulator talerzy na sztandze (bez pętli while, z limitem bezpieczeństwa)
const calcPlatesPerSide = (targetWeight) => {
  const bar = 20;
  const safeTarget = Math.min(500, Number(targetWeight) || 0);
  if (safeTarget <= bar) return [];
  let rem = (safeTarget - bar) / 2;
  const available = [
    { w: 25, color: "bg-rose-600 text-white", h: "h-16" },
    { w: 20, color: "bg-blue-600 text-white", h: "h-16" },
    { w: 15, color: "bg-amber-400 text-slate-950", h: "h-14" },
    { w: 10, color: "bg-emerald-500 text-slate-950", h: "h-12" },
    { w: 5, color: "bg-slate-200 text-slate-950", h: "h-10" },
    { w: 2.5, color: "bg-slate-700 text-white", h: "h-9" },
    { w: 1.25, color: "bg-slate-500 text-white", h: "h-8" },
  ];
  const result = [];
  available.forEach((p) => {
    const count = Math.min(10, Math.floor((rem + 0.001) / p.w));
    Array.from({ length: count }).forEach(() => result.push(p));
    rem = Math.round((rem - count * p.w) * 100) / 100;
  });
  return result;
};

// ============================================================================
// 4. DOMYŚLNY PROFIL STARTOWY (OLEK)
// ============================================================================
const INITIAL_PLAYERS = [
  {
    id: "p_olek",
    name: "Olek",
    age: 22,
    sex: "M",
    pal: 1.55,
    heightCm: 184,
    goal: "Redukcja",
    dietKcal: 2300,
    dietProtein: 170,
    startWeight: 84.0,
    currentWeight: 84.0,
    measurements: {
      waist: { start: 85.0, current: 85.0 },
      biceps: { start: 38.0, current: 38.0 },
      chest: { start: 105.0, current: 105.0 },
    },
    lifts: {
      bench: { weight: 80.0, reps: 5 },
      squat: { weight: 100.0, reps: 5 },
      deadlift: { weight: 120.0, reps: 5 },
      ohp: { weight: 50.0, reps: 5 },
    },
    photos: [
      {
        id: "ph_olek",
        date: "26.10.2026",
        weight: 84.0,
        waist: 85.0,
        note: "Profil startowy – pierwsza rejestracja w bazie.",
        url: createDemoPhysiquePoster(
          "Olek",
          "Redukcja",
          84.0,
          85.0,
          105.0,
          "#06b6d4"
        ),
      },
    ],
    history: [
      { date: "Start", weight: 84.0, waist: 85.0, bench1RM: 93, kcal: 2300 },
    ],
  },
];

export default function App() {
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem("iron_archive_players_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_PLAYERS;
  });

  const [activeId, setActiveId] = useState(() => players[0]?.id || "p_olek");
  const [pinnedId, setPinnedId] = useState(
    () => localStorage.getItem("iron_archive_pinned") || ""
  );
  const [activeTab, setActiveTab] = useState("ai_physique");
  const [sortBy, setSortBy] = useState("ai");
  const [themeKey, setThemeKey] = useState("monarch");
  const [fontKey, setFontKey] = useState("tactical");

  const [sbUrl] = useState(
    () => DEFAULT_SUPABASE_URL || localStorage.getItem("iron_sb_url") || ""
  );
  const [sbKey] = useState(
    () => DEFAULT_SUPABASE_KEY || localStorage.getItem("iron_sb_key") || ""
  );

  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [compA, setCompA] = useState(() => players[0]?.id || "p_olek");
  const [compB, setCompB] = useState(
    () => players[1]?.id || players[0]?.id || "p_olek"
  );

  const [editingDiet, setEditingDiet] = useState(false);
  const [dietDraft, setDietDraft] = useState({
    goal: "Redukcja",
    dietKcal: 2300,
    dietProtein: 170,
  });

  const [cpmForm, setCpmForm] = useState({
    sex: "M",
    age: 22,
    weight: 84.0,
    heightCm: 184,
    pal: 1.55,
  });
  const [cpmSavedBanner, setCpmSavedBanner] = useState(false);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    age: "22",
    heightCm: "180",
    goal: "Redukcja",
    dietKcal: "2300",
    dietProtein: "170",
    weight: "82",
    waist: "85",
    biceps: "38",
    chest: "105",
  });

  const [bodyForm, setBodyForm] = useState({
    weight: "",
    waist: "",
    biceps: "",
    chest: "",
    note: "",
    photoPreview: null,
    autoAiResult: null,
  });
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const [liftForm, setLiftForm] = useState({
    exercise: "bench",
    weight: "100",
    reps: "5",
  });
  const [plateWeight, setPlateWeight] = useState(100);
  const [chartMetric, setChartMetric] = useState("weight");

  const [timerSec, setTimerSec] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const theme = THEMES[themeKey];
  const font = FONTS[fontKey];
  const activePlayer = players.find((p) => p.id === activeId) || players[0];
  const isLocked = Boolean(pinnedId && pinnedId !== activePlayer?.id);

  // Synchronizacja z bazą Supabase w tle
  const saveToSupabaseCloud = async (updatedPlayers) => {
    if (!sbUrl || !sbKey) return;
    try {
      await fetch(`${sbUrl.replace(/\/$/, "")}/rest/v1/squad_state`, {
        method: "POST",
        headers: {
          apikey: sbKey.trim(),
          Authorization: `Bearer ${sbKey.trim()}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          id: 1,
          players: updatedPlayers,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (_) {}
  };

  const fetchFromSupabaseCloud = async () => {
    if (!sbUrl || !sbKey) return;
    try {
      const res = await fetch(
        `${sbUrl.replace(
          /\/$/,
          ""
        )}/rest/v1/squad_state?id=eq.1&select=players`,
        {
          headers: {
            apikey: sbKey.trim(),
            Authorization: `Bearer ${sbKey.trim()}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (
          data?.[0]?.players &&
          Array.isArray(data[0].players) &&
          data[0].players.length > 0
        ) {
          setPlayers(data[0].players);
          setActiveId(data[0].players[0].id);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    try {
      localStorage.setItem("iron_archive_players_v2", JSON.stringify(players));
    } catch (_) {}
    if (sbUrl && sbKey) {
      saveToSupabaseCloud(players);
    }
  }, [players]);

  useEffect(() => {
    if (sbUrl && sbKey) {
      fetchFromSupabaseCloud();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("iron_archive_pinned", pinnedId || "");
  }, [pinnedId]);

  useEffect(() => {
    const linkId = "iron-archive-fonts";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Oswald:wght@500;700&family=Rajdhani:wght@600;700&family=Space+Grotesk:wght@500;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSec((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    if (activePlayer) {
      setDietDraft({
        goal: activePlayer.goal,
        dietKcal: activePlayer.dietKcal,
        dietProtein: activePlayer.dietProtein,
      });
      setCpmForm({
        sex: activePlayer.sex || "M",
        age: activePlayer.age || 22,
        weight: activePlayer.currentWeight,
        heightCm: activePlayer.heightCm,
        pal: activePlayer.pal || 1.55,
      });
    }
  }, [activePlayer]);

  const enrichedPlayers = useMemo(() => {
    return players.map((p) => {
      const bench1RM = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps);
      const squat1RM = calc1RM(p.lifts.squat.weight, p.lifts.squat.reps);
      const deadlift1RM = calc1RM(
        p.lifts.deadlift.weight,
        p.lifts.deadlift.reps
      );
      const ohp1RM = calc1RM(p.lifts.ohp.weight, p.lifts.ohp.reps);
      const total1RM = bench1RM + squat1RM + deadlift1RM;
      const dots = calcDOTS(p.currentWeight, total1RM);
      const bmiData = calcBMIData(
        p.currentWeight,
        p.heightCm,
        p.measurements.waist.current
      );
      const cpmData = calcCPMData(
        p.currentWeight,
        p.heightCm,
        p.age || 22,
        p.sex || "M",
        p.pal || 1.55
      );
      const ai = evaluatePhysiqueAI(p);
      const kcalPerKg = (p.dietKcal / p.currentWeight).toFixed(1);

      return {
        ...p,
        stats: {
          bench1RM,
          squat1RM,
          deadlift1RM,
          ohp1RM,
          total1RM,
          dots,
          kcalPerKg,
        },
        bmiData,
        cpmData,
        ai,
      };
    });
  }, [players]);

  const sortedPlayers = useMemo(() => {
    const copy = [...enrichedPlayers];
    if (sortBy === "ai")
      return copy.sort((a, b) => b.ai.overall - a.ai.overall);
    if (sortBy === "dots")
      return copy.sort((a, b) => b.stats.dots - a.stats.dots);
    if (sortBy === "total")
      return copy.sort((a, b) => b.stats.total1RM - a.stats.total1RM);
    if (sortBy === "bmi")
      return copy.sort(
        (a, b) => parseFloat(a.bmiData.bmi) - parseFloat(b.bmiData.bmi)
      );
    return copy;
  }, [enrichedPlayers, sortBy]);

  const currentEnriched =
    enrichedPlayers.find((p) => p.id === activeId) || enrichedPlayers[0];

  const liveCpmResult = useMemo(() => {
    const w = parseFloat(cpmForm.weight) || currentEnriched.currentWeight;
    const h = parseFloat(cpmForm.heightCm) || currentEnriched.heightCm;
    const a = parseInt(cpmForm.age, 10) || 22;
    const p = parseFloat(cpmForm.pal) || 1.55;
    return calcCPMData(w, h, a, cpmForm.sex, p);
  }, [cpmForm, currentEnriched]);

  const handleSelectPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzingPhoto(true);
    try {
      const tempContext = {
        ...activePlayer,
        currentWeight:
          parseFloat(bodyForm.weight) || activePlayer.currentWeight,
        measurements: {
          waist: {
            ...activePlayer.measurements.waist,
            current:
              parseFloat(bodyForm.waist) ||
              activePlayer.measurements.waist.current,
          },
          biceps: {
            ...activePlayer.measurements.biceps,
            current:
              parseFloat(bodyForm.biceps) ||
              activePlayer.measurements.biceps.current,
          },
          chest: {
            ...activePlayer.measurements.chest,
            current:
              parseFloat(bodyForm.chest) ||
              activePlayer.measurements.chest.current,
          },
        },
      };

      const evaluated = await autoEvaluateUploadedPhoto(file, tempContext);
      setBodyForm((prev) => ({
        ...prev,
        photoPreview: evaluated.dataUrl,
        autoAiResult: evaluated.aiVision,
      }));
    } catch (_) {
      alert("Nie udało się wczytać zdjęcia.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSaveBodyAndPhoto = (e) => {
    e.preventDefault();
    if (isLocked) return;

    const w = parseFloat(bodyForm.weight) || activePlayer.currentWeight;
    const waist =
      parseFloat(bodyForm.waist) || activePlayer.measurements.waist.current;
    const biceps =
      parseFloat(bodyForm.biceps) || activePlayer.measurements.biceps.current;
    const chest =
      parseFloat(bodyForm.chest) || activePlayer.measurements.chest.current;

    const updatedPlayerTemp = {
      ...activePlayer,
      currentWeight: w,
      measurements: {
        waist: { ...activePlayer.measurements.waist, current: waist },
        biceps: { ...activePlayer.measurements.biceps, current: biceps },
        chest: { ...activePlayer.measurements.chest, current: chest },
      },
    };

    const photoUrl =
      bodyForm.photoPreview ||
      createDemoPhysiquePoster(
        activePlayer.name,
        activePlayer.goal,
        w,
        waist,
        chest,
        theme.swatch
      );

    const localEval = evaluatePhysiqueAI(updatedPlayerTemp);
    const finalAiVision = bodyForm.autoAiResult || {
      overall: localEval.overall,
      vScore: parseFloat(localEval.vScore),
      defScore: parseFloat(localEval.defScore),
      armScore: parseFloat(localEval.armScore),
      estBf: localEval.estBf,
      lightingNote: "Automatyczny audyt proporcji biometrycznych",
      verdict: localEval.summary,
      source: "Automatyczny Sędzia AI",
    };

    const newPhotoEntry = {
      id: "ph_" + Date.now(),
      date: new Date().toLocaleDateString("pl-PL"),
      weight: w,
      waist,
      note:
        bodyForm.note ||
        `Aktualizacja sylwetki (${activePlayer.goal} • ${activePlayer.dietKcal} kcal)`,
      url: photoUrl,
      aiVision: finalAiVision,
    };

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== activeId) return p;
        const bench1RM = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps);
        return {
          ...p,
          currentWeight: w,
          measurements: {
            waist: { ...p.measurements.waist, current: waist },
            biceps: { ...p.measurements.biceps, current: biceps },
            chest: { ...p.measurements.chest, current: chest },
          },
          photos: [newPhotoEntry, ...(p.photos || [])],
          history: [
            ...p.history,
            { date: "Dzisiaj", weight: w, waist, bench1RM, kcal: p.dietKcal },
          ],
        };
      })
    );

    setBodyForm({
      weight: "",
      waist: "",
      biceps: "",
      chest: "",
      note: "",
      photoPreview: null,
      autoAiResult: null,
    });
  };

  const applyCalculatedCpmToProfile = (selectedGoalName, targetKcalValue) => {
    if (isLocked) return;
    const w = parseFloat(cpmForm.weight) || activePlayer.currentWeight;
    const h = parseInt(cpmForm.heightCm, 10) || activePlayer.heightCm;
    const a = parseInt(cpmForm.age, 10) || 22;
    const palVal = parseFloat(cpmForm.pal) || 1.55;
    const recommendedProtein = Math.round(w * 2.1);

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === activeId
          ? {
              ...p,
              age: a,
              sex: cpmForm.sex,
              pal: palVal,
              currentWeight: w,
              heightCm: h,
              goal: selectedGoalName,
              dietKcal: targetKcalValue,
              dietProtein: recommendedProtein,
            }
          : p
      )
    );
    setCpmSavedBanner(true);
    setTimeout(() => setCpmSavedBanner(false), 3000);
  };

  const handleSaveDietProtocol = (e) => {
    e.preventDefault();
    if (isLocked) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === activeId
          ? {
              ...p,
              goal: dietDraft.goal,
              dietKcal: parseInt(dietDraft.dietKcal, 10) || p.dietKcal,
              dietProtein: parseInt(dietDraft.dietProtein, 10) || p.dietProtein,
            }
          : p
      )
    );
    setEditingDiet(false);
  };

  const handleSaveLift = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const w = parseFloat(liftForm.weight);
    const r = parseInt(liftForm.reps, 10);
    if (!w || !r) return;

    setPlayers((prev) =>
      prev.map((p) =>
        p.id !== activeId
          ? p
          : {
              ...p,
              lifts: {
                ...p.lifts,
                [liftForm.exercise]: { weight: w, reps: r },
              },
            }
      )
    );
    setPlateWeight(w);
    setTimerSec(90);
    setTimerRunning(true);
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;
    const id = "p_" + Date.now().toString().slice(-5);
    const w = parseFloat(newPlayer.weight) || 80;
    const waist = parseFloat(newPlayer.waist) || 84;
    const bic = parseFloat(newPlayer.biceps) || 38;
    const chest = parseFloat(newPlayer.chest) || 104;
    const kcal = parseInt(newPlayer.dietKcal, 10) || 2400;

    const created = {
      id,
      name: newPlayer.name.trim(),
      age: parseInt(newPlayer.age, 10) || 22,
      sex: "M",
      pal: 1.55,
      heightCm: parseInt(newPlayer.heightCm, 10) || 180,
      goal: newPlayer.goal,
      dietKcal: kcal,
      dietProtein: parseInt(newPlayer.dietProtein, 10) || Math.round(w * 2),
      startWeight: w,
      currentWeight: w,
      measurements: {
        waist: { start: waist, current: waist },
        biceps: { start: bic, current: bic },
        chest: { start: chest, current: chest },
      },
      lifts: {
        bench: { weight: 80, reps: 5 },
        squat: { weight: 100, reps: 5 },
        deadlift: { weight: 120, reps: 5 },
        ohp: { weight: 50, reps: 5 },
      },
      photos: [
        {
          id: "ph_" + id,
          date: new Date().toLocaleDateString("pl-PL"),
          weight: w,
          waist,
          note: "Profil startowy – pierwsza rejestracja w bazie.",
          url: createDemoPhysiquePoster(
            newPlayer.name.trim(),
            newPlayer.goal,
            w,
            waist,
            chest,
            "#06b6d4"
          ),
        },
      ],
      history: [{ date: "Start", weight: w, waist, bench1RM: 93, kcal }],
    };

    setPlayers((prev) => [...prev, created]);
    setActiveId(id);
    setCompB(id);
    setShowAddPlayer(false);
    setNewPlayer({ ...newPlayer, name: "" });
  };

  const handleDeletePlayer = (idToDelete) => {
    if (players.length <= 1) {
      alert("W bazie musi zostać przynajmniej 1 osoba.");
      return;
    }
    const remaining = players.filter((p) => p.id !== idToDelete);
    setPlayers(remaining);
    if (activeId === idToDelete) setActiveId(remaining[0].id);
  };

  const getGoalBadgeStyle = (goal) => {
    if (goal.toLowerCase().includes("redukcja"))
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    if (goal.toLowerCase().includes("masa"))
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  };

  return (
    <div
      style={{ fontFamily: font.family }}
      className={`min-h-screen ${theme.bgMain} ${theme.textMain} pb-24 transition-colors duration-300`}
    >
      {/* MODAL POWIĘKSZENIA ZDJĘCIA */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${theme.bgCard} border ${theme.border} rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <div className="font-black text-sm">
                  {lightboxPhoto.playerName}
                </div>
                <div className={`text-xs ${theme.textMuted}`}>
                  {lightboxPhoto.date} • Waga: {lightboxPhoto.weight} kg • Pas:{" "}
                  {lightboxPhoto.waist} cm
                </div>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <Icon name="close" />
              </button>
            </div>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.playerName}
              className="w-full max-h-[65vh] object-contain bg-black"
            />
            <div className="p-4 text-xs space-y-2">
              <div className="font-semibold">{lightboxPhoto.note}</div>
              {lightboxPhoto.aiVision && (
                <div className={`p-3 rounded-xl border ${theme.accentSoft}`}>
                  <div className="font-black uppercase text-[10px] mb-1">
                    Automatyczny Werdykt AI ({lightboxPhoto.aiVision.source}):
                  </div>
                  <p>{lightboxPhoto.aiVision.verdict}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          1. GÓRNY PASEK NAWIGACJI (TYLKO "+ DODAJ OSOBĘ")
      ===================================================================== */}
      <header
        className={`${theme.bgCard} border-b ${theme.border} sticky top-0 z-30`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.accentSoft}`}
            >
              <Icon name="cpu" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase">
                IRON // <span className={theme.accentText}>ARCHIVE</span>
              </h1>
              <p className={`text-xs ${theme.textMuted}`}>
                Zdjęcia Sylwetek (Auto-Ocena 1–10) • Kalkulator CPM • BMI & Kcal
                • DOTS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${theme.border} ${theme.bgSub}`}
            >
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeKey(t.id)}
                  title={t.name}
                  style={{ backgroundColor: t.swatch }}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    themeKey === t.id
                      ? "scale-125 ring-2 ring-white"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border ${theme.border} ${theme.bgSub}`}
            >
              <select
                value={fontKey}
                onChange={(e) => setFontKey(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
              >
                {Object.values(FONTS).map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                    className="bg-slate-900 text-white"
                  >
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${theme.accentBg} ${theme.btnText}`}
            >
              <Icon name="plus" className="w-3.5 h-3.5" /> Dodaj Osobę
            </button>
          </div>
        </div>

        {/* Pasek wyboru aktywnego profilu */}
        <div className={`border-t ${theme.border} ${theme.bgSub}`}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs ${theme.textMuted} mr-1`}>
                Aktywny Gracz:
              </span>
              {enrichedPlayers.map((p) => (
                <div key={p.id} className="inline-flex items-center">
                  <button
                    onClick={() => setActiveId(p.id)}
                    className={`px-3 py-1.5 ${
                      players.length > 1 ? "rounded-l-lg" : "rounded-lg"
                    } text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      activeId === p.id
                        ? `${theme.accentBg} ${theme.btnText} border-transparent shadow-md`
                        : `${theme.bgCard} ${theme.border} ${theme.textMuted} hover:text-white`
                    }`}
                  >
                    <span>{p.name}</span>
                    {pinnedId === p.id && (
                      <Icon name="lock" className="w-3 h-3" />
                    )}
                  </button>
                  {players.length > 1 && (
                    <button
                      onClick={() => handleDeletePlayer(p.id)}
                      title="Usuń profil"
                      className={`px-1.5 py-1.5 rounded-r-lg border-y border-r ${theme.border} ${theme.bgCard} text-slate-500 hover:text-rose-400 text-xs`}
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() =>
                  setPinnedId(pinnedId === activeId ? "" : activeId)
                }
                className={`ml-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${
                  pinnedId === activeId
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : `${theme.border} ${theme.textMuted}`
                }`}
              >
                <Icon
                  name={pinnedId === activeId ? "lock" : "unlock"}
                  className="w-3 h-3"
                />
                {pinnedId === activeId ? "Mój telefon" : "Przypnij"}
              </button>
            </div>

            {currentEnriched && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-2 ${getGoalBadgeStyle(
                    currentEnriched.goal
                  )}`}
                >
                  <Icon name="flame" className="w-3.5 h-3.5" />
                  <span>{currentEnriched.goal}:</span>
                  <strong className="text-sm">
                    {currentEnriched.dietKcal} kcal
                  </strong>
                  <span className="opacity-80">
                    (CPM: {currentEnriched.cpmData.cpm} kcal)
                  </span>
                </div>

                <div
                  className={`px-3 py-1 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}
                >
                  <span className={theme.textMuted}>BMI: </span>
                  <strong className="text-sm">
                    {currentEnriched.bmiData.bmi}
                  </strong>{" "}
                  <span
                    className={`text-[11px] ${currentEnriched.bmiData.tone}`}
                  >
                    ({currentEnriched.bmiData.label})
                  </span>
                </div>

                {!isLocked && (
                  <button
                    onClick={() => setEditingDiet(!editingDiet)}
                    className={`px-2.5 py-1 rounded-lg border ${theme.border} hover:border-cyan-400 text-[11px] font-bold`}
                  >
                    Zmień Cel / Kcal
                  </button>
                )}
              </div>
            )}
          </div>

          {editingDiet && !isLocked && (
            <form
              onSubmit={handleSaveDietProtocol}
              className={`max-w-7xl mx-auto px-4 py-3 border-t ${theme.border} flex flex-wrap items-end gap-3 text-xs`}
            >
              <div>
                <label
                  className={`block mb-1 ${theme.textMuted} font-semibold`}
                >
                  Cel sylwetkowy
                </label>
                <select
                  value={dietDraft.goal}
                  onChange={(e) =>
                    setDietDraft({ ...dietDraft, goal: e.target.value })
                  }
                  className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}
                >
                  <option value="Redukcja">Redukcja</option>
                  <option value="Czysta Masa">Czysta Masa</option>
                  <option value="Masa Siłowa">Masa Siłowa</option>
                  <option value="Rekompozycja">Rekompozycja</option>
                </select>
              </div>
              <div>
                <label
                  className={`block mb-1 ${theme.textMuted} font-semibold`}
                >
                  Ile jesz na tym celu (kcal)
                </label>
                <input
                  type="number"
                  step="50"
                  value={dietDraft.dietKcal}
                  onChange={(e) =>
                    setDietDraft({ ...dietDraft, dietKcal: e.target.value })
                  }
                  className={`w-32 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}
                />
              </div>
              <div>
                <label
                  className={`block mb-1 ${theme.textMuted} font-semibold`}
                >
                  Białko (g)
                </label>
                <input
                  type="number"
                  step="5"
                  value={dietDraft.dietProtein}
                  onChange={(e) =>
                    setDietDraft({ ...dietDraft, dietProtein: e.target.value })
                  }
                  className={`w-28 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}
                />
              </div>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 ${theme.accentBg} ${theme.btnText}`}
              >
                <Icon name="check" className="w-3.5 h-3.5" /> Zapisz
              </button>
            </form>
          )}
        </div>
      </header>

      {/* FORMULARZ DODAWANIA NOWEJ OSOBY */}
      {showAddPlayer && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <form
            onSubmit={handleAddPlayer}
            className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-3 text-xs shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase">
                ➕ Dodaj Nową Osobę do Ekipy
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPlayer(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="col-span-2">
                <label className={`block mb-1 ${theme.textMuted}`}>
                  Imię / Ksywka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Wpisz imię..."
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Cel</label>
                <select
                  value={newPlayer.goal}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, goal: e.target.value })
                  }
                  className={`w-full px-2 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                >
                  <option value="Redukcja">Redukcja</option>
                  <option value="Czysta Masa">Czysta Masa</option>
                  <option value="Masa Siłowa">Masa Siłowa</option>
                  <option value="Rekompozycja">Rekompozycja</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>
                  Ile je Kcal
                </label>
                <input
                  type="number"
                  value={newPlayer.dietKcal}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, dietKcal: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>
                  Wzrost (cm)
                </label>
                <input
                  type="number"
                  value={newPlayer.heightCm}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, heightCm: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>
                  Waga (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPlayer.weight}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, weight: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>
                  Pas (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newPlayer.waist}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, waist: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`w-full py-2 rounded-lg font-black ${theme.accentBg} ${theme.btnText}`}
                >
                  Zapisz Osobę
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          2. ZAKŁADKI GŁÓWNE (WSZYSTKIE 5 ZAKŁADEK)
      ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: "ai_physique", label: "Zdjęcia & Sędzia AI", icon: "camera" },
            { id: "ranking", label: "Tabela Ekipy & 1v1", icon: "users" },
            { id: "cpm", label: "Kalkulator CPM (Kcal)", icon: "activity" },
            { id: "gym", label: "Siłownia & Sztanga", icon: "dumbbell" },
            { id: "charts", label: "Wykresy & DOTS", icon: "chart" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                activeTab === t.id
                  ? `${theme.accentSoft} shadow-md`
                  : `${theme.bgCard} ${theme.border} ${theme.textMuted}`
              }`}
            >
              <Icon name={t.icon} className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ===================================================================
            ZAKŁADKA 1: ZDJĘCIA SYLWETEK & AUTOMATYCZNY SĘDZIA AI (1-10)
        =================================================================== */}
        {activeTab === "ai_physique" && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className={`lg:col-span-4 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 h-fit`}
            >
              <h3 className="text-sm font-black uppercase tracking-wider mb-1 flex items-center gap-2">
                <Icon name="camera" className={`w-4 h-4 ${theme.accentText}`} />
                Dodaj Zdjęcie ({currentEnriched.name})
              </h3>
              <p className={`text-xs ${theme.textMuted} mb-4`}>
                Wybierz zdjęcie – Sędzia AI <strong>automatycznie</strong> oceni
                sylwetkę w skali 1.0–10.0 od razu po wgraniu pliku.
              </p>

              {isLocked ? (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">
                  Przeglądasz profil znajomego. Odblokuj przycisk „Mój telefon”
                  na górze, aby edytować.
                </div>
              ) : (
                <form
                  onSubmit={handleSaveBodyAndPhoto}
                  className="space-y-3 text-xs"
                >
                  <label
                    className={`block border-2 border-dashed ${theme.border} rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors ${theme.bgSub}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectPhotoFile}
                      className="hidden"
                    />
                    {isAnalyzingPhoto ? (
                      <div className="py-8 space-y-2">
                        <Icon
                          name="sparkles"
                          className={`w-8 h-8 mx-auto animate-spin ${theme.accentText}`}
                        />
                        <div className="font-bold text-sm">
                          Sędzia AI skanuje sylwetkę...
                        </div>
                      </div>
                    ) : bodyForm.photoPreview ? (
                      <div className="space-y-2">
                        <img
                          src={bodyForm.photoPreview}
                          alt="Podgląd"
                          className="w-full h-52 object-cover rounded-lg mx-auto"
                        />
                        <span
                          className={`inline-block text-[11px] font-bold ${theme.accentText}`}
                        >
                          Kliknij, aby wybrać inne zdjęcie
                        </span>
                      </div>
                    ) : (
                      <div className="py-5 space-y-1.5">
                        <Icon
                          name="upload"
                          className={`w-7 h-7 mx-auto ${theme.accentText}`}
                        />
                        <div className="font-bold text-sm">
                          Wgraj zdjęcie sylwetki (Auto-Ocena AI)
                        </div>
                        <div className={`text-[11px] ${theme.textMuted}`}>
                          Ocena 1–10 pojawi się natychmiast po wybraniu zdjęcia
                        </div>
                      </div>
                    )}
                  </label>

                  {bodyForm.autoAiResult && (
                    <div
                      className={`p-3.5 rounded-xl border ${theme.accentSoft} space-y-1.5`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase flex items-center gap-1">
                          <Icon name="sparkles" className="w-3.5 h-3.5" />{" "}
                          Automatyczna Ocena AI:
                        </span>
                        <span className="text-lg font-black">
                          {bodyForm.autoAiResult.overall} / 10
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] pt-1">
                        <div>
                          V-Taper:{" "}
                          <strong>{bodyForm.autoAiResult.vScore}</strong>
                        </div>
                        <div>
                          Definicja:{" "}
                          <strong>{bodyForm.autoAiResult.defScore}</strong>
                        </div>
                        <div>
                          Ramiona:{" "}
                          <strong>{bodyForm.autoAiResult.armScore}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] opacity-90">
                        {bodyForm.autoAiResult.verdict}
                      </p>
                      <div className="text-[10px] opacity-75">
                        {bodyForm.autoAiResult.lightingNote}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Waga (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={currentEnriched.currentWeight}
                        value={bodyForm.weight}
                        onChange={(e) =>
                          setBodyForm({ ...bodyForm, weight: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Obwód pasa (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder={currentEnriched.measurements.waist.current}
                        value={bodyForm.waist}
                        onChange={(e) =>
                          setBodyForm({ ...bodyForm, waist: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Biceps (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder={
                          currentEnriched.measurements.biceps.current
                        }
                        value={bodyForm.biceps}
                        onChange={(e) =>
                          setBodyForm({ ...bodyForm, biceps: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Klatka (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder={currentEnriched.measurements.chest.current}
                        value={bodyForm.chest}
                        onChange={(e) =>
                          setBodyForm({ ...bodyForm, chest: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-1 ${theme.textMuted}`}>
                      Komentarz do formy
                    </label>
                    <input
                      type="text"
                      placeholder="np. Rano na czczo"
                      value={bodyForm.note}
                      onChange={(e) =>
                        setBodyForm({ ...bodyForm, note: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 ${theme.accentBg} ${theme.btnText}`}
                  >
                    <Icon name="check" className="w-4 h-4" /> Zapisz Zdjęcie i
                    Ocenę w Bazie
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider">
                Tablica Sylwetek Ekipy ({enrichedPlayers.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {enrichedPlayers.map((p) => {
                  const latestPhoto = p.photos?.[0];
                  return (
                    <div
                      key={p.id}
                      className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg`}
                    >
                      <div className="p-4 flex items-start justify-between gap-2 border-b border-slate-800/60">
                        <div>
                          <h4 className="text-base font-black">{p.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getGoalBadgeStyle(
                                p.goal
                              )}`}
                            >
                              {p.goal} • {p.dietKcal} kcal (CPM: {p.cpmData.cpm}
                              )
                            </span>
                            <span
                              className={`text-[11px] font-bold ${p.bmiData.tone}`}
                            >
                              • BMI {p.bmiData.bmi}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-1.5 rounded-xl border text-right ${theme.accentSoft}`}
                        >
                          <div className="text-[9px] uppercase font-bold">
                            Ocena AI
                          </div>
                          <div className="text-xl font-black leading-none">
                            {p.ai.overall}/10
                          </div>
                        </div>
                      </div>

                      {latestPhoto && (
                        <div
                          onClick={() =>
                            setLightboxPhoto({
                              ...latestPhoto,
                              playerName: p.name,
                            })
                          }
                          className="relative group cursor-pointer bg-black h-72 overflow-hidden"
                        >
                          <img
                            src={latestPhoto.url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white">
                            Powiększ
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 text-xs text-white">
                            <div className="flex justify-between font-bold">
                              <span>{latestPhoto.date}</span>
                              <span>
                                {latestPhoto.weight} kg | Pas:{" "}
                                {latestPhoto.waist} cm | V-Taper: {p.ai.vTaper}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 truncate mt-0.5">
                              {latestPhoto.note}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-3 text-xs">
                        <div
                          className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border ${theme.border} ${theme.bgSub}`}
                        >
                          <div>
                            <span className={theme.textMuted}>
                              Proporcje V-Taper:{" "}
                            </span>
                            <strong>{p.ai.vScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>
                              Definicja (~{p.ai.estBf}% BF):{" "}
                            </span>
                            <strong>{p.ai.defScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>
                              Umięśnienie:{" "}
                            </span>
                            <strong>{p.ai.armScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>
                              Progres formy:{" "}
                            </span>
                            <strong>{p.ai.progScore}/10</strong>
                          </div>
                        </div>
                        <p className={`${theme.textMuted} leading-relaxed`}>
                          {p.ai.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ZAKŁADKA 2: TABELA EKIPY ORAZ POJEDYNEK 1V1
        =================================================================== */}
        {activeTab === "ranking" && (
          <div className="space-y-6">
            <div
              className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 overflow-x-auto`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-black uppercase tracking-wider">
                  Klasyfikacja Ekipy (Zdjęcie, Cel & Kcal vs CPM, BMI, Siła
                  DOTS, Ocena AI)
                </h2>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={theme.textMuted}>Sortuj:</span>
                  {[
                    { id: "ai", label: "Ocena AI (1-10)" },
                    { id: "dots", label: "Siła DOTS" },
                    { id: "total", label: "Trójbój (kg)" },
                    { id: "bmi", label: "BMI" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold border ${
                        sortBy === s.id
                          ? `${theme.accentBg} ${theme.btnText} border-transparent`
                          : `${theme.bgSub} ${theme.border} ${theme.textMuted}`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b ${theme.border} ${theme.textMuted} uppercase text-[11px]`}
                  >
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Zawodnik & Zdjęcie</th>
                    <th className="py-3 px-2">Cel & Spożywane Kcal (vs CPM)</th>
                    <th className="py-3 px-2">Waga & Progres</th>
                    <th className="py-3 px-2">BMI</th>
                    <th className="py-3 px-2">Wymiary & V-Taper</th>
                    <th className="py-3 px-2">Trójbój & DOTS</th>
                    <th className="py-3 px-2 text-right">Sędzia AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedPlayers.map((p, idx) => {
                    const weightDiff = (
                      p.currentWeight - p.startWeight
                    ).toFixed(1);
                    const latestPhoto = p.photos?.[0];
                    const kcalDiff = p.dietKcal - p.cpmData.cpm;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-2 font-black text-sm">
                          {idx + 1}.
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            {latestPhoto && (
                              <img
                                src={latestPhoto.url}
                                alt={p.name}
                                onClick={() =>
                                  setLightboxPhoto({
                                    ...latestPhoto,
                                    playerName: p.name,
                                  })
                                }
                                className="w-11 h-14 object-cover rounded-lg border border-slate-700 cursor-pointer"
                              />
                            )}
                            <div>
                              <div className="font-black text-sm">{p.name}</div>
                              <div className={`text-[11px] ${theme.textMuted}`}>
                                {p.heightCm} cm • {p.age || 22} l.
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getGoalBadgeStyle(
                              p.goal
                            )}`}
                          >
                            {p.goal}
                          </span>
                          <div className="font-black text-sm mt-1">
                            {p.dietKcal} kcal{" "}
                            <span
                              className={`text-[11px] font-normal ${theme.textMuted}`}
                            >
                              (CPM: {p.cpmData.cpm} kcal •{" "}
                              {kcalDiff > 0 ? `+${kcalDiff}` : kcalDiff})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-black text-sm">
                            {p.currentWeight} kg
                          </div>
                          <div className={`text-[11px] ${theme.textMuted}`}>
                            {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
                            od startu
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-black text-sm">
                            BMI {p.bmiData.bmi}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${p.bmiData.tone}`}
                          >
                            {p.bmiData.label}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold">
                            Pas: {p.measurements.waist.current} cm | Bic:{" "}
                            {p.measurements.biceps.current} cm
                          </div>
                          <div
                            className={`text-[11px] ${theme.accentText} font-semibold`}
                          >
                            V-Taper: {p.ai.vTaper}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-black text-sm">
                            {p.stats.dots} DOTS
                          </div>
                          <div className={`text-[11px] ${theme.textMuted}`}>
                            Suma: {p.stats.total1RM} kg
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${theme.accentSoft}`}
                          >
                            <span className="text-base font-black">
                              {p.ai.overall}
                            </span>
                            <span className="text-[10px] opacity-75">/ 10</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Porównanie 1v1 */}
            <div
              className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Icon
                    name="arrows"
                    className={`w-4 h-4 ${theme.accentText}`}
                  />
                  Pojedynek Sylwetek 1v1 (Zdjęcie vs Zdjęcie + Statystyki)
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={compA}
                    onChange={(e) => setCompA(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  >
                    {enrichedPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.goal})
                      </option>
                    ))}
                  </select>
                  <span className="font-black">VS</span>
                  <select
                    value={compB}
                    onChange={(e) => setCompB(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  >
                    {enrichedPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.goal})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const pA =
                  enrichedPlayers.find((p) => p.id === compA) ||
                  enrichedPlayers[0];
                const pB =
                  enrichedPlayers.find((p) => p.id === compB) ||
                  enrichedPlayers[1] ||
                  enrichedPlayers[0];
                const phA = pA.photos?.[0];
                const phB = pB.photos?.[0];

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { p: pA, ph: phA },
                        { p: pB, ph: phB },
                      ].map(({ p, ph }, idx) => (
                        <div
                          key={p.id + idx}
                          className={`rounded-xl border ${theme.border} overflow-hidden bg-black relative`}
                        >
                          {ph && (
                            <img
                              src={ph.url}
                              alt={p.name}
                              onClick={() =>
                                setLightboxPhoto({ ...ph, playerName: p.name })
                              }
                              className="w-full h-64 sm:h-72 object-cover cursor-pointer"
                            />
                          )}
                          <div className="p-3 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-black text-sm text-white">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {p.goal} • {p.dietKcal} kcal • BMI{" "}
                                {p.bmiData.bmi}
                              </div>
                            </div>
                            <div
                              className={`px-2.5 py-1 rounded-lg border font-black ${theme.accentSoft}`}
                            >
                              AI: {p.ai.overall}/10
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {[
                      {
                        label: "Cel, Spożywane Kcal i CPM",
                        valA: `${pA.goal} • ${pA.dietKcal} kcal (CPM: ${pA.cpmData.cpm})`,
                        valB: `${pB.goal} • ${pB.dietKcal} kcal (CPM: ${pB.cpmData.cpm})`,
                      },
                      {
                        label: "Wskaźnik BMI",
                        valA: `BMI ${pA.bmiData.bmi} (${pA.bmiData.label})`,
                        valB: `BMI ${pB.bmiData.bmi} (${pB.bmiData.label})`,
                      },
                      {
                        label: "Ocena Sędziego AI (1-10)",
                        valA: `${pA.ai.overall} / 10 (BF ~${pA.ai.estBf}%)`,
                        valB: `${pB.ai.overall} / 10 (BF ~${pB.ai.estBf}%)`,
                      },
                      {
                        label: "Proporcje V-Taper (Klatka / Pas)",
                        valA: `${pA.ai.vTaper} (${pA.measurements.chest.current}/${pA.measurements.waist.current} cm)`,
                        valB: `${pB.ai.vTaper} (${pB.measurements.chest.current}/${pB.measurements.waist.current} cm)`,
                      },
                      {
                        label: "Siła DOTS & Trójbój",
                        valA: `${pA.stats.dots} DOTS (${pA.stats.total1RM} kg)`,
                        valB: `${pB.stats.dots} DOTS (${pB.stats.total1RM} kg)`,
                      },
                    ].map((r, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-3 items-center p-3 rounded-xl border ${theme.border} ${theme.bgSub} text-xs`}
                      >
                        <div className="font-bold text-left">{r.valA}</div>
                        <div
                          className={`text-center text-[11px] uppercase font-bold ${theme.textMuted}`}
                        >
                          {r.label}
                        </div>
                        <div className="font-bold text-right">{r.valB}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===================================================================
            ZAKŁADKA 3: KALKULATOR CPM (CAŁKOWITEJ PRZEMIANY MATERII)
        =================================================================== */}
        {activeTab === "cpm" && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className={`lg:col-span-5 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-4`}
            >
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Icon
                  name="activity"
                  className={`w-4 h-4 ${theme.accentText}`}
                />
                Kalkulator PPM & CPM ({currentEnriched.name})
              </h3>
              <p className={`text-xs ${theme.textMuted}`}>
                Wzór Mifflina-St Jeora:{" "}
                <code>PPM = 10×masa + 6.25×wzrost - 5×wiek + 5</code>, a{" "}
                <code>CPM = PPM × PAL</code>.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>
                    Płeć
                  </label>
                  <select
                    value={cpmForm.sex}
                    onChange={(e) =>
                      setCpmForm({ ...cpmForm, sex: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  >
                    <option value="M">Mężczyzna</option>
                    <option value="K">Kobieta</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>
                    Wiek
                  </label>
                  <input
                    type="number"
                    value={cpmForm.age}
                    onChange={(e) =>
                      setCpmForm({ ...cpmForm, age: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>
                    Waga (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cpmForm.weight}
                    onChange={(e) =>
                      setCpmForm({ ...cpmForm, weight: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>
                    Wzrost (cm)
                  </label>
                  <input
                    type="number"
                    value={cpmForm.heightCm}
                    onChange={(e) =>
                      setCpmForm({ ...cpmForm, heightCm: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {PAL_LEVELS.map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setCpmForm({ ...cpmForm, pal: item.val })}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      Math.abs(cpmForm.pal - item.val) < 0.01
                        ? `${theme.accentSoft} shadow-sm`
                        : `${theme.bgSub} ${theme.border}`
                    }`}
                  >
                    <div className="font-black text-xs">{item.title}</div>
                    <div className={`text-[11px] ${theme.textMuted} mt-0.5`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`lg:col-span-7 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-5`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase">
                  Twoje Wyliczone Zapotrzebowanie (CPM)
                </h3>
                {cpmSavedBanner && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    ✓ Zapisano w profilu!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub}`}
                >
                  <div
                    className={`text-xs ${theme.textMuted} uppercase font-bold`}
                  >
                    PPM (BMR Spoczynkowe)
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {liveCpmResult.ppm} kcal
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${theme.accentSoft}`}>
                  <div className="text-xs uppercase font-bold">
                    CPM (Zero Kaloryczne / TDEE)
                  </div>
                  <div className="text-3xl font-black mt-1">
                    {liveCpmResult.cpm} kcal
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    goal: "Redukcja",
                    kcal: liveCpmResult.cut,
                    diff: "-400 kcal od CPM",
                  },
                  {
                    goal: "Rekompozycja",
                    kcal: liveCpmResult.recomp,
                    diff: "Równo z CPM (Zero)",
                  },
                  {
                    goal: "Czysta Masa",
                    kcal: liveCpmResult.leanBulk,
                    diff: "+300 kcal nad CPM",
                  },
                  {
                    goal: "Masa Siłowa",
                    kcal: liveCpmResult.powerBulk,
                    diff: "+500 kcal nad CPM",
                  },
                ].map((opt) => (
                  <div
                    key={opt.goal}
                    className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} space-y-2`}
                  >
                    <div className="flex justify-between">
                      <span
                        className={`px-2 py-0.5 rounded font-bold border ${getGoalBadgeStyle(
                          opt.goal
                        )}`}
                      >
                        {opt.goal}
                      </span>
                      <span className={theme.textMuted}>{opt.diff}</span>
                    </div>
                    <div className="text-xl font-black">
                      {opt.kcal} kcal / dzień
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        applyCalculatedCpmToProfile(opt.goal, opt.kcal)
                      }
                      className={`w-full py-2 rounded-lg font-bold border ${theme.border} hover:border-cyan-400`}
                    >
                      Przypisz do profilu ({opt.kcal} kcal)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ZAKŁADKA 4: SIŁOWNIA & KALKULATOR TALERZY (20 KG)
        =================================================================== */}
        {activeTab === "gym" && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div
                className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}
              >
                <h3 className="text-sm font-black uppercase tracking-wider mb-3">
                  Zapisz Rekord / Serię ({currentEnriched.name})
                </h3>
                <form onSubmit={handleSaveLift} className="space-y-3 text-xs">
                  <select
                    value={liftForm.exercise}
                    onChange={(e) =>
                      setLiftForm({ ...liftForm, exercise: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                  >
                    <option value="bench">
                      Wyciskanie leżąc (Bench Press)
                    </option>
                    <option value="squat">Przysiad ze sztangą (Squat)</option>
                    <option value="deadlift">Martwy ciąg (Deadlift)</option>
                    <option value="ohp">Wyciskanie żołnierskie (OHP)</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Ciężar (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={liftForm.weight}
                        onChange={(e) => {
                          setLiftForm({ ...liftForm, weight: e.target.value });
                          setPlateWeight(parseFloat(e.target.value) || 20);
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>
                        Powtórzenia
                      </label>
                      <input
                        type="number"
                        value={liftForm.reps}
                        onChange={(e) =>
                          setLiftForm({ ...liftForm, reps: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-xl font-black ${theme.accentBg} ${theme.btnText}`}
                  >
                    Zapisz Bój i Odpal Stoper (90s)
                  </button>
                </form>
              </div>

              <div
                className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase">
                    Kalkulator Talerzy (Gryf 20 kg)
                  </h4>
                  <input
                    type="number"
                    step="2.5"
                    value={plateWeight}
                    onChange={(e) =>
                      setPlateWeight(parseFloat(e.target.value) || 20)
                    }
                    className={`w-24 px-2 py-1 rounded border ${theme.border} ${theme.bgSub} text-xs font-bold text-right`}
                  />
                </div>
                <div
                  className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} flex items-center justify-center min-h-[90px]`}
                >
                  <div className="w-8 h-3 bg-slate-400 rounded-l" />
                  <div className="w-2 h-8 bg-slate-300 mr-1" />
                  <div className="flex items-center gap-1">
                    {calcPlatesPerSide(plateWeight).map((p, i) => (
                      <div
                        key={i}
                        className={`${p.color} ${p.h} px-1.5 rounded flex items-center justify-center text-[10px] font-black shadow`}
                      >
                        {p.w}
                      </div>
                    ))}
                  </div>
                  <div className="w-6 h-3 bg-slate-400 rounded-r ml-1" />
                </div>
              </div>
            </div>

            <div
              className={`lg:col-span-2 ${theme.bgCard} border ${theme.border} rounded-2xl p-5`}
            >
              <h3 className="text-sm font-black uppercase tracking-wider mb-4">
                Rekordy Siłowe Ekipy (1RM)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "bench", label: "Wyciskanie Leżąc" },
                  { key: "squat", label: "Przysiad ze Sztangą" },
                  { key: "deadlift", label: "Martwy Ciąg" },
                  { key: "ohp", label: "Wyciskanie Żołnierskie (OHP)" },
                ].map((lift) => (
                  <div
                    key={lift.key}
                    className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} space-y-2.5`}
                  >
                    <div className="text-xs font-black uppercase">
                      {lift.label}
                    </div>
                    {enrichedPlayers.map((p) => {
                      const raw = p.lifts[lift.key];
                      const rm = calc1RM(raw.weight, raw.reps);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs border-t border-slate-800/50 pt-2"
                        >
                          <span className="font-bold">{p.name}</span>
                          <div>
                            <span className="font-bold">
                              {raw.weight} kg × {raw.reps}
                            </span>
                            <span
                              className={`ml-2 font-black ${theme.accentText}`}
                            >
                              1RM: {rm} kg
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ZAKŁADKA 5: WYKRESY OSI CZASU & DOTS
        =================================================================== */}
        {activeTab === "charts" && currentEnriched && (
          <div
            className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-5`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase">
                Wykres Progresu – {currentEnriched.name} (DOTS:{" "}
                {currentEnriched.stats.dots})
              </h3>
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: "weight", label: "Waga (kg)" },
                  { id: "waist", label: "Pas (cm)" },
                  { id: "bench1RM", label: "Ławka 1RM (kg)" },
                  { id: "kcal", label: "Kalorie (kcal)" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setChartMetric(m.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      chartMetric === m.id
                        ? `${theme.accentBg} ${theme.btnText} border-transparent`
                        : `${theme.bgSub} ${theme.border} ${theme.textMuted}`
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const hist = currentEnriched.history || [];
              const vals = hist.map((h) => h[chartMetric] || 0);
              const minVal = Math.min(...vals) - 2;
              const maxVal = Math.max(...vals) + 2;
              const width = 700;
              const height = 220;
              const points = hist
                .map((h, i) => {
                  const x =
                    50 + (i / Math.max(1, hist.length - 1)) * (width - 100);
                  const y =
                    height -
                    35 -
                    (((h[chartMetric] || 0) - minVal) /
                      Math.max(1, maxVal - minVal)) *
                      (height - 70);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <div
                  className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} overflow-x-auto`}
                >
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-56"
                  >
                    <polyline
                      fill="none"
                      stroke={theme.swatch}
                      strokeWidth="3.5"
                      points={points}
                    />
                    {hist.map((h, i) => {
                      const x =
                        50 + (i / Math.max(1, hist.length - 1)) * (width - 100);
                      const y =
                        height -
                        35 -
                        (((h[chartMetric] || 0) - minVal) /
                          Math.max(1, maxVal - minVal)) *
                          (height - 70);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill={theme.swatch} />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            fill="currentColor"
                            className="text-[11px] font-bold"
                          >
                            {h[chartMetric]}
                          </text>
                          <text
                            x={x}
                            y={height - 10}
                            textAnchor="middle"
                            fill="#94a3b8"
                            className="text-[10px]"
                          >
                            {h.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Pływający Stoper Przerw */}
      <div className="fixed bottom-4 right-4 z-40">
        <div
          className={`${theme.bgCard} border ${theme.border} rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3`}
        >
          <Icon name="timer" className={`w-4 h-4 ${theme.accentText}`} />
          <div className="text-xs">
            <div
              className={`text-[10px] uppercase font-bold ${theme.textMuted}`}
            >
              Przerwa
            </div>
            <div className="text-base font-black tabular-nums">
              {Math.floor(timerSec / 60)}:
              {String(timerSec % 60).padStart(2, "0")}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`px-2.5 py-1 rounded-lg font-bold ${theme.accentBg} ${theme.btnText}`}
            >
              {timerRunning ? "Pauza" : "Start"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSec(90);
              }}
              className={`px-2 py-1 rounded-lg border ${theme.border}`}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
