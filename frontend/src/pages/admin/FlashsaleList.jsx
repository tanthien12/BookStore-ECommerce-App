// src/pages/admin/FlashsaleList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi from "../../common";

// Helper
const dateVN = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return "-"; }
};

const statusLabel = (startTime, endTime, isActive) => {
    if (!isActive) return { text: "Tạm ẩn", color: "text-gray-500 bg-gray-100" };
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (now < start) return { text: "Sắp diễn ra", color: "text-blue-600 bg-blue-100" };
    if (now > end) return { text: "Đã kết thúc", color: "text-red-600 bg-red-100" };
    return { text: "Đang diễn ra", color: "text-emerald-600 bg-emerald-100" };
};

export default function FlashsaleList() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const url = summaryApi.url(summaryApi.flashsale.list); // GET /api/flashsales
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const data = await res.json();
            
            setItems(Array.isArray(data.data) ? data.data : []);
            setTotal(data.total || data.data?.length || 0);
        } catch (e) {
            toast.error(e.message || "Không tải được danh sách");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xóa chiến dịch này? Mọi sản phẩm sale kèm theo cũng sẽ bị xóa (ON DELETE CASCADE).")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.flashsale.delete(id)), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Xóa thất bại");
            toast.success("Đã xóa chiến dịch");
            fetchCampaigns(); // Tải lại danh sách
        } catch (e) {
            toast.error(e.message);
        }
    };
    
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Quản lý Flash Sale</h1>
                <Link
                    to="/admin/flashsales-add"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                    <MdAdd /> Tạo chiến dịch mới
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Tên chiến dịch</th>
                                <th className="p-3 text-left">Trạng thái</th>
                                <th className="p-3 text-left">Bắt đầu</th>
                                <th className="p-3 text-left">Kết thúc</th>
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có chiến dịch nào.</td></tr>
                            ) : (
                                items.map((c) => {
                                    const status = statusLabel(c.start_time, c.end_time, c.is_active);
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{c.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="p-3">{dateVN(c.start_time)}</td>
                                            <td className="p-3">{dateVN(c.end_time)}</td>
                                            <td className="p-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/flashsales-edit/${c.id}`}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa và thêm sản phẩm"
                                                    >
                                                        <MdEdit />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(c.id)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
                                                        title="Xóa"
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}