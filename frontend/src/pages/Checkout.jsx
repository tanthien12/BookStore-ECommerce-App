import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../helpers/productHelper";
import { orderApi } from "../api/orderApi";
import useVNAddress from "../hooks/useVNAddress";

// Lấy user từ localStorage (backend auth sau này có thể thay bằng /me)
const getUserFromStorage = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

const Field = ({ label, required, children, hint }) => (
    <label className="block">
        <div className="flex items-center justify-between">
            <span className="block text-sm text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            {hint && <span className="text-xs text-gray-400">{hint}</span>}
        </div>
        <div className="mt-1">{children}</div>
    </label>
);

export default function Checkout() {
    const navigate = useNavigate();
    const user = getUserFromStorage();
    const { cart, subtotal, clearCart } = useCart();

    // địa chỉ chọn theo dropdown
    const [provinceCode, setProvinceCode] = useState("");
    const [districtCode, setDistrictCode] = useState("");
    const [wardName, setWardName] = useState("");

    // lấy dữ liệu địa chỉ từ backend
    const { provinces, districts, wards, fetchDistricts, fetchWards } =
        useVNAddress();

    // form chung
    const [form, setForm] = useState({
        full_name: user?.name || "",
        email: user?.email || "",
        phone: "",
        address_line1: "", // số nhà, tên đường
        address_line2: "",
        note: "",
        shipping: "standard", // standard | express
        payment: "cod", // cod | bank | qr
        need_invoice: false,
        tax_email: "",
    });

    const [coupon, setCoupon] = useState("");
    const [couponMsg, setCouponMsg] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // ======== Derived data (shipping fee, discount, total) ========
    const canSuggestShipping = useMemo(
        () =>
            !!(
                form.address_line1 &&
                provinceCode &&
                districtCode &&
                wardName
            ),
        [form.address_line1, provinceCode, districtCode, wardName]
    );

    const shippingFee = useMemo(() => {
        if (!canSuggestShipping) return 0;
        return form.shipping === "express" ? 30000 : 0;
        // sau này bạn có thể tính phí theo tỉnh/thành
    }, [form.shipping, canSuggestShipping]);

    const discount = useMemo(() => {
        if (coupon.trim().toUpperCase() === "GIAM10") {
            return Math.round(subtotal * 0.1);
        }
        return 0;
    }, [coupon, subtotal]);

    const total = useMemo(
        () => Math.max(0, subtotal - discount + shippingFee),
        [subtotal, discount, shippingFee]
    );

    const disabled = submitting || cart.length === 0;

    // ======== Helpers ========
    const set = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const applyCoupon = (e) => {
        e.preventDefault();
        if (coupon.trim().toUpperCase() === "GIAM10") {
            setCouponMsg("Áp dụng thành công: -10%");
        } else {
            setCouponMsg("Mã không hợp lệ");
        }
    };

    // ======== Lấy tên tỉnh / quận hiện chọn để đưa lên backend ========
    const selectedProvinceName =
        provinces.find((p) => p.code === provinceCode)?.name || "";

    const selectedDistrictName =
        districts.find((d) => d.code === districtCode)?.name || "";

    // ======== Validate ========
    const validate = () => {
        const e = {};

        if (!form.full_name.trim()) e.full_name = "Vui lòng nhập họ tên";
        if (!/^\S+@\S+\.\S+$/.test(form.email))
            e.email = "Email không hợp lệ";
        if (!/^\d{9,11}$/.test(form.phone))
            e.phone = "Số điện thoại 9–11 chữ số";

        if (!form.address_line1.trim())
            e.address_line1 = "Nhập số nhà, tên đường";

        if (!provinceCode) e.province = "Chọn tỉnh/thành";
        if (!districtCode) e.district = "Chọn quận/huyện";
        if (!wardName) e.ward = "Chọn phường/xã";

        if (
            form.need_invoice &&
            !/^\S+@\S+\.\S+$/.test(form.tax_email)
        ) {
            e.tax_email = "Email nhận hoá đơn không hợp lệ";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ======== Submit / Place Order ========
    const placeOrder = async () => {
        if (!validate()) return;
        setSubmitting(true);

        try {
            // snapshot địa chỉ giao hàng để đúng với cột shipping_address JSONB trong bảng "order"
            const shippingAddress = {
                full_name: form.full_name,
                phone: form.phone,
                email: form.email,
                address_line1: form.address_line1,
                address_line2: form.address_line2 || "",
                ward: wardName,
                district: selectedDistrictName,
                province: selectedProvinceName,
                country: "Việt Nam",
            };

            // Build payload đúng với schema backend bạn mô tả
            const payload = {
                order: {
                    user_id: user?.id || null,
                    status: "pending",

                    subtotal: subtotal,
                    discount_total: discount,
                    shipping_fee: shippingFee,
                    grand_total: total,

                    shipping_address: shippingAddress,
                    shipping_method:
                        form.shipping === "express" ? "express" : "standard",
                    tracking_number: null,

                    placed_at: new Date().toISOString(),

                    note: form.note || null,
                },

                items: cart.map((c) => ({
                    book_id: c.productId, // id sách trong DB
                    quantity: c.qty,
                    price_snapshot: c.price, // chụp lại giá tại thời điểm đặt
                })),

                payment: {
                    method: form.payment, // "cod" | "bank" | "qr"
                    status:
                        form.payment === "cod" ? "unpaid" : "pending",
                    amount_paid: 0,
                    currency: "VND",
                    transaction_id: null,
                },

                // nếu có coupon
                coupon:
                    discount > 0
                        ? {
                            code: coupon.trim().toUpperCase(),
                            discount_amount: discount,
                        }
                        : null,

                invoice:
                    form.need_invoice === true
                        ? {
                            email: form.tax_email,
                        }
                        : null,
            };

            // gọi API backend tạo order
            const created = await orderApi.create(payload);

            // Lưu nháp để trang success show cho người dùng
            localStorage.setItem(
                "order_draft",
                JSON.stringify({
                    orderId:
                        created?.data?.order_id ||
                        created?.data?.id ||
                        null,
                    total,
                    payment_method: form.payment,
                    shipping_method: form.shipping,
                    address: shippingAddress,
                    items: cart,
                })
            );

            // clear cart local
            clearCart();

            // điều hướng sang trang thành công
            navigate("/checkout/success", { replace: true });
        } catch (err) {
            console.error("placeOrder error:", err);
            alert(
                err?.response?.data?.message ||
                err?.message ||
                "Đặt hàng thất bại, vui lòng thử lại."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-3 md:px-4 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            {/* LEFT */}
            <div className="space-y-4">
                {/* 1. Tài khoản */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Tài khoản
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        {user ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                                        {user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to="/logout"
                                    className="text-sm text-red-600"
                                >
                                    Đăng xuất
                                </Link>
                            </>
                        ) : (
                            <div className="text-sm text-gray-600">
                                Bạn chưa đăng nhập.{" "}
                                <Link
                                    to="/login"
                                    className="text-red-600 underline"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. Địa chỉ giao hàng */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Thông tin giao hàng
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <Field label="Họ và tên" required>
                                <input
                                    value={form.full_name}
                                    onChange={(e) => set("full_name", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/5"
                                />
                            </Field>
                            {errors.full_name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.full_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Field label="Số điện thoại" required>
                                <input
                                    value={form.phone}
                                    onChange={(e) => set("phone", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="09xxxxxxxx"
                                />
                            </Field>
                            {errors.phone && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <Field label="Email" required>
                                <input
                                    value={form.email}
                                    onChange={(e) => set("email", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="you@example.com"
                                />
                            </Field>
                            {errors.email && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <Field label="Số nhà, tên đường" required>
                                <input
                                    value={form.address_line1}
                                    onChange={(e) => set("address_line1", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                            </Field>
                            {errors.address_line1 && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.address_line1}
                                </p>
                            )}
                        </div>

                        {/* Dropdown Tỉnh/Thành */}
                        <div>
                            <Field label="Tỉnh / Thành phố" required>
                                <select
                                    value={provinceCode}
                                    onChange={(e) => {
                                        const newProvince = e.target.value;
                                        setProvinceCode(newProvince);
                                        setDistrictCode("");
                                        setWardName("");
                                        fetchDistricts(newProvince); // load quận/huyện theo tỉnh
                                    }}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                                >
                                    <option value="">-- Chọn tỉnh/thành --</option>
                                    {provinces.map((p) => (
                                        <option key={p.code} value={p.code}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {errors.province && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.province}
                                </p>
                            )}
                        </div>

                        {/* Dropdown Quận/Huyện */}
                        <div>
                            <Field label="Quận / Huyện" required>
                                <select
                                    value={districtCode}
                                    onChange={(e) => {
                                        const newDistrict = e.target.value;
                                        setDistrictCode(newDistrict);
                                        setWardName("");
                                        fetchWards(provinceCode, newDistrict); // load phường/xã theo quận
                                    }}
                                    disabled={!provinceCode}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">-- Chọn quận/huyện --</option>
                                    {districts.map((d) => (
                                        <option key={d.code} value={d.code}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            {errors.district && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.district}
                                </p>
                            )}
                        </div>

                        {/* Dropdown Phường/Xã */}
                        <div>
                            <Field label="Phường / Xã" required>
                                <select
                                    value={wardName}
                                    onChange={(e) => setWardName(e.target.value)}
                                    disabled={!districtCode}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">-- Chọn phường/xã --</option>
                                    {wards.map((w) => (
                                        <option key={w.code} value={w.name}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            {errors.ward && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.ward}
                                </p>
                            )}
                        </div>

                        <div>
                            <Field label="Địa chỉ bổ sung (căn hộ, toà nhà...)">
                                <input
                                    value={form.address_line2}
                                    onChange={(e) => set("address_line2", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-2">
                            <Field label="Ghi chú cho đơn hàng">
                                <textarea
                                    rows={3}
                                    value={form.note}
                                    onChange={(e) => set("note", e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                {/* 3. Phương thức giao hàng */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Phương thức giao hàng
                    </div>
                    <div className="p-4">
                        {!canSuggestShipping ? (
                            <div className="text-sm text-gray-500">
                                Vui lòng nhập đầy đủ địa chỉ để xem lựa
                                chọn giao hàng.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="ship"
                                        checked={form.shipping === "standard"}
                                        onChange={() => set("shipping", "standard")}
                                    />
                                    <span className="text-sm">
                                        Giao tiêu chuẩn — {money(0)}
                                    </span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="ship"
                                        checked={form.shipping === "express"}
                                        onChange={() => set("shipping", "express")}
                                    />
                                    <span className="text-sm">
                                        Giao nhanh — {money(30000)}
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Phương thức thanh toán */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Phương thức thanh toán
                    </div>
                    <div className="p-4 space-y-2">
                        <label className="flex items-start gap-2 rounded-xl border p-3">
                            <input
                                type="radio"
                                name="pay"
                                checked={form.payment === "cod"}
                                onChange={() => set("payment", "cod")}
                            />
                            <div className="text-sm">
                                <div className="font-medium">
                                    Thanh toán khi giao hàng (COD)
                                </div>
                                <div className="text-gray-500">
                                    Trả tiền mặt cho shipper khi nhận hàng.
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-2 rounded-xl border p-3">
                            <input
                                type="radio"
                                name="pay"
                                checked={form.payment === "bank"}
                                onChange={() => set("payment", "bank")}
                            />
                            <div className="text-sm">
                                <div className="font-medium">
                                    Chuyển khoản ngân hàng
                                </div>
                                <div className="text-gray-500">
                                    Thông tin STK sẽ hiển thị sau khi đặt hàng.
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-2 rounded-xl border p-3">
                            <input
                                type="radio"
                                name="pay"
                                checked={form.payment === "qr"}
                                onChange={() => set("payment", "qr")}
                            />
                            <div className="text-sm">
                                <div className="font-medium">
                                    Quét mã QR để thanh toán
                                </div>
                                <div className="text-gray-500">
                                    Hiển thị mã QR ngay sau khi đặt.
                                </div>
                            </div>
                        </label>
                    </div>
                </section>

                {/* 5. Hoá đơn điện tử */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Hoá đơn điện tử
                    </div>
                    <div className="p-4 space-y-3">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.need_invoice}
                                onChange={(e) => set("need_invoice", e.target.checked)}
                            />
                            Yêu cầu xuất hoá đơn
                        </label>

                        {form.need_invoice && (
                            <div>
                                <Field label="Email nhận hoá đơn" required>
                                    <input
                                        value={form.tax_email}
                                        onChange={(e) => set("tax_email", e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </Field>
                                {errors.tax_email && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.tax_email}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* RIGHT: Giỏ hàng + mã giảm + tổng tiền */}
            <aside className="space-y-4">
                {/* Giỏ hàng */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Giỏ hàng
                    </div>
                    <ul className="p-3 divide-y">
                        {cart.map((it) => (
                            <li
                                key={it.productId}
                                className="py-3 flex items-center gap-3"
                            >
                                <img
                                    src={it.image}
                                    alt={it.title}
                                    className="w-12 h-16 object-contain rounded border"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium line-clamp-2">
                                        {it.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        SL: {it.qty}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold">
                                    {money(it.price * it.qty)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Mã khuyến mãi */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Mã khuyến mãi
                    </div>
                    <form onSubmit={applyCoupon} className="p-4 flex gap-2">
                        <input
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            placeholder="Nhập mã khuyến mãi"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button className="rounded-lg bg-red-600 text-white px-4 text-sm">
                            Áp dụng
                        </button>
                    </form>
                    {couponMsg && (
                        <div className="px-4 pb-3 text-sm text-gray-600">
                            {couponMsg}
                        </div>
                    )}
                </section>

                {/* Tóm tắt thanh toán */}
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b font-semibold">
                        Tóm tắt đơn hàng
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Tổng tiền hàng</span>
                            <span className="font-semibold">{money(subtotal)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Giảm giá</span>
                            <span className="font-semibold text-green-600">
                                -{money(discount)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Phí vận chuyển</span>
                            <span className="font-semibold">{money(shippingFee)}</span>
                        </div>

                        <div className="pt-2 mt-1 border-t flex justify-between text-base">
                            <span className="font-semibold">Tổng thanh toán</span>
                            <span className="font-extrabold">{money(total)}</span>
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <button
                            disabled={disabled}
                            onClick={placeOrder}
                            className={`w-full rounded-xl px-5 py-3 font-semibold text-white ${disabled
                                ? "bg-gray-300"
                                : "bg-red-600 hover:bg-red-500"
                                }`}
                        >
                            {submitting ? "Đang đặt..." : "Đặt hàng"}
                        </button>
                    </div>
                </section>
            </aside>
        </div>
    );
}