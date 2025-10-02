import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderForm from "../../components/admin/OrderForm";
import summaryApi from "../../common";

export default function EditOrder() {
    const { id } = useParams();
    const nav = useNavigate();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(summaryApi.url(summaryApi.order.detail(id)));
            if (res.ok) {
                const j = await res.json();
                setOrder(j.data);
            }
        })();
    }, [id]);

    const handleSubmit = async (payload) => {
        const res = await fetch(summaryApi.url(summaryApi.order.update(id)), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) { alert("Cập nhật thất bại"); return; }
        nav("/admin/orders");
    };

    if (!order) return <div>Đang tải...</div>;
    return <OrderForm mode="edit" initialValues={order} onSubmit={handleSubmit} />;
}
