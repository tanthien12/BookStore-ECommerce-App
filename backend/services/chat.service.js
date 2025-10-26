
// // backend/services/chat.service.js
// const { pool } = require("../config/db.config");
// const { ai, MODEL } = require("../config/ai.genai");
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

// /** Convert history in DB -> contents[] cho @google/genai */
// function toContentsFromHistory(history) {
//     return history.map((m) => ({
//         role: m.sender === "user" ? "user" : m.sender === "ai" ? "model" : "system",
//         parts: [{ text: m.text }],
//     }));
// }

// /** Phase A: lập kế hoạch tool bằng contents */
// async function planToolIfAny({ history, userText, userId }) {
//     const contents = [
//         { role: "system", parts: [{ text: systemPrompt }] },
//         ...toContentsFromHistory(history),
//         { role: "user", parts: [{ text: userText }] },
//         {
//             role: "system",
//             parts: [
//                 {
//                     text:
//                         'Nếu cần gọi tool, hãy in đúng 1 dòng duy nhất:\n' +
//                         'TOOL_CALL: {"name":"<tool_name>","arguments":{...}}\n' +
//                         "Nếu không cần tool, trả lời bình thường.",
//                 },
//             ],
//         },
//     ];

//     const result = await ai.models.generateContent({
//         model: MODEL,
//         contents,
//     });

//     // Tương thích nhiều version SDK: lấy text từ .text hoặc .response.text()
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
//         toolContextText: `[Tool ${spec.name}]: ${JSON.stringify({
//             input: spec.arguments || {},
//             output: out,
//         })}`,
//     };
// }

// async function streamGemini({ res, conversationId, user, userInput }) {
//     try {
//         const userId = user?.id || null;

//         // Lưu user msg
//         await saveMessage(conversationId, "user", userInput);

//         const history = await getHistory(conversationId);

//         // Phase A: detect tool
//         let plan = { used: false };
//         try {
//             plan = await planToolIfAny({ history, userText: userInput, userId });
//         } catch (e) {
//             console.error("[planToolIfAny] error:", e?.message || e);
//         }

//         // Phase B: final streaming bằng contents
//         const finalContents = [
//             { role: "system", parts: [{ text: systemPrompt }] },
//             ...toContentsFromHistory(history),
//             ...(plan.used
//                 ? [
//                     { role: "system", parts: [{ text: `Dữ liệu tool:\n${plan.toolContextText}` }] },
//                     {
//                         role: "system",
//                         parts: [{ text: "Hãy dựa trên dữ liệu tool ở trên để trả lời cuối cùng, gợi ý rõ ràng." }],
//                     },
//                 ]
//                 : []),
//             { role: "user", parts: [{ text: userInput }] },
//         ];

//         const resp = await ai.models.generateContentStream({
//             model: MODEL,
//             contents: finalContents,
//         });

//         // Một số version trả {stream}, một số trả AsyncIterable trực tiếp
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
//             plan.used ? { tool: plan.toolName, args: plan.toolArgs } : null
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

// backend/services/chat.service.js
const { pool } = require("../config/db.config");
const { ai, getModelName, SAFE_MODELS } = require("../config/ai.genai");
const systemPrompt = require("../config/ai.system-prompt");
const { TOOL_REGISTRY } = require("./chat.tools");

function sseWrite(res, event, data) {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`);
}

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
    return rows.map((r) => ({ sender: r.sender, text: r.message_text }));
}

// Convert history -> contents (chỉ user/model; KHÔNG dùng system)
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
    return code === 404 || status === "NOT_FOUND" ||
        /not found for API version/i.test(msg) ||
        /is not supported for generateContent/i.test(msg);
};

// ==== wrappers có retry khi model không hỗ trợ ====
async function genContentWithRetry({ contents, systemInstruction }) {
    let model = getModelName();
    try {
        return await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction: { parts: [{ text: systemInstruction }] } }, // <- ĐÚNG CHUẨN
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
            config: { systemInstruction: { parts: [{ text: systemInstruction }] } }, // <- ĐÚNG CHUẨN
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

// ===== Phase A: quyết định TOOL_CALL (KHÔNG dùng system role trong contents)
async function planToolIfAny({ history, userText, userId }) {
    const contents = [
        ...toContentsFromHistory(history),
        { role: "user", parts: [{ text: userText }] },
        {
            role: "user",
            parts: [
                {
                    text:
                        'Hướng dẫn dành cho hệ thống: Nếu cần gọi tool, hãy in đúng 1 dòng duy nhất:\n' +
                        'TOOL_CALL: {"name":"<tool_name>","arguments":{...}}\n' +
                        "Nếu không cần tool, trả lời bình thường.",
                },
            ],
        },
    ];

    const result = await genContentWithRetry({
        contents,
        systemInstruction: systemPrompt, // chỉ 1 systemInstruction
    });

    const text =
        (typeof result?.text === "string" && result.text) ||
        (typeof result?.response?.text === "function" && result.response.text()) ||
        "";

    const line = text.split("\n").find((l) => l.startsWith("TOOL_CALL:"));
    if (!line) return { used: false };

    let spec;
    try {
        spec = JSON.parse(line.replace("TOOL_CALL:", "").trim());
    } catch {
        return { used: false };
    }
    const tool = TOOL_REGISTRY[spec.name];
    if (!tool) return { used: false };

    const out = await tool.exec(userId, spec.arguments || {});
    return {
        used: true,
        toolName: spec.name,
        toolArgs: spec.arguments || {},
        toolContextText: `[Tool ${spec.name}]: ${JSON.stringify({
            input: spec.arguments || {},
            output: out,
        })}`,
    };
}

async function streamGemini({ res, conversationId, user, userInput }) {
    try {
        const userId = user?.id || null;

        // lưu tin user
        await saveMessage(conversationId, "user", userInput);

        const history = await getHistory(conversationId);

        // Phase A: detect tool
        let plan = { used: false };
        try {
            plan = await planToolIfAny({ history, userText: userInput, userId });
        } catch (e) {
            console.error("[planToolIfAny] error:", e?.message || e);
        }

        // Phase B: final stream (KHÔNG dùng system role; tool context đưa vào user message)
        const finalContents = [
            ...toContentsFromHistory(history),
            ...(plan.used
                ? [
                    { role: "user", parts: [{ text: `Dữ liệu tool:\n${plan.toolContextText}` }] },
                    { role: "user", parts: [{ text: "Hãy dựa trên dữ liệu tool ở trên để trả lời cuối cùng, gợi ý rõ ràng." }] },
                ]
                : []),
            { role: "user", parts: [{ text: userInput }] },
        ];

        const resp = await genStreamWithRetry({
            contents: finalContents,
            systemInstruction: systemPrompt, // chỉ 1 systemInstruction
        });

        const iter = resp?.stream ?? resp;

        let full = "";
        for await (const chunk of iter) {
            const piece =
                (typeof chunk?.text === "string" && chunk.text) ||
                (typeof chunk?.delta === "string" && chunk.delta) ||
                "";
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
            plan.used ? { tool: plan.toolName, args: plan.toolArgs } : null
        );
    } catch (err) {
        console.error("[chat.stream] error:", err?.name, err?.message);
        try {
            sseWrite(res, "error", {
                message: "Đã xảy ra lỗi khi sinh phản hồi.",
                code: err?.name || "GENAI_ERROR",
            });
            res.end();
        } catch (_) { }
    }
}

module.exports = { startConversation, saveMessage, streamGemini };
