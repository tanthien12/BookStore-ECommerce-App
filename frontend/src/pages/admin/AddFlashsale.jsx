// src/pages/admin/AddFlashsale.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FlashsaleForm from "../../components/admin/FlashsaleForm";
import summaryApi from "../../common";
import { toast } from "react-toastify";

export default function AddFlashsale() {
    const nav = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCreate = async (payload) => {
        // (payload là JSON: { name, start_time, end_time, is_active })
        try {
            setLoading(true);
            
            if (new Date(payload.end_time) <= new Date(payload.start_time)) {
                throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
            }
            
            const res = await fetch(summaryApi.url(summaryApi.flashsale.create), { // POST /api/flashsales
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const newCampaignData = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(newCampaignData?.message || `Tạo chiến dịch thất bại (${res.status})`);
            }

            toast.success("Đã tạo chiến dịch. Giờ hãy thêm sản phẩm.");

            // ⬇️ BẮT ĐẦU THAY ĐỔI ⬇️
            // Lấy ID của chiến dịch vừa tạo
            const newId = newCampaignData?.data?.id;

            if (newId) {
                // Chuyển thẳng đến trang "Edit" để thêm sản phẩm
                nav(`/admin/flashsales-edit/${newId}`);
            } else {
                // Fallback: Nếu không lấy được ID, quay về trang danh sách
                nav("/admin/flashsales");
            }
            // ⬆️ KẾT THÚC THAY ĐỔI ⬆️
            
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Lỗi tạo chiến dịch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-bold">Tạo chiến dịch Flash Sale mới</h1>
            <FlashsaleForm
                mode="create"
                onSubmit={handleCreate}
                loading={loading}
            />
        </div>
    );
}