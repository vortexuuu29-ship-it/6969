const autoEvaluateUploadedPhoto = (file, playerContext, zoomFactor = 1.0) =>
  new Promise((resolve) => {
    const localResult = (dataUrl, reason) => {
      console.warn('[analyze] analiza lokalna, powód:', reason);
      const b = evaluatePhysiqueAI(playerContext);
      resolve({
        dataUrl:
          dataUrl ||
          createDemoPhysiquePoster(
            playerContext.name || 'Gracz',
            playerContext.goal || 'Redukcja',
            playerContext.currentWeight || 84,
            playerContext.measurements?.waist?.current || 85,
            playerContext.measurements?.chest?.current || 105,
            '#e11d48'
          ),
        aiVision: {
          overall: b.overall,
          vScore: parseFloat(b.vScore),
          defScore: parseFloat(b.defScore),
          armScore: parseFloat(b.armScore),
          estBf: b.estBf,
          lightingNote: `Tryb awaryjny (${reason})`,
          verdict: b.summary,
          source: 'Analizator Biometryczny AI'
        }
      });
    };

    const reader = new FileReader();
    reader.onerror = () => localResult(null, 'błąd odczytu pliku');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () =>
        localResult(null, 'nie można zdekodować obrazu (HEIC?)');
      img.onload = async () => {
        let dataUrl = null;
        try {
          const maxH = 600;
          const cropW = img.width / zoomFactor;
          const cropH = img.height / zoomFactor;
          const startX = (img.width - cropW) / 2;
          const startY = (img.height - cropH) * 0.42;
          const scale = Math.min(1, maxH / cropH);

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(cropW * scale));
          canvas.height = Math.max(1, Math.round(cropH * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.78);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          let res;
          try {
            res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                imageBase64: dataUrl.split(',')[1],
                mimeType: 'image/jpeg',
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
          } finally {
            clearTimeout(timeoutId);
          }

          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            return localResult(dataUrl, `serwer ${res.status}: ${txt.slice(0, 120)}`);
          }

          const serverAI = await res.json();
          console.log('[analyze] odpowiedź serwera:', serverAI);

          const v = Number(serverAI?.vScore);
          const d = Number(serverAI?.defScore);
          const a = Number(serverAI?.armScore);
          if (![v, d, a].every(Number.isFinite)) {
            return localResult(dataUrl, 'serwer zwrócił nieprawidłowy JSON');
          }

          resolve({
            dataUrl,
            aiVision: {
              vScore: v,
              defScore: d,
              armScore: a,
              estBf: Number(serverAI.estBf) || 18,
              lightingNote: serverAI.lightingNote || 'Zweryfikowano przez Gemini Vision AI',
              verdict: serverAI.verdict,
              overall: parseFloat((v * 0.4 + d * 0.35 + a * 0.25).toFixed(1)),
              source: 'Gemini Vision AI (Chmura)'
            }
          });
        } catch (err) {
          localResult(dataUrl, err.name === 'AbortError' ? 'timeout' : err.message);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
