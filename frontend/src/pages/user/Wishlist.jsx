// src/pages/user/Wishlist.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import summaryApi from "../../common";
import { Link } from "react-router-dom";

const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');
const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};
const money = v => (Number(v) || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function Wishlist() {
    const [items, setItems] = useState([]);
    const load = async () => {
        try {
            const res = await fetch(summaryApi.url(summaryApi.wishlist.list), { headers: { ...authHeaders() } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Không tải được wishlist');
            setItems(data.items || []);
        } catch (e) { toast.error(e.message || 'Lỗi'); }
    };
    useEffect(() => { load(); }, []);

    const remove = async (bookId) => {
        try {
            const res = await fetch(summaryApi.url(summaryApi.wishlist.remove(bookId)), { method: 'DELETE', headers: { ...authHeaders() } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Xóa thất bại');
            setItems(items.filter(x => x.book_id !== bookId));
        } catch (e) { toast.error(e.message || 'Lỗi'); }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold mb-3">Sách yêu thích</h2>
            {!items.length ? <div className="text-sm text-gray-600">Chưa có mục yêu thích.</div> :
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {items.map(p => (
                        <div key={p.book_id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <Link to={`/product/${p.book_id}`}><img src={p.image_url} alt={p.title} className="w-full h-48 object-contain p-3" /></Link>
                            <div className="px-3 pb-3">
                                <Link to={`/product/${p.book_id}`} className="block text-sm font-medium line-clamp-2">{p.title}</Link>
                                <div className="mt-1 text-red-600 font-bold">{money(p.price)}</div>
                                <div className="mt-2 flex gap-2">
                                    <Link to={`/product/${p.book_id}`} className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm">Xem</Link>
                                    <button onClick={() => remove(p.book_id)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm">Xóa</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>}
        </div>
    );
}
