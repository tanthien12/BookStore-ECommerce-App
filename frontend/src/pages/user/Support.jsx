// src/pages/user/Support.jsx
import React, { useState } from "react";

export default function Support() {
    const [messages, setMessages] = useState([{ sender: 'system', text: 'Xin chào! Mình là trợ lý AI. Bạn cần hỗ trợ gì hôm nay?' }]);
    const [input, setInput] = useState("");

    const send = () => {
        if (!input.trim()) return;
        setMessages(m => [...m, { sender: 'user', text: input.trim() }]);
        setInput("");
        // TODO: call your chatbot backend (Gemini/PaLM2) → push assistant reply
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 h-[520px] flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Hỗ trợ / Chatbot</h2>
            <div className="flex-1 overflow-auto space-y-2">
                {messages.map((m, i) => (
                    <div key={i} className={`max-w-[80%] px-3 py-2 rounded-xl ${m.sender === 'user' ? 'ml-auto bg-red-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {m.text}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 rounded-lg border px-3 py-2.5" placeholder="Nhập câu hỏi…" />
                <button onClick={send} className="rounded-lg bg-red-600 text-white px-4">Gửi</button>
            </div>
        </div>
    );
}
