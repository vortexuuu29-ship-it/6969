module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Dozwolona tylko metoda POST' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Brak klucza GEMINI_API_KEY w Vercel Environment Variables');
      return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY na serwerze Vercel' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { imageBase64, player } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Brak zdjęcia w zapytaniu' });
    }

    const prompt = `Jesteś surowym, eksperckim sędzią sylwetkowym i trenerem kulturystyki.
Oceń sylwetkę ze zdjęcia w skali 1.0 - 10.0.
Dane zawodnika: Wzrost ${player?.heightCm || 180} cm, Waga ${player?.currentWeight || 80} kg, Cel: ${player?.goal || 'Redukcja'}, Pas ${player?.measurements?.waist?.current || 85} cm, Klatka ${player?.measurements?.chest?.current || 105} cm, Biceps ${player?.measurements?.biceps?.current || 38} cm.

Wymagania dotyczące pola "verdict" (musi być po polsku, bardzo konkretne, w 3 częściach oddzielonych znakiem " | " bez kropek w środku):
- Część 1 (Mocne strony): co na zdjęciu wygląda dobrze (np. szerokość barków, zarys klatki, kontrola talii)
- Część 2 (Braki do poprawy): które dokładnie partie mięśniowe odstają wizualnie na zdjęciu lub gdzie zalega tkanka tłuszczowa (np. góra klatki, boczny akton barku, dół brzucha, ramiona, najszerszy grzbietu)
- Część 3 (Plan naprawczy): co dokładnie zrobić treningowo i dietetycznie, aby poprawić te braki

Zwróć WYŁĄCZNIE obiekt JSON:
{
  "vScore": 7.2,
  "defScore": 6.8,
  "armScore": 7.0,
  "estBf": 15,
  "lightingNote": "Krótka ocena oświetlenia na zdjęciu",
  "verdict": "Mocne strony: ... | Braki: ... | Co poprawić: ..."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Błąd odpowiedzi Google Gemini:', JSON.stringify(data));
      return res.status(500).json({
        error: data?.error?.message || 'Błąd komunikacji z Google Gemini API'
      });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = rawText.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('Nieprawidłowy format odpowiedzi z Gemini:', rawText);
      return res.status(500).json({ error: 'Model nie zwrócił poprawnego JSON' });
    }

    const parsed = JSON.parse(match[0]);

    // Zamiana kropek wewnątrz tekstu na separatory " | ", aby frontend w App.js nie ucinał analizy po pierwszym zdaniu
    const fullVerdict = String(parsed.verdict || 'Analiza zakończona')
      .replace(/\.\s+/g, ' | ')
      .replace(/\.$/, '');

    return res.status(200).json({
      vScore: Number(parsed.vScore) || 6.5,
      defScore: Number(parsed.defScore) || 6.5,
      armScore: Number(parsed.armScore) || 6.5,
      estBf: Number(parsed.estBf) || 15,
      lightingNote: parsed.lightingNote || 'Zweryfikowano przez Gemini Vision',
      verdict: fullVerdict
    });
  } catch (err) {
    console.error('Krytyczny błąd w /api/analyze:', err);
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
};
