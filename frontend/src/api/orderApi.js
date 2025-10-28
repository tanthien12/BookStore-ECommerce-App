// src/api/orderApi.js
// ✨ Giả lập API order để frontend hoạt động được mà không cần backend thật.

export const orderApi = {
    /**
     * Mô phỏng tạo đơn hàng.
     * @param {Object} payload - Dữ liệu đơn hàng gồm { order, items }
     * @returns {Promise<Object>} - Promise trả về mô phỏng phản hồi từ server
     */
    create: async (payload) => {
        console.log("🧾 Simulated API: create order", payload);

        // Giả lập độ trễ API (500ms)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Lưu tạm vào localStorage để trang success đọc
        try {
            localStorage.setItem("order_draft", JSON.stringify(payload));
        } catch (e) {
            console.error("Failed to save draft:", e);
        }

        // Trả phản hồi giả lập
        return {
            message: "Order created (simulated)",
            orderId: Math.floor(Math.random() * 100000),
            success: true,
        };
    },

    // (Tuỳ chọn) hàm list() giả lập — nếu bạn muốn hiển thị danh sách đơn hàng
    list: async () => {
        const data = JSON.parse(localStorage.getItem("order_draft") || "null");
        return data ? [data] : [];
    },
};