// src/components/layout/Header.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import {
  FiChevronDown,
  FiSearch,
  FiBell,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import summaryApi from "../common";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setUserDetails } from "../store/userSlice";
import { useCart } from "../context/CartContext";
import ChatLauncher from "./chatbot/ChatLauncher";

// ✅ import cố định theo cấu trúc dự án của bạn
import CategoryMegaMenu from "./layout/CategoryMegaMenu";

/* ================= Utils ================= */
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const onClick = (e) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target;
      if (!(target instanceof Node)) {
        handler?.();
        return;
      }
      if (!el.contains(target)) handler?.();
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

const useHoverIntent = ({ onOpen, onClose, openDelay = 40, closeDelay = 160 }) => {
  const openT = useRef(null);
  const closeT = useRef(null);
  const clearAll = () => {
    if (openT.current) {
      clearTimeout(openT.current);
      openT.current = null;
    }
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = null;
    }
  };
  const handleEnter = () => {
    clearAll();
    openT.current = setTimeout(() => onOpen?.(), openDelay);
  };
  const handleLeave = () => {
    clearAll();
    closeT.current = setTimeout(() => onClose?.(), closeDelay);
  };
  useEffect(() => () => clearAll(), []);
  return { handleEnter, handleLeave, clearAll };
};

const useDebounce = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ==== Auth helpers ====
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
  const name =
    u?.name ||
    u?.fullName ||
    u?.fullname ||
    `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
  const email = u?.email || "";
  if (name && name.trim()) return name.trim();
  return email || "Tài khoản";
};
const getShortName = (full) => {
  const s = String(full || "").trim();
  if (!s) return "Tài khoản";
  const parts = s.split(/\s+/);
  if (parts.length === 1) return parts[0];
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

/* ================= Atoms ================= */
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

/* ================= Account Popover ================= */
const AccountPopover = ({ open, onClose, mode = "guest", user }) => {
  const popRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useClickOutside(popRef, onClose);
  if (!open) return null;

  const safeGet = (k) => {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? parsed : raw;
    } catch {
      return raw;
    }
  };

  const handleLogout = async () => {
    try {
      onClose?.();
      const rt = safeGet("refresh_token") || safeGet("refreshToken") || undefined;
      const res = await fetch(summaryApi.url(summaryApi.auth.logout), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rt ? JSON.stringify({ refreshToken: rt }) : undefined,
      });
      let data = { success: false };
      try {
        data = await res.json();
      } catch { }
      ["access_token", "refresh_token", "token", "user", "profile", "account"].forEach(
        (k) => localStorage.removeItem(k)
      );
      dispatch(setUserDetails(null));
      if (res.ok && data?.success !== false) {
        toast.success(data?.message || "Đăng xuất thành công");
      } else {
        toast.info(data?.message || "Phiên đã hết hạn hoặc đã đăng xuất");
      }
      navigate("/");
    } catch (err) {
      ["access_token", "refresh_token", "token", "user", "profile", "account"].forEach(
        (k) => localStorage.removeItem(k)
      );
      dispatch(setUserDetails(null));
      toast.info("Đã dọn phiên cục bộ");
      navigate("/");
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
      className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-[fadeIn_.12s_ease-out]"
      style={{ transformOrigin: "top right" }}
    >
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
            {email ? (
              <div className="text-xs text-gray-500 truncate">{email}</div>
            ) : null}
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
          </>
        )}

        {mode === "user" && (
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <Link
                to="/account"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Tài khoản
              </Link>
            </li>
            <li>
              <Link
                to="/account/orders"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Đơn hàng
              </Link>
            </li>
            <li>
              <Link
                to="/account/wishlist"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Yêu thích
              </Link>
            </li>
            <li>
              <Link
                to="/account/addresses"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Địa chỉ
              </Link>
            </li>
            <li>
              <Link
                to="/account/vouchers"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Phiếu giảm giá
              </Link>
            </li>
            <li>
              <Link
                to="/account/security"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
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
              <Link
                to="/admin"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50 font-medium"
              >
                Bảng điều khiển
              </Link>
            </li>
            <li>
              <Link
                to="/admin/products"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Quản lý sản phẩm
              </Link>
            </li>
            <li>
              <Link
                to="/admin/orders"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Quản lý đơn hàng
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Quản lý người dùng
              </Link>
            </li>
            <li>
              <Link
                to="/admin/categories"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                Quản lý danh mục
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

/* ================= Language ================= */
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
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === opt.code
                ? "text-red-600 font-medium"
                : "text-gray-700"
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

/* ================= Search ================= */
const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Tìm kiếm sản phẩm, tác giả...",
}) => {
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

/* ================= Main Header ================= */
const Header = ({ onLogout, onChangeLang, currentUser = null }) => {
  const [shadow, setShadow] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navigate = useNavigate();

  // ✅ Lấy cartCount trực tiếp từ context
  const { cartCount } = useCart();

  // Khi bấm tìm → điều hướng tới /search?q=...
  const submitSearch = () => {
    const q = (query || "").trim();
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

  // Auth state
  const stored = currentUser || getStoredUser();
  const isAuthenticated = !!stored;
  const roleSlug = isAuthenticated ? getRoleSlug(stored) : "guest";
  const isAdmin = isAuthenticated && roleSlug === "admin";
  const displayName = isAuthenticated
    ? getShortName(getDisplayName(stored))
    : "Tài khoản";

  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountWrapRef = useRef(null);
  const openAccount = useCallback(() => setAccountOpen(true), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const { handleEnter, handleLeave } = useHoverIntent({
    onOpen: openAccount,
    onClose: closeAccount,
  });
  useClickOutside(accountWrapRef, () => setAccountOpen(false));

  const onAccountFocusIn = () => setAccountOpen(true);
  const onAccountFocusOut = (e) => {
    if (!accountWrapRef.current?.contains(e.relatedTarget)) {
      setAccountOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white ${shadow ? "shadow-sm" : ""
        }`}
    >
      {/* Top promo */}
      <div className="hidden md:block bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-1 text-xs">
            <p className="opacity-95">
              🔥 Miễn phí vận chuyển cho đơn từ 299k
            </p>
            <Link
              to="/promotions"
              className="underline/30 hover:underline"
            >
              Xem khuyến mãi
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-3 md:px-4">
          <div className="flex items-center gap-3 py-3 md:gap-6">
            {/* Left */}
            <div className="flex items-center gap-3 md:gap-4">
              <Logo />
              <CategoryMegaMenu
                onNavigate={(path) => navigate(path)}
              />
            </div>

            {/* Center */}
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={submitSearch}
            />

            {/* Right */}
            <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
              <NavIcon
                icon={FiBell}
                label="Thông báo"
                onClick={() => navigate("/notifications")}
              />

              {/* ✅ Badge hiển thị cartCount */}
              <NavIcon
                icon={FiShoppingCart}
                label="Giỏ hàng"
                badge={cartCount}
                onClick={() => navigate("/cart")}
              />

              {/* Account wrapper */}
              <div
                className="relative"
                ref={accountWrapRef}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onFocus={onAccountFocusIn}
                onBlur={onAccountFocusOut}
              >
                <NavIcon
                  icon={FiUser}
                  label={displayName}
                  onClick={() =>
                    setAccountOpen((v) => !v)
                  }
                  active={accountOpen}
                />
                <AccountPopover
                  open={accountOpen}
                  onClose={() => setAccountOpen(false)}
                  mode={
                    !isAuthenticated
                      ? "guest"
                      : isAdmin
                        ? "admin"
                        : "user"
                  }
                  user={stored || undefined}
                />
              </div>

              {/* Language */}
              <LanguageDropdown
                open={langOpen}
                onToggle={() =>
                  setLangOpen((v) => !v)
                }
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

      {/* Chatbot launcher (nếu bạn đang dùng) */}
      <ChatLauncher />
    </header>
  );
};

export default Header;
