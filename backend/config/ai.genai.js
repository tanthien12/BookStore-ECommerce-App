// // backend/config/ai.genai.js
// // SDK mới: @google/genai (YÊU CẦU Node >= 20)
// const { GoogleGenAI } = require("@google/genai");

// const { GOOGLE_API_KEY, GEMINI_MODEL } = process.env;
// if (!GOOGLE_API_KEY) {
//     console.warn("[ai.genai] Missing GOOGLE_API_KEY in env");
// }

// // ✅ Constructor nhận { apiKey }
// const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// const MODEL = GEMINI_MODEL || "gemini-2.0-flash-001"; // đặt mặc định hợp lý

// module.exports = { ai, MODEL };

// backend/config/ai.genai.js
// SDK mới: @google/genai (Node >= 20)
const { GoogleGenAI } = require("@google/genai");

const { GOOGLE_API_KEY } = process.env;
if (!GOOGLE_API_KEY) {
    console.warn("[ai.genai] Missing GOOGLE_API_KEY in env");
}

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// Danh sách model "an toàn" cho Studio Free
const SAFE_MODELS = [
    "gemini-2.0-flash-001",
    "gemini-2.0-flash", // fallback phụ
];

/** Chuẩn hoá tên model từ env (map các tên cũ/không hỗ trợ) */
function normalizeModelName(name) {
    if (!name) return SAFE_MODELS[0];
    const n = String(name).trim();

    // Map các alias phổ biến không còn hỗ trợ ở v1beta
    if (n === "gemini-1.5-flash" || n === "gemini-1.5-flash-latest") {
        return "gemini-2.0-flash-001";
    }
    if (n === "gemini-1.5-pro") {
        // Với Studio Free thường không khả dụng -> map sang flash
        return "gemini-2.0-flash-001";
    }
    return n;
}

/** Lấy tên model đang dùng (đã normalize) */
function getModelName() {
    return normalizeModelName(process.env.GEMINI_MODEL);
}

module.exports = { ai, getModelName, SAFE_MODELS };

