
import React from "react";
import { Link } from "react-router-dom";

export default function CheckoutSuccess() {
    const draft = JSON.parse(localStorage.getItem("order_draft") || "null");

    return (
        <div className="mx-auto max-w-3xl px-3 md:px-4 py-10 text-center">
            <h1 className="text-2xl font-bold text-green-600">Đặt hàng thành công!</h1>
            <p className="mt-2 text-gray-600">Cảm ơn bạn đã mua sắm tại BookStore.com</p>

            {draft && (
                <pre className="mt-6 bg-gray-50 border border-gray-200 rounded-xl text-left text-xs p-3 overflow-x-auto">
                    {JSON.stringify(draft, null, 2)}
                </pre>
            )}

            <Link
                to="/"
                className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 text-white font-semibold hover:bg-black"
            >
                Về trang chủ
            </Link>
        </div>
    );
}