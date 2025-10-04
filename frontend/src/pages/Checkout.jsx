import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../helpers/productHelper";
import { orderApi } from "../api/orderApi";

// (tuỳ) nếu có AuthContext thì lấy user ở đây
const getUserFromStorage = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
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
  const user = getUserFromStorage(); // { id, name, email } nếu đã login
  const { cart, subtotal, clearCart } = useCart();

  // ===== State =====
  const [form, setForm] = useState({
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    country: "Vietnam",
    address_line1: "",
    address_line2: "",
    district: "",
    ward: "",
    province: "",
    shipping: "detect", // detect = yêu cầu nhập địa chỉ để hiện phương thức
    payment: "cod",     // cod | bank | qr
    note: "",
    need_invoice: false,
    tax_email: "",
  });
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const disabled = submitting || cart.length === 0;

  // ===== Derived =====
  const canSuggestShipping = useMemo(
    () => !!(form.address_line1 && form.province),
    [form.address_line1, form.province]
  );
  const shippingFee = useMemo(() => {
    if (!canSuggestShipping) return 0;
    // có địa chỉ -> hiển thị được lựa chọn
    return form.shipping === "express" ? 30000 : 0; // express 30k; standard 0đ
  }, [form.shipping, canSuggestShipping]);

  const discount = useMemo(() => {
    // demo coupon: "GIAM10" -> -10%
    if (coupon.trim().toUpperCase() === "GIAM10") return Math.round(subtotal * 0.1);
    return 0;
  }, [coupon, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discount + shippingFee), [subtotal, discount, shippingFee]);

  // ===== Handlers =====
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const applyCoupon = (e) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === "GIAM10") setCouponMsg("Áp dụng thành công: -10%");
    else setCouponMsg("Mã không hợp lệ");
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Vui lòng nhập họ tên";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!/^\d{9,11}$/.test(form.phone)) e.phone = "Số điện thoại 9–11 chữ số";
    if (!form.address_line1.trim()) e.address_line1 = "Nhập địa chỉ";
    if (!form.province.trim()) e.province = "Nhập tỉnh/thành";
    if (!form.district.trim()) e.district = "Nhập quận/huyện";
    if (form.need_invoice && !/^\S+@\S+\.\S+$/.test(form.tax_email)) e.tax_email = "Email nhận hoá đơn không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Chuẩn payload theo backend OrderService.create(order, items)
      const payload = {
        order: {
          user_id: user?.id || null,       // nếu có đăng nhập
          status: "pending",
          total_amount: total,
          shipping_method: form.shipping === "express" ? "express" : "standard",
          payment_method: form.payment,     // "cod" | "bank" | "qr"
          note: form.note || null,
          // (gợi ý) nếu backend có bảng address riêng thì chỉ gửi id; hiện tại gửi kèm để server lưu
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          address_line1: form.address_line1,
          address_line2: form.address_line2 || null,
          district: form.district,
          ward: form.ward || null,
          province: form.province,
          country: form.country,
          coupon: discount > 0 ? coupon.trim().toUpperCase() : null,
          discount_amount: discount,
          shipping_fee: shippingFee
        },
        items: cart.map((c) => ({
          book_id: c.productId,      // id sách từ backend
          quantity: c.qty,
          price: c.price,            // đơn giá tại thời điểm đặt
        })),
      };

      await orderApi.create(payload);
      clearCart();
      navigate("/checkout/success", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Đặt hàng thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3 md:px-4 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      {/* LEFT */}
      <div className="space-y-4">
        {/* Tài khoản */}
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
                <Link to="/logout" className="text-sm text-red-600">Đăng xuất</Link>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Bạn chưa đăng nhập. <Link to="/login" className="text-red-600 underline">Đăng nhập</Link>
              </div>
            )}
          </div>
        </section>

        {/* Thông tin giao hàng */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Thông tin giao hàng</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Field label="Họ và tên" required>
                <input value={form.full_name} onChange={(e)=>set("full_name", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/5" />
              </Field>
              {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <Field label="Số điện thoại" required>
                <input value={form.phone} onChange={(e)=>set("phone", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="09xxxxxxxx" />
              </Field>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Field label="Email" required>
                <input value={form.email} onChange={(e)=>set("email", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="you@example.com" />
              </Field>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <Field label="Quốc gia">
                <input value={form.country} onChange={(e)=>set("country", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Địa chỉ (số nhà, tên đường)" required>
                <input value={form.address_line1} onChange={(e)=>set("address_line1", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </Field>
              {errors.address_line1 && <p className="text-xs text-red-600 mt-1">{errors.address_line1}</p>}
            </div>

            <Field label="Tỉnh/Thành" required>
              <input value={form.province} onChange={(e)=>set("province", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Quận/Huyện" required>
              <input value={form.district} onChange={(e)=>set("district", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Phường/Xã">
              <input value={form.ward} onChange={(e)=>set("ward", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Địa chỉ bổ sung">
              <input value={form.address_line2} onChange={(e)=>set("address_line2", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Ghi chú cho đơn hàng">
                <textarea rows={3} value={form.note} onChange={(e)=>set("note", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </Field>
            </div>
          </div>
        </section>

        {/* Phương thức giao hàng */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Phương thức giao hàng</div>
          <div className="p-4">
            {!canSuggestShipping ? (
              <div className="text-sm text-gray-500">Nhập địa chỉ để xem các phương thức giao hàng</div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="ship" checked={form.shipping !== "express"} onChange={()=>set("shipping","standard")} />
                  <span className="text-sm">Tiêu chuẩn — {money(0)}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="ship" checked={form.shipping === "express"} onChange={()=>set("shipping","express")} />
                  <span className="text-sm">Nhanh — {money(30000)}</span>
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Phương thức thanh toán */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Phương thức thanh toán</div>
          <div className="p-4 space-y-2">
            <label className="flex items-center gap-2 rounded-xl border p-3">
              <input type="radio" name="pay" checked={form.payment === "cod"} onChange={()=>set("payment","cod")} />
              <div className="text-sm">
                <div className="font-medium">Thanh toán khi giao hàng (COD)</div>
                <div className="text-gray-500">Quý khách thanh toán tiền mặt cho nhân viên giao hàng.</div>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-xl border p-3">
              <input type="radio" name="pay" checked={form.payment === "bank"} onChange={()=>set("payment","bank")} />
              <div className="text-sm">
                <div className="font-medium">Chuyển khoản qua ngân hàng</div>
                <div className="text-gray-500">Hiển thị thông tin STK sau khi đặt hàng.</div>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-xl border p-3">
              <input type="radio" name="pay" checked={form.payment === "qr"} onChange={()=>set("payment","qr")} />
              <div className="text-sm">
                <div className="font-medium">Chuyển khoản qua QR </div>
                <div className="text-gray-500">Quét mã QR để thanh toán nhanh.</div>
              </div>
            </label>
          </div>
        </section>

        {/* Hoá đơn điện tử + ghi chú */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Hoá đơn điện tử</div>
          <div className="p-4 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.need_invoice} onChange={(e)=>set("need_invoice", e.target.checked)} />
              Yêu cầu xuất hoá đơn
            </label>
            {form.need_invoice && (
              <div>
                <Field label="Email nhận hoá đơn" required>
                  <input value={form.tax_email} onChange={(e)=>set("tax_email", e.target.value)}
                         className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </Field>
                {errors.tax_email && <p className="text-xs text-red-600 mt-1">{errors.tax_email}</p>}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT: Cart & Summary */}
      <aside className="space-y-4">
        {/* Giỏ hàng */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Giỏ hàng</div>
          <ul className="p-3 divide-y">
            {cart.map((it) => (
              <li key={it.productId} className="py-3 flex items-center gap-3">
                <img src={it.image} alt={it.title} className="w-12 h-16 object-contain rounded border" />
                <div className="flex-1">
                  <div className="text-sm font-medium line-clamp-2">{it.title}</div>
                  <div className="text-xs text-gray-500">SL: {it.qty}</div>
                </div>
                <div className="text-sm font-semibold">{money(it.price * it.qty)}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mã khuyến mãi */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Mã khuyến mãi</div>
          <form onSubmit={applyCoupon} className="p-4 flex gap-2">
            <input value={coupon} onChange={(e)=>setCoupon(e.target.value)}
                   placeholder="Nhập mã khuyến mãi" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"/>
            <button className="rounded-lg bg-red-600 text-white px-4 text-sm">Áp dụng</button>
          </form>
          {couponMsg && <div className="px-4 pb-3 text-sm text-gray-600">{couponMsg}</div>}
        </section>

        {/* Tóm tắt đơn hàng */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b font-semibold">Tóm tắt đơn hàng</div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Tổng tiền hàng</span><span className="font-semibold">{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Giảm giá</span><span className="font-semibold text-green-600">-{money(discount)}</span></div>
            <div className="flex justify-between"><span>Phí vận chuyển</span><span className="font-semibold">{money(shippingFee)}</span></div>
            <div className="pt-2 mt-1 border-t flex justify-between text-base">
              <span className="font-semibold">Tổng thanh toán</span>
              <span className="font-extrabold">{money(total)}</span>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button
              disabled={disabled}
              onClick={placeOrder}
              className={`w-full rounded-xl px-5 py-3 font-semibold text-white ${disabled ? "bg-gray-300" : "bg-red-600 hover:bg-red-500"}`}
            >
              {submitting ? "Đang đặt..." : "Đặt hàng"}
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
