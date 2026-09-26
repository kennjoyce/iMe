// Press-only helper for the Michael Collins demo.
// Only hands out a session if the right press access code is given.
// To change the code, edit PRESS_CODE below (keep it private).

const PRESS_CODE = "COLLINS1922";
const PERSONA_ID = "a6ce6004-34b6-49be-8627-55362516aa0a";
const SESSION_SECONDS = 300; // 5 minutes

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "" };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) {}

  const code = String(body.code || "").trim().toUpperCase();
  if (code !== PRESS_CODE) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "code" }),
    };
  }

  try {
    const res = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
      },
      body: JSON.stringify({ personaConfig: { personaId: PERSONA_ID } }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const { sessionToken } = await res.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, seconds: SESSION_SECONDS }),
    };
  } catch (err) {
    console.error("Press token failed", err);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "token" }),
    };
  }
};
