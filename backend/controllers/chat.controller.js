// backend/src/controllers/chat.controller.js
// const { startConversation, streamGemini } = require("../services/chat.service");
const { startConversation, streamGemini } = require("../services/chat.service");
const { pool } = require("../config/db.config"); // sửa path nếu khác

async function start(req, res) {
    const userId = req.user?.id || null; // giả định auth middleware gán req.user
    const topic = req.body?.topic || null;
    const id = await startConversation(userId, topic);
    res.json({ conversationId: id });
}

async function health(req, res) {
    const out = { ok: false, checks: {} };

    // ENV
    out.checks.env = {
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL || null,
    };

    // Tables
    try {
        const q = `
      SELECT COUNT(*) FILTER (WHERE table_name='chatbot_conversation') AS conv,
             COUNT(*) FILTER (WHERE table_name='chatbot_message') AS msg
      FROM information_schema.tables
      WHERE table_schema = 'bookstore'
        AND table_name IN ('chatbot_conversation','chatbot_message')
    `;
        const { rows } = await pool.query(q);
        out.checks.tables = {
            chatbot_conversation: Number(rows[0].conv) === 1,
            chatbot_message: Number(rows[0].msg) === 1,
        };
    } catch (e) {
        out.checks.tables = { error: e.message };
    }

    // SSE testable
    out.checks.sse = true;

    out.ok = !!(out.checks.env.GOOGLE_API_KEY && out.checks.tables?.chatbot_conversation && out.checks.tables?.chatbot_message);
    res.json(out);
}

async function stream(req, res) {
    const q = (req.query.q || "").toString();
    const conversationId = (req.query.conversationId || "").toString();
    if (!q || !conversationId) {
        return res.status(400).json({ error: "MISSING_PARAMS", message: "Thiếu q hoặc conversationId" });
    }
    await streamGemini({ res, conversationId, user: req.user || null, userInput: q });
}

async function streamTest(req, res) {
    // SSE demo (không gọi AI)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let i = 0;
    const iv = setInterval(() => {
        i++;
        res.write(`event: delta\ndata: ${".".repeat(i)}\n\n`);
        if (i >= 5) {
            clearInterval(iv);
            res.write(`event: done\ndata: {"ok":true}\n\n`);
            res.end();
        }
    }, 500);
}

module.exports = { start, health, stream, streamTest };
