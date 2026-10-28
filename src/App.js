import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

/* ============================================================================
   IRON // ARCHIVE
   - motyw oparty o zmienne CSS (płynne przejścia kolorów)
   - Wywiad kaloryczny zamiast prostego kalkulatora CPM
   - Zapis: "local-first" (localStorage) + Supabase, jeden wiersz na zawodnika,
     scalanie zmian, widoczne błędy synchronizacji
   ========================================================================== */

const DEFAULT_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://syxtkmwvudpjojhbbjwp.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHRrbXd2dWRwam9qaGJiandwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzUxOTMsImV4cCI6MjEwODYxMTE5M30.drElt0CdI57MGBFQgeawf2zt6VGFbCCSRjGMezKgpZ4';

const STORAGE_KEY = 'iron_archive_saved_players_final';
const PENDING_DEL_KEY = 'iron_archive_pending_delete';
const THEME_KEY = 'iron_archive_theme_v2';

/* ------------------------------ SQL do Supabase ------------------------------ */
const SETUP_SQL = `-- Uruchom RAZ: Supabase -> SQL Editor -> New query -> wklej -> Run
create table if not exists public.squad_players (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.squad_players enable row level security;

drop policy if exists "squad_players_anon_all" on public.squad_players;
create policy "squad_players_anon_all"
  on public.squad_players
  for all
  to anon
  using (true)
  with check (true);

grant select, insert, update, delete on public.squad_players to anon;

-- opcjonalnie: odczyt starej tabeli (jednorazowa migracja danych)
do $$
begin
  if to_regclass('public.squad_state') is not null then
    execute 'alter table public.squad_state enable row level security';
    execute 'drop policy if exists "squad_state_anon_read" on public.squad_state';
    execute 'create policy "squad_state_anon_read" on public.squad_state for select to anon using (true)';
    execute 'grant select on public.squad_state to anon';
  end if;
end $$;`;

/* --------------------------------- Ikony --------------------------------- */
const ICONS = {
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
  refresh: <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></>,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  settings: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>
};

const Icon = ({ name, className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {ICONS[name] || ICONS.cpu}
  </svg>
);

/* --------------------------------- Motywy --------------------------------- */
const THEMES = {
  volt: { id: 'volt', name: 'Volt', swatch: '#a3e635', ac: '163 230 53', ac2: '45 212 191', on: '14 20 4' },
  ice: { id: 'ice', name: 'Ice', swatch: '#22d3ee', ac: '34 211 238', ac2: '129 140 248', on: '2 20 26' },
  gold: { id: 'gold', name: 'Gold', swatch: '#fbbf24', ac: '251 191 36', ac2: '251 146 60', on: '28 17 0' },
  crimson: { id: 'crimson', name: 'Crimson', swatch: '#f43f5e', ac: '244 63 94', ac2: '251 146 60', on: '255 255 255' }
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ----------------------------------- CSS ----------------------------------- */
const STYLES = `
.ia-root{min-height:100vh;background:#09090b;color:#f4f4f5;position:relative;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.ia-aurora{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.ia-blob{position:absolute;border-radius:9999px;filter:blur(100px);animation:ia-float 22s ease-in-out infinite;transition:background .6s ease}
.ia-blob.a{width:560px;height:560px;top:-220px;left:-140px;background:rgb(var(--ac)/.20)}
.ia-blob.b{width:480px;height:480px;top:35%;right:-180px;background:rgb(var(--ac2)/.14);animation-delay:-7s}
.ia-blob.c{width:520px;height:520px;bottom:-260px;left:25%;background:rgb(var(--ac)/.09);animation-delay:-12s}
.ia-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%);mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%)}
.ia-z{position:relative;z-index:1}

.ia-glass{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.08);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 12px 32px -14px rgba(0,0,0,.7)}
.ia-card{border-radius:1.25rem;transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .3s}
.ia-lift:hover{transform:translateY(-3px);border-color:rgb(var(--ac)/.35);box-shadow:0 20px 44px -18px rgb(var(--ac)/.4)}
.ia-sub{background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.07);transition:border-color .2s,background .2s,transform .2s}
.ia-muted{color:rgba(244,244,245,.56)}
.ia-faint{color:rgba(244,244,245,.38)}
.ia-accent{color:rgb(var(--ac));transition:color .4s}
.ia-accent-bg{background:rgb(var(--ac));color:rgb(var(--on));transition:background .4s,color .4s,transform .15s,box-shadow .25s,filter .2s}
.ia-accent-bg:hover{filter:brightness(1.08);box-shadow:0 10px 28px -10px rgb(var(--ac)/.8)}
.ia-grad{background:linear-gradient(135deg,rgb(var(--ac)),rgb(var(--ac2)));color:rgb(var(--on))}
.ia-grad-text{background:linear-gradient(135deg,rgb(var(--ac)),rgb(var(--ac2)));-webkit-background-clip:text;background-clip:text;color:transparent}
.ia-soft{background:rgb(var(--ac)/.10);border:1px solid rgb(var(--ac)/.32);color:rgb(var(--ac));transition:all .3s}

.ia-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.55rem .95rem;border-radius:.8rem;font-weight:800;font-size:.78rem;cursor:pointer;transition:all .2s;white-space:nowrap}
.ia-btn:active{transform:scale(.95)}
.ia-btn:disabled{opacity:.4;cursor:not-allowed;filter:none;box-shadow:none}
.ia-ghost{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#e4e4e7}
.ia-ghost:hover{border-color:rgb(var(--ac)/.55);background:rgba(255,255,255,.075)}
.ia-danger:hover{border-color:rgba(244,63,94,.6);color:#fb7185}

.ia-input{width:100%;background:rgba(0,0,0,.38);border:1px solid rgba(255,255,255,.1);border-radius:.8rem;padding:.55rem .8rem;color:#fff;font-size:.85rem;font-weight:600;outline:none;transition:border-color .2s,box-shadow .2s}
.ia-input:focus{border-color:rgb(var(--ac)/.75);box-shadow:0 0 0 3px rgb(var(--ac)/.16)}
.ia-input::placeholder{color:rgba(255,255,255,.28);font-weight:500}
select.ia-input option{background:#18181b;color:#fff}
.ia-label{display:block;font-size:.72rem;font-weight:700;color:rgba(244,244,245,.58);margin-bottom:.35rem}

.ia-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:9999px;outline:none;cursor:pointer}
.ia-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:9999px;background:rgb(var(--ac));border:4px solid #09090b;box-shadow:0 0 0 2px rgb(var(--ac)/.55);transition:transform .15s}
.ia-range::-webkit-slider-thumb:hover{transform:scale(1.15)}
.ia-range::-moz-range-thumb{width:16px;height:16px;border-radius:9999px;background:rgb(var(--ac));border:4px solid #09090b;box-shadow:0 0 0 2px rgb(var(--ac)/.55)}

.ia-seg{display:flex;padding:3px;border-radius:.9rem;background:rgba(0,0,0,.38);border:1px solid rgba(255,255,255,.08);gap:2px}
.ia-seg button{flex:1;padding:.45rem .75rem;border-radius:.7rem;font-size:.74rem;font-weight:800;color:rgba(244,244,245,.6);transition:all .25s;white-space:nowrap}
.ia-seg button:hover{color:#fff}
.ia-seg button.on{background:rgb(var(--ac));color:rgb(var(--on));box-shadow:0 6px 16px -8px rgb(var(--ac)/.9)}


.ia-header{background:rgba(9,9,11,.62);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.07)}
.ia-tab{padding:.5rem .9rem;border-radius:.9rem;font-weight:800;font-size:.76rem;color:rgba(244,244,245,.6);transition:all .25s;display:flex;gap:.45rem;align-items:center;white-space:nowrap}
.ia-tab:hover{color:#fff;background:rgba(255,255,255,.05)}
.ia-tab.on{background:rgb(var(--ac)/.14);color:rgb(var(--ac));box-shadow:inset 0 0 0 1px rgb(var(--ac)/.35)}
.ia-nav-m{position:fixed;left:10px;right:10px;bottom:10px;z-index:40;border-radius:1.4rem;display:flex;padding:6px;gap:2px}
.ia-nav-m button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:.45rem 0;border-radius:1rem;font-size:.6rem;font-weight:800;color:rgba(244,244,245,.5);transition:all .25s}
.ia-nav-m button.on{background:rgb(var(--ac)/.15);color:rgb(var(--ac))}
.ia-chip{display:inline-flex;align-items:center;gap:.45rem;padding:.3rem .8rem .3rem .35rem;border-radius:9999px;font-size:.76rem;font-weight:800;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:rgba(244,244,245,.75);transition:all .25s;white-space:nowrap;flex-shrink:0}
.ia-chip:hover{border-color:rgb(var(--ac)/.5);color:#fff}
.ia-chip.on{background:rgb(var(--ac)/.15);border-color:rgb(var(--ac)/.55);color:rgb(var(--ac))}

.ia-scroll{scrollbar-width:none}
.ia-scroll::-webkit-scrollbar{display:none}
.ia-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:80;padding:.6rem 1rem;border-radius:9999px;font-size:.78rem;font-weight:800;animation:ia-drop .4s cubic-bezier(.2,.9,.3,1.2) both;max-width:92vw;text-align:center}

@keyframes ia-float{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(46px,34px,0) scale(1.1)}}
@keyframes ia-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes ia-fade{from{opacity:0}to{opacity:1}}
@keyframes ia-pop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:none}}
@keyframes ia-drop{from{opacity:0;transform:translate(-50%,-14px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes ia-sl{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
@keyframes ia-sr{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
@keyframes ia-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ia-spin{to{transform:rotate(360deg)}}
@keyframes ia-bump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
@keyframes ia-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes ia-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.ia-up{animation:ia-up .55s cubic-bezier(.2,.8,.2,1) both}
.ia-fade{animation:ia-fade .3s ease both}
.ia-pop{animation:ia-pop .4s cubic-bezier(.2,.9,.3,1.1) both}
.ia-sl{animation:ia-sl .4s cubic-bezier(.2,.8,.2,1) both}
.ia-sr{animation:ia-sr .4s cubic-bezier(.2,.8,.2,1) both}
.ia-pulse{animation:ia-pulse 1.4s ease-in-out infinite}
.ia-spin{animation:ia-spin 1.4s linear infinite}
.ia-bump{animation:ia-bump .35s ease}
.ia-shimmer{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:ia-shimmer 1.6s linear infinite}
.ia-zoom{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.group:hover .ia-zoom{transform:scale(1.06)}
.ia-pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.68rem;line-height:1.5;white-space:pre;overflow:auto;max-height:190px}
@media (prefers-reduced-motion:reduce){.ia-root *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}}
`;

/* --------------------------- Małe pomocnicze komponenty --------------------------- */
const useMounted = () => {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setM(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
};

const useCountUp = (value, ms = 650) => {
  const [v, setV] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      fromRef.current = cur;
      setV(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return Math.round(v);
};

const CountUp = ({ value }) => {
  const v = useCountUp(Number(value) || 0);
  return <>{v.toLocaleString('pl-PL')}</>;
};

const hueOf = (s) => {
  let h = 0;
  const str = String(s || '?');
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
};

const Avatar = ({ name, size = 28 }) => {
  const h = hueOf(name);
  return (
    <span className="inline-flex items-center justify-center rounded-full font-black shrink-0 text-white" style={{ width: size, height: size, fontSize: size * 0.44, background: `linear-gradient(135deg,hsl(${h} 75% 55%),hsl(${(h + 45) % 360} 75% 40%))` }}>
      {String(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
};

const Slider = ({ label, value, min, max, step = 1, onChange, format, disabled }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold ia-muted">{label}</span>
        <span className="text-sm font-black ia-accent tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="ia-range" style={{ background: `linear-gradient(90deg, rgb(var(--ac)) ${pct}%, rgba(255,255,255,.12) ${pct}%)` }} />
    </div>
  );
};

const OptionCard = ({ active, onClick, emoji, title, desc, extra }) => (
  <button type="button" onClick={onClick} className={`text-left p-3.5 rounded-2xl active:scale-[.98] ${active ? 'ia-soft shadow-lg' : 'ia-sub hover:border-white/25'}`}>
    <div className="flex items-start gap-3">
      {emoji && <span className="text-2xl leading-none mt-0.5">{emoji}</span>}
      <div className="min-w-0">
        <div className={`text-[13px] font-black leading-tight ${active ? '' : 'text-white'}`}>{title}</div>
        {desc && <div className={`text-[11px] mt-1 leading-snug ${active ? 'opacity-80' : 'ia-muted'}`}>{desc}</div>}
        {extra && <div className="text-[11px] mt-1.5 font-bold">{extra}</div>}
      </div>
    </div>
  </button>
);

const ScoreRing = ({ value, size = 84, stroke = 8, big = true }) => {
  const mounted = useMounted();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, Number(value) / 10));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={mounted ? c * (1 - pct) : c} style={{ stroke: 'rgb(var(--ac))', transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1), stroke .4s', filter: 'drop-shadow(0 0 6px rgb(var(--ac)/.55))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`${big ? 'text-xl' : 'text-base'} font-black tabular-nums`}>{Number(value).toFixed(1)}</span>
        <span className="text-[9px] ia-faint mt-0.5">/ 10</span>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, suffix }) => {
  const mounted = useMounted();
  const pct = Math.max(0, Math.min(100, (Number(value) / 10) * 100));
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="ia-muted font-semibold">{label}</span>
        <span className="font-black tabular-nums">{value}{suffix || '/10'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full ia-grad" style={{ width: mounted ? `${pct}%` : '0%', transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  );
};

const StackBar = ({ parts, height = 'h-3' }) => {
  const mounted = useMounted();
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className={`flex ${height} rounded-full overflow-hidden bg-white/10 gap-[2px]`}>
      {parts.map((p) => (
        <div key={p.key} className={`${p.cls} first:rounded-l-full last:rounded-r-full`} style={{ width: mounted ? `${(p.value / total) * 100}%` : '0%', transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} title={`${p.label}: ${Math.round(p.value)}`} />
      ))}
    </div>
  );
};

const VERDICT_ICON = (label) => (/mocn/i.test(label) ? '💪' : /brak/i.test(label) ? '⚠️' : /plan/i.test(label) ? '🎯' : '•');
const parseVerdict = (v) =>
  String(v || '')
    .split(' | ')
    .map((part) => {
      const i = part.indexOf(':');
      if (i > 0 && i < 28) return { label: part.slice(0, i).trim(), text: part.slice(i + 1).trim() };
      return { label: '', text: part.trim() };
    })
    .filter((x) => x.text);

const VerdictList = ({ verdict, compact }) => (
  <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
    {parseVerdict(verdict).map((x, i) => (
      <div key={i} className="flex gap-2 text-[11.5px] leading-relaxed">
        <span className="shrink-0">{VERDICT_ICON(x.label)}</span>
        <p>
          {x.label && <strong className="font-black">{x.label}: </strong>}
          <span className="opacity-85">{x.text}</span>
        </p>
      </div>
    ))}
  </div>
);

const LineChart = ({ hist, metric }) => {
  const pts = (hist || []).map((h) => ({ label: h.date, v: Number(h[metric]) })).filter((p) => Number.isFinite(p.v) && p.v !== 0);
  if (pts.length === 0) return <div className="ia-muted text-sm py-16 text-center">Brak danych dla tego wskaźnika – dodaj pomiar lub zdjęcie.</div>;
  const W = 720;
  const H = 260;
  const L = 46;
  const R = 22;
  const T = 24;
  const B = 36;
  const vals = pts.map((p) => p.v);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const pad = Math.max((mx - mn) * 0.25, mx * 0.02, 0.5);
  const lo = mn - pad;
  const hi = mx + pad;
  const xAt = (i) => (pts.length === 1 ? (W + L - R) / 2 : L + (i / (pts.length - 1)) * (W - L - R));
  const yAt = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(pts.length - 1).toFixed(1)},${H - B} L${xAt(0).toFixed(1)},${H - B} Z`;
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
  return (
    <svg key={`${metric}-${pts.length}`} viewBox={`0 0 ${W} ${H}`} className="w-full h-64">
      <defs>
        <linearGradient id="ia-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'rgb(var(--ac))', stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: 'rgb(var(--ac))', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="rgba(255,255,255,.07)" strokeDasharray="3 5" />
          <text x={L - 8} y={yAt(t) + 4} textAnchor="end" fill="rgba(255,255,255,.4)" fontSize="11">{fmt(t)}</text>
        </g>
      ))}
      {pts.length > 1 && <path d={area} fill="url(#ia-area)" style={{ animation: 'ia-fade 1.2s ease .3s both' }} />}
      {pts.length > 1 && <path d={line} pathLength="1" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" style={{ stroke: 'rgb(var(--ac))', animation: 'ia-draw 1.4s cubic-bezier(.2,.8,.2,1) both', filter: 'drop-shadow(0 0 6px rgb(var(--ac)/.6))' }} />}
      {pts.map((p, i) => (
        <g key={i} style={{ animation: `ia-fade .5s ease ${0.5 + i * 0.08}s both` }}>
          <circle cx={xAt(i)} cy={yAt(p.v)} r="6" fill="#09090b" style={{ stroke: 'rgb(var(--ac))' }} strokeWidth="3" />
          <text x={xAt(i)} y={yAt(p.v) - 13} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">{fmt(p.v)}</text>
          <text x={xAt(i)} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="10">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

const DuelRow = ({ label, a, b, lowerBetter, fmt = (v) => v }) => {
  const mounted = useMounted();
  const av = Number(a) || 0;
  const bv = Number(b) || 0;
  const tot = av + bv || 1;
  const aWin = lowerBetter ? av < bv : av > bv;
  const bWin = lowerBetter ? bv < av : bv > av;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className={`font-black tabular-nums ${aWin ? 'ia-accent' : ''}`}>{fmt(a)}</span>
        <span className="ia-muted text-[11px] font-bold uppercase tracking-wide">{label}</span>
        <span className={`font-black tabular-nums ${bWin ? 'ia-accent' : ''}`}>{fmt(b)}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end rounded-l-full overflow-hidden bg-white/8">
          <div className={`h-full ${aWin ? 'ia-grad' : 'bg-white/25'}`} style={{ width: mounted ? `${(av / tot) * 100}%` : '0%', transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        <div className="flex-1 rounded-r-full overflow-hidden bg-white/8">
          <div className={`h-full ${bWin ? 'ia-grad' : 'bg-white/25'}`} style={{ width: mounted ? `${(bv / tot) * 100}%` : '0%', transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- Logika biznesowa ------------------------------- */
const num = (v) => {
  const n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const createDemoPhysiquePoster = (name, goal, weight, waist, chest, accentHex) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#171717"/><stop offset="100%" stop-color="#0a0a0a"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#bg)"/>
    <circle cx="200" cy="95" r="28" fill="none" stroke="${accentHex}" stroke-width="2.5"/>
    <path d="M125 145 Q200 130 275 145 L255 245 L235 335 L165 335 L145 245 Z" fill="${accentHex}" fill-opacity="0.14" stroke="${accentHex}" stroke-width="2.5"/>
    <text x="200" y="410" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">${escXml(String(name).toUpperCase())}</text>
    <text x="200" y="435" text-anchor="middle" fill="${accentHex}" font-family="sans-serif" font-weight="bold" font-size="13">${escXml(String(goal).toUpperCase())} // ${weight} KG</text>
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
  if (bmiVal >= 25.0 && whtr < 0.48) return { bmi, label: 'Atletyczne', tone: 'text-lime-300' };
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
  const fat = Math.max(Math.round(weightKg * 0.9), Math.round((kcal * 0.2) / 9));
  const remainingKcal = Math.max(0, kcal - protein * 4 - fat * 9);
  const carbs = Math.round(remainingKcal / 4);
  return { protein, fat, carbs };
};

/* ---------------------------- WYWIAD KALORYCZNY ---------------------------- */
const WIZ_STEPS = ['Ciało', 'Styl życia', 'Trening', 'Cel', 'Wynik'];

const JOB_OPTIONS = [
  { id: 'desk', emoji: '💻', title: 'Siedząca', desc: 'Biuro, szkoła, studia, praca zdalna', add: 0 },
  { id: 'light', emoji: '🚶', title: 'Na nogach', desc: 'Sklep, gastronomia, nauczyciel, dużo chodzenia', add: 0.06 },
  { id: 'active', emoji: '📦', title: 'Fizyczna', desc: 'Magazyn, kurier, opieka, lżejsza budowa', add: 0.14 },
  { id: 'heavy', emoji: '⛏️', title: 'Ciężka fizyczna', desc: 'Budowa, rolnictwo, noszenie ciężarów', add: 0.25 }
];

const GYM_INTENSITY = [
  { id: 'light', emoji: '🙂', title: 'Spokojny', desc: 'Długie przerwy, dużo rozmów', net: 2.0 },
  { id: 'moderate', emoji: '💪', title: 'Normalny', desc: 'Klasyczny trening siłowy', net: 3.0 },
  { id: 'hard', emoji: '🥵', title: 'Ciężki', desc: 'Krótkie przerwy, duża objętość, obwody', net: 4.0 }
];

const CARDIO_INTENSITY = [
  { id: 'light', emoji: '🚴', title: 'Lekkie', desc: 'Marsz, spokojny rower', net: 2.8 },
  { id: 'moderate', emoji: '🏃', title: 'Umiarkowane', desc: 'Trucht, rower sportowo, pływanie', net: 6 },
  { id: 'hard', emoji: '⚡', title: 'Intensywne', desc: 'Szybki bieg, interwały, HIIT', net: 9 }
];

const GOALS = [
  { id: 'cut', name: 'Redukcja', emoji: '🔥', desc: 'Spalanie tkanki tłuszczowej', protein: 2.2, paces: [{ id: 'slow', label: 'Łagodna', kcal: -300 }, { id: 'std', label: 'Standard', kcal: -500 }, { id: 'fast', label: 'Agresywna', kcal: -750 }] },
  { id: 'recomp', name: 'Rekompozycja', emoji: '⚖️', desc: 'Mniej tłuszczu i więcej mięśni na stałej wadze', protein: 2.0, paces: [{ id: 'std', label: 'Utrzymanie', kcal: 0 }] },
  { id: 'lean', name: 'Czysta Masa', emoji: '💪', desc: 'Wolny przyrost z minimum tłuszczu', protein: 1.9, paces: [{ id: 'slow', label: 'Wolna', kcal: 150 }, { id: 'std', label: 'Standard', kcal: 300 }] },
  { id: 'power', name: 'Masa Siłowa', emoji: '🏗️', desc: 'Szybszy przyrost siły i masy', protein: 1.8, paces: [{ id: 'std', label: 'Mocna', kcal: 450 }, { id: 'fast', label: 'Bardzo mocna', kcal: 650 }] }
];

const GOAL_BY_NAME = { Redukcja: 'cut', Rekompozycja: 'recomp', 'Czysta Masa': 'lean', 'Masa Siłowa': 'power' };

const makeInterviewDefaults = (p) => {
  const base = {
    bf: '', job: 'desk', steps: 8000, gymDays: 4, sessionMin: 70, gymIntensity: 'moderate', cardioMin: 0, cardioIntensity: 'moderate',
    goal: GOAL_BY_NAME[p?.goal] || 'cut', pace: 'std'
  };
  return {
    ...base,
    ...(p?.interview || {}),
    sex: p?.sex || 'M',
    age: String(p?.age || 22),
    height: String(p?.heightCm || 180),
    weight: String(p?.currentWeight || 80)
  };
};

const calcInterview = (iv) => {
  const w = num(iv.weight);
  const h = num(iv.height);
  const age = num(iv.age);
  const bf = num(iv.bf);
  const valid = w >= 30 && w <= 250 && h >= 120 && h <= 230 && age >= 14 && age <= 90;
  if (!valid) return { valid: false, bmr: 0, tdee: 0, method: '', parts: { bmr: 0, daily: 0, job: 0, steps: 0, gym: 0, cardio: 0 } };

  const useKatch = bf >= 5 && bf <= 50;
  const bmr = Math.round(useKatch ? 370 + 21.6 * (w * (1 - bf / 100)) : 10 * w + 6.25 * h - 5 * age + (iv.sex === 'K' ? -161 : 5));
  const jobAdd = (JOB_OPTIONS.find((j) => j.id === iv.job) || JOB_OPTIONS[0]).add;
  const gymNet = (GYM_INTENSITY.find((g) => g.id === iv.gymIntensity) || GYM_INTENSITY[1]).net;
  const cardioNet = (CARDIO_INTENSITY.find((g) => g.id === iv.cardioIntensity) || CARDIO_INTENSITY[1]).net;

  const daily = bmr * 0.2; // codzienne funkcjonowanie + efekt termiczny pożywienia
  const job = bmr * jobAdd;
  const steps = Math.max(0, num(iv.steps) - 3000) * 0.0004 * w; // kroki ponad „bazowe” 3000
  const gym = (num(iv.gymDays) * gymNet * w * (num(iv.sessionMin) / 60)) / 7;
  const cardio = (cardioNet * w * (num(iv.cardioMin) / 60)) / 7;
  const tdee = Math.round(bmr + daily + job + steps + gym + cardio);
  return { valid: true, bmr, tdee, method: useKatch ? 'Katch-McArdle (z % tłuszczu)' : 'Mifflin-St Jeor', parts: { bmr, daily, job, steps, gym, cardio } };
};

const buildPlan = (iv, calc) => {
  const goal = GOALS.find((g) => g.id === iv.goal) || GOALS[0];
  const pace = goal.paces.find((p) => p.id === iv.pace) || goal.paces[Math.min(1, goal.paces.length - 1)];
  const w = num(iv.weight);
  const age = num(iv.age);
  const notes = [];
  let delta = pace.kcal;
  if (delta < -300 && age < 18) {
    delta = -300;
    notes.push('Poniżej 18. roku życia ograniczyliśmy deficyt do 300 kcal – organizm jeszcze rośnie.');
  }
  let target = calc.tdee + delta;
  if (delta < 0) {
    const floor = Math.max(calc.bmr, iv.sex === 'K' ? 1200 : 1500);
    const minAllowed = Math.max(floor, Math.round(calc.tdee * 0.75));
    if (target < minAllowed) {
      target = minAllowed;
      notes.push('Deficyt przycięty do bezpiecznego poziomu: nie schodzimy poniżej BMR ani więcej niż 25% poniżej zapotrzebowania.');
    }
  }
  target = Math.round(target / 10) * 10;
  const protein = Math.round(w * goal.protein);
  const macros = calcMacros(target, w, protein);
  const weekly = ((target - calc.tdee) * 7) / 7700;
  return { goal, pace, target, delta: target - calc.tdee, macros, weekly, notes };
};

/* ------------------------------- Ocena sylwetki ------------------------------- */
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

  let progressLabel = 'Zdjęcie bazowe';
  let progressTone = 'text-neutral-300';
  if (prevPhoto) {
    const prevOverall = prevPhoto?.aiVision?.overall ? Number(prevPhoto.aiVision.overall) : parseFloat(overall);
    const diff = (parseFloat(overall) - prevOverall).toFixed(1);
    const weightDiffNum = (selectedPhoto?.weight || player.currentWeight) - (prevPhoto?.weight || player.currentWeight);
    const weightDiff = weightDiffNum.toFixed(1);
    const wd = weightDiffNum > 0 ? `+${weightDiff}` : weightDiff;
    if (parseFloat(diff) > 0) {
      progressLabel = `+${diff} pkt (${wd} kg)`;
      progressTone = 'text-emerald-400';
    } else if (parseFloat(diff) < 0) {
      progressLabel = `${diff} pkt (${wd} kg)`;
      progressTone = 'text-rose-400';
    } else {
      progressLabel = `0.0 pkt (${wd} kg)`;
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
    const localResult = (realDataUrl) => {
      const baseEval = evaluatePhysiqueAI(playerContext);
      resolve({
        // Jeśli udało się przygotować prawdziwe zdjęcie – zachowujemy je nawet gdy AI w chmurze nie odpowie
        dataUrl: realDataUrl || createDemoPhysiquePoster(playerContext.name || 'Gracz', playerContext.goal || 'Redukcja', playerContext.currentWeight || 84, playerContext.measurements?.waist?.current || 85, playerContext.measurements?.chest?.current || 105, '#a3e635'),
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
        const maxH = 560;
        const cropW = img.width / zoomFactor;
        const cropH = img.height / zoomFactor;
        const startX = (img.width - cropW) / 2;
        const startY = (img.height - cropH) * 0.42;

        const scale = Math.min(1, maxH / cropH);
        canvas.width = Math.max(1, Math.round(cropW * scale));
        canvas.height = Math.max(1, Math.round(cropH * scale));

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.74);

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

        localResult(dataUrl);
      };
      img.onerror = () => localResult(null);
      img.src = e.target.result;
    };
    reader.onerror = () => localResult(null);
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

/* ------------------------- Dane startowe / pamięć lokalna ------------------------- */
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
    updatedAt: 0,
    _synced: true,
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
        reactions: { dzik: 2, swinia: 1, bocian: 0, podejrzany: 0 },
        comments: [{ author: 'Gibasek', text: 'Nawet dzik z tego będzie' }],
        url: createDemoPhysiquePoster('Olek', 'Redukcja', 84.0, 85.0, 105.0, '#a3e635')
      }
    ],
    history: [{ date: 'Start', weight: 84.0, waist: 85.0, bench1RM: 93, kcal: 2500, aiScore: 5.1 }]
  }
];

const loadLocalPlayers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return INITIAL_PLAYERS;
};

const readPendingDeletes = () => {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_DEL_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (_) {
    return [];
  }
};
const writePendingDeletes = (arr) => {
  try { localStorage.setItem(PENDING_DEL_KEY, JSON.stringify(arr)); } catch (_) {}
};

/* ------------------------------ Synchronizacja z Supabase ------------------------------ */
// Pola zaczynające się od "_" to metadane lokalne (_synced, _cloudAt) – nigdy nie trafiają do chmury.
const toCloud = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('_')));

const commentKey = (c) => `${c.author}|${c.ts || 0}|${c.text}`;

// Scala dwie wersje tego samego zawodnika: pola profilu z nowszej (updatedAt),
// zdjęcia / reakcje / komentarze są łączone, żeby nikt nikomu nie nadpisał lajków.
const mergePlayers = (a, b) => {
  const aNewer = (a.updatedAt || 0) >= (b.updatedAt || 0);
  const base = aNewer ? a : b;
  const other = aNewer ? b : a;
  const deleted = Array.from(new Set([...(a.deletedPhotos || []), ...(b.deletedPhotos || [])]));
  const map = new Map();
  [...(base.photos || []), ...(other.photos || [])].forEach((ph) => {
    if (deleted.includes(ph.id)) return;
    const ex = map.get(ph.id);
    if (!ex) {
      map.set(ph.id, ph);
      return;
    }
    const reactions = {};
    new Set([...Object.keys(ex.reactions || {}), ...Object.keys(ph.reactions || {})]).forEach((k) => {
      reactions[k] = Math.max(ex.reactions?.[k] || 0, ph.reactions?.[k] || 0);
    });
    const cm = new Map();
    [...(ex.comments || []), ...(ph.comments || [])].forEach((c) => {
      const k = commentKey(c);
      if (!cm.has(k)) cm.set(k, c);
    });
    map.set(ph.id, { ...ex, reactions, comments: Array.from(cm.values()).sort((x, y) => (x.ts || 0) - (y.ts || 0)) });
  });
  const photos = Array.from(map.values()).sort((x, y) => (y.ts || 0) - (x.ts || 0));
  return { ...base, photos, deletedPhotos: deleted, updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0) };
};

async function sbRequest(cfg, path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method,
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = [j.code, j.message || j.error, j.hint].filter(Boolean).join(' – ');
    } catch (_) {}
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const explainSbError = (e) => {
  const s = e?.status;
  const m = String(e?.message || '');
  if (!s && /fetch|network|load failed/i.test(m)) return 'Brak połączenia z Supabase – sprawdź internet oraz adres Project URL.';
  if (s === 404 || /PGRST205|PGRST106|does not exist|schema cache/i.test(m)) return 'W Supabase nie ma tabeli „squad_players”. Wklej i uruchom skrypt SQL (przycisk „Kopiuj SQL” poniżej) – wystarczy raz.';
  if (s === 401 || s === 403 || /row-level security|42501|permission denied|JWT|api key/i.test(m)) return 'Supabase odrzuca zapis (brak uprawnień RLS lub zły klucz). Uruchom skrypt SQL z tego okna – dodaje wymagane uprawnienia.';
  return `Błąd Supabase${s ? ` (${s})` : ''}: ${m}`;
};

const SYNC_META = {
  local: { label: 'Tylko to urządzenie', dot: 'bg-neutral-500' },
  loading: { label: 'Łączenie…', dot: 'bg-sky-400 ia-pulse' },
  saving: { label: 'Zapisywanie…', dot: 'bg-amber-400 ia-pulse' },
  ok: { label: 'Zsynchronizowano', dot: 'bg-emerald-400' },
  error: { label: 'Błąd chmury', dot: 'bg-rose-500 ia-pulse' }
};

const TABS = [
  { id: 'ai_physique', label: 'Sylwetki', long: 'Zdjęcia & Sędzia AI', icon: 'camera' },
  { id: 'ranking', label: 'Ranking', long: 'Tabela Ekipy & 1v1', icon: 'users' },
  { id: 'cpm', label: 'Kalorie', long: 'Wywiad kaloryczny', icon: 'activity' },
  { id: 'gym', label: 'Siłownia', long: 'Siłownia & Sztanga', icon: 'dumbbell' },
  { id: 'charts', label: 'Wykresy', long: 'Wykresy & DOTS', icon: 'chart' }
];

const getGoalBadgeStyle = (goal) => {
  const g = String(goal || '').toLowerCase();
  if (g.includes('redukcja')) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (g.includes('masa')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
};

/* ================================== APLIKACJA ================================== */
export default function App() {
  const [players, setPlayers] = useState(loadLocalPlayers);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('iron_archive_active_id') || players[0]?.id || 'p_olek');
  const [pinnedId, setPinnedId] = useState(() => localStorage.getItem('iron_archive_pinned') || '');
  const [activeTab, setActiveTab] = useState('ai_physique');
  const [sortBy, setSortBy] = useState('ai');
  const [themeKey, setThemeKey] = useState(() => {
    const s = localStorage.getItem(THEME_KEY);
    return s && THEMES[s] ? s : 'volt';
  });

  const [sbUrl, setSbUrl] = useState(() => localStorage.getItem('iron_sb_url') || DEFAULT_SUPABASE_URL || '');
  const [sbKey, setSbKey] = useState(() => localStorage.getItem('iron_sb_key') || DEFAULT_SUPABASE_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  const [sync, setSync] = useState({ kind: 'loading', msg: '' });
  const [cloudReady, setCloudReady] = useState(false);

  const [photoIdxMap, setPhotoIdxMap] = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [compA, setCompA] = useState(() => players[0]?.id || 'p_olek');
  const [compB, setCompB] = useState(() => players[1]?.id || players[0]?.id || 'p_olek');

  const [editingDiet, setEditingDiet] = useState(false);
  const [dietDraft, setDietDraft] = useState({ goal: 'Redukcja', dietKcal: 2500, dietProtein: 175 });

  const [wiz, setWiz] = useState(() => makeInterviewDefaults(players.find((p) => p.id === activeId) || players[0]));
  const [wizStep, setWizStep] = useState(0);
  const [wizDir, setWizDir] = useState('l');

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', age: '22', heightCm: '180', goal: 'Redukcja', dietKcal: '2400', dietProtein: '170', weight: '82', waist: '85', biceps: '38', chest: '105' });

  const [rawPhotoFile, setRawPhotoFile] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [bodyForm, setBodyForm] = useState({ weight: '', waist: '', biceps: '', chest: '', note: '', photoPreview: null, autoAiResult: null });
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const [commentDrafts, setCommentDrafts] = useState({});
  const [bumpKey, setBumpKey] = useState('');
  const [toast, setToast] = useState(null);

  const [liftForm, setLiftForm] = useState({ exercise: 'bench', weight: '100', reps: '5' });
  const [plateWeight, setPlateWeight] = useState(100);
  const [chartMetric, setChartMetric] = useState('weight');

  const [timerSec, setTimerSec] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const theme = THEMES[themeKey] || THEMES.volt;
  const activePlayer = players.find((p) => p.id === activeId) || players[0];
  const isLocked = Boolean(pinnedId && pinnedId !== activePlayer?.id);

  const cfg = useMemo(() => {
    const url = (sbUrl || '').trim().replace(/\/+$/, '');
    const key = (sbKey || '').trim();
    return url && key ? { url, key } : null;
  }, [sbUrl, sbKey]);

  const playersRef = useRef(players);
  playersRef.current = players;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const flushingRef = useRef(false);
  const rerunRef = useRef(false);
  const pullingRef = useRef(false);
  const quotaWarnedRef = useRef(false);

  const showToast = useCallback((msg, tone = 'ok') => {
    setToast({ msg, tone, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { localStorage.setItem(THEME_KEY, themeKey); }, [themeKey]);
  useEffect(() => { if (activeId) localStorage.setItem('iron_archive_active_id', activeId); }, [activeId]);
  useEffect(() => { localStorage.setItem('iron_archive_pinned', pinnedId || ''); }, [pinnedId]);
  useEffect(() => { if (!players.some((p) => p.id === activeId) && players[0]) setActiveId(players[0].id); }, [players, activeId]);

  // 1) ZAWSZE zapisuj do pamięci przeglądarki (dane przeżywają odświeżenie nawet bez chmury)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (_) {
      if (!quotaWarnedRef.current) {
        quotaWarnedRef.current = true;
        showToast('Pamięć przeglądarki jest pełna (zdjęcia). Dane trzymamy w chmurze – zrób też kopię .json.', 'warn');
      }
    }
  }, [players, showToast]);

  // Zmiana danych: aktualizacja + oznaczenie jako „do wysłania”
  const commit = useCallback((updater, { social = false } = {}) => {
    setPlayers((prev) => {
      const raw = typeof updater === 'function' ? updater(prev) : updater;
      const now = Date.now();
      return raw.map((p) => (prev.includes(p) ? p : social ? { ...p, _synced: false } : { ...p, updatedAt: now, _synced: false }));
    });
  }, []);

  // 2) Wysyłanie zmian do chmury – po jednym wierszu na zawodnika, ze scaleniem z tym, co jest już w chmurze
  const flushNow = useCallback(async () => {
    const c = cfgRef.current;
    if (!c) return;
    if (flushingRef.current) {
      rerunRef.current = true;
      return;
    }
    flushingRef.current = true;
    try {
      const pend = readPendingDeletes();
      const dirtyIds = playersRef.current.filter((p) => p._synced !== true).map((p) => p.id);
      if (pend.length === 0 && dirtyIds.length === 0) {
        setSync((s) => (s.write ? { kind: 'ok', msg: '', at: Date.now() } : s));
        return;
      }
      setSync((s) => ({ ...s, kind: 'saving', write: s.write }));

      for (const id of pend) {
        await sbRequest(c, `squad_players?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
        writePendingDeletes(readPendingDeletes().filter((x) => x !== id));
      }

      for (const id of dirtyIds) {
        const local = playersRef.current.find((p) => p.id === id);
        if (!local || local._synced === true) continue;
        const rows = await sbRequest(c, `squad_players?id=eq.${encodeURIComponent(id)}&select=id,data,updated_at`);
        const merged = rows && rows[0] && rows[0].data ? mergePlayers(local, rows[0].data) : local;
        const saved = await sbRequest(c, 'squad_players?on_conflict=id&select=id,updated_at', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: [{ id, data: toCloud(merged), updated_at: new Date().toISOString() }]
        });
        const cloudAt = saved && saved[0] ? saved[0].updated_at : undefined;
        setPlayers((prev) => prev.map((p) => (p === local ? { ...toCloud(merged), _synced: true, _cloudAt: cloudAt } : p)));
      }
      setSync({ kind: 'ok', msg: '', at: Date.now() });
    } catch (e) {
      setSync({ kind: 'error', write: true, msg: explainSbError(e), at: Date.now() });
    } finally {
      flushingRef.current = false;
      if (rerunRef.current) {
        rerunRef.current = false;
        setTimeout(() => flushNow(), 250);
      }
    }
  }, []);

  // 3) Pobieranie zmian innych osób (lekkie zapytanie o id + updated_at, pełne dane tylko dla zmienionych)
  const pullCloud = useCallback(async (silent = false) => {
    const c = cfgRef.current;
    if (!c || pullingRef.current) return;
    pullingRef.current = true;
    try {
      if (!silent) setSync((s) => ({ ...s, kind: 'loading' }));
      const rows = (await sbRequest(c, 'squad_players?select=id,updated_at')) || [];
      const pendingDel = new Set(readPendingDeletes());
      const live = rows.filter((r) => !pendingDel.has(r.id));
      const curMap = new Map(playersRef.current.map((p) => [p.id, p]));
      const need = live.filter((r) => {
        const l = curMap.get(r.id);
        return !l || l._cloudAt !== r.updated_at;
      }).map((r) => r.id);

      let fetched = [];
      if (need.length) {
        const list = need.map((i) => encodeURIComponent(`"${i}"`)).join(',');
        fetched = (await sbRequest(c, `squad_players?id=in.(${list})&select=id,data,updated_at`)) || [];
      }

      const seed = rows.length === 0; // chmura pusta → wyślij to, co mamy lokalnie
      let legacy = [];
      if (seed) {
        try {
          const lg = await sbRequest(c, 'squad_state?id=eq.1&select=players');
          legacy = lg && lg[0] && Array.isArray(lg[0].players) ? lg[0].players : [];
        } catch (_) {}
      }

      setPlayers((prev) => {
        const fetchedMap = new Map(fetched.map((r) => [r.id, r]));
        const liveIds = new Set(live.map((r) => r.id));
        const legacyMap = new Map(legacy.map((l) => [l.id, l]));
        const out = [];
        const seen = new Set();
        prev.forEach((p) => {
          seen.add(p.id);
          if (seed) {
            const lg = legacyMap.get(p.id);
            out.push({ ...(lg ? mergePlayers(p, lg) : p), _synced: false });
            return;
          }
          if (pendingDel.has(p.id)) return;
          if (!liveIds.has(p.id)) {
            if (p._synced === true) return; // usunięty przez kogoś innego
            out.push(p); // nowy lokalnie – poleci do chmury
            return;
          }
          const row = fetchedMap.get(p.id);
          if (!row) {
            out.push(p);
            return;
          }
          if (p._synced === true) out.push({ ...row.data, _synced: true, _cloudAt: row.updated_at });
          else out.push({ ...mergePlayers(p, row.data), _synced: false, _cloudAt: row.updated_at });
        });
        live.forEach((r) => {
          if (seen.has(r.id)) return;
          const row = fetchedMap.get(r.id);
          if (row) out.push({ ...row.data, _synced: true, _cloudAt: row.updated_at });
        });
        if (seed) legacy.forEach((l) => { if (!seen.has(l.id)) out.push({ ...l, _synced: false }); });
        return out.length ? out : prev;
      });
      setSync((s) => (s.kind === 'error' && s.write ? s : { kind: 'ok', msg: '', at: Date.now() }));
    } catch (e) {
      setSync({ kind: 'error', msg: explainSbError(e), at: Date.now() });
    } finally {
      pullingRef.current = false;
    }
  }, []);

  const tick = useCallback(async () => {
    if (!cfgRef.current) return;
    if (playersRef.current.some((p) => p._synced !== true) || readPendingDeletes().length) await flushNow();
    await pullCloud(true);
  }, [flushNow, pullCloud]);

  useEffect(() => {
    if (!cfg) {
      setSync({ kind: 'local', msg: '' });
      setCloudReady(false);
      return undefined;
    }
    let alive = true;
    setCloudReady(false);
    (async () => {
      await pullCloud(false);
      if (alive) setCloudReady(true);
    })();
    const iv = setInterval(tick, 15000);
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', tick);
    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', tick);
    };
  }, [cfg, pullCloud, tick]);

  // Po każdej zmianie wyślij do chmury (z krótkim opóźnieniem)
  useEffect(() => {
    if (!cfg || !cloudReady) return undefined;
    if (!players.some((p) => p._synced !== true) && readPendingDeletes().length === 0) return undefined;
    const t = setTimeout(() => flushNow(), 600);
    return () => clearTimeout(t);
  }, [players, cfg, cloudReady, flushNow]);

  const dirtyCount = players.filter((p) => p._synced !== true).length;

  /* ------------------------------- Eksport / Import ------------------------------- */
  const handleExportDatabase = () => {
    try {
      const backupPayload = { version: 'IronArchive_v2', exportedAt: new Date().toISOString(), players: players.map(toCloud) };
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iron-archive-baza-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {
      showToast('Nie udało się wyeksportować pliku bazy.', 'warn');
    }
  };

  const handleImportDatabase = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const imported = Array.isArray(parsed) ? parsed : parsed?.players;
        if (!Array.isArray(imported) || imported.length === 0) {
          showToast('Ten plik nie zawiera poprawnej listy zawodników.', 'warn');
          return;
        }
        // import scala się z obecną bazą (nie kasuje nikogo)
        commit((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p]));
          imported.forEach((ip) => byId.set(ip.id, { ...toCloud(ip) }));
          return Array.from(byId.values());
        });
        showToast(`Zaimportowano ${imported.length} osób.`);
      } catch (_) {
        showToast('Błąd odczytu pliku .json', 'warn');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveCloudConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('iron_sb_url', (sbUrl || '').trim());
    localStorage.setItem('iron_sb_key', (sbKey || '').trim());
    showToast('Zapisano ustawienia chmury.');
    setTimeout(() => tick(), 50);
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_SQL);
      showToast('Skrypt SQL skopiowany – wklej w Supabase → SQL Editor.');
    } catch (_) {
      showToast('Nie udało się skopiować – zaznacz tekst ręcznie.', 'warn');
    }
  };

  /* ------------------------------------ Efekty ------------------------------------ */
  useEffect(() => {
    const linkId = 'iron-archive-clean-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
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
    }
  }, [activePlayer?.id, activePlayer?.goal, activePlayer?.dietKcal, activePlayer?.dietProtein]);

  useEffect(() => {
    if (activePlayer) {
      setWiz(makeInterviewDefaults(activePlayer));
      setWizStep(0);
    }
    // tylko przy zmianie osoby – nie resetujemy wywiadu w trakcie wypełniania
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlayer?.id]);

  /* ------------------------------ Dane wyliczane ------------------------------ */
  const enrichedPlayers = useMemo(() => {
    let bestAiId = null; let maxAi = -1;
    let bestDotsId = null; let maxDots = -1;
    let maxWhtrId = null; let maxWhtr = -1;
    const bufetIds = new Set();

    players.forEach((p) => {
      const evalRes = evaluatePhysiqueAI(p, 0);
      if (evalRes.overall > maxAi) { maxAi = evalRes.overall; bestAiId = p.id; }
      const total = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps) + calc1RM(p.lifts.squat.weight, p.lifts.squat.reps) + calc1RM(p.lifts.deadlift.weight, p.lifts.deadlift.reps);
      const dots = calcDOTS(p.currentWeight, total);
      if (dots > maxDots) { maxDots = dots; bestDotsId = p.id; }
      const whtr = (p.measurements?.waist?.current || 85) / p.heightCm;
      if (whtr > maxWhtr) { maxWhtr = whtr; maxWhtrId = p.id; }
      if (String(p.goal).toLowerCase().includes('redukcja') && p.currentWeight > p.startWeight) bufetIds.add(p.id);
    });

    return players.map((p) => {
      const bench1RM = calc1RM(p.lifts.bench.weight, p.lifts.bench.reps);
      const squat1RM = calc1RM(p.lifts.squat.weight, p.lifts.squat.reps);
      const deadlift1RM = calc1RM(p.lifts.deadlift.weight, p.lifts.deadlift.reps);
      const ohp1RM = calc1RM(p.lifts.ohp.weight, p.lifts.ohp.reps);
      const total1RM = bench1RM + squat1RM + deadlift1RM;
      const dots = calcDOTS(p.currentWeight, total1RM);
      const bmiData = calcBMIData(p.currentWeight, p.heightCm, p.measurements.waist.current);
      const cpmData = calcCPMData(p.currentWeight, p.heightCm, p.age || 22, p.sex || 'M', p.pal || 1.55);
      if (p.tdee) cpmData.cpm = p.tdee; // dokładne TDEE z wywiadu ma pierwszeństwo
      const macros = calcMacros(p.dietKcal, p.currentWeight, p.dietProtein);
      const ai = evaluatePhysiqueAI(p, 0);

      const badges = [];
      if (p.id === bestAiId) badges.push({ text: '👑 Król Estetyki', color: 'bg-amber-500/15 text-amber-300 border-amber-500/35' });
      if (p.id === bestDotsId) badges.push({ text: '🏋️ Najsilniejszy Dzik', color: 'bg-rose-500/15 text-rose-300 border-rose-500/35' });
      if (bufetIds.has(p.id)) badges.push({ text: '🍔 Król Bufetu', color: 'bg-orange-500/15 text-orange-300 border-orange-500/35' });
      if (p.id === maxWhtrId && players.length > 1) badges.push({ text: '📏 Największy Bęben', color: 'bg-purple-500/15 text-purple-300 border-purple-500/35' });

      return { ...p, stats: { bench1RM, squat1RM, deadlift1RM, ohp1RM, total1RM, dots }, bmiData, cpmData, macros, ai, badges };
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

  const wizCalc = useMemo(() => calcInterview(wiz), [wiz]);
  const wizPlan = useMemo(() => buildPlan(wiz, wizCalc), [wiz, wizCalc]);

  /* --------------------------------- Zdjęcia --------------------------------- */
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
      showToast('Nie udało się przeanalizować zdjęcia.', 'warn');
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
  const handleChangeZoom = async (z) => {
    setPhotoZoom(z);
    if (rawPhotoFile) await runPhotoAnalysis(rawPhotoFile, z);
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
      id: `ph_${Date.now()}`,
      ts: Date.now(),
      date: todayStr,
      weight: w,
      waist,
      note: bodyForm.note || `Aktualizacja sylwetki (${activePlayer.goal} • ${activePlayer.dietKcal} kcal)`,
      reactions: { dzik: 0, swinia: 0, bocian: 0, podejrzany: 0 },
      comments: [],
      url: photoUrl,
      aiVision: finalAiVision
    };

    commit((prev) =>
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
          history: [...(p.history || []), { date: todayStr.slice(0, 5), weight: w, waist, bench1RM, kcal: p.dietKcal, aiScore: Number(finalAiVision.overall) }]
        };
      })
    );

    setPhotoIdxMap((prev) => ({ ...prev, [activeId]: 0 }));
    setRawPhotoFile(null);
    setBodyForm({ weight: '', waist: '', biceps: '', chest: '', note: '', photoPreview: null, autoAiResult: null });
    showToast('Zdjęcie zapisane ✓');
  };

  const handleDeletePhoto = (playerId, photoId) => {
    if (pinnedId && pinnedId !== playerId) return;
    const target = players.find((p) => p.id === playerId);
    if (!target || (target.photos || []).length <= 1) {
      showToast('W profilu musi zostać przynajmniej 1 zdjęcie bazowe.', 'warn');
      return;
    }
    commit((prev) =>
      prev.map((p) => (p.id !== playerId ? p : { ...p, photos: p.photos.filter((ph) => ph.id !== photoId), deletedPhotos: [...(p.deletedPhotos || []), photoId] }))
    );
    setPhotoIdxMap((prev) => ({ ...prev, [playerId]: 0 }));
  };

  const handleAddReaction = (playerId, photoId, key) => {
    setBumpKey(`${photoId}:${key}`);
    setTimeout(() => setBumpKey(''), 380);
    commit(
      (prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            photos: (p.photos || []).map((ph) => {
              if (ph.id !== photoId) return ph;
              const cur = ph.reactions || { dzik: 0, swinia: 0, bocian: 0, podejrzany: 0 };
              return { ...ph, reactions: { ...cur, [key]: (cur[key] || 0) + 1 } };
            })
          };
        }),
      { social: true }
    );
  };

  const handleAddComment = (playerId, photoId, e) => {
    e.preventDefault();
    const text = (commentDrafts[photoId] || '').trim();
    if (!text) return;
    const comment = { author: activePlayer?.name || 'Kolega z ekipy', text, ts: Date.now() };
    commit(
      (prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          return { ...p, photos: (p.photos || []).map((ph) => (ph.id !== photoId ? ph : { ...ph, comments: [...(ph.comments || []), comment] })) };
        }),
      { social: true }
    );
    setCommentDrafts((d) => ({ ...d, [photoId]: '' }));
  };

  /* ------------------------------- Dieta / Wywiad ------------------------------- */
  const setWizField = (patch) => setWiz((prev) => ({ ...prev, ...patch }));
  const goWiz = (n) => {
    setWizDir(n >= wizStep ? 'l' : 'r');
    setWizStep(Math.max(0, Math.min(WIZ_STEPS.length - 1, n)));
  };
  const pickGoal = (goalId) => {
    const g = GOALS.find((x) => x.id === goalId);
    setWizField({ goal: goalId, pace: g.paces[Math.min(1, g.paces.length - 1)].id });
  };

  const applyInterviewToProfile = () => {
    if (isLocked || !wizCalc.valid) return;
    const w = num(wiz.weight);
    const h = Math.round(num(wiz.height));
    const a = Math.round(num(wiz.age));
    const interview = { bf: wiz.bf, job: wiz.job, steps: wiz.steps, gymDays: wiz.gymDays, sessionMin: wiz.sessionMin, gymIntensity: wiz.gymIntensity, cardioMin: wiz.cardioMin, cardioIntensity: wiz.cardioIntensity, goal: wiz.goal, pace: wiz.pace };
    commit((prev) =>
      prev.map((p) =>
        p.id !== activeId
          ? p
          : {
              ...p,
              age: a, sex: wiz.sex, heightCm: h, currentWeight: w,
              pal: Math.round((wizCalc.tdee / wizCalc.bmr) * 100) / 100,
              tdee: wizCalc.tdee, bmr: wizCalc.bmr,
              goal: wizPlan.goal.name, dietKcal: wizPlan.target, dietProtein: wizPlan.macros.protein,
              interview
            }
      )
    );
    showToast(`Zapisano w profilu: ${wizPlan.goal.name}, ${wizPlan.target} kcal ✓`);
  };

  const handleSaveDietProtocol = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const newKcal = parseInt(dietDraft.dietKcal, 10) || activePlayer.dietKcal;
    const newProt = parseInt(dietDraft.dietProtein, 10) || activePlayer.dietProtein;
    commit((prev) => prev.map((p) => (p.id === activeId ? { ...p, goal: dietDraft.goal, dietKcal: newKcal, dietProtein: newProt } : p)));
    setEditingDiet(false);
    showToast('Cel zapisany ✓');
  };

  const handleSaveLift = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const w = parseFloat(liftForm.weight);
    const r = parseInt(liftForm.reps, 10);
    if (!w || !r) return;
    commit((prev) => prev.map((p) => (p.id !== activeId ? p : { ...p, lifts: { ...p.lifts, [liftForm.exercise]: { weight: w, reps: r } } })));
    setPlateWeight(w);
    setTimerSec(90);
    setTimerRunning(true);
    showToast('Rekord zapisany – stoper ruszył ⏱️');
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;
    const id = `p_${Date.now().toString(36)}`;
    const w = parseFloat(newPlayer.weight) || 80;
    const waist = parseFloat(newPlayer.waist) || 84;
    const bic = parseFloat(newPlayer.biceps) || 38;
    const chest = parseFloat(newPlayer.chest) || 104;
    const kcal = parseInt(newPlayer.dietKcal, 10) || 2400;
    const nm = newPlayer.name.trim();

    const created = {
      id, name: nm,
      age: parseInt(newPlayer.age, 10) || 22,
      sex: 'M', pal: 1.55,
      heightCm: parseInt(newPlayer.heightCm, 10) || 180,
      goal: newPlayer.goal, dietKcal: kcal,
      dietProtein: parseInt(newPlayer.dietProtein, 10) || Math.round(w * 2.1),
      startWeight: w, currentWeight: w,
      measurements: { waist: { start: waist, current: waist }, biceps: { start: bic, current: bic }, chest: { start: chest, current: chest } },
      lifts: { bench: { weight: 80, reps: 5 }, squat: { weight: 100, reps: 5 }, deadlift: { weight: 120, reps: 5 }, ohp: { weight: 50, reps: 5 } },
      photos: [{ id: `ph_${id}`, ts: Date.now(), date: new Date().toLocaleDateString('pl-PL'), weight: w, waist, note: 'Profil startowy.', reactions: { dzik: 0, swinia: 0, bocian: 0, podejrzany: 0 }, comments: [], url: createDemoPhysiquePoster(nm, newPlayer.goal, w, waist, chest, theme.swatch) }],
      history: [{ date: 'Start', weight: w, waist, bench1RM: 93, kcal, aiScore: 5.5 }]
    };

    commit((prev) => [...prev, created]);
    setActiveId(id);
    setCompB(id);
    setShowAddPlayer(false);
    setNewPlayer({ name: '', age: '22', heightCm: '180', goal: 'Redukcja', dietKcal: '2400', dietProtein: '170', weight: '82', waist: '85', biceps: '38', chest: '105' });
    showToast(`Dodano: ${nm} ✓`);
  };

  const handleDeletePlayer = (idToDelete) => {
    if (players.length <= 1) {
      showToast('W bazie musi zostać przynajmniej 1 osoba.', 'warn');
      return;
    }
    const target = players.find((p) => p.id === idToDelete);
    if (!target) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Usunąć „${target.name}” z bazy? Zniknie u całej ekipy.`)) return;
    writePendingDeletes(Array.from(new Set([...readPendingDeletes(), idToDelete])));
    setPlayers((prev) => prev.filter((p) => p.id !== idToDelete));
    if (pinnedId === idToDelete) setPinnedId('');
  };

  const changeTab = (id) => {
    setActiveTab(id);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
  };

  const syncMeta = SYNC_META[sync.kind] || SYNC_META.local;
  const rootStyle = { fontFamily: FONT, '--ac': theme.ac, '--ac2': theme.ac2, '--on': theme.on };

  const duelA = enrichedPlayers.find((p) => p.id === compA) || enrichedPlayers[0];
  const duelB = enrichedPlayers.find((p) => p.id === compB) || enrichedPlayers[Math.min(1, enrichedPlayers.length - 1)];

  /* ==================================== UI ==================================== */
  return (
    <div className="ia-root" style={rootStyle}>
      <style>{STYLES}</style>
      <div className="ia-aurora"><div className="ia-grid" /><div className="ia-blob a" /><div className="ia-blob b" /><div className="ia-blob c" /></div>

      {toast && (
        <div key={toast.id} className={`ia-toast ${toast.tone === 'warn' ? 'bg-amber-400 text-stone-950' : 'ia-grad'} shadow-2xl`}>{toast.msg}</div>
      )}

      <div className="ia-z pb-32 md:pb-16">
        {/* ----------------------------- LIGHTBOX ----------------------------- */}
        {lightboxPhoto && (
          <div onClick={() => setLightboxPhoto(null)} className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 ia-fade">
            <div onClick={(e) => e.stopPropagation()} className="ia-glass ia-pop rounded-3xl max-w-lg w-full overflow-hidden" style={{ background: '#111113' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div>
                  <div className="font-black text-sm">{lightboxPhoto.playerName}</div>
                  <div className="text-xs ia-muted">{lightboxPhoto.date} • {lightboxPhoto.weight} kg • pas {lightboxPhoto.waist} cm</div>
                </div>
                <button onClick={() => setLightboxPhoto(null)} className="ia-btn ia-ghost !p-2"><Icon name="close" /></button>
              </div>
              <img src={lightboxPhoto.url} alt={lightboxPhoto.playerName} className="w-full max-h-[62vh] object-contain bg-black" />
              <div className="p-4 text-xs space-y-3">
                <div className="font-semibold">{lightboxPhoto.note}</div>
                {lightboxPhoto.aiVision && (
                  <div className="ia-soft rounded-2xl p-3.5 space-y-2">
                    <div className="font-black uppercase text-[10px] tracking-wide">Szczegółowa ocena ({lightboxPhoto.aiVision.source})</div>
                    <div className="text-white"><VerdictList verdict={lightboxPhoto.aiVision.verdict} /></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------- USTAWIENIA ---------------------------- */}
        {showSettings && (
          <div onClick={() => setShowSettings(false)} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 ia-fade">
            <div onClick={(e) => e.stopPropagation()} className="ia-glass ia-pop rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 space-y-5 text-xs" style={{ background: '#111113' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2"><Icon name="settings" className="w-4 h-4 ia-accent" /> Ustawienia</h3>
                <button type="button" onClick={() => setShowSettings(false)} className="ia-btn ia-ghost !p-2"><Icon name="close" /></button>
              </div>

              <div>
                <div className="ia-label">Kolor wiodący</div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(THEMES).map((t) => (
                    <button key={t.id} type="button" onClick={() => setThemeKey(t.id)} className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${themeKey === t.id ? 'ia-soft' : 'ia-sub hover:border-white/25'}`}>
                      <span className="w-6 h-6 rounded-full" style={{ background: t.swatch, boxShadow: themeKey === t.id ? `0 0 14px ${t.swatch}` : 'none' }} />
                      <span className="font-bold text-[11px]">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-3.5 border ${sync.kind === 'error' ? 'border-rose-500/50 bg-rose-500/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-2 font-black text-[13px]">
                  <span className={`w-2.5 h-2.5 rounded-full ${syncMeta.dot}`} />
                  {syncMeta.label}
                  {dirtyCount > 0 && cfg && <span className="ml-auto text-[11px] text-amber-300">{dirtyCount} czeka na wysłanie</span>}
                </div>
                {sync.kind === 'error' && <p className="mt-2 text-rose-200 leading-relaxed">{sync.msg}</p>}
                {sync.kind === 'ok' && <p className="mt-1.5 ia-muted">Dane zapisują się automatycznie i są widoczne u całej ekipy (odświeżanie co 15 s).</p>}
                {sync.kind === 'local' && <p className="mt-1.5 ia-muted">Brak konfiguracji chmury – dane są tylko w tej przeglądarce.</p>}
                <button type="button" onClick={() => tick()} className="ia-btn ia-ghost mt-3 w-full"><Icon name="refresh" className="w-3.5 h-3.5" /> Synchronizuj teraz</button>
              </div>

              <form onSubmit={handleSaveCloudConfig} className="space-y-3">
                <div className="ia-label flex items-center gap-1.5"><Icon name="cloud" className="w-3.5 h-3.5" /> Połączenie z Supabase</div>
                <input type="text" placeholder="https://xxxx.supabase.co" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="ia-input" />
                <input type="password" placeholder="anon public key" value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="ia-input" />
                <button type="submit" className="ia-btn ia-accent-bg w-full">Zapisz i synchronizuj</button>
              </form>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="ia-label !mb-0">Skrypt SQL (jednorazowo w Supabase)</div>
                  <button type="button" onClick={copySql} className="ia-btn ia-ghost !py-1 !px-2.5 text-[11px]"><Icon name="copy" className="w-3.5 h-3.5" /> Kopiuj SQL</button>
                </div>
                <pre className="ia-pre ia-sub rounded-xl p-3 text-neutral-300">{SETUP_SQL}</pre>
                <p className="mt-2 ia-muted leading-relaxed">Supabase → SQL Editor → New query → wklej → Run. Tworzy tabelę <code>squad_players</code> z uprawnieniami potrzebnymi do zapisu.</p>
              </div>

              <div>
                <div className="ia-label">Kopia zapasowa</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleExportDatabase} className="ia-btn ia-ghost"><Icon name="download" className="w-3.5 h-3.5" /> Eksport .json</button>
                  <label className="ia-btn ia-ghost cursor-pointer"><Icon name="upload" className="w-3.5 h-3.5" /> Import .json
                    <input type="file" accept=".json,application/json" onChange={handleImportDatabase} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------ HEADER ------------------------------ */}
        <header className="ia-header sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl ia-grad flex items-center justify-center shadow-lg shrink-0"><Icon name="cpu" className="w-5 h-5" /></div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-none">IRON <span className="ia-grad-text">ARCHIVE</span></h1>
                <p className="text-[11px] ia-muted hidden sm:block mt-1">Sylwetki • AI • Siła • Kalorie</p>
              </div>
            </div>

            <nav className="hidden md:flex ia-glass rounded-2xl p-1 gap-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => changeTab(t.id)} className={`ia-tab ${activeTab === t.id ? 'on' : ''}`}>
                  <Icon name={t.icon} className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowSettings(true)} title="Ustawienia i synchronizacja" className="ia-btn ia-ghost !px-2.5 !py-2 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${syncMeta.dot}`} />
                <span className="hidden sm:inline">{syncMeta.label}</span>
                {cfg && dirtyCount > 0 && sync.kind !== 'saving' && <span className="px-1.5 rounded-full bg-amber-400 text-stone-950 text-[10px]">{dirtyCount}</span>}
                <Icon name="settings" className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowAddPlayer(!showAddPlayer)} className="ia-btn ia-accent-bg !px-3">
                <Icon name="plus" className="w-4 h-4" /> <span className="hidden sm:inline">Dodaj osobę</span>
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto ia-scroll flex-1 min-w-0 py-0.5">
              {enrichedPlayers.map((p) => (
                <button key={p.id} onClick={() => setActiveId(p.id)} className={`ia-chip ${activeId === p.id ? 'on' : ''}`}>
                  <Avatar name={p.name} size={24} />
                  <span>{p.name}</span>
                  {pinnedId === p.id && <Icon name="lock" className="w-3 h-3" />}
                </button>
              ))}
            </div>
            <button onClick={() => setPinnedId(pinnedId === activeId ? '' : activeId)} className={`ia-btn !py-1.5 !px-2.5 text-[11px] shrink-0 ${pinnedId === activeId ? 'ia-soft' : 'ia-ghost'}`}>
              <Icon name={pinnedId === activeId ? 'lock' : 'unlock'} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{pinnedId === activeId ? 'Mój telefon' : 'Przypnij'}</span>
            </button>
            {players.length > 1 && !isLocked && (
              <button onClick={() => handleDeletePlayer(activeId)} title="Usuń aktywną osobę" className="ia-btn ia-ghost ia-danger !p-2 shrink-0"><Icon name="trash" className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </header>

        {showAddPlayer && (
          <div className="max-w-7xl mx-auto px-4 pt-4 ia-pop">
            <form onSubmit={handleAddPlayer} className="ia-glass ia-card p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase">Nowa osoba</h3>
                <button type="button" onClick={() => setShowAddPlayer(false)} className="ia-btn ia-ghost !p-2"><Icon name="close" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="col-span-2">
                  <label className="ia-label">Imię *</label>
                  <input type="text" required placeholder="Imię…" value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} className="ia-input" />
                </div>
                <div>
                  <label className="ia-label">Cel</label>
                  <select value={newPlayer.goal} onChange={(e) => setNewPlayer({ ...newPlayer, goal: e.target.value })} className="ia-input">
                    <option value="Redukcja">Redukcja</option>
                    <option value="Rekompozycja">Rekompozycja</option>
                    <option value="Czysta Masa">Czysta Masa</option>
                    <option value="Masa Siłowa">Masa Siłowa</option>
                  </select>
                </div>
                <div><label className="ia-label">Kcal</label><input type="number" value={newPlayer.dietKcal} onChange={(e) => setNewPlayer({ ...newPlayer, dietKcal: e.target.value })} className="ia-input" /></div>
                <div><label className="ia-label">Wzrost (cm)</label><input type="number" value={newPlayer.heightCm} onChange={(e) => setNewPlayer({ ...newPlayer, heightCm: e.target.value })} className="ia-input" /></div>
                <div><label className="ia-label">Waga (kg)</label><input type="number" step="0.1" value={newPlayer.weight} onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })} className="ia-input" /></div>
                <div><label className="ia-label">Pas (cm)</label><input type="number" step="0.5" value={newPlayer.waist} onChange={(e) => setNewPlayer({ ...newPlayer, waist: e.target.value })} className="ia-input" /></div>
                <div className="flex items-end"><button type="submit" className="ia-btn ia-accent-bg w-full !py-2.5">Zapisz</button></div>
              </div>
            </form>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 pt-5 space-y-5">
          {/* ------------------------- PASEK STATYSTYK AKTYWNEGO ------------------------- */}
          {currentEnriched && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="ia-glass ia-card p-4 col-span-2 lg:col-span-1 ia-up">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${getGoalBadgeStyle(currentEnriched.goal)}`}>{currentEnriched.goal}</span>
                  {!isLocked && (
                    <button onClick={() => setEditingDiet(!editingDiet)} className="text-[11px] font-bold ia-accent hover:underline">{editingDiet ? 'Zamknij' : 'Zmień'}</button>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums"><CountUp value={currentEnriched.dietKcal} /></span>
                  <span className="text-xs ia-muted font-bold">kcal / dzień</span>
                </div>
                <div className="text-[11px] ia-muted mt-1 flex items-center gap-1"><Icon name="flame" className="w-3 h-3" /> {currentEnriched.tdee ? 'TDEE z wywiadu' : 'CPM'}: <strong className="text-white">{currentEnriched.cpmData.cpm}</strong> kcal</div>
              </div>

              <div className="ia-glass ia-card p-4 col-span-2 lg:col-span-1 ia-up" style={{ animationDelay: '60ms' }}>
                <div className="text-[11px] ia-muted font-bold uppercase tracking-wide mb-2">Makroskładniki</div>
                <StackBar parts={[
                  { key: 'p', label: 'Białko', value: currentEnriched.macros.protein * 4, cls: 'bg-rose-400' },
                  { key: 'f', label: 'Tłuszcz', value: currentEnriched.macros.fat * 9, cls: 'bg-amber-400' },
                  { key: 'c', label: 'Węgle', value: currentEnriched.macros.carbs * 4, cls: 'bg-emerald-400' }
                ]} />
                <div className="grid grid-cols-3 gap-1 mt-2.5 text-[11px]">
                  <div><div className="text-rose-300 font-black text-sm tabular-nums">{currentEnriched.macros.protein}g</div><div className="ia-faint">białko</div></div>
                  <div><div className="text-amber-300 font-black text-sm tabular-nums">{currentEnriched.macros.fat}g</div><div className="ia-faint">tłuszcz</div></div>
                  <div><div className="text-emerald-300 font-black text-sm tabular-nums">{currentEnriched.macros.carbs}g</div><div className="ia-faint">węgle</div></div>
                </div>
              </div>

              <div className="ia-glass ia-card p-4 ia-up" style={{ animationDelay: '120ms' }}>
                <div className="text-[11px] ia-muted font-bold uppercase tracking-wide">BMI</div>
                <div className="text-3xl font-black mt-1 tabular-nums">{currentEnriched.bmiData.bmi}</div>
                <div className={`text-[11px] font-bold mt-1 ${currentEnriched.bmiData.tone}`}>{currentEnriched.bmiData.label}</div>
                <div className="text-[11px] ia-faint mt-1">{currentEnriched.currentWeight} kg • {currentEnriched.heightCm} cm</div>
              </div>

              <div className="ia-glass ia-card p-4 flex items-center gap-3 ia-up" style={{ animationDelay: '180ms' }}>
                <ScoreRing value={currentEnriched.ai.overall} size={72} stroke={7} big={false} />
                <div>
                  <div className="text-[11px] ia-muted font-bold uppercase tracking-wide">Ocena AI</div>
                  <div className="text-[11px] ia-faint mt-1">V-Taper <strong className="text-white">{currentEnriched.ai.vTaper}</strong></div>
                  <div className="text-[11px] ia-faint">~{currentEnriched.ai.estBf}% BF</div>
                </div>
              </div>
            </section>
          )}

          {editingDiet && !isLocked && (
            <form onSubmit={handleSaveDietProtocol} className="ia-glass ia-card p-4 flex flex-wrap items-end gap-3 text-xs ia-pop">
              <div>
                <label className="ia-label">Cel sylwetkowy</label>
                <select value={dietDraft.goal} onChange={(e) => setDietDraft({ ...dietDraft, goal: e.target.value })} className="ia-input">
                  <option value="Redukcja">Redukcja</option>
                  <option value="Rekompozycja">Rekompozycja</option>
                  <option value="Czysta Masa">Czysta Masa</option>
                  <option value="Masa Siłowa">Masa Siłowa</option>
                </select>
              </div>
              <div className="w-32"><label className="ia-label">Kalorie</label><input type="number" step="50" value={dietDraft.dietKcal} onChange={(e) => setDietDraft({ ...dietDraft, dietKcal: e.target.value })} className="ia-input" /></div>
              <div className="w-28"><label className="ia-label">Białko (g)</label><input type="number" step="5" value={dietDraft.dietProtein} onChange={(e) => setDietDraft({ ...dietDraft, dietProtein: e.target.value })} className="ia-input" /></div>
              <button type="submit" className="ia-btn ia-accent-bg"><Icon name="check" className="w-3.5 h-3.5" /> Zapisz</button>
              <span className="ia-muted text-[11px] pb-2">Chcesz dokładniejsze liczby? Zrób wywiad w zakładce „Kalorie”.</span>
            </form>
          )}

          {/* ================== ZAKŁADKA 1: ZDJĘCIA & SĘDZIA AI ================== */}
          {activeTab === 'ai_physique' && currentEnriched && (
            <div key="t1" className="grid grid-cols-1 lg:grid-cols-12 gap-5 ia-up">
              <div className="lg:col-span-4 ia-glass ia-card p-5 h-fit">
                <h3 className="text-sm font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Icon name="camera" className="w-4 h-4 ia-accent" /> Dodaj zdjęcie ({currentEnriched.name})
                </h3>
                <p className="text-xs ia-muted mb-4">Wgraj zdjęcie z szatni – Sędzia AI oceni sylwetkę i wskaże braki.</p>

                {isLocked ? (
                  <div className="p-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs leading-relaxed">
                    Przeglądasz profil znajomego. Wybierz swoje imię u góry albo odepnij „Mój telefon”.
                  </div>
                ) : (
                  <form onSubmit={handleSaveBodyAndPhoto} className="space-y-3.5 text-xs">
                    <div>
                      <div className="ia-label">Kadr dla AI</div>
                      <div className="ia-seg">
                        {[{ val: 1.0, label: 'Całe' }, { val: 1.4, label: 'Tors' }, { val: 1.8, label: 'Blisko' }].map((z) => (
                          <button type="button" key={z.val} onClick={() => handleChangeZoom(z.val)} className={Math.abs(photoZoom - z.val) < 0.05 ? 'on' : ''}>{z.label} {z.val}x</button>
                        ))}
                      </div>
                    </div>

                    <label className="block border-2 border-dashed border-white/15 rounded-2xl p-3 text-center cursor-pointer hover:border-[rgb(var(--ac)/.7)] transition-colors ia-sub">
                      <input type="file" accept="image/*" onChange={handleSelectPhotoFile} className="hidden" />
                      {isAnalyzingPhoto ? (
                        <div className="py-8 space-y-3">
                          <Icon name="sparkles" className="w-8 h-8 mx-auto ia-spin ia-accent" />
                          <div className="font-bold text-sm">Sędzia AI analizuje sylwetkę…</div>
                          <div className="h-2 rounded-full ia-shimmer mx-6" />
                        </div>
                      ) : bodyForm.photoPreview ? (
                        <div className="space-y-2 ia-pop">
                          <img src={bodyForm.photoPreview} alt="Podgląd" className="w-full h-60 object-cover rounded-xl mx-auto" />
                          <span className="inline-block text-[11px] font-bold ia-accent">Kliknij, aby wybrać inne zdjęcie</span>
                        </div>
                      ) : (
                        <div className="py-7 space-y-2">
                          <div className="w-12 h-12 rounded-2xl ia-soft mx-auto flex items-center justify-center"><Icon name="upload" className="w-5 h-5" /></div>
                          <div className="font-bold text-sm">Wgraj zdjęcie sylwetki</div>
                          <div className="text-[11px] ia-faint">Ocena 1–10 + analiza braków</div>
                        </div>
                      )}
                    </label>

                    {bodyForm.autoAiResult && (
                      <div className="ia-soft rounded-2xl p-4 space-y-3 ia-pop">
                        <div className="flex items-center gap-3">
                          <ScoreRing value={bodyForm.autoAiResult.overall} size={64} stroke={6} big={false} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase flex items-center gap-1"><Icon name="sparkles" className="w-3 h-3" /> {bodyForm.autoAiResult.source}</div>
                            <div className="text-[11px] text-white/70 mt-1">V-Taper {bodyForm.autoAiResult.vScore} • Def. (~{bodyForm.autoAiResult.estBf}%) {bodyForm.autoAiResult.defScore} • Ramiona {bodyForm.autoAiResult.armScore}</div>
                          </div>
                        </div>
                        <div className="text-white pt-2 border-t border-white/10"><VerdictList verdict={bodyForm.autoAiResult.verdict} compact /></div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div><label className="ia-label">Waga (kg)</label><input type="number" step="0.1" placeholder={currentEnriched.currentWeight} value={bodyForm.weight} onChange={(e) => setBodyForm({ ...bodyForm, weight: e.target.value })} className="ia-input" /></div>
                      <div><label className="ia-label">Pas (cm)</label><input type="number" step="0.5" placeholder={currentEnriched.measurements.waist.current} value={bodyForm.waist} onChange={(e) => setBodyForm({ ...bodyForm, waist: e.target.value })} className="ia-input" /></div>
                      <div><label className="ia-label">Biceps (cm)</label><input type="number" step="0.5" placeholder={currentEnriched.measurements.biceps.current} value={bodyForm.biceps} onChange={(e) => setBodyForm({ ...bodyForm, biceps: e.target.value })} className="ia-input" /></div>
                      <div><label className="ia-label">Klatka (cm)</label><input type="number" step="0.5" placeholder={currentEnriched.measurements.chest.current} value={bodyForm.chest} onChange={(e) => setBodyForm({ ...bodyForm, chest: e.target.value })} className="ia-input" /></div>
                    </div>
                    <div><label className="ia-label">Komentarz</label><input type="text" placeholder="np. rano na czczo" value={bodyForm.note} onChange={(e) => setBodyForm({ ...bodyForm, note: e.target.value })} className="ia-input" /></div>
                    <button type="submit" className="ia-btn ia-accent-bg w-full !py-3 text-sm"><Icon name="check" className="w-4 h-4" /> Zapisz zdjęcie w bazie</button>
                  </form>
                )}
              </div>

              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-tight">Tablica sylwetek ekipy <span className="ia-muted">({enrichedPlayers.length})</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {enrichedPlayers.map((p, cardIdx) => {
                    const totalPhotos = (p.photos || []).length;
                    const currIdx = Math.min(photoIdxMap[p.id] || 0, Math.max(0, totalPhotos - 1));
                    const displayedPhoto = p.photos?.[currIdx] || p.photos?.[0];
                    const photoEval = evaluatePhysiqueAI(p, currIdx);
                    const verdict = displayedPhoto?.aiVision?.verdict || photoEval.summary;
                    const reactions = displayedPhoto?.reactions || { dzik: 0, swinia: 0, bocian: 0, podejrzany: 0 };
                    const comments = displayedPhoto?.comments || [];
                    const draft = commentDrafts[displayedPhoto?.id] || '';

                    return (
                      <div key={p.id} className="ia-glass ia-card ia-lift overflow-hidden flex flex-col ia-up group" style={{ animationDelay: `${Math.min(cardIdx, 6) * 70}ms` }}>
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Avatar name={p.name} size={26} />
                              <h4 className="text-base font-black">{p.name}</h4>
                              {p.badges.map((b, bIdx) => (<span key={bIdx} className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${b.color}`}>{b.text}</span>))}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getGoalBadgeStyle(p.goal)}`}>{p.goal} • {p.dietKcal} kcal</span>
                              <span className={`text-[11px] font-bold ${p.bmiData.tone}`}>BMI {p.bmiData.bmi}</span>
                            </div>
                          </div>
                          <ScoreRing key={`${p.id}-${currIdx}`} value={photoEval.overall} size={66} stroke={7} big={false} />
                        </div>

                        {displayedPhoto && (
                          <div className="relative bg-black h-72 overflow-hidden">
                            <img src={displayedPhoto.url} alt={p.name} onClick={() => setLightboxPhoto({ ...displayedPhoto, playerName: p.name })} className="ia-zoom w-full h-full object-cover cursor-zoom-in" />
                            {totalPhotos > 1 && (
                              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-xl text-[11px] font-bold text-white">
                                <button type="button" disabled={currIdx >= totalPhotos - 1} onClick={() => setPhotoIdxMap((prev) => ({ ...prev, [p.id]: Math.min(totalPhotos - 1, currIdx + 1) }))} className="px-1.5 hover:text-[rgb(var(--ac))] disabled:opacity-30">◀</button>
                                <span className="tabular-nums">{totalPhotos - currIdx} z {totalPhotos}</span>
                                <button type="button" disabled={currIdx <= 0} onClick={() => setPhotoIdxMap((prev) => ({ ...prev, [p.id]: Math.max(0, currIdx - 1) }))} className="px-1.5 hover:text-[rgb(var(--ac))] disabled:opacity-30">▶</button>
                              </div>
                            )}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              {totalPhotos > 1 && (!pinnedId || pinnedId === p.id) && (
                                <button type="button" onClick={() => handleDeletePhoto(p.id, displayedPhoto.id)} title="Usuń zdjęcie" className="bg-rose-600/90 hover:bg-rose-500 p-1.5 rounded-xl text-white transition-colors"><Icon name="trash" className="w-3.5 h-3.5" /></button>
                              )}
                              <button type="button" onClick={() => setLightboxPhoto({ ...displayedPhoto, playerName: p.name })} className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-white">Powiększ</button>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-10 text-xs text-white pointer-events-none">
                              <div className="flex justify-between font-bold gap-2">
                                <span>{displayedPhoto.date}</span>
                                <span className="tabular-nums">{displayedPhoto.weight} kg • pas {displayedPhoto.waist} cm</span>
                              </div>
                              <div className="text-[11px] text-neutral-300 truncate mt-0.5">{displayedPhoto.note}</div>
                            </div>
                          </div>
                        )}

                        <div className="px-4 py-2.5 border-y border-white/8 bg-black/25 flex flex-wrap items-center gap-2">
                          {[
                            { key: 'dzik', icon: '🦍', count: reactions.dzik },
                            { key: 'swinia', icon: '🐷', count: reactions.swinia },
                            { key: 'bocian', icon: '🦩', count: reactions.bocian },
                            { key: 'podejrzany', icon: '💉', count: reactions.podejrzany }
                          ].map((r) => (
                            <button key={r.key} onClick={() => handleAddReaction(p.id, displayedPhoto.id, r.key)} className="px-2.5 py-1 rounded-xl bg-white/6 hover:bg-white/12 text-xs font-bold flex items-center gap-1.5 border border-white/10 hover:border-[rgb(var(--ac)/.5)] transition-colors active:scale-95">
                              <span className={bumpKey === `${displayedPhoto.id}:${r.key}` ? 'ia-bump inline-block' : 'inline-block'}>{r.icon}</span>
                              <span className="tabular-nums">{r.count || 0}</span>
                            </button>
                          ))}
                        </div>

                        <div className="p-4 space-y-4 text-xs">
                          <div className="grid grid-cols-1 gap-2.5">
                            <MetricBar label="V-Taper" value={photoEval.vScore} />
                            <MetricBar label={`Definicja (~${photoEval.estBf}% BF)`} value={photoEval.defScore} />
                            <MetricBar label="Umięśnienie" value={photoEval.armScore} />
                            <div className="flex justify-between text-[11px] pt-0.5"><span className="ia-muted font-semibold">Progres AI</span><strong className={photoEval.progressTone}>{photoEval.progressLabel}</strong></div>
                          </div>

                          <div className="rounded-2xl ia-sub p-3.5 space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-wide ia-accent">Analiza i braki • {photoEval.source}</div>
                            <VerdictList verdict={verdict} />
                          </div>

                          <div className="space-y-2">
                            <div className="font-bold text-[11px] uppercase flex items-center gap-1.5 ia-muted"><Icon name="message" className="w-3.5 h-3.5" /> Komentarze ekipy ({comments.length})</div>
                            {comments.map((c, cIdx) => (
                              <div key={cIdx} className="px-3 py-2 rounded-2xl rounded-tl-md bg-white/6 text-[11.5px] border border-white/8 ia-fade">
                                <span className="font-black ia-accent">{c.author}: </span><span className="text-neutral-200">{c.text}</span>
                              </div>
                            ))}
                            {!isLocked && displayedPhoto && (
                              <form onSubmit={(e) => handleAddComment(p.id, displayedPhoto.id, e)} className="flex gap-1.5 pt-1">
                                <input type="text" placeholder={`Szczera opinia jako ${activePlayer.name}…`} value={draft} onChange={(e) => setCommentDrafts((d) => ({ ...d, [displayedPhoto.id]: e.target.value }))} className="ia-input !text-[11.5px] !py-2" />
                                <button type="submit" className="ia-btn ia-accent-bg !px-3.5">Wyślij</button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================== ZAKŁADKA 2: RANKING & 1v1 ================== */}
          {activeTab === 'ranking' && (
            <div key="t2" className="space-y-5 ia-up">
              <div className="ia-glass ia-card p-5 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-base font-black uppercase tracking-tight">Klasyfikacja ekipy</h2>
                  <div className="ia-seg text-xs">
                    {[{ id: 'ai', label: 'Ocena AI' }, { id: 'dots', label: 'Siła DOTS' }, { id: 'total', label: 'Trójbój' }, { id: 'bmi', label: 'BMI' }].map((s) => (
                      <button key={s.id} onClick={() => setSortBy(s.id)} className={sortBy === s.id ? 'on' : ''}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 ia-muted uppercase text-[10px] tracking-wide">
                      <th className="py-3 px-2">#</th><th className="py-3 px-2">Zawodnik</th><th className="py-3 px-2">Cel & makro</th><th className="py-3 px-2">Waga</th><th className="py-3 px-2">BMI & BF</th><th className="py-3 px-2">V-Taper</th><th className="py-3 px-2">DOTS</th><th className="py-3 px-2 text-right">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((p, idx) => {
                      const latestPhoto = p.photos?.[0];
                      return (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors ia-up" style={{ animationDelay: `${idx * 60}ms` }}>
                          <td className="py-3 px-2 font-black text-base">{['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              {latestPhoto && <img src={latestPhoto.url} alt={p.name} onClick={() => setLightboxPhoto({ ...latestPhoto, playerName: p.name })} className="w-11 h-14 object-cover rounded-xl border border-white/10 cursor-zoom-in hover:scale-105 transition-transform" />}
                              <div>
                                <div className="font-black text-sm flex items-center gap-1.5 flex-wrap"><span>{p.name}</span>{p.badges[0] && <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${p.badges[0].color}`}>{p.badges[0].text}</span>}</div>
                                <div className="text-[11px] ia-muted">{p.heightCm} cm</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${getGoalBadgeStyle(p.goal)}`}>{p.goal} • {p.dietKcal} kcal</span>
                            <div className="text-[11px] mt-1 ia-muted">B:{p.macros.protein}g T:{p.macros.fat}g W:{p.macros.carbs}g</div>
                          </td>
                          <td className="py-3 px-2 font-black text-sm tabular-nums">{p.currentWeight} kg</td>
                          <td className="py-3 px-2"><div className="font-black text-sm tabular-nums">BMI {p.bmiData.bmi}</div><div className={`text-[11px] ${p.bmiData.tone}`}>~{p.ai.estBf}% BF</div></td>
                          <td className="py-3 px-2 font-bold tabular-nums">{p.ai.vTaper}</td>
                          <td className="py-3 px-2 font-black text-sm tabular-nums">{p.stats.dots}</td>
                          <td className="py-3 px-2 text-right font-black ia-accent tabular-nums">{p.ai.overall}/10</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {enrichedPlayers.length > 1 && duelA && duelB && (
                <div className="ia-glass ia-card p-5 space-y-5 ia-up" style={{ animationDelay: '120ms' }}>
                  <h2 className="text-base font-black uppercase tracking-tight">Pojedynek 1v1 ⚔️</h2>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-2"><Avatar name={duelA.name} size={34} />
                      <select value={duelA.id} onChange={(e) => setCompA(e.target.value)} className="ia-input">{enrichedPlayers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
                    </div>
                    <span className="font-black ia-grad-text text-lg">VS</span>
                    <div className="flex items-center gap-2"><Avatar name={duelB.name} size={34} />
                      <select value={duelB.id} onChange={(e) => setCompB(e.target.value)} className="ia-input">{enrichedPlayers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
                    </div>
                  </div>
                  <div key={`${duelA.id}-${duelB.id}`} className="space-y-4">
                    <DuelRow label="Ocena AI" a={duelA.ai.overall} b={duelB.ai.overall} fmt={(v) => Number(v).toFixed(1)} />
                    <DuelRow label="V-Taper" a={duelA.ai.vTaper} b={duelB.ai.vTaper} />
                    <DuelRow label="DOTS" a={duelA.stats.dots} b={duelB.stats.dots} />
                    <DuelRow label="Trójbój 1RM" a={duelA.stats.total1RM} b={duelB.stats.total1RM} fmt={(v) => `${v} kg`} />
                    <DuelRow label="Obwód pasa" a={duelA.measurements.waist.current} b={duelB.measurements.waist.current} lowerBetter fmt={(v) => `${v} cm`} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================== ZAKŁADKA 3: WYWIAD KALORYCZNY ================== */}
          {activeTab === 'cpm' && currentEnriched && (
            <div key="t3" className="max-w-3xl mx-auto ia-up">
              <div className="ia-glass ia-card p-5 sm:p-6 space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2"><Icon name="activity" className="w-4 h-4 ia-accent" /> Wywiad kaloryczny</h3>
                    <p className="text-xs ia-muted mt-1">Odpowiedz na kilka pytań – policzymy zapotrzebowanie z osobna dla pracy, kroków i treningu, a nie jednym mnożnikiem. Profil: <strong className="text-white">{currentEnriched.name}</strong>.</p>
                  </div>
                  {wizCalc.valid && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] ia-muted uppercase font-bold">Na żywo</div>
                      <div className="text-xl font-black ia-accent tabular-nums"><CountUp value={wizCalc.tdee} /></div>
                      <div className="text-[10px] ia-faint">kcal TDEE</div>
                    </div>
                  )}
                </div>

                {/* pasek postępu */}
                <div className="flex items-center">
                  {WIZ_STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                      <button type="button" onClick={() => (i <= wizStep || wizCalc.valid) && goWiz(i)} className="flex flex-col items-center gap-1.5 group/step">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${i === wizStep ? 'ia-grad scale-110 shadow-lg' : i < wizStep ? 'ia-soft' : 'bg-white/8 text-white/50'}`}>
                          {i < wizStep ? <Icon name="check" className="w-3.5 h-3.5" /> : i + 1}
                        </span>
                        <span className={`text-[10px] font-bold hidden sm:block ${i === wizStep ? 'text-white' : 'ia-faint'}`}>{s}</span>
                      </button>
                      {i < WIZ_STEPS.length - 1 && <div className="flex-1 h-0.5 mx-1.5 sm:mb-5 rounded-full bg-white/10 overflow-hidden"><div className="h-full ia-grad" style={{ width: i < wizStep ? '100%' : '0%', transition: 'width .5s ease' }} /></div>}
                    </React.Fragment>
                  ))}
                </div>

                <div key={wizStep} className={wizDir === 'l' ? 'ia-sl' : 'ia-sr'}>
                  {/* KROK 1: CIAŁO */}
                  {wizStep === 0 && (
                    <div className="space-y-4">
                      <h4 className="font-black text-sm">Kilka podstawowych danych</h4>
                      <div>
                        <div className="ia-label">Płeć</div>
                        <div className="ia-seg max-w-xs">
                          <button type="button" className={wiz.sex === 'M' ? 'on' : ''} onClick={() => setWizField({ sex: 'M' })}>Mężczyzna</button>
                          <button type="button" className={wiz.sex === 'K' ? 'on' : ''} onClick={() => setWizField({ sex: 'K' })}>Kobieta</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="ia-label">Wiek</label><input type="number" value={wiz.age} onChange={(e) => setWizField({ age: e.target.value })} className="ia-input" /></div>
                        <div><label className="ia-label">Wzrost (cm)</label><input type="number" value={wiz.height} onChange={(e) => setWizField({ height: e.target.value })} className="ia-input" /></div>
                        <div><label className="ia-label">Waga (kg)</label><input type="number" step="0.1" value={wiz.weight} onChange={(e) => setWizField({ weight: e.target.value })} className="ia-input" /></div>
                      </div>
                      <div>
                        <label className="ia-label">Tkanka tłuszczowa % <span className="ia-faint font-medium">(opcjonalnie – zwiększa dokładność)</span></label>
                        <div className="flex gap-2">
                          <input type="number" step="0.5" placeholder="np. 18" value={wiz.bf} onChange={(e) => setWizField({ bf: e.target.value })} className="ia-input" />
                          <button type="button" onClick={() => setWizField({ bf: String(currentEnriched.ai.estBf) })} className="ia-btn ia-ghost shrink-0"><Icon name="sparkles" className="w-3.5 h-3.5" /> Z oceny AI (~{currentEnriched.ai.estBf}%)</button>
                        </div>
                      </div>
                      <p className="text-[11px] ia-muted leading-relaxed">Z podanym % tłuszczu liczymy wzorem Katcha-McArdle’a (lepszy dla osób umięśnionych), bez – Mifflin-St Jeor. Szacunek AI ze zdjęcia jest orientacyjny.</p>
                      {!wizCalc.valid && <p className="text-[11px] text-amber-300">Sprawdź wartości: wiek 14–90, wzrost 120–230 cm, waga 30–250 kg.</p>}
                    </div>
                  )}

                  {/* KROK 2: STYL ŻYCIA */}
                  {wizStep === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-black text-sm mb-3">Jaką masz pracę / zajęcia w ciągu dnia?</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {JOB_OPTIONS.map((j) => (<OptionCard key={j.id} active={wiz.job === j.id} onClick={() => setWizField({ job: j.id })} emoji={j.emoji} title={j.title} desc={j.desc} />))}
                        </div>
                      </div>
                      <div>
                        <Slider label="Średnio kroków dziennie (z telefonu / zegarka)" value={wiz.steps} min={2000} max={25000} step={500} onChange={(v) => setWizField({ steps: v })} format={(v) => `${v.toLocaleString('pl-PL')} (~${(v * 0.00075).toFixed(1)} km)`} />
                        <p className="text-[11px] ia-faint mt-2">Nie wiesz? Zerknij na statystyki z ostatnich 2 tygodni w telefonie. Treningowych kroków nie odejmuj.</p>
                      </div>
                    </div>
                  )}

                  {/* KROK 3: TRENING */}
                  {wizStep === 2 && (
                    <div className="space-y-5">
                      <h4 className="font-black text-sm">Trening siłowy</h4>
                      <Slider label="Treningi w tygodniu" value={wiz.gymDays} min={0} max={7} onChange={(v) => setWizField({ gymDays: v })} format={(v) => `${v}×`} />
                      <Slider label="Czas jednego treningu" value={wiz.sessionMin} min={30} max={150} step={5} disabled={wiz.gymDays === 0} onChange={(v) => setWizField({ sessionMin: v })} format={(v) => `${v} min`} />
                      <div className={wiz.gymDays === 0 ? 'opacity-40 pointer-events-none' : ''}>
                        <div className="ia-label">Jak ciężko trenujesz?</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {GYM_INTENSITY.map((g) => (<OptionCard key={g.id} active={wiz.gymIntensity === g.id} onClick={() => setWizField({ gymIntensity: g.id })} emoji={g.emoji} title={g.title} desc={g.desc} />))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10 space-y-4">
                        <h4 className="font-black text-sm">Cardio (poza treningiem siłowym)</h4>
                        <Slider label="Łącznie w tygodniu" value={wiz.cardioMin} min={0} max={420} step={15} onChange={(v) => setWizField({ cardioMin: v })} format={(v) => (v === 0 ? 'brak' : `${v} min`)} />
                        <div className={wiz.cardioMin === 0 ? 'opacity-40 pointer-events-none' : ''}>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {CARDIO_INTENSITY.map((g) => (<OptionCard key={g.id} active={wiz.cardioIntensity === g.id} onClick={() => setWizField({ cardioIntensity: g.id })} emoji={g.emoji} title={g.title} desc={g.desc} />))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KROK 4: CEL */}
                  {wizStep === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-black text-sm mb-3">Co chcesz osiągnąć?</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {GOALS.map((g) => (<OptionCard key={g.id} active={wiz.goal === g.id} onClick={() => pickGoal(g.id)} emoji={g.emoji} title={g.name} desc={g.desc} />))}
                        </div>
                      </div>
                      {(GOALS.find((g) => g.id === wiz.goal) || GOALS[0]).paces.length > 1 && (
                        <div className="ia-up">
                          <div className="ia-label">W jakim tempie?</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {(GOALS.find((g) => g.id === wiz.goal) || GOALS[0]).paces.map((pc) => (
                              <OptionCard key={pc.id} active={wiz.pace === pc.id} onClick={() => setWizField({ pace: pc.id })} title={pc.label} desc={`${pc.kcal > 0 ? '+' : ''}${pc.kcal} kcal • ok. ${pc.kcal > 0 ? '+' : '−'}${Math.abs((pc.kcal * 7) / 7700).toFixed(2).replace('.', ',')} kg/tydz.`} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KROK 5: WYNIK */}
                  {wizStep === 4 && (
                    <div className="space-y-5">
                      {!wizCalc.valid ? (
                        <div className="p-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs">Uzupełnij poprawnie dane w kroku „Ciało”.</div>
                      ) : (
                        <>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="ia-soft rounded-2xl p-4">
                              <div className="text-[11px] font-black uppercase tracking-wide">Twój cel kaloryczny</div>
                              <div className="text-4xl font-black mt-1 tabular-nums text-white"><CountUp value={wizPlan.target} /> <span className="text-sm font-bold ia-muted">kcal</span></div>
                              <div className="text-[11px] mt-1.5 text-white/70">{wizPlan.goal.emoji} {wizPlan.goal.name} • {wizPlan.pace.label}{wizPlan.delta !== 0 && <> • {wizPlan.delta > 0 ? '+' : '−'}{Math.abs(wizPlan.delta)} kcal</>}</div>
                              <div className="text-[11px] mt-1 text-white/70">Spodziewana zmiana wagi: <strong className="text-white">{wizPlan.weekly === 0 ? 'ok. 0 kg' : `${wizPlan.weekly > 0 ? '+' : '−'}${Math.abs(wizPlan.weekly).toFixed(2).replace('.', ',')} kg`}/tydz.</strong></div>
                            </div>
                            <div className="ia-sub rounded-2xl p-4">
                              <div className="text-[11px] ia-muted font-black uppercase tracking-wide">Zapotrzebowanie (TDEE)</div>
                              <div className="text-4xl font-black mt-1 tabular-nums"><CountUp value={wizCalc.tdee} /> <span className="text-sm font-bold ia-muted">kcal</span></div>
                              <div className="text-[11px] mt-1.5 ia-muted">BMR {wizCalc.bmr} kcal • {wizCalc.method}</div>
                            </div>
                          </div>

                          <div className="ia-sub rounded-2xl p-4 space-y-3">
                            <div className="text-[11px] ia-muted font-black uppercase tracking-wide">Z czego składa się Twoje spalanie</div>
                            {(() => {
                              const rows = [
                                { key: 'bmr', label: 'Podstawowa przemiana (BMR)', value: wizCalc.parts.bmr, cls: 'bg-sky-400' },
                                { key: 'daily', label: 'Codzienne funkcjonowanie + trawienie', value: wizCalc.parts.daily, cls: 'bg-violet-400' },
                                { key: 'job', label: 'Praca / aktywność w ciągu dnia', value: wizCalc.parts.job, cls: 'bg-fuchsia-400' },
                                { key: 'steps', label: 'Kroki', value: wizCalc.parts.steps, cls: 'bg-emerald-400' },
                                { key: 'gym', label: 'Siłownia (średnio / dzień)', value: wizCalc.parts.gym, cls: 'bg-amber-400' },
                                { key: 'cardio', label: 'Cardio (średnio / dzień)', value: wizCalc.parts.cardio, cls: 'bg-rose-400' }
                              ];
                              return (
                                <>
                                  <StackBar parts={rows} height="h-4" />
                                  <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px]">
                                    {rows.map((r) => (
                                      <div key={r.key} className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-sm ${r.cls}`} /><span className="ia-muted flex-1">{r.label}</span><strong className="tabular-nums">{Math.round(r.value)}</strong></div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { k: 'Białko', v: wizPlan.macros.protein, per: (wizPlan.macros.protein / num(wiz.weight)).toFixed(1), c: 'text-rose-300' },
                              { k: 'Tłuszcze', v: wizPlan.macros.fat, per: (wizPlan.macros.fat / num(wiz.weight)).toFixed(1), c: 'text-amber-300' },
                              { k: 'Węglowodany', v: wizPlan.macros.carbs, per: (wizPlan.macros.carbs / num(wiz.weight)).toFixed(1), c: 'text-emerald-300' }
                            ].map((m) => (
                              <div key={m.k} className="ia-sub rounded-2xl p-3.5 text-center">
                                <div className={`text-2xl font-black tabular-nums ${m.c}`}>{m.v}<span className="text-sm">g</span></div>
                                <div className="text-[11px] font-bold mt-0.5">{m.k}</div>
                                <div className="text-[10px] ia-faint">{m.per} g/kg</div>
                              </div>
                            ))}
                          </div>

                          {wizPlan.notes.map((n, i) => (<div key={i} className="p-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-[11.5px] flex gap-2"><Icon name="alert" className="w-4 h-4 shrink-0 mt-0.5" />{n}</div>))}

                          <p className="text-[11px] ia-muted leading-relaxed">To szacunek z dokładnością ok. ±10%. Trzymaj się liczb przez 2–3 tygodnie i ważąc się rano na czczo oceniaj średnią tygodniową: jeśli waga nie idzie w oczekiwanym kierunku, skoryguj kalorie o 100–150 kcal.</p>

                          {isLocked ? (
                            <div className="p-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs">Przeglądasz profil znajomego – wybierz swoje imię, aby zapisać wynik.</div>
                          ) : (
                            <button type="button" onClick={applyInterviewToProfile} className="ia-btn ia-accent-bg w-full !py-3.5 text-sm"><Icon name="check" className="w-4 h-4" /> Zapisz w profilu ({currentEnriched.name})</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => goWiz(wizStep - 1)} disabled={wizStep === 0} className="ia-btn ia-ghost"><Icon name="arrowLeft" className="w-3.5 h-3.5" /> Wstecz</button>
                  {wizStep < WIZ_STEPS.length - 1 && (
                    <button type="button" onClick={() => goWiz(wizStep + 1)} disabled={wizStep === 0 && !wizCalc.valid} className="ia-btn ia-accent-bg">{wizStep === WIZ_STEPS.length - 2 ? 'Pokaż wynik' : 'Dalej'} <Icon name="arrowRight" className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================== ZAKŁADKA 4: SIŁOWNIA ================== */}
          {activeTab === 'gym' && currentEnriched && (
            <div key="t4" className="grid grid-cols-1 lg:grid-cols-3 gap-5 ia-up">
              <div className="space-y-5">
                <div className="ia-glass ia-card p-5">
                  <h3 className="text-sm font-black uppercase tracking-tight mb-3">Zapisz rekord / serię ({currentEnriched.name})</h3>
                  <form onSubmit={handleSaveLift} className="space-y-3 text-xs">
                    <select value={liftForm.exercise} onChange={(e) => setLiftForm({ ...liftForm, exercise: e.target.value })} className="ia-input">
                      <option value="bench">Wyciskanie leżąc (Bench Press)</option>
                      <option value="squat">Przysiad ze sztangą (Squat)</option>
                      <option value="deadlift">Martwy ciąg (Deadlift)</option>
                      <option value="ohp">Wyciskanie żołnierskie (OHP)</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="ia-label">Ciężar (kg)</label><input type="number" step="0.5" value={liftForm.weight} onChange={(e) => { setLiftForm({ ...liftForm, weight: e.target.value }); setPlateWeight(parseFloat(e.target.value) || 20); }} className="ia-input" /></div>
                      <div><label className="ia-label">Powtórzenia</label><input type="number" value={liftForm.reps} onChange={(e) => setLiftForm({ ...liftForm, reps: e.target.value })} className="ia-input" /></div>
                    </div>
                    <button type="submit" disabled={isLocked} className="ia-btn ia-accent-bg w-full !py-2.5">{isLocked ? 'Wybierz swój profil' : 'Zapisz bój i odpal stoper (90 s)'}</button>
                  </form>
                </div>

                <div className="ia-glass ia-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase">Kalkulator talerzy (gryf 20 kg)</h4>
                    <input type="number" step="2.5" value={plateWeight} onChange={(e) => setPlateWeight(parseFloat(e.target.value) || 20)} className="ia-input !w-24 !py-1 text-right" />
                  </div>
                  <div className="p-4 rounded-2xl ia-sub flex items-center justify-center min-h-[100px] overflow-x-auto">
                    <div className="w-8 h-3 bg-neutral-400 rounded-l" />
                    <div className="w-2 h-8 bg-neutral-300 mr-1" />
                    <div className="flex items-center gap-1">
                      {calcPlatesPerSide(plateWeight).map((p, i) => (<div key={i} className={`${p.color} ${p.h} px-1.5 rounded flex items-center justify-center text-[10px] font-black shadow ia-pop`} style={{ animationDelay: `${i * 50}ms` }}>{p.w}</div>))}
                    </div>
                    <div className="w-6 h-3 bg-neutral-400 rounded-r ml-1" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 ia-glass ia-card p-5">
                <h3 className="text-sm font-black uppercase tracking-tight mb-4">Rekordy siłowe ekipy (1RM)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ key: 'bench', label: 'Wyciskanie leżąc' }, { key: 'squat', label: 'Przysiad ze sztangą' }, { key: 'deadlift', label: 'Martwy ciąg' }, { key: 'ohp', label: 'Wyciskanie żołnierskie (OHP)' }].map((lift) => {
                    const rows = enrichedPlayers.map((p) => ({ p, raw: p.lifts[lift.key], rm: calc1RM(p.lifts[lift.key].weight, p.lifts[lift.key].reps) })).sort((a, b) => b.rm - a.rm);
                    const best = rows[0]?.rm || 1;
                    return (
                      <div key={lift.key} className="p-4 rounded-2xl ia-sub space-y-3">
                        <div className="text-xs font-black uppercase">{lift.label}</div>
                        {rows.map(({ p, raw, rm }, i) => (
                          <div key={p.id} className="text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5"><Avatar name={p.name} size={18} />{p.name}{i === 0 && rows.length > 1 && ' 👑'}</span>
                              <span><span className="ia-muted">{raw.weight} kg × {raw.reps}</span><span className="ml-2 font-black ia-accent tabular-nums">{rm} kg</span></span>
                            </div>
                            <div className="h-1 rounded-full bg-white/10 overflow-hidden"><div className="h-full ia-grad rounded-full" style={{ width: `${(rm / best) * 100}%`, transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} /></div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================== ZAKŁADKA 5: WYKRESY ================== */}
          {activeTab === 'charts' && currentEnriched && (
            <div key="t5" className="ia-glass ia-card p-5 space-y-5 ia-up">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase">Progres – {currentEnriched.name} <span className="ia-accent">• DOTS {currentEnriched.stats.dots}</span></h3>
                <div className="ia-seg overflow-x-auto ia-scroll max-w-full">
                  {[{ id: 'weight', label: 'Waga' }, { id: 'waist', label: 'Pas' }, { id: 'aiScore', label: 'Ocena AI' }, { id: 'bench1RM', label: 'Ławka 1RM' }, { id: 'kcal', label: 'Kalorie' }].map((m) => (
                    <button key={m.id} onClick={() => setChartMetric(m.id)} className={chartMetric === m.id ? 'on' : ''}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl ia-sub overflow-x-auto">
                <LineChart hist={currentEnriched.history} metric={chartMetric} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --------------------------- STOPER PRZERWY --------------------------- */}
      <div className={`fixed bottom-24 right-3 md:bottom-5 md:right-5 z-40 ${timerRunning || timerSec !== 90 || activeTab === 'gym' ? '' : 'hidden md:block'}`}>
        <div className={`ia-glass rounded-2xl px-3.5 py-2.5 flex items-center gap-3 transition-all duration-300 ${timerRunning ? 'shadow-[0_0_30px_-6px_rgb(var(--ac)/.6)]' : ''}`} style={{ background: 'rgba(17,17,19,.85)' }}>
          <Icon name="timer" className={`w-4 h-4 ia-accent ${timerRunning ? 'ia-pulse' : ''}`} />
          <div className="text-xs">
            <div className="text-[9px] uppercase font-bold ia-muted">Przerwa</div>
            <div className="text-base font-black tabular-nums leading-tight">{Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setTimerRunning(!timerRunning)} className="ia-btn ia-accent-bg !py-1 !px-2.5 text-[11px]">{timerRunning ? 'Pauza' : 'Start'}</button>
            <button onClick={() => { setTimerRunning(false); setTimerSec(90); }} className="ia-btn ia-ghost !py-1 !px-2 text-[11px]">Reset</button>
          </div>
        </div>
      </div>

      {/* ------------------------ DOLNA NAWIGACJA (TELEFON) ------------------------ */}
      <nav className="ia-nav-m ia-glass md:hidden" style={{ background: 'rgba(17,17,19,.88)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => changeTab(t.id)} className={activeTab === t.id ? 'on' : ''}>
            <Icon name={t.icon} className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
