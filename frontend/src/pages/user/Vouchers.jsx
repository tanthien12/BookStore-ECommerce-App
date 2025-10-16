// src/pages/user/Vouchers.jsx
import React, { useEffect, useState } from "react";
import summaryApi from "../../common";
import { toast } from "react-toastify";

const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');
const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};

export default function Vouchers() {
    const [available, setAvailable] = useState([]);
    const [used, setUsed] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const [a, u] = await Promise.all([
                    fetch(summaryApi.url(summaryApi.voucher.available), { headers: { ...authHeaders() } }),
                    fetch(summaryApi.url(summaryApi.voucher.used), { headers: { ...authHeaders() } }),
                ]);
                const da = await a.json().catch(() => ({})); const du = await u.json().catch(() => ({}));
                if (!a.ok || !da?.success) throw new Error(da?.message || 'Lỗi voucher khả dụng');
                if (!u.ok || !du?.success) throw new Error(du?.message || 'Lỗi voucher đã dùng');
                setAvailable(da.items || []); setUsed(du.items || []);
            } catch (e) { toast.error(e.message || 'Lỗi tải voucher'); }
        })();
    }, []);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold mb-3">Voucher khả dụng</h2>
                {!available.length ? <div className="text-sm text-gray-600">Không có voucher phù hợp.</div> :
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {available.map(v => (
                            <div key={v.id} className="rounded-xl border border-dashed border-red-300 p-3">
                                <div className="font-bold text-red-600">{v.code}</div>
                                <div className="text-sm text-gray-700">{v.description || ''}</div>
                                <div className="text-xs text-gray-500 mt-1">Hiệu lực: {v.start_date ? new Date(v.start_date).toLocaleDateString() : '—'} → {v.end_date ? new Date(v.end_date).toLocaleDateString() : '—'}</div>
                            </div>
                        ))}
                    </div>}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold mb-3">Voucher đã dùng</h2>
                {!used.length ? <div className="text-sm text-gray-600">Chưa dùng voucher nào.</div> :
                    <div className="space-y-2">
                        {used.map(v => (
                            <div key={v.order_id} className="rounded-xl border p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">{v.code}</div>
                                    <div className="text-sm text-gray-600">{v.description || ''}</div>
                                </div>
                                <div className="text-sm text-gray-500">{new Date(v.used_at).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>}
            </div>
        </div>
    );
}
