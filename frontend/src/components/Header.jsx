import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { FiChevronDown, FiSearch, FiBell, FiShoppingCart, FiUser, FiX } from "react-icons/fi";
import CategoryMegaMenu from "./CategoryMegaMenu";// ⬅️ THÊM: đường dẫn tùy bạn
import { useNavigate } from "react-router-dom";     
import { useCart } from "../context/CartContext";

/*************************
 * Small Utilities 
 *************************/
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") handler?.();
    };
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

/*************************
 * Base UI Atoms
 *************************/
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
    className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
    aria-label={label}
  >
    <span className="relative">
      <Icon className="h-6 w-6" />
      <Badge value={badge} />
    </span>
    <span className="hidden sm:block">{label}</span>
  </button>
));
NavIcon.displayName = "NavIcon";

const Logo = () => (
  <a href="#" className="shrink-0 select-none group">
    <span className="text-2xl font-extrabold tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
      BookStore<span className="text-gray-900 dark:text-white">.com</span>
    </span>
  </a>
);

/*************************
 * Popovers
 *************************/
const AccountPopover = ({ open, onClose, onSignIn, onSignUp }) => {
  const popRef = useRef(null);
  useClickOutside(popRef, onClose);
  if (!open) return null;
  return (
    <div
      ref={popRef}
      role="menu"
      aria-label="Tài khoản"
      className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:border-neutral-800"
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSignIn}
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={onSignUp}
          className="w-full rounded-xl border-2 border-red-600 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Đăng ký
        </button>
        <div className="pt-2 border-t text-sm text-gray-600 dark:text-gray-300">
          <ul className="grid grid-cols-2 gap-2">
            {/* ⬇️ Sửa class lỗi dark:hover:bg-neutral-8 00 -> 800 */}
            <li><a href="#" className="block rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Đơn hàng</a></li>
            <li><a href="#" className="block rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Yêu thích</a></li>
            <li><a href="#" className="block rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Cài đặt</a></li>
            <li><a href="#" className="block rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Đăng xuất</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const LanguageDropdown = ({ open, onToggle, onChange, value = "vi" }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="listbox"
      aria-expanded={open}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-200"
    >
      <span className="flex h-6 w-9 items-center justify-center rounded-md border border-gray-200 bg-red-500 text-base leading-none">
        <span className="text-white" aria-hidden>★</span>
      </span>
      <FiChevronDown className="h-4 w-4 text-gray-500" />
    </button>
    {open && (
      <ul role="listbox" className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:bg-neutral-900 dark:border-neutral-800">
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
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 ${value === opt.code ? "text-red-600 font-medium" : "text-gray-700 dark:text-gray-200"}`}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/*************************
 * Search Bar
 *************************/
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
        className="h-11 w-full rounded-xl border border-gray-300 bg-white/90 pl-4 pr-20 text-[15px] text-gray-800 placeholder:text-gray-400 backdrop-blur focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-800"
        placeholder={placeholder}
      />
      {clearable && (
        <button
          type="button"
          onClick={() => setLocal("")}
          aria-label="Xóa tìm kiếm"
          className="absolute right-12 top-1.5 flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 active:scale-95 text-gray-500 dark:hover:bg-neutral-800"
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

/*************************
 * Main Header
 *************************/
const Header = ({
  cartCount = 2,
  onSearch,
  onOpenCart,
  onSignIn,
  onSignUp,
  onChangeLang,
}) => {
  const [shadow, setShadow] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const accountWrapRef = useRef(null);

  // router navigate
  const navigate = useNavigate();
  const { count } = useCart(); // ⬅️ lấy số lượng từ context

  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useClickOutside(accountWrapRef, () => setAccountOpen(false));

  const submit = () => onSearch?.(query.trim());

  return (
    <header className={`sticky top-0 z-50 transition-shadow ${shadow ? "shadow-[0_1px_0_0_#0000000F]" : ""}`}>
      {/* Top mini bar */}
      <div className="hidden md:block bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-1 text-xs">
            <p className="opacity-95">🔥 Miễn phí vận chuyển cho đơn từ 299k</p>
            <a href="#" className="underline/30 hover:underline">Xem khuyến mãi</a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="supports-[backdrop-filter]:bg-white/75 bg-white dark:bg-neutral-950 backdrop-blur border-b border-gray-100 dark:border-neutral-900">
        <div className="mx-auto max-w-7xl px-3 md:px-4">
          <div className="flex items-center gap-3 py-3 md:gap-6">
            {/* Left: Logo + Category mega menu */}
            <div className="flex items-center gap-3 md:gap-4">
              <Logo />
              {/* ⬇️ Thay nút cũ bằng Mega Menu */}
              <CategoryMegaMenu
                onNavigate={(path) => navigate(path)}
              />
            </div>

            {/* Center: Search */}
            <SearchBar value={query} onChange={setQuery} onSubmit={submit} />

            {/* Right: Actions */}
            <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
              <NavIcon icon={FiBell} label="Thông Báo" badge={3} />
              <NavIcon icon={FiShoppingCart} label="Giỏ Hàng" badge={count} onClick={() => navigate("/cart")} />

              {/* Account + popover */}
              <div className="relative" ref={accountWrapRef}>
                <NavIcon
                  icon={FiUser}
                  label="Tài khoản"
                  onClick={() => setAccountOpen((v) => !v)}
                  active={accountOpen}
                />
                <AccountPopover
                  open={accountOpen}
                  onClose={() => setAccountOpen(false)}
                  onSignIn={() => {
                    setAccountOpen(false);
                    onSignIn?.();
                  }}
                  onSignUp={() => {
                    setAccountOpen(false);
                    onSignUp?.();
                  }}
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
