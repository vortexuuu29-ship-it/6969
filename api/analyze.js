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
    const { imageBase64, player } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Brak zdjęcia w zapytaniu' });
    }

    const prompt = `Jesteś surowym, obiektywnym sędzią sylwetkowym i trenerem kulturystyki.
Przeanalizuj zdjęcie sylwetki i oceń je w skali 1.0 - 10.0.
Dane zawodnika: Wzrost ${player?.heightCm || 184} cm, Waga ${player?.currentWeight || 84} kg, Cel: ${player?.goal || 'Redukcja'}, Pas ${player?.waist || 85} cm, Klatka ${player?.chest || 105} cm, Biceps ${player?.biceps || 38} cm.

Zasady:
1. Oceń poziom tkanki tłuszczowej (estBf) realistycznie na podstawie widocznej definicji brzucha na zdjęciu (np. lekki zarys górnych mięśni brzucha przy miękkim dole to 16-18% BF; brak zarysu brzucha to 19-23% BF; pełna kratka to 10-13% BF).
2. W polu "verdict" napisz po polsku konkretną analizę w 3 częściach oddzielonych znakiem " | " (bez kropek w środku):
   - Mocne strony: (co wygląda najlepiej)
   - Braki do poprawy: (które partie mięśniowe odstają lub gdzie zalega tłuszcz)
   - Plan naprawczy: (konkretne wskazówki treningowe i kaloryczne)

Zwróć WYŁĄCZNIE czysty obiekt JSON:
{
  "vScore": 6.5,
  "defScore": 5.8,
  "armScore": 6.2,
  "estBf": 18,
  "lightingNote": "Krótka ocena oświetlenia",
  "verdict": "Mocne strony: ... | Braki do poprawy: ... | Plan naprawczy: ..."
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    // Tylko 3 szybkie modele (bez długiej pętli blokującej serwer)
    const fastModels = [
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3-flash-preview'
    ];

    let responseData = null;
    let lastError = 'Brak odpowiedzi z modeli Gemini';

    for (const modelName of fastModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        const data = await response.json();
        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseData = data;
          break;
        }
        lastError = data?.error?.message || `HTTP ${response.status} (${modelName})`;
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        lastError = fetchErr.name === 'AbortError' ? `Timeout modelu ${modelName}` : fetchErr.message;
      }
    }

    if (!responseData) {
      console.error('Błąd Gemini API:', lastError);
      return res.status(500).json({ error: lastError });
    }

    const rawText = responseData.candidates[0].content.parts[0].text;
    const match = rawText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: 'Model nie zwrócił poprawnego JSON' });
    }

    const parsed = JSON.parse(match[0]);
    const fullVerdict = String(parsed.verdict || 'Analiza zakończona')
      .replace(/\.\s+/g, ' | ')
      .replace(/\.$/, '');

    return res.status(200).json({
      vScore: Number(parsed.vScore) || 6.0,
      defScore: Number(parsed.defScore) || 6.0,
      armScore: Number(parsed.armScore) || 6.0,
      estBf: Number(parsed.estBf) || 18,
      lightingNote: parsed.lightingNote || 'Zweryfikowano przez Gemini Vision',
      verdict: fullVerdict
    });
  } catch (err) {
    console.error('Krytyczny błąd w /api/analyze:', err);
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
};
