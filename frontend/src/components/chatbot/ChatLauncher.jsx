// frontend/src/components/chatbot/ChatLauncher.jsx
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import summaryApi from "../../common"; // đã có trong dự án: summaryApi.url() + authHeaders()
/**
 * Yêu cầu: Tailwind + dark-mode sẵn
 * Modal dùng portal: #root là đủ; z-index cao để không bị che.
 */

const LS_KEY = "chatbot_conversation_id";

function StatusDot({ status }) {
    const color =
        status === "ok" ? "bg-emerald-500"
            : status === "checking" ? "bg-amber-500"
                : "bg-rose-500";
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export default function ChatLauncher() {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("checking"); // 'ok' | 'checking' | 'error'
    const [messages, setMessages] = useState([]); // {sender:'user'|'ai', text}
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const esRef = useRef(null);
    const convRef = useRef(localStorage.getItem(LS_KEY) || "");

    useEffect(() => {
        // health check
        (async () => {
            try {
                setStatus("checking");
                const res = await fetch(summaryApi.url("/chat/health"));
                const data = await res.json();
                if (data?.ok) setStatus("ok");
                else setStatus("error");
            } catch {
                setStatus("error");
            }
        })();
    }, []);

    async function ensureConversation() {
        if (convRef.current) return convRef.current;
        const res = await fetch(summaryApi.url("/chat/start"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...summaryApi.authHeaders?.(),
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

    function appendMessage(sender, text) {
        setMessages((prev) => [...prev, { sender, text }]);
    }

    async function handleSend() {
        const text = input.trim();
        if (!text || streaming) return;
        setInput("");
        appendMessage("user", text);
        setStreaming(true);

        try {
            const convId = await ensureConversation();
            // SSE
            const url = new URL(summaryApi.url("/chat/stream"));
            url.searchParams.set("q", text);
            url.searchParams.set("conversationId", convId);

            const headers = summaryApi.authHeaders?.() || {};
            // EventSource không cho set header tùy ý → gửi token qua query nếu cần
            // => bạn có thể điều chỉnh backend nhận token từ cookie httpOnly.
            // Dưới đây giả sử bạn dùng httpOnly cookies hoặc không yêu cầu header ở /stream.
            esRef.current?.close?.();
            const es = new EventSource(url.toString(), { withCredentials: true });
            esRef.current = es;

            let aiBuffer = "";
            appendMessage("ai", ""); // placeholder

            es.addEventListener("delta", (ev) => {
                aiBuffer += ev.data;
                setMessages((prev) => {
                    const copy = [...prev];
                    const lastIdx = copy.findIndex((m, i) => i === copy.length - 1);
                    copy[lastIdx] = { sender: "ai", text: aiBuffer };
                    return copy;
                });
            });

            es.addEventListener("done", () => {
                es.close();
                setStreaming(false);
            });

            es.addEventListener("error", (e) => {
                console.error("SSE error", e);
                toast.error("Lỗi stream phản hồi");
                es.close();
                setStreaming(false);
            });
        } catch {
            setStreaming(false);
        }
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-md px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
                aria-label="Mở trợ lý AI"
            >
                <StatusDot status={status} />
                <span className="font-medium">Hỏi AI</span>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-[9998]">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[480px]">
                        <div className="mx-auto m-3 md:m-0 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-black/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <StatusDot status={status} />
                                    <p className="font-semibold">Trợ lý BookStore</p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-4 h-[60vh] overflow-y-auto space-y-3 bg-zinc-50/40 dark:bg-zinc-950/40">
                                {messages.length === 0 && (
                                    <div className="text-sm text-zinc-500">
                                        Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách, hoặc
                                        kiểm tra trạng thái đơn hàng cho bạn. Hãy bắt đầu bằng một câu hỏi. 📚
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm ${m.sender === "user"
                                                ? "ml-auto bg-rose-600 text-white"
                                                : "mr-auto bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <input
                                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder={
                                            streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: sách lập trình cho người mới…"
                                        }
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        disabled={streaming}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={streaming || !input.trim()}
                                        className="rounded-xl bg-rose-600 text-white px-4 py-2 text-sm shadow hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        Gửi
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-[12px] text-zinc-500">
                                    <span>Trạng thái:</span>
                                    <span>
                                        {status === "ok"
                                            ? "Sẵn sàng"
                                            : status === "checking"
                                                ? "Đang kiểm tra…"
                                                : "Lỗi cấu hình"}
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
