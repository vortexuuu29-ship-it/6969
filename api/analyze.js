// Sędzia sylwetkowy AI (Gemini). Ocenia komplet zdjęć: przód, plecy i bok (albo pojedyncze zdjęcie – stary format).
// POST /api/analyze  { images: { front, back, side }  (base64 JPEG, brakujące ujęcia pomijamy)  |  imageBase64, player }
// Odpowiedź: oceny każdego ujęcia (views), średnie (vScore/defScore/armScore), mocne i słabe strony, werdykt, weryfikacja zdjęć.
const VIEW_LABELS = { front: 'PRZÓD', back: 'PLECY', side: 'BOK' };
const VIEW_FOCUS = {
  front: 'przód: szerokość barków, klatka, ramiona, brzuch (definicja)',
  back: 'plecy: szerokość i grubość pleców (najszerszy grzbiet, kaptury), tylne aktony barków, talia z tyłu',
  side: 'bok: postawa (kifoza/lordoza), wysunięcie brzucha, głębokość klatki, grubość ramion'
};

const callGemini = async (apiKey, payload) => {
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = 'Brak odpowiedzi z modeli Gemini';
  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) return { data };
      lastError = data?.error?.message || `HTTP ${response.status} (${modelName})`;
    } catch (fetchErr) {
      lastError = fetchErr.message;
    }
  }
  return { error: lastError };
};

const avg = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);
const round1 = (v) => Math.round(v * 10) / 10;
const cleanList = (v, max) => (Array.isArray(v) ? v : [])
  .map((x) => String(x || '').replace(/[|\r\n]+/g, ' ').replace(/\.$/, '').trim().slice(0, 140))
  .filter(Boolean)
  .slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Dozwolona tylko metoda POST' });
  }

  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY na serwerze Vercel' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { player } = body;
    const rawImages = body.images && typeof body.images === 'object' ? body.images : (body.imageBase64 ? { front: body.imageBase64 } : {});
    const views = Object.keys(VIEW_LABELS).filter((k) => typeof rawImages[k] === 'string' && rawImages[k].length > 100);

    if (!views.length) {
      return res.status(400).json({ error: 'Brak zdjęcia w zapytaniu' });
    }
    if (views.some((k) => rawImages[k].length > 3_000_000)) {
      return res.status(413).json({ error: 'Zdjęcie jest za duże' });
    }

    const single = views.length === 1 && views[0] === 'front' && !body.images;
    const viewKeys = views.map((k) => `"${k}"`).join(', ');
    const prompt = `Jesteś surowym, obiektywnym sędzią sylwetkowym i trenerem kulturystyki.
${single ? 'Przeanalizuj zdjęcie sylwetki' : `Przeanalizuj komplet zdjęć sylwetki tej samej osoby (${views.map((k) => VIEW_LABELS[k]).join(', ')}), podanych w tej kolejności`} i oceń w skali 1.0 - 10.0.
Dane zawodnika: Wzrost ${player?.heightCm || 184} cm, Waga ${player?.currentWeight || 84} kg, Cel: ${player?.goal || 'Redukcja'}, Pas ${player?.waist || 85} cm, Klatka ${player?.chest || 105} cm, Biceps ${player?.biceps || 38} cm.

Najpierw ZWERYFIKUJ każde zdjęcie (pole "photoChecks"):
- isBody: true tylko, gdy widać sylwetkę człowieka (min. tułów) nadającą się do oceny; false dla jedzenia, memów, screenów, zwierząt, zdjęć z internetu, ekranów, samej twarzy itp. Zdjęcie ma pokazywać deklarowane ujęcie (przód/plecy/bok) – jeśli np. w miejscu "PLECY" jest przód, wpisz to w issue.
- quality: "dobra" | "srednia" | "slaba" (światło, ostrość, kadr, odległość)
- issue: krótki powód po polsku, jeśli isBody=false, ujęcie się nie zgadza lub quality="slaba" (inaczej pusty tekst)
Pole "plausible": false, jeśli sylwetka wyraźnie nie pasuje do podanych danych (waga/wzrost/obwody); "plausibilityNote" – krótko co się nie zgadza (inaczej pusty tekst).
Jeśli zdjęcie ma isBody=false, jego oceny ustaw na 1.0.

Oceń KAŻDE ujęcie osobno (pole "views"), z naciskiem na:
${views.map((k) => `- ${VIEW_FOCUS[k]}`).join('\n')}
Każde ujęcie: vScore (szerokość/proporcje V), defScore (definicja i poziom tłuszczu), armScore (umięśnienie), note (jedno zdanie po polsku).

Dalej:
1. estBf: realistyczny poziom tkanki tłuszczowej na podstawie wszystkich zdjęć.
2. strengths: 2–4 konkretne MOCNE strony (krótkie zdania po polsku, bez kropek na końcu), uwzględniając wszystkie ujęcia.
3. weaknesses: 2–4 konkretne SŁABE strony / braki (krótkie zdania po polsku, bez kropek na końcu), z informacją, które partie i na którym ujęciu je widać.
4. plan: konkretne wskazówki treningowe i kaloryczne po polsku (1–2 zdania, bez znaku "|").

Zwróć WYŁĄCZNIE czysty obiekt JSON (klucze w "views" i "photoChecks" tylko dla: ${viewKeys}):
{
  "views": { "front": { "vScore": 6.5, "defScore": 5.8, "armScore": 6.2, "note": "..." } },
  "estBf": 18,
  "lightingNote": "Krótka ocena oświetlenia",
  "photoChecks": { "front": { "isBody": true, "quality": "dobra", "issue": "" } },
  "plausible": true,
  "plausibilityNote": "",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "plan": "..."
}`;

    const parts = [{ text: prompt }];
    views.forEach((k) => {
      parts.push({ text: `Zdjęcie: ${VIEW_LABELS[k]}` });
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: rawImages[k] } });
    });

    const { data, error } = await callGemini(apiKey, { contents: [{ parts }], generationConfig: { temperature: 0.2 } });
    if (!data) {
      console.error('Wszystkie modele odrzucone:', error);
      return res.status(500).json({ error });
    }

    const match = data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: 'Model nie zwrócił poprawnego JSON' });
    }
    const parsed = JSON.parse(match[0]);

    // oceny każdego ujęcia (ujęcie niepoprawne = 1.0 i nie liczy się do średniej)
    const checks = parsed.photoChecks && typeof parsed.photoChecks === 'object' ? parsed.photoChecks : {};
    const outViews = {};
    const checkOut = {};
    views.forEach((k) => {
      const c = checks[k] && typeof checks[k] === 'object' ? checks[k] : (parsed.photoCheck && views.length === 1 ? parsed.photoCheck : {});
      const isBody = c.isBody !== false;
      const quality = ['dobra', 'srednia', 'slaba'].includes(c.quality) ? c.quality : 'srednia';
      const v = parsed.views && typeof parsed.views[k] === 'object' ? parsed.views[k] : (views.length === 1 ? parsed : {});
      const fb = isBody ? 6.0 : 1.0;
      const clamp = (x) => Math.min(10, Math.max(1, Number(x) || fb));
      const vScore = clamp(v.vScore);
      const defScore = clamp(v.defScore);
      const armScore = clamp(v.armScore);
      outViews[k] = {
        vScore: round1(vScore),
        defScore: round1(defScore),
        armScore: round1(armScore),
        overall: round1(vScore * 0.4 + defScore * 0.35 + armScore * 0.25),
        note: String(v.note || '').slice(0, 200)
      };
      checkOut[k] = { isBody, quality, issue: String(c.issue || '').slice(0, 200) };
    });

    const valid = views.filter((k) => checkOut[k].isBody);
    const pool = valid.length ? valid : views;
    const vScore = round1(avg(pool.map((k) => outViews[k].vScore)));
    const defScore = round1(avg(pool.map((k) => outViews[k].defScore)));
    const armScore = round1(avg(pool.map((k) => outViews[k].armScore)));
    const overall = round1(avg(pool.map((k) => outViews[k].overall)));

    const strengths = cleanList(parsed.strengths, 4);
    const weaknesses = cleanList(parsed.weaknesses, 4);
    const plan = String(parsed.plan || '').replace(/[|\r\n]+/g, ' ').replace(/\.$/, '').trim().slice(0, 400);
    let verdict;
    if (strengths.length || weaknesses.length) {
      verdict = `Mocne strony: ${strengths.join('; ') || 'brak wyraźnych'} | Braki do poprawy: ${weaknesses.join('; ') || 'brak wyraźnych'} | Plan naprawczy: ${plan || 'trzymaj obecny plan i dokładaj progresję'}`;
    } else {
      const rawVerdict = String(parsed.verdict || 'Analiza zakończona').trim();
      verdict = (rawVerdict.includes(' | ') ? rawVerdict : rawVerdict.replace(/\.\s+/g, ' | ')).replace(/\.$/, '');
    }

    const badViews = views.filter((k) => !checkOut[k].isBody);
    const slabViews = views.filter((k) => checkOut[k].isBody && checkOut[k].quality === 'slaba');
    const issueText = [
      ...badViews.map((k) => `${VIEW_LABELS[k]}: ${checkOut[k].issue || 'to nie wygląda jak ujęcie sylwetki'}`),
      ...slabViews.map((k) => `${VIEW_LABELS[k]}: ${checkOut[k].issue || 'słaba jakość'}`)
    ].join('; ').slice(0, 300);

    return res.status(200).json({
      vScore,
      defScore,
      armScore,
      overall,
      estBf: Math.min(60, Math.max(4, Number(parsed.estBf) || 18)),
      lightingNote: parsed.lightingNote || 'Zweryfikowano przez Gemini Vision',
      verdict,
      strengths,
      weaknesses,
      plan,
      views: outViews,
      photoCheck: {
        isBody: badViews.length === 0,
        quality: slabViews.length ? 'slaba' : (views.every((k) => checkOut[k].quality === 'dobra') ? 'dobra' : 'srednia'),
        issue: issueText,
        plausible: parsed.plausible !== false,
        plausibilityNote: String(parsed.plausibilityNote || '').slice(0, 200),
        views: checkOut
      }
    });
  } catch (err) {
    console.error('Krytyczny błąd w /api/analyze:', err);
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
};
