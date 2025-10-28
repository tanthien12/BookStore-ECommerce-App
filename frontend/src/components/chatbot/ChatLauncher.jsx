// // frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import summaryApi from "../../common"; // đã có trong dự án: summaryApi.url() + authHeaders()
// /**
//  * Yêu cầu: Tailwind + dark-mode sẵn
//  * Modal dùng portal: #root là đủ; z-index cao để không bị che.
//  */

// const LS_KEY = "chatbot_conversation_id";

// function StatusDot({ status }) {
//     const color =
//         status === "ok" ? "bg-emerald-500"
//             : status === "checking" ? "bg-amber-500"
//                 : "bg-rose-500";
//     return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
// }

// export default function ChatLauncher() {
//     const [open, setOpen] = useState(false);
//     const [status, setStatus] = useState("checking"); // 'ok' | 'checking' | 'error'
//     const [messages, setMessages] = useState([]); // {sender:'user'|'ai', text}
//     const [input, setInput] = useState("");
//     const [streaming, setStreaming] = useState(false);
//     const esRef = useRef(null);
//     const convRef = useRef(localStorage.getItem(LS_KEY) || "");

//     useEffect(() => {
//         // health check
//         (async () => {
//             try {
//                 setStatus("checking");
//                 const res = await fetch(summaryApi.url("/chat/health"));
//                 const data = await res.json();
//                 if (data?.ok) setStatus("ok");
//                 else setStatus("error");
//             } catch {
//                 setStatus("error");
//             }
//         })();
//     }, []);

//     async function ensureConversation() {
//         if (convRef.current) return convRef.current;
//         const res = await fetch(summaryApi.url("/chat/start"), {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 ...summaryApi.authHeaders?.(),
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

//     function appendMessage(sender, text) {
//         setMessages((prev) => [...prev, { sender, text }]);
//     }

//     async function handleSend() {
//         const text = input.trim();
//         if (!text || streaming) return;
//         setInput("");
//         appendMessage("user", text);
//         setStreaming(true);

//         try {
//             const convId = await ensureConversation();
//             // SSE
//             const url = new URL(summaryApi.url("/chat/stream"));
//             url.searchParams.set("q", text);
//             url.searchParams.set("conversationId", convId);

//             const headers = summaryApi.authHeaders?.() || {};
//             // EventSource không cho set header tùy ý → gửi token qua query nếu cần
//             // => bạn có thể điều chỉnh backend nhận token từ cookie httpOnly.
//             // Dưới đây giả sử bạn dùng httpOnly cookies hoặc không yêu cầu header ở /stream.
//             esRef.current?.close?.();
//             const es = new EventSource(url.toString(), { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", ""); // placeholder

//             es.addEventListener("delta", (ev) => {
//                 aiBuffer += ev.data;
//                 setMessages((prev) => {
//                     const copy = [...prev];
//                     const lastIdx = copy.findIndex((m, i) => i === copy.length - 1);
//                     copy[lastIdx] = { sender: "ai", text: aiBuffer };
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

//     return (
//         <>
//             {/* Floating Button */}
//             <button
//                 onClick={() => setOpen(true)}
//                 className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-md px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
//                 aria-label="Mở trợ lý AI"
//             >
//                 <StatusDot status={status} />
//                 <span className="font-medium">Hỏi AI</span>
//             </button>

//             {/* Modal */}
//             {open && (
//                 <div className="fixed inset-0 z-[9998]">
//                     <div
//                         className="absolute inset-0 bg-black/40"
//                         onClick={() => setOpen(false)}
//                     />
//                     <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[480px]">
//                         <div className="mx-auto m-3 md:m-0 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-black/5 overflow-hidden">
//                             <div className="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-2">
//                                     <StatusDot status={status} />
//                                     <p className="font-semibold">Trợ lý BookStore</p>
//                                 </div>
//                                 <button
//                                     onClick={() => setOpen(false)}
//                                     className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
//                                 >
//                                     ✕
//                                 </button>
//                             </div>

//                             <div className="p-4 h-[60vh] overflow-y-auto space-y-3 bg-zinc-50/40 dark:bg-zinc-950/40">
//                                 {messages.length === 0 && (
//                                     <div className="text-sm text-zinc-500">
//                                         Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách, hoặc
//                                         kiểm tra trạng thái đơn hàng cho bạn. Hãy bắt đầu bằng một câu hỏi. 📚
//                                     </div>
//                                 )}
//                                 {messages.map((m, i) => (
//                                     <div
//                                         key={i}
//                                         className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm ${m.sender === "user"
//                                                 ? "ml-auto bg-rose-600 text-white"
//                                                 : "mr-auto bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
//                                             }`}
//                                     >
//                                         <div className="whitespace-pre-wrap text-sm leading-relaxed">
//                                             {m.text}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>

//                             <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-800">
//                                 <div className="flex items-center gap-2">
//                                     <input
//                                         className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
//                                         placeholder={
//                                             streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: sách lập trình cho người mới…"
//                                         }
//                                         value={input}
//                                         onChange={(e) => setInput(e.target.value)}
//                                         onKeyDown={(e) => e.key === "Enter" && handleSend()}
//                                         disabled={streaming}
//                                     />
//                                     <button
//                                         onClick={handleSend}
//                                         disabled={streaming || !input.trim()}
//                                         className="rounded-xl bg-rose-600 text-white px-4 py-2 text-sm shadow hover:bg-rose-700 disabled:opacity-50"
//                                     >
//                                         Gửi
//                                     </button>
//                                 </div>
//                                 <div className="mt-2 flex items-center gap-2 text-[12px] text-zinc-500">
//                                     <span>Trạng thái:</span>
//                                     <span>
//                                         {status === "ok"
//                                             ? "Sẵn sàng"
//                                             : status === "checking"
//                                                 ? "Đang kiểm tra…"
//                                                 : "Lỗi cấu hình"}
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

//code 3
// frontend/src/components/chatbot/ChatLauncher.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// const LS_KEY = "chatbot_conversation_id";

// function StatusDot({ status }) {
//     const color =
//         status === "ok" ? "bg-emerald-500"
//             : status === "checking" ? "bg-amber-500"
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
//             <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
//             <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" />
//         </span>
//     );
// }

// export default function ChatLauncher() {
//     const [open, setOpen] = useState(false);
//     const [status, setStatus] = useState("checking"); // 'ok' | 'checking' | 'error'
//     const [messages, setMessages] = useState([]);     // {sender:'user'|'ai', text}
//     const [input, setInput] = useState("");
//     const [streaming, setStreaming] = useState(false);
//     const [unread, setUnread] = useState(0);
//     const esRef = useRef(null);
//     const convRef = useRef(localStorage.getItem(LS_KEY) || "");
//     const listRef = useRef(null);
//     const taRef = useRef(null);

//     // Auto-resize textarea
//     useEffect(() => {
//         const ta = taRef.current;
//         if (!ta) return;
//         ta.style.height = "0px";
//         ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + "px";
//     }, [input]);

//     // Auto-scroll to bottom when messages change
//     useEffect(() => {
//         if (!listRef.current) return;
//         listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
//     }, [messages, streaming]);

//     // Health check on mount
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

//     // Unread badge when modal closed
//     useEffect(() => {
//         if (open) setUnread(0);
//     }, [open]);

//     function appendMessage(sender, text) {
//         setMessages((prev) => [...prev, { sender, text }]);
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

//             // Build SSE URL
//             const url = new URL(summaryApi.url("/chat/stream"));
//             url.searchParams.set("q", text);
//             url.searchParams.set("conversationId", convId);

//             // Start stream
//             esRef.current?.close?.();
//             const es = new EventSource(url.toString(), { withCredentials: true });
//             esRef.current = es;

//             let aiBuffer = "";
//             appendMessage("ai", ""); // placeholder

//             es.addEventListener("delta", (ev) => {
//                 aiBuffer += ev.data;
//                 setMessages((prev) => {
//                     const copy = [...prev];
//                     // replace last message (placeholder) with buffer
//                     copy[copy.length - 1] = { sender: "ai", text: aiBuffer };
//                     return copy;
//                 });
//             });

//             es.addEventListener("done", () => {
//                 es.close();
//                 setStreaming(false);
//             });

//             es.addEventListener("error", (e) => {
//                 console.error("SSE error", e);
//                 try {
//                     if (e?.data) {
//                         const payload = JSON.parse(e.data);
//                         if (payload?.code) console.warn("GenAI error code:", payload.code);
//                     }
//                 } catch { }
//                 toast.error("Lỗi stream phản hồi");
//                 es.close();
//                 setStreaming(false);
//             });
//         } catch (e) {
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
//             {/* Floating Button */}
//             <button
//                 onClick={() => setOpen(true)}
//                 className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-lg px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
//                 aria-label="Mở trợ lý AI"
//             >
//                 <StatusDot status={status} />
//                 <span className="font-medium">Hỏi AI</span>
//                 {unread > 0 && (
//                     <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">{unread}</span>
//                 )}
//             </button>

//             {/* Modal */}
//             {open && (
//                 <div className="fixed inset-0 z-[9998]">
//                     <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//                     <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">
//                         <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur ring-1 ring-black/5 overflow-hidden">
//                             {/* Header */}
//                             <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                     <BotAvatar />
//                                     <div>
//                                         <p className="font-semibold">Trợ lý BookStore</p>
//                                         <p className="text-xs text-zinc-500 flex items-center gap-2">
//                                             <StatusDot status={status} />
//                                             {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button
//                                         onClick={() => resetChat(true)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
//                                         title="Xoá nội dung (giữ phiên)"
//                                     >
//                                         Xoá chat
//                                     </button>
//                                     <button
//                                         onClick={() => resetChat(false)}
//                                         className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
//                                         title="Tạo phiên mới"
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
//                                 className="p-4 h-[64vh] overflow-y-auto space-y-4 bg-gradient-to-b from-zinc-50/60 to-white/60 dark:from-zinc-950/50 dark:to-zinc-900/50"
//                             >
//                                 {messages.length === 0 && (
//                                     <div className="text-sm text-zinc-600 dark:text-zinc-400">
//                                         <p className="mb-3">
//                                             Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách; hoặc kiểm tra trạng thái đơn hàng. Bắt đầu bằng một câu hỏi nha. 📚
//                                         </p>
//                                         <div className="flex flex-wrap gap-2">
//                                             {quickPrompts.map((q) => (
//                                                 <button
//                                                     key={q}
//                                                     onClick={() => handleSend(q)}
//                                                     className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-400 transition"
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
//                                                     "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
//                                                     isUser
//                                                         ? "bg-rose-600 text-white rounded-tr-[8px]"
//                                                         : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-[8px] border border-zinc-100 dark:border-zinc-700",
//                                                 ].join(" ")}
//                                             >
//                                                 <div className="whitespace-pre-wrap">{m.text || (streaming && !isUser ? <TypingDots /> : null)}</div>
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
//                                         className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 resize-none"
//                                         placeholder={streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: Sách lập trình cho người mới…"}
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
//                                             onClick={stopStream}
//                                             className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm shadow hover:bg-zinc-300 dark:hover:bg-zinc-700"
//                                             title="Dừng stream"
//                                         >
//                                             Dừng
//                                         </button>
//                                     )}
//                                 </div>
//                                 <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-500">
//                                     <span>
//                                         Trạng thái:{" "}
//                                         {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}
//                                     </span>
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

//code 3
// frontend/src/components/chatbot/ChatLauncher.jsx
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import summaryApi from "../../common";

const LS_KEY = "chatbot_conversation_id";

function StatusDot({ status }) {
    const color =
        status === "ok" ? "bg-emerald-500"
            : status === "checking" ? "bg-amber-500"
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

    // auto-resize textarea
    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = "0px";
        ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + "px";
    }, [input]);

    // auto-scroll to bottom
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming]);

    // health check
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

    useEffect(() => { if (open) setUnread(0); }, [open]);

    function appendMessage(sender, text) {
        setMessages((prev) => [...prev, { sender, text }]);
        if (!open && sender === "ai") setUnread((n) => Math.min(9, n + 1));
    }

    async function ensureConversation() {
        if (convRef.current) return convRef.current;
        const res = await fetch(summaryApi.url("/chat/start"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(summaryApi.authHeaders?.() || {}) },
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
        try { esRef.current?.close?.(); } catch { }
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

            const url = new URL(summaryApi.url("/chat/stream"));
            url.searchParams.set("q", text);
            url.searchParams.set("conversationId", convId);

            esRef.current?.close?.();
            const es = new EventSource(url.toString(), { withCredentials: true });
            esRef.current = es;

            let aiBuffer = "";
            appendMessage("ai", "");

            es.addEventListener("delta", (ev) => {
                aiBuffer += ev.data;
                setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { sender: "ai", text: aiBuffer };
                    return copy;
                });
            });

            es.addEventListener("done", () => {
                es.close();
                setStreaming(false);
            });

            es.addEventListener("error", (e) => {
                console.error("SSE error", e);
                try {
                    if (e?.data) {
                        const payload = JSON.parse(e.data);
                        if (payload?.code) console.warn("GenAI error code:", payload.code);
                    }
                } catch { }
                toast.error("Lỗi stream phản hồi");
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
            {/* Floating Button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-[9999] rounded-2xl shadow-lg px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white flex items-center gap-2"
                aria-label="Mở trợ lý AI"
            >
                <StatusDot status={status} />
                <span className="font-medium">Hỏi AI</span>
                {unread > 0 && (
                    <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">{unread}</span>
                )}
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-[9998]">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute bottom-0 right-0 md:right-6 md:bottom-6 w-full md:w-[560px]">
                        <div className="mx-auto m-3 md:m-0 rounded-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur ring-1 ring-black/5 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BotAvatar />
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Trợ lý BookStore</p>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                            <StatusDot status={status} />
                                            {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}
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
                                            Xin chào! Mình có thể gợi ý sách theo thể loại, ngân sách; hoặc kiểm tra trạng thái đơn hàng.
                                            Bắt đầu bằng một câu hỏi nha. 📚
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
                                        <div key={i} className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                                            {!isUser && <BotAvatar />}
                                            <div
                                                className={[
                                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                                                    isUser
                                                        ? "bg-rose-600 text-white rounded-tr-[8px]"
                                                        : "bg-white/95 dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-50 rounded-tl-[8px] border border-zinc-100 dark:border-zinc-700",
                                                ].join(" ")}
                                            >
                                                <div className="whitespace-pre-wrap">
                                                    {m.text || (streaming && !isUser ? <TypingDots /> : null)}
                                                </div>
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
                                        placeholder={streaming ? "Đang phản hồi..." : "Nhập câu hỏi, ví dụ: Sách lập trình cho người mới…"}
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
                                                try { esRef.current?.close?.(); } catch { }
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
                                    <span>Trạng thái: {status === "ok" ? "Sẵn sàng" : status === "checking" ? "Đang kiểm tra…" : "Lỗi cấu hình"}</span>
                                    <span className="italic">Nhấn Enter để gửi • Shift+Enter xuống dòng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
