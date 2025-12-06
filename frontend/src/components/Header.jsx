// src/components/layout/Header.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import {
  FiChevronDown,
  FiSearch,
  FiBell,
  FiShoppingCart,
  FiUser,
  FiX,
  FiBookOpen,
  FiMenu,
  FiLogOut,
  FiChevronRight,
  FiHome,
  FiLayers
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import summaryApi from "../common";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setUserDetails } from "../store/userSlice";
import { useCart } from "../context/CartContext";
import ChatLauncher from "./chatbot/ChatLauncher";

// ✅ import cố định
import CategoryMegaMenu from "./layout/CategoryMegaMenu";

/* ================= Utils & Auth Helpers (Giữ nguyên) ================= */
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const onClick = (e) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target)) handler?.();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, handler]);
};

const useHoverIntent = ({ onOpen, onClose, openDelay = 40, closeDelay = 160 }) => {
  const openT = useRef(null);
  const closeT = useRef(null);
  const clearAll = () => {
    if (openT.current) clearTimeout(openT.current);
    if (closeT.current) clearTimeout(closeT.current);
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

const getStoredUser = () => {
  const keys = ["user", "profile", "account"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
};
const getRoleSlug = (u) => {
    // ... logic cũ
    return u?.is_admin ? "admin" : "user"; 
};
const getDisplayName = (u) => u?.name || u?.fullName || "Tài khoản";
const getShortName = (full) => full?.split(" ").pop() || "Tài khoản";
const getAvatarInitials = (full) => (full?.[0] || "U").toUpperCase();

/* ================= Components Con (Badge, NavIcon, Logo...) ================= */
const Badge = memo(({ value }) => {
  if (!value) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
      {value > 99 ? "99+" : value}
    </span>
  );
});

const NavIcon = memo(({ icon: Icon, label, onClick, badge, active }) => (
  <button
    onClick={onClick}
    className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
  >
    <span className="relative">
      <Icon className="h-6 w-6" />
      <Badge value={badge} />
    </span>
    <span className="hidden sm:block truncate max-w-24">{label}</span>
  </button>
));

const Logo = () => (
  <Link to="/" className="shrink-0 select-none group">
    <span className="text-2xl font-extrabold tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
      BookStore<span className="text-gray-800">.com</span>
    </span>
  </Link>
);

/* ================= Account Popover (Desktop) ================= */
const AccountPopover = ({ open, onClose, mode, user }) => {
  // ... Code cũ giữ nguyên
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const popRef = useRef(null);
  useClickOutside(popRef, onClose);
  
  const handleLogout = () => { /* Logic logout cũ */ };

  if (!open) return null;
  return (
    <div ref={popRef} className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl animate-[fadeIn_.1s_ease-out]">
        {/* ... Nội dung popover cũ ... */}
        {/* Để ngắn gọn tôi ẩn bớt nội dung lặp lại, giữ nguyên logic cũ của bạn ở đây */}
        <div className="text-center text-gray-500">Menu tài khoản...</div>
    </div>
  );
};

/* ================= Component Accordion Item cho Mobile ================= */
const MobileAccordionItem = ({ title, icon: Icon, link, children, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggle = (e) => {
    if (children) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (link) {
      navigate(link);
      onClose();
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-none">
      <div 
        onClick={handleToggle}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
      >
        <div className="flex items-center gap-3 text-gray-700 font-medium">
          {Icon && <Icon className="text-lg text-gray-400" />}
          <span>{title}</span>
        </div>
        {children && (
          <FiChevronDown 
            className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
          />
        )}
      </div>
      
      {/* Sub-menu Animation */}
      <div 
        className={`bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="py-2 pl-4">
            {children}
        </div>
      </div>
    </div>
  );
};

/* ================= Mobile Sidebar (Đã Sửa Theo Mẫu) ================= */
const MobileSidebar = ({ open, onClose, user, onLogout, blogCategories }) => {
  // State để lưu danh mục sách (nếu cần fetch động)
  const [productCategories, setProductCategories] = useState([]);

  useEffect(() => {
    if (open) {
      // Fetch danh mục sản phẩm khi mở menu (để menu "Sách" có dữ liệu sổ xuống)
      const fetchCats = async () => {
        try {
          const res = await fetch(summaryApi.url(summaryApi.categoryProduct.url));
          const json = await res.json();
          if (json.success) setProductCategories(json.data || []);
        } catch (e) { console.error(e); }
      };
      fetchCats();
    }
  }, [open]);

  const displayName = user ? getDisplayName(user) : "Khách";
  const avatarUrl = user?.avatar || user?.image;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer Container */}
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white z-[61] shadow-2xl transition-transform duration-300 transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* 1. Header Sidebar (Giống ảnh mẫu nhưng màu Đỏ) */}
          <div className="bg-red-700 text-white pt-8 pb-6 px-4 flex flex-col items-center justify-center">
             {/* Avatar */}
             <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mb-3 overflow-hidden">
                {user ? (
                   avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avt" /> : <span className="text-2xl font-bold">{getAvatarInitials(displayName)}</span>
                ) : (
                   <FiUser className="text-3xl" />
                )}
             </div>

             {/* Links Login/Register or Name */}
             {user ? (
               <div className="text-center">
                 <p className="font-bold text-lg mb-1">{displayName}</p>
                 <Link to="/account" onClick={onClose} className="text-sm text-white/80 hover:text-white underline">Quản lý tài khoản</Link>
               </div>
             ) : (
               <div className="flex items-center gap-1 text-sm font-semibold tracking-wide">
                 <Link to="/login" onClick={onClose} className="hover:underline hover:text-red-100 px-2 py-1">Đăng nhập</Link>
                 <span className="opacity-50">|</span>
                 <Link to="/register" onClick={onClose} className="hover:underline hover:text-red-100 px-2 py-1">Đăng ký</Link>
               </div>
             )}
          </div>

          {/* 2. Menu List (Accordion Style) */}
          <div className="flex-1 overflow-y-auto">
            
            {/* Trang chủ */}
            <MobileAccordionItem 
              title="Trang chủ" 
              link="/" 
              onClose={onClose} 
            />

            {/* Sách (Có sổ xuống) */}
            <MobileAccordionItem title="Sách & Danh mục">
               <Link to="/books" onClick={onClose} className="block px-4 py-3 text-sm text-red-600 font-semibold border-l-2 border-red-600 bg-red-50 mb-1">
                 Xem tất cả sách
               </Link>
               {productCategories.slice(0, 8).map(cat => (
                 <Link 
                    key={cat._id || cat.id} 
                    to={`/product-category/${cat._id}`} 
                    onClick={onClose}
                    className="block px-4 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-white transition"
                 >
                   {cat.categoryName || cat.name}
                 </Link>
               ))}
            </MobileAccordionItem>

            {/* Blog (Có sổ xuống) */}
            <MobileAccordionItem title="Blog & Tin tức">
               <Link to="/blog" onClick={onClose} className="block px-4 py-3 text-sm text-red-600 font-semibold border-l-2 border-red-600 bg-red-50 mb-1">
                 Trang chủ Blog
               </Link>
               {blogCategories.map(cat => (
                  <Link 
                    key={cat.id} 
                    to={`/blog?category_id=${cat.id}`} 
                    onClick={onClose}
                    className="block px-4 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-white transition"
                  >
                    {cat.name}
                  </Link>
               ))}
            </MobileAccordionItem>

            {/* Các mục khác */}
            <MobileAccordionItem title="Về chúng tôi" link="/about" onClose={onClose} />
            <MobileAccordionItem title="Liên hệ" link="/contact" onClose={onClose} />
          
          </div>

          {/* 3. Footer Sidebar (Logout) */}
          {user && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => { onLogout(); onClose(); }} 
                className="flex items-center justify-center gap-2 w-full py-3 text-gray-600 font-medium hover:text-red-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
              >
                <FiLogOut /> Đăng xuất
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

/* ================= Main Header ================= */
const Header = ({ onLogout, onChangeLang, currentUser = null }) => {
  const [shadow, setShadow] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  // State Mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Data
  const [blogCategories, setBlogCategories] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartCount } = useCart();

  useEffect(() => {
    const fetchBlogCats = async () => {
      try {
        const res = await fetch(summaryApi.url(summaryApi.blogCategories.list));
        const json = await res.json();
        if (json.success) {
          const hiddenCats = ["Trang Tĩnh", "System", "Footer Links", "Chưa phân loại"];
          setBlogCategories((json.items || []).filter(c => !hiddenCats.includes(c.name)));
        }
      } catch (err) {}
    };
    fetchBlogCats();
  }, []);

  const submitSearch = () => {
    const q = (query || "").trim();
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setShowMobileSearch(false);
  };

  const stored = currentUser || getStoredUser();
  const isAuthenticated = !!stored;
  
  // Xử lý scroll
  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Xử lý Logout
  const handleLogoutMobile = async () => {
      // ... logic logout
      ["access_token", "refresh_token", "token", "user", "profile", "account"].forEach(k => localStorage.removeItem(k));
      dispatch(setUserDetails(null));
      toast.success("Đăng xuất thành công");
      navigate("/");
  };

  // Popover logic (Desktop)
  const accountWrapRef = useRef(null);
  const { handleEnter, handleLeave } = useHoverIntent({
    onOpen: () => setAccountOpen(true),
    onClose: () => setAccountOpen(false),
  });

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white ${shadow ? "shadow-md" : "border-b border-gray-100"}`}>
        {/* === MOBILE HEADER === */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white relative">
            <button onClick={() => setMobileMenuOpen(true)} className="text-gray-700 hover:text-red-600 p-1">
               <FiMenu className="text-2xl" />
            </button>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
               <Logo />
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowMobileSearch(!showMobileSearch)} className={`text-2xl transition ${showMobileSearch ? 'text-red-600' : 'text-gray-700'}`}>
                    {showMobileSearch ? <FiX /> : <FiSearch />}
                </button>
                <Link to="/cart" className="relative text-gray-700 hover:text-red-600">
                    <FiShoppingCart className="text-2xl" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                    </span>
                </Link>
            </div>
        </div>

        {/* Mobile Search Expand */}
        {showMobileSearch && (
            <div className="md:hidden px-4 pb-4 pt-1 bg-white border-b animate-[fadeIn_.2s_ease-out]">
               <div className="relative">
                 <input 
                    autoFocus 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                    placeholder="Tìm sách..." 
                    className="w-full h-10 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                 />
                 <button onClick={submitSearch} className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-red-600">
                    <FiSearch />
                 </button>
               </div>
            </div>
        )}

        {/* === DESKTOP HEADER (Giữ nguyên như cũ) === */}
        <div className="hidden md:block">
           {/* Top Promo */}
           <div className="bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 text-white text-xs py-1">
              <div className="mx-auto max-w-7xl px-4 flex justify-between">
                  <span className="opacity-95">🔥 Miễn phí vận chuyển cho đơn từ 299k</span>
                  <Link to="/promotions" className="hover:underline">Xem khuyến mãi</Link>
              </div>
           </div>

           {/* Main Bar */}
           <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
              <Logo />
              <CategoryMegaMenu onNavigate={navigate} />
              
              {/* Blog Menu Desktop */}
              <div className="relative group hidden lg:block">
                <Link to="/blog" className="flex items-center gap-1 font-medium text-gray-700 hover:text-red-600 transition px-2 py-4">
                  <FiBookOpen /> <span>Blog</span> <FiChevronDown />
                </Link>
                {/* Dropdown Blog Desktop */}
                <div className="absolute top-full left-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                   <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                      {blogCategories.map(cat => (
                        <Link key={cat.id} to={`/blog?category_id=${cat.id}`} className="block px-4 py-2 hover:bg-gray-50 hover:text-red-600 text-sm text-gray-600">
                           {cat.name}
                        </Link>
                      ))}
                   </div>
                </div>
              </div>

              {/* Search Desktop */}
              <div className="flex-1 relative">
                 <input 
                    value={query} onChange={(e) => setQuery(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                    className="w-full h-11 pl-4 pr-12 rounded-xl border border-gray-300 focus:border-red-500 focus:outline-none"
                    placeholder="Tìm kiếm sản phẩm, tác giả..."
                 />
                 <button onClick={submitSearch} className="absolute right-1 top-1 h-9 w-12 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700">
                    <FiSearch />
                 </button>
              </div>

              {/* Right Icons Desktop */}
              <div className="flex items-end gap-5 ml-auto">
                 <NavIcon icon={FiBell} label="Thông báo" onClick={() => navigate("/notifications")} />
                 <NavIcon icon={FiShoppingCart} label="Giỏ hàng" badge={cartCount} onClick={() => navigate("/cart")} />
                 
                 <div ref={accountWrapRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="relative">
                    <NavIcon icon={FiUser} label={isAuthenticated ? getShortName(getDisplayName(stored)) : "Tài khoản"} onClick={() => setAccountOpen(v => !v)} active={accountOpen} />
                    <AccountPopover open={accountOpen} onClose={() => setAccountOpen(false)} mode={!isAuthenticated ? "guest" : stored?.role === "ADMIN" ? "admin" : "user"} user={stored} />
                 </div>
              </div>
           </div>
        </div>

        <ChatLauncher />
      </header>

      {/* Sidebar Mobile Component */}
      <MobileSidebar 
          open={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          user={stored}
          onLogout={handleLogoutMobile}
          blogCategories={blogCategories}
      />
    </>
  );
};

export default Header;