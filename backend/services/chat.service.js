// backend/src/services/chat.service.js
const { pool } = require("../config/db.config");
const { ai, getModelName, SAFE_MODELS } = require("../config/ai.genai");
const systemPrompt = require("../config/ai.system-prompt");
const { TOOL_REGISTRY } = require("./chat.tools");

function sseWrite(res, event, data) {
    if (event) res.write(`event: ${event}\n`);
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    for (const line of String(payload).split(/\r?\n/)) res.write(`data: ${line}\n`);
    res.write("\n");
}

// Giới hạn số message trong history để tránh phình context
const MAX_HISTORY_MESSAGES = 20;

// ===== Helpers cho text của model/stream =====
function resultToText(result) {
    if (!result) return "";
    if (typeof result === "string") return result;
    if (typeof result.text === "string") return result.text;
    if (typeof result.text === "function") {
        try { return result.text(); } catch { }
    }
    if (result.response && typeof result.response.text === "function") {
        try { return result.response.text(); } catch { }
    }
    return "";
}

function chunkToText(chunk) {
    if (!chunk) return "";
    if (typeof chunk === "string") return chunk;
    if (typeof chunk.text === "string") return chunk.text;
    if (typeof chunk.text === "function") {
        try { return chunk.text(); } catch { }
    }
    if (typeof chunk.delta === "string") return chunk.delta;
    if (typeof chunk.delta === "function") {
        try { return chunk.delta(); } catch { }
    }
    return "";
}

// ===== Helper: xoá URL ảnh khỏi dữ liệu tool trước khi gửi cho LLM =====
function sanitizeToolOutputForLLM(out) {
    if (!out || typeof out !== "object") return out;

    // clone để không sửa object gốc dùng cho UI
    const clone = JSON.parse(JSON.stringify(out));

    const strip = (obj) => {
        if (!obj || typeof obj !== "object") return;
        for (const key of Object.keys(obj)) {
            const val = obj[key];

            // Các field liên quan tới ảnh / gallery
            if (
                key === "image_url" ||
                key === "image" ||
                key === "thumbnail" ||
                key === "gallery_urls"
            ) {
                delete obj[key];
            } else if (typeof val === "object") {
                strip(val);
            }
        }
    };

    strip(clone);
    return clone;
}

// System prompt riêng cho planner (quyết định TOOL_CALL)
const plannerSystemPrompt = `${systemPrompt}

---

QUY TẮC TOOL_CALL DÀNH CHO HỆ THỐNG (PLANNER):

- Hãy xem lịch sử hội thoại phía trên (role user/model).
- Nếu cần dùng TOOL để trả lời tốt hơn:
  + CHỈ trả lại duy nhất một dòng, không text nào khác.
  + Dòng đó phải có dạng:
TOOL_CALL: {"name":"<tool_name>","arguments":{...}}
- JSON phải hợp lệ: dùng dấu nháy kép ", không comment, không dư dấu phẩy.
- Nếu KHÔNG cần dùng TOOL: hãy trả lời bình thường theo vai trò Trợ lý BookStore.`;

async function startConversation(userId, topic) {
    const { rows } = await pool.query(
        `INSERT INTO chatbot_conversation (user_id, topic) VALUES ($1,$2) RETURNING id`,
        [userId || null, topic || null]
    );
    return rows[0].id;
}

async function saveMessage(conversationId, sender, text, tokens = null, metadata = null) {
    await pool.query(
        `INSERT INTO chatbot_message (conversation_id, sender, message_text, tokens, metadata)
     VALUES ($1,$2,$3,$4,$5)`,
        [conversationId, sender, text, tokens, metadata]
    );
}

async function getHistory(conversationId) {
    const { rows } = await pool.query(
        `SELECT sender, message_text, sent_at
     FROM chatbot_message
     WHERE conversation_id = $1
     ORDER BY sent_at ASC`,
        [conversationId]
    );
    const history = rows.map((r) => ({ sender: r.sender, text: r.message_text }));
    if (history.length <= MAX_HISTORY_MESSAGES) return history;
    // chỉ lấy N message gần nhất
    return history.slice(-MAX_HISTORY_MESSAGES);
}

function toContentsFromHistory(history) {
    return history.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
    }));
}

const isNotFoundModel = (err) => {
    const code = err?.error?.code || err?.code;
    const status = err?.error?.status || err?.status;
    const msg = err?.error?.message || err?.message || "";
    return (
        code === 404 ||
        status === "NOT_FOUND" ||
        /not found for API version/i.test(msg) ||
        /is not supported for generateContent/i.test(msg)
    );
};

async function genContentWithRetry({ contents, systemInstruction }) {
    let model = getModelName();
    try {
        return await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
        });
    } catch (e) {
        if (isNotFoundModel(e)) {
            model = SAFE_MODELS[0];
            return await ai.models.generateContent({
                model,
                contents,
                config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
            });
        }
        throw e;
    }
}

async function genStreamWithRetry({ contents, systemInstruction }) {
    let model = getModelName();
    try {
        return await ai.models.generateContentStream({
            model,
            contents,
            config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
        });
    } catch (e) {
        if (isNotFoundModel(e)) {
            model = SAFE_MODELS[0];
            return await ai.models.generateContentStream({
                model,
                contents,
                config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
            });
        }
        throw e;
    }
}

// ===== Helper: bóc TOOL_CALL: {...} từ text của model =====
function extractToolCallFromText(text) {
    if (!text) return null;
    const idx = text.indexOf("TOOL_CALL:");
    if (idx === -1) return null;

    const after = text.slice(idx + "TOOL_CALL:".length);
    const firstBrace = after.indexOf("{");
    if (firstBrace === -1) return null;

    let jsonCandidate = after.slice(firstBrace);
    const lastBrace = jsonCandidate.lastIndexOf("}");
    if (lastBrace !== -1) {
        jsonCandidate = jsonCandidate.slice(0, lastBrace + 1);
    }

    // Chuẩn hoá dấu nháy & dấu phẩy thừa
    jsonCandidate = jsonCandidate
        .replace(/[\u201C\u201D]/g, '"') // “ ” -> "
        .replace(/[\u2018\u2019]/g, '"') // ‘ ’ -> "
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

    try {
        return JSON.parse(jsonCandidate.trim());
    } catch (e) {
        console.error("[extractToolCallFromText] JSON parse error:", e.message, "raw:", jsonCandidate);
        return null;
    }
}

// ===== Phase A: quyết định TOOL_CALL =====
async function planToolIfAny({ history, userId }) {
    // Không thêm lại userInput, vì đã nằm trong history rồi
    const contents = [...toContentsFromHistory(history)];

    const result = await genContentWithRetry({
        contents,
        systemInstruction: plannerSystemPrompt,
    });

    const text = resultToText(result);
    if (!text) return { used: false };

    const spec = extractToolCallFromText(text);
    if (!spec || !spec.name) return { used: false };

    const tool = TOOL_REGISTRY[spec.name];
    if (!tool) {
        console.warn("[planToolIfAny] Unknown tool:", spec.name);
        return { used: false };
    }

    const args = spec.arguments || {};
    const out = await tool.exec(userId, args);

    // 🔥 BẢN DỮ LIỆU GỬI CHO LLM: đã bỏ image_url, gallery...
    const sanitizedForLLM = sanitizeToolOutputForLLM(out);

    return {
        used: true,
        toolName: spec.name,
        toolArgs: args,
        toolOutput: out, // giữ bản đầy đủ cho UI (card sản phẩm, order...)
        toolContextText: `[Tool ${spec.name}]: ${JSON.stringify({
            input: args,
            output: sanitizedForLLM,
        })}`,
    };
}

// ===== Phase 3: sở thích hội thoại (metadata) =====
async function mergeConversationMetadata(conversationId, patch = {}) {
    await pool.query(
        `
    UPDATE chatbot_conversation
    SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
    WHERE id = $1
  `,
        [conversationId, JSON.stringify(patch)]
    );
}

function extractPrefsFromTool(toolName, toolArgs) {
    const pref = {};
    if (["search_books", "filter_by_price", "list_best_sellers"].includes(toolName)) {
        if (toolArgs?.category) pref.preferred_category = toolArgs.category;
    }
    if (toolName === "filter_by_price" && typeof toolArgs?.max_price === "number") {
        pref.max_budget = toolArgs.max_price;
    }
    if (toolArgs?.query) pref.last_query = toolArgs.query;
    return Object.keys(pref).length ? pref : null;
}

// ===== Stream chính (Phase 1–4) =====
async function streamGemini({ res, conversationId, user, userInput }) {
    try {
        const userId = user?.id || null;

        // Validate conversation & quyền sở hữu
        const convRes = await pool.query(
            `SELECT user_id FROM chatbot_conversation WHERE id = $1`,
            [conversationId]
        );
        if (!convRes.rows.length) {
            sseWrite(res, "error", {
                code: "CONVERSATION_NOT_FOUND",
                message: "Phiên chat không tồn tại hoặc đã bị xoá.",
            });
            sseWrite(res, "done", { ok: false });
            res.end();
            return;
        }
        const ownerId = convRes.rows[0].user_id;
        const effectiveUserId = userId || ownerId || null;
        if (ownerId && userId && ownerId !== userId) {
            sseWrite(res, "error", {
                code: "CONVERSATION_FORBIDDEN",
                message: "Bạn không có quyền truy cập phiên chat này.",
            });
            sseWrite(res, "done", { ok: false });
            res.end();
            return;
        }

        // Lưu user message
        await saveMessage(conversationId, "user", userInput);

        const history = await getHistory(conversationId);

        // Phase A: detect & run tool
        let plan = { used: false };
        try {
            // plan = await planToolIfAny({ history, userId });
            plan = await planToolIfAny({ history, userId: effectiveUserId });
        } catch (e) {
            console.error("[planToolIfAny] error:", e?.message || e);
        }

        // Phase 1: UI payload sản phẩm
        const maybeBooks =
            plan.used &&
                ["search_books", "get_similar_books", "filter_by_price", "list_best_sellers"].includes(plan.toolName) &&
                plan.toolOutput?.items?.length
                ? plan.toolOutput.items
                : null;

        if (maybeBooks) {
            const items = maybeBooks.map((b) => ({
                id: b.id,
                title: b.title,
                author: b.author || "",
                price: Number(b.price),
                rating: typeof b.rating_avg === "number" ? Number(b.rating_avg) : null,
                image:
                    b.image_url ||
                    `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`,
            }));
            sseWrite(res, "ui", { type: "products", items });
        }

        // Phase 4: UI payload order status
        if (plan.used && plan.toolName === "get_order_status" && plan.toolOutput?.order) {
            const o = plan.toolOutput.order;
            sseWrite(res, "ui", {
                type: "order_status",
                order: {
                    id: o.id,
                    status: o.status,
                    placed_at: o.placed_at,
                    grand_total: typeof o.grand_total === "number" ? o.grand_total : Number(o.grand_total),
                    tracking_number: o.tracking_number || null,
                    payment_status: o.payment_status || null,
                    payment_method: o.payment_method || null,
                    amount_paid: o.amount_paid != null ? Number(o.amount_paid) : null,
                },
            });
        }

        // Phase 3: lưu sở thích (nếu có)
        if (plan.used) {
            const prefPatch = extractPrefsFromTool(plan.toolName, plan.toolArgs);
            if (prefPatch) mergeConversationMetadata(conversationId, prefPatch).catch(() => { });
        }

        // Phase B: final stream — KHÔNG thêm lại userInput (đã nằm trong history)
        const finalContents = [
            ...toContentsFromHistory(history),
            ...(plan.used
                ? [
                    { role: "user", parts: [{ text: `Dữ liệu tool:\n${plan.toolContextText}` }] },
                    { role: "user", parts: [{ text: "Hãy dựa trên dữ liệu tool ở trên để trả lời cuối cùng, gợi ý rõ ràng." }] },
                ]
                : []),
        ];

        const resp = await genStreamWithRetry({
            contents: finalContents,
            systemInstruction: systemPrompt,
        });

        const iter = resp?.stream ?? resp;

        let full = "";
        for await (const chunk of iter) {
            const piece = chunkToText(chunk);
            if (piece) {
                full += piece;
                sseWrite(res, "delta", piece);
            }
        }

        sseWrite(res, "done", { ok: true });
        res.end();

        await saveMessage(
            conversationId,
            "ai",
            full,
            null,
            plan.used ? { tool: plan.toolName, args: plan.toolArgs, output: plan.toolOutput || null } : null
        );
    } catch (err) {
        console.error("[chat.stream] error:", err?.name, err?.message);
        try {
            sseWrite(res, "error", {
                message: "Đã xảy ra lỗi khi sinh phản hồi.",
                code: err?.name || "GENAI_ERROR",
            });
            sseWrite(res, "done", { ok: false });
            res.end();
        } catch (_) { }
    }
}

module.exports = { startConversation, saveMessage, streamGemini };


// //code sau
// // backend/src/services/chat.service.js
// const { pool } = require("../config/db.config");
// const { ai, getModelName, SAFE_MODELS } = require("../config/ai.genai");
// const systemPrompt = require("../config/ai.system-prompt");
// const { TOOL_REGISTRY } = require("./chat.tools");

// function sseWrite(res, event, data) {
//     if (event) res.write(`event: ${event}\n`);
//     res.write(`data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`);
// }

// async function startConversation(userId, topic) {
//     const { rows } = await pool.query(
//         `INSERT INTO chatbot_conversation (user_id, topic) VALUES ($1,$2) RETURNING id`,
//         [userId || null, topic || null]
//     );
//     return rows[0].id;
// }

// async function saveMessage(conversationId, sender, text, tokens = null, metadata = null) {
//     await pool.query(
//         `INSERT INTO chatbot_message (conversation_id, sender, message_text, tokens, metadata)
//      VALUES ($1,$2,$3,$4,$5)`,
//         [conversationId, sender, text, tokens, metadata]
//     );
// }

// async function getHistory(conversationId) {
//     const { rows } = await pool.query(
//         `SELECT sender, message_text, sent_at
//      FROM chatbot_message
//      WHERE conversation_id = $1
//      ORDER BY sent_at ASC`,
//         [conversationId]
//     );
//     return rows.map((r) => ({ sender: r.sender, text: r.message_text }));
// }

// function toContentsFromHistory(history) {
//     return history.map((m) => ({
//         role: m.sender === "user" ? "user" : "model",
//         parts: [{ text: m.text }],
//     }));
// }

// const isNotFoundModel = (err) => {
//     const code = err?.error?.code || err?.code;
//     const status = err?.error?.status || err?.status;
//     const msg = err?.error?.message || err?.message || "";
//     return (
//         code === 404 ||
//         status === "NOT_FOUND" ||
//         /not found for API version/i.test(msg) ||
//         /is not supported for generateContent/i.test(msg)
//     );
// };

// async function genContentWithRetry({ contents, systemInstruction }) {
//     let model = getModelName();
//     try {
//         return await ai.models.generateContent({
//             model,
//             contents,
//             config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
//         });
//     } catch (e) {
//         if (isNotFoundModel(e)) {
//             model = SAFE_MODELS[0];
//             return await ai.models.generateContent({
//                 model,
//                 contents,
//                 config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
//             });
//         }
//         throw e;
//     }
// }

// async function genStreamWithRetry({ contents, systemInstruction }) {
//     let model = getModelName();
//     try {
//         return await ai.models.generateContentStream({
//             model,
//             contents,
//             config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
//         });
//     } catch (e) {
//         if (isNotFoundModel(e)) {
//             model = SAFE_MODELS[0];
//             return await ai.models.generateContentStream({
//                 model,
//                 contents,
//                 config: { systemInstruction: { parts: [{ text: systemInstruction }] } },
//             });
//         }
//         throw e;
//     }
// }

// // ===== Phase A: quyết định TOOL_CALL =====
// async function planToolIfAny({ history, userText, userId }) {
//     const contents = [
//         ...toContentsFromHistory(history),
//         { role: "user", parts: [{ text: userText }] },
//         {
//             role: "user",
//             parts: [{
//                 text:
//                     'Hướng dẫn dành cho hệ thống: Nếu cần gọi tool, hãy in đúng 1 dòng duy nhất:\n' +
//                     'TOOL_CALL: {"name":"<tool_name>","arguments":{...}}\n' +
//                     "Nếu không cần tool, trả lời bình thường.",
//             }],
//         },
//     ];

//     const result = await genContentWithRetry({ contents, systemInstruction: systemPrompt });

//     const text =
//         (typeof result?.text === "string" && result.text) ||
//         (typeof result?.response?.text === "function" && result.response.text()) ||
//         "";

//     const line = text.split("\n").find((l) => l.startsWith("TOOL_CALL:"));
//     if (!line) return { used: false };

//     let spec;
//     try {
//         spec = JSON.parse(line.replace("TOOL_CALL:", "").trim());
//     } catch {
//         return { used: false };
//     }
//     const tool = TOOL_REGISTRY[spec.name];
//     if (!tool) return { used: false };

//     const out = await tool.exec(userId, spec.arguments || {});
//     return {
//         used: true,
//         toolName: spec.name,
//         toolArgs: spec.arguments || {},
//         toolOutput: out, // <== dùng phát UI
//         toolContextText: `[Tool ${spec.name}]: ${JSON.stringify({
//             input: spec.arguments || {},
//             output: out,
//         })}`,
//     };
// }

// // ===== Phase 3: sở thích hội thoại (metadata) =====
// async function mergeConversationMetadata(conversationId, patch = {}) {
//     await pool.query(
//         `
//     UPDATE chatbot_conversation
//     SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
//     WHERE id = $1
//   `,
//         [conversationId, JSON.stringify(patch)]
//     );
// }

// function extractPrefsFromTool(toolName, toolArgs) {
//     const pref = {};
//     if (["search_books", "filter_by_price", "list_best_sellers"].includes(toolName)) {
//         if (toolArgs?.category) pref.preferred_category = toolArgs.category;
//     }
//     if (toolName === "filter_by_price" && typeof toolArgs?.max_price === "number") {
//         pref.max_budget = toolArgs.max_price;
//     }
//     if (toolArgs?.query) pref.last_query = toolArgs.query;
//     return Object.keys(pref).length ? pref : null;
// }

// // ===== Stream chính (Phase 1–4) =====
// async function streamGemini({ res, conversationId, user, userInput }) {
//     try {
//         const userId = user?.id || null;

//         // Lưu user message
//         await saveMessage(conversationId, "user", userInput);

//         const history = await getHistory(conversationId);

//         // Phase A: detect & run tool
//         let plan = { used: false };
//         try {
//             plan = await planToolIfAny({ history, userText: userInput, userId });
//         } catch (e) {
//             console.error("[planToolIfAny] error:", e?.message || e);
//         }

//         // Phase 1: UI payload sản phẩm (giữ nguyên)
//         const maybeBooks =
//             plan.used &&
//                 ["search_books", "get_similar_books", "filter_by_price", "list_best_sellers"].includes(plan.toolName) &&
//                 plan.toolOutput?.items?.length
//                 ? plan.toolOutput.items
//                 : null;

//         if (maybeBooks) {
//             const items = maybeBooks.map((b) => ({
//                 id: b.id,
//                 title: b.title,
//                 author: b.author || "",
//                 price: Number(b.price),
//                 rating: typeof b.rating_avg === "number" ? Number(b.rating_avg) : null,
//                 image:
//                     b.image_url ||
//                     `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`,
//             }));
//             sseWrite(res, "ui", { type: "products", items });
//         }

//         // ===== Phase 4: UI payload order status =====
//         if (plan.used && plan.toolName === "get_order_status" && plan.toolOutput?.order) {
//             const o = plan.toolOutput.order;
//             // Chuẩn hoá dữ liệu gửi FE (đủ cho card + deeplink)
//             sseWrite(res, "ui", {
//                 type: "order_status",
//                 order: {
//                     id: o.id,
//                     status: o.status,
//                     placed_at: o.placed_at,
//                     grand_total: typeof o.grand_total === "number" ? o.grand_total : Number(o.grand_total),
//                     tracking_number: o.tracking_number || null,
//                     payment_status: o.payment_status || null,
//                     payment_method: o.payment_method || null,
//                     amount_paid: o.amount_paid != null ? Number(o.amount_paid) : null,
//                 },
//             });
//         }

//         // Phase 3: lưu sở thích (nếu có)
//         if (plan.used) {
//             const prefPatch = extractPrefsFromTool(plan.toolName, plan.toolArgs);
//             if (prefPatch) mergeConversationMetadata(conversationId, prefPatch).catch(() => { });
//         }

//         // Phase B: final stream — KHÔNG thêm lại userInput (đã nằm trong history)
//         const finalContents = [
//             ...toContentsFromHistory(history),
//             ...(plan.used
//                 ? [
//                     { role: "user", parts: [{ text: `Dữ liệu tool:\n${plan.toolContextText}` }] },
//                     { role: "user", parts: [{ text: "Hãy dựa trên dữ liệu tool ở trên để trả lời cuối cùng, gợi ý rõ ràng." }] },
//                 ]
//                 : []),
//         ];

//         const resp = await genStreamWithRetry({
//             contents: finalContents,
//             systemInstruction: systemPrompt,
//         });

//         const iter = resp?.stream ?? resp;

//         let full = "";
//         for await (const chunk of iter) {
//             const piece =
//                 (typeof chunk?.text === "string" && chunk.text) ||
//                 (typeof chunk?.delta === "string" && chunk.delta) ||
//                 "";
//             if (piece) {
//                 full += piece;
//                 sseWrite(res, "delta", piece);
//             }
//         }

//         sseWrite(res, "done", { ok: true });
//         res.end();

//         await saveMessage(
//             conversationId,
//             "ai",
//             full,
//             null,
//             plan.used ? { tool: plan.toolName, args: plan.toolArgs, output: plan.toolOutput || null } : null
//         );
//     } catch (err) {
//         console.error("[chat.stream] error:", err?.name, err?.message);
//         try {
//             sseWrite(res, "error", {
//                 message: "Đã xảy ra lỗi khi sinh phản hồi.",
//                 code: err?.name || "GENAI_ERROR",
//             });
//             res.end();
//         } catch (_) { }
//     }
// }

// module.exports = { startConversation, saveMessage, streamGemini };
