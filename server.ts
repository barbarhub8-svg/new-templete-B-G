import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper to validate API key format before sending requests
function isValidGeminiApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.startsWith('todo') ||
    lower.startsWith('your_')
  ) {
    return false;
  }
  return true;
}

// Lazy Gemini client helper
function getGeminiClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Heuristic fallback recommendations in case API key is absent or network fails
function getHeuristicRecommendations(history: any[], preferences: string[], city?: string) {
  const hasHistory = Array.isArray(history) && history.length > 0;
  const historyNames = hasHistory ? history.map((h: any) => (h.serviceName || h.name || '').toLowerCase()).join(' ') : '';
  const selectedPrefs = (preferences || []).map((p: string) => p.toLowerCase());
  const isJaipur = String(city || '').toLowerCase() === 'jaipur';

  if (isJaipur) {
    return [
      {
        id: 'rec-jp-rambagh',
        title: 'Maharaja Heritage Head & Scalp Therapy',
        category: 'Hair Spa',
        matchReason: 'Indulge in royal Ayurvedic head massage and botanical steam therapy inside iconic Rambagh Palace grounds.',
        cycleInsight: 'Ideal cycle: Once every 3–4 weeks for complete de-stressing',
        estimatedPrice: 1800,
        estimatedDuration: '60 mins',
        suggestedSalon: 'The Royal Jiva Spa & Salon at Rambagh Palace',
        suggestedShopId: 'dummy-jp-1',
        matchScore: 99,
        tags: ['Rambagh Palace', 'Palatial Spa', 'Royal Heritage'],
        homeServiceEligible: true,
        serviceName: 'Maharaja Heritage Head & Scalp Therapy',
      },
      {
        id: 'rec-jp-citypalace',
        title: 'Maharaja Straight Razor Shave & Sandalwood Compress',
        category: 'Beard Styling',
        matchReason: 'Classic heritage hot towel shave with warm lather and cold sandalwood compress right by City Palace.',
        cycleInsight: 'Ideal cycle: Bi-weekly for sharp, regal lines',
        estimatedPrice: 550,
        estimatedDuration: '35 mins',
        suggestedSalon: "Maharaja's Crown Barberia at City Palace",
        suggestedShopId: 'dummy-jp-2',
        matchScore: 96,
        tags: ['City Palace', 'Heritage Shave', 'Sandalwood Balm'],
        homeServiceEligible: false,
        serviceName: 'Maharaja Straight Razor Shave & Sandalwood Compress',
      },
      {
        id: 'rec-jp-cscheme',
        title: 'C-Scheme Signature Skin Fade & Texture Top',
        category: 'Skin Fade',
        matchReason: 'Top trending fade styling with razor detailing in the heart of C-Scheme.',
        cycleInsight: 'Ideal cycle: Refresh every 2–3 weeks',
        estimatedPrice: 650,
        estimatedDuration: '45 mins',
        suggestedSalon: 'The Royal Rajputana Lounge & Salon',
        suggestedShopId: 'dummy-jp-6',
        matchScore: 94,
        tags: ['C-Scheme', 'Precision Fade', 'Matte Finish'],
        homeServiceEligible: false,
        serviceName: 'C-Scheme Signature Skin Fade & Texture Cut',
      },
      {
        id: 'rec-jp-goldfacial',
        title: '24K Pure Gold Brightening Facial',
        category: 'Facial',
        matchReason: 'Royal de-tan gold brightening facial tailored for Jaipur sun and special occasion celebrations.',
        cycleInsight: 'Ideal cycle: Monthly skin renewal',
        estimatedPrice: 1600,
        estimatedDuration: '60 mins',
        suggestedSalon: 'Pink City Glow Luxury Salon',
        suggestedShopId: 'dummy-jp-7',
        matchScore: 92,
        tags: ['Malviya Nagar', 'Gold Facial', 'Insta Glow'],
        homeServiceEligible: true,
        serviceName: '24K Pure Gold Brightening Facial',
      },
    ];
  }

  const items = [
    {
      id: 'rec-fade-beard',
      title: 'Royal Skin Fade & Argan Beard Contour',
      category: 'Skin Fade',
      matchReason: hasHistory && historyNames.includes('fade')
        ? 'Based on your previous haircut 3 weeks ago, a fade maintenance trim keeps your neckline and silhouette razor-sharp.'
        : 'Top requested pairing for luxury modern grooming with clean geometric lines.',
      cycleInsight: 'Ideal cycle: Refresh every 2–3 weeks',
      estimatedPrice: 650,
      estimatedDuration: '45 mins',
      suggestedSalon: 'The Royal Barberia',
      suggestedShopId: 'dummy-1',
      matchScore: 98,
      tags: ['AI Top Match', 'Precision Fade', 'Hot Towel Finish'],
      homeServiceEligible: true,
      serviceName: 'Modern Skin Fade & Razor Detailing',
    },
    {
      id: 'rec-gold-spa',
      title: 'Royal Gold Scalp Detox & Acupressure Spa',
      category: 'Hair Spa',
      matchReason: selectedPrefs.includes('spa') || (hasHistory && historyNames.includes('spa'))
        ? 'Matches your preference for scalp relaxation and stress relief.'
        : 'Combat urban pollution and hair fatigue with deep conditioning botanical oils.',
      cycleInsight: 'Ideal cycle: Once every 4 weeks',
      estimatedPrice: 1200,
      estimatedDuration: '60 mins',
      suggestedSalon: 'The Royal Barberia',
      suggestedShopId: 'dummy-1',
      matchScore: 94,
      tags: ['Revitalizing', 'Deep Scalp Care', 'Essential Oils'],
      homeServiceEligible: true,
      serviceName: 'Royal Gold Scalp & Hair Spa',
    },
    {
      id: 'rec-charcoal-facial',
      title: 'Executive Charcoal Detox & Glow Facial',
      category: 'Facial',
      matchReason: 'Perfect skin refresher before key meetings or weekend social events.',
      cycleInsight: 'Ideal cycle: Once every 3–4 weeks for clear skin',
      estimatedPrice: 850,
      estimatedDuration: '50 mins',
      suggestedSalon: 'The Royal Barberia',
      suggestedShopId: 'dummy-1',
      matchScore: 91,
      tags: ['De-Tan', 'Pore Cleanse', 'Gold Brightening'],
      homeServiceEligible: true,
      serviceName: 'Executive Charcoal Detox Facial',
    },
    {
      id: 'rec-shave-express',
      title: 'Traditional Straight Razor Wet Shave',
      category: 'Beard Styling',
      matchReason: 'Classic Turkish & Italian barbering style with hot lather and cold sandalwood towel.',
      cycleInsight: 'Ideal cycle: Weekly or bi-weekly grooming',
      estimatedPrice: 350,
      estimatedDuration: '30 mins',
      suggestedSalon: 'The Royal Barberia',
      suggestedShopId: 'dummy-1',
      matchScore: 89,
      tags: ['Sandalwood Balm', 'Old-School Craft'],
      homeServiceEligible: true,
      serviceName: 'Traditional Straight Razor Shave',
    },
  ];

  return items;
}

// ─── AI Recommendations Endpoint ──────────────────────────────────────────────
app.post('/api/ai/recommendations', async (req: Request, res: Response) => {
  const { bookingHistory = [], preferences = [], city = 'Mumbai', serviceType = 'any' } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no valid GEMINI_API_KEY format is present, gracefully return smart heuristic suggestions
  if (!isValidGeminiApiKey(apiKey)) {
    const fallbackItems = getHeuristicRecommendations(bookingHistory, preferences, city);
    return res.json({
      success: true,
      source: 'heuristic',
      summary: 'Recommendations personalized based on your grooming cycle and salon preferences.',
      recommendations: fallbackItems,
    });
  }

  try {
    const historyDescription = Array.isArray(bookingHistory) && bookingHistory.length > 0
      ? bookingHistory.map((b: any, i: number) => 
          `${i + 1}. Service: ${b.serviceName || b.name || 'Grooming'} (Category: ${b.category || 'General'}), Salon: ${b.salonName || 'Nexora Salon'}, Date: ${b.date || 'Recent'}, Price: ₹${b.price || 500}`
        ).join('\n')
      : 'No prior bookings recorded yet (New Client profile).';

    const prompt = `You are an elite personal grooming consultant and Master Barber algorithm for Nexora, India's luxury salon appointment booking platform.
Analyze the user's booking history, preferences, and location to curate exactly 3 to 4 personalized salon service recommendations.

User Context:
- Client Booking History:
${historyDescription}

- Active Client Grooming Preferences: ${preferences.length > 0 ? preferences.join(', ') : 'Modern Haircuts, Beard Sculpting, Luxury Scalp Care'}
- Preferred Location/City: ${city || 'Mumbai'}
- Preferred Service Setting: ${serviceType} (in-shop / home / any)

Available Partner Salons:
1. "The Royal Jiva Spa & Salon at Rambagh Palace" (ID: dummy-jp-1) - Services: Royal Saffron & Gold Body Polish (₹3500), Maharaja Heritage Head & Scalp Therapy (₹1800), Rambagh Signature Scissor Cut & Beard Trim (₹1200)
2. "Maharaja's Crown Barberia at City Palace" (ID: dummy-jp-2) - Services: Maharaja Straight Razor Shave & Sandalwood Compress (₹550), Royal Crown Haircut & Detailing (₹700), Rajputana Beard Sculpting (₹500)
3. "The Royal Rajputana Lounge & Salon" (ID: dummy-jp-6) - Services: C-Scheme Signature Skin Fade & Texture Cut (₹650), Moroccan Argan Oil Scalp & Hair Treatment (₹1300)
4. "The Royal Barberia" (ID: dummy-1) - Services: Signature Royal Haircut & Beard Sculpting (₹650), Royal Gold Scalp & Hair Spa (₹1200), Modern Skin Fade & Razor Detailing (₹450)
5. "Classic Cuts Studio" (ID: dummy-2) - Services: Classic Executive Scissor Cut (₹500), Argan Oil Deep Conditioning Spa (₹900)
6. "Urban Fade Lounge" (ID: dummy-3) - Services: Urban Low Skin Fade & Texture Top (₹550)

Return a strictly valid JSON response adhering to this JSON schema:
{
  "summary": "1-sentence executive summary addressing the user about their grooming cadence or tailored styling suggestion",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Title of the recommended service bundle or treatment",
      "category": "Hair Cut | Beard Styling | Hair Spa | Facial | Skin Fade | Color",
      "matchReason": "Personalized 1-2 sentence explanation of why this is ideal for their specific grooming cycle or selected preferences",
      "cycleInsight": "Grooming cycle tip (e.g., 'Recommended cadence: Every 2-3 weeks for sharp lines')",
      "estimatedPrice": 650,
      "estimatedDuration": "45 mins",
      "suggestedSalon": "The Royal Barberia",
      "suggestedShopId": "dummy-1",
      "matchScore": 97,
      "tags": ["AI Top Pick", "Precision Cut", "Hot Towel"],
      "homeServiceEligible": true,
      "serviceName": "Exact name of matching service from available partner salons"
    }
  ]
}`;

    const ai = getGeminiClient(apiKey!);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from model response');
      }
    }

    return res.json({
      success: true,
      source: 'gemini',
      summary: parsed.summary || 'Personalized grooming recommendations crafted by your AI stylist.',
      recommendations: parsed.recommendations || getHeuristicRecommendations(bookingHistory, preferences, city),
    });
  } catch (err: any) {
    // When API key is rejected or network is unavailable, smoothly serve heuristic recommendations without stderr pollution
    console.warn('Gemini recommendation notice: serving heuristic recommendations (details:', err?.message || 'fallback', ')');
    const fallback = getHeuristicRecommendations(bookingHistory, preferences, city);
    return res.json({
      success: true,
      source: 'fallback',
      summary: 'Personalized salon services curated for your style and hair care routine.',
      recommendations: fallback,
    });
  }
});

// ─── Start Server with Vite Middlewares in Dev / Static in Prod ────────────────
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Nexora app server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
