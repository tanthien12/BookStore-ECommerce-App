// src/pages/admin/OrderDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiEdit,
    FiTrash2,
    FiTruck,
    FiMapPin,
    FiFileText,
    FiUser,
    FiClock,
    FiMail,
    FiPhone,
    FiPackage,
} from "react-icons/fi";
import { toast } from "react-toastify";
import summaryApi from "../../common";

const toVND = (n) =>
    (Number(n) || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    });

const dateTimeVN = (iso) => {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        return d.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "-";
    }
};

// Enum trạng thái theo DB: pending|paid|processing|shipped|delivered|cancelled|refunded
const STATUS_META = {
    pending: {
        label: "Chờ xác nhận",
        badgeClass: "bg-amber-50 border-amber-200 text-amber-700",
    },
    paid: {
        label: "Đã thanh toán",
        badgeClass: "bg-sky-50 border-sky-200 text-sky-700",
    },
    processing: {
        label: "Đang xử lý",
        badgeClass: "bg-blue-50 border-blue-200 text-blue-700",
    },
    shipped: {
        label: "Đã bàn giao vận chuyển",
        badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-700",
    },
    delivered: {
        label: "Đã giao",
        badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    cancelled: {
        label: "Đã hủy",
        badgeClass: "bg-red-50 border-red-200 text-red-700",
    },
    refunded: {
        label: "Đã hoàn tiền",
        badgeClass: "bg-purple-50 border-purple-200 text-purple-700",
    },
};

// Flow chính (thời gian) — cancelled / refunded hiển thị như nhánh “ngoài luồng”
const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];

// ───────────────── helpers component ─────────────────

function StatusBadge({ status }) {
    if (!status) return null;
    const s = String(status).toLowerCase();
    const meta = STATUS_META[s];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${meta?.badgeClass || "bg-gray-50 border-gray-200 text-gray-600"
                }`}
        >
            {meta?.label || s}
        </span>
    );
}

function StatusTimeline({ status }) {
    if (!status) return null;
    const s = String(status).toLowerCase();
    const idx = STATUS_FLOW.indexOf(s);
    const isCancelled = s === "cancelled";
    const isRefunded = s === "refunded";

    return (
        <div className="mt-3 rounded-2xl bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                {STATUS_FLOW.map((st, i) => {
                    const active = i === idx && !isCancelled && !isRefunded;
                    const doneBase = i < idx;
                    const doneIfTerminal =
                        (isCancelled || isRefunded) && idx >= 0 && i <= idx;
                    const done = doneBase || doneIfTerminal;

                    return (
                        <div key={st} className="flex flex-1 items-center">
                            <div
                                className={[
                                    "flex h-7 min-w-[28px] items-center justify-center rounded-full border text-xs font-medium",
                                    done
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                        : active
                                            ? "bg-red-50 border-red-300 text-red-700"
                                            : "bg-white border-gray-200 text-gray-400",
                                ].join(" ")}
                            >
                                {i + 1}
                            </div>
                            <div className="ml-2 text-[11px] font-medium capitalize text-gray-600">
                                {STATUS_META[st]?.label || st}
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                                <div className="mx-2 h-px flex-1 bg-gray-200" />
                            )}
                        </div>
                    );
                })}
            </div>

            {isCancelled && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                    Đơn hàng đã bị hủy.
                </div>
            )}

            {isRefunded && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-purple-700">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Đơn hàng đã được hoàn tiền.
                </div>
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2 text-sm">
            {Icon && (
                <div className="mt-[2px] text-gray-400">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {label}
                </div>
                <div className="text-sm font-medium text-gray-800">{value}</div>
            </div>
        </div>
    );
}

// ───────────────── main page ─────────────────

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    // fetch order detail
    useEffect(() => {
        let ignore = false;

        (async () => {
            try {
                setLoading(true);
                const res = await fetch(summaryApi.url(summaryApi.order.detail(id)));
                if (!res.ok) throw new Error(`Fetch order failed: ${res.status}`);
                const json = await res.json().catch(() => ({}));
                const data = json?.data || json?.item || json;
                if (!ignore) setOrder(data || null);
            } catch (err) {
                console.error(err);
                toast.error("Không tải được chi tiết đơn hàng");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Xóa thất bại");
            toast.success("Đã xóa đơn hàng");
            navigate("/admin/orders");
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi khi xóa đơn hàng");
        }
    };

    const totals = useMemo(
        () => ({
            subtotal: Number(order?.subtotal) || 0,
            discount: Number(order?.discount_total) || 0,
            shipping: Number(order?.shipping_fee) || 0,
            grand: Number(order?.grand_total) || 0,
        }),
        [order]
    );

    const shipping = order?.shipping_address || {};
    const orderStatus = String(order?.status || "").toLowerCase();
    const statusMeta = STATUS_META[orderStatus];

    const orderCode =
        order?.code ||
        order?.order_code ||
        (order?.id ? String(order.id).slice(0, 8) : "-");

    // skeleton loading
    if (loading && !order) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
            </div>
        );
    }

    if (!order) {
        return <div className="p-4 text-sm text-gray-600">Không tìm thấy đơn hàng.</div>;
    }

    return (
        <div className="space-y-5">
            {/* ───────── Sticky action bar ───────── */}
            <div className="sticky top-0 z-10 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs shadow-sm backdrop-blur sm:mx-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Đơn hàng
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 shadow-sm">
                        #{orderCode}
                    </span>
                    {statusMeta && <StatusBadge status={orderStatus} />}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <Link
                        to={`/admin/orders/${id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 hover:bg-gray-50"
                    >
                        <FiEdit className="text-base" /> Sửa
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-red-600 hover:bg-red-50"
                    >
                        <FiTrash2 className="text-base" /> Xóa
                    </button>
                    <Link
                        to="/admin/orders"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 hover:bg-gray-50"
                    >
                        <FiArrowLeft className="text-base" /> Quay lại
                    </Link>
                </div>
            </div>

            {/* ───────── Page title ───────── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Quản lý thông tin và trạng thái đơn hàng, xem chi tiết sản phẩm và địa chỉ giao hàng.
                </p>
            </div>

            {/* ───────── Main grid ───────── */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                {/* LEFT: Order + Items */}
                <div className="space-y-4">
                    {/* Order info card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <FiFileText className="text-xl" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Mã đơn hàng
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">
                                        #{orderCode}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1 text-right text-xs sm:text-sm">
                                <div className="flex items-center justify-end gap-2 text-gray-600">
                                    <FiClock className="text-base text-gray-400" />
                                    <span>Ngày đặt:</span>
                                    <span className="font-medium">{dateTimeVN(order.placed_at)}</span>
                                </div>
                                {order.updated_at && (
                                    <div className="flex items-center justify-end gap-2 text-gray-500">
                                        <span className="text-[11px]">Cập nhật:</span>
                                        <span className="text-[11px]">{dateTimeVN(order.updated_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* status timeline */}
                        <StatusTimeline status={orderStatus} />

                        {/* Customer info */}
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={FiUser}
                                label="Khách hàng"
                                value={shipping.full_name || order.customer_name}
                            />
                            <InfoRow
                                icon={FiMail}
                                label="Email"
                                value={shipping.email || order.customer_email}
                            />
                            <InfoRow
                                icon={FiPhone}
                                label="Điện thoại"
                                value={shipping.phone || order.customer_phone}
                            />
                            <InfoRow
                                icon={FiTruck}
                                label="Phương thức giao hàng"
                                value={
                                    order.shipping_method === "standard"
                                        ? "Giao hàng tiêu chuẩn"
                                        : order.shipping_method || "Không xác định"
                                }
                            />
                            {order.tracking_number && (
                                <InfoRow
                                    icon={FiTruck}
                                    label="Mã vận đơn"
                                    value={order.tracking_number}
                                />
                            )}
                        </div>
                    </div>

                    {/* Items card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-800">
                                Danh sách sản phẩm ({order.items?.length || 0})
                            </h2>
                        </div>

                        {!order.items || order.items.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                                Không có sản phẩm nào trong đơn hàng này.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                            <th className="p-3 text-left">Sản phẩm</th>
                                            <th className="p-3 text-center">SL</th>
                                            <th className="p-3 text-right">Đơn giá</th>
                                            <th className="p-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((it, idx) => {
                                            const unitPrice = Number(it.price_snapshot) || 0;
                                            const qty = Number(it.quantity) || 0;
                                            const lineTotal = unitPrice * qty;
                                            return (
                                                <tr
                                                    key={it.book_id || idx}
                                                    className="border-b last:border-0 hover:bg-gray-50/70"
                                                >
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            {it.image_url && (
                                                                <img
                                                                    src={it.image_url}
                                                                    alt={it.title}
                                                                    className="h-11 w-11 rounded-lg border object-cover"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-gray-800 flex items-center gap-1">
                                                                    <FiPackage className="text-xs text-gray-400" />
                                                                    <span>{it.title || "—"}</span>
                                                                </div>
                                                                {it.book_id && (
                                                                    <div className="text-[11px] text-gray-400">
                                                                        ID: {it.book_id}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center text-gray-700">
                                                        {qty}
                                                    </td>
                                                    <td className="p-3 text-right text-gray-700">
                                                        {toVND(unitPrice)}
                                                    </td>
                                                    <td className="p-3 text-right font-semibold text-gray-900">
                                                        {toVND(lineTotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Shipping + Summary + History */}
                <div className="space-y-4">
                    {/* Shipping address */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiMapPin className="text-xl" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-800">
                                Địa chỉ giao hàng
                            </h2>
                        </div>
                        {shipping && (shipping.full_name || shipping.address_line1) ? (
                            <div className="space-y-1 text-sm text-gray-700">
                                {shipping.full_name && (
                                    <div className="font-semibold text-gray-900">
                                        {shipping.full_name}
                                    </div>
                                )}
                                {shipping.phone && (
                                    <div className="text-gray-700">{shipping.phone}</div>
                                )}
                                {shipping.email && (
                                    <div className="text-gray-700">{shipping.email}</div>
                                )}
                                {shipping.address_line1 && (
                                    <div className="mt-1">
                                        {shipping.address_line1}
                                        {shipping.address_line2
                                            ? `, ${shipping.address_line2}`
                                            : ""}
                                    </div>
                                )}
                                <div className="text-gray-600">
                                    {[shipping.ward, shipping.district, shipping.province]
                                        .filter(Boolean)
                                        .join(", ")}
                                </div>
                                {shipping.country && (
                                    <div className="text-gray-600">{shipping.country}</div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                                Không có thông tin địa chỉ giao hàng.
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <FiFileText className="text-xl" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-800">
                                Tóm tắt thanh toán
                            </h2>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tạm tính</span>
                                <span className="font-medium text-gray-800">
                                    {toVND(totals.subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Giảm giá</span>
                                <span className="font-medium text-emerald-600">
                                    -{toVND(totals.discount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phí vận chuyển</span>
                                <span className="font-medium text-gray-800">
                                    {totals.shipping === 0
                                        ? "Miễn phí"
                                        : toVND(totals.shipping)}
                                </span>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                    Tổng thanh toán
                                </span>
                                <span className="text-xl font-bold text-emerald-600">
                                    {toVND(totals.grand)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* History (simple) */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-semibold text-gray-800">
                            Lịch sử đơn hàng
                        </h2>
                        <ol className="space-y-3 text-xs text-gray-600">
                            <li className="flex gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                                <div>
                                    <div className="font-medium text-gray-800">
                                        Đơn hàng được tạo
                                    </div>
                                    <div>{dateTimeVN(order.placed_at)}</div>
                                </div>
                            </li>
                            {order.updated_at && (
                                <li className="flex gap-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            Cập nhật trạng thái: {statusMeta?.label || order.status}
                                        </div>
                                        <div>{dateTimeVN(order.updated_at)}</div>
                                    </div>
                                </li>
                            )}
                            {orderStatus === "refunded" && (
                                <li className="flex gap-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            Đơn hàng đã được hoàn tiền
                                        </div>
                                        <div>{dateTimeVN(order.updated_at || order.placed_at)}</div>
                                    </div>
                                </li>
                            )}
                            {orderStatus === "cancelled" && (
                                <li className="flex gap-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            Đơn hàng đã bị hủy
                                        </div>
                                        <div>{dateTimeVN(order.updated_at || order.placed_at)}</div>
                                    </div>
                                </li>
                            )}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}


// code goc
// // src/pages/admin/OrderDetail.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import { MdArrowBack, MdEdit, MdDelete } from "react-icons/md";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// const toVND = (n) =>
//     (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
// const dateVN = (iso) => {
//     try {
//         const d = new Date(iso);
//         return d.toLocaleDateString("vi-VN", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//         });
//     } catch {
//         return "-";
//     }
// };

// const STATUS_BADGE = {
//     Pending: "bg-amber-100 text-amber-700 border-amber-200",
//     Processing: "bg-blue-100 text-blue-700 border-blue-200",
//     Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
//     Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
//     Canceled: "bg-red-100 text-red-700 border-red-200",
// };

// export default function OrderDetail() {
//     const { id } = useParams();
//     const nav = useNavigate();
//     const [order, setOrder] = useState(null);
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         let ignore = false;
//         (async () => {
//             try {
//                 setLoading(true);
//                 const res = await fetch(summaryApi.url(summaryApi.order.detail(id)));
//                 if (!res.ok) throw new Error("Fetch order failed");
//                 const json = await res.json();
//                 if (!ignore) setOrder(json.data);
//             } catch (err) {
//                 console.error(err);
//                 toast.error("Không tải được chi tiết đơn hàng");
//             } finally {
//                 if (!ignore) setLoading(false);
//             }
//         })();
//         return () => { ignore = true; };
//     }, [id]);

//     const handleDelete = async () => {
//         if (!confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) return;
//         try {
//             const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), {
//                 method: "DELETE",
//             });
//             if (!res.ok) throw new Error("Xóa thất bại");
//             toast.success("Đã xóa đơn hàng");
//             nav("/admin/orders");
//         } catch (err) {
//             console.error(err);
//             toast.error("Có lỗi khi xóa đơn hàng");
//         }
//     };

//     if (loading) return <div className="p-4">Đang tải...</div>;
//     if (!order) return <div className="p-4">Không tìm thấy đơn hàng</div>;

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
//                 <div className="flex items-center gap-2">
//                     <Link
//                         to={`/admin/orders/${id}/edit`}
//                         className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
//                     >
//                         <MdEdit /> Sửa
//                     </Link>
//                     <button
//                         onClick={handleDelete}
//                         className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-red-600 flex items-center gap-1"
//                     >
//                         <MdDelete /> Xóa
//                     </button>
//                     <Link
//                         to="/admin/orders"
//                         className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
//                     >
//                         <MdArrowBack /> Quay lại
//                     </Link>
//                 </div>
//             </div>

//             {/* Order Info */}
//             <div className="bg-white rounded-xl border shadow p-4 space-y-4">
//                 <div className="flex justify-between">
//                     <div>
//                         <div className="text-sm text-gray-500">Mã đơn hàng</div>
//                         <div className="font-semibold">{order.id}</div>
//                     </div>
//                     <div>
//                         <span
//                             className={`px-2 py-1 rounded-full border text-sm ${STATUS_BADGE[order.status] || ""}`}
//                         >
//                             {order.status}
//                         </span>
//                     </div>
//                 </div>
//                 <div>
//                     <div className="text-sm text-gray-500">Khách hàng</div>
//                     <div className="font-semibold">{order.customer_name}</div>
//                     <div className="text-sm text-gray-600">{order.customer_email}</div>
//                 </div>
//                 <div>
//                     <div className="text-sm text-gray-500">Ngày tạo</div>
//                     <div>{dateVN(order.created_at)}</div>
//                 </div>
//                 <div>
//                     <div className="text-sm text-gray-500">Tổng tiền</div>
//                     <div className="font-bold text-lg text-emerald-600">{toVND(order.total_amount)}</div>
//                 </div>
//             </div>

//             {/* Items */}
//             <div className="bg-white rounded-xl border shadow p-4">
//                 <h2 className="text-lg font-semibold mb-3">Danh sách sản phẩm</h2>
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 <th className="p-3 text-left">Sách</th>
//                                 <th className="p-3 text-left">Số lượng</th>
//                                 <th className="p-3 text-left">Đơn giá</th>
//                                 <th className="p-3 text-left">Thành tiền</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y">
//                             {order.items && order.items.length > 0 ? (
//                                 order.items.map((it) => (
//                                     <tr key={it.id}>
//                                         <td className="p-3">{it.title}</td>
//                                         <td className="p-3">{it.quantity}</td>
//                                         <td className="p-3">{toVND(it.price)}</td>
//                                         <td className="p-3 font-medium">{toVND(it.price * it.quantity)}</td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan={4} className="p-4 text-center text-gray-500">
//                                         Không có sản phẩm nào
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }
