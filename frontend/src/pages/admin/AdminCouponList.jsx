// frontend/src/pages/admin/AdminCouponList.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";

const emptyForm = {
    code: "",
    description: "",
    type: "percent",
    value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true,
};

function AdminCouponList() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ====== Helpers gọi API qua summaryApi ======

    const loadCoupons = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);

            const baseUrl = summaryApi.url(summaryApi.coupon.list);
            const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    ...authHeaders(),
                },
                credentials: "include",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data.ok === false) {
                throw new Error(data.message || "Không tải được danh sách coupon");
            }

            setCoupons(data.data || []);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Không tải được danh sách coupon");
        } finally {
            setLoading(false);
        }
    };

    const createCoupon = async (payload) => {
        const url = summaryApi.url(summaryApi.coupon.create);
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
            throw new Error(data.message || "Tạo coupon thất bại");
        }
        return data.data;
    };

    const updateCoupon = async (id, payload) => {
        const url = summaryApi.url(summaryApi.coupon.update(id));
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
            throw new Error(data.message || "Cập nhật coupon thất bại");
        }
        return data.data;
    };

    const deleteCouponApi = async (id) => {
        const url = summaryApi.url(summaryApi.coupon.delete(id));
        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                ...authHeaders(),
            },
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
            throw new Error(data.message || "Xoá coupon thất bại");
        }
        return true;
    };

    // ====== Lifecycle ======

    useEffect(() => {
        loadCoupons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ====== Handlers ======

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleEdit = (coupon) => {
        setEditingId(coupon.id);
        setForm({
            code: coupon.code || "",
            description: coupon.description || "",
            type: coupon.type || "percent",
            value: coupon.value ?? "",
            min_order_value: coupon.min_order_value ?? "",
            max_discount: coupon.max_discount ?? "",
            usage_limit: coupon.usage_limit ?? "",
            start_date: coupon.start_date
                ? new Date(coupon.start_date).toISOString().slice(0, 16)
                : "",
            end_date: coupon.end_date
                ? new Date(coupon.end_date).toISOString().slice(0, 16)
                : "",
            is_active: coupon.is_active,
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.code.trim()) {
            toast.warning("Mã coupon không được để trống");
            return;
        }
        if (!form.value) {
            toast.warning("Giá trị giảm không được để trống");
            return;
        }

        const payload = {
            ...form,
            value: Number(form.value),
            min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
            max_discount: form.max_discount ? Number(form.max_discount) : 0,
            usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
        };

        try {
            setSubmitting(true);
            if (editingId) {
                await updateCoupon(editingId, payload);
                toast.success("Cập nhật coupon thành công");
            } else {
                await createCoupon(payload);
                toast.success("Tạo coupon mới thành công");
            }
            resetForm();
            await loadCoupons();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Lưu coupon thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xoá coupon này?")) return;
        try {
            await deleteCouponApi(id);
            toast.success("Đã xoá coupon");
            await loadCoupons();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Xoá coupon thất bại");
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await loadCoupons();
    };

    const now = new Date();

    const computeStatusBadge = (c) => {
        const start = c.start_date ? new Date(c.start_date) : null;
        const end = c.end_date ? new Date(c.end_date) : null;
        const outOfUsage =
            c.usage_limit !== null &&
            c.usage_limit !== undefined &&
            c.times_used >= c.usage_limit;

        if (!c.is_active)
            return (
                <span className="px-2 py-1 text-xs rounded bg-gray-200">Inactive</span>
            );
        if (outOfUsage)
            return (
                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                    Hết lượt
                </span>
            );
        if (end && end < now)
            return (
                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                    Expired
                </span>
            );
        if (start && start > now)
            return (
                <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                    Upcoming
                </span>
            );
        return (
            <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">
                Active
            </span>
        );
    };

    // ====== Render ======

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Quản lý mã giảm giá</h1>
            </div>

            {/* Form tạo / sửa */}
            <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold mb-3">
                    {editingId ? "Chỉnh sửa coupon" : "Tạo coupon mới"}
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Mã coupon *
                        </label>
                        <input
                            name="code"
                            value={form.code}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    code: e.target.value.toUpperCase(),
                                }))
                            }
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="VD: BOOK10"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Loại giảm</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="percent">Phần trăm (%)</option>
                            <option value="fixed">Số tiền cố định</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Giá trị giảm {form.type === "percent" ? "(%)" : "(VNĐ)"} *
                        </label>
                        <input
                            type="number"
                            name="value"
                            value={form.value}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Đơn tối thiểu (VNĐ)
                        </label>
                        <input
                            type="number"
                            name="min_order_value"
                            value={form.min_order_value}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                            min="0"
                        />
                    </div>

                    {form.type === "percent" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Giảm tối đa (VNĐ)
                            </label>
                            <input
                                type="number"
                                name="max_discount"
                                value={form.max_discount}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 text-sm"
                                min="0"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Tổng lượt sử dụng (để trống nếu không giới hạn)
                        </label>
                        <input
                            type="number"
                            name="usage_limit"
                            value={form.usage_limit}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ngày bắt đầu
                        </label>
                        <input
                            type="datetime-local"
                            name="start_date"
                            value={form.start_date}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ngày kết thúc
                        </label>
                        <input
                            type="datetime-local"
                            name="end_date"
                            value={form.end_date}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Mô tả ngắn để admin dễ nhớ mục đích coupon"
                        />
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleInputChange}
                            />
                            <span>Kích hoạt</span>
                        </label>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm text-gray-600 underline"
                            >
                                Thêm mới coupon khác
                            </button>
                        )}

                        <div className="flex-1" />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium disabled:opacity-60"
                        >
                            {submitting
                                ? "Đang lưu..."
                                : editingId
                                    ? "Cập nhật"
                                    : "Tạo mới"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Bộ lọc + bảng */}
            <div className="bg-white rounded-xl shadow p-4">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col md:flex-row gap-3 mb-4 items-stretch md:items-center"
                >
                    <input
                        className="border rounded px-3 py-2 text-sm flex-1"
                        placeholder="Tìm theo mã hoặc mô tả..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="border rounded px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang kích hoạt</option>
                        <option value="inactive">Đã tắt</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium"
                    >
                        Lọc
                    </button>
                </form>

                {loading ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                        Đang tải danh sách coupon...
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                        Chưa có coupon nào.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2">Mã</th>
                                    <th className="text-left py-2 px-2">Loại</th>
                                    <th className="text-right py-2 px-2">Giá trị</th>
                                    <th className="text-right py-2 px-2">Min đơn</th>
                                    <th className="text-right py-2 px-2">
                                        Đã dùng / Giới hạn
                                    </th>
                                    <th className="text-left py-2 px-2">Thời gian</th>
                                    <th className="text-left py-2 px-2">Trạng thái</th>
                                    <th className="text-right py-2 px-2">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0">
                                        <td className="py-2 px-2 font-semibold">{c.code}</td>
                                        <td className="py-2 px-2">
                                            {c.type === "percent" ? "Phần trăm" : "Cố định"}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {c.type === "percent"
                                                ? `${c.value}%`
                                                : `${Number(c.value || 0).toLocaleString(
                                                    "vi-VN"
                                                )}₫`}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {Number(c.min_order_value || 0).toLocaleString(
                                                "vi-VN"
                                            )}
                                            ₫
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {c.times_used}/{c.usage_limit ?? "∞"}
                                        </td>
                                        <td className="py-2 px-2 text-left">
                                            <div className="flex flex-col text-xs text-gray-600">
                                                {c.start_date && (
                                                    <span>
                                                        Bắt đầu:{" "}
                                                        {new Date(
                                                            c.start_date
                                                        ).toLocaleString("vi-VN")}
                                                    </span>
                                                )}
                                                {c.end_date && (
                                                    <span>
                                                        Kết thúc:{" "}
                                                        {new Date(
                                                            c.end_date
                                                        ).toLocaleString("vi-VN")}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-2">
                                            {computeStatusBadge(c)}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="text-blue-600 text-xs mr-3"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="text-red-600 text-xs"
                                            >
                                                Xoá
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminCouponList;
