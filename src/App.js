import React, { useState, useMemo, useEffect, useRef } from 'react';

const DEFAULT_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://syxtkmwvudpjojhbbjwp.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHRrbXd2dWRwam9qaGJiandwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzUxOTMsImV4cCI6MjEwODYxMTE5M30.drElt0CdI57MGBFQgeawf2zt6VGFbCCSRjGMezKgpZ4';

const Icon = ({ name, className = 'w-4 h-4' }) => {
  const paths = {
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></>,
    camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    dumbbell: <><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    unlock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
    check: <polyline points="20 6 9 17 4 12" />,
    sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    timer: <><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></>,
    arrows: <><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></>,
    refresh: <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></>
  };
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name] || paths.cpu}</svg>;
};

const THEMES = {
  berserk: { id: 'berserk', name: 'Czerwony (Berserk)', swatch: '#e11d48', bgMain: 'bg-neutral-950', bgCard: 'bg-neutral-900', bgSub: 'bg-black/80', textMain: 'text-neutral-100', textMuted: 'text-neutral-400', border: 'border-neutral-800', accentText: 'text-rose-500', accentBg: 'bg-rose-600', accentSoft: 'bg-rose-500/10 border-rose-500/40 text-rose-300', btnText: 'text-white' },
  sovereign: { id: 'sovereign', name: 'Żółty (Sovereign Gold)', swatch: '#f59e0b', bgMain: 'bg-stone-950', bgCard: 'bg-stone-900', bgSub: 'bg-black/80', textMain: 'text-stone-100', textMuted: 'text-stone-400', border: 'border-stone-800', accentText: 'text-amber-400', accentBg: 'bg-amber-500', accentSoft: 'bg-amber-500/10 border-amber-500/40 text-amber-300', btnText: 'text-stone-950' }
};

const CLEAN_MODERN_FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const PAL_LEVELS = [
  { val: 1.2, title: 'PAL 1.20 – Siedzący tryb życia', desc: 'Praca biurowa/szkoła, brak treningów.' },
  { val: 1.375, title: 'PAL 1.38 – Niska aktywność', desc: 'Praca siedząca + 1–2 treningi w tygodniu.' },
  { val: 1.55, title: 'PAL 1.55 – Umiarkowana (Siłownia)', desc: 'Praca lekka + 3–4 treningi w tygodniu.' },
  { val: 1.725, title: 'PAL 1.73 – Wysoka aktywność', desc: '4–5 ciężkich treningów w tygodniu.' },
  { val: 1.9, title: 'PAL 1.90 – Bardzo wysoka', desc: 'Ciężka praca fizyczna + codzienne treningi.' }
];

const createDemoPhysiquePoster = (name, goal, weight, waist, chest, accentHex) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#171717"/><stop offset="100%" stop-color="#0a0a0a"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#bg)"/>
    <circle cx="200" cy="95" r="28" fill="none" stroke="${accentHex}" stroke-width="2.5"/>
    <path d="M125 145 Q200 130 275 145 L255 245 L235 335 L165 335 L145 245 Z" fill="${accentHex}" fill-opacity="0.14" stroke="${accentHex}" stroke-width="2.5"/>
    <text x="200" y="410" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">${name.toUpperCase()}</text>
    <text x="200" y="435" text-anchor="middle" fill="${accentHex}" font-family="sans-serif" font-weight="bold" font-size="13">${goal.toUpperCase()} // ${weight} KG</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const calc1RM = (w, r) => (!w || !r ? 0 : r === 1 ? Math.round(w) : Math.round(w * (1 + r / 30)));

const calcDOTS = (bodyweightKg, totalKg) => {
  if (!bodyweightKg || !totalKg) return 0;
  const bw = Math.min(Math.max(bodyweightKg, 40), 210);
  const a = -0.000001093, b = 0.0007391293, c = -0.1918759221, d = 24.0900756, e = -307.75076;
  const denom = a * Math.pow(bw, 4) + b * Math.pow(bw, 3) + c * Math.pow(bw, 2) + d * bw + e;
  return denom > 0 ? Math.round((500 / denom) * totalKg) : 0;
};

const calcBMIData = (weightKg, heightCm, waistCm) => {
  if (!weightKg || !heightCm) return { bmi: '0.0', label: 'Brak danych', tone: 'text-neutral-400' };
  const hM = heightCm / 100;
  const bmiVal = weightKg / (hM * hM);
  const bmi = bmiVal.toFixed(1);
  const whtr = waistCm ? waistCm / heightCm : 0.5;
  if (bmiVal < 18.5) return { bmi, label: 'Niedowaga', tone: 'text-amber-400' };
  if (bmiVal < 25.0) return { bmi, label: 'Norma', tone: 'text-emerald-400' };
  if (bmiVal >= 25.0 && whtr < 0.48) return { bmi, label: 'Atletyczne', tone: 'text-amber-300' };
  if (bmiVal < 30.0) return { bmi, label: 'Podwyższone', tone: 'text-amber-400' };
  return { bmi, label: 'Wysokie BMI', tone: 'text-rose-400' };
};

const calcCPMData = (weightKg, heightCm, age = 22, sex = 'M', pal = 1.55) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const ppm = Math.round(sex === 'K' ? base - 161 : base + 5);
  const cpm = Math.round(ppm * pal);
  return { ppm, cpm, cut: Math.round(cpm - 400), recomp: cpm, leanBulk: Math.round(cpm + 300), powerBulk: Math.round(cpm + 500) };
};

const calcMacros = (kcal, weightKg, customProtein) => {
  const protein = customProtein || Math.round(weightKg * 2.1);
  const fat = Math.round(weightKg * 0.9);
  const remainingKcal = Math.max(0, kcal - protein * 4 - fat * 9);
  const carbs = Math.round(remainingKcal / 4);
  return { protein, fat, carbs };
};

const evaluatePhysiqueAI = (player, photoIdx = 0) => {
  const photos = player.photos || [];
  const selectedPhoto = photos[photoIdx] || photos[0];
  const prevPhoto = photos[photoIdx + 1];

  const height = player.heightCm || 180;
  const waist = selectedPhoto?.waist || player.measurements?.waist?.current || 85;
  const chest = player.measurements?.chest?.current || 105;
  const biceps = player.measurements?.biceps?.current || 38;

  const vTaper = chest / waist;
  const whtr = waist / height;
  const armToWaist = biceps / waist;

  const bioVScore = Math.min(10, Math.max(3, ((vTaper - 1.12) / (1.42 - 1.12)) * 7 + 3));
  const bioDefScore = Math.min(10, Math.max(3, ((0.55 - whtr) / (0.55 - 0.42)) * 7 + 3));
  const bioArmScore = Math.min(10, Math.max(3, ((armToWaist - 0.40) / (0.53 - 0.40)) * 7 + 3));

  const vScore = selectedPhoto?.aiVision?.vScore ? Number(selectedPhoto.aiVision.vScore).toFixed(1) : bioVScore.toFixed(1);
  const defScore = selectedPhoto?.aiVision?.defScore ? Number(selectedPhoto.aiVision.defScore).toFixed(1) : bioDefScore.toFixed(1);
  const armScore = selectedPhoto?.aiVision?.armScore ? Number(selectedPhoto.aiVision.armScore).toFixed(1) : bioArmScore.toFixed(1);

  const overall = selectedPhoto?.aiVision?.overall ? Number(selectedPhoto.aiVision.overall).toFixed(1) : (parseFloat(vScore) * 0.4 + parseFloat(defScore) * 0.35 + parseFloat(armScore) * 0.25).toFixed(1);

  let progressLabel = 'Zdjęcie bazowe (#1)';
  let progressTone = 'text-neutral-300';
  if (prevPhoto) {
    const prevOverall = prevPhoto?.aiVision?.overall ? Number(prevPhoto.aiVision.overall) : parseFloat(overall);
    const diff = (parseFloat(overall) - prevOverall).toFixed(1);
    const weightDiff = ((selectedPhoto?.weight || player.currentWeight) - (prevPhoto?.weight || player.currentWeight)).toFixed(1);
    if (parseFloat(diff) > 0) {
      progressLabel = `+${diff} pkt (${weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg)`;
      progressTone = 'text-emerald-400';
    } else if (parseFloat(diff) < 0) {
      progressLabel = `${diff} pkt (${weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg)`;
      progressTone = 'text-rose-400';
    } else {
      progressLabel = `0.0 pkt (${weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg)`;
    }
  }

  const estBf = selectedPhoto?.aiVision?.estBf || Math.round(Math.max(9, Math.min(30, (whtr - 0.335) * 140)));
  const fallbackDetailedVerdict = `Mocne strony: Kontrola obwodu pasa (${waist} cm) przy masie ${player.currentWeight} kg | Braki do poprawy: Mała różnica między obwodem klatki a talią, brakuje szerokości najszerszego grzbietu | Plan naprawczy: Dodaj 2x w tygodniu podciąganie oraz wznosy bokiem z hantlami`;

  return {
    overall: parseFloat(overall),
    vScore,
    defScore,
    armScore,
    progressLabel,
    progressTone,
    vTaper: vTaper.toFixed(2),
    whtr: whtr.toFixed(2),
    estBf,
    lightingNote: selectedPhoto?.aiVision?.lightingNote || 'Zweryfikowano biometrycznie',
    summary: selectedPhoto?.aiVision?.verdict || fallbackDetailedVerdict,
    source: selectedPhoto?.aiVision?.source || 'Sędzia Sylwetkowy AI'
  };
};

const autoEvaluateUploadedPhoto = (file, playerContext, zoomFactor = 1.0) => {
  return new Promise((resolve) => {
    const fallbackToLocal = () => {
      const baseEval = evaluatePhysiqueAI(playerContext);
      resolve({
        dataUrl: createDemoPhysiquePoster(playerContext.name || 'Gracz', playerContext.goal || 'Redukcja', playerContext.currentWeight || 84, playerContext.measurements?.waist?.current || 85, playerContext.measurements?.chest?.current || 105, '#e11d48'),
        aiVision: {
          overall: baseEval.overall,
          vScore: parseFloat(baseEval.vScore),
          defScore: parseFloat(baseEval.defScore),
          armScore: parseFloat(baseEval.armScore),
          estBf: baseEval.estBf,
          lightingNote: 'Tryb awaryjny',
          verdict: baseEval.summary,
          source: 'Analizator Biometryczny AI'
        }
      });
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxH = 600;
        const cropW = img.width / zoomFactor;
        const cropH = img.height / zoomFactor;
        const startX = (img.width - cropW) / 2;
        const startY = (img.height - cropH) * 0.42;

        const scale = Math.min(1, maxH / cropH);
        canvas.width = Math.max(1, Math.round(cropW * scale));
        canvas.height = Math.max(1, Math.round(cropH * scale));

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 16000);

        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              imageBase64: dataUrl.split(',')[1],
              player: {
                heightCm: playerContext.heightCm,
                currentWeight: playerContext.currentWeight,
                goal: playerContext.goal,
                waist: playerContext.measurements?.waist?.current,
                chest: playerContext.measurements?.chest?.current,
                biceps: playerContext.measurements?.biceps?.current
              }
            })
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const serverAI = await res.json();
            if (serverAI && serverAI.vScore) {
              const overall = (Number(serverAI.vScore) * 0.4 + Number(serverAI.defScore) * 0.35 + Number(serverAI.armScore) * 0.25).toFixed(1);
              resolve({
                dataUrl,
                aiVision: {
                  vScore: Number(serverAI.vScore).toFixed(1),
                  defScore: Number(serverAI.defScore).toFixed(1),
                  armScore: Number(serverAI.armScore).toFixed(1),
                  estBf: serverAI.estBf || 18,
                  lightingNote: serverAI.lightingNote || 'Zweryfikowano przez Gemini Vision AI',
                  verdict: serverAI.verdict,
                  overall: parseFloat(overall),
                  source: 'Gemini Vision AI (Chmura)'
                }
              });
              return;
            }
          }
        } catch (_) {
          clearTimeout(timeoutId);
        }

        const baseEval = evaluatePhysiqueAI(playerContext);
        resolve({
          dataUrl,
          aiVision: {
            overall: baseEval.overall,
            vScore: parseFloat(baseEval.vScore),
            defScore: parseFloat(baseEval.defScore),
            armScore: parseFloat(baseEval.armScore),
            estBf: baseEval.estBf,
            lightingNote: 'Analiza proporcji zakończona',
            verdict: baseEval.summary,
            source: 'Analizator Biometryczny AI'
          }
        });
      };
      img.onerror = fallbackToLocal;
      img.src = e.target.result;
    };
    reader.onerror = fallbackToLocal;
    reader.readAsDataURL(file);
  });
};

const calcPlatesPerSide = (targetWeight) => {
  const bar = 20;
  const safeTarget = Math.min(500, Number(targetWeight) || 0);
  if (safeTarget <= bar) return [];
  let rem = (safeTarget - bar) / 2;
  const available = [
    { w: 25, color: 'bg-rose-600 text-white', h: 'h-16' },
    { w: 20, color: 'bg-blue-600 text-white', h: 'h-16' },
    { w: 15, color: 'bg-amber-400 text-stone-950', h: 'h-14' },
    { w: 10, color: 'bg-emerald-500 text-stone-950', h: 'h-12' },
    { w: 5, color: 'bg-neutral-200 text-stone-950', h: 'h-10' },
    { w: 2.5, color: 'bg-neutral-700 text-white', h: 'h-9' },
    { w: 1.25, color: 'bg-neutral-500 text-white', h: 'h-8' }
  ];
  const result = [];
  available.forEach((p) => {
    const count = Math.min(10, Math.floor((rem + 0.001) / p.w));
    Array.from({ length: count }).forEach(() => result.push(p));
    rem = Math.round((rem - count * p.w) * 100) / 100;
  });
  return result;
};

const STORAGE_KEY = 'iron_archive_saved_players_final';

const INITIAL_PLAYERS = [
  {
    id: 'p_olek',
    name: 'Olek',
    age: 22,
    sex: 'M',
    pal: 1.55,
    heightCm: 184,
    goal: 'Redukcja',
    dietKcal: 2500,
    dietProtein: 175,
    startWeight: 84.0,
    currentWeight: 84.0,
    measurements: {
      waist: { start: 85.0, current: 85.0 },
      biceps: { start: 38.0, current: 38.0 },
      chest: { start: 105.0, current: 105.0 }
    },
    lifts: {
      bench: { weight: 80.0, reps: 5 },
      squat: { weight: 100.0, reps: 5 },
      deadlift: { weight: 120.0, reps: 5 },
      ohp: { weight: 50.0, reps: 5 }
    },
    photos: [
      {
        id: 'ph_olek',
        date: '28.10.2026',
        weight: 84.0,
        waist: 85.0,
        note: 'Profil startowy.',
        url: createDemoPhysiquePoster('Olek', 'Redukcja', 84.0, 85.0, 105.0, '#e11d48')
      }
    ],
    history: [{ date: 'Start', weight: 84.0, waist: 85.0, bench1RM: 93, kcal: 2500, aiScore: 5.5 }]
  }
];

export default function App() {
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_PLAYERS;
  });

  const [activeId, setActiveId] = useState(() => localStorage.getItem('iron_archive_active_id') || players[0]?.id || 'p_olek');
  const [pinnedId, setPinnedId] = useState(() => localStorage.getItem('iron_archive_pinned') || '');
  const [activeTab, setActiveTab] = useState('ai_physique');
  const [sortBy, setSortBy] = useState('ai');

  const [themeKey, setThemeKey] = useState(() => {
    const savedTheme = localStorage.getItem('iron_archive_theme');
    return savedTheme && THEMES[savedTheme] ? savedTheme : 'berserk';
  });

  const [sbUrl, setSbUrl] = useState(() => DEFAULT_SUPABASE_URL || localStorage.getItem('iron_sb_url') || '');
  const [sbKey, setSbKey] = useState(() => DEFAULT_SUPABASE_KEY || localStorage.getItem('iron_sb_key') || '');
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState(sbUrl && sbKey ? 'Chmura aktywna' : 'Tylko lokalnie');

  const [photoIdxMap, setPhotoIdxMap] = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [compA, setCompA] = useState(() => players[0]?.id || 'p_olek');
  const [compB, setCompB] = useState(() => players[1]?.id || players[0]?.id || 'p_olek');

  const [editingDiet, setEditingDiet] = useState(false);
  const [dietDraft, setDietDraft] = useState({ goal: 'Redukcja', dietKcal: 2500, dietProtein: 175 });

  const [cpmForm, setCpmForm] = useState({ sex: 'M', age: 22, weight: 84.0, heightCm: 184, pal: 1.55 });
  const [cpmSavedBanner, setCpmSavedBanner] = useState(false);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', age: '22', heightCm: '180', goal: 'Redukcja', dietKcal: '2400', dietProtein: '170', weight: '82', waist: '85', biceps: '38', chest: '105' });

  const [rawPhotoFile, setRawPhotoFile] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [bodyForm, setBodyForm] = useState({ weight: '', waist: '', biceps: '', chest: '', note: '', photoPreview: null, autoAiResult: null });
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const [liftForm, setLiftForm] = useState({ exercise: 'bench', weight: '100', reps: '5' });
  const [plateWeight, setPlateWeight] = useState(100);
  const [chartMetric, setChartMetric] = useState('weight');

  const [timerSec, setTimerSec] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const theme = THEMES[themeKey] || THEMES.berserk;
  const activePlayer = players.find((p) => p.id === activeId) || players[0];
  const isLocked = Boolean(pinnedId && pinnedId !== activePlayer?.id);

  useEffect(() => { localStorage.setItem('iron_archive_theme', themeKey); }, [themeKey]);
  useEffect(() => { if (activeId) localStorage.setItem('iron_archive_active_id', activeId); }, [activeId]);
  useEffect(() => { localStorage.setItem('iron_archive_pinned', pinnedId || ''); }, [pinnedId]);

  const savePlayersPermanently = async (updater) => {
    let optimisticNext = [];
    setPlayers((prev) => {
      optimisticNext = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(optimisticNext)); } catch (_) {}
      return optimisticNext;
    });

    if (!sbUrl || !sbKey) {
      setCloudSyncStatus('Zapisano w przeglądarce');
      return;
    }

    setCloudSyncStatus('Zapisywanie...');
    try {
      let mergedToSave = optimisticNext;
      const getRes = await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/squad_state?id=eq.1&select=players`, {
        headers: { apikey: sbKey.trim(), Authorization: `Bearer ${sbKey.trim()}` }
      });
      if (getRes.ok) {
        const cloudData = await getRes.json();
        const cloudPlayers = cloudData?.[0]?.players;
        if (Array.isArray(cloudPlayers) && cloudPlayers.length > 0 && typeof updater === 'function') {
          mergedToSave = updater(cloudPlayers);
          setPlayers(mergedToSave);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedToSave)); } catch (_) {}
        }
      }

      const postRes = await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/squad_state?on_conflict=id`, {
        method: 'POST',
        headers: { apikey: sbKey.trim(), Authorization: `Bearer ${sbKey.trim()}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 1, players: mergedToSave, updated_at: new Date().toISOString() })
      });
      setCloudSyncStatus(postRes.ok ? 'Chmura OK' : 'Błąd tabeli Supabase');
    } catch (_) {
      setCloudSyncStatus('Zapis lokalny');
    }
  };

  const fetchCloudStateManual = async () => {
    if (!sbUrl || !sbKey) {
      setCloudSyncStatus('Tylko lokalnie');
      return;
    }
    setCloudSyncStatus('Pobieranie...');
    try {
      const res = await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/squad_state?id=eq.1&select=players`, {
        headers: { apikey: sbKey.trim(), Authorization: `Bearer ${sbKey.trim()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]?.players && Array.isArray(data[0].players) && data[0].players.length > 0) {
          setPlayers(data[0].players);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data[0].players)); } catch (_) {}
          setCloudSyncStatus('Chmura OK');
        } else {
          setCloudSyncStatus('Chmura pusta');
        }
      } else {
        setCloudSyncStatus('Błąd klucza SB');
      }
    } catch (_) {
      setCloudSyncStatus('Tryb lokalny');
    }
  };

  useEffect(() => { fetchCloudStateManual(); }, [sbUrl, sbKey]);

  // ==========================================================================
  // EKSPORT I IMPORT CAŁEJ BAZY DO PLIKU .JSON (KOPIA ZAPASOWA EKIPY)
  // ==========================================================================
  const handleExportDatabase = () => {
    try {
      const backupPayload = {
        version: 'IronArchive_v1',
        exportedAt: new Date().toISOString(),
        players
      };
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `iron-archive-baza-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {
      alert('Nie udało się wyeksportować pliku bazy.');
    }
  };

  const handleImportDatabase = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedPlayers = Array.isArray(parsed) ? parsed : parsed?.players;
        if (!Array.isArray(importedPlayers) || importedPlayers.length === 0) {
          alert('Ten plik nie zawiera poprawnej listy zawodników.');
          return;
        }
        savePlayersPermanently(importedPlayers);
        setActiveId(importedPlayers[0].id);
        alert(`Zaimportowano pomyślnie bazę (${importedPlayers.length} osób)!`);
      } catch (_) {
        alert('Błąd odczytu pliku .json – upewnij się, że wybierasz pobrany wcześniej plik kopii zapasowej.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveCloudConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('iron_sb_url', sbUrl.trim());
    localStorage.setItem('iron_sb_key', sbKey.trim());
    setShowCloudModal(false);
    fetchCloudStateManual();
  };

  useEffect(() => {
    const linkId = 'iron-archive-clean-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSec((prev) => (prev <= 1 ? (setTimerRunning(false), 0) : prev - 1));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    if (activePlayer) {
      setDietDraft({ goal: activePlayer.goal, dietKcal: activePlayer.dietKcal, dietProtein: activePlayer.dietProtein });
      setCpmForm({ sex: activePlayer.sex || 'M', age: activePlayer.age || 22, weight: activePlayer.currentWeight, heightCm: activePlayer.heightCm, pal: activePlayer.pal || 1.55 });
    }
  }, [activePlayer?.id, activePlayer?.goal, activePlayer?.dietKcal, activePlayer?.pal]);

  const enrichedPlayers = useMemo(() => {
    return players.map((p) => {
      const bench1RM = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps);
      const squat1RM = calc1RM(p.lifts.squat.weight, p.lifts.squat.reps);
      const deadlift1RM = calc1RM(p.lifts.deadlift.weight, p.lifts.deadlift.reps);
      const ohp1RM = calc1RM(p.lifts.ohp.weight, p.lifts.ohp.reps);
      const total1RM = bench1RM + squat1RM + deadlift1RM;
      const dots = calcDOTS(p.currentWeight, total1RM);
      const bmiData = calcBMIData(p.currentWeight, p.heightCm, p.measurements.waist.current);
      const cpmData = calcCPMData(p.currentWeight, p.heightCm, p.age || 22, p.sex || 'M', p.pal || 1.55);
      const macros = calcMacros(p.dietKcal, p.currentWeight, p.dietProtein);
      const ai = evaluatePhysiqueAI(p, 0);
      return { ...p, stats: { bench1RM, squat1RM, deadlift1RM, ohp1RM, total1RM, dots }, bmiData, cpmData, macros, ai };
    });
  }, [players]);

  const sortedPlayers = useMemo(() => {
    const copy = [...enrichedPlayers];
    if (sortBy === 'ai') return copy.sort((a, b) => b.ai.overall - a.ai.overall);
    if (sortBy === 'dots') return copy.sort((a, b) => b.stats.dots - a.stats.dots);
    if (sortBy === 'total') return copy.sort((a, b) => b.stats.total1RM - a.stats.total1RM);
    if (sortBy === 'bmi') return copy.sort((a, b) => parseFloat(a.bmiData.bmi) - parseFloat(b.bmiData.bmi));
    return copy;
  }, [enrichedPlayers, sortBy]);

  const currentEnriched = enrichedPlayers.find((p) => p.id === activeId) || enrichedPlayers[0];

  const liveCpmResult = useMemo(() => {
    const w = parseFloat(cpmForm.weight) || currentEnriched.currentWeight;
    const h = parseFloat(cpmForm.heightCm) || currentEnriched.heightCm;
    const a = parseInt(cpmForm.age, 10) || 22;
    const p = parseFloat(cpmForm.pal) || 1.55;
    return calcCPMData(w, h, a, cpmForm.sex, p);
  }, [cpmForm, currentEnriched]);

  const runPhotoAnalysis = async (fileToScan, zoomToUse) => {
    if (!fileToScan) return;
    setIsAnalyzingPhoto(true);
    try {
      const tempContext = {
        ...activePlayer,
        currentWeight: parseFloat(bodyForm.weight) || activePlayer.currentWeight,
        measurements: {
          waist: { ...activePlayer.measurements.waist, current: parseFloat(bodyForm.waist) || activePlayer.measurements.waist.current },
          biceps: { ...activePlayer.measurements.biceps, current: parseFloat(bodyForm.biceps) || activePlayer.measurements.biceps.current },
          chest: { ...activePlayer.measurements.chest, current: parseFloat(bodyForm.chest) || activePlayer.measurements.chest.current }
        }
      };

      const evaluated = await autoEvaluateUploadedPhoto(fileToScan, tempContext, zoomToUse);
      setBodyForm((prev) => ({ ...prev, photoPreview: evaluated.dataUrl, autoAiResult: evaluated.aiVision }));
    } catch (_) {
      alert('Nie udało się przeanalizować zdjęcia.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSelectPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawPhotoFile(file);
    await runPhotoAnalysis(file, photoZoom);
  };

  const handleChangeZoom = async (newZoom) => {
    setPhotoZoom(newZoom);
    if (rawPhotoFile) {
      await runPhotoAnalysis(rawPhotoFile, newZoom);
    }
  };

  const handleSaveBodyAndPhoto = (e) => {
    e.preventDefault();
    if (isLocked) return;

    const w = parseFloat(bodyForm.weight) || activePlayer.currentWeight;
    const waist = parseFloat(bodyForm.waist) || activePlayer.measurements.waist.current;
    const biceps = parseFloat(bodyForm.biceps) || activePlayer.measurements.biceps.current;
    const chest = parseFloat(bodyForm.chest) || activePlayer.measurements.chest.current;

    const updatedPlayerTemp = {
      ...activePlayer,
      currentWeight: w,
      measurements: {
        waist: { ...activePlayer.measurements.waist, current: waist },
        biceps: { ...activePlayer.measurements.biceps, current: biceps },
        chest: { ...activePlayer.measurements.chest, current: chest }
      }
    };

    const photoUrl = bodyForm.photoPreview || createDemoPhysiquePoster(activePlayer.name, activePlayer.goal, w, waist, chest, theme.swatch);
    const localEval = evaluatePhysiqueAI(updatedPlayerTemp, 0);

    const finalAiVision = {
      overall: bodyForm.autoAiResult?.overall || localEval.overall,
      vScore: bodyForm.autoAiResult?.vScore || parseFloat(localEval.vScore),
      defScore: bodyForm.autoAiResult?.defScore || parseFloat(localEval.defScore),
      armScore: bodyForm.autoAiResult?.armScore || parseFloat(localEval.armScore),
      estBf: bodyForm.autoAiResult?.estBf || localEval.estBf,
      lightingNote: bodyForm.autoAiResult?.lightingNote || 'Zweryfikowano',
      verdict: bodyForm.autoAiResult?.verdict || localEval.summary,
      source: bodyForm.autoAiResult?.source || localEval.source
    };

    const todayStr = new Date().toLocaleDateString('pl-PL');
    const newPhotoEntry = {
      id: 'ph_' + Date.now(),
      date: todayStr,
      weight: w,
      waist,
      note: bodyForm.note || `Aktualizacja sylwetki (${activePlayer.goal} • ${activePlayer.dietKcal} kcal)`,
      url: photoUrl,
      aiVision: finalAiVision
    };

    savePlayersPermanently((prev) =>
      prev.map((p) => {
        if (p.id !== activeId) return p;
        const bench1RM = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps);
        return {
          ...p,
          currentWeight: w,
          measurements: {
            waist: { ...p.measurements.waist, current: waist },
            biceps: { ...p.measurements.biceps, current: biceps },
            chest: { ...p.measurements.chest, current: chest }
          },
          photos: [newPhotoEntry, ...(p.photos || [])],
          history: [
            ...(p.history || []),
            { date: todayStr.slice(0, 5), weight: w, waist, bench1RM, kcal: p.dietKcal, aiScore: Number(finalAiVision.overall) }
          ]
        };
      })
    );

    setPhotoIdxMap((prev) => ({ ...prev, [activeId]: 0 }));
    setRawPhotoFile(null);
    setBodyForm({ weight: '', waist: '', biceps: '', chest: '', note: '', photoPreview: null, autoAiResult: null });
  };

  const handleDeletePhoto = (playerId, photoId) => {
    if (pinnedId && pinnedId !== playerId) return;
    const targetPlayer = players.find((p) => p.id === playerId);
    if (!targetPlayer || (targetPlayer.photos || []).length <= 1) {
      alert('W profilu musi zostać przynajmniej 1 zdjęcie bazowe.');
      return;
    }

    savePlayersPermanently((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const filteredPhotos = p.photos.filter((ph) => ph.id !== photoId);
        return { ...p, photos: filteredPhotos };
      })
    );
    setPhotoIdxMap((prev) => ({ ...prev, [playerId]: 0 }));
  };

  const applyCalculatedCpmToProfile = (selectedGoalName, targetKcalValue) => {
    if (isLocked) return;
    const w = parseFloat(cpmForm.weight) || activePlayer.currentWeight;
    const h = parseInt(cpmForm.heightCm, 10) || activePlayer.heightCm;
    const a = parseInt(cpmForm.age, 10) || 22;
    const palVal = parseFloat(cpmForm.pal) || 1.55;
    const recommendedProtein = Math.round(w * 2.1);

    savePlayersPermanently((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, age: a, sex: cpmForm.sex, pal: palVal, currentWeight: w, heightCm: h, goal: selectedGoalName, dietKcal: targetKcalValue, dietProtein: recommendedProtein } : p))
    );
    setCpmSavedBanner(true);
    setTimeout(() => setCpmSavedBanner(false), 3000);
  };

  const handleSaveDietProtocol = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const newKcal = parseInt(dietDraft.dietKcal, 10) || activePlayer.dietKcal;
    const newProt = parseInt(dietDraft.dietProtein, 10) || activePlayer.dietProtein;

    savePlayersPermanently((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, goal: dietDraft.goal, dietKcal: newKcal, dietProtein: newProt } : p))
    );
    setEditingDiet(false);
  };

  const handleSaveLift = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const w = parseFloat(liftForm.weight);
    const r = parseInt(liftForm.reps, 10);
    if (!w || !r) return;

    savePlayersPermanently((prev) =>
      prev.map((p) => (p.id !== activeId ? p : { ...p, lifts: { ...p.lifts, [liftForm.exercise]: { weight: w, reps: r } } }))
    );
    setPlateWeight(w);
    setTimerSec(90);
    setTimerRunning(true);
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;
    const id = 'p_' + Date.now().toString().slice(-5);
    const w = parseFloat(newPlayer.weight) || 80;
    const waist = parseFloat(newPlayer.waist) || 84;
    const bic = parseFloat(newPlayer.biceps) || 38;
    const chest = parseFloat(newPlayer.chest) || 104;
    const kcal = parseInt(newPlayer.dietKcal, 10) || 2400;

    const created = {
      id,
      name: newPlayer.name.trim(),
      age: parseInt(newPlayer.age, 10) || 22,
      sex: 'M',
      pal: 1.55,
      heightCm: parseInt(newPlayer.heightCm, 10) || 180,
      goal: newPlayer.goal,
      dietKcal: kcal,
      dietProtein: parseInt(newPlayer.dietProtein, 10) || Math.round(w * 2.1),
      startWeight: w,
      currentWeight: w,
      measurements: { waist: { start: waist, current: waist }, biceps: { start: bic, current: bic }, chest: { start: chest, current: chest } },
      lifts: { bench: { weight: 80, reps: 5 }, squat: { weight: 100, reps: 5 }, deadlift: { weight: 120, reps: 5 }, ohp: { weight: 50, reps: 5 } },
      photos: [{ id: 'ph_' + id, date: new Date().toLocaleDateString('pl-PL'), weight: w, waist, note: 'Profil startowy.', url: createDemoPhysiquePoster(newPlayer.name.trim(), newPlayer.goal, w, waist, chest, theme.swatch) }],
      history: [{ date: 'Start', weight: w, waist, bench1RM: 93, kcal, aiScore: 5.5 }]
    };

    savePlayersPermanently((prev) => [...prev, created]);
    setActiveId(id);
    setCompB(id);
    setShowAddPlayer(false);
    setNewPlayer({ name: '', age: '22', heightCm: '180', goal: 'Redukcja', dietKcal: '2400', dietProtein: '170', weight: '82', waist: '85', biceps: '38', chest: '105' });
  };

  const handleDeletePlayer = (idToDelete) => {
    if (players.length <= 1) {
      alert('W bazie musi zostać przynajmniej 1 osoba.');
      return;
    }
    const remaining = players.filter((p) => p.id !== idToDelete);
    savePlayersPermanently(remaining);
    if (activeId === idToDelete) setActiveId(remaining[0].id);
  };

  const getGoalBadgeStyle = (goal) => {
    if (goal.toLowerCase().includes('redukcja')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (goal.toLowerCase().includes('masa')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div style={{ fontFamily: CLEAN_MODERN_FONT }} className={`min-h-screen ${theme.bgMain} ${theme.textMain} pb-24 transition-colors duration-300`}>
      {/* MODAL POWIĘKSZENIA ZDJĘCIA */}
      {lightboxPhoto && (
        <div onClick={() => setLightboxPhoto(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className={`${theme.bgCard} border ${theme.border} rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div>
                <div className="font-black text-sm">{lightboxPhoto.playerName}</div>
                <div className={`text-xs ${theme.textMuted}`}>{lightboxPhoto.date} • Waga: {lightboxPhoto.weight} kg • Pas: {lightboxPhoto.waist} cm</div>
              </div>
              <button onClick={() => setLightboxPhoto(null)} className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"><Icon name="close" /></button>
            </div>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.playerName} className="w-full max-h-[65vh] object-contain bg-black" />
            <div className="p-4 text-xs space-y-2">
              <div className="font-semibold">{lightboxPhoto.note}</div>
              {lightboxPhoto.aiVision && (
                <div className={`p-3 rounded-xl border ${theme.accentSoft} space-y-1`}>
                  <div className="font-black uppercase text-[10px]">Szczegółowa Ocena Sylwetki ({lightboxPhoto.aiVision.source}):</div>
                  {String(lightboxPhoto.aiVision.verdict).split(' | ').map((part, i) => (<p key={i} className="leading-relaxed">{part}</p>))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL USTAWIEŃ CHMURY SUPABASE */}
      {showCloudModal && (
        <div onClick={() => setShowCloudModal(false)} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSaveCloudConfig} className={`${theme.bgCard} border ${theme.border} rounded-2xl max-w-md w-full p-5 space-y-4 text-xs shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <Icon name="database" className={`w-4 h-4 ${theme.accentText}`} />
                Połączenie z bazą Supabase
              </h3>
              <button type="button" onClick={() => setShowCloudModal(false)} className="text-neutral-400 hover:text-white"><Icon name="close" /></button>
            </div>
            <p className={theme.textMuted}>
              Wklej swój Project URL oraz klucz <code>anon public</code> z Supabase, aby dane zapisywały się w chmurze dla wszystkich 5 osób.
            </p>
            <div>
              <label className="block mb-1 font-bold">Supabase Project URL</label>
              <input type="text" placeholder="https://xxxx.supabase.co" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
            </div>
            <div>
              <label className="block mb-1 font-bold">Supabase Anon Public Key</label>
              <input type="password" placeholder="eyJhbGciOiJIUzI1NiIs..." value={sbKey} onChange={(e) => setSbKey(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className={`px-4 py-2 rounded-xl font-black ${theme.accentBg} ${theme.btnText}`}>Zapisz i Synchronizuj</button>
            </div>
          </form>
        </div>
      )}

      <header className={`${theme.bgCard} border-b ${theme.border} sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.accentSoft}`}><Icon name="cpu" className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">IRON // <span className={theme.accentText}>ARCHIVE</span></h1>
              <p className={`text-xs ${theme.textMuted}`}>Zdjęcia Sylwetek (Gemini Vision AI) • Makro & CPM • Kopia Bazy JSON</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PRZYCISKI EKSPORTU I IMPORTU BAZY DANYCH (.JSON) */}
            <button
              type="button"
              onClick={handleExportDatabase}
              title="Pobierz całą bazę ekipy do pliku .json na dysk"
              className={`px-2.5 py-1.5 rounded-xl border ${theme.border} ${theme.bgSub} text-[11px] font-bold flex items-center gap-1.5 hover:border-emerald-500 text-emerald-400`}
            >
              <Icon name="download" className="w-3.5 h-3.5" />
              <span>Eksport Bazy (.json)</span>
            </button>

            <label
              title="Wgraj wcześniej zapisany plik .json z bazą ekipy"
              className={`px-2.5 py-1.5 rounded-xl border ${theme.border} ${theme.bgSub} text-[11px] font-bold flex items-center gap-1.5 hover:border-amber-400 text-amber-300 cursor-pointer`}
            >
              <Icon name="upload" className="w-3.5 h-3.5" />
              <span>Import Bazy</span>
              <input type="file" accept=".json,application/json" onChange={handleImportDatabase} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              title="Ustawienia połączenia z chmurą Supabase"
              className={`px-2.5 py-1.5 rounded-xl border ${theme.border} ${theme.bgSub} text-[11px] font-bold flex items-center gap-1.5 hover:border-neutral-600`}
            >
              <Icon name="database" className={`w-3.5 h-3.5 ${cloudSyncStatus === 'Chmura OK' ? 'text-emerald-400' : theme.accentText}`} />
              <span>{cloudSyncStatus}</span>
            </button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme.border} ${theme.bgSub}`}>
              <span className={`text-[11px] font-semibold ${theme.textMuted}`}>Kolor:</span>
              {Object.values(THEMES).map((t) => (
                <button key={t.id} onClick={() => setThemeKey(t.id)} title={t.name} style={{ backgroundColor: t.swatch }} className={`w-4 h-4 rounded-full transition-transform ${themeKey === t.id ? 'scale-125 ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`} />
              ))}
            </div>

            <button onClick={() => setShowAddPlayer(!showAddPlayer)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${theme.accentBg} ${theme.btnText}`}>
              <Icon name="plus" className="w-3.5 h-3.5" /> Dodaj Osobę
            </button>
          </div>
        </div>

        <div className={`border-t ${theme.border} ${theme.bgSub}`}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs ${theme.textMuted} mr-1`}>Aktywny Gracz:</span>
              {enrichedPlayers.map((p) => (
                <div key={p.id} className="inline-flex items-center">
                  <button onClick={() => setActiveId(p.id)} className={`px-3 py-1.5 ${players.length > 1 ? 'rounded-l-lg' : 'rounded-lg'} text-xs font-bold transition-all flex items-center gap-1.5 border ${activeId === p.id ? `${theme.accentBg} ${theme.btnText} border-transparent shadow-md` : `${theme.bgCard} ${theme.border} ${theme.textMuted} hover:text-white`}`}>
                    <span>{p.name}</span>
                    {pinnedId === p.id && <Icon name="lock" className="w-3 h-3" />}
                  </button>
                  {players.length > 1 && (
                    <button onClick={() => handleDeletePlayer(p.id)} title="Usuń" className={`px-1.5 py-1.5 rounded-r-lg border-y border-r ${theme.border} ${theme.bgCard} text-neutral-500 hover:text-rose-400 text-xs`}><Icon name="trash" className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setPinnedId(pinnedId === activeId ? '' : activeId)} className={`ml-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${pinnedId === activeId ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : `${theme.border} ${theme.textMuted}`}`}>
                <Icon name={pinnedId === activeId ? 'lock' : 'unlock'} className="w-3 h-3" />
                {pinnedId === activeId ? 'Mój telefon' : 'Przypnij'}
              </button>
            </div>

            {currentEnriched && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-2 ${getGoalBadgeStyle(currentEnriched.goal)}`}>
                  <Icon name="flame" className="w-3.5 h-3.5" />
                  <span>{currentEnriched.goal}:</span>
                  <strong className="text-sm">{currentEnriched.dietKcal} kcal</strong>
                  <span className="opacity-80">(CPM: {currentEnriched.cpmData.cpm})</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border ${theme.border} ${theme.bgCard} text-[11px] font-bold`}>
                  <span className="text-rose-400">B: {currentEnriched.macros.protein}g</span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span className="text-amber-400">T: {currentEnriched.macros.fat}g</span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span className="text-emerald-400">W: {currentEnriched.macros.carbs}g</span>
                </div>
                <div className={`px-3 py-1 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}>
                  <span className={theme.textMuted}>BMI: </span>
                  <strong className="text-sm">{currentEnriched.bmiData.bmi}</strong>
                </div>
                {!isLocked && (
                  <button onClick={() => setEditingDiet(!editingDiet)} className={`px-2.5 py-1 rounded-lg border ${theme.border} hover:border-rose-500 text-[11px] font-bold`}>
                    Zmień Cel / Kcal
                  </button>
                )}
              </div>
            )}
          </div>

          {editingDiet && !isLocked && (
            <form onSubmit={handleSaveDietProtocol} className={`max-w-7xl mx-auto px-4 py-3 border-t ${theme.border} flex flex-wrap items-end gap-3 text-xs`}>
              <div>
                <label className={`block mb-1 ${theme.textMuted} font-semibold`}>Cel sylwetkowy</label>
                <select value={dietDraft.goal} onChange={(e) => setDietDraft({ ...dietDraft, goal: e.target.value })} className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`}>
                  <option value="Redukcja">Redukcja</option>
                  <option value="Rekompozycja">Rekompozycja</option>
                  <option value="Czysta Masa">Czysta Masa</option>
                  <option value="Masa Siłowa">Masa Siłowa</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted} font-semibold`}>Kalorie (kcal)</label>
                <input type="number" step="50" value={dietDraft.dietKcal} onChange={(e) => setDietDraft({ ...dietDraft, dietKcal: e.target.value })} className={`w-32 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`} />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted} font-semibold`}>Białko (g)</label>
                <input type="number" step="5" value={dietDraft.dietProtein} onChange={(e) => setDietDraft({ ...dietDraft, dietProtein: e.target.value })} className={`w-28 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgCard} font-bold`} />
              </div>
              <button type="submit" className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 ${theme.accentBg} ${theme.btnText}`}>
                <Icon name="check" className="w-3.5 h-3.5" /> Zapisz na stałe
              </button>
            </form>
          )}
        </div>
      </header>

      {showAddPlayer && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <form onSubmit={handleAddPlayer} className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-3 text-xs shadow-xl`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase">➕ Dodaj Osobę</h3>
              <button type="button" onClick={() => setShowAddPlayer(false)} className="text-neutral-400 hover:text-white"><Icon name="close" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="col-span-2">
                <label className={`block mb-1 ${theme.textMuted}`}>Imię *</label>
                <input type="text" required placeholder="Imię..." value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Cel</label>
                <select value={newPlayer.goal} onChange={(e) => setNewPlayer({ ...newPlayer, goal: e.target.value })} className={`w-full px-2 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`}>
                  <option value="Redukcja">Redukcja</option>
                  <option value="Rekompozycja">Rekompozycja</option>
                  <option value="Czysta Masa">Czysta Masa</option>
                  <option value="Masa Siłowa">Masa Siłowa</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Kcal</label>
                <input type="number" value={newPlayer.dietKcal} onChange={(e) => setNewPlayer({ ...newPlayer, dietKcal: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Wzrost (cm)</label>
                <input type="number" value={newPlayer.heightCm} onChange={(e) => setNewPlayer({ ...newPlayer, heightCm: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Waga (kg)</label>
                <input type="number" step="0.1" value={newPlayer.weight} onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
              </div>
              <div>
                <label className={`block mb-1 ${theme.textMuted}`}>Pas (cm)</label>
                <input type="number" step="0.5" value={newPlayer.waist} onChange={(e) => setNewPlayer({ ...newPlayer, waist: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
              </div>
              <div className="flex items-end">
                <button type="submit" className={`w-full py-2 rounded-lg font-black ${theme.accentBg} ${theme.btnText}`}>Zapisz</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'ai_physique', label: 'Zdjęcia & Sędzia AI', icon: 'camera' },
            { id: 'ranking', label: 'Tabela Ekipy & 1v1', icon: 'users' },
            { id: 'cpm', label: 'Kalkulator CPM & Makro', icon: 'activity' },
            { id: 'gym', label: 'Siłownia & Sztanga', icon: 'dumbbell' },
            { id: 'charts', label: 'Wykresy & DOTS', icon: 'chart' }
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? `${theme.accentSoft} shadow-md` : `${theme.bgCard} ${theme.border} ${theme.textMuted}`}`}>
              <Icon name={t.icon} className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ZAKŁADKA 1: ZDJĘCIA & SĘDZIA AI */}
        {activeTab === 'ai_physique' && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-4 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 h-fit`}>
              <h3 className="text-sm font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                <Icon name="camera" className={`w-4 h-4 ${theme.accentText}`} />
                Dodaj Zdjęcie ({currentEnriched.name})
              </h3>
              <p className={`text-xs ${theme.textMuted} mb-3`}>
                Wybierz zdjęcie – Sędzia AI oceni sylwetkę i wskaże braki.
              </p>

              {isLocked ? (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">
                  Przeglądasz profil znajomego. Odblokuj przycisk „Mój telefon” na górze.
                </div>
              ) : (
                <form onSubmit={handleSaveBodyAndPhoto} className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-semibold ${theme.textMuted}`}>Kadr dla AI:</span>
                    <div className="flex gap-1">
                      {[
                        { val: 1.0, label: '1.0x (Całe)' },
                        { val: 1.4, label: '1.4x (Tors)' },
                        { val: 1.8, label: '1.8x (Blisko)' }
                      ].map((z) => (
                        <button
                          type="button"
                          key={z.val}
                          onClick={() => handleChangeZoom(z.val)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${Math.abs(photoZoom - z.val) < 0.05 ? `${theme.accentBg} ${theme.btnText} border-transparent` : `${theme.bgSub} ${theme.border} ${theme.textMuted}`}`}
                        >
                          {z.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className={`block border-2 border-dashed ${theme.border} rounded-xl p-4 text-center cursor-pointer hover:border-rose-500 transition-colors ${theme.bgSub}`}>
                    <input type="file" accept="image/*" onChange={handleSelectPhotoFile} className="hidden" />
                    {isAnalyzingPhoto ? (
                      <div className="py-8 space-y-2">
                        <Icon name="sparkles" className={`w-8 h-8 mx-auto animate-spin ${theme.accentText}`} />
                        <div className="font-bold text-sm">Gemini Vision AI analizuje sylwetkę...</div>
                      </div>
                    ) : bodyForm.photoPreview ? (
                      <div className="space-y-2">
                        <img src={bodyForm.photoPreview} alt="Podgląd" className="w-full h-56 object-cover rounded-lg mx-auto" />
                        <span className={`inline-block text-[11px] font-bold ${theme.accentText}`}>Kliknij, aby wybrać inne zdjęcie</span>
                      </div>
                    ) : (
                      <div className="py-5 space-y-1.5">
                        <Icon name="upload" className={`w-7 h-7 mx-auto ${theme.accentText}`} />
                        <div className="font-bold text-sm">Wgraj zdjęcie sylwetki</div>
                        <div className={`text-[11px] ${theme.textMuted}`}>Ocena AI 1-10 + analiza braków</div>
                      </div>
                    )}
                  </label>

                  {bodyForm.autoAiResult && (
                    <div className={`p-3.5 rounded-xl border ${theme.accentSoft} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase flex items-center gap-1"><Icon name="sparkles" className="w-3.5 h-3.5" /> {bodyForm.autoAiResult.source}:</span>
                        <span className="text-lg font-black">{bodyForm.autoAiResult.overall} / 10</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] pt-1">
                        <div>V-Taper: <strong>{bodyForm.autoAiResult.vScore}</strong></div>
                        <div>Definicja (~{bodyForm.autoAiResult.estBf}%): <strong>{bodyForm.autoAiResult.defScore}</strong></div>
                        <div>Ramiona: <strong>{bodyForm.autoAiResult.armScore}</strong></div>
                      </div>
                      <div className="text-[11px] leading-relaxed space-y-1 pt-1 border-t border-white/10">
                        {String(bodyForm.autoAiResult.verdict).split(' | ').map((part, idx) => (<p key={idx}>{part}</p>))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Waga (kg)</label>
                      <input type="number" step="0.1" placeholder={currentEnriched.currentWeight} value={bodyForm.weight} onChange={(e) => setBodyForm({ ...bodyForm, weight: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Pas (cm)</label>
                      <input type="number" step="0.5" placeholder={currentEnriched.measurements.waist.current} value={bodyForm.waist} onChange={(e) => setBodyForm({ ...bodyForm, waist: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Biceps (cm)</label>
                      <input type="number" step="0.5" placeholder={currentEnriched.measurements.biceps.current} value={bodyForm.biceps} onChange={(e) => setBodyForm({ ...bodyForm, biceps: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Klatka (cm)</label>
                      <input type="number" step="0.5" placeholder={currentEnriched.measurements.chest.current} value={bodyForm.chest} onChange={(e) => setBodyForm({ ...bodyForm, chest: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-1 ${theme.textMuted}`}>Komentarz</label>
                    <input type="text" placeholder="np. Rano na czczo" value={bodyForm.note} onChange={(e) => setBodyForm({ ...bodyForm, note: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub}`} />
                  </div>

                  <button type="submit" className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 ${theme.accentBg} ${theme.btnText}`}>
                    <Icon name="check" className="w-4 h-4" /> Zapisz Zdjęcie w Bazie
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tight">Tablica Sylwetek Ekipy ({enrichedPlayers.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {enrichedPlayers.map((p) => {
                  const totalPhotos = (p.photos || []).length;
                  const currIdx = Math.min(photoIdxMap[p.id] || 0, Math.max(0, totalPhotos - 1));
                  const displayedPhoto = p.photos?.[currIdx] || p.photos?.[0];
                  const photoEval = evaluatePhysiqueAI(p, currIdx);
                  const verdictParts = String(displayedPhoto?.aiVision?.verdict || photoEval.summary).split(' | ');

                  return (
                    <div key={p.id} className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg`}>
                      <div className="p-4 flex items-start justify-between gap-2 border-b border-neutral-800">
                        <div>
                          <h4 className="text-base font-black">{p.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getGoalBadgeStyle(p.goal)}`}>
                              {p.goal} • {p.dietKcal} kcal (CPM: {p.cpmData.cpm})
                            </span>
                            <span className={`text-[11px] font-bold ${p.bmiData.tone}`}>• BMI {p.bmiData.bmi}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border text-right ${theme.accentSoft}`}>
                          <div className="text-[9px] uppercase font-bold">Ocena AI</div>
                          <div className="text-xl font-black leading-none">{photoEval.overall}/10</div>
                        </div>
                      </div>

                      {displayedPhoto && (
                        <div className="relative group bg-black h-72 overflow-hidden">
                          <img src={displayedPhoto.url} alt={p.name} onClick={() => setLightboxPhoto({ ...displayedPhoto, playerName: p.name })} className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300" />
                          {totalPhotos > 1 && (
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-[11px] font-bold text-white">
                              <button type="button" disabled={currIdx >= totalPhotos - 1} onClick={() => setPhotoIdxMap((prev) => ({ ...prev, [p.id]: Math.min(totalPhotos - 1, currIdx + 1) }))} className="px-1.5 hover:text-rose-400 disabled:opacity-30">◀</button>
                              <span>{totalPhotos - currIdx} z {totalPhotos}</span>
                              <button type="button" disabled={currIdx <= 0} onClick={() => setPhotoIdxMap((prev) => ({ ...prev, [p.id]: Math.max(0, currIdx - 1) }))} className="px-1.5 hover:text-rose-400 disabled:opacity-30">▶</button>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {totalPhotos > 1 && (!pinnedId || pinnedId === p.id) && (
                              <button type="button" onClick={() => handleDeletePhoto(p.id, displayedPhoto.id)} title="Usuń" className="bg-rose-600/90 hover:bg-rose-500 p-1.5 rounded-lg text-white"><Icon name="trash" className="w-3.5 h-3.5" /></button>
                            )}
                            <button type="button" onClick={() => setLightboxPhoto({ ...displayedPhoto, playerName: p.name })} className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white">Powiększ</button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 text-xs text-white">
                            <div className="flex justify-between font-bold">
                              <span>{displayedPhoto.date}</span>
                              <span>{displayedPhoto.weight} kg | Pas: {displayedPhoto.waist} cm | V-Taper: {photoEval.vTaper}</span>
                            </div>
                            <div className="text-[11px] text-neutral-300 truncate mt-0.5">{displayedPhoto.note}</div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-3 text-xs">
                        <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border ${theme.border} ${theme.bgSub}`}>
                          <div>
                            <span className={theme.textMuted}>V-Taper: </span>
                            <strong>{photoEval.vScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>Definicja (~{photoEval.estBf}%): </span>
                            <strong>{photoEval.defScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>Umięśnienie: </span>
                            <strong>{photoEval.armScore}/10</strong>
                          </div>
                          <div>
                            <span className={theme.textMuted}>Progres AI: </span>
                            <strong className={photoEval.progressTone}>{photoEval.progressLabel}</strong>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className={`text-[10px] font-black uppercase ${theme.accentText}`}>Analiza i Braki ({photoEval.source}):</div>
                          {verdictParts.map((part, idx) => (<p key={idx} className={`${theme.textMuted} leading-relaxed`}>{part}</p>))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ZAKŁADKA 2: TABELA EKIPY & POJEDYNEK 1V1 */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 overflow-x-auto`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-black uppercase tracking-tight">Klasyfikacja Ekipy</h2>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={theme.textMuted}>Sortuj:</span>
                  {[
                    { id: 'ai', label: 'Ocena AI' },
                    { id: 'dots', label: 'Siła DOTS' },
                    { id: 'total', label: 'Trójbój' },
                    { id: 'bmi', label: 'BMI' }
                  ].map((s) => (
                    <button key={s.id} onClick={() => setSortBy(s.id)} className={`px-2.5 py-1 rounded-lg font-bold border ${sortBy === s.id ? `${theme.accentBg} ${theme.btnText} border-transparent` : `${theme.bgSub} ${theme.border} ${theme.textMuted}`}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${theme.border} ${theme.textMuted} uppercase text-[11px]`}>
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Zawodnik</th>
                    <th className="py-3 px-2">Cel & Makro</th>
                    <th className="py-3 px-2">Waga</th>
                    <th className="py-3 px-2">BMI & BF%</th>
                    <th className="py-3 px-2">Wymiary & V-Taper</th>
                    <th className="py-3 px-2">DOTS & Trójbój</th>
                    <th className="py-3 px-2 text-right">Sędzia AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {sortedPlayers.map((p, idx) => {
                    const latestPhoto = p.photos?.[0];
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2 font-black text-sm">{idx + 1}.</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            {latestPhoto && <img src={latestPhoto.url} alt={p.name} onClick={() => setLightboxPhoto({ ...latestPhoto, playerName: p.name })} className="w-11 h-14 object-cover rounded-lg border border-neutral-700 cursor-pointer" />}
                            <div>
                              <div className="font-black text-sm">{p.name}</div>
                              <div className={`text-[11px] ${theme.textMuted}`}>{p.heightCm} cm</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${getGoalBadgeStyle(p.goal)}`}>{p.goal} • {p.dietKcal} kcal</span>
                          <div className={`text-[11px] mt-1 ${theme.textMuted}`}>B:{p.macros.protein}g T:{p.macros.fat}g W:{p.macros.carbs}g</div>
                        </td>
                        <td className="py-3 px-2 font-black text-sm">{p.currentWeight} kg</td>
                        <td className="py-3 px-2">
                          <div className="font-black text-sm">BMI {p.bmiData.bmi}</div>
                          <div className={`text-[11px] ${p.bmiData.tone}`}>~{p.ai.estBf}% BF</div>
                        </td>
                        <td className="py-3 px-2 font-bold">Pas: {p.measurements.waist.current}cm | V: {p.ai.vTaper}</td>
                        <td className="py-3 px-2">
                          <div className="font-black text-sm">{p.stats.dots} DOTS</div>
                          <div className={`text-[11px] ${theme.textMuted}`}>Suma: {p.stats.total1RM} kg</div>
                        </td>
                        <td className="py-3 px-2 text-right font-black text-sm">{p.ai.overall}/10</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* POJEDYNEK 1V1 */}
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                  <Icon name="arrows" className={`w-4 h-4 ${theme.accentText}`} />
                  Pojedynek Sylwetek 1v1
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <select value={compA} onChange={(e) => setCompA(e.target.value)} className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}>
                    {enrichedPlayers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                  <span className="font-black">VS</span>
                  <select value={compB} onChange={(e) => setCompB(e.target.value)} className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}>
                    {enrichedPlayers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
              </div>

              {(() => {
                const pA = enrichedPlayers.find((p) => p.id === compA) || enrichedPlayers[0];
                const pB = enrichedPlayers.find((p) => p.id === compB) || enrichedPlayers[1] || enrichedPlayers[0];
                const phA = pA.photos?.[0];
                const phB = pB.photos?.[0];

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[{ p: pA, ph: phA }, { p: pB, ph: phB }].map(({ p, ph }, idx) => (
                        <div key={p.id + idx} className={`rounded-xl border ${theme.border} overflow-hidden bg-black`}>
                          {ph && <img src={ph.url} alt={p.name} onClick={() => setLightboxPhoto({ ...ph, playerName: p.name })} className="w-full h-64 object-cover cursor-pointer" />}
                          <div className="p-3 bg-neutral-950 flex items-center justify-between text-xs">
                            <span className="font-black text-white">{p.name} ({p.currentWeight} kg)</span>
                            <span className={`px-2 py-0.5 rounded border font-black ${theme.accentSoft}`}>AI: {p.ai.overall}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ZAKŁADKA 3: KALKULATOR CPM & MAKRO (4 WARIANTY) */}
        {activeTab === 'cpm' && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-5 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-4`}>
              <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Icon name="activity" className={`w-4 h-4 ${theme.accentText}`} />
                Kalkulator PPM, CPM & Makro ({currentEnriched.name})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>Płeć</label>
                  <select value={cpmForm.sex} onChange={(e) => setCpmForm({ ...cpmForm, sex: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}>
                    <option value="M">Mężczyzna</option>
                    <option value="K">Kobieta</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>Wiek</label>
                  <input type="number" value={cpmForm.age} onChange={(e) => setCpmForm({ ...cpmForm, age: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>Waga (kg)</label>
                  <input type="number" step="0.1" value={cpmForm.weight} onChange={(e) => setCpmForm({ ...cpmForm, weight: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
                </div>
                <div>
                  <label className={`block mb-1 ${theme.textMuted}`}>Wzrost (cm)</label>
                  <input type="number" value={cpmForm.heightCm} onChange={(e) => setCpmForm({ ...cpmForm, heightCm: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {PAL_LEVELS.map((item) => (
                  <button type="button" key={item.val} onClick={() => setCpmForm({ ...cpmForm, pal: item.val })} className={`w-full text-left p-3 rounded-xl border transition-all ${Math.abs(cpmForm.pal - item.val) < 0.01 ? `${theme.accentSoft}` : `${theme.bgSub} ${theme.border}`}`}>
                    <div className="font-black text-xs">{item.title}</div>
                    <div className={`text-[11px] ${theme.textMuted}`}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`lg:col-span-7 ${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-5`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase">CPM i 4 Warianty Celu</h3>
                {cpmSavedBanner && <span className="text-emerald-400 text-xs font-bold">✓ Zapisano w profilu!</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub}`}>
                  <div className={`text-xs ${theme.textMuted} uppercase font-bold`}>PPM (Spoczynkowe)</div>
                  <div className="text-2xl font-black mt-1">{liveCpmResult.ppm} kcal</div>
                </div>
                <div className={`p-4 rounded-xl border ${theme.accentSoft}`}>
                  <div className="text-xs uppercase font-bold">CPM (Zero Kaloryczne)</div>
                  <div className="text-3xl font-black mt-1">{liveCpmResult.cpm} kcal</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { goal: 'Redukcja', kcal: liveCpmResult.cut, diff: '-400 kcal od CPM' },
                  { goal: 'Rekompozycja', kcal: liveCpmResult.recomp, diff: 'Równo z CPM (Zero)' },
                  { goal: 'Czysta Masa', kcal: liveCpmResult.leanBulk, diff: '+300 kcal nad CPM' },
                  { goal: 'Masa Siłowa', kcal: liveCpmResult.powerBulk, diff: '+500 kcal nad CPM' }
                ].map((opt) => {
                  const m = calcMacros(opt.kcal, parseFloat(cpmForm.weight) || currentEnriched.currentWeight);
                  return (
                    <div key={opt.goal} className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} space-y-2`}>
                      <div className="flex justify-between">
                        <span className={`px-2 py-0.5 rounded font-bold border ${getGoalBadgeStyle(opt.goal)}`}>{opt.goal}</span>
                        <span className={theme.textMuted}>{opt.diff}</span>
                      </div>
                      <div className="text-xl font-black">{opt.kcal} kcal / dzień</div>
                      <div className="text-[11px] text-neutral-300">B: {m.protein}g • T: {m.fat}g • W: {m.carbs}g</div>
                      <button type="button" onClick={() => applyCalculatedCpmToProfile(opt.goal, opt.kcal)} className={`w-full py-2 rounded-lg font-bold border ${theme.border} hover:border-rose-500`}>Ustaw w profilu</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ZAKŁADKA 4: SIŁOWNIA & SZTANGA */}
        {activeTab === 'gym' && currentEnriched && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}>
                <h3 className="text-sm font-black uppercase tracking-tight mb-3">Zapisz Rekord / Serię ({currentEnriched.name})</h3>
                <form onSubmit={handleSaveLift} className="space-y-3 text-xs">
                  <select value={liftForm.exercise} onChange={(e) => setLiftForm({ ...liftForm, exercise: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`}>
                    <option value="bench">Wyciskanie leżąc (Bench Press)</option>
                    <option value="squat">Przysiad ze sztangą (Squat)</option>
                    <option value="deadlift">Martwy ciąg (Deadlift)</option>
                    <option value="ohp">Wyciskanie żołnierskie (OHP)</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Ciężar (kg)</label>
                      <input type="number" step="0.5" value={liftForm.weight} onChange={(e) => { setLiftForm({ ...liftForm, weight: e.target.value }); setPlateWeight(parseFloat(e.target.value) || 20); }} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
                    </div>
                    <div>
                      <label className={`block mb-1 ${theme.textMuted}`}>Powtórzenia</label>
                      <input type="number" value={liftForm.reps} onChange={(e) => setLiftForm({ ...liftForm, reps: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgSub} font-bold`} />
                    </div>
                  </div>
                  <button type="submit" className={`w-full py-2.5 rounded-xl font-black ${theme.accentBg} ${theme.btnText}`}>Zapisz Bój i Odpal Stoper (90s)</button>
                </form>
              </div>

              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase">Kalkulator Talerzy (Gryf 20 kg)</h4>
                  <input type="number" step="2.5" value={plateWeight} onChange={(e) => setPlateWeight(parseFloat(e.target.value) || 20)} className={`w-24 px-2 py-1 rounded border ${theme.border} ${theme.bgSub} text-xs font-bold text-right`} />
                </div>
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} flex items-center justify-center min-h-[90px]`}>
                  <div className="w-8 h-3 bg-neutral-400 rounded-l" />
                  <div className="w-2 h-8 bg-neutral-300 mr-1" />
                  <div className="flex items-center gap-1">
                    {calcPlatesPerSide(plateWeight).map((p, i) => (
                      <div key={i} className={`${p.color} ${p.h} px-1.5 rounded flex items-center justify-center text-[10px] font-black shadow`}>{p.w}</div>
                    ))}
                  </div>
                  <div className="w-6 h-3 bg-neutral-400 rounded-r ml-1" />
                </div>
              </div>
            </div>

            <div className={`lg:col-span-2 ${theme.bgCard} border ${theme.border} rounded-2xl p-5`}>
              <h3 className="text-sm font-black uppercase tracking-tight mb-4">Rekordy Siłowe Ekipy (1RM)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'bench', label: 'Wyciskanie Leżąc' },
                  { key: 'squat', label: 'Przysiad ze Sztangą' },
                  { key: 'deadlift', label: 'Martwy Ciąg' },
                  { key: 'ohp', label: 'Wyciskanie Żołnierskie (OHP)' }
                ].map((lift) => (
                  <div key={lift.key} className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} space-y-2.5`}>
                    <div className="text-xs font-black uppercase">{lift.label}</div>
                    {enrichedPlayers.map((p) => {
                      const raw = p.lifts[lift.key];
                      const rm = calc1RM(raw.weight, raw.reps);
                      return (
                        <div key={p.id} className="flex items-center justify-between text-xs border-t border-neutral-800 pt-2">
                          <span className="font-bold">{p.name}</span>
                          <div>
                            <span className="font-bold">{raw.weight} kg × {raw.reps}</span>
                            <span className={`ml-2 font-black ${theme.accentText}`}>1RM: {rm} kg</span>
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

        {/* ZAKŁADKA 5: WYKRESY & DOTS */}
        {activeTab === 'charts' && currentEnriched && (
          <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-5 space-y-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase">Wykres Progresu – {currentEnriched.name} (DOTS: {currentEnriched.stats.dots})</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'weight', label: 'Waga (kg)' },
                  { id: 'waist', label: 'Pas (cm)' },
                  { id: 'aiScore', label: 'Ocena AI (1-10)' },
                  { id: 'bench1RM', label: 'Ławka 1RM (kg)' },
                  { id: 'kcal', label: 'Kalorie (kcal)' }
                ].map((m) => (
                  <button key={m.id} onClick={() => setChartMetric(m.id)} className={`px-3 py-1.5 rounded-lg font-bold border ${chartMetric === m.id ? `${theme.accentBg} ${theme.btnText} border-transparent` : `${theme.bgSub} ${theme.border} ${theme.textMuted}`}`}>{m.label}</button>
                ))}
              </div>
            </div>

            {(() => {
              const hist = currentEnriched.history || [];
              const vals = hist.map((h) => Number(h[chartMetric]) || currentEnriched.ai.overall || 0);
              const minVal = Math.min(...vals) - 1;
              const maxVal = Math.max(...vals) + 1;
              const width = 700;
              const height = 220;
              const points = hist
                .map((h, i) => {
                  const val = Number(h[chartMetric]) || currentEnriched.ai.overall || 0;
                  const x = 50 + (i / Math.max(1, hist.length - 1)) * (width - 100);
                  const y = height - 35 - ((val - minVal) / Math.max(1, maxVal - minVal)) * (height - 70);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgSub} overflow-x-auto`}>
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
                    <polyline fill="none" stroke={theme.swatch} strokeWidth="3.5" points={points} />
                    {hist.map((h, i) => {
                      const val = Number(h[chartMetric]) || currentEnriched.ai.overall || 0;
                      const x = 50 + (i / Math.max(1, hist.length - 1)) * (width - 100);
                      const y = height - 35 - ((val - minVal) / Math.max(1, maxVal - minVal)) * (height - 70);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill={theme.swatch} />
                          <text x={x} y={y - 12} textAnchor="middle" fill="currentColor" className="text-[11px] font-bold">{val}</text>
                          <text x={x} y={height - 10} textAnchor="middle" fill="#a3a3a3" className="text-[10px]">{h.date}</text>
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

      <div className="fixed bottom-4 right-4 z-40">
        <div className={`${theme.bgCard} border ${theme.border} rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3`}>
          <Icon name="timer" className={`w-4 h-4 ${theme.accentText}`} />
          <div className="text-xs">
            <div className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Przerwa</div>
            <div className="text-base font-black tabular-nums">{Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}</div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => setTimerRunning(!timerRunning)} className={`px-2.5 py-1 rounded-lg font-bold ${theme.accentBg} ${theme.btnText}`}>{timerRunning ? 'Pauza' : 'Start'}</button>
            <button onClick={() => { setTimerRunning(false); setTimerSec(90); }} className={`px-2 py-1 rounded-lg border ${theme.border}`}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
