// src/components/admin/FlashsaleForm.jsx
import React, { useEffect, useState } from 'react';

// Helper để format datetime-local input
const toDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        // Cần format YYYY-MM-DDTHH:mm
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    } catch {
        return "";
    }
};

export default function FlashsaleForm({
    mode = "create",
    initialData = null,
    onSubmit,
    loading = false,
}) {
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setName(initialData.name || "");
            setStartTime(toDateTimeLocal(initialData.start_time));
            setEndTime(toDateTimeLocal(initialData.end_time));
            setIsActive(initialData.is_active ?? true);
        }
    }, [mode, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;

        const formData = new FormData(e.target);
        // Chuyển đổi datetime-local (string) sang ISO string (UTC)
        const payload = {
            name: formData.get("name"),
            start_time: new Date(formData.get("start_time")).toISOString(),
            end_time: new Date(formData.get("end_time")).toISOString(),
            is_active: formData.get("is_active") === "on",
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-base font-semibold mb-3">Thông tin chung</h3>
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-sm font-medium">Tên chiến dịch*</span>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm font-medium">Thời gian bắt đầu*</span>
                            <input
                                type="datetime-local"
                                name="start_time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium">Thời gian kết thúc*</span>
                            <input
                                type="datetime-local"
                                name="end_time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1"
                            />
                        </label>
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">Kích hoạt chiến dịch</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 disabled:bg-gray-300"
                >
                    {loading ? "Đang lưu..." : (mode === "create" ? "Tạo chiến dịch" : "Lưu thay đổi")}
                </button>
            </div>
        </form>
    );
}