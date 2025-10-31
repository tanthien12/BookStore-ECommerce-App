import React, { useMemo, useState, useEffect } from "react";
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

  // Lấy context giỏ hàng để có thể clearCart sau khi đặt hàng
  const { clearCart } = useCart();

  // ======== 1. Lấy danh sách sản phẩm được chọn từ sessionStorage ========
  const [checkoutItems, setCheckoutItems] = useState([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_items");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCheckoutItems(parsed);
        }
      }
    } catch {
      // nếu parse fail thì để rỗng
    }
  }, []);

  // ======== 2. State địa chỉ / form ========
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardName, setWardName] = useState("");

  // ✅ LẤY ĐỦ CẢ LOADING
  const {
    provinces = [],
    districts = [],
    wards = [],
    fetchDistricts,
    fetchWards,
    loadingProvince,
    loadingDistrict,
    loadingWard,
    error: addressError,
  } = useVNAddress();

  const [form, setForm] = useState({
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address_line1: "",
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

  // ======== 3. Tính toán tiền dựa trên checkoutItems ========
  const subtotalSelected = useMemo(() => {
    return checkoutItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  }, [checkoutItems]);

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
  }, [form.shipping, canSuggestShipping]);

  const discount = useMemo(() => {
    if (coupon.trim().toUpperCase() === "GIAM10") {
      return Math.round(subtotalSelected * 0.1);
    }
    return 0;
  }, [coupon, subtotalSelected]);

  const total = useMemo(
    () => Math.max(0, subtotalSelected - discount + shippingFee),
    [subtotalSelected, discount, shippingFee]
  );

  const disabled = submitting || checkoutItems.length === 0;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const applyCoupon = (e) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === "GIAM10") {
      setCouponMsg("Áp dụng thành công: -10%");
    } else {
      setCouponMsg("Mã không hợp lệ");
    }
  };

  const selectedProvinceName =
    provinces.find((p) => p.code === provinceCode)?.name || "";

  const selectedDistrictName =
    districts.find((d) => d.code === districtCode)?.name || "";

  // ======== Validate ========
  const validate = () => {
    const e = {};

    if (!form.full_name.trim()) e.full_name = "Vui lòng nhập họ tên";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!/^\d{9,11}$/.test(form.phone))
      e.phone = "Số điện thoại 9–11 chữ số";

    if (!form.address_line1.trim()) e.address_line1 = "Nhập số nhà, tên đường";

    if (!provinceCode) e.province = "Chọn tỉnh/thành";
    if (!districtCode) e.district = "Chọn quận/huyện";
    if (!wardName) e.ward = "Chọn phường/xã";

    if (form.need_invoice && !/^\S+@\S+\.\S+$/.test(form.tax_email)) {
      e.tax_email = "Email nhận hoá đơn không hợp lệ";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ======== Submit / Place Order ========
  const placeOrder = async () => {
    if (!validate()) return;
    if (checkoutItems.length === 0) {
      alert("Bạn chưa chọn sản phẩm nào để thanh toán.");
      return;
    }

    setSubmitting(true);

    try {
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

      const payload = {
        user_id: user?.id || null,
        status: "pending",
        shipping_fee: shippingFee,
        discount_total: discount,
        shipping_method:
          form.shipping === "express" ? "express" : "standard",
        shipping_address: shippingAddress,
        items: checkoutItems.map((item) => ({
          book_id: item.productId,
          quantity: item.qty,
          price: item.price,
        })),
  
        payment: {
          method: form.payment,
          status: form.payment === "cod" ? "unpaid" : "pending",
          amount_paid: 0,
          currency: "VND",
          transaction_id: null,
        },
        coupon:
          discount > 0
            ? {
                code: coupon.trim().toUpperCase(),
                discount_amount: discount,
              }
            : null,
        invoice:
          form.need_invoice === true ? { email: form.tax_email } : null,
      };

      const created = await orderApi.create(payload);
            const orderId =
        created?.data?.order_id || created?.data?.id || null;

      // 2️⃣ Nếu người dùng chọn VNPay
      if (form.payment === "vnpay") {
        const res = await fetch(
          "http://localhost:4000/api/vnpay/create-payment-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: orderId,
              amount: total,
              bankCode: "", // để rỗng để hiển thị VNpay
            }),
          }
        );
        const data = await res.json();
        if (data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        } else {
          alert("Không thể tạo link VNPay, vui lòng thử lại sau.");
          return;
        }
      }

      localStorage.setItem(
        "order_draft",
        JSON.stringify({
          orderId: created?.data?.order_id || created?.data?.id || null,
          total,
          payment_method: form.payment,
          shipping_method: form.shipping,
          address: shippingAddress,
          items: checkoutItems,
        })
      );

      clearCart();
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
          <div className="px-4 py-3 border-b font-semibold">Tài khoản</div>
          <div className="p-4 flex items-center justify-between">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <Link to="/logout" className="text-sm text-red-600">
                  Đăng xuất
                </Link>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Bạn chưa đăng nhập{" "}
                <Link to="/login" className="text-red-600 underline">
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 2. Thông tin giao hàng */}
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
                <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
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
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
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
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
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

            {/* Tỉnh / Thành phố */}
            <div>
              <Field label="Tỉnh / Thành phố" required>
                <select
                  value={provinceCode}
                  onChange={(e) => {
                    const newProvince = e.target.value;
                    setProvinceCode(newProvince);
                    setDistrictCode("");
                    setWardName("");
                    fetchDistricts(newProvince);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="">
                    {loadingProvince
                      ? "Đang tải..."
                      : "-- Chọn tỉnh/thành --"}
                  </option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              {errors.province && (
                <p className="text-xs text-red-600 mt-1">{errors.province}</p>
              )}
            </div>

            {/* Quận / Huyện */}
            <div>
              <Field label="Quận / Huyện" required>
                <select
                  value={districtCode}
                  onChange={(e) => {
                    const newDistrict = e.target.value;
                    setDistrictCode(newDistrict);
                    setWardName("");
                    fetchWards(provinceCode, newDistrict);
                  }}
                  disabled={!provinceCode}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {!provinceCode
                      ? "Chọn tỉnh trước"
                      : loadingDistrict
                      ? "Đang tải..."
                      : "-- Chọn quận/huyện --"}
                  </option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              {errors.district && (
                <p className="text-xs text-red-600 mt-1">{errors.district}</p>
              )}
            </div>

            {/* Phường / Xã */}
            <div>
              <Field label="Phường / Xã" required>
                <select
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  disabled={!districtCode}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {!districtCode
                      ? "Chọn quận trước"
                      : loadingWard
                      ? "Đang tải..."
                      : "-- Chọn phường/xã --"}
                  </option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </Field>
              {errors.ward && (
                <p className="text-xs text-red-600 mt-1">{errors.ward}</p>
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

            {/* lỗi API địa chỉ nếu có */}
            {addressError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{addressError}</p>
              </div>
            )}
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
                Vui lòng nhập đầy đủ địa chỉ để xem lựa chọn giao hàng.
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
                  <span className="text-sm">Giao tiêu chuẩn — {money(0)}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ship"
                    checked={form.shipping === "express"}
                    onChange={() => set("shipping", "express")}
                  />
                  <span className="text-sm">Giao nhanh — {money(30000)}</span>
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
                checked={form.payment === "vnpay"}
                onChange={() => set("payment", "vnpay")}
              />
              <div className="text-sm">
                <div className="font-medium">Thanh toán qua VNPay</div>
                <div className="text-gray-500">
                  Chuyển hướng sang cổng VNPay để thanh toán online.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-2 rounded-xl border p-3">
              <input
                type="radio"
                name="pay"
                checked={form.payment === "stripe"}
                onChange={() => set("payment", "stripe")}
              />
              <div className="text-sm">
                <div className="font-medium">Thanh toán bằng Stripe (thẻ)</div>
                <div className="text-gray-500">
                  Dùng thẻ Visa / Master / JCB.
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
        {/* Giỏ hàng đã chọn */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">
            Sản phẩm thanh toán ({checkoutItems.length})
          </div>
          <ul className="p-3 divide-y">
            {checkoutItems.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-500">
                Bạn chưa chọn sản phẩm nào. Quay lại giỏ hàng để chọn.
              </li>
            ) : (
              checkoutItems.map((it) => (
                <li key={it.productId} className="py-3 flex items-center gap-3">
                  <img
                    src={it.image}
                    alt={it.title}
                    className="w-12 h-16 object-contain rounded border"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium line-clamp-2">
                      {it.title}
                    </div>
                    <div className="text-xs text-gray-500">SL: {it.qty}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {money(it.price * it.qty)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Mã khuyến mãi */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Mã khuyến mãi</div>
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
            <div className="px-4 pb-3 text-sm text-gray-600">{couponMsg}</div>
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
              <span className="font-semibold">{money(subtotalSelected)}</span>
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
              className={`w-full rounded-xl px-5 py-3 font-semibold text-white ${
                disabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {submitting
                ? "Đang đặt..."
                : checkoutItems.length === 0
                ? "Chọn sản phẩm ở giỏ hàng trước"
                : "Đặt hàng"}
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
