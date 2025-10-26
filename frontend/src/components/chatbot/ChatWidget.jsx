import React, { useEffect, useRef, useState } from "react";
import summaryApi from "../../common"; // bạn đã có sẵn

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [convId, setConvId] = useState(() => localStorage.getItem("chat_conv") || "");
    const [input, setInput] = useState("");
    const [msgs, setMsgs] = useState([]);
    const esRef = useRef(null);

    async function ensureConversation() {
        if (convId) return convId;
        const r = await fetch(summaryApi.url("/chat/start"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...summaryApi.authHeaders() },
            body: JSON.stringify({ topic: "store-help" }),
            credentials: "include"
        }).then((r) => r.json());
        if (r?.conversationId) {
            setConvId(r.conversationId);
            localStorage.setItem("chat_conv", r.conversationId);
            return r.conversationId;
        }
        throw new Error("Cannot create conversation");
    }

    function closeStream() {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }
    }

    async function send() {
        const text = input.trim();
        if (!text) return;
        setMsgs((p) => [...p, { role: "user", text }]);
        setInput("");

        const id = await ensureConversation();
        closeStream();

        const url = summaryApi.url(`/chat/stream?q=${encodeURIComponent(text)}&conversationId=${id}`);
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        let aiText = "";
        es.onmessage = (ev) => {
            if (!ev?.data) return;
            const data = JSON.parse(ev.data);
            if (data.delta) {
                aiText += data.delta;
                setMsgs((prev) => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    if (last?.role === "ai_draft") last.text += data.delta;
                    else copy.push({ role: "ai_draft", text: data.delta });
                    return copy;
                });
            } else if (data.done) {
                setMsgs((prev) => {
                    const copy = prev.filter((m) => m.role !== "ai_draft");
                    copy.push({ role: "ai", text: aiText });
                    return copy;
                });
                es.close();
                esRef.current = null;
            } else if (data.error) {
                setMsgs((prev) => [...prev, { role: "system", text: String(data.error) }]);
                es.close();
                esRef.current = null;
            }
        };

        es.onerror = () => {
            setMsgs((prev) => [...prev, { role: "system", text: "Mất kết nối tới AI." }]);
            es.close();
            esRef.current = null;
        };
    }

    useEffect(() => () => closeStream(), []);

    return (
        <div className="fixed bottom-4 right-4 z-40">
            {open && (
                <div className="w-96 h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="px-4 py-3 border-b dark:border-slate-800 flex items-center justify-between">
                        <div className="font-semibold">Trợ lý BookStore</div>
                        <button onClick={() => setOpen(false)} className="text-sm opacity-70 hover:opacity-100">Đóng</button>
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                        {msgs.map((m, i) => (
                            <div
                                key={i}
                                className={
                                    m.role.startsWith("ai")
                                        ? "text-sm p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                                        : m.role === "system"
                                            ? "text-sm p-2 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                                            : "text-sm p-2 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100"
                                }
                            >
                                {m.text}
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t dark:border-slate-800 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi về sách, đơn hàng…"
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            className="flex-1 rounded-xl border dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900"
                        />
                        <button onClick={send} className="rounded-xl px-4 py-2 bg-black text-white dark:bg-white dark:text-black">
                            Gửi
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen((o) => !o)}
                className="rounded-full w-14 h-14 shadow-xl bg-black text-white dark:bg-white dark:text-black"
                title="Chat với AI"
            >
                AI
            </button>
        </div>
    );
}
