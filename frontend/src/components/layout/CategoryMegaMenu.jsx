import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { FiChevronDown } from "react-icons/fi";
import { CATEGORIES, slugify } from "../../data/categoryData";

export default function CategoryMegaMenu({ categories = CATEGORIES }) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState(categories[0]?.id);
    const wrapRef = useRef(null);
    const navigate = useNavigate();

    // click-outside + ESC
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

    const active = useMemo(
        () => categories.find((c) => c.id === activeId) || categories[0],
        [categories, activeId]
    );

    const go = (path) => {
        navigate(path);
        setOpen(false);
    };

    return (
        <div className="relative" ref={wrapRef}>
            {/* Nút mở */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="hidden sm:inline-flex items-center gap-1 rounded-xl p-2 text-gray-700 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                <HiOutlineSquares2X2 className="h-6 w-6" />
                <FiChevronDown className="h-4 w-4" />
                <span className="sr-only">Danh mục</span>
            </button>

            {/* Panel */}
            {open && (
                <div
                    role="menu"
                    className="absolute left-0 top-12 z-50 w-[92vw] max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-xl"
                >
                    <div className="grid grid-cols-[260px_1fr]">
                        {/* Cột trái */}
                        <aside className="rounded-l-2xl bg-gray-50 p-4 border-r border-gray-200">
                            <div className="text-lg font-semibold text-gray-800 mb-2">
                                Danh mục sản phẩm
                            </div>
                            <ul className="space-y-1">
                                {categories.map((c) => (
                                    <li key={c.id}>
                                        {/* Dùng Link để SEO + giữ hover -> setActiveId */}
                                        <Link
                                            to={`/category/${c.id}`}
                                            onMouseEnter={() => setActiveId(c.id)}
                                            onFocus={() => setActiveId(c.id)}
                                            onClick={(e) => {
                                                e.preventDefault(); // tránh reload
                                                go(`/category/${c.id}`);
                                            }}
                                            className={`block rounded-xl px-3 py-2 text-sm transition ${activeId === c.id
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-700 hover:bg-white"
                                                }`}
                                        >
                                            <span className="mr-2">{c.icon}</span>
                                            {c.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        {/* Cột phải */}
                        <section className="p-5">
                            <div className="flex items-center gap-2 text-red-600 font-semibold text-lg mb-4">
                                <span>📕</span>
                                <Link
                                    to={`/category/${active?.id}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        go(`/category/${active?.id}`);
                                    }}
                                    className="hover:underline"
                                >
                                    {active?.label}
                                </Link>
                            </div>

                            {active?.columns?.length ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                                    {active.columns.map((col) => (
                                        <div key={col.title} className="min-w-[180px]">
                                            <h4 className="text-gray-900 font-semibold mb-2 uppercase text-sm">
                                                {col.title}
                                            </h4>
                                            <ul className="space-y-1">
                                                {col.items.map((name) => {
                                                    const s = slugify(name);
                                                    const path = `/category/${active.id}/${s}`;
                                                    return (
                                                        <li key={s}>
                                                            <Link
                                                                to={path}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    go(path);
                                                                }}
                                                                className="text-gray-700 hover:text-red-600 text-sm block truncate"
                                                            >
                                                                {name}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                                <li className="pt-1">
                                                    <Link
                                                        to={`/category/${active.id}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            go(`/category/${active.id}`);
                                                        }}
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        Xem tất cả
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Danh mục này đang được cập nhật…
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}