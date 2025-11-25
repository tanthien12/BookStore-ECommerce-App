import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";
import VoucherForm from "../../components/admin/VoucherForm";

export default function EditVoucher() {
    const { id } = useParams();
    const nav = useNavigate();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            try {
                const url = summaryApi.url(summaryApi.coupon.detail(id));
                const res = await fetch(url, {
                    headers: { ...authHeaders() },
                    credentials: "include",
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.ok === false) throw new Error(data.message || "Không tải được ưu đãi");
                if (!canceled) setDetail(data.data);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Có lỗi xảy ra");
            } finally {
                if (!canceled) setLoading(false);
            }
        })();
        return () => { canceled = true; };
    }, [id]);

    const onSubmit = async (form) => {
        if (!form.code.trim()) return toast.warning("Mã coupon không được để trống");
        if (!form.value) return toast.warning("Giá trị giảm không được để trống");

        const payload = {
            ...form,
            value: Number(form.value),
            min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
            max_discount: form.type === "percent" ? (form.max_discount ? Number(form.max_discount) : 0) : 0,
            usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
        };

        setSaving(true);
        try {
            const url = summaryApi.url(summaryApi.coupon.update(id));
            const res = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.message || "Cập nhật coupon thất bại");
            toast.success("Cập nhật coupon thành công");
            nav("/admin/vouchers");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Đang tải…</div>;
    if (!detail) return <div className="p-4">Không tìm thấy ưu đãi</div>;

    // Map dữ liệu trả về -> defaultValue của Form
    const defaultValue = {
        code: detail.code || "",
        description: detail.description || "",
        type: detail.type || "percent",
        value: detail.value ?? "",
        min_order_value: detail.min_order_value ?? "",
        max_discount: detail.max_discount ?? "",
        usage_limit: detail.usage_limit ?? "",
        start_date: detail.start_date ? toInput(detail.start_date) : "",
        end_date: detail.end_date ? toInput(detail.end_date) : "",
        is_active: !!detail.is_active,
    };

    function toInput(iso) {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        // datetime-local expects "yyyy-MM-ddTHH:mm"
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold">Sửa ưu đãi</h1>
            <div className="bg-white rounded-xl shadow p-4">
                <VoucherForm defaultValue={defaultValue} submitting={saving} onSubmit={onSubmit} onCancel={() => nav("/admin/vouchers")} />
            </div>
        </div>
    );
}
