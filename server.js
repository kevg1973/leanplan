import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve built React app
app.use(express.static(join(__dirname, "dist")));

// ── Chat endpoint ──────────────────────────────────────────────────────────────
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/chat", async (req, res) => {
  const { messages, profile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const systemPrompt = `You are a friendly, knowledgeable personal health coach built into LeanPlan, a fitness and nutrition app.

The user's profile:
- Name: ${profile?.name || "Friend"}
- Age: ${profile?.age || 53}
- Goal: ${profile?.goal?.replace("_", " ") || "lose weight"}
- Target: Lose ${profile?.targetLbs || 14} lbs at ${profile?.paceId || "moderate"} pace
- Workouts/week: ${profile?.workoutsPerWeek || 3}
- Allergies: ${profile?.allergies?.join(", ") || "none declared"}
- Dislikes: ${profile?.dislikes?.join(", ") || "none declared"}
- Equipment: rowing machine, cross trainer, dumbbells, cable machines
- Constraints: back problems, soft knees — no HIIT, no running, no jumping
- Diet: gluten-free, dairy-free, no fish, no oats, no cow's milk

Your role:
1. Answer health, fitness, nutrition and wellbeing questions helpfully and specifically to this person
2. When the user mentions a NEW food dislike (e.g. "I don't like X" or "remove X from my meals"), extract the food name and include a JSON action at the END of your response in this exact format on its own line:
   ACTION:{"type":"add_dislike","value":"food name"}
3. When they mention a NEW pain or injury (e.g. "my shoulder hurts" or "I've got knee pain"), acknowledge it with exercise advice AND include:
   ACTION:{"type":"add_pain","value":"description of pain"}
4. When they mention an allergy (e.g. "I'm allergic to X"), include:
   ACTION:{"type":"add_allergy","value":"allergen name"}
5. When they want to remove a dislike (e.g. "actually I like X now"), include:
   ACTION:{"type":"remove_dislike","value":"food name"}

Keep responses warm, concise and practical — 2-4 sentences usually. Don't be overly formal.
If they're just chatting or asking questions, respond naturally without any ACTION line.
Only include an ACTION line if there's a genuine profile update to make.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0]?.text || "";

    // Extract action if present
    const actionMatch = text.match(/^ACTION:(.+)$/m);
    let action = null;
    let cleanText = text;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        cleanText = text.replace(/^ACTION:.+$/m, "").trim();
      } catch (e) {
        // malformed action, ignore
      }
    }

    res.json({ text: cleanText, action });
  } catch (err) {
    console.error("Anthropic error:", err.message);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

// All other routes serve the React app
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`LeanPlan server running on port ${PORT}`);
});
