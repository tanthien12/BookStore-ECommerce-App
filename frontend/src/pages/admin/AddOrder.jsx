import React from "react";
import { useNavigate } from "react-router-dom";
import OrderForm from "../../components/admin/OrderForm";
import summaryApi from "../../common";

export default function AddOrder() {
    const nav = useNavigate();

    const handleSubmit = async (payload) => {
        const res = await fetch(summaryApi.url(summaryApi.order.create), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) { alert("Tạo đơn thất bại"); return; }
        nav("/admin/orders");
    };

    return <OrderForm mode="create" onSubmit={handleSubmit} />;
}
