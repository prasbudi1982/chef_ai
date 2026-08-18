import { GoogleGenerativeAI } from '@google/generative-ai';

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { query, difficulty } = JSON.parse(event.body || "{}");

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Kata kunci resep harus diisi." }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API Key GEMINI_API_KEY belum dipasang di Netlify Environment Variables." }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Anda adalah koki profesional. Buatkan resep makanan dalam bahasa Indonesia berdasarkan data berikut:
- Bahan/Masakan: ${query}
- Tingkat Kesulitan: ${difficulty}

Keluarkan HANYA JSON murni (tanpa tanda backtick markdown) dengan format:
{
  "title": "Nama Masakan",
  "description": "Deskripsi singkat",
  "prepTime": "20 menit",
  "servings": "2 porsi",
  "difficulty": "Mudah",
  "ingredients": ["Bahan 1", "Bahan 2"],
  "steps": ["Langkah 1", "Langkah 2"]
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Membersihkan format markdown jika AI memberikan tag ```json
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const recipeData = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: recipeData }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
