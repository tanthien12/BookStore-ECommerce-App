// src/pages/user/Security.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import summaryApi from "../../common";

const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');
const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};

export default function Security() {
    const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [re, setRe] = useState(""); const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!cur || !nw) return toast.error('Nhập đủ mật khẩu');
        if (nw.length < 6) return toast.error('Mật khẩu mới tối thiểu 6 ký tự');
        if (nw !== re) return toast.error('Xác nhận mật khẩu không khớp');
        try {
            setLoading(true);
            const res = await fetch(summaryApi.url(summaryApi.account.changePassword), {
                method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ currentPassword: cur, newPassword: nw })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Cập nhật thất bại');
            setCur(""); setNw(""); setRe(""); toast.success('Đổi mật khẩu thành công');
        } catch (e) { toast.error(e.message || 'Lỗi đổi mật khẩu'); }
        finally { setLoading(false); }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold mb-3">Cài đặt bảo mật</h2>
            <form onSubmit={onSubmit} className="space-y-3 max-w-md">
                <div>
                    <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
                    <input type="password" value={cur} onChange={e => setCur(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                    <input type="password" value={nw} onChange={e => setNw(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                    <input type="password" value={re} onChange={e => setRe(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
                </div>
                <button disabled={loading} className="rounded-xl bg-red-600 px-5 py-2.5 text-white">{loading ? 'Đang cập nhật…' : 'Cập nhật'}</button>
            </form>
        </div>
    );
}
