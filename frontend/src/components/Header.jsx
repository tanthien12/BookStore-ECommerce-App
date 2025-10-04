// import React, { useEffect, useRef, useState, memo } from 'react'
// import { HiOutlineSquares2X2 } from 'react-icons/hi2'
// import { FiChevronDown, FiSearch, FiBell, FiShoppingCart, FiUser } from 'react-icons/fi'
// import { Link } from "react-router-dom";
// //

// // ===== Helpers =====
// const useClickOutside = (ref, handler) => {
//     useEffect(() => {
//         const onClick = (e) => {
//             if (!ref.current) return
//             if (!ref.current.contains(e.target)) handler?.()
//         }
//         const onKey = (e) => { if (e.key === 'Escape') handler?.() }
//         document.addEventListener('mousedown', onClick)
//         document.addEventListener('keydown', onKey)
//         return () => {
//             document.removeEventListener('mousedown', onClick)
//             document.removeEventListener('keydown', onKey)
//         }
//     }, [ref, handler])
// }

// const Badge = memo(({ value }) => {
//     if (!value) return null
//     return (
//         <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
//             {value > 99 ? '99+' : value}
//         </span>
//     )
// })

// const NavIcon = memo(({ icon: Icon, label, onClick, badge, active }) => (
//     <button
//         type="button"
//         onClick={onClick}
//         className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
//         aria-label={label}
//     >
//         <span className="relative">
//             <Icon className="h-6 w-6" />
//             <Badge value={badge} />
//         </span>
//         <span className="hidden sm:block">{label}</span>
//     </button>
// ))

// const AccountPopover = ({ open, onClose }) => {
//     const popRef = useRef(null);
//     useClickOutside(popRef, onClose);
//     if (!open) return null;
//     return (
//         <div
//             ref={popRef}
//             role="menu"
//             aria-label="Tài khoản"
//             className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
//         >
//             <div className="space-y-3">
//                 <Link
//                     to="/login"
//                     onClick={onClose}
//                     className="block w-full text-center rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                     Đăng nhập
//                 </Link>
//                 <Link
//                     to="/register"
//                     onClick={onClose}
//                     className="block w-full text-center rounded-xl border-2 border-red-600 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                     Đăng ký
//                 </Link>
//             </div>
//         </div>
//     )
// }

// const LanguageDropdown = ({ open, onToggle, onChange, value = 'vi' }) => (
//     <div className="relative">
//         <button
//             type="button"
//             onClick={onToggle}
//             aria-haspopup="listbox"
//             aria-expanded={open}
//             className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
//         >
//             <span className="flex h-6 w-9 items-center justify-center rounded-md border border-gray-200 bg-red-500 text-base leading-none">
//                 <span className="text-white" aria-hidden>★</span>
//             </span>
//             <FiChevronDown className="h-4 w-4 text-gray-500" />
//         </button>
//         {open && (
//             <ul role="listbox" className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
//                 {[{ code: 'vi', label: 'Tiếng Việt' }, { code: 'en', label: 'English' }].map(opt => (
//                     <li key={opt.code}>
//                         <button
//                             type="button"
//                             role="option"
//                             aria-selected={value === opt.code}
//                             onClick={() => onChange?.(opt.code)}
//                             className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === opt.code ? 'text-red-600 font-medium' : 'text-gray-700'}`}
//                         >{opt.label}</button>
//                     </li>
//                 ))}
//             </ul>
//         )}
//     </div>
// )

// const Logo = () => (
//     <Link to="/" className="shrink-0 select-none" aria-label="Trang chủ">
//         <span className="text-2xl font-extrabold tracking-tight text-red-600">
//             BookStore<span className="text-gray-800">.com</span>
//         </span>
//     </Link>
// );

// // ===== Main Component =====
// const Header = ({
//     cartCount = 2,
//     onSearch,
//     onOpenCart,
//     onSignIn,
//     onSignUp,
//     onChangeLang,
// }) => {
//     const [shadow, setShadow] = useState(false)
//     const [query, setQuery] = useState('')
//     const [accountOpen, setAccountOpen] = useState(false)
//     const [langOpen, setLangOpen] = useState(false)
//     const accountWrapRef = useRef(null)

//     useEffect(() => {
//         const onScroll = () => setShadow(window.scrollY > 4)
//         onScroll()
//         window.addEventListener('scroll', onScroll)
//         return () => window.removeEventListener('scroll', onScroll)
//     }, [])

//     useClickOutside(accountWrapRef, () => setAccountOpen(false))

//     const submit = (e) => {
//         e.preventDefault()
//         onSearch?.(query.trim())
//     }

//     return (
//         <header className={`sticky top-0 z-50 bg-white ${shadow ? 'shadow-sm' : ''}`}>
//             <div className="mx-auto max-w-7xl px-3 md:px-4">
//                 <div className="flex items-center gap-3 py-3 md:gap-6">
//                     {/* Left: Logo + Category trigger */}
//                     <div className="flex items-center gap-3 md:gap-4">
//                         <Logo />
//                         <button
//                             type="button"
//                             className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-transparent bg-transparent p-2 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
//                             aria-label="Danh mục"
//                         >
//                             <HiOutlineSquares2X2 className="h-6 w-6" />
//                             <FiChevronDown className="h-4 w-4" />
//                         </button>
//                     </div>

//                     {/* Center: Search */}
//                     <form onSubmit={submit} className="relative flex-1">
//                         <input
//                             value={query}
//                             onChange={(e) => setQuery(e.target.value)}
//                             className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-14 text-[15px] text-gray-700 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
//                             placeholder="Mua Đồ"
//                             aria-label="Tìm kiếm"
//                         />
//                         <button
//                             type="submit"
//                             className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
//                             aria-label="Tìm"
//                         >
//                             <FiSearch className="h-5 w-5" />
//                         </button>
//                     </form>

//                     {/* Right: Actions */}
//                     <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
//                         <NavIcon icon={FiBell} label="Thông Báo" badge={3} />
//                         <NavIcon icon={FiShoppingCart} label="Giỏ Hàng" badge={cartCount} onClick={onOpenCart} />

//                         {/* Account + popover */}
//                         <div className="relative" ref={accountWrapRef}>
//                             <NavIcon
//                                 icon={FiUser}
//                                 label="Tài khoản"
//                                 onClick={() => setAccountOpen((v) => !v)}
//                                 active={accountOpen}
//                             />
//                             <AccountPopover
//                                 open={accountOpen}
//                                 onClose={() => setAccountOpen(false)}
//                                 onSignIn={() => { setAccountOpen(false); onSignIn?.() }}
//                                 onSignUp={() => { setAccountOpen(false); onSignUp?.() }}
//                             />
//                         </div>

//                         {/* Language button */}
//                         <LanguageDropdown
//                             open={langOpen}
//                             onToggle={() => setLangOpen((v) => !v)}
//                             onChange={(code) => { setLangOpen(false); onChangeLang?.(code) }}
//                             value="vi"
//                         />
//                     </div>
//                 </div>
//             </div>
//         </header>
//     )
// }

// export default Header

// Code 2

// src/components/layout/Header.jsx
// import React, { useEffect, useMemo, useRef, useState, memo } from "react";
// import { HiOutlineSquares2X2 } from "react-icons/hi2";
// import { FiChevronDown, FiSearch, FiBell, FiShoppingCart, FiUser, FiX } from "react-icons/fi";
// import { Link, useNavigate } from "react-router-dom";

// // Tuỳ dự án của bạn: nếu chưa có thì tạm thời comment dòng dưới
// import CategoryMegaMenu from "./layout/CategoryMegaMenu";
// // Nếu bạn có CartContext, import; nếu chưa có thì Header sẽ dùng prop cartCount
// import { useCart } from "../context/CartContext";

// /* =====================================
//    Utilities
// ===================================== */
// const useClickOutside = (ref, handler) => {
//     useEffect(() => {
//         const onClick = (e) => {
//             if (!ref.current) return;
//             if (!ref.current.contains(e.target)) handler?.();
//         };
//         const onKey = (e) => e.key === "Escape" && handler?.();
//         document.addEventListener("mousedown", onClick);
//         document.addEventListener("keydown", onKey);
//         return () => {
//             document.removeEventListener("mousedown", onClick);
//             document.removeEventListener("keydown", onKey);
//         };
//     }, [ref, handler]);
// };

// const useDebounce = (value, delay = 250) => {
//     const [debounced, setDebounced] = useState(value);
//     useEffect(() => {
//         const t = setTimeout(() => setDebounced(value), delay);
//         return () => clearTimeout(t);
//     }, [value, delay]);
//     return debounced;
// };

// /* =====================================
//    Atoms
// ===================================== */
// const Badge = memo(({ value }) => {
//     if (!value) return null;
//     return (
//         <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
//             {value > 99 ? "99+" : value}
//         </span>
//     );
// });
// Badge.displayName = "Badge";

// const NavIcon = memo(({ icon: Icon, label, onClick, badge, active }) => (
//     <button
//         type="button"
//         onClick={onClick}
//         className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
//         aria-label={label}
//     >
//         <span className="relative">
//             <Icon className="h-6 w-6" />
//             <Badge value={badge} />
//         </span>
//         <span className="hidden sm:block">{label}</span>
//     </button>
// ));
// NavIcon.displayName = "NavIcon";

// const Logo = () => (
//     <Link to="/" aria-label="Trang chủ" className="shrink-0 select-none group">
//         <span className="text-2xl font-extrabold tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
//             BookStore<span className="text-gray-800">.com</span>
//         </span>
//     </Link>
// );

// /* =====================================
//    Popovers
// ===================================== */
// const AccountPopover = ({ open, onClose, onLogout }) => {
//     const popRef = useRef(null);
//     const navigate = useNavigate();
//     useClickOutside(popRef, onClose);
//     if (!open) return null;

//     const handleLogout = async () => {
//         try {
//             onClose?.();
//             if (onLogout) {
//                 await onLogout();
//                 navigate("/");
//             } else {
//                 navigate("/logout");
//             }
//         } catch (e) {
//             console.error(e);
//         }
//     };

//     return (
//         <div
//             ref={popRef}
//             role="menu"
//             aria-label="Tài khoản"
//             className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5"
//         >
//             <div className="space-y-3">
//                 <Link
//                     to="/login"
//                     onClick={onClose}
//                     className="block w-full text-center rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                     Đăng nhập
//                 </Link>
//                 <Link
//                     to="/register"
//                     onClick={onClose}
//                     className="block w-full text-center rounded-xl border-2 border-red-600 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                     Đăng ký
//                 </Link>

//                 <div className="pt-2 border-t text-sm text-gray-600">
//                     <ul className="grid grid-cols-2 gap-2">
//                         <li>
//                             <Link to="/orders" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
//                                 Đơn hàng
//                             </Link>
//                         </li>
//                         <li>
//                             <Link to="/wishlist" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
//                                 Yêu thích
//                             </Link>
//                         </li>
//                         <li>
//                             <Link to="/settings" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
//                                 Cài đặt
//                             </Link>
//                         </li>
//                         <li>
//                             <button
//                                 type="button"
//                                 onClick={handleLogout}
//                                 className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-50"
//                             >
//                                 Đăng xuất
//                             </button>
//                         </li>
//                     </ul>
//                 </div>
//             </div>
//         </div>
//     );
// };

// /* =====================================
//    Language Dropdown
// ===================================== */
// const LanguageDropdown = ({ open, onToggle, onChange, value = "vi" }) => (
//     <div className="relative">
//         <button
//             type="button"
//             onClick={onToggle}
//             aria-haspopup="listbox"
//             aria-expanded={open}
//             className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
//         >
//             <span className="flex h-6 w-9 items-center justify-center rounded-md border border-gray-200 bg-red-500 text-base leading-none">
//                 <span className="text-white" aria-hidden>★</span>
//             </span>
//             <FiChevronDown className="h-4 w-4 text-gray-500" />
//         </button>
//         {open && (
//             <ul
//                 role="listbox"
//                 className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
//             >
//                 {[
//                     { code: "vi", label: "Tiếng Việt" },
//                     { code: "en", label: "English" },
//                 ].map((opt) => (
//                     <li key={opt.code}>
//                         <button
//                             type="button"
//                             role="option"
//                             aria-selected={value === opt.code}
//                             onClick={() => onChange?.(opt.code)}
//                             className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === opt.code ? "text-red-600 font-medium" : "text-gray-700"
//                                 }`}
//                         >
//                             {opt.label}
//                         </button>
//                     </li>
//                 ))}
//             </ul>
//         )}
//     </div>
// );

// /* =====================================
//    Search Bar (debounced + clear)
// ===================================== */
// const SearchBar = ({ value, onChange, onSubmit, placeholder = "Tìm kiếm sản phẩm, tác giả..." }) => {
//     const [local, setLocal] = useState(value);
//     const debounced = useDebounce(local, 250);

//     useEffect(() => {
//         if (debounced !== value) onChange(debounced.trimStart());
//     }, [debounced, value, onChange]);

//     useEffect(() => setLocal(value), [value]);

//     const clearable = useMemo(() => local.length > 0, [local]);

//     return (
//         <form
//             onSubmit={(e) => {
//                 e.preventDefault();
//                 onSubmit();
//             }}
//             className="relative flex-1"
//             role="search"
//             aria-label="Thanh tìm kiếm"
//         >
//             <input
//                 value={local}
//                 onChange={(e) => setLocal(e.target.value)}
//                 className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-20 text-[15px] text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
//                 placeholder={placeholder}
//             />
//             {clearable && (
//                 <button
//                     type="button"
//                     onClick={() => setLocal("")}
//                     aria-label="Xóa tìm kiếm"
//                     className="absolute right-12 top-1.5 flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 active:scale-95 text-gray-500"
//                 >
//                     <FiX className="h-4 w-4" />
//                 </button>
//             )}
//             <button
//                 type="submit"
//                 className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 aria-label="Tìm"
//             >
//                 <FiSearch className="h-5 w-5" />
//             </button>
//         </form>
//     );
// };

// /* =====================================
//    Main Header
// ===================================== */
// /**
//  * @param {Object} props
//  * @param {number} [props.cartCount=0]   - fallback nếu chưa có CartContext
//  * @param {(q:string)=>void} [props.onSearch]
//  * @param {() => Promise<void>|void} [props.onLogout] - callback xử lý logout (API, clear token…)
//  * @param {(code:'vi'|'en')=>void} [props.onChangeLang]
//  */
// const Header = ({
//     cartCount = 0,
//     onSearch,
//     onLogout,
//     onChangeLang,
// }) => {
//     const [shadow, setShadow] = useState(false);
//     const [query, setQuery] = useState("");
//     const [accountOpen, setAccountOpen] = useState(false);
//     const [langOpen, setLangOpen] = useState(false);
//     const accountWrapRef = useRef(null);

//     const navigate = useNavigate();

//     // Lấy số lượng từ context (nếu có), fallback về prop
//     let countFromContext = cartCount;
//     try {
//         const { count } = useCart() || {};
//         if (typeof count === "number") countFromContext = count;
//     } catch {
//         // nếu chưa có provider, dùng cartCount
//     }

//     useEffect(() => {
//         const onScroll = () => setShadow(window.scrollY > 4);
//         onScroll();
//         window.addEventListener("scroll", onScroll);
//         return () => window.removeEventListener("scroll", onScroll);
//     }, []);

//     useClickOutside(accountWrapRef, () => setAccountOpen(false));

//     const submit = () => onSearch?.(query.trim());

//     return (
//         <header className={`sticky top-0 z-50 bg-white ${shadow ? "shadow-sm" : ""}`}>
//             {/* Top promo bar (giữ như Code 2, màu không ảnh hưởng header trắng) */}
//             <div className="hidden md:block bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 text-white">
//                 <div className="mx-auto max-w-7xl px-4">
//                     <div className="flex items-center justify-between py-1 text-xs">
//                         <p className="opacity-95">🔥 Miễn phí vận chuyển cho đơn từ 299k</p>
//                         <Link to="/promotions" className="underline/30 hover:underline">
//                             Xem khuyến mãi
//                         </Link>
//                     </div>
//                 </div>
//             </div>

//             {/* Main bar: TRẮNG như Code 1 */}
//             <div className="bg-white border-b border-gray-100">
//                 <div className="mx-auto max-w-7xl px-3 md:px-4">
//                     <div className="flex items-center gap-3 py-3 md:gap-6">
//                         {/* Left: Logo + Category */}
//                         <div className="flex items-center gap-3 md:gap-4">
//                             <Logo />
//                             {CategoryMegaMenu ? (
//                                 <CategoryMegaMenu onNavigate={(path) => navigate(path)} />
//                             ) : (
//                                 <button
//                                     type="button"
//                                     className="hidden sm:inline-flex items-center gap-1 rounded-xl p-2 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
//                                     aria-label="Danh mục"
//                                 >
//                                     <HiOutlineSquares2X2 className="h-6 w-6" />
//                                     <FiChevronDown className="h-4 w-4" />
//                                 </button>
//                             )}
//                         </div>

//                         {/* Center: Search */}
//                         <SearchBar value={query} onChange={setQuery} onSubmit={submit} />

//                         {/* Right: Actions */}
//                         <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
//                             <NavIcon icon={FiBell} label="Thông Báo" badge={3} />
//                             <NavIcon
//                                 icon={FiShoppingCart}
//                                 label="Giỏ Hàng"
//                                 badge={countFromContext}
//                                 onClick={() => navigate("/cart")}
//                             />

//                             {/* Account + popover */}
//                             <div className="relative" ref={accountWrapRef}>
//                                 <NavIcon
//                                     icon={FiUser}
//                                     label="Tài khoản"
//                                     onClick={() => setAccountOpen((v) => !v)}
//                                     active={accountOpen}
//                                 />
//                                 <AccountPopover
//                                     open={accountOpen}
//                                     onClose={() => setAccountOpen(false)}
//                                     onLogout={onLogout}
//                                 />
//                             </div>

//                             {/* Language */}
//                             <LanguageDropdown
//                                 open={langOpen}
//                                 onToggle={() => setLangOpen((v) => !v)}
//                                 onChange={(code) => {
//                                     setLangOpen(false);
//                                     onChangeLang?.(code);
//                                 }}
//                                 value="vi"
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default Header;

// Code 3

// src/components/layout/Header.jsx
import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { FiChevronDown, FiSearch, FiBell, FiShoppingCart, FiUser, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

// Tuỳ dự án của bạn: nếu chưa có thì tạm thời comment dòng dưới
import CategoryMegaMenu from "./layout/CategoryMegaMenu";
// Nếu bạn có CartContext, import; nếu chưa có thì Header sẽ dùng prop cartCount
import { useCart } from "../context/CartContext";

/* =====================================
   Utilities
===================================== */
const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const onClick = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) handler?.();
        };
        const onKey = (e) => e.key === "Escape" && handler?.();
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [ref, handler]);
};

const useDebounce = (value, delay = 250) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

// Đọc user từ localStorage (fallback nếu chưa có AuthContext)
const getStoredUser = () => {
    const keys = ["user", "profile", "account"];
    for (const k of keys) {
        try {
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const obj = JSON.parse(typeof raw === "string" ? raw : String(raw));
            if (obj && typeof obj === "object") return obj;
        } catch { }
    }
    return null;
};

const getRoleSlug = (u) => {
    // Linh hoạt theo backend: role, role_id, roles[], is_admin,...
    const role =
        u?.role?.slug ||
        u?.role?.name ||
        u?.role ||
        (Array.isArray(u?.roles) ? u.roles[0] : null) ||
        (u?.is_admin ? "admin" : null) ||
        u?.role_id;

    const s = String(role || "").toLowerCase();
    if (["1", "admin", "administrator", "quản trị"].includes(s)) return "admin";
    return s || "user";
};

const getDisplayName = (u) => {
    const name = u?.name || u?.fullName || u?.fullname || `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
    const email = u?.email || "";
    if (name && name.trim()) return name.trim();
    return email || "Tài khoản";
};

const getShortName = (full) => {
    const s = String(full || "").trim();
    if (!s) return "User";
    const parts = s.split(/\s+/);
    if (parts.length === 1) return parts[0];
    // lấy tên cuối (phù hợp tên VN)
    return parts[parts.length - 1];
};

const getAvatarInitials = (full) => {
    const s = String(full || "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts[parts.length - 1]?.[0] || "";
    return (first + last).toUpperCase();
};

/* =====================================
   Atoms
===================================== */
const Badge = memo(({ value }) => {
    if (!value) return null;
    return (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
            {value > 99 ? "99+" : value}
        </span>
    );
});
Badge.displayName = "Badge";

const NavIcon = memo(({ icon: Icon, label, onClick, badge, active }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? "text-red-600" : "text-gray-600 hover:text-red-600"
            }`}
        aria-label={label}
    >
        <span className="relative">
            <Icon className="h-6 w-6" />
            <Badge value={badge} />
        </span>
        <span className="hidden sm:block truncate max-w-24">{label}</span>
    </button>
));
NavIcon.displayName = "NavIcon";

const Logo = () => (
    <Link to="/" aria-label="Trang chủ" className="shrink-0 select-none group">
        <span className="text-2xl font-extrabold tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
            BookStore<span className="text-gray-800">.com</span>
        </span>
    </Link>
);

/* =====================================
   Account Popover (Guest / User / Admin)
===================================== */
const AccountPopover = ({ open, onClose, onLogout, mode = "guest", user }) => {
    const popRef = useRef(null);
    const navigate = useNavigate();
    useClickOutside(popRef, onClose);
    if (!open) return null;

    const handleLogout = async () => {
        try {
            onClose?.();
            if (onLogout) {
                await onLogout();
                navigate("/");
            } else {
                navigate("/logout");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const name = getDisplayName(user);
    const email = user?.email;
    const avatarUrl = user?.avatar || user?.avatarUrl || user?.image || null;

    return (
        <div
            ref={popRef}
            role="menu"
            aria-label="Tài khoản"
            className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5"
        >
            {/* Header mini cho user/admin */}
            {mode !== "guest" && (
                <div className="flex items-center gap-3 pb-3 border-b">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={name}
                            className="h-10 w-10 rounded-full object-cover border"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold border">
                            {getAvatarInitials(name)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{name}</div>
                        {email ? <div className="text-xs text-gray-500 truncate">{email}</div> : null}
                    </div>
                </div>
            )}

            <div className="pt-3 space-y-3">
                {mode === "guest" && (
                    <>
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="block w-full text-center rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            onClick={onClose}
                            className="block w-full text-center rounded-xl border-2 border-red-600 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Đăng ký
                        </Link>
                        <div className="pt-2 border-t text-sm text-gray-600">
                            <ul className="grid grid-cols-2 gap-2">
                                <li>
                                    <Link to="/orders" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                        Đơn hàng
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/wishlist" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                        Yêu thích
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/support" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                        Hỗ trợ
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/settings" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                        Cài đặt
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {mode === "user" && (
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                            <Link to="/account" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Tài khoản
                            </Link>
                        </li>
                        <li>
                            <Link to="/orders" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Đơn hàng
                            </Link>
                        </li>
                        <li>
                            <Link to="/wishlist" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Yêu thích
                            </Link>
                        </li>
                        <li>
                            <Link to="/addresses" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Địa chỉ
                            </Link>
                        </li>
                        <li>
                            <Link to="/vouchers" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Phiếu giảm giá
                            </Link>
                        </li>
                        <li>
                            <Link to="/change-password" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Đổi mật khẩu
                            </Link>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-50 text-red-600 font-medium"
                            >
                                Đăng xuất
                            </button>
                        </li>
                    </ul>
                )}

                {mode === "admin" && (
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                            <Link to="/admin" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50 font-medium">
                                Quản lý
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/orders" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Đơn hàng
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/products" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Sản phẩm
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/users" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                                Người dùng
                            </Link>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-50 text-red-600 font-medium"
                            >
                                Đăng xuất
                            </button>
                        </li>
                    </ul>
                )}
            </div>
        </div>
    );
};

/* =====================================
   Language Dropdown
===================================== */
const LanguageDropdown = ({ open, onToggle, onChange, value = "vi" }) => (
    <div className="relative">
        <button
            type="button"
            onClick={onToggle}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
            <span className="flex h-6 w-9 items-center justify-center rounded-md border border-gray-200 bg-red-500 text-base leading-none">
                <span className="text-white" aria-hidden>
                    ★
                </span>
            </span>
            <FiChevronDown className="h-4 w-4 text-gray-500" />
        </button>
        {open && (
            <ul
                role="listbox"
                className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
                {[
                    { code: "vi", label: "Tiếng Việt" },
                    { code: "en", label: "English" },
                ].map((opt) => (
                    <li key={opt.code}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={value === opt.code}
                            onClick={() => onChange?.(opt.code)}
                            className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === opt.code ? "text-red-600 font-medium" : "text-gray-700"
                                }`}
                        >
                            {opt.label}
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

/* =====================================
   Search Bar (debounced + clear)
===================================== */
const SearchBar = ({ value, onChange, onSubmit, placeholder = "Tìm kiếm sản phẩm, tác giả..." }) => {
    const [local, setLocal] = useState(value);
    const debounced = useDebounce(local, 250);

    useEffect(() => {
        if (debounced !== value) onChange(debounced.trimStart());
    }, [debounced, value, onChange]);

    useEffect(() => setLocal(value), [value]);

    const clearable = useMemo(() => local.length > 0, [local]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
            className="relative flex-1"
            role="search"
            aria-label="Thanh tìm kiếm"
        >
            <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-20 text-[15px] text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder={placeholder}
            />
            {clearable && (
                <button
                    type="button"
                    onClick={() => setLocal("")}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-12 top-1.5 flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 active:scale-95 text-gray-500"
                >
                    <FiX className="h-4 w-4" />
                </button>
            )}
            <button
                type="submit"
                className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Tìm"
            >
                <FiSearch className="h-5 w-5" />
            </button>
        </form>
    );
};

/* =====================================
   Main Header
===================================== */
/**
 * @param {Object} props
 * @param {number} [props.cartCount=0]   - fallback nếu chưa có CartContext
 * @param {(q:string)=>void} [props.onSearch]
 * @param {() => Promise<void>|void} [props.onLogout] - callback xử lý logout (API, clear token…)
 * @param {(code:'vi'|'en')=>void} [props.onChangeLang]
 * @param {Object|null} [props.currentUser] - nếu bạn đã có AuthContext phía ngoài, truyền vào để override
 */
const Header = ({
    cartCount = 0,
    onSearch,
    onLogout,
    onChangeLang,
    currentUser = null,
}) => {
    const [shadow, setShadow] = useState(false);
    const [query, setQuery] = useState("");
    const [accountOpen, setAccountOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const accountWrapRef = useRef(null);

    const navigate = useNavigate();

    // Lấy số lượng từ context (nếu có), fallback về prop
    let countFromContext = cartCount;
    try {
        const { count } = useCart() || {};
        if (typeof count === "number") countFromContext = count;
    } catch {
        // nếu chưa có provider, dùng cartCount
    }

    // ==== Auth state (fallback từ localStorage nếu không truyền currentUser) ====
    const stored = currentUser || getStoredUser();
    const isAuthenticated = !!stored;
    const roleSlug = isAuthenticated ? getRoleSlug(stored) : "guest";
    const isAdmin = isAuthenticated && roleSlug === "admin";
    const displayName = isAuthenticated ? getShortName(getDisplayName(stored)) : "Tài khoản";

    useEffect(() => {
        const onScroll = () => setShadow(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useClickOutside(accountWrapRef, () => setAccountOpen(false));

    const submit = () => onSearch?.(query.trim());

    return (
        <header className={`sticky top-0 z-50 bg-white ${shadow ? "shadow-sm" : ""}`}>
            {/* Top promo bar */}
            <div className="hidden md:block bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 text-white">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex items-center justify-between py-1 text-xs">
                        <p className="opacity-95">🔥 Miễn phí vận chuyển cho đơn từ 299k</p>
                        <Link to="/promotions" className="underline/30 hover:underline">
                            Xem khuyến mãi
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main bar */}
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-3 md:px-4">
                    <div className="flex items-center gap-3 py-3 md:gap-6">
                        {/* Left: Logo + Category */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <Logo />
                            {CategoryMegaMenu ? (
                                <CategoryMegaMenu onNavigate={(path) => navigate(path)} />
                            ) : (
                                <button
                                    type="button"
                                    className="hidden sm:inline-flex items-center gap-1 rounded-xl p-2 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    aria-label="Danh mục"
                                >
                                    <HiOutlineSquares2X2 className="h-6 w-6" />
                                    <FiChevronDown className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Center: Search */}
                        <SearchBar value={query} onChange={setQuery} onSubmit={submit} />

                        {/* Right: Actions */}
                        <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
                            <NavIcon icon={FiBell} label="Thông báo" onClick={() => navigate("/notifications")} />
                            <NavIcon
                                icon={FiShoppingCart}
                                label="Giỏ hàng"
                                badge={countFromContext}
                                onClick={() => navigate("/cart")}
                            />

                            {/* Account + popover */}
                            <div className="relative" ref={accountWrapRef}>
                                <NavIcon
                                    icon={FiUser}
                                    label={displayName}
                                    onClick={() => setAccountOpen((v) => !v)}
                                    active={accountOpen}
                                />
                                <AccountPopover
                                    open={accountOpen}
                                    onClose={() => setAccountOpen(false)}
                                    onLogout={onLogout}
                                    mode={!isAuthenticated ? "guest" : isAdmin ? "admin" : "user"}
                                    user={stored || undefined}
                                />
                            </div>

                            {/* Language */}
                            <LanguageDropdown
                                open={langOpen}
                                onToggle={() => setLangOpen((v) => !v)}
                                onChange={(code) => {
                                    setLangOpen(false);
                                    onChangeLang?.(code);
                                }}
                                value="vi"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

