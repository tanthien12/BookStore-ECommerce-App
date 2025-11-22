import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";
import VoucherForm from "../../components/admin/VoucherForm";

export default function AddVoucher() {
    const nav = useNavigate();
    const [saving, setSaving] = useState(false);

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
            const url = summaryApi.url(summaryApi.coupon.create);
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.message || "Tạo coupon thất bại");
            toast.success("Tạo coupon mới thành công");
            nav("/admin/vouchers");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold">Thêm ưu đãi</h1>
            <div className="bg-white rounded-xl shadow p-4">
                <VoucherForm
                    submitting={saving}
                    onSubmit={onSubmit}
                    onCancel={() => nav("/admin/vouchers")}
                />
            </div>
        </div>
    );
}
