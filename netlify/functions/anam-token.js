// Hidden helper: swaps the secret Anam API key for a short-lived session token.
// The key lives in Netlify (Site settings > Environment variables > ANAM_API_KEY),
// never in the web page.

const PERSONA_ID = "a6ce6004-34b6-49be-8627-55362516aa0a"; // Michael Collins
const MAX_SECONDS = 90;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Only hand out a session to someone who filled in the form.
  let lead = {};
  try { lead = JSON.parse(event.body || "{}"); } catch (e) {}
  if (!lead.name || !lead.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
    return { statusCode: 400, body: "Name and email required" };
  }

  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "Server not configured" };
  }

  const ask = (personaConfig) =>
    fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ personaConfig }),
    });

  // Try with Anam's own 90-second cap first; fall back to the page timer alone.
  let res = await ask({ personaId: PERSONA_ID, maxSessionLengthSeconds: MAX_SECONDS });
  if (!res.ok) res = await ask({ personaId: PERSONA_ID });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Anam error", res.status, detail);
    return { statusCode: 502, body: "Could not start session" };
  }

  const data = await res.json();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ sessionToken: data.sessionToken, seconds: MAX_SECONDS }),
  };
};
