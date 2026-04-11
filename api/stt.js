import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { audio, mimeType = "audio/webm" } = req.body;

  if (!audio || typeof audio !== "string") {
    return res.status(400).json({ error: "Campo 'audio' (base64) é obrigatório." });
  }

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: audio } },
            {
              text: "Transcreva este áudio em português. Retorne apenas o texto transcrito, sem explicações adicionais.",
            },
          ],
        },
      ],
    });

    const transcription = response.text?.trim() || "";
    return res.json({ transcription });
  } catch (err) {
    console.error("Erro Gemini STT:", err.message);
    return res.status(500).json({ error: "Erro ao transcrever áudio." });
  }
}
