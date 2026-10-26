module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Dozwolona tylko metoda POST" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Brak klucza GEMINI_API_KEY na serwerze Vercel" });
  }

  try {
    const { imageBase64, player } = req.body;

    const prompt = `Jesteś surowym, obiektywnym sędzią sylwetkowym. Oceń zdjęcie w skali 1.0 - 10.0.
  Dane zawodnika: Wzrost ${player?.heightCm || 180} cm, Waga ${
      player?.currentWeight || 80
    } kg, Cel: ${player?.goal || "Forma"}, Pas ${
      player?.measurements?.waist?.current || 85
    } cm, Klatka ${player?.measurements?.chest?.current || 105} cm, Biceps ${
      player?.measurements?.biceps?.current || 38
    } cm.
  
  Zasady oceny:
  1. Jeśli na zdjęciu NIE MA sylwetki człowieka (np. jest obiekt, zwierzę, ściana), wystaw we wszystkich kategoriach ocenę 1.0 i napisz w werdykcie, że zdjęcie nie przedstawia sylwetki.
  2. Nie zawyżaj ocen za samo dobre oświetlenie z góry (downlighting). Oceniasz realną szerokość obręczy barkowej względem pasa (V-Taper), poziom tkanki tłuszczowej (definicję) oraz umięśnienie.
  
  Zwróć WYŁĄCZNIE czysty obiekt JSON (bez znaczników markdown \`\`\`json):
  {
    "vScore": 7.2,
    "defScore": 6.8,
    "armScore": 7.0,
    "estBf": 15,
    "lightingNote": "Krótka ocena uczciwości światła na zdjęciu (1 zdanie)",
    "verdict": "Konkretna, ekspercka ocena sylwetki ze zdjęcia: co wygląda dobrze, a nad czym trzeba pracować (2 zdania)."
  }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = rawText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res
        .status(500)
        .json({ error: "Model AI nie zwrócił poprawnego formatu oceny" });
    }

    const parsed = JSON.parse(match[0]);
    return res.status(200).json({
      vScore: Number(parsed.vScore) || 6.5,
      defScore: Number(parsed.defScore) || 6.5,
      armScore: Number(parsed.armScore) || 6.5,
      estBf: Number(parsed.estBf) || 15,
      lightingNote: parsed.lightingNote || "Zweryfikowano przez Gemini Vision",
      verdict: parsed.verdict || "Analiza wizualna zakończona.",
    });
  } catch (err) {
    return res.status(500).json({ error: "Błąd komunikacji z Gemini API" });
  }
};
