import React, { useState } from "react";
import { MdSave, MdDelete } from "react-icons/md";

export default function OrderForm({ mode = "create", initialValues = {}, onSubmit }) {
    const [userId, setUserId] = useState(initialValues.user_id || "");
    const [status, setStatus] = useState(initialValues.status || "Pending");
    const [items, setItems] = useState(initialValues.items || []);
    const [total, setTotal] = useState(initialValues.total_amount || 0);

    const addItem = () => {
        setItems([...items, { book_id: "", quantity: 1, price: 0 }]);
    };
    const updateItem = (idx, field, value) => {
        const next = items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
        setItems(next);
        const sum = next.reduce((s, it) => s + (+it.quantity * +it.price), 0);
        setTotal(sum);
    };
    const removeItem = (idx) => {
        const next = items.filter((_, i) => i !== idx);
        setItems(next);
        const sum = next.reduce((s, it) => s + (+it.quantity * +it.price), 0);
        setTotal(sum);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.({ user_id: userId, status, total_amount: total, items });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white p-4 rounded-xl border shadow">
                <h2 className="text-lg font-semibold mb-3">
                    {mode === "edit" ? "Sửa đơn hàng" : "Tạo đơn hàng"}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">User ID *</label>
                        <input
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full border px-3 py-2 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Trạng thái *</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}
                            className="w-full border px-3 py-2 rounded-lg">
                            <option>Pending</option>
                            <option>Processing</option>
                            <option>Shipped</option>
                            <option>Completed</option>
                            <option>Canceled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Items</label>
                        <div className="space-y-3">
                            {items.map((it, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input
                                        placeholder="Book ID"
                                        value={it.book_id}
                                        onChange={(e) => updateItem(idx, "book_id", e.target.value)}
                                        className="flex-1 border px-2 py-1 rounded"
                                    />
                                    <input type="number" min={1}
                                        value={it.quantity}
                                        onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                                        className="w-20 border px-2 py-1 rounded"
                                    />
                                    <input type="number" min={0}
                                        value={it.price}
                                        onChange={(e) => updateItem(idx, "price", +e.target.value)}
                                        className="w-28 border px-2 py-1 rounded"
                                    />
                                    <button type="button" onClick={() => removeItem(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded">
                                        <MdDelete />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addItem}
                                className="px-3 py-1 bg-blue-100 rounded">+ Thêm item</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Tổng cộng</label>
                        <div className="font-semibold">{total.toLocaleString("vi-VN")} đ</div>
                    </div>
                </div>
            </div>

            <button type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                <MdSave /> {mode === "edit" ? "Cập nhật" : "Lưu đơn"}
            </button>
        </form>
    );
}
