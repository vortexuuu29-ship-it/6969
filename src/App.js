module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Dozwolona tylko metoda POST' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Brak zmiennej GEMINI_API_KEY w ustawieniach Vercel' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { imageBase64, player } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Brak obrazu w żądaniu' });
    }

    const prompt = `Jesteś sędzią sylwetkowym. Oceń sylwetkę ze zdjęcia w skali 1.0 do 10.0.
Dane zawodnika: Wzrost ${player?.heightCm || 180} cm, Waga ${player?.currentWeight || 80} kg, Cel: ${player?.goal || 'Redukcja'}.

Zwróć WYŁĄCZNIE czysty JSON w formacie:
{
  "vScore": 7.5,
  "defScore": 7.0,
  "armScore": 7.2,
  "estBf": 14,
  "lightingNote": "Oświetlenie poprawne",
  "verdict": "Krótki i konkretny werdykt sylwetki."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
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
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Błąd z Google AI Studio API' });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: 'Model AI nie zwrócił poprawnego formatu JSON' });
    }

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Wewnętrzny błąd serwera' });
  }
};
