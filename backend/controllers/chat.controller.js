
// backend/src/controllers/chat.controller.js
const { startConversation, streamGemini } = require("../services/chat.service");
const { pool } = require("../config/db.config");
const jwt = require("jsonwebtoken");
// Dùng chung 1 secret cho verify, khớp với chỗ sign token
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

async function start(req, res) {
    const userId = req.user?.id || null;
    const topic = req.body?.topic || null;
    const id = await startConversation(userId, topic);
    res.json({ conversationId: id });
}

async function health(req, res) {
    const out = { ok: false, checks: {} };

    out.checks.env = {
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL || null,
    };

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

    try {
        const { rows } = await pool.query(`
      SELECT extname FROM pg_extension
      WHERE extname IN ('pg_trgm')
    `);
        out.checks.extensions = { pg_trgm: rows.some(r => r.extname === "pg_trgm") };
    } catch (e) {
        out.checks.extensions = { error: e.message };
    }

    out.checks.sse = true;
    out.ok = !!(out.checks.env.GOOGLE_API_KEY && out.checks.tables?.chatbot_conversation && out.checks.tables?.chatbot_message);
    res.json(out);
}


async function stream(req, res) {
    try {
        const qToken = (req.query.token || "").toString();

        if (qToken && JWT_SECRET) {
            try {
                const payload = jwt.verify(qToken, JWT_SECRET);

                // ⚠️ SỬA Ở ĐÂY: ƯU TIÊN payload.id || payload.user_id || payload.sub
                const userId = payload.id || payload.user_id || payload.sub;

                req.user = {
                    id: userId,
                    email: payload.email,
                    role: payload.role,
                    raw: payload,    // optional: để debug sau này
                };

                console.log("[chat.stream] user from token:", req.user.id);
            } catch (e) {
                console.error("[chat.stream] invalid token:", e.message);
            }
        }

        const q = (req.query.q || "").toString();
        const conversationId = (req.query.conversationId || "").toString();
        if (!q || !conversationId) {
            return res
                .status(400)
                .json({ error: "MISSING_PARAMS", message: "Thiếu q hoặc conversationId" });
        }

        await streamGemini({
            res,
            conversationId,
            user: req.user || null,
            userInput: q,
        });
    } catch (err) {
        console.error("[chat.stream] error:", err?.message);
        try {
            res
                .status(500)
                .json({ error: "STREAM_ERROR", message: "Lỗi stream" });
        } catch (_) { }
    }
}

async function streamTest(req, res) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let i = 0;
    const iv = setInterval(() => {
        i++;
        res.write(`event: ui\ndata: ${JSON.stringify({
            type: "products", items: Array.from({ length: 3 }).map((_, k) => ({
                id: `demo-${k + 1}`,
                title: `Sách demo ${k + 1}`,
                author: "Tác giả",
                price: 99000 + k * 10000,
                rating: 4.2,
                image: `https://placehold.co/200x200?text=Demo+${k + 1}`
            }))
        })}\n\n`);
        res.write(`event: delta\ndata: ${".".repeat(i)}\n\n`);
        if (i >= 3) {
            clearInterval(iv);
            res.write(`event: done\ndata: {"ok":true}\n\n`);
            res.end();
        }
    }, 500);
}

module.exports = { start, health, stream, streamTest };
