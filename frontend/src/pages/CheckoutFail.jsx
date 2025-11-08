import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function CheckoutFail() {
  const params = new URLSearchParams(useLocation().search);

  const orderId = params.get("orderId");
  const reason = params.get("reason") || "Không xác định";
  const code = params.get("code");
  const method = params.get("method") || "unknown";

  const getMethodLabel = (m) => {
    switch (m.toLowerCase()) {
      case "vnpay":
        return "VNPay";
      case "stripe":
        return "Stripe";
      case "cod":
        return "Thanh toán khi nhận hàng (COD)";
      default:
        return "Không rõ";
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 md:px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Thanh toán thất bại
      </h1>
      <p className="mt-2 text-gray-600">
        Giao dịch của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức khác.
      </p>

      <div className="mt-6 border rounded-xl p-5 bg-gray-50 text-left text-sm shadow-sm">
        <p>
          <strong>Mã đơn hàng:</strong> {orderId || "Không xác định"}
        </p>
        <p>
          <strong>Phương thức thanh toán:</strong> {getMethodLabel(method)}
        </p>
        <p>
          <strong>Lý do thất bại:</strong> {reason}
        </p>
        {code && (
          <p>
            <strong>Mã phản hồi:</strong> {code}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        <Link
          to="/checkout"
          className="rounded-lg bg-gray-900 px-5 py-3 text-white font-semibold hover:bg-black transition"
        >
          Thử lại thanh toán
        </Link>
        <Link
          to="/"
          className="text-blue-500 hover:underline font-medium"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
