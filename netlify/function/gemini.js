import { GoogleGenerativeAI } from '@google/generative-ai';

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { query, difficulty, maxTime, servings } = JSON.parse(event.body || "{}");

    if (!query) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Kata kunci resep atau bahan harus diisi." }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "API Key GEMINI_API_KEY belum dikonfigurasi di Netlify." }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const userPrompt = `Anda adalah koki profesional berpengalaman. Buatkan resep masakan lezat dan akurat dalam bahasa Indonesia.

Kriteria Resep:
- Kata kunci / Bahan: ${query}
- Tingkat Kesulitan: ${difficulty || 'Bebas'}
- Maksimal Waktu Memasak: ${maxTime ? maxTime + ' menit' : 'Bebas'}
- Jumlah Porsi: ${servings ? servings + ' porsi' : 'Bebas'}

Kembalikan jawaban dalam format JSON persis seperti struktur berikut:
{
  "title": "Nama Resep",
  "description": "Deskripsi singkat resep",
  "prepTime": "30 menit",
  "servings": "3 porsi",
  "difficulty": "Sedang",
  "ingredients": ["Bahan 1", "Bahan 2"],
  "steps": ["Langkah 1", "Langkah 2"],
  "tips": ["Tip 1", "Tip 2"]
}`;

    const result = await model.generateContent(userPrompt);
    let responseText = result.response.text();

    // Pembersih blok markdown ```json jika ikut terkirim oleh AI
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const recipeData = JSON.parse(responseText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: recipeData }),
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Gagal menghasilkan resep: " + error.message }),
    };
  }
}
