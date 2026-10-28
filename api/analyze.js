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
Przeanalizuj dokładnie zdjęcie sylwetki i oceń je w skali 1.0 - 10.0.
Dane pomocnicze zawodnika: Wzrost ${player?.heightCm || 184} cm, Waga ${player?.currentWeight || 84} kg, Cel: ${player?.goal || 'Redukcja'}, Pas ${player?.measurements?.waist?.current || 85} cm, Klatka ${player?.measurements?.chest?.current || 105} cm, Biceps ${player?.measurements?.biceps?.current || 38} cm.

Zasady realizmu:
1. Oceń poziom tkanki tłuszczowej (estBf) REALISTYCZNIE na podstawie widocznej definicji brzucha i separacji mięśni na zdjęciu (np. lekki zarys górnych mięśni brzucha przy miękkim dole brzucha to 16-18% BF; brak widocznych mięśni brzucha to 19-23% BF; pełna kratka 6-pack i unaczynienie to 10-13% BF). Nie zaniżaj BF%!
2. W polu "verdict" napisz po polsku konkretną analizę tego, co widzisz na zdjęciu, podzieloną dokładnie na 3 części oddzielone znakiem " | " (bez kropek w środku):
   - Mocne strony: (co na zdjęciu wygląda najlepiej)
   - Braki do poprawy: (które partie mięśniowe na zdjęciu odstają lub gdzie widać nadmiar tkanki tłuszczowej)
   - Plan naprawczy: (konkretne wskazówki treningowe i kaloryczne)

Zwróć WYŁĄCZNIE czysty obiekt JSON:
{
  "vScore": 6.8,
  "defScore": 6.2,
  "armScore": 6.5,
  "estBf": 17,
  "lightingNote": "Krótka ocena oświetlenia na zdjęciu",
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

    // 1. Pobieramy z Google listę modeli aktywnych dla Twojego klucza API
    let candidateModels = [
      'gemini-flash-latest',
      'gemini-3-flash-preview',
      'gemini-3-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash'
    ];

    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const apiModels = (listData.models || [])
          .filter(
            (m) =>
              m.supportedGenerationMethods?.includes('generateContent') &&
              m.name.includes('gemini') &&
              !m.name.includes('embedding') &&
              !m.name.includes('tts') &&
              !m.name.includes('audio')
          )
          .map((m) => m.name.replace('models/', ''));

        // Łączymy listę priorytetową z modelami zwróconymi przez Google
        candidateModels = [...new Set([...candidateModels, ...apiModels])];
      }
    } catch (_) {}

    let lastError = 'Nie udało się połączyć z żadnym modelem Gemini';
    let responseData = null;

    // 2. Próbujemy kolejne modele aż trafimy na aktywny dla nowych użytkowników
    for (let i = 0; i < candidateModels.length; i++) {
      const modelName = candidateModels[i];
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('Sukces z modelem:', modelName);
        responseData = data;
        break;
      }

      const errMsg = data?.error?.message || '';
      lastError = errMsg || `HTTP ${response.status} dla modelu ${modelName}`;
      console.warn(`Model ${modelName} odrzucony:`, lastError);

      // Jeśli Google w błędzie podaje dokładną nazwę wymaganego modelu, dodajemy go na początek kolejki
      const suggestedMatch = errMsg.match(/use models\/([a-zA-Z0-9._-]+)/i);
      if (suggestedMatch && suggestedMatch[1] && !candidateModels.includes(suggestedMatch[1])) {
        candidateModels.splice(i + 1, 0, suggestedMatch[1]);
      }
    }

    if (!responseData) {
      console.error('Wszystkie modele zawiodły. Ostatni błąd:', lastError);
      return res.status(500).json({ error: lastError });
    }

    const rawText = responseData.candidates[0].content.parts[0].text;
    const match = rawText.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('Brak JSON w odpowiedzi:', rawText);
      return res.status(500).json({ error: 'Model nie zwrócił poprawnego formatu JSON' });
    }

    const parsed = JSON.parse(match[0]);

    const fullVerdict = String(parsed.verdict || 'Analiza zakończona')
      .replace(/\.\s+/g, ' | ')
      .replace(/\.$/, '');

    return res.status(200).json({
      vScore: Number(parsed.vScore) || 6.5,
      defScore: Number(parsed.defScore) || 6.5,
      armScore: Number(parsed.armScore) || 6.5,
      estBf: Number(parsed.estBf) || 17,
      lightingNote: parsed.lightingNote || 'Zweryfikowano przez Gemini Vision',
      verdict: fullVerdict
    });
  } catch (err) {
    console.error('Krytyczny błąd w /api/analyze:', err);
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
};
