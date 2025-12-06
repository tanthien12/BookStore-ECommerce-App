// src/pages/user/Vouchers.jsx
import React, { useEffect, useState } from "react";
import summaryApi, { authHeaders } from "../../common";
import { toast } from "react-toastify";
import { FaTicketAlt, FaHistory } from "react-icons/fa";

export default function Vouchers() {
    const [available, setAvailable] = useState([]);
    const [used, setUsed] = useState([]);
    const [loading, setLoading] = useState(true);

    const [detailVoucher, setDetailVoucher] = useState(null);
    const [detailType, setDetailType] = useState("available");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const [resAvail, resUsed] = await Promise.all([
                    fetch(summaryApi.url(summaryApi.voucher.available), {
                        headers: {
                            "Content-Type": "application/json",
                            ...authHeaders(),
                        },
                        credentials: "include",
                    }),
                    fetch(summaryApi.url(summaryApi.voucher.used), {
                        headers: {
                            "Content-Type": "application/json",
                            ...authHeaders(),
                        },
                        credentials: "include",
                    }),
                ]);

                const bodyAvail = await resAvail.json().catch(() => ({}));
                const bodyUsed = await resUsed.json().catch(() => ({}));

                if (!resAvail.ok || !bodyAvail.ok) {
                    throw new Error(bodyAvail.message || "Không tải được voucher khả dụng");
                }

                if (resUsed.status !== 404) {
                    if (!resUsed.ok || !bodyUsed.ok) {
                        throw new Error(bodyUsed.message || "Không tải được voucher đã dùng");
                    }
                }

                if (!cancelled) {
                    setAvailable(bodyAvail.data || []);
                    setUsed(resUsed.status === 404 ? [] : bodyUsed.data || []);
                }
            } catch (e) {
                if (!cancelled) {
                    toast.error(e.message || "Lỗi tải voucher");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const formatDate = (d) => {
        if (!d) return "—";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleDateString("vi-VN");
    };

    const formatDateTime = (d) => {
        if (!d) return "—";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleString("vi-VN");
    }

    const renderDiscount = (v) => {
        if (v.type === "percent") return `${v.value}%`;
        return `${Number(v.value || 0).toLocaleString("vi-VN")}₫`;
    };

    const handleCopy = async (code) => {
        const value = (code || "").toString().trim();
        if (!value) {
            toast.error("Không có mã để sao chép.");
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = value;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            toast.success(`Đã sao chép mã: ${value}`);
        } catch (err) {
            console.error("Copy voucher code error:", err);
            toast.error("Không sao chép được mã, vui lòng copy thủ công.");
        }
    };

    const openDetail = (voucher, type = "available") => {
        setDetailVoucher(voucher);
        setDetailType(type);
    };

    const closeDetail = () => {
        setDetailVoucher(null);
    };

    // ========= CARD VOUCHER KHẢ DỤNG =========
    const renderAvailableCard = (v) => {
        return (
            <div
                key={v.id}
                className="flex rounded-xl overflow-hidden shadow-sm bg-white border border-gray-200 transition-all hover:shadow-md"
            >
                {/* Cột trái màu xanh + icon vé */}
                <div className="w-24 bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <FaTicketAlt className="text-3xl text-white" />
                </div>

                {/* Nội dung bên phải */}
                <div className="flex-1 p-4 flex flex-col h-full min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 line-clamp-1" title={v.description}>
                                {v.description || `Mã giảm giá ${v.code}`}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 truncate">
                                Giảm {renderDiscount(v)}
                                {Number(v.min_order_value) > 0 &&
                                    ` đơn từ ${Number(v.min_order_value).toLocaleString("vi-VN")}₫`}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => openDetail(v, "available")}
                            className="text-xs text-blue-600 hover:underline flex-shrink-0 whitespace-nowrap"
                        >
                            Chi tiết
                        </button>
                    </div>

                    {v.description && (
                        <div className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                            {v.description}
                        </div>
                    )}

                    <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="inline-flex items-center w-fit px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-mono font-medium truncate">
                                {v.code}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                                HSD: <span className="text-orange-600 font-medium">{formatDate(v.end_date)}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleCopy(v.code)}
                            className="flex-shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
                        >
                            Copy mã
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ========= CARD VOUCHER ĐÃ DÙNG =========
    const renderUsedCard = (v) => {
        return (
            <div
                key={`${v.order_id}-${v.code}-${v.used_at}`}
                className="flex rounded-xl overflow-hidden shadow-sm bg-gray-50 border border-gray-200 opacity-80 hover:opacity-100 transition-opacity"
            >
                {/* Cột trái màu xám */}
                <div className="w-24 bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <FaHistory className="text-3xl text-white" />
                </div>

                {/* Nội dung bên phải */}
                <div className="flex-1 p-4 flex flex-col h-full min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-700 line-clamp-1" title={v.description}>
                                {v.description || `Mã giảm giá ${v.code}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                                Đã giảm {renderDiscount(v)}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => openDetail(v, "used")}
                            className="text-xs text-gray-500 hover:text-gray-800 hover:underline flex-shrink-0 whitespace-nowrap"
                        >
                            Chi tiết
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 mt-1.5 truncate">
                        Đơn hàng: <span className="font-medium text-gray-700">#{v.order_id}</span>
                    </div>

                    <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="inline-flex items-center w-fit px-2 py-1 rounded-md bg-gray-200 border border-gray-300 text-gray-600 text-xs font-mono select-all truncate">
                                {v.code}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                                Dùng: {formatDate(v.used_at)}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleCopy(v.code)}
                            className="flex-shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 text-xs font-medium shadow-sm hover:bg-gray-50 transition"
                        >
                            Copy mã
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDetailModal = () => {
        if (!detailVoucher) return null;
        const v = detailVoucher;
        const isUsed = detailType === "used";

        return (

            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] animate-fadeIn">
                    {/* Header */}
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isUsed ? 'bg-gray-50 rounded-t-2xl' : 'bg-emerald-50 rounded-t-2xl'}`}>
                        <h3 className={`text-sm font-bold uppercase ${isUsed ? 'text-gray-600' : 'text-emerald-700'}`}>
                            {isUsed ? "Chi tiết sử dụng" : "Điều kiện áp dụng"}
                        </h3>
                        <button
                            type="button"
                            onClick={closeDetail}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 overflow-y-auto text-sm text-gray-800 space-y-4">
                        <div>
                            <div className="font-bold text-lg text-gray-900">
                                {v.description || `Mã giảm giá ${v.code}`}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-gray-500">Mã voucher:</span>
                                <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded text-base">
                                    {v.code}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                                <li>
                                    Giá trị ưu đãi: <span className="font-bold text-red-500">{renderDiscount(v)}</span>
                                </li>
                                {Number(v.min_order_value) > 0 && (
                                    <li>
                                        Đơn tối thiểu: <span className="font-semibold">{Number(v.min_order_value).toLocaleString("vi-VN")}₫</span>
                                    </li>
                                )}
                                {Number(v.max_discount) > 0 && (
                                    <li>
                                        Giảm tối đa: <span className="font-semibold">{Number(v.max_discount).toLocaleString("vi-VN")}₫</span>
                                    </li>
                                )}
                                <li>
                                    Hạn sử dụng: <span className="font-semibold">{formatDate(v.end_date)}</span>
                                </li>
                                {v.usage_limit != null && (
                                    <li>
                                        Lượt dùng còn lại: <span className="font-semibold">{v.usage_limit}</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {isUsed && v.used_at && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs">
                                <div className="font-semibold mb-1">Lịch sử sử dụng:</div>
                                <div>
                                    Bạn đã dùng mã này vào lúc <b>{formatDateTime(v.used_at)}</b>
                                </div>
                                <div>
                                    Cho đơn hàng: <b>#{v.order_id}</b>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={() => handleCopy(v.code)}
                            className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition active:scale-[0.98] ${isUsed
                                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                        >
                            {isUsed ? "COPY MÃ NÀY" : "SAO CHÉP MÃ NGAY"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Voucher khả dụng: Có BG white */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaTicketAlt className="text-emerald-500" />
                        Voucher khả dụng
                    </h2>
                    {loading && <span className="text-xs text-gray-500 animate-pulse">Đang cập nhật...</span>}
                </div>

                {!available.length && !loading && (
                    <div className="text-sm text-gray-500 py-4 text-center">
                        Hiện không có voucher nào khả dụng.
                    </div>
                )}

                {!!available.length && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {available.map(renderAvailableCard)}
                    </div>
                )}
            </div>

            {/* 2. Voucher đã dùng: Có BG white */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaHistory className="text-gray-500" />
                        Lịch sử voucher
                    </h2>
                </div>

                {!used.length ? (
                    <div className="text-sm text-gray-500 py-4 text-center">
                        {loading ? "Đang tải dữ liệu..." : "Bạn chưa sử dụng voucher nào."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {used.map(renderUsedCard)}
                    </div>
                )}
            </div>

            {renderDetailModal()}
        </div>
    );
}

// //code 1
// // src/pages/user/Vouchers.jsx
// import React, { useEffect, useState } from "react";
// import summaryApi, { authHeaders } from "../../common";
// import { toast } from "react-toastify";
// import { FaTicketAlt } from "react-icons/fa";

// export default function Vouchers() {
//     const [available, setAvailable] = useState([]);
//     const [used, setUsed] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [detailVoucher, setDetailVoucher] = useState(null);
//     const [detailType, setDetailType] = useState("available");

//     useEffect(() => {
//         let cancelled = false;

//         async function load() {
//             try {
//                 setLoading(true);

//                 const [resAvail, resUsed] = await Promise.all([
//                     fetch(summaryApi.url(summaryApi.voucher.available), {
//                         headers: {
//                             "Content-Type": "application/json",
//                             ...authHeaders(),
//                         },
//                         credentials: "include",
//                     }),
//                     fetch(summaryApi.url(summaryApi.voucher.used), {
//                         headers: {
//                             "Content-Type": "application/json",
//                             ...authHeaders(),
//                         },
//                         credentials: "include",
//                     }),
//                 ]);

//                 const bodyAvail = await resAvail.json().catch(() => ({}));
//                 const bodyUsed = await resUsed.json().catch(() => ({}));

//                 if (!resAvail.ok || !bodyAvail.ok) {
//                     throw new Error(bodyAvail.message || "Không tải được voucher khả dụng");
//                 }

//                 if (resUsed.status !== 404) {
//                     if (!resUsed.ok || !bodyUsed.ok) {
//                         throw new Error(bodyUsed.message || "Không tải được voucher đã dùng");
//                     }
//                 }

//                 if (!cancelled) {
//                     setAvailable(bodyAvail.data || []);
//                     setUsed(resUsed.status === 404 ? [] : bodyUsed.data || []);
//                 }
//             } catch (e) {
//                 if (!cancelled) {
//                     toast.error(e.message || "Lỗi tải voucher");
//                 }
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         }

//         load();
//         return () => {
//             cancelled = true;
//         };
//     }, []);

//     const formatDate = (d) => {
//         if (!d) return "—";
//         const dt = new Date(d);
//         if (Number.isNaN(dt.getTime())) return "—";
//         return dt.toLocaleDateString("vi-VN");
//     };

//     const renderDiscount = (v) => {
//         if (v.type === "percent") return `${v.value}%`;
//         return `${Number(v.value || 0).toLocaleString("vi-VN")}₫`;
//     };

//     const handleCopy = async (code) => {
//         const value = (code || "").toString().trim();
//         if (!value) {
//             toast.error("Không có mã để sao chép.");
//             return;
//         }

//         try {
//             if (navigator.clipboard && navigator.clipboard.writeText) {
//                 await navigator.clipboard.writeText(value);
//             } else {
//                 const textarea = document.createElement("textarea");
//                 textarea.value = value;
//                 textarea.style.position = "fixed";
//                 textarea.style.opacity = "0";
//                 document.body.appendChild(textarea);
//                 textarea.focus();
//                 textarea.select();
//                 document.execCommand("copy");
//                 document.body.removeChild(textarea);
//             }

//             toast.success(`Đã sao chép mã: ${value}`);
//         } catch (err) {
//             console.error("Copy voucher code error:", err);
//             toast.error("Không sao chép được mã, vui lòng copy thủ công.");
//         }
//     };

//     const openDetail = (voucher, type = "available") => {
//         setDetailVoucher(voucher);
//         setDetailType(type);
//     };

//     const closeDetail = () => {
//         setDetailVoucher(null);
//     };

//     // ========= CARD VOUCHER KHẢ DỤNG =========
//     const renderAvailableCard = (v) => {
//         return (
//             <div
//                 key={v.id}
//                 className="flex rounded-xl overflow-hidden shadow-md bg-white border border-gray-200"
//             >
//                 {/* Cột trái màu xanh + icon vé */}
//                 <div className="w-24 bg-emerald-500 flex items-center justify-center">
//                     <FaTicketAlt className="text-3xl text-white" />
//                 </div>

//                 {/* Nội dung bên phải */}
//                 <div className="flex-1 p-4 flex flex-col h-full">
//                     {/* Tiêu đề + link Chi tiết */}
//                     <div className="flex items-start justify-between gap-3">
//                         <div className="flex-1 min-w-0">
//                             <div className="font-semibold text-sm text-gray-900 line-clamp-1">
//                                 {v.description || `Mã giảm giá ${v.code}`}
//                             </div>
//                             <div className="text-xs text-gray-600 mt-1">
//                                 Giảm {renderDiscount(v)}
//                                 {Number(v.min_order_value) > 0 &&
//                                     ` cho đơn từ ${Number(
//                                         v.min_order_value
//                                     ).toLocaleString("vi-VN")}₫`}
//                             </div>
//                         </div>
//                         <button
//                             type="button"
//                             onClick={() => openDetail(v, "available")}
//                             className="text-xs text-blue-600 hover:underline flex-shrink-0"
//                         >
//                             Chi tiết
//                         </button>
//                     </div>

//                     {/* Mô tả ngắn */}
//                     {v.description && (
//                         <div className="text-xs text-gray-500 mt-1.5 line-clamp-2">
//                             {v.description}
//                         </div>
//                     )}

//                     {/* Khối dưới: mã + HSD + nút copy (nằm góc dưới bên phải) */}
//                     <div className="mt-auto pt-3 flex items-end justify-between gap-3">
//                         <div className="flex flex-col gap-1">
//                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 border border-gray-300 text-xs font-mono">
//                                 {v.code}
//                             </div>
//                             <div className="text-xs text-blue-600">
//                                 HSD: {formatDate(v.end_date)}
//                             </div>
//                         </div>

//                         <button
//                             type="button"
//                             onClick={() => handleCopy(v.code)}
//                             className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-600 transition"
//                         >
//                             Copy mã
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // ========= CARD VOUCHER ĐÃ DÙNG =========
//     const renderUsedCard = (v) => {
//         return (
//             <div
//                 key={`${v.order_id}-${v.code}-${v.used_at}`}
//                 className="flex rounded-xl overflow-hidden shadow-md bg-white border border-gray-200"
//             >
//                 <div className="w-24 bg-gray-300 flex items-center justify-center">
//                     <FaTicketAlt className="text-3xl text-gray-700" />
//                 </div>

//                 <div className="flex-1 p-4 flex flex-col h-full">
//                     <div className="flex items-start justify-between gap-3">
//                         <div className="flex-1 min-w-0">
//                             <div className="font-semibold text-sm text-gray-900 line-clamp-1">
//                                 {v.description || `Mã giảm giá ${v.code}`}
//                             </div>
//                             <div className="text-xs text-gray-600 mt-1">
//                                 Giảm {renderDiscount(v)}
//                             </div>
//                         </div>
//                         <button
//                             type="button"
//                             onClick={() => openDetail(v, "used")}
//                             className="text-xs text-blue-600 hover:underline flex-shrink-0"
//                         >
//                             Chi tiết
//                         </button>
//                     </div>

//                     <div className="mt-2 text-xs text-gray-500">
//                         Đã dùng:{" "}
//                         {v.used_at ? new Date(v.used_at).toLocaleString("vi-VN") : "—"}
//                         <div className="text-[11px] text-gray-400">
//                             Đơn hàng: #{v.order_id}
//                         </div>
//                     </div>

//                     {/* Khối dưới: mã + nút copy ở góc dưới bên phải */}
//                     <div className="mt-auto pt-3 flex items-end justify-between gap-3">
//                         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 border border-gray-300 text-xs font-mono">
//                             {v.code}
//                         </div>
//                         <button
//                             type="button"
//                             onClick={() => handleCopy(v.code)}
//                             className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-600 transition"
//                         >
//                             Copy mã
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     const renderDetailModal = () => {
//         if (!detailVoucher) return null;
//         const v = detailVoucher;

//         return (
//             <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
//                 <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-3 flex flex-col max-h-[90vh]">
//                     {/* Header */}
//                     <div className="px-4 py-3 border-b flex items-center justify-between">
//                         <h3 className="text-sm font-semibold text-blue-700 uppercase">
//                             Điều kiện áp dụng
//                         </h3>
//                         <button
//                             type="button"
//                             onClick={closeDetail}
//                             className="text-gray-400 hover:text-gray-600 text-lg leading-none"
//                         >
//                             ✕
//                         </button>
//                     </div>

//                     {/* Body */}
//                     <div className="px-4 py-4 overflow-y-auto text-sm text-gray-800 space-y-3">
//                         <div>
//                             <div className="font-semibold">
//                                 {v.description || `Mã giảm giá ${v.code}`}
//                             </div>
//                             <div className="mt-1">
//                                 Mã:{" "}
//                                 <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
//                                     {v.code}
//                                 </span>
//                             </div>
//                         </div>

//                         <ul className="list-disc pl-5 space-y-1 text-sm">
//                             <li>
//                                 Giá trị ưu đãi:{" "}
//                                 <span className="font-semibold">{renderDiscount(v)}</span>
//                             </li>
//                             {Number(v.min_order_value) > 0 && (
//                                 <li>
//                                     Áp dụng cho đơn từ{" "}
//                                     <span className="font-semibold">
//                                         {Number(v.min_order_value).toLocaleString("vi-VN")}₫
//                                     </span>{" "}
//                                     trở lên.
//                                 </li>
//                             )}
//                             {Number(v.max_discount) > 0 && (
//                                 <li>
//                                     Giảm tối đa{" "}
//                                     <span className="font-semibold">
//                                         {Number(v.max_discount).toLocaleString("vi-VN")}₫
//                                     </span>
//                                 </li>
//                             )}
//                             <li>
//                                 Thời gian áp dụng:{" "}
//                                 <span className="font-semibold">
//                                     {formatDate(v.start_date)} – {formatDate(v.end_date)}
//                                 </span>
//                             </li>
//                             {v.usage_limit != null && v.usage_limit !== undefined && (
//                                 <li>
//                                     Giới hạn tối đa:{" "}
//                                     <span className="font-semibold">
//                                         {v.usage_limit} lượt sử dụng
//                                     </span>{" "}
//                                     (toàn hệ thống).
//                                 </li>
//                             )}
//                             {detailType === "used" && v.used_at && (
//                                 <li>
//                                     Bạn đã sử dụng mã này lúc{" "}
//                                     <span className="font-semibold">
//                                         {new Date(v.used_at).toLocaleString("vi-VN")}
//                                     </span>{" "}
//                                     cho đơn hàng{" "}
//                                     <span className="font-semibold">#{v.order_id}</span>.
//                                 </li>
//                             )}
//                         </ul>
//                     </div>

//                     {/* Footer */}
//                     <div className="px-4 py-3 border-t">
//                         <button
//                             type="button"
//                             onClick={() => handleCopy(v.code)}
//                             className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600"
//                         >
//                             COPY MÃ
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <div className="space-y-6">
//             {/* Voucher khả dụng */}
//             <div className="rounded-2xl border border-gray-200 bg-white p-5">
//                 <div className="flex items-center justify-between mb-4">
//                     <h2 className="text-lg font-semibold">Voucher khả dụng</h2>
//                     {loading && <span className="text-xs text-gray-500">Đang tải...</span>}
//                 </div>

//                 {!available.length && !loading && (
//                     <div className="text-sm text-gray-600">
//                         Không có voucher phù hợp.
//                     </div>
//                 )}

//                 {!!available.length && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
//                         {available.map(renderAvailableCard)}
//                     </div>
//                 )}
//             </div>

//             {/* Voucher đã dùng */}
//             <div className="rounded-2xl border border-gray-200 bg-white p-5">
//                 <h2 className="text-lg font-semibold mb-4">Voucher đã dùng</h2>

//                 {!used.length ? (
//                     <div className="text-sm text-gray-600">
//                         {loading ? "Đang tải..." : "Chưa dùng voucher nào."}
//                     </div>
//                 ) : (
//                     <div className="space-y-4">
//                         {used.map(renderUsedCard)}
//                     </div>
//                 )}
//             </div>

//             {renderDetailModal()}
//         </div>
//     );
// }
