// src/api/orderApi.js
// ✅ Gọi API thật đến backend Node.js để lưu đơn hàng vào PostgreSQL

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const orderApi = {
  /**
   * Tạo đơn hàng thật trên backend
   * @param {Object} payload - dữ liệu đơn hàng gồm user_id, items[], shipping_address, ...
   * @returns {Promise<Object>} - phản hồi từ backend
   */
  create: async (payload) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Lỗi khi tạo đơn hàng");
      }

      // ✅ Lưu tạm order_draft để trang success đọc
      localStorage.setItem(
        "order_draft",
        JSON.stringify({
          orderId: data?.data?.id,
          ...payload,
        })
      );

      return data;
    } catch (err) {
      console.error("❌ orderApi.create error:", err);
      throw err;
    }
  },

  /**
   * Lấy danh sách đơn hàng (nếu bạn cần hiển thị ở trang quản lý)
   */
  list: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders`);
      const data = await res.json();
      return data?.data || [];
    } catch (err) {
      console.error("❌ orderApi.list error:", err);
      return [];
    }
  },
};
