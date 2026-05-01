require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a technical skill evaluator. Generate a short skill verification challenge for a student who claims to be at Advanced level in React.

The challenge must:
- Be answerable in 3-5 sentences or a short code snippet (max 10 lines)
- Be specific to React at Advanced level
- Have a clear correct answer you can evaluate
- Not require running code — just written explanation or pseudocode

Respond in this exact JSON format with no markdown:
{
  "question": "the challenge question here",
  "hint": "a small hint to help them",
  "expectedTopics": ["topic1", "topic2", "topic3"]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  console.log("RAW TEXT:\n", text);

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    console.log("PARSED SUCCESSFULLY");
  } catch (err) {
    console.error("JSON PARSE ERROR:", err.message);
    
    // Let's try to see where it failed
    console.log("Failed around position:");
    const match = err.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      console.log(clean.substring(Math.max(0, pos - 20), pos + 20));
    }
  }
}

testGemini();
