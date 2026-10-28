// api/analyze.js  –  funkcja serwerowa (Vercel). Leży w głównym folderze repo: /api/analyze.js
//
// Wymaga zmiennej środowiskowej GEMINI_API_KEY (Vercel → Project → Settings → Environment Variables).
// Po dodaniu/zmianie zmiennej trzeba zrobić REDEPLOY, inaczej funkcja jej nie zobaczy.
// Opcjonalnie: GEMINI_MODEL – nazwa modelu, jeśli chcesz wymusić konkretny.
//
// Test w przeglądarce: otwórz  https://TWOJA-STRONA/api/analyze  → powinno pokazać {"ok":true,"hasKey":true,...}

// Modele próbowane po kolei. Stare nazwy (np. gemini-1.5-*) zostały wyłączone przez Google,
// a "model not found" jest jedną z najczęstszych przyczyn cichego błędu.
const MODELS = [process.env.GEMINI_MODEL, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'].filter(Boolean);

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const buildPrompt = (player = {}) => `Jesteś doświadczonym sędzią kulturystycznym i trenerem personalnym. Oceń sylwetkę osoby widocznej na zdjęciu.

Dane pomocnicze od użytkownika (traktuj jako wskazówkę, zdjęcie jest ważniejsze):
- wzrost: ${num(player.heightCm) ?? 'brak'} cm, waga: ${num(player.currentWeight) ?? 'brak'} kg, cel: ${player.goal || 'brak'}
- obwody: pas ${num(player.waist) ?? 'brak'} cm, klatka ${num(player.chest) ?? 'brak'} cm, biceps ${num(player.biceps) ?? 'brak'} cm

Skala ocen 1.0–10.0 (jedno miejsce po przecinku). 5 = przeciętna osoba rekreacyjna, 7 = wyraźnie wytrenowana, 9+ = poziom zawodniczy. Bądź uczciwy i konkretny, nie schlebiaj.

Zwróć WYŁĄCZNIE obiekt JSON (bez markdown, bez komentarzy) o polach:
{
  "usable": true lub false (false, jeśli na zdjęciu nie widać sylwetki człowieka albo jest zbyt ciemne/rozmazane),
  "vScore": ocena proporcji barki–talia (V-taper),
  "defScore": ocena definicji / poziomu tkanki tłuszczowej,
  "armScore": ocena rozwoju ramion i górnej części ciała,
  "estBf": szacowany % tkanki tłuszczowej (liczba całkowita),
  "lightingNote": krótka uwaga o jakości zdjęcia (światło, kadr, poza), max 80 znaków,
  "verdict": jeden string w dokładnie takim formacie: "Mocne strony: ... | Braki do poprawy: ... | Plan naprawczy: ..." (po polsku, każda część 1–2 zdania, trzy części rozdzielone znakiem " | ")
}`;

const extractJson = (text) => {
  if (!text) return null;
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
};

async function callGemini(model, apiKey, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const data = await r.json().catch(() => ({}));
    return { status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Szybki test działania: GET /api/analyze
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hasKey: Boolean(apiKey), models: MODELS });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Dozwolona metoda: POST' });
  }
  if (!apiKey) {
    return res.status(500).json({ error: 'Brak GEMINI_API_KEY w zmiennych środowiskowych serwera (po dodaniu zrób redeploy).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = null;
    }
  }
  const imageBase64 = body?.imageBase64;
  const mimeType = body?.mimeType || 'image/jpeg';
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Brak pola imageBase64 w żądaniu.' });
  }
  if (imageBase64.length > 4_000_000) {
    return res.status(413).json({ error: 'Zdjęcie jest za duże (limit ok. 4 MB po zakodowaniu).' });
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(body.player) }, { inline_data: { mime_type: mimeType, data: imageBase64 } }]
      }
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
  };

  let last = null;
  for (const model of MODELS) {
    try {
      const { status, data } = await callGemini(model, apiKey, requestBody);
      last = { model, status, data };

      // Zły/wyłączony model → próbujemy następny z listy.
      if (status === 404 || (status === 400 && /model/i.test(data?.error?.message || ''))) continue;
      if (status !== 200) break;

      const blockReason = data?.promptFeedback?.blockReason;
      const candidate = data?.candidates?.[0];
      if (blockReason || candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
        return res.status(422).json({
          error: `Gemini zablokował to zdjęcie filtrem bezpieczeństwa (${blockReason || candidate?.finishReason}). Spróbuj innego kadru.`
        });
      }

      const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('');
      const parsed = extractJson(text);
      if (!parsed) {
        return res.status(502).json({ error: 'Gemini zwrócił odpowiedź, której nie da się odczytać jako JSON.', raw: String(text).slice(0, 300) });
      }
      if (parsed.usable === false) {
        return res.status(422).json({ error: 'AI nie widzi na zdjęciu sylwetki (za ciemno, za blisko albo brak postaci). Zrób nowe zdjęcie.' });
      }

      const v = num(parsed.vScore);
      const d = num(parsed.defScore);
      const a = num(parsed.armScore);
      if (v === null || d === null || a === null) {
        return res.status(502).json({ error: 'Odpowiedź AI nie zawiera ocen vScore / defScore / armScore.', raw: String(text).slice(0, 300) });
      }

      return res.status(200).json({
        vScore: Math.round(clamp(v, 1, 10) * 10) / 10,
        defScore: Math.round(clamp(d, 1, 10) * 10) / 10,
        armScore: Math.round(clamp(a, 1, 10) * 10) / 10,
        estBf: Math.round(clamp(num(parsed.estBf) ?? 18, 4, 50)),
        lightingNote: String(parsed.lightingNote || 'Zweryfikowano przez Gemini Vision AI').slice(0, 120),
        verdict: String(parsed.verdict || '').trim() || 'Brak szczegółowej oceny.',
        model
      });
    } catch (err) {
      last = { model, status: 0, data: { error: { message: err.name === 'AbortError' ? 'Przekroczono czas odpowiedzi Gemini (25 s)' : err.message } } };
      if (err.name === 'AbortError') break;
    }
  }

  const msg = last?.data?.error?.message || 'Nieznany błąd Gemini';
  return res.status(502).json({ error: `Gemini (${last?.model}, HTTP ${last?.status}): ${String(msg).slice(0, 300)}` });
};
