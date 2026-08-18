import { GoogleGenAI, Type } from '@google/genai';

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

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Anda adalah koki profesional berpengalaman. Buatkan resep masakan lezat dan akurat dalam bahasa Indonesia berdasarkan kriteria pengguna. Pastikan porsi, tingkat kesulitan, dan batasan waktu dipenuhi dengan logis. Jika kata kunci berupa daftar bahan, buatkan resep kreatif menggunakan bahan-bahan tersebut.`;

    const userPrompt = `Rekomendasikan resep masakan dengan kriteria berikut:
- Kata kunci / Bahan yang dimiliki: ${query}
- Tingkat Kesulitan: ${difficulty || 'Bebas'}
- Maksimal Waktu Memasak: ${maxTime ? maxTime + ' menit' : 'Bebas'}
- Jumlah Porsi: ${servings ? servings + ' porsi' : 'Bebas'}

Berikan respon dalam format JSON sesuai skema yang ditentukan.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Nama resep masakan" },
        description: { type: Type.STRING, description: "Deskripsi singkat resep" },
        prepTime: { type: Type.STRING, description: "Waktu persiapan dan memasak" },
        servings: { type: Type.STRING, description: "Jumlah porsi hasil masakan" },
        difficulty: { type: Type.STRING, description: "Tingkat kesulitan (Mudah/Sedang/Sulit)" },
        ingredients: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Daftar bahan-bahan lengkap dengan ukurannya"
        },
        steps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Langkah-langkah proses memasak secara urut"
        },
        tips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Tips penting saat memasak agar berhasil dan lezat"
        }
      },
      required: ["title", "description", "prepTime", "servings", "difficulty", "ingredients", "steps", "tips"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const recipeData = JSON.parse(response.text);

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
