// src/api/cartApi.js
const BASE_URL = import.meta.env.VITE_API_URL;

const token = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const cartApi = {
  async getCart() {
    const res = await fetch(`${BASE_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    });
    return res.json();
  },

  async addItem(bookId, quantity = 1) {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ book_id: bookId, quantity }),
    });
    return res.json();
  },

  async updateItem(cartItemId, quantity) {
    const res = await fetch(`${BASE_URL}/cart/${cartItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  },

  async removeItem(cartItemId) {
    const res = await fetch(`${BASE_URL}/cart/${cartItemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    });
    return res.json();
  },

  async clearCart() {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    });
    return res.json();
  },
};

export default cartApi;
