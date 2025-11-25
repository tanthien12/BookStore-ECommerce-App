import React from "react";
import { Link } from "react-router-dom"; // Import Link

export default function SiteFooter() {
    return (
        <footer className="mt-10 border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-3 md:px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                
                {/* CỘT 1: THÔNG TIN */}
                <div>
                    <div className="text-gray-900 font-semibold mb-2">BookStore.com</div>
                    <p className="text-gray-600 mb-2">Sách hay – Giao nhanh – Giá tốt.</p>
                    
                    {/* Link Về chúng tôi */}
                    <Link to="/about" className="block text-gray-600 hover:text-red-600 mb-1">
                        Về chúng tôi
                    </Link>
                    
                    <div className="mt-3 flex gap-3 text-gray-500 cursor-pointer">
                        <span className="hover:text-blue-600">Facebook</span>
                        <span className="hover:text-red-600">YouTube</span>
                        <span className="hover:text-blue-500">Zalo</span>
                    </div>
                </div>

                {/* CỘT 2: DỊCH VỤ */}
                <div>
                    <div className="text-gray-900 font-semibold mb-2">Dịch vụ</div>
                    <ul className="space-y-1 text-gray-600">
                        <li>
                            {/* Ví dụ: Điều khoản */}
                            <Link to="/terms-of-use" className="hover:text-red-600">Điều khoản sử dụng</Link>
                        </li>
                        <li>
                            {/* Ví dụ: Bảo mật */}
                            <Link to="/privacy-policy" className="hover:text-red-600">Bảo mật thông tin</Link>
                        </li>
                        <li>
                            <Link to="/blog" className="hover:text-red-600">Tin tức & Sự kiện</Link>
                        </li>
                    </ul>
                </div>

                {/* CỘT 3: HỖ TRỢ */}
                <div>
                    <div className="text-gray-900 font-semibold mb-2">Hỗ trợ</div>
                    <ul className="space-y-1 text-gray-600">
                        <li>
                            <Link to="/help-center" className="hover:text-red-600">Trung tâm trợ giúp</Link>
                        </li>
                        <li>
                            {/* Link Chính sách đổi trả */}
                            <Link to="/return-policy" className="hover:text-red-600">Chính sách đổi trả</Link>
                        </li>
                        <li>
                            <Link to="/shipping-policy" className="hover:text-red-600">Vận chuyển & thanh toán</Link>
                        </li>
                    </ul>
                </div>

                {/* CỘT 4: NEWSLETTER */}
                <div>
                    <div className="text-gray-900 font-semibold mb-2">Nhận bản tin</div>
                    <p className="text-gray-600 mb-2">Ưu đãi mỗi tuần gửi tới bạn.</p>
                    <form
                        onSubmit={(e) => { e.preventDefault(); alert("Đã đăng ký!"); }}
                        className="flex gap-2"
                    >
                        <input 
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Nhập email của bạn" 
                        />
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