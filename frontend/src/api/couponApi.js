// frontend/src/api/couponApi.js

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

// 👉 Helper lấy token + headers Authorization
function getAuthHeaders(extraHeaders = {}) {
    // Tùy dự án, bạn sửa lại key nếu khác
    const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");

    const headers = { ...extraHeaders };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse(res) {
    const contentType = res.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        data = await res.json();
    } else {
        const text = await res.text();
        console.error("Non-JSON response:", text.slice(0, 200));
        throw new Error("Server trả về dữ liệu không đúng định dạng JSON.");
    }

    if (!res.ok || data.ok === false) {
        const msg = data.message || "Có lỗi xảy ra";
        throw new Error(msg);
    }
    return data.data || data;
}

export async function fetchAdminCoupons({ search, status } = {}) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    const url = `${API_BASE_URL}/admin/coupons${params.toString() ? `?${params}` : ""}`;

    const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),   // 👈 gửi kèm Authorization
        credentials: "include",
    });

    return handleResponse(res);
}

export async function createAdminCoupon(payload) {
    const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}

export async function updateAdminCoupon(id, payload) {
    const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}

export async function deleteAdminCoupon(id) {
    const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
    });
    await handleResponse(res);
    return true;
}
