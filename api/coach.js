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
    const player = body.player;
    if (!player || typeof player !== 'object') {
      return res.status(400).json({ error: 'Brak danych zawodnika' });
    }

    // Do modelu wysyłamy wyłącznie zagregowane liczby (bez zdjęć)
    const data = JSON.stringify(player).slice(0, 4000);

    const prompt = `Jesteś doświadczonym, rzeczowym trenerem sylwetkowym i siłowym. Na podstawie danych zawodnika (JSON) przygotuj krótki plan na NAJBLIŻSZY TYDZIEŃ po polsku.

Dane: ${data}

Objaśnienia: trendKgWeek to realna zmiana wagi na tydzień (regresja z ważeń), expectedKgWeek to zmiana, jakiej oczekiwał plan kaloryczny. lifts1RM to szacowane 1RM w kg. ai to oceny sylwetki w skali 1-10.

Zasady bezpieczeństwa:
- Nigdy nie zalecaj głodówek, odwodnienia, środków farmakologicznych ani suplementów medycznych.
- Kobiety nie schodzą poniżej ok. 1200 kcal, mężczyźni poniżej ok. 1500 kcal.
- Dla osoby poniżej 18 lat nie zalecaj obcinania kalorii ani redukcji – odeślij do trenera lub lekarza.
- Tempo spadku wagi powyżej 1% masy ciała na tydzień jest zbyt szybkie – wtedy zalecaj dodanie kalorii.
- Brak danych (null) oznacza, że trzeba po prostu częściej się ważyć – nie zgaduj.
- Bądź konkretny (liczby, serie, kcal), bez ogólników i bez moralizowania.

Zwróć WYŁĄCZNIE czysty obiekt JSON:
{
  "headline": "krótki tytuł, max 7 słów",
  "diagnosis": "1-2 zdania: co pokazują dane",
  "actions": ["krok 1", "krok 2", "krok 3"],
  "watch": "jedno zdanie: na co uważać (albo pusty tekst)"
}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 }
    };

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let responseData = null;
    let lastError = 'Brak odpowiedzi z modeli Gemini';

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );
        const j = await response.json();
        if (response.ok && j?.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseData = j;
          break;
        }
        lastError = j?.error?.message || `HTTP ${response.status} (${modelName})`;
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }
    }

    if (!responseData) {
      console.error('Trener AI – wszystkie modele odrzucone:', lastError);
      return res.status(500).json({ error: lastError });
    }

    const rawText = responseData.candidates[0].content.parts[0].text;
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: 'Model nie zwrócił poprawnego JSON' });
    }

    const parsed = JSON.parse(match[0]);
    const actions = (Array.isArray(parsed.actions) ? parsed.actions : [])
      .map((a) => String(a || '').trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 4);

    if (!parsed.headline || !actions.length) {
      return res.status(500).json({ error: 'Niepełna odpowiedź modelu' });
    }

    return res.status(200).json({
      headline: String(parsed.headline).slice(0, 80),
      diagnosis: String(parsed.diagnosis || '').slice(0, 400),
      actions,
      watch: String(parsed.watch || '').slice(0, 300)
    });
  } catch (err) {
    console.error('Krytyczny błąd w /api/coach:', err);
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
};
