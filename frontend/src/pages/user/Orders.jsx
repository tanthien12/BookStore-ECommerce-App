// src/pages/user/Orders.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import summaryApi from "../../common";

const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');
const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};
const money = v => (Number(v) || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const STATUS = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function Orders() {
    const [items, setItems] = useState([]); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
    const [limit, setLimit] = useState(10); const [total, setTotal] = useState(0); const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null); // {order, items}

    const fetchList = async (p = page, l = limit, s = status) => {
        try {
            setLoading(true);
            const url = new URL(summaryApi.url(summaryApi.ordersMe.list));
            url.searchParams.set('page', p); url.searchParams.set('limit', l); if (s) url.searchParams.set('status', s);
            const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Không tải được đơn hàng');
            setItems(data.items || []); setPage(data.page || p); setPages(data.pages || 1); setTotal(data.total || 0); setLimit(Number(l));
        } catch (e) { toast.error(e.message || 'Lỗi tải đơn'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchList(1, limit, status); }, [limit, status]); // eslint-disable-line

    const openDetail = async (id) => {
        try {
            const res = await fetch(summaryApi.url(summaryApi.ordersMe.detail(id)), { headers: { ...authHeaders() } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Không lấy được chi tiết đơn');
            setDetail(data);
        } catch (e) { toast.error(e.message || 'Lỗi chi tiết đơn'); }
    };
    const cancelOrder = async (id) => {
        if (!window.confirm('Bạn chắc chắn muốn hủy đơn này?')) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.ordersMe.cancel(id)), { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Không thể hủy');
            toast.success('Đã hủy đơn');
            fetchList(page, limit, status);
            setDetail(null);
        } catch (e) { toast.error(e.message || 'Lỗi hủy đơn'); }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">Đơn hàng của tôi</h2>
                <div className="flex items-center gap-2">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border-gray-300 text-sm">
                        <option value="">Tất cả trạng thái</option>
                        {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="rounded-lg border-gray-300 text-sm">
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n}/trang</option>)}
                    </select>
                </div>
            </div>

            {loading ? <div className="text-sm text-gray-600">Đang tải…</div> :
                !items.length ? <div className="text-sm text-gray-600">Chưa có đơn hàng.</div> :
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-2 text-left">Mã đơn</th>
                                        <th className="p-2">Trạng thái</th>
                                        <th className="p-2 text-right">Tổng tiền</th>
                                        <th className="p-2 text-left">Ngày đặt</th>
                                        <th className="p-2 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(o => (
                                        <tr key={o.id} className="border-t">
                                            <td className="p-2">#{o.id.slice(0, 8)}</td>
                                            <td className="p-2 text-center capitalize">{o.status}</td>
                                            <td className="p-2 text-right">{money(o.grand_total)}</td>
                                            <td className="p-2">{o.placed_at ? new Date(o.placed_at).toLocaleString() : ''}</td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => openDetail(o.id)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 mr-2">Chi tiết</button>
                                                {['pending', 'processing'].includes(o.status) && (
                                                    <button onClick={() => cancelOrder(o.id)} className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Hủy đơn</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paging */}
                        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                            <div>Tổng: {total} · Trang {page}/{pages}</div>
                            <div className="space-x-2">
                                <button className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-50" onClick={() => fetchList(Math.max(1, page - 1), limit, status)} disabled={page <= 1}>Trước</button>
                                <button className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-50" onClick={() => fetchList(Math.min(pages, page + 1), limit, status)} disabled={page >= pages}>Sau</button>
                            </div>
                        </div>
                    </>}

            {/* Modal chi tiết */}
            {detail && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Đơn #{detail.order.id.slice(0, 8)}</h3>
                            <button onClick={() => setDetail(null)} className="px-3 py-1 rounded-lg border hover:bg-gray-50">Đóng</button>
                        </div>
                        <div className="text-sm text-gray-700 mb-3">Trạng thái: <b className="capitalize">{detail.order.status}</b> · Tổng: <b>{money(detail.order.grand_total)}</b></div>
                        <div className="max-h-72 overflow-auto">
                            {detail.items?.map(it => (
                                <div key={it.book_id} className="flex items-center gap-3 py-2 border-b">
                                    <img src={it.image_url} alt="" className="w-12 h-16 object-contain" />
                                    <div className="flex-1">
                                        <div className="font-medium">{it.title}</div>
                                        <div className="text-sm text-gray-600">SL: {it.quantity} × {money(it.price_snapshot)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {['pending', 'processing'].includes(detail.order.status) && (
                            <div className="pt-3 text-right">
                                <button onClick={() => cancelOrder(detail.order.id)} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Hủy đơn này</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
