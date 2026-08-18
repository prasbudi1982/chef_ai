import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler = async (event) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed. Gunakan POST." }) 
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { query, difficulty } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Bahan atau nama masakan wajib diisi." }),
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Anda adalah koki profesional. Buatkan resep masakan dalam bahasa Indonesia berdasarkan kriteria berikut:
- Bahan/Masakan: ${query}
- Tingkat Kesulitan: ${difficulty || 'Bebas'}

Kembalikan HANYA format JSON valid tanpa tanda markdown (backtick) dengan struktur:
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

    // Pembersihan pembungkus markdown jika ada
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const recipeData = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ success: true, data: recipeData }),
    };

  } catch (error) {
    console.error("Error Function:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
