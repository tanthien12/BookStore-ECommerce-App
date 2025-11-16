import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import summaryApi, { authHeaders } from "../../common";
import { useCart } from "../../context/CartContext";

const LS_KEY = "chatbot_conversation_id";

// Khớp với cấu trúc routing & API của bạn
const ORDER_DETAIL_BASE_PATH = "/orders"; // trùng summaryApi.order.detail(id)
const BOOK_DETAIL_BASE_PATH = "/product";   // trùng ProductDetail /books/:id
const CART_PATH = "/cart";                // trùng trang giỏ hàng

function StatusDot({ status }) {
    const color =
        status === "ok"
            ? "bg-emerald-500"
            : status === "checking"
                ? "bg-amber-500"
                : "bg-rose-500";
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function BotAvatar() {
    return (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a6 6 0 0 1-12 0v-1H3a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4h4Zm-6 9H4a1 1 0 0 0 0 2h2v-2Zm14 0h-2v2h2a1 1 0 0 0 0-2ZM14 6a2 2 0 1 0-4 0v1h4V6Zm-7 8a4 4 0 1 0 8 0v-1H7v1Z" />
            </svg>
        </div>
    );
}

function UserAvatar() {
    return (
        <div className="h-8 w-8 rounded-xl bg-rose-600 text-white grid place-items-center shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-9 8a9 9 0 0 1 18 0H3Z" />
            </svg>
        </div>
    );
}

function TypingDots() {
    return (
        <span className="inline-flex gap-1 items-center">
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400 animate-bounce" />
        </span>
    );
}

// ============ Products Message ============
function ProductsMessage({ items, onAction }) {
    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Gợi ý cho bạn
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
                {items.map((b) => (
                    <div
                        key={b.id}
                        className="min-w-[200px] w-[200px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
                    >
                        <img
                            src={
                                b.image ||
                                `https://placehold.co/200x200?text=${encodeURIComponent(
                                    (b.title || "Book").slice(0, 18)
                                )}`
                            }
                            alt={b.title}
                            className="w-full h-[140px] object-cover rounded-t-2xl"
                            onError={(e) => {
                                e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent(
                                    (b.title || "Book").slice(0, 18)
                                )}`;
                            }}
                        />
                        <div className="p-3">
                            <div className="text-[13px] font-semibold line-clamp-2">
                                {b.title}
                            </div>
                            {b.author && (
                                <div className="text-[12px] text-zinc-500 line-clamp-1">
                                    {b.author}
                                </div>
                            )}
                            <div className="mt-1 text-[13px] font-bold text-rose-600">
                                {Number(b.price || 0).toLocaleString("vi-VN")} ₫
                            </div>
                            {typeof b.rating === "number" && (
                                <div className="mt-0.5 text-[12px] text-amber-600">
                                    ★ {b.rating.toFixed(1)}
                                </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                                <button
                                    onClick={() => onAction("view", b)}
                                    className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
                                >
                                    Xem thêm
                                </button>
                                <button
                                    onClick={() => onAction("buy_now", b)}
                                    className="px-2 py-1 text-[12px] rounded-full bg-rose-600 text-white"
                                >
                                    Mua ngay
                                </button>
                                <button
                                    onClick={() => onAction("similar", b)}
                                    className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
                                >
                                    Tương tự
                                </button>
                                <button
                                    onClick={() => onAction("under_200k", b)}
                                    className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700"
                                >
                                    &lt;200k
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============ Order Status Message ============
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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 w-[320px]">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Trạng thái đơn hàng</div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusClass(order.status)}`}>
                    {String(order.status).toUpperCase()}
                </span>
            </div>
            <div className="space-y-1 text-[13px] text-zinc-700 dark:text-zinc-200">
                {order.tracking_number && (
                    <div>
                        Mã vận đơn: <span className="font-medium">{order.tracking_number}</span>
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
                        Thanh toán: {order.payment_method} — {order.payment_status || "unpaid"}
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

    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = "0px";
        ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + "px";
    }, [input]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming]);

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
                        appendMessage("ai", { type: "products", payload: { items: payload.items } });
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
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-lg px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
                aria-label="Mở trợ lý AI"
            >
                <StatusDot status={status} />
                <span className="font-medium">Hỏi AI</span>
                {unread > 0 && (
                    <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
                        {unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-0 z-[9998]">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">
                        <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BotAvatar />
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                                            Trợ lý BookStore
                                        </p>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                            <StatusDot status={status} />
                                            {status === "ok"
                                                ? "Sẵn sàng"
                                                : status === "checking"
                                                    ? "Đang kiểm tra…"
                                                    : "Lỗi cấu hình"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => resetChat(true)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
                                    >
                                        Xoá chat
                                    </button>
                                    <button
                                        onClick={() => resetChat(false)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100"
                                    >
                                        Phiên mới
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                        title="Đóng"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={listRef}
                                className="p-5 h-[64vh] overflow-y-auto space-y-4 bg-gradient-to-b from-zinc-50/70 to-white/70 dark:from-zinc-950/60 dark:to-zinc-900/60 text-zinc-900 dark:text-zinc-50"
                            >
                                {messages.length === 0 && (
                                    <div className="text-[15px] leading-relaxed">
                                        <p className="mb-3 text-zinc-800 dark:text-zinc-100">
                                            Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách;
                                            hoặc kiểm tra trạng thái đơn hàng. Bắt đầu bằng một câu
                                            hỏi nha. 📚
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {quickPrompts.map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => handleSend(q)}
                                                    className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600 dark:hover:border-rose-400 transition text-zinc-700 dark:text-zinc-100"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((m, i) => {
                                    const isUser = m.sender === "user";
                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            {!isUser && <BotAvatar />}
                                            <div
                                                className={[
                                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                                                    isUser
                                                        ? "bg-rose-600 text-white rounded-tr-[8px]"
                                                        : "bg-white/95 dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-50 rounded-tl-[8px] border border-zinc-100 dark:border-zinc-700",
                                                ].join(" ")}
                                            >
                                                {m.type === "products" ? (
                                                    <ProductsMessage
                                                        items={m.payload?.items || []}
                                                        onAction={async (act, book) => {
                                                            if (act === "view") {
                                                                // 👉 Xem chi tiết sách
                                                                navigate(`${BOOK_DETAIL_BASE_PATH}/${book.id}`);
                                                            } else if (act === "buy_now") {
                                                                // 👉 Mua ngay: dùng CartContext (giống ProductDetail) rồi chuyển tới giỏ
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
                                                                    toast.success("Đã thêm vào giỏ hàng", {
                                                                        autoClose: 1200,
                                                                    });
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
                                                            (streaming && !isUser ? <TypingDots /> : null)}
                                                    </div>
                                                )}
                                            </div>
                                            {isUser && <UserAvatar />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Composer */}
                            <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={taRef}
                                        className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-[15px] leading-6 outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        placeholder={
                                            streaming
                                                ? "Đang phản hồi..."
                                                : "Nhập câu hỏi, ví dụ: Kiểm tra trạng thái đơn #ABC123"
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
                                    {!streaming ? (
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim()}
                                            className="rounded-2xl bg-rose-600 text-white px-4 py-2 text-sm shadow hover:bg-rose-700 disabled:opacity-50"
                                        >
                                            Gửi
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                try {
                                                    esRef.current?.close?.();
                                                } catch { }
                                                setStreaming(false);
                                            }}
                                            className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm shadow hover:bg-zinc-300 dark:hover:bg-zinc-700"
                                            title="Dừng stream"
                                        >
                                            Dừng
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-600 dark:text-zinc-300">
                                    <span>
                                        Trạng thái:{" "}
                                        {status === "ok"
                                            ? "Sẵn sàng"
                                            : status === "checking"
                                                ? "Đang kiểm tra…"
                                                : "Lỗi cấu hình"}
                                    </span>
                                    <span className="italic">
                                        Nhấn Enter để gửi • Shift+Enter xuống dòng
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


//code1
// // frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// const LS_KEY = "chatbot_conversation_id";
// const ORDER_DETAIL_BASE_PATH = "/orders"; // ✅ Đổi nếu route của bạn khác, vd: "/account/orders"

// function StatusDot({ status }) {
//     const color = status === "ok" ? "bg-emerald-500" : status === "checking" ? "bg-amber-500" : "bg-rose-500";
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

// // ============ Products Message (Phase 1 UI) ============
// function ProductsMessage({ items, onAction }) {
//     return (
//         <div className="space-y-3">
//             <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Gợi ý cho bạn</div>
//             <div className="flex gap-3 overflow-x-auto pb-1">
//                 {items.map((b) => (
//                     <div key={b.id} className="min-w-[200px] w-[200px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
//                         <img
//                             src={b.image || `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`}
//                             alt={b.title}
//                             className="w-full h-[140px] object-cover rounded-t-2xl"
//                             onError={(e) => { e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`; }}
//                         />
//                         <div className="p-3">
//                             <div className="text-[13px] font-semibold line-clamp-2">{b.title}</div>
//                             {b.author && <div className="text-[12px] text-zinc-500 line-clamp-1">{b.author}</div>}
//                             <div className="mt-1 text-[13px] font-bold text-rose-600">
//                                 {Number(b.price || 0).toLocaleString("vi-VN")} ₫
//                             </div>
//                             {typeof b.rating === "number" && (
//                                 <div className="mt-0.5 text-[12px] text-amber-600">★ {b.rating.toFixed(1)}</div>
//                             )}
//                             <div className="mt-2 flex flex-wrap gap-1">
//                                 <button onClick={() => onAction("add_to_cart", b)} className="px-2 py-1 text-[12px] rounded-full bg-rose-600 text-white">+ Giỏ</button>
//                                 <button onClick={() => onAction("similar", b)} className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700">Tương tự</button>
//                                 <button onClick={() => onAction("under_200k", b)} className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700">&lt;200k</button>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// // ============ Order Status Message (Phase 4 UI) ============
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
//     // Deep-link trang chi tiết đơn — đổi base path cho khớp routing của bạn
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
//                     <div>Mã vận đơn: <span className="font-medium">{order.tracking_number}</span></div>
//                 )}
//                 <div>Tổng tiền: <span className="font-bold text-rose-600">{Number(order.grand_total || 0).toLocaleString("vi-VN")} ₫</span></div>
//                 {date && <div>Đặt lúc: {date.toLocaleString("vi-VN")}</div>}
//                 {order.payment_method && <div>Thanh toán: {order.payment_method} — {order.payment_status || "unpaid"}</div>}
//             </div>
//             <a
//                 href={href}
//                 className="mt-3 inline-flex items-center gap-2 text-sm bg-rose-600 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700"
//             >
//                 Xem chi tiết
//                 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" /></svg>
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

//     useEffect(() => { if (open) setUnread(0); }, [open]);

//     function appendMessage(sender, content) {
//         if (typeof content === "string" || content == null) {
//             setMessages((prev) => [...prev, { sender, text: content || "" }]);
//         } else {
//             setMessages((prev) => [...prev, { sender, ...content }]); // {type, payload} hoặc {type:'order_status', order}
//         }
//         if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
//     }

//     async function ensureConversation() {
//         if (convRef.current) return convRef.current;
//         const res = await fetch(summaryApi.url("/chat/start"), {
//             method: "POST",
//             headers: { "Content-Type": "application/json", ...(summaryApi.authHeaders?.() || {}) },
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
//         try { esRef.current?.close?.(); } catch { }
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
//             const url = new URL(summaryApi.url("/chat/stream"));
//             url.searchParams.set("q", text);
//             url.searchParams.set("conversationId", convId);

//             esRef.current?.close?.();
//             const es = new EventSource(url.toString(), { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", ""); // khung text AI

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
//         "Kiểm tra trạng thái đơn #ABC123", // giúp user thử Phase 4
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
//                 {unread > 0 && (<span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">{unread}</span>)}
//             </button>

//             {open && (
//                 <div className="fixed inset-0 z-[9998]">
//                     <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//                     <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">
//                         <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
//                             {/* Header */}
//                             <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                     <BotAvatar />
//                                     <div>
//                                         <p className="font-semibold text-zinc-900 dark:text-zinc-50">Trợ lý BookStore</p>
//                                         <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
//                                             <StatusDot status={status} />
//                                             {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button onClick={() => resetChat(true)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100">Xoá chat</button>
//                                     <button onClick={() => resetChat(false)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100">Phiên mới</button>
//                                     <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" title="Đóng">✕</button>
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
//                                             Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách; hoặc kiểm tra trạng thái đơn hàng.
//                                             Bắt đầu bằng một câu hỏi nha. 📚
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
//                                         <div key={i} className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
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
//                                                         onAction={(act, book) => {
//                                                             if (act === "add_to_cart") {
//                                                                 handleSend(`Thêm vào giỏ sách "${book.title}" (ID: ${book.id})`);
//                                                             } else if (act === "similar") {
//                                                                 handleSend(`Gợi ý tương tự cho "${book.title}" (ID: ${book.id})`);
//                                                             } else if (act === "under_200k") {
//                                                                 handleSend(`Lọc sách dưới 200000 VNĐ liên quan "${book.title}"`);
//                                                             }
//                                                         }}
//                                                     />
//                                                 ) : m.type === "order_status" ? (
//                                                     <OrderStatusMessage order={m.order} />
//                                                 ) : (
//                                                     <div className="whitespace-pre-wrap">
//                                                         {m.text || (streaming && !isUser ? <TypingDots /> : null)}
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
//                                         placeholder={streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: Kiểm tra trạng thái đơn #ABC123"}
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
//                                                 try { esRef.current?.close?.(); } catch { }
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
//                                     <span>Trạng thái: {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}</span>
//                                     <span className="italic">Nhấn Enter để gửi • Shift+Enter xuống dòng</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }


// //code sau
// // frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// const LS_KEY = "chatbot_conversation_id";
// const ORDER_DETAIL_BASE_PATH = "/orders"; // ✅ Đổi nếu route của bạn khác, vd: "/account/orders"

// function StatusDot({ status }) {
//     const color = status === "ok" ? "bg-emerald-500" : status === "checking" ? "bg-amber-500" : "bg-rose-500";
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

// // ============ Products Message (Phase 1 UI) ============
// function ProductsMessage({ items, onAction }) {
//     return (
//         <div className="space-y-3">
//             <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Gợi ý cho bạn</div>
//             <div className="flex gap-3 overflow-x-auto pb-1">
//                 {items.map((b) => (
//                     <div key={b.id} className="min-w-[200px] w-[200px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
//                         <img
//                             src={b.image || `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`}
//                             alt={b.title}
//                             className="w-full h-[140px] object-cover rounded-t-2xl"
//                             onError={(e) => { e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent((b.title || "Book").slice(0, 18))}`; }}
//                         />
//                         <div className="p-3">
//                             <div className="text-[13px] font-semibold line-clamp-2">{b.title}</div>
//                             {b.author && <div className="text-[12px] text-zinc-500 line-clamp-1">{b.author}</div>}
//                             <div className="mt-1 text-[13px] font-bold text-rose-600">
//                                 {Number(b.price || 0).toLocaleString("vi-VN")} ₫
//                             </div>
//                             {typeof b.rating === "number" && (
//                                 <div className="mt-0.5 text-[12px] text-amber-600">★ {b.rating.toFixed(1)}</div>
//                             )}
//                             <div className="mt-2 flex flex-wrap gap-1">
//                                 <button onClick={() => onAction("add_to_cart", b)} className="px-2 py-1 text-[12px] rounded-full bg-rose-600 text-white">+ Giỏ</button>
//                                 <button onClick={() => onAction("similar", b)} className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700">Tương tự</button>
//                                 <button onClick={() => onAction("under_200k", b)} className="px-2 py-1 text-[12px] rounded-full bg-zinc-100 dark:bg-zinc-700">&lt;200k</button>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// // ============ Order Status Message (Phase 4 UI) ============
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
//     // Deep-link trang chi tiết đơn — đổi base path cho khớp routing của bạn
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
//                     <div>Mã vận đơn: <span className="font-medium">{order.tracking_number}</span></div>
//                 )}
//                 <div>Tổng tiền: <span className="font-bold text-rose-600">{Number(order.grand_total || 0).toLocaleString("vi-VN")} ₫</span></div>
//                 {date && <div>Đặt lúc: {date.toLocaleString("vi-VN")}</div>}
//                 {order.payment_method && <div>Thanh toán: {order.payment_method} — {order.payment_status || "unpaid"}</div>}
//             </div>
//             <a
//                 href={href}
//                 className="mt-3 inline-flex items-center gap-2 text-sm bg-rose-600 text-white px-3 py-1.5 rounded-xl hover:bg-rose-700"
//             >
//                 Xem chi tiết
//                 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" /></svg>
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

//     useEffect(() => { if (open) setUnread(0); }, [open]);

//     function appendMessage(sender, content) {
//         if (typeof content === "string" || content == null) {
//             setMessages((prev) => [...prev, { sender, text: content || "" }]);
//         } else {
//             setMessages((prev) => [...prev, { sender, ...content }]); // {type, payload} hoặc {type:'order_status', order}
//         }
//         if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
//     }

//     async function ensureConversation() {
//         if (convRef.current) return convRef.current;
//         const res = await fetch(summaryApi.url("/chat/start"), {
//             method: "POST",
//             headers: { "Content-Type": "application/json", ...(summaryApi.authHeaders?.() || {}) },
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
//         try { esRef.current?.close?.(); } catch { }
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
//             const url = new URL(summaryApi.url("/chat/stream"));
//             url.searchParams.set("q", text);
//             url.searchParams.set("conversationId", convId);

//             esRef.current?.close?.();
//             const es = new EventSource(url.toString(), { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", ""); // khung text AI

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

//             es.addEventListener("error", (e) => {
//                 console.error("SSE error", e);
//                 toast.error("Lỗi stream phản hồi");
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
//         "Kiểm tra trạng thái đơn #ABC123", // giúp user thử Phase 4
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
//                 {unread > 0 && (<span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">{unread}</span>)}
//             </button>

//             {open && (
//                 <div className="fixed inset-0 z-[9998]">
//                     <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//                     <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">
//                         <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
//                             {/* Header */}
//                             <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                     <BotAvatar />
//                                     <div>
//                                         <p className="font-semibold text-zinc-900 dark:text-zinc-50">Trợ lý BookStore</p>
//                                         <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
//                                             <StatusDot status={status} />
//                                             {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button onClick={() => resetChat(true)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100">Xoá chat</button>
//                                     <button onClick={() => resetChat(false)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100">Phiên mới</button>
//                                     <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" title="Đóng">✕</button>
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
//                                             Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách; hoặc kiểm tra trạng thái đơn hàng.
//                                             Bắt đầu bằng một câu hỏi nha. 📚
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
//                                         <div key={i} className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
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
//                                                         onAction={(act, book) => {
//                                                             if (act === "add_to_cart") {
//                                                                 handleSend(`Thêm vào giỏ sách "${book.title}" (ID: ${book.id})`);
//                                                             } else if (act === "similar") {
//                                                                 handleSend(`Gợi ý tương tự cho "${book.title}" (ID: ${book.id})`);
//                                                             } else if (act === "under_200k") {
//                                                                 handleSend(`Lọc sách dưới 200000 VNĐ liên quan "${book.title}"`);
//                                                             }
//                                                         }}
//                                                     />
//                                                 ) : m.type === "order_status" ? (
//                                                     <OrderStatusMessage order={m.order} />
//                                                 ) : (
//                                                     <div className="whitespace-pre-wrap">
//                                                         {m.text || (streaming && !isUser ? <TypingDots /> : null)}
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
//                                         placeholder={streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: Kiểm tra trạng thái đơn #ABC123"}
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
//                                                 try { esRef.current?.close?.(); } catch { }
//                                                 setStreaming(false);
//                                             }}
//                                             className="rounded-2xl bg-zinc-2 00 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm shadow hover:bg-zinc-300 dark:hover:bg-zinc-700"
//                                             title="Dừng stream"
//                                         >
//                                             Dừng
//                                         </button>
//                                     )}
//                                 </div>
//                                 <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-600 dark:text-zinc-300">
//                                     <span>Trạng thái: {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}</span>
//                                     <span className="italic">Nhấn Enter để gửi • Shift+Enter xuống dòng</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }
