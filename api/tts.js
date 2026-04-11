import { GoogleGenAI } from "@google/genai";

/**
 * Gemini TTS retorna PCM raw (16-bit, mono, 24 kHz).
 * Browsers não tocam PCM puro — adicionamos um header WAV para torná-lo tocável.
 */
function pcmToWav(pcmBase64, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const pcm = Buffer.from(pcmBase64, "base64");
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]).toString("base64");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: "GOOGLE_API_KEY não configurada no servidor." });
  }

  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Campo 'text' é obrigatório." });
  }

  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash-tts",
      contents: [{ role: "user", parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
      return res.status(500).json({ error: "Nenhum áudio retornado pelo Gemini." });
    }

    const returnedMime = part.inlineData.mimeType || "audio/pcm";

    // Se for PCM raw, converte para WAV (único formato universal nos browsers)
    if (returnedMime.startsWith("audio/pcm") || returnedMime.startsWith("audio/l16")) {
      const rateMatch = returnedMime.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
      return res.json({ audio: pcmToWav(part.inlineData.data, sampleRate), mimeType: "audio/wav" });
    }

    return res.json({ audio: part.inlineData.data, mimeType: returnedMime });
  } catch (err) {
    console.error("Erro Gemini TTS:", err.message);
    return res.status(500).json({ error: `Gemini TTS: ${err.message}` });
  }
}
