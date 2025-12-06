// frontend/src/components/chatbot/ChatLauncher.jsx
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import summaryApi, { authHeaders } from "../../common";
import { useCart } from "../../context/CartContext";

const LS_KEY = "chatbot_conversation_id";
const LS_MSG_KEY = "chatbot_messages";

const ORDER_DETAIL_BASE_PATH = "/orders";
const BOOK_DETAIL_BASE_PATH = "/product";
const CART_PATH = "/cart";

function StatusDot({ status }) {
    const color =
        status === "ok"
            ? "bg-emerald-500"
            : status === "checking"
                ? "bg-amber-400"
                : "bg-rose-500";
    return (
        <span
            className={`inline-block h-2.5 w-2.5 rounded-full border border-white/60 ${color}`}
        />
    );
}

// Avatar bot
function BotAvatar() {
    return (
        <div className="h-9 w-9 rounded-full bg-rose-600 text-white grid place-items-center shadow">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a6 6 0 0 1-12 0v-1H3a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4h4Zm-6 9H4a1 1 0 0 0 0 2h2v-2Zm14 0h-2v2h2a1 1 0 0 0 0-2ZM14 6a2 2 0 1 0-4 0v1h4V6Zm-7 8a4 4 0 1 0 8 0v-1H7v1Z" />
            </svg>
        </div>
    );
}

function TypingDots() {
    return (
        <span className="inline-flex gap-1 items-center">
            <span className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 animate-bounce" />
        </span>
    );
}

/** ================= Products Message ================= **/
function ProductsMessage({ items, onAction }) {
    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-800">
                Gợi ý cho bạn
            </div>

            {/* 2 cột, cuộn dọc */}
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 pb-1">
                {items.map((b) => (
                    <div
                        key={b.id}
                        className="flex flex-col h-full rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >
                        {/* Ảnh */}
                        <img
                            src={
                                b.image ||
                                `https://placehold.co/220x220?text=${encodeURIComponent(
                                    (b.title || "Book").slice(0, 18)
                                )}`
                            }
                            alt={b.title}
                            className="w-full h-[150px] object-cover rounded-t-2xl"
                            onError={(e) => {
                                e.currentTarget.src = `https://placehold.co/220x220?text=${encodeURIComponent(
                                    (b.title || "Book").slice(0, 18)
                                )}`;
                            }}
                        />

                        {/* Nội dung */}
                        <div className="flex-1 p-3 flex flex-col">
                            <div className="text-[13px] font-semibold line-clamp-2 min-h-[36px]">
                                {b.title}
                            </div>
                            {b.author && (
                                <div className="mt-0.5 text-[12px] text-zinc-500 line-clamp-1">
                                    {b.author}
                                </div>
                            )}

                            <div className="mt-1 text-[14px] font-bold text-rose-600">
                                {Number(b.price || 0).toLocaleString("vi-VN")} ₫
                            </div>

                            {typeof b.rating === "number" && (
                                <div className="mt-0.5 text-[12px] text-amber-600">
                                    ★ {b.rating.toFixed(1)}
                                </div>
                            )}

                            {/* Nút hành động */}
                            <div className="mt-3 space-y-1.5">
                                {/* Xem thêm (nền sáng) */}
                                <button
                                    onClick={() => onAction("view", b)}
                                    className="w-full px-2 py-1.5 text-[12px] rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition text-zinc-800"
                                >
                                    Xem thêm
                                </button>

                                {/* Mua ngay (nền đỏ) */}
                                <button
                                    onClick={() => onAction("buy_now", b)}
                                    className="w-full px-2 py-1.5 text-[12px] rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
                                >
                                    Mua ngay
                                </button>

                                {/* Tương tự + <200k (nền sáng) */}
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => onAction("similar", b)}
                                        className="flex-1 px-2 py-1.5 text-[11px] rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition text-zinc-800"
                                    >
                                        Tương tự
                                    </button>
                                    <button
                                        onClick={() => onAction("under_200k", b)}
                                        className="flex-1 px-2 py-1.5 text-[11px] rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition text-zinc-800"
                                    >
                                        &lt;200k
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** ================= Order Status Message ================= **/
function statusClass(s) {
    const map = {
        pending: "bg-amber-100 text-amber-700",
        paid: "bg-emerald-100 text-emerald-700",
        processing: "bg-blue-100 text-blue-700",
        shipped: "bg-indigo-100 text-indigo-700",
        delivered: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-rose-100 text-rose-700",
        refunded: "bg-rose-100 text-rose-700",
    };
    return map[s] || "bg-zinc-100 text-zinc-700";
}
function makeOrderUrl(order) {
    return `${ORDER_DETAIL_BASE_PATH}/${order.id}`;
}
function OrderStatusMessage({ order }) {
    if (!order) return null;
    const href = makeOrderUrl(order);
    const date = order.placed_at ? new Date(order.placed_at) : null;
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 w-[320px]">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Trạng thái đơn hàng</div>
                <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass(
                        order.status
                    )}`}
                >
                    {String(order.status).toUpperCase()}
                </span>
            </div>
            <div className="space-y-1 text-[13px] text-zinc-700">
                {order.tracking_number && (
                    <div>
                        Mã vận đơn:{" "}
                        <span className="font-medium">{order.tracking_number}</span>
                    </div>
                )}
                <div>
                    Tổng tiền:{" "}
                    <span className="font-bold text-rose-600">
                        {Number(order.grand_total || 0).toLocaleString("vi-VN")} ₫
                    </span>
                </div>
                {date && <div>Đặt lúc: {date.toLocaleString("vi-VN")}</div>}
                {order.payment_method && (
                    <div>
                        Thanh toán: {order.payment_method} —{" "}
                        {order.payment_status || "unpaid"}
                    </div>
                )}
            </div>
            <a
                href={href}
                className="mt-3 inline-flex items-center gap-2 text-sm bg-rose-600 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700"
            >
                Xem chi tiết
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
                </svg>
            </a>
        </div>
    );
}

export default function ChatLauncher() {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("checking");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [unread, setUnread] = useState(0);

    const esRef = useRef(null);
    const convRef = useRef(localStorage.getItem(LS_KEY) || "");
    const listRef = useRef(null);
    const taRef = useRef(null);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // Khôi phục lịch sử tin nhắn
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_MSG_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setMessages(parsed);
            }
        } catch (e) {
            console.error("Restore chat messages failed:", e);
        }
    }, []);

    // Lưu tin nhắn
    useEffect(() => {
        try {
            if (!messages || messages.length === 0) {
                localStorage.removeItem(LS_MSG_KEY);
                return;
            }
            localStorage.setItem(LS_MSG_KEY, JSON.stringify(messages));
        } catch (e) {
            console.error("Persist chat messages failed:", e);
        }
    }, [messages]);

    // Auto resize textarea
    // Auto resize textarea
    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        // Reset height về auto trước để tính toán chính xác khi xóa bớt text
        ta.style.height = "auto";
        ta.style.height = Math.min(150, ta.scrollHeight) + "px";
    }, [input]);

    // Auto scroll
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, streaming]);

    // Health check
    useEffect(() => {
        (async () => {
            try {
                setStatus("checking");
                const res = await fetch(summaryApi.url("/chat/health"));
                const data = await res.json();
                setStatus(data?.ok ? "ok" : "error");
            } catch {
                setStatus("error");
            }
        })();
    }, []);

    useEffect(() => {
        if (open) setUnread(0);
    }, [open]);

    function appendMessage(sender, content) {
        if (typeof content === "string" || content == null) {
            setMessages((prev) => [...prev, { sender, text: content || "" }]);
        } else {
            setMessages((prev) => [...prev, { sender, ...content }]);
        }
        if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
    }

    async function ensureConversation() {
        if (convRef.current) return convRef.current;
        const res = await fetch(summaryApi.url("/chat/start"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            body: JSON.stringify({ topic: "Tư vấn mua sách" }),
        });
        if (!res.ok) {
            toast.error("Không tạo được phiên chat");
            throw new Error("start conv failed");
        }
        const data = await res.json();
        convRef.current = data.conversationId;
        localStorage.setItem(LS_KEY, convRef.current);
        return convRef.current;
    }

    function stopStream() {
        try {
            esRef.current?.close?.();
        } catch { }
        setStreaming(false);
    }

    function resetChat(keepConversation = true) {
        stopStream();
        setMessages([]);
        localStorage.removeItem(LS_MSG_KEY);
        if (!keepConversation) {
            convRef.current = "";
            localStorage.removeItem(LS_KEY);
        }
    }

    async function handleSend(passText) {
        const text = (typeof passText === "string" ? passText : input).trim();
        if (!text || streaming) return;
        setInput("");
        appendMessage("user", text);
        setStreaming(true);

        try {
            const convId = await ensureConversation();

            const streamUrl =
                summaryApi.chat?.streamUrl?.(text, convId) ||
                (() => {
                    const url = new URL(summaryApi.url("/chat/stream"));
                    url.searchParams.set("q", text);
                    url.searchParams.set("conversationId", convId);
                    const h = authHeaders?.() || {};
                    const raw = (h.Authorization || h.authorization || "").replace(
                        /^Bearer\s+/i,
                        ""
                    );
                    if (raw) url.searchParams.set("token", raw);
                    return url.toString();
                })();

            esRef.current?.close?.();
            const es = new EventSource(streamUrl, { withCredentials: true });
            esRef.current = es;

            let aiBuffer = "";
            appendMessage("ai", "");

            es.addEventListener("ui", (ev) => {
                try {
                    const payload = JSON.parse(ev.data);
                    if (payload?.type === "products" && Array.isArray(payload.items)) {
                        appendMessage("ai", {
                            type: "products",
                            payload: { items: payload.items },
                        });
                    }
                    if (payload?.type === "order_status" && payload.order) {
                        appendMessage("ai", { type: "order_status", order: payload.order });
                    }
                } catch { }
            });

            es.addEventListener("delta", (ev) => {
                aiBuffer += ev.data;
                setMessages((prev) => {
                    const copy = [...prev];
                    for (let i = copy.length - 1; i >= 0; i--) {
                        if (copy[i]?.sender === "ai" && typeof copy[i]?.text === "string") {
                            copy[i] = { sender: "ai", text: aiBuffer };
                            break;
                        }
                    }
                    return copy;
                });
            });

            es.addEventListener("done", () => {
                es.close();
                setStreaming(false);
            });

            es.addEventListener("error", (ev) => {
                console.error("SSE error", ev);
                try {
                    const payload = ev.data ? JSON.parse(ev.data) : null;
                    toast.error(payload?.message || "Lỗi stream phản hồi");
                } catch {
                    toast.error("Lỗi stream phản hồi");
                }
                es.close();
                setStreaming(false);
            });
        } catch {
            setStreaming(false);
        }
    }

    const quickPrompts = [
        "Gợi ý 5 cuốn bán chạy trong tháng",
        "Sách lập trình cho người mới, ngân sách 200k",
        "Sách kỹ năng mềm rating cao",
        "Kiểm tra trạng thái đơn #ABC123",
    ];

    return (
        <>
            {/* Nút mở chat dạng bubble */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-[9999] h-14 w-14 rounded-full bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white shadow-xl flex items-center justify-center hover:bg-rose-500 transition"
                    aria-label="Mở trợ lý AI"
                >
                    <div className="relative">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                            <path d="M4 4h16v9a4 4 0 0 1-4 4H9l-4 3v-3H4V4Zm4 8h2v-2H8v2Zm4 0h2v-2h-2v2Zm4 0h2v-2h-2v2Z" />
                        </svg>
                        <span className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={status} />
                        </span>
                        {unread > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-[11px] text-white flex items-center justify-center px-1">
                                {unread}
                            </span>
                        )}
                    </div>
                </button>
            )}

            {/* Khung chat */}
            {open && (
                <div className="fixed bottom-4 right-2 md:right-6 z-[9998] pointer-events-none">
                    <div className="ml-auto w-[340px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-[560px] md:h-[620px] max-h-[80vh] pointer-events-auto">
                        <div className="flex h-full flex-col rounded-3xl shadow-2xl bg-zinc-100 overflow-hidden ring-1 ring-black/5">
                            {/* Header */}
                            <div className="bg-zinc-800 text-white px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BotAvatar />
                                    <div>
                                        <p className="font-semibold text-[15px]">
                                            Trợ lý BookStore
                                        </p>
                                        <p className="text-[11px] text-zinc-200 flex items-center gap-2">
                                            <StatusDot status={status} />
                                            {status === "ok"
                                                ? "Đang trực tuyến"
                                                : status === "checking"
                                                    ? "Đang kiểm tra cấu hình…"
                                                    : "Không khả dụng"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => resetChat(true)}
                                        className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-100"
                                        title="Xoá nội dung chat"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-4 w-4"
                                            fill="currentColor"
                                        >
                                            <path d="M6 7h12l-1 13H7L6 7Zm3-4h6l1 2H8l1-2Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => resetChat(false)}
                                        className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-100"
                                        title="Tạo phiên mới"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-4 w-4"
                                            fill="currentColor"
                                        >
                                            <path d="M12 5v4l4-4-4-4v4a7 7 0 0 0-7 7h2a5 5 0 0 1 5-5Zm7 7a7 7 0 0 1-7 7v-4l-4 4 4 4v-4a9 9 0 0 0 9-9h-2Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            stopStream();
                                            setOpen(false);
                                        }}
                                        className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-100"
                                        title="Đóng"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={listRef}
                                className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-zinc-900"
                            >
                                {messages.length === 0 && (
                                    <div className="text-[14px] leading-relaxed">
                                        <p className="mb-3 text-zinc-800">
                                            Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách
                                            hoặc kiểm tra trạng thái đơn hàng cho bạn. Bắt đầu bằng một
                                            câu hỏi bất kỳ nhé. 📚
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                "Gợi ý 5 cuốn bán chạy trong tháng",
                                                "Sách lập trình cho người mới, ngân sách 200k",
                                                "Sách kỹ năng mềm rating cao",
                                                "Kiểm tra trạng thái đơn #ABC123",
                                            ].map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => handleSend(q)}
                                                    className="px-3 py-1.5 text-xs rounded-full bg-zinc-50 border border-zinc-200 hover:border-rose-400 hover:text-rose-600 transition text-zinc-700"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((m, i) => {
                                    const isUser = m.sender === "user";
                                    const isUiBlock =
                                        m.type === "products" || m.type === "order_status";

                                    let bubbleClass = "";
                                    if (isUiBlock) {
                                        bubbleClass = "max-w-full";
                                    } else {
                                        bubbleClass = [
                                            "max-w-[80%] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm",
                                            isUser
                                                ? "bg-rose-600 text-white rounded-2xl rounded-br-sm"
                                                : "bg-gray-100 text-zinc-900 border border-zinc-200 rounded-2xl rounded-bl-sm",
                                        ].join(" ");
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            {!isUser && <BotAvatar />}
                                            <div className={bubbleClass}>
                                                {m.type === "products" ? (
                                                    <ProductsMessage
                                                        items={m.payload?.items || []}
                                                        onAction={async (act, book) => {
                                                            if (act === "view") {
                                                                navigate(
                                                                    `${BOOK_DETAIL_BASE_PATH}/${book.id}`
                                                                );
                                                            } else if (act === "buy_now") {
                                                                const ok = await addToCart(
                                                                    {
                                                                        id: book.id,
                                                                        title: book.title,
                                                                        price: Number(book.price || 0),
                                                                        image_url: book.image,
                                                                    },
                                                                    1
                                                                );
                                                                if (ok) {
                                                                    toast.success(
                                                                        "Đã thêm vào giỏ hàng",
                                                                        {
                                                                            autoClose: 1200,
                                                                        }
                                                                    );
                                                                    navigate(CART_PATH);
                                                                }
                                                            } else if (act === "similar") {
                                                                handleSend(
                                                                    `Gợi ý tương tự cho "${book.title}"`
                                                                );
                                                            } else if (act === "under_200k") {
                                                                handleSend(
                                                                    `Lọc sách dưới 200000 VNĐ liên quan "${book.title}"`
                                                                );
                                                            }
                                                        }}
                                                    />
                                                ) : m.type === "order_status" ? (
                                                    <OrderStatusMessage order={m.order} />
                                                ) : (
                                                    <div className="whitespace-pre-wrap">
                                                        {m.text ||
                                                            (streaming && !isUser ? (
                                                                <TypingDots />
                                                            ) : null)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Composer */}
                            <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
                                <div className="flex items-end gap-2 rounded-3xl bg-white border border-zinc-300 px-3 py-2 shadow-sm focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-200 transition-all">
                                    <textarea
                                        ref={taRef}
                                        className="flex-1 max-h-[150px] bg-transparent border-none outline-none resize-none text-[14px] leading-6 text-zinc-900 placeholder:text-zinc-400 py-1"
                                        placeholder={
                                            streaming
                                                ? "Đang phản hồi..."
                                                : "Nhập câu hỏi..."
                                        }
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        rows={1}
                                        disabled={streaming}
                                    />

                                    {/* Nút gửi / dừng */}
                                    <div className="pb-1"> {/* Wrapper để căn nút xuống đáy nếu textarea nhiều dòng */}
                                        {!streaming ? (
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!input.trim()}
                                                className="flex-shrink-0 h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-700 disabled:opacity-50 disabled:shadow-none transition-all"
                                            >
                                                <svg viewBox="0 0 24 24" className="h-4 w-4 ml-0.5" fill="currentColor">
                                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    try { esRef.current?.close?.(); } catch { }
                                                    setStreaming(false);
                                                }}
                                                className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-300 transition-all"
                                                title="Dừng"
                                            >
                                                <div className="h-2.5 w-2.5 bg-current rounded-sm" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 px-1">
                                    <span className="flex items-center gap-1.5">
                                        {status === "ok" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                                        {status === "ok"
                                            ? "Được tư vấn bởi AI, thông tin chỉ mang tính tham khảo."
                                            : status === "checking"
                                                ? "Đang kết nối..."
                                                : "Mất kết nối"}
                                    </span>
                                    <span>Shift+Enter xuống dòng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

//code 1
// // frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import summaryApi, { authHeaders } from "../../common";
// import { useCart } from "../../context/CartContext";

// const LS_KEY = "chatbot_conversation_id";
// const LS_MSG_KEY = "chatbot_messages";

// const ORDER_DETAIL_BASE_PATH = "/orders";
// const BOOK_DETAIL_BASE_PATH = "/product";
// const CART_PATH = "/cart";

// function StatusDot({ status }) {
//     const color =
//         status === "ok"
//             ? "bg-emerald-500"
//             : status === "checking"
//                 ? "bg-amber-500"
//                 : "bg-rose-500";
//     return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
// }

// function BotAvatar() {
//     return (
//         <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shadow-sm">
//             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
//                 <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a6 6 0 0 1-12 0v-1H3a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4h4Zm-6 9H4a1 1 0 0 0 0 2h2v-2Zm14 0h-2v2h2a1 1 0 0 0 0-2ZM14 6a2 2 0 1 0-4 0v1h4V6Zm-7 8a4 4 0 1 0 8 0v-1H7v1Z" />
//             </svg>
//         </div>
//     );
// }

// // Avatar user giữ lại nếu sau này cần, hiện tại không dùng
// function UserAvatar() {
//     return (
//         <div className="h-8 w-8 rounded-xl bg-rose-600 text-white grid place-items-center shadow-sm">
//             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
//                 <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-9 8a9 9 0 0 1 18 0H3Z" />
//             </svg>
//         </div>
//     );
// }

// function TypingDots() {
//     return (
//         <span className="inline-flex gap-1 items-center">
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce" />
//         </span>
//     );
// }

// // ============ Products Message ============
// // Card to, rõ; 2 cột; các nút full hàng như yêu cầu
// function ProductsMessage({ items, onAction }) {
//     return (
//         <div className="space-y-3">
//             <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
//                 Gợi ý cho bạn
//             </div>

//             {/* 2 cột, card cao & rõ, cuộn dọc */}
//             <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 pb-1">
//                 {items.map((b) => (
//                     <div
//                         key={b.id}
//                         className="flex flex-col h-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
//                     >
//                         {/* Ảnh sách */}
//                         <img
//                             src={
//                                 b.image ||
//                                 `https://placehold.co/220x220?text=${encodeURIComponent(
//                                     (b.title || "Book").slice(0, 18)
//                                 )}`
//                             }
//                             alt={b.title}
//                             className="w-full h-[150px] object-cover rounded-t-2xl"
//                             onError={(e) => {
//                                 e.currentTarget.src = `https://placehold.co/220x220?text=${encodeURIComponent(
//                                     (b.title || "Book").slice(0, 18)
//                                 )}`;
//                             }}
//                         />

//                         {/* Nội dung */}
//                         <div className="flex-1 p-3 flex flex-col">
//                             <div className="text-[13px] font-semibold line-clamp-2 min-h-[36px]">
//                                 {b.title}
//                             </div>
//                             {b.author && (
//                                 <div className="mt-0.5 text-[12px] text-zinc-500 line-clamp-1">
//                                     {b.author}
//                                 </div>
//                             )}

//                             <div className="mt-1 text-[14px] font-bold text-rose-600">
//                                 {Number(b.price || 0).toLocaleString("vi-VN")} ₫
//                             </div>

//                             {typeof b.rating === "number" && (
//                                 <div className="mt-0.5 text-[12px] text-amber-600">
//                                     ★ {b.rating.toFixed(1)}
//                                 </div>
//                             )}

//                             {/* Nhóm nút hành động */}
//                             <div className="mt-3 space-y-1.5">
//                                 {/* Xem thêm - full hàng */}
//                                 <button
//                                     onClick={() => onAction("view", b)}
//                                     className="w-full px-2 py-1.5 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
//                                 >
//                                     Xem thêm
//                                 </button>

//                                 {/* Mua ngay - full hàng, nổi bật */}
//                                 <button
//                                     onClick={() => onAction("buy_now", b)}
//                                     className="w-full px-2 py-1.5 text-[12px] rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
//                                 >
//                                     Mua ngay
//                                 </button>

//                                 {/* Tương tự + <200k cùng 1 hàng */}
//                                 <div className="flex gap-1.5">
//                                     <button
//                                         onClick={() => onAction("similar", b)}
//                                         className="flex-1 px-2 py-1.5 text-[11px] rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
//                                     >
//                                         Tương tự
//                                     </button>
//                                     <button
//                                         onClick={() => onAction("under_200k", b)}
//                                         className="flex-1 px-2 py-1.5 text-[11px] rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
//                                     >
//                                         &lt;200k
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// // ============ Order Status Message ============
// function statusClass(s) {
//     const map = {
//         pending: "bg-amber-100 text-amber-700",
//         paid: "bg-emerald-100 text-emerald-700",
//         processing: "bg-blue-100 text-blue-700",
//         shipped: "bg-indigo-100 text-indigo-700",
//         delivered: "bg-emerald-100 text-emerald-700",
//         cancelled: "bg-rose-100 text-rose-700",
//         refunded: "bg-rose-100 text-rose-700",
//     };
//     return map[s] || "bg-zinc-100 text-zinc-700";
// }

// function makeOrderUrl(order) {
//     return `${ORDER_DETAIL_BASE_PATH}/${order.id}`;
// }

// function OrderStatusMessage({ order }) {
//     if (!order) return null;
//     const href = makeOrderUrl(order);
//     const date = order.placed_at ? new Date(order.placed_at) : null;
//     return (
//         <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 w-[320px]">
//             <div className="flex items-center justify-between mb-2">
//                 <div className="text-sm font-semibold">Trạng thái đơn hàng</div>
//                 <span
//                     className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass(
//                         order.status
//                     )}`}
//                 >
//                     {String(order.status).toUpperCase()}
//                 </span>
//             </div>
//             <div className="space-y-1 text-[13px] text-zinc-700 dark:text-zinc-200">
//                 {order.tracking_number && (
//                     <div>
//                         Mã vận đơn:{" "}
//                         <span className="font-medium">{order.tracking_number}</span>
//                     </div>
//                 )}
//                 <div>
//                     Tổng tiền:{" "}
//                     <span className="font-bold text-rose-600">
//                         {Number(order.grand_total || 0).toLocaleString("vi-VN")} ₫
//                     </span>
//                 </div>
//                 {date && <div>Đặt lúc: {date.toLocaleString("vi-VN")}</div>}
//                 {order.payment_method && (
//                     <div>
//                         Thanh toán: {order.payment_method} —{" "}
//                         {order.payment_status || "unpaid"}
//                     </div>
//                 )}
//             </div>
//             <a
//                 href={href}
//                 className="mt-3 inline-flex items-center gap-2 text-sm bg-rose-600 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700"
//             >
//                 Xem chi tiết
//                 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
//                     <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
//                 </svg>
//             </a>
//         </div>
//     );
// }

// export default function ChatLauncher() {
//     const [open, setOpen] = useState(false);
//     const [status, setStatus] = useState("checking");
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");
//     const [streaming, setStreaming] = useState(false);
//     const [unread, setUnread] = useState(0);

//     const esRef = useRef(null);
//     const convRef = useRef(localStorage.getItem(LS_KEY) || "");
//     const listRef = useRef(null);
//     const taRef = useRef(null);
//     const navigate = useNavigate();
//     const { addToCart } = useCart();

//     // Khôi phục lịch sử tin nhắn từ localStorage
//     useEffect(() => {
//         try {
//             const raw = localStorage.getItem(LS_MSG_KEY);
//             if (raw) {
//                 const parsed = JSON.parse(raw);
//                 if (Array.isArray(parsed)) setMessages(parsed);
//             }
//         } catch (e) {
//             console.error("Restore chat messages failed:", e);
//         }
//     }, []);

//     // Lưu tin nhắn vào localStorage
//     useEffect(() => {
//         try {
//             if (!messages || messages.length === 0) {
//                 localStorage.removeItem(LS_MSG_KEY);
//                 return;
//             }
//             localStorage.setItem(LS_MSG_KEY, JSON.stringify(messages));
//         } catch (e) {
//             console.error("Persist chat messages failed:", e);
//         }
//     }, [messages]);

//     // Auto resize textarea
//     useEffect(() => {
//         const ta = taRef.current;
//         if (!ta) return;
//         ta.style.height = "0px";
//         ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + "px";
//     }, [input]);

//     // Auto scroll
//     useEffect(() => {
//         if (!listRef.current) return;
//         listRef.current.scrollTo({
//             top: listRef.current.scrollHeight,
//             behavior: "smooth",
//         });
//     }, [messages, streaming]);

//     // Health check
//     useEffect(() => {
//         (async () => {
//             try {
//                 setStatus("checking");
//                 const res = await fetch(summaryApi.url("/chat/health"));
//                 const data = await res.json();
//                 setStatus(data?.ok ? "ok" : "error");
//             } catch {
//                 setStatus("error");
//             }
//         })();
//     }, []);

//     useEffect(() => {
//         if (open) setUnread(0);
//     }, [open]);

//     function appendMessage(sender, content) {
//         if (typeof content === "string" || content == null) {
//             setMessages((prev) => [...prev, { sender, text: content || "" }]);
//         } else {
//             setMessages((prev) => [...prev, { sender, ...content }]);
//         }
//         if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
//     }

//     async function ensureConversation() {
//         if (convRef.current) return convRef.current;
//         const res = await fetch(summaryApi.url("/chat/start"), {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 ...authHeaders(),
//             },
//             body: JSON.stringify({ topic: "Tư vấn mua sách" }),
//         });
//         if (!res.ok) {
//             toast.error("Không tạo được phiên chat");
//             throw new Error("start conv failed");
//         }
//         const data = await res.json();
//         convRef.current = data.conversationId;
//         localStorage.setItem(LS_KEY, convRef.current);
//         return convRef.current;
//     }

//     function stopStream() {
//         try {
//             esRef.current?.close?.();
//         } catch { }
//         setStreaming(false);
//     }

//     function resetChat(keepConversation = true) {
//         stopStream();
//         setMessages([]);
//         localStorage.removeItem(LS_MSG_KEY);
//         if (!keepConversation) {
//             convRef.current = "";
//             localStorage.removeItem(LS_KEY);
//         }
//     }

//     async function handleSend(passText) {
//         const text = (typeof passText === "string" ? passText : input).trim();
//         if (!text || streaming) return;
//         setInput("");
//         appendMessage("user", text);
//         setStreaming(true);

//         try {
//             const convId = await ensureConversation();

//             const streamUrl =
//                 summaryApi.chat?.streamUrl?.(text, convId) ||
//                 (() => {
//                     const url = new URL(summaryApi.url("/chat/stream"));
//                     url.searchParams.set("q", text);
//                     url.searchParams.set("conversationId", convId);
//                     const h = authHeaders?.() || {};
//                     const raw = (h.Authorization || h.authorization || "").replace(
//                         /^Bearer\s+/i,
//                         ""
//                     );
//                     if (raw) url.searchParams.set("token", raw);
//                     return url.toString();
//                 })();

//             esRef.current?.close?.();
//             const es = new EventSource(streamUrl, { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", "");

//             es.addEventListener("ui", (ev) => {
//                 try {
//                     const payload = JSON.parse(ev.data);
//                     if (payload?.type === "products" && Array.isArray(payload.items)) {
//                         appendMessage("ai", {
//                             type: "products",
//                             payload: { items: payload.items },
//                         });
//                     }
//                     if (payload?.type === "order_status" && payload.order) {
//                         appendMessage("ai", { type: "order_status", order: payload.order });
//                     }
//                 } catch { }
//             });

//             es.addEventListener("delta", (ev) => {
//                 aiBuffer += ev.data;
//                 setMessages((prev) => {
//                     const copy = [...prev];
//                     for (let i = copy.length - 1; i >= 0; i--) {
//                         if (copy[i]?.sender === "ai" && typeof copy[i]?.text === "string") {
//                             copy[i] = { sender: "ai", text: aiBuffer };
//                             break;
//                         }
//                     }
//                     return copy;
//                 });
//             });

//             es.addEventListener("done", () => {
//                 es.close();
//                 setStreaming(false);
//             });

//             es.addEventListener("error", (ev) => {
//                 console.error("SSE error", ev);
//                 try {
//                     const payload = ev.data ? JSON.parse(ev.data) : null;
//                     toast.error(payload?.message || "Lỗi stream phản hồi");
//                 } catch {
//                     toast.error("Lỗi stream phản hồi");
//                 }
//                 es.close();
//                 setStreaming(false);
//             });
//         } catch {
//             setStreaming(false);
//         }
//     }

//     const quickPrompts = [
//         "Gợi ý 5 cuốn bán chạy trong tháng",
//         "Sách lập trình cho người mới, ngân sách 200k",
//         "Sách kỹ năng mềm rating cao",
//         "Kiểm tra trạng thái đơn #ABC123",
//     ];

//     return (
//         <>
//             {/* Nút Hỏi AI chỉ hiện khi KHÔNG mở chat */}
//             {!open && (
//                 <button
//                     onClick={() => setOpen(true)}
//                     className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-lg px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
//                     aria-label="Mở trợ lý AI"
//                 >
//                     <StatusDot status={status} />
//                     <span className="font-medium">Hỏi AI</span>
//                     {unread > 0 && (
//                         <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
//                             {unread}
//                         </span>
//                     )}
//                 </button>
//             )}

//             {/* Khung chat cố định, sát đáy, không chặn toàn màn hình */}
//             {open && (
//                 <div className="fixed bottom-4 right-2 md:right-6 z-[9998] pointer-events-none">
//                     <div className="ml-auto w-[340px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-[560px] md:h-[620px] max-h-[80vh] pointer-events-auto">
//                         <div className="flex h-full flex-col rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
//                             {/* Header */}
//                             <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                     <BotAvatar />
//                                     <div>
//                                         <p className="font-semibold text-zinc-900 dark:text-zinc-50">
//                                             Trợ lý BookStore
//                                         </p>
//                                         <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
//                                             <StatusDot status={status} />
//                                             {status === "ok"
//                                                 ? "Sẵn sàng"
//                                                 : status === "checking"
//                                                     ? "Đang kiểm tra…"
//                                                     : "Lỗi cấu hình"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button
//                                         onClick={() => resetChat(true)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
//                                     >
//                                         Xoá chat
//                                     </button>
//                                     <button
//                                         onClick={() => resetChat(false)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
//                                     >
//                                         Phiên mới
//                                     </button>
//                                     <button
//                                         onClick={() => {
//                                             stopStream();
//                                             setOpen(false);
//                                         }}
//                                         className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
//                                         title="Đóng"
//                                     >
//                                         ✕
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* Messages */}
//                             <div
//                                 ref={listRef}
//                                 className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-zinc-50/70 to-white/70 dark:from-zinc-950/60 dark:to-zinc-900/60 text-zinc-900 dark:text-zinc-50"
//                             >
//                                 {messages.length === 0 && (
//                                     <div className="text-[15px] leading-relaxed">
//                                         <p className="mb-3 text-zinc-800 dark:text-zinc-100">
//                                             Xin chào! Mình có thể gợi ý sách theo thể loại, ngân
//                                             sách; hoặc kiểm tra trạng thái đơn hàng. Bắt đầu bằng một
//                                             câu hỏi nha. 📚
//                                         </p>
//                                         <div className="flex flex-wrap gap-2">
//                                             {quickPrompts.map((q) => (
//                                                 <button
//                                                     key={q}
//                                                     onClick={() => handleSend(q)}
//                                                     className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600 dark:hover:border-rose-400 transition text-zinc-700 dark:text-zinc-100"
//                                                 >
//                                                     {q}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {messages.map((m, i) => {
//                                     const isUser = m.sender === "user";
//                                     return (
//                                         <div
//                                             key={i}
//                                             className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"
//                                                 }`}
//                                         >
//                                             {!isUser && <BotAvatar />}
//                                             <div
//                                                 className={[
//                                                     "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
//                                                     isUser
//                                                         ? "bg-rose-600 text-white rounded-tr-[8px]"
//                                                         : "bg-white/95 dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-50 rounded-tl-[8px] border border-zinc-100 dark:border-zinc-700",
//                                                 ].join(" ")}
//                                             >
//                                                 {m.type === "products" ? (
//                                                     <ProductsMessage
//                                                         items={m.payload?.items || []}
//                                                         onAction={async (act, book) => {
//                                                             if (act === "view") {
//                                                                 navigate(`${BOOK_DETAIL_BASE_PATH}/${book.id}`);
//                                                             } else if (act === "buy_now") {
//                                                                 const ok = await addToCart(
//                                                                     {
//                                                                         id: book.id,
//                                                                         title: book.title,
//                                                                         price: Number(book.price || 0),
//                                                                         image_url: book.image,
//                                                                     },
//                                                                     1
//                                                                 );
//                                                                 if (ok) {
//                                                                     toast.success("Đã thêm vào giỏ hàng", {
//                                                                         autoClose: 1200,
//                                                                     });
//                                                                     navigate(CART_PATH);
//                                                                 }
//                                                             } else if (act === "similar") {
//                                                                 handleSend(
//                                                                     `Gợi ý tương tự cho "${book.title}"`
//                                                                 );
//                                                             } else if (act === "under_200k") {
//                                                                 handleSend(
//                                                                     `Lọc sách dưới 200000 VNĐ liên quan "${book.title}"`
//                                                                 );
//                                                             }
//                                                         }}
//                                                     />
//                                                 ) : m.type === "order_status" ? (
//                                                     <OrderStatusMessage order={m.order} />
//                                                 ) : (
//                                                     <div className="whitespace-pre-wrap">
//                                                         {m.text ||
//                                                             (streaming && !isUser ? <TypingDots /> : null)}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                             {/* Không hiển thị avatar user nữa */}
//                                         </div>
//                                     );
//                                 })}
//                             </div>

//                             {/* Composer */}
//                             <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800">
//                                 <div className="flex items-end gap-2">
//                                     <textarea
//                                         ref={taRef}
//                                         className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-[15px] leading-6 outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
//                                         placeholder={
//                                             streaming
//                                                 ? "Đang phản hồi..."
//                                                 : "Nhập câu hỏi, ví dụ: Kiểm tra trạng thái đơn #ABC123"
//                                         }
//                                         value={input}
//                                         onChange={(e) => setInput(e.target.value)}
//                                         onKeyDown={(e) => {
//                                             if (e.key === "Enter" && !e.shiftKey) {
//                                                 e.preventDefault();
//                                                 handleSend();
//                                             }
//                                         }}
//                                         rows={1}
//                                         disabled={streaming}
//                                     />
//                                     {!streaming ? (
//                                         <button
//                                             onClick={() => handleSend()}
//                                             disabled={!input.trim()}
//                                             className="rounded-2xl bg-rose-600 text-white px-4 py-2 text-sm shadow hover:bg-rose-700 disabled:opacity-50"
//                                         >
//                                             Gửi
//                                         </button>
//                                     ) : (
//                                         <button
//                                             onClick={() => {
//                                                 try {
//                                                     esRef.current?.close?.();
//                                                 } catch { }
//                                                 setStreaming(false);
//                                             }}
//                                             className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm shadow hover:bg-zinc-300 dark:hover:bg-zinc-700"
//                                             title="Dừng stream"
//                                         >
//                                             Dừng
//                                         </button>
//                                     )}
//                                 </div>
//                                 <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-600 dark:text-zinc-300">
//                                     <span>
//                                         Trạng thái:{" "}
//                                         {status === "ok"
//                                             ? "Sẵn sàng"
//                                             : status === "checking"
//                                                 ? "Đang kiểm tra…"
//                                                 : "Lỗi cấu hình"}
//                                     </span>
//                                     <span className="italic">
//                                         Nhấn Enter để gửi • Shift+Enter xuống dòng
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }


//code goc
// // frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import summaryApi, { authHeaders } from "../../common";
// import { useCart } from "../../context/CartContext";

// const LS_KEY = "chatbot_conversation_id";

// // Khớp với cấu trúc routing & API của bạn
// const ORDER_DETAIL_BASE_PATH = "/orders"; // trùng summaryApi.order.detail(id)
// const BOOK_DETAIL_BASE_PATH = "/product";   // trùng ProductDetail /books/:id
// const CART_PATH = "/cart";                // trùng trang giỏ hàng

// function StatusDot({ status }) {
//     const color =
//         status === "ok"
//             ? "bg-emerald-500"
//             : status === "checking"
//                 ? "bg-amber-500"
//                 : "bg-rose-500";
//     return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
// }

// function BotAvatar() {
//     return (
//         <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shadow-sm">
//             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
//                 <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a6 6 0 0 1-12 0v-1H3a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4h4Zm-6 9H4a1 1 0 0 0 0 2h2v-2Zm14 0h-2v2h2a1 1 0 0 0 0-2ZM14 6a2 2 0 1 0-4 0v1h4V6Zm-7 8a4 4 0 1 0 8 0v-1H7v1Z" />
//             </svg>
//         </div>
//     );
// }

// function UserAvatar() {
//     return (
//         <div className="h-8 w-8 rounded-xl bg-rose-600 text-white grid place-items-center shadow-sm">
//             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
//                 <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-9 8a9 9 0 0 1 18 0H3Z" />
//             </svg>
//         </div>
//     );
// }

// function TypingDots() {
//     return (
//         <span className="inline-flex gap-1 items-center">
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce" />
//         </span>
//     );
// }

// // ============ Products Message ============
// function ProductsMessage({ items, onAction }) {
//     return (
//         <div className="space-y-3">
//             <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
//                 Gợi ý cho bạn
//             </div>
//             <div className="flex gap-3 overflow-x-auto pb-1">
//                 {items.map((b) => (
//                     <div
//                         key={b.id}
//                         className="min-w-[200px] w-[200px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
//                     >
//                         <img
//                             src={
//                                 b.image ||
//                                 `https://placehold.co/200x200?text=${encodeURIComponent(
//                                     (b.title || "Book").slice(0, 18)
//                                 )}`
//                             }
//                             alt={b.title}
//                             className="w-full h-[140px] object-cover rounded-t-2xl"
//                             onError={(e) => {
//                                 e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent(
//                                     (b.title || "Book").slice(0, 18)
//                                 )}`;
//                             }}
//                         />
//                         <div className="p-3">
//                             <div className="text-[13px] font-semibold line-clamp-2">
//                                 {b.title}
//                             </div>
//                             {b.author && (
//                                 <div className="text-[12px] text-zinc-500 line-clamp-1">
//                                     {b.author}
//                                 </div>
//                             )}
//                             <div className="mt-1 text-[13px] font-bold text-rose-600">
//                                 {Number(b.price || 0).toLocaleString("vi-VN")} ₫
//                             </div>
//                             {typeof b.rating === "number" && (
//                                 <div className="mt-0.5 text-[12px] text-amber-600">
//                                     ★ {b.rating.toFixed(1)}
//                                 </div>
//                             )}
//                             <div className="mt-2 flex flex-wrap gap-1">
//                                 <button
//                                     onClick={() => onAction("view", b)}
//                                     className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
//                                 >
//                                     Xem thêm
//                                 </button>
//                                 <button
//                                     onClick={() => onAction("buy_now", b)}
//                                     className="px-2 py-1 text-[12px] rounded-full bg-rose-600 text-white"
//                                 >
//                                     Mua ngay
//                                 </button>
//                                 <button
//                                     onClick={() => onAction("similar", b)}
//                                     className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
//                                 >
//                                     Tương tự
//                                 </button>
//                                 <button
//                                     onClick={() => onAction("under_200k", b)}
//                                     className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
//                                 >
//                                     &lt;200k
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// // ============ Order Status Message ============
// function statusClass(s) {
//     const map = {
//         pending: "bg-amber-100 text-amber-700",
//         paid: "bg-emerald-100 text-emerald-700",
//         processing: "bg-blue-100 text-blue-700",
//         shipped: "bg-indigo-100 text-indigo-700",
//         delivered: "bg-emerald-100 text-emerald-700",
//         cancelled: "bg-rose-100 text-rose-700",
//         refunded: "bg-rose-100 text-rose-700",
//     };
//     return map[s] || "bg-zinc-100 text-zinc-700";
// }

// function makeOrderUrl(order) {
//     return `${ORDER_DETAIL_BASE_PATH}/${order.id}`;
// }

// function OrderStatusMessage({ order }) {
//     if (!order) return null;
//     const href = makeOrderUrl(order);
//     const date = order.placed_at ? new Date(order.placed_at) : null;
//     return (
//         <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 w-[320px]">
//             <div className="flex items-center justify-between mb-2">
//                 <div className="text-sm font-semibold">Trạng thái đơn hàng</div>
//                 <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass(order.status)}`}>
//                     {String(order.status).toUpperCase()}
//                 </span>
//             </div>
//             <div className="space-y-1 text-[13px] text-zinc-700 dark:text-zinc-200">
//                 {order.tracking_number && (
//                     <div>
//                         Mã vận đơn: <span className="font-medium">{order.tracking_number}</span>
//                     </div>
//                 )}
//                 <div>
//                     Tổng tiền:{" "}
//                     <span className="font-bold text-rose-600">
//                         {Number(order.grand_total || 0).toLocaleString("vi-VN")} ₫
//                     </span>
//                 </div>
//                 {date && <div>Đặt lúc: {date.toLocaleString("vi-VN")}</div>}
//                 {order.payment_method && (
//                     <div>
//                         Thanh toán: {order.payment_method} — {order.payment_status || "unpaid"}
//                     </div>
//                 )}
//             </div>
//             <a
//                 href={href}
//                 className="mt-3 inline-flex items-center gap-2 text-sm bg-rose-600 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700"
//             >
//                 Xem chi tiết
//                 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
//                     <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
//                 </svg>
//             </a>
//         </div>
//     );
// }

// export default function ChatLauncher() {
//     const [open, setOpen] = useState(false);
//     const [status, setStatus] = useState("checking");
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");
//     const [streaming, setStreaming] = useState(false);
//     const [unread, setUnread] = useState(0);
//     const esRef = useRef(null);
//     const convRef = useRef(localStorage.getItem(LS_KEY) || "");
//     const listRef = useRef(null);
//     const taRef = useRef(null);
//     const navigate = useNavigate();
//     const { addToCart } = useCart();

//     useEffect(() => {
//         const ta = taRef.current;
//         if (!ta) return;
//         ta.style.height = "0px";
//         ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + "px";
//     }, [input]);

//     useEffect(() => {
//         if (!listRef.current) return;
//         listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
//     }, [messages, streaming]);

//     useEffect(() => {
//         (async () => {
//             try {
//                 setStatus("checking");
//                 const res = await fetch(summaryApi.url("/chat/health"));
//                 const data = await res.json();
//                 setStatus(data?.ok ? "ok" : "error");
//             } catch {
//                 setStatus("error");
//             }
//         })();
//     }, []);

//     useEffect(() => {
//         if (open) setUnread(0);
//     }, [open]);

//     function appendMessage(sender, content) {
//         if (typeof content === "string" || content == null) {
//             setMessages((prev) => [...prev, { sender, text: content || "" }]);
//         } else {
//             setMessages((prev) => [...prev, { sender, ...content }]);
//         }
//         if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
//     }

//     async function ensureConversation() {
//         if (convRef.current) return convRef.current;
//         const res = await fetch(summaryApi.url("/chat/start"), {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 ...authHeaders(),
//             },
//             body: JSON.stringify({ topic: "Tư vấn mua sách" }),
//         });
//         if (!res.ok) {
//             toast.error("Không tạo được phiên chat");
//             throw new Error("start conv failed");
//         }
//         const data = await res.json();
//         convRef.current = data.conversationId;
//         localStorage.setItem(LS_KEY, convRef.current);
//         return convRef.current;
//     }

//     function stopStream() {
//         try {
//             esRef.current?.close?.();
//         } catch { }
//         setStreaming(false);
//     }

//     function resetChat(keepConversation = true) {
//         stopStream();
//         setMessages([]);
//         if (!keepConversation) {
//             convRef.current = "";
//             localStorage.removeItem(LS_KEY);
//         }
//     }

//     async function handleSend(passText) {
//         const text = (typeof passText === "string" ? passText : input).trim();
//         if (!text || streaming) return;
//         setInput("");
//         appendMessage("user", text);
//         setStreaming(true);

//         try {
//             const convId = await ensureConversation();

//             const streamUrl =
//                 summaryApi.chat?.streamUrl?.(text, convId) ||
//                 (() => {
//                     const url = new URL(summaryApi.url("/chat/stream"));
//                     url.searchParams.set("q", text);
//                     url.searchParams.set("conversationId", convId);
//                     // đưa Bearer token (nếu app bạn lưu token ở authHeaders)
//                     const h = authHeaders?.() || {};
//                     const raw = (h.Authorization || h.authorization || "").replace(/^Bearer\s+/i, "");
//                     if (raw) url.searchParams.set("token", raw);
//                     return url.toString();
//                 })();

//             esRef.current?.close?.();
//             const es = new EventSource(streamUrl, { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", "");

//             es.addEventListener("ui", (ev) => {
//                 try {
//                     const payload = JSON.parse(ev.data);
//                     if (payload?.type === "products" && Array.isArray(payload.items)) {
//                         appendMessage("ai", { type: "products", payload: { items: payload.items } });
//                     }
//                     if (payload?.type === "order_status" && payload.order) {
//                         appendMessage("ai", { type: "order_status", order: payload.order });
//                     }
//                 } catch { }
//             });

//             es.addEventListener("delta", (ev) => {
//                 aiBuffer += ev.data;
//                 setMessages((prev) => {
//                     const copy = [...prev];
//                     for (let i = copy.length - 1; i >= 0; i--) {
//                         if (copy[i]?.sender === "ai" && typeof copy[i]?.text === "string") {
//                             copy[i] = { sender: "ai", text: aiBuffer };
//                             break;
//                         }
//                     }
//                     return copy;
//                 });
//             });

//             es.addEventListener("done", () => {
//                 es.close();
//                 setStreaming(false);
//             });

//             es.addEventListener("error", (ev) => {
//                 console.error("SSE error", ev);
//                 try {
//                     const payload = ev.data ? JSON.parse(ev.data) : null;
//                     toast.error(payload?.message || "Lỗi stream phản hồi");
//                 } catch {
//                     toast.error("Lỗi stream phản hồi");
//                 }
//                 es.close();
//                 setStreaming(false);
//             });
//         } catch {
//             setStreaming(false);
//         }
//     }

//     const quickPrompts = [
//         "Gợi ý 5 cuốn bán chạy trong tháng",
//         "Sách lập trình cho người mới, ngân sách 200k",
//         "Sách kỹ năng mềm rating cao",
//         "Kiểm tra trạng thái đơn #ABC123",
//     ];

//     return (
//         <>
//             <button
//                 onClick={() => setOpen(true)}
//                 className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-lg px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
//                 aria-label="Mở trợ lý AI"
//             >
//                 <StatusDot status={status} />
//                 <span className="font-medium">Hỏi AI</span>
//                 {unread > 0 && (
//                     <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
//                         {unread}
//                     </span>
//                 )}
//             </button>

//             {open && (
//                 <div className="fixed inset-0 z-[9998]">
//                     {/* <div
//                         className="absolute inset-0 bg-black/40"
//                         onClick={() => setOpen(false)}
//                     /> */}
//                     {/* Bỏ overlay hoặc để trong suốt nếu vẫn muốn click-để-đóng */}
//                     {/* <div className="absolute inset-0" onClick={() => setOpen(false)} /> */}
//                     <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">

//                         {/* Nếu không muốn làm mờ nền sau lưng khung chat, bỏ class `backdrop-blur` */}
//                         <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 ring-1 ring-black/5 overflow-hidden"></div>

//                         {/* <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]"> */}
//                         <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
//                             {/* Header */}
//                             <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                     <BotAvatar />
//                                     <div>
//                                         <p className="font-semibold text-zinc-900 dark:text-zinc-50">
//                                             Trợ lý BookStore
//                                         </p>
//                                         <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
//                                             <StatusDot status={status} />
//                                             {status === "ok"
//                                                 ? "Sẵn sàng"
//                                                 : status === "checking"
//                                                     ? "Đang kiểm tra…"
//                                                     : "Lỗi cấu hình"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button
//                                         onClick={() => resetChat(true)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
//                                     >
//                                         Xoá chat
//                                     </button>
//                                     <button
//                                         onClick={() => resetChat(false)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
//                                     >
//                                         Phiên mới
//                                     </button>
//                                     <button
//                                         onClick={() => setOpen(false)}
//                                         className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
//                                         title="Đóng"
//                                     >
//                                         ✕
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* Messages */}
//                             <div
//                                 ref={listRef}
//                                 className="p-5 h-[64vh] overflow-y-auto space-y-4 bg-gradient-to-b from-zinc-50/70 to-white/70 dark:from-zinc-950/60 dark:to-zinc-900/60 text-zinc-900 dark:text-zinc-50"
//                             >
//                                 {messages.length === 0 && (
//                                     <div className="text-[15px] leading-relaxed">
//                                         <p className="mb-3 text-zinc-800 dark:text-zinc-100">
//                                             Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách;
//                                             hoặc kiểm tra trạng thái đơn hàng. Bắt đầu bằng một câu
//                                             hỏi nha. 📚
//                                         </p>
//                                         <div className="flex flex-wrap gap-2">
//                                             {quickPrompts.map((q) => (
//                                                 <button
//                                                     key={q}
//                                                     onClick={() => handleSend(q)}
//                                                     className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600 dark:hover:border-rose-400 transition text-zinc-700 dark:text-zinc-100"
//                                                 >
//                                                     {q}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {messages.map((m, i) => {
//                                     const isUser = m.sender === "user";
//                                     return (
//                                         <div
//                                             key={i}
//                                             className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"
//                                                 }`}
//                                         >
//                                             {!isUser && <BotAvatar />}
//                                             <div
//                                                 className={[
//                                                     "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
//                                                     isUser
//                                                         ? "bg-rose-600 text-white rounded-tr-[8px]"
//                                                         : "bg-white/95 dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-50 rounded-tl-[8px] border border-zinc-100 dark:border-zinc-700",
//                                                 ].join(" ")}
//                                             >
//                                                 {m.type === "products" ? (
//                                                     <ProductsMessage
//                                                         items={m.payload?.items || []}
//                                                         onAction={async (act, book) => {
//                                                             if (act === "view") {
//                                                                 // 👉 Xem chi tiết sách
//                                                                 setOpen(false);
//                                                                 navigate(`${BOOK_DETAIL_BASE_PATH}/${book.id}`);
//                                                             } else if (act === "buy_now") {
//                                                                 // 👉 Mua ngay: dùng CartContext (giống ProductDetail) rồi chuyển tới giỏ
//                                                                 const ok = await addToCart(
//                                                                     {
//                                                                         id: book.id,
//                                                                         title: book.title,
//                                                                         price: Number(book.price || 0),
//                                                                         image_url: book.image,
//                                                                     },
//                                                                     1
//                                                                 );
//                                                                 if (ok) {
//                                                                     toast.success("Đã thêm vào giỏ hàng", {
//                                                                         autoClose: 1200,
//                                                                     });
//                                                                     setOpen(false);
//                                                                     navigate(CART_PATH);
//                                                                 }
//                                                             } else if (act === "similar") {
//                                                                 handleSend(
//                                                                     `Gợi ý tương tự cho "${book.title}"`
//                                                                 );
//                                                             } else if (act === "under_200k") {
//                                                                 handleSend(
//                                                                     `Lọc sách dưới 200000 VNĐ liên quan "${book.title}"`
//                                                                 );
//                                                             }
//                                                         }}
//                                                     />
//                                                 ) : m.type === "order_status" ? (
//                                                     <OrderStatusMessage order={m.order} />
//                                                 ) : (
//                                                     <div className="whitespace-pre-wrap">
//                                                         {m.text ||
//                                                             (streaming && !isUser ? <TypingDots /> : null)}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                             {isUser && <UserAvatar />}
//                                         </div>
//                                     );
//                                 })}
//                             </div>

//                             {/* Composer */}
//                             <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800">
//                                 <div className="flex items-end gap-2">
//                                     <textarea
//                                         ref={taRef}
//                                         className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-[15px] leading-6 outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
//                                         placeholder={
//                                             streaming
//                                                 ? "Đang phản hồi..."
//                                                 : "Nhập câu hỏi, ví dụ: Kiểm tra trạng thái đơn #ABC123"
//                                         }
//                                         value={input}
//                                         onChange={(e) => setInput(e.target.value)}
//                                         onKeyDown={(e) => {
//                                             if (e.key === "Enter" && !e.shiftKey) {
//                                                 e.preventDefault();
//                                                 handleSend();
//                                             }
//                                         }}
//                                         rows={1}
//                                         disabled={streaming}
//                                     />
//                                     {!streaming ? (
//                                         <button
//                                             onClick={() => handleSend()}
//                                             disabled={!input.trim()}
//                                             className="rounded-2xl bg-rose-600 text-white px-4 py-2 text-sm shadow hover:bg-rose-700 disabled:opacity-50"
//                                         >
//                                             Gửi
//                                         </button>
//                                     ) : (
//                                         <button
//                                             onClick={() => {
//                                                 try {
//                                                     esRef.current?.close?.();
//                                                 } catch { }
//                                                 setStreaming(false);
//                                             }}
//                                             className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm shadow hover:bg-zinc-300 dark:hover:bg-zinc-700"
//                                             title="Dừng stream"
//                                         >
//                                             Dừng
//                                         </button>
//                                     )}
//                                 </div>
//                                 <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-600 dark:text-zinc-300">
//                                     <span>
//                                         Trạng thái:{" "}
//                                         {status === "ok"
//                                             ? "Sẵn sàng"
//                                             : status === "checking"
//                                                 ? "Đang kiểm tra…"
//                                                 : "Lỗi cấu hình"}
//                                     </span>
//                                     <span className="italic">
//                                         Nhấn Enter để gửi • Shift+Enter xuống dòng
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }


