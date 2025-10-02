import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MdArrowBack, MdEdit, MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi from "../../common";

const toVND = (n) =>
    (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const dateVN = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "-";
    }
};

const STATUS_BADGE = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Processing: "bg-blue-100 text-blue-700 border-blue-200",
    Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Canceled: "bg-red-100 text-red-700 border-red-200",
};

export default function OrderDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(summaryApi.url(summaryApi.order.detail(id)));
                if (!res.ok) throw new Error("Fetch order failed");
                const json = await res.json();
                if (!ignore) setOrder(json.data);
            } catch (err) {
                console.error(err);
                toast.error("Không tải được chi tiết đơn hàng");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Xóa thất bại");
            toast.success("Đã xóa đơn hàng");
            nav("/admin/orders");
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi khi xóa đơn hàng");
        }
    };

    if (loading) return <div className="p-4">Đang tải...</div>;
    if (!order) return <div className="p-4">Không tìm thấy đơn hàng</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
                <div className="flex items-center gap-2">
                    <Link
                        to={`/admin/orders/${id}/edit`}
                        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
                    >
                        <MdEdit /> Sửa
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-red-600 flex items-center gap-1"
                    >
                        <MdDelete /> Xóa
                    </button>
                    <Link
                        to="/admin/orders"
                        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
                    >
                        <MdArrowBack /> Quay lại
                    </Link>
                </div>
            </div>

            {/* Order Info */}
            <div className="bg-white rounded-xl border shadow p-4 space-y-4">
                <div className="flex justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Mã đơn hàng</div>
                        <div className="font-semibold">{order.id}</div>
                    </div>
                    <div>
                        <span
                            className={`px-2 py-1 rounded-full border text-sm ${STATUS_BADGE[order.status] || ""}`}
                        >
                            {order.status}
                        </span>
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Khách hàng</div>
                    <div className="font-semibold">{order.customer_name}</div>
                    <div className="text-sm text-gray-600">{order.customer_email}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Ngày tạo</div>
                    <div>{dateVN(order.created_at)}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Tổng tiền</div>
                    <div className="font-bold text-lg text-emerald-600">{toVND(order.total_amount)}</div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Danh sách sản phẩm</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Sách</th>
                                <th className="p-3 text-left">Số lượng</th>
                                <th className="p-3 text-left">Đơn giá</th>
                                <th className="p-3 text-left">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((it) => (
                                    <tr key={it.id}>
                                        <td className="p-3">{it.title}</td>
                                        <td className="p-3">{it.quantity}</td>
                                        <td className="p-3">{toVND(it.price)}</td>
                                        <td className="p-3 font-medium">{toVND(it.price * it.quantity)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                        Không có sản phẩm nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
