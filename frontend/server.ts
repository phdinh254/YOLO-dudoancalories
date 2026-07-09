import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Food analysis endpoint
app.post('/api/recognize', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      res.status(400).json({ error: 'Image data and mimeType are required.' });
      return;
    }

    let ai;
    try {
      ai = getGenAI();
    } catch (err: any) {
      // Graceful error handling for missing API key
      res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm khóa API trong mục Settings > Secrets của AI Studio.'
      });
      return;
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: image
      }
    };

    const textPart = {
      text: `Analyze this image of food. Identify if it is a Vietnamese dish.
      If it is not Vietnamese, still analyze it but set isVietnamese to false.
      Provide detailed nutritional estimations for 1 typical standard serving.
      Be accurate on macronutrients (Protein, Carbs, Fat) and Calorie content (Kcal) in accordance with general nutrition databases.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, textPart],
      config: {
        systemInstruction: `You are an expert Vietnamese nutritionist AI. Your task is to analyze images of dishes and return extremely precise structured nutritional facts in Vietnamese.
        If the dish is not Vietnamese, set isVietnamese to false and analyze it anyway.
        The name of the dish must be returned in polite standard Vietnamese (e.g. "Phở Bò", "Bún Chả", "Bánh Mì Kẹp Thịt").
        Ensure the numbers are realistic. Kcal is the energy, Protein in grams, Carbs in grams, Fat (Chất béo) in grams.
        Provide a short trivia or suggestion (about 1-2 sentences) in Vietnamese in the 'description' field.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isVietnamese: {
              type: Type.BOOLEAN,
              description: "Whether the dish belongs to Vietnamese cuisine."
            },
            dishName: {
              type: Type.STRING,
              description: "The name of the dish in Vietnamese."
            },
            calories: {
              type: Type.INTEGER,
              description: "Estimated calorie content in Kcal for one serving."
            },
            protein: {
              type: Type.INTEGER,
              description: "Estimated protein in grams."
            },
            carbs: {
              type: Type.INTEGER,
              description: "Estimated carbohydrates in grams."
            },
            fat: {
              type: Type.INTEGER,
              description: "Estimated fat content (Chất béo) in grams."
            },
            confidence: {
              type: Type.INTEGER,
              description: "Confidence percentage (e.g., 90 to 99)."
            },
            description: {
              type: Type.STRING,
              description: "A short, interesting description or nutritional trivia of the dish in Vietnamese."
            }
          },
          required: ["isVietnamese", "dishName", "calories", "protein", "carbs", "fat", "confidence", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Could not extract result from AI response.");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/recognize:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message || 'Đã có lỗi xảy ra khi phân tích hình ảnh.' });
  }
});

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  // Integrate Vite dev middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
