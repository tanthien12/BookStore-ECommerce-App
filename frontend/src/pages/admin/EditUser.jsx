import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import UserForm from "../../components/admin/UserForm";
import summaryApi from "../../common";

const getAccessToken = () => {
    let t = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!t) return null;
    try {
        const parsed = JSON.parse(t);
        if (typeof parsed === "string") t = parsed;
    } catch { }
    t = String(t).trim();
    if (!t || t === "null" || t === "undefined") return null;
    return t;
};
const authHeaders = () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function EditUser() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const url = summaryApi.url(summaryApi.user.detail(id));
                const res = await fetch(url, {
                    headers: { Accept: "application/json", ...authHeaders() },
                });
                if (res.status === 401) {
                    toast.error("401: Chưa đăng nhập hoặc không có quyền.");
                    setLoading(false);
                    return;
                }
                const d = await res.json();
                if (d?.success && !ignore) setData(d.data);
            } catch (e) {
                console.error(e);
                toast.error("Không tải được dữ liệu người dùng");
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    if (loading) return <div className="p-4">Đang tải…</div>;
    if (!data) return <div className="p-4 text-slate-600">Không tìm thấy người dùng</div>;

    return <UserForm mode="edit" initialValues={data} />;
}
