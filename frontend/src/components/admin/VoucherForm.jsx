import React, { useEffect, useState } from "react";
import { MdSave } from "react-icons/md";

const emptyForm = {
    code: "",
    description: "",
    type: "percent",           // 'percent' | 'fixed'
    value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true,
};

export default function VoucherForm({
    defaultValue = null,
    onSubmit,
    onCancel,            // <-- thêm
    submitting = false,
    saveLabel = "Lưu ưu đãi",
}) {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (defaultValue) setForm({ ...emptyForm, ...defaultValue });
    }, [defaultValue]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(form);
    };

    const handleCancel = () => {
        if (typeof onCancel === "function") onCancel();
        else if (window.history.length > 1) window.history.back();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Mã coupon *</label>
                <input
                    name="code"
                    value={form.code}
                    onChange={(e) =>
                        setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="VD: BOOK10"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Loại giảm</label>
                <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Giá trị giảm {form.type === "percent" ? "(%)" : "(VNĐ)"} *
                </label>
                <input
                    type="number"
                    name="value"
                    value={form.value}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    min="0"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ)</label>
                <input
                    type="number"
                    name="min_order_value"
                    value={form.min_order_value}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    min="0"
                />
            </div>

            {form.type === "percent" && (
                <div>
                    <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
                    <input
                        type="number"
                        name="max_discount"
                        value={form.max_discount}
                        onChange={handleInputChange}
                        className="w-full border rounded px-3 py-2 text-sm"
                        min="0"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">
                    Tổng lượt sử dụng (để trống nếu không giới hạn)
                </label>
                <input
                    type="number"
                    name="usage_limit"
                    value={form.usage_limit}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    min="0"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                    type="datetime-local"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Mô tả ngắn để admin dễ nhớ mục đích coupon"
                />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleInputChange}
                    />
                    <span>Kích hoạt</span>
                </label>

                <div className="flex-1" />

                {/* Nút Hủy + Lưu (style theo ảnh) */}
                <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting ? "true" : "false"}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    <MdSave />
                    {submitting ? "Đang lưu..." : saveLabel}
                </button>
            </div>
        </form>
    );
}


// import React, { useEffect, useState } from "react";

// const emptyForm = {
//     code: "",
//     description: "",
//     type: "percent",           // 'percent' | 'fixed'
//     value: "",
//     min_order_value: "",
//     max_discount: "",
//     usage_limit: "",
//     start_date: "",
//     end_date: "",
//     is_active: true,
// };

// export default function VoucherForm({ defaultValue = null, onSubmit, submitting = false }) {
//     const [form, setForm] = useState(emptyForm);

//     useEffect(() => {
//         if (defaultValue) setForm({ ...emptyForm, ...defaultValue });
//     }, [defaultValue]);

//     const handleInputChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setForm((prev) => ({
//             ...prev,
//             [name]: type === "checkbox" ? checked : value,
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         await onSubmit(form);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//                 <label className="block text-sm font-medium mb-1">Mã coupon *</label>
//                 <input
//                     name="code"
//                     value={form.code}
//                     onChange={(e) =>
//                         setForm((p) => ({
//                             ...p,
//                             code: e.target.value.toUpperCase(),
//                         }))
//                     }
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     placeholder="VD: BOOK10"
//                 />
//             </div>

//             <div>
//                 <label className="block text-sm font-medium mb-1">Loại giảm</label>
//                 <select
//                     name="type"
//                     value={form.type}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                 >
//                     <option value="percent">Phần trăm (%)</option>
//                     <option value="fixed">Số tiền cố định</option>
//                 </select>
//             </div>

//             <div>
//                 <label className="block text-sm font-medium mb-1">
//                     Giá trị giảm {form.type === "percent" ? "(%)" : "(VNĐ)"} *
//                 </label>
//                 <input
//                     type="number"
//                     name="value"
//                     value={form.value}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     min="0"
//                 />
//             </div>

//             <div>
//                 <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ)</label>
//                 <input
//                     type="number"
//                     name="min_order_value"
//                     value={form.min_order_value}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     min="0"
//                 />
//             </div>

//             {form.type === "percent" && (
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
//                     <input
//                         type="number"
//                         name="max_discount"
//                         value={form.max_discount}
//                         onChange={handleInputChange}
//                         className="w-full border rounded px-3 py-2 text-sm"
//                         min="0"
//                     />
//                 </div>
//             )}

//             <div>
//                 <label className="block text-sm font-medium mb-1">
//                     Tổng lượt sử dụng (để trống nếu không giới hạn)
//                 </label>
//                 <input
//                     type="number"
//                     name="usage_limit"
//                     value={form.usage_limit}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     min="0"
//                 />
//             </div>

//             <div>
//                 <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
//                 <input
//                     type="datetime-local"
//                     name="start_date"
//                     value={form.start_date}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                 />
//             </div>

//             <div>
//                 <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
//                 <input
//                     type="datetime-local"
//                     name="end_date"
//                     value={form.end_date}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                 />
//             </div>

//             <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Mô tả</label>
//                 <textarea
//                     name="description"
//                     value={form.description}
//                     onChange={handleInputChange}
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     rows={2}
//                     placeholder="Mô tả ngắn để admin dễ nhớ mục đích coupon"
//                 />
//             </div>

//             <div className="flex items-center gap-3 md:col-span-2">
//                 <label className="flex items-center gap-2 text-sm">
//                     <input
//                         type="checkbox"
//                         name="is_active"
//                         checked={form.is_active}
//                         onChange={handleInputChange}
//                     />
//                     <span>Kích hoạt</span>
//                 </label>

//                 <div className="flex-1" />

//                 <button
//                     type="submit"
//                     disabled={submitting}
//                     className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium disabled:opacity-60"
//                 >
//                     {submitting ? "Đang lưu..." : "Lưu"}
//                 </button>
//             </div>
//         </form>
//     );
// }
