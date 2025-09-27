import React, { useEffect, useRef, useState, memo } from 'react'
import { HiOutlineSquares2X2 } from 'react-icons/hi2'
import { FiChevronDown, FiSearch, FiBell, FiShoppingCart, FiUser } from 'react-icons/fi'
import { Link } from "react-router-dom";

// ===== Helpers =====
const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const onClick = (e) => {
            if (!ref.current) return
            if (!ref.current.contains(e.target)) handler?.()
        }
        const onKey = (e) => { if (e.key === 'Escape') handler?.() }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [ref, handler])
}

const Badge = memo(({ value }) => {
    if (!value) return null
    return (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
            {value > 99 ? '99+' : value}
        </span>
    )
})

const NavIcon = memo(({ icon: Icon, label, onClick, badge, active }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm transition-colors ${active ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
        aria-label={label}
    >
        <span className="relative">
            <Icon className="h-6 w-6" />
            <Badge value={badge} />
        </span>
        <span className="hidden sm:block">{label}</span>
    </button>
))

const AccountPopover = ({ open, onClose }) => {
    const popRef = useRef(null);
    useClickOutside(popRef, onClose);
    if (!open) return null;
    return (
        <div
            ref={popRef}
            role="menu"
            aria-label="Tài khoản"
            className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
        >
            <div className="space-y-3">
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
            </div>
        </div>
    )
}

const LanguageDropdown = ({ open, onToggle, onChange, value = 'vi' }) => (
    <div className="relative">
        <button
            type="button"
            onClick={onToggle}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
            <span className="flex h-6 w-9 items-center justify-center rounded-md border border-gray-200 bg-red-500 text-base leading-none">
                <span className="text-white" aria-hidden>★</span>
            </span>
            <FiChevronDown className="h-4 w-4 text-gray-500" />
        </button>
        {open && (
            <ul role="listbox" className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {[{ code: 'vi', label: 'Tiếng Việt' }, { code: 'en', label: 'English' }].map(opt => (
                    <li key={opt.code}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={value === opt.code}
                            onClick={() => onChange?.(opt.code)}
                            className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === opt.code ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                        >{opt.label}</button>
                    </li>
                ))}
            </ul>
        )}
    </div>
)

const Logo = () => (
    <Link to="/" className="shrink-0 select-none" aria-label="Trang chủ">
        <span className="text-2xl font-extrabold tracking-tight text-red-600">
            BookStore<span className="text-gray-800">.com</span>
        </span>
    </Link>
);

// ===== Main Component =====
const Header = ({
    cartCount = 2,
    onSearch,
    onOpenCart,
    onSignIn,
    onSignUp,
    onChangeLang,
}) => {
    const [shadow, setShadow] = useState(false)
    const [query, setQuery] = useState('')
    const [accountOpen, setAccountOpen] = useState(false)
    const [langOpen, setLangOpen] = useState(false)
    const accountWrapRef = useRef(null)

    useEffect(() => {
        const onScroll = () => setShadow(window.scrollY > 4)
        onScroll()
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useClickOutside(accountWrapRef, () => setAccountOpen(false))

    const submit = (e) => {
        e.preventDefault()
        onSearch?.(query.trim())
    }

    return (
        <header className={`sticky top-0 z-50 bg-white ${shadow ? 'shadow-sm' : ''}`}>
            <div className="mx-auto max-w-7xl px-3 md:px-4">
                <div className="flex items-center gap-3 py-3 md:gap-6">
                    {/* Left: Logo + Category trigger */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <Logo />
                        <button
                            type="button"
                            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-transparent bg-transparent p-2 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Danh mục"
                        >
                            <HiOutlineSquares2X2 className="h-6 w-6" />
                            <FiChevronDown className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Center: Search */}
                    <form onSubmit={submit} className="relative flex-1">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-14 text-[15px] text-gray-700 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            placeholder="Mua Đồ"
                            aria-label="Tìm kiếm"
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Tìm"
                        >
                            <FiSearch className="h-5 w-5" />
                        </button>
                    </form>

                    {/* Right: Actions */}
                    <div className="ml-auto flex items-end gap-2 sm:gap-4 md:gap-6">
                        <NavIcon icon={FiBell} label="Thông Báo" badge={3} />
                        <NavIcon icon={FiShoppingCart} label="Giỏ Hàng" badge={cartCount} onClick={onOpenCart} />

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
                                onSignIn={() => { setAccountOpen(false); onSignIn?.() }}
                                onSignUp={() => { setAccountOpen(false); onSignUp?.() }}
                            />
                        </div>

                        {/* Language button */}
                        <LanguageDropdown
                            open={langOpen}
                            onToggle={() => setLangOpen((v) => !v)}
                            onChange={(code) => { setLangOpen(false); onChangeLang?.(code) }}
                            value="vi"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
