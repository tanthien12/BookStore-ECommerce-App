import React from "react";
import { Link, useLocation } from "react-router-dom";

// ✅ [MỚI] Thêm icon Checkmark (SVG)
const CheckIcon = () => (
  <svg
    className="h-16 w-16 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function CheckoutSuccess() {
  const params = new URLSearchParams(useLocation().search);

  const orderId = params.get("orderId");
  const amount = params.get("amount");
  const code = params.get("code");
  const method = params.get("method") || "cod";
  const transactionId = params.get("txn") || null;

  const getMethodLabel = (m) => {
    switch (m.toLowerCase()) {
      case "vnpay":
        return "VNPay";
      case "stripe":
        return "Stripe";
      case "cod":
      default:
        return "Thanh toán khi nhận hàng";
    }
  };

  return (
    // ✅ [MỚI] Thêm nền xám cho trang và căn giữa
    <div className="bg-gray-50 min-h-[calc(100vh-200px)] py-10 px-4">
      {/* ✅ [MỚI] Thiết kế lại thành dạng Card (Thẻ) */}
      <div className="mx-auto max-w-lg rounded-xl border bg-white p-6 text-center shadow-lg md:p-8">
        
        {/* ✅ [MỚI] Thêm Icon */}
        <div className="flex justify-center">
          <CheckIcon />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-gray-600">
          Cảm ơn bạn đã mua sắm tại <strong>BookStore</strong>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Chúng tôi sẽ xác nhận đơn hàng cho bạn sớm nhất.
        </p>

        {/* ✅ [MỚI] Thiết kế lại chi tiết đơn hàng dạng "biên nhận" */}
        <div className="mt-6 border-t border-b border-gray-200 divide-y divide-gray-200 text-sm">
          <div className="flex justify-between py-3">
            <span className="text-gray-500">Mã đơn hàng</span>
            <span className="font-semibold text-gray-900">
              {orderId || "Không xác định"}
            </span>
          </div>

          <div className="flex justify-between py-3">
            <span className="text-gray-500">Tổng tiền</span>
            <span className="font-semibold text-gray-900">
              {amount ? `${Number(amount).toLocaleString()} VND` : "N/A"}
            </span>
          </div>

          <div className="flex justify-between py-3">
            <span className="text-gray-500">Phương thức thanh toán</span>
            <span className="font-semibold text-gray-900">
              {getMethodLabel(method)}
            </span>
          </div>

          {transactionId && (
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Mã giao dịch</span>
              <span className="font-semibold text-gray-900">
                {transactionId}
              </span>
            </div>
          )}

          {code && (
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Mã phản hồi</span>
              <span className="font-semibold text-gray-900">{code}</span>
            </div>
          )}
        </div>

        {/* ✅ [MỚI] Thiết kế lại nút bấm, thêm w-full cho rõ ràng */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            to="/orders"
            className="w-full rounded-lg bg-gray-800 px-5 py-3 text-white font-semibold hover:bg-black transition text-center"
          >
            Xem đơn hàng của tôi
          </Link>
          <Link
            to="/"
            className="text-gray-600 hover:underline font-medium text-sm"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}