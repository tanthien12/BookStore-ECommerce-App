// src/components/layout/CategoryMegaMenu.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { FiChevronDown, FiArrowRight } from "react-icons/fi";
import summaryApi from "../../common"; // ✅ Import file index.js chứa API

export default function CategoryMegaMenu() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState(null);
    
    const wrapRef = useRef(null);
    const navigate = useNavigate();

    // 1. GỌI API LẤY DANH MỤC THẬT
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // ✅ Gọi đúng endpoint từ file index.js của bạn: summaryApi.category.list
                const res = await fetch(summaryApi.url(summaryApi.category.list)); 
                const json = await res.json();

                if (json.success) {
                    // ✅ Dữ liệu thật nằm trong json.items
                    const fetchedCats = json.items || [];
                    setCategories(fetchedCats);
                    
                    // Active cái đầu tiên mặc định
                    if (fetchedCats.length > 0) {
                        setActiveId(fetchedCats[0].id);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải danh mục:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // 2. Xử lý click outside để đóng menu
    useEffect(() => {
        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    // 3. Tìm danh mục đang active
    const activeCategory = useMemo(
        () => categories.find((c) => c.id === activeId) || categories[0],
        [categories, activeId]
    );

    const go = (path) => {
        navigate(path);
        setOpen(false);
    };

    return (
        <div className="relative" ref={wrapRef}>
            {/* Nút mở Mega Menu */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-1 rounded-xl p-2 text-gray-700 hover:text-red-600 focus:outline-none transition-colors"
            >
                <HiOutlineSquares2X2 className="h-6 w-6" />
                <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Panel Mega Menu */}
            {open && (
                <div className="absolute left-0 top-14 z-50 w-[800px] max-w-[90vw] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.15s_ease-out] overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang tải danh mục...</span>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">Chưa có danh mục nào.</div>
                    ) : (
                        <div className="grid grid-cols-[260px_1fr] min-h-[350px]">
                            {/* === CỘT TRÁI: DANH SÁCH DANH MỤC === */}
                            <aside className="bg-gray-50/80 border-r border-gray-100 overflow-y-auto max-h-[500px] py-3">
                                <ul className="space-y-1 px-3">
                                    {categories.map((c) => {
                                        const isActive = activeId === c.id;
                                        // Nếu không có slug thì fallback về id
                                        const link = `/category/${c.slug || c.id}`; 
                                        
                                        return (
                                            <li key={c.id}>
                                                <Link
                                                    to={link}
                                                    onMouseEnter={() => setActiveId(c.id)}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        go(link);
                                                    }}
                                                    className={`group flex items-center justify-between rounded-lg px-4 py-3 text-[15px] font-medium transition-all duration-200 ${
                                                        isActive
                                                            ? "bg-white text-red-600 shadow-sm ring-1 ring-gray-100"
                                                            : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                                                    }`}
                                                >
                                                    <span className="line-clamp-1">{c.name}</span>
                                                    {isActive && <FiArrowRight className="text-red-500 text-sm" />}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </aside>

                            {/* === CỘT PHẢI: CHI TIẾT DANH MỤC === */}
                            <section className="p-8 bg-white flex flex-col h-full relative">
                                {activeCategory && (
                                    <div className="animate-[fadeIn_0.2s_ease-out] flex-1">
                                        {/* Header của cột phải */}
                                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                                            {activeCategory.image_url ? (
                                                <img 
                                                    src={activeCategory.image_url} 
                                                    alt={activeCategory.name}
                                                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm"
                                                    onError={(e) => e.target.style.display = 'none'} 
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-2xl font-bold">
                                                    {activeCategory.name.charAt(0)}
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                                    {activeCategory.name}
                                                </h3>
                                                <Link 
                                                    to={`/category/${activeCategory.slug || activeCategory.id}`}
                                                    onClick={() => setOpen(false)}
                                                    className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1"
                                                >
                                                    Xem tất cả sách <FiArrowRight />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Nội dung gợi ý (Vì chưa có sub-category, ta hiển thị text placeholder đẹp) */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                                                <h4 className="font-semibold text-red-800 mb-2">Sách bán chạy</h4>
                                                <p className="text-sm text-gray-600 mb-3">Khám phá những cuốn sách {activeCategory.name} được yêu thích nhất tháng này.</p>
                                                <button onClick={() => go(`/category/${activeCategory.slug || activeCategory.id}?sort=sold_desc`)} className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-md font-semibold shadow-sm hover:shadow-md transition">
                                                    Xem ngay
                                                </button>
                                            </div>
                                            
                                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                                <h4 className="font-semibold text-blue-800 mb-2">Sách mới về</h4>
                                                <p className="text-sm text-gray-600 mb-3">Cập nhật những tựa sách {activeCategory.name} mới nhất vừa lên kệ.</p>
                                                <button onClick={() => go(`/category/${activeCategory.slug || activeCategory.id}?sort=newest`)} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-md font-semibold shadow-sm hover:shadow-md transition">
                                                    Xem ngay
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Background Decoration */}
                                        <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
                                             <HiOutlineSquares2X2 className="text-[200px] text-gray-900 transform translate-x-10 translate-y-10" />
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}