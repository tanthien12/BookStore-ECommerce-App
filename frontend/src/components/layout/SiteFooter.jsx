import React from "react";
import { Link } from "react-router-dom";
// Nếu bạn muốn dùng icon xịn hơn thì import từ react-icons (tùy chọn)
import { FiFacebook, FiYoutube, FiInstagram } from "react-icons/fi"; 

export default function SiteFooter() {
    return (
        <footer className="mt-12 border-t border-gray-100 bg-white pt-10 pb-6">
            <div className="mx-auto max-w-7xl px-4">
                {/* FIX GRID: 
                   - Mobile: grid-cols-1 (1 cột cho thoáng, hết bị lòi form)
                   - Tablet nhỏ: grid-cols-2 
                   - Desktop: grid-cols-4
                */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    
                    {/* CỘT 1: THÔNG TIN */}
                    <div>
                        <div className="text-xl font-bold text-red-600 mb-3">BookStore.com</div>
                        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                            Nơi lan tỏa tri thức.<br/>
                            Sách thật – Giao nhanh – Giá tốt.
                        </p>
                        
                        <div className="flex gap-4">
                            <a href="#" className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm">
                                <FiFacebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm">
                                <FiYoutube className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-sm">
                                <FiInstagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* CỘT 2: DỊCH VỤ */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-sm tracking-wide">Dịch vụ</h3>
                        <ul className="space-y-2.5 text-sm text-gray-600">
                            <li><Link to="/about" className="hover:text-red-600 transition">Về chúng tôi</Link></li>
                            <li><Link to="/terms-of-use" className="hover:text-red-600 transition">Điều khoản sử dụng</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-red-600 transition">Bảo mật thông tin</Link></li>
                            <li><Link to="/blog" className="hover:text-red-600 transition">Tin tức & Sự kiện</Link></li>
                        </ul>
                    </div>

                    {/* CỘT 3: HỖ TRỢ */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-sm tracking-wide">Hỗ trợ</h3>
                        <ul className="space-y-2.5 text-sm text-gray-600">
                            <li><Link to="/help-center" className="hover:text-red-600 transition">Trung tâm trợ giúp</Link></li>
                            <li><Link to="/return-policy" className="hover:text-red-600 transition">Chính sách đổi trả</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-red-600 transition">Vận chuyển & thanh toán</Link></li>
                            <li><Link to="/contact" className="hover:text-red-600 transition">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* CỘT 4: NEWSLETTER (Đã fix lỗi lòi ra) */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-sm tracking-wide">Nhận bản tin</h3>
                        <p className="text-gray-500 text-sm mb-3">Đăng ký để nhận ưu đãi hàng tuần.</p>
                        
                        <form
                            onSubmit={(e) => { e.preventDefault(); alert("Đã đăng ký!"); }}
                            className="flex flex-col gap-2" 
                        >
                            {/* Input: full width */}
                            <input 
                                type="email"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                                placeholder="Nhập email của bạn..." 
                                required
                            />
                            {/* Button: full width để dễ bấm trên mobile */}
                            <button 
                                type="submit"
                                className="w-full rounded-lg bg-red-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-700 transition shadow-sm active:scale-[0.98]"
                            >
                                Đăng ký ngay
                            </button>
                        </form>
                        
                        {/* List Payment methods */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="bg-gray-100 px-2 py-1 rounded">Momo</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">ZaloPay</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">Visa/Master</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">COD</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Copyright Line */}
            <div className="border-t border-gray-100 mt-10 pt-6 text-center">
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} BookStore.com. All rights reserved.
                </p>
            </div>
        </footer>
    );
}