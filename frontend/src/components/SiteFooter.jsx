import React from "react";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="text-gray-900 font-semibold mb-2">BookStore.com</div>
          <p className="text-gray-600">Sách hay – Giao nhanh – Giá tốt.</p>
          <div className="mt-3 flex gap-3 text-gray-500">
            <span>Facebook</span><span>YouTube</span><span>Zalo</span>
          </div>
        </div>

        <div>
          <div className="text-gray-900 font-semibold mb-2">Dịch vụ</div>
          <ul className="space-y-1 text-gray-600">
            <li><a href="#" className="hover:text-red-600">Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-red-600">Bảo mật thông tin</a></li>
            <li><a href="#" className="hover:text-red-600">Hệ thống cửa hàng</a></li>
          </ul>
        </div>

        <div>
          <div className="text-gray-900 font-semibold mb-2">Hỗ trợ</div>
          <ul className="space-y-1 text-gray-600">
            <li><a href="#" className="hover:text-red-600">Trung tâm trợ giúp</a></li>
            <li><a href="#" className="hover:text-red-600">Chính sách đổi trả</a></li>
            <li><a href="#" className="hover:text-red-600">Vận chuyển & thanh toán</a></li>
          </ul>
        </div>

        <div>
          <div className="text-gray-900 font-semibold mb-2">Nhận bản tin</div>
          <p className="text-gray-600 mb-2">Ưu đãi mỗi tuần gửi tới bạn.</p>
          <form
            onSubmit={(e)=>{e.preventDefault(); alert("Đã đăng ký!");}}
            className="flex gap-2"
          >
            <input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                   placeholder="Nhập email của bạn" />
            <button className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700">
              Đăng ký
            </button>
          </form>
          <div className="mt-4 text-xs text-gray-500">VNPay · Momo · ShopeePay · ZaloPay</div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 py-4 border-t">
        © {new Date().getFullYear()} BookStore.com — All rights reserved.
      </div>
    </footer>
  );
}
