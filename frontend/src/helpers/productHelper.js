// src/helpers/productHelper.js

// Tính % giảm giá an toàn
export const computeDiscount = (p = {}) => {
    const price = Number(p.price ?? 0);
    const oldPrice = Number(p.oldPrice ?? 0);
    if (!oldPrice || !price || oldPrice <= price) return 0;
    const d = Math.round(((oldPrice - price) / oldPrice) * 100);
    return Number.isFinite(d) ? Math.max(0, d) : 0;
};

// Gom nhóm trend cho 3 tab: ngày/hot/ngoại văn
export const pickTrendingGroups = (all = []) => {
    const list = Array.isArray(all) ? all : [];

    const day = [...list]
        .filter(p => p.oldPrice && p.price && p.price < p.oldPrice)
        .sort((a, b) => computeDiscount(b) - computeDiscount(a))
        .slice(0, 10);

    const hot = [...list]
        .filter(p => {
            const badge = String(p.badge || "").toUpperCase();
            return ["FLASH SALE", "SALE", "HOT", "NEW"].includes(badge) ||
                (p.oldPrice && p.price < p.oldPrice);
        })
        .slice(0, 10);

    const foreign = [...list]
        .filter(p => {
            const c = String(p.category || "").toLowerCase();
            return c.includes("tiếng anh") || c.includes("english")
                || c.includes("foreign") || c.includes("ngoại ngữ");
        })
        .slice(0, 10);

    return { day, hot, foreign };

};
export const money = (value) => {
    const v = Number(value);
    if (isNaN(v)) return "0 đ";       // nếu không phải số
    return v.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,       // không hiện .00
        maximumFractionDigits: 0
    });
};