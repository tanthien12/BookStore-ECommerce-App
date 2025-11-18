// // src/pages/user/AddressBook.jsx
// import React, { useEffect, useState } from "react";
// import summaryApi from "../../common";
// import { toast } from "react-toastify";

// const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');
// const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};

// const empty = { address_line1: "", address_line2: "", city: "", province: "", postal_code: "", phone: "", is_default: false };

// export default function AddressBook() {
//     const [items, setItems] = useState([]); const [show, setShow] = useState(false); const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null);

//     const load = async () => {
//         const res = await fetch(summaryApi.url(summaryApi.address.list), { headers: { ...authHeaders() } });
//         const data = await res.json().catch(() => ({}));
//         if (!res.ok || !data?.success) return toast.error(data?.message || 'Không tải được địa chỉ');
//         setItems(data.items || []);
//     };
//     useEffect(() => { load(); }, []);

//     const onSave = async (e) => {
//         e.preventDefault();
//         try {
//             const url = editing ? summaryApi.url(summaryApi.address.update(editing)) : summaryApi.url(summaryApi.address.create);
//             const method = editing ? 'PUT' : 'POST';
//             const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(form) });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || !data?.success) throw new Error(data?.message || 'Lưu địa chỉ thất bại');
//             toast.success(editing ? 'Đã cập nhật' : 'Đã thêm địa chỉ');
//             setShow(false); setForm(empty); setEditing(null); load();
//         } catch (e) { toast.error(e.message || 'Lỗi lưu'); }
//     };

//     const onEdit = (a) => { setEditing(a.id); setForm({ ...a }); setShow(true); };
//     const onDelete = async (id) => {
//         if (!window.confirm('Xóa địa chỉ này?')) return;
//         const res = await fetch(summaryApi.url(summaryApi.address.delete(id)), { method: 'DELETE', headers: { ...authHeaders() } });
//         const data = await res.json().catch(() => ({}));
//         if (!res.ok || !data?.success) return toast.error(data?.message || 'Xóa thất bại');
//         load();
//     };

//     return (
//         <div className="rounded-2xl border border-gray-200 bg-white p-5">
//             <div className="flex items-center justify-between mb-3">
//                 <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
//                 <button onClick={() => { setShow(true); setEditing(null); setForm(empty); }} className="px-3 py-2 rounded-lg bg-red-600 text-white">+ Thêm địa chỉ</button>
//             </div>
//             {!items.length ? <div className="text-sm text-gray-600">Chưa có địa chỉ.</div> :
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {items.map(a => (
//                         <div key={a.id} className="rounded-xl border border-gray-200 p-3">
//                             <div className="text-sm font-semibold">{a.address_line1}</div>
//                             {a.address_line2 && <div className="text-sm">{a.address_line2}</div>}
//                             <div className="text-sm text-gray-600">{a.city}, {a.province} {a.postal_code || ''}</div>
//                             <div className="text-sm text-gray-600">ĐT: {a.phone || '—'}</div>
//                             {a.is_default && <span className="inline-block mt-2 px-2 py-0.5 rounded-full border text-xs">Mặc định</span>}
//                             <div className="pt-2 space-x-2">
//                                 <button onClick={() => onEdit(a)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm">Sửa</button>
//                                 <button onClick={() => onDelete(a.id)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm">Xóa</button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>}

//             {/* Modal */}
//             {show && (
//                 <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setShow(false)}>
//                     <form onSubmit={onSave} className="bg-white rounded-2xl w-full max-w-lg p-4 space-y-3" onClick={e => e.stopPropagation()}>
//                         <h3 className="text-lg font-semibold mb-2">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h3>
//                         <input value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Địa chỉ dòng 1" required />
//                         <input value={form.address_line2 || ''} onChange={e => setForm({ ...form, address_line2: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Địa chỉ dòng 2 (tuỳ chọn)" />
//                         <div className="grid grid-cols-2 gap-2">
//                             <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Thành phố" required />
//                             <input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Tỉnh/TP" required />
//                         </div>
//                         <div className="grid grid-cols-2 gap-2">
//                             <input value={form.postal_code || ''} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Mã bưu chính" />
//                             <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Số điện thoại" />
//                         </div>
//                         <label className="inline-flex items-center gap-2 text-sm">
//                             <input type="checkbox" checked={!!form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
//                             Đặt làm địa chỉ mặc định
//                         </label>
//                         <div className="pt-2 text-right space-x-2">
//                             <button type="button" onClick={() => setShow(false)} className="px-3 py-2 rounded-lg border">Hủy</button>
//                             <button type="submit" className="px-3 py-2 rounded-lg bg-red-600 text-white">{editing ? 'Cập nhật' : 'Thêm'}</button>
//                         </div>
//                     </form>
//                 </div>
//             )}
//         </div>
//     );
// }

// src/pages/user/AddressBook.jsx
import React, { useEffect, useState } from "react";
import summaryApi, { authHeaders } from "../../common";
import { toast } from "react-toastify";
import useVNAddress from "../../hooks/useVNAddress";

const empty = {
    address_line1: "",
    address_line2: "",
    province: "",
    district: "",
    ward: "",
    phone: "",
    is_default: false,
};

export default function AddressBook() {
    const [items, setItems] = useState([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);

    // lưu code của tỉnh đang chọn, để gọi fetchWards(provinceCode, districtCode)
    const [selectedProvinceCode, setSelectedProvinceCode] = useState("");

    const {
        provinces = [],
        districts = [],
        wards = [],
        fetchDistricts,
        fetchWards,
        loadingProvince,
        loadingDistrict,
        loadingWard,
        error: addressError,
    } = useVNAddress();

    const load = async () => {
        try {
            const res = await fetch(summaryApi.url(summaryApi.address.list), {
                headers: { ...authHeaders() },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                return toast.error(data?.message || "Không tải được địa chỉ");
            }
            setItems(data.items || []);
        } catch (err) {
            toast.error("Không tải được địa chỉ");
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onSave = async (e) => {
        e.preventDefault();

        if (!form.address_line1) {
            toast.error("Vui lòng nhập địa chỉ dòng 1");
            return;
        }
        if (!form.province || !form.district || !form.ward) {
            toast.error("Vui lòng chọn đủ Tỉnh / Quận / Phường");
            return;
        }

        try {
            const url = editing
                ? summaryApi.url(summaryApi.address.update(editing))
                : summaryApi.url(summaryApi.address.create);
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.success) {
                throw new Error(data?.message || "Lưu địa chỉ thất bại");
            }

            toast.success(editing ? "Đã cập nhật" : "Đã thêm địa chỉ");
            setShow(false);
            setForm(empty);
            setEditing(null);
            setSelectedProvinceCode("");
            load();
        } catch (e) {
            toast.error(e.message || "Lỗi lưu");
        }
    };

    const onEdit = (a) => {
        setEditing(a.id);
        setForm({
            address_line1: a.address_line1 || "",
            address_line2: a.address_line2 || "",
            province: a.province || "",
            district: a.district || "",
            ward: a.ward || "",
            phone: a.phone || "",
            is_default: !!a.is_default,
        });

        // Khi sửa, mình reset code tỉnh; user chọn lại tỉnh/quận/phường thì dropdown sẽ load đúng
        setSelectedProvinceCode("");
        setShow(true);
    };

    const onDelete = async (id) => {
        if (!window.confirm("Xóa địa chỉ này?")) return;
        try {
            const res = await fetch(
                summaryApi.url(summaryApi.address.delete(id)),
                { method: "DELETE", headers: { ...authHeaders() } }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                return toast.error(data?.message || "Xóa thất bại");
            }
            load();
        } catch (err) {
            toast.error("Xóa thất bại");
        }
    };

    const openCreateModal = () => {
        setEditing(null);
        setForm(empty);
        setSelectedProvinceCode("");
        setShow(true);
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
                <button
                    onClick={openCreateModal}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white"
                >
                    + Thêm địa chỉ
                </button>
            </div>

            {!items.length ? (
                <div className="text-sm text-gray-600">Chưa có địa chỉ.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((a) => (
                        <div
                            key={a.id}
                            className="rounded-xl border border-gray-200 p-3 space-y-1"
                        >
                            <div className="text-sm font-semibold">{a.address_line1}</div>
                            {a.address_line2 && (
                                <div className="text-sm">{a.address_line2}</div>
                            )}

                            <div className="text-sm text-gray-600">
                                {a.ward && `${a.ward}, `}
                                {a.district && `${a.district}, `}
                                {a.province}
                            </div>

                            <div className="text-sm text-gray-600">
                                ĐT: {a.phone || "—"}
                            </div>

                            {a.is_default && (
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-full border text-xs">
                                    Mặc định
                                </span>
                            )}

                            <div className="pt-2 space-x-2">
                                <button
                                    onClick={() => onEdit(a)}
                                    className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                                >
                                    Sửa
                                </button>
                                <button
                                    onClick={() => onDelete(a.id)}
                                    className="px-3 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {show && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
                    onClick={() => setShow(false)}
                >
                    <form
                        onSubmit={onSave}
                        className="bg-white rounded-2xl w-full max-w-lg p-4 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">
                            {editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}
                        </h3>

                        {/* Địa chỉ dòng 1 */}
                        <input
                            value={form.address_line1}
                            onChange={(e) =>
                                setForm({ ...form, address_line1: e.target.value })
                            }
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Số nhà, tên đường"
                            required
                        />

                        {/* Địa chỉ dòng 2 */}
                        <input
                            value={form.address_line2 || ""}
                            onChange={(e) =>
                                setForm({ ...form, address_line2: e.target.value })
                            }
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Địa chỉ bổ sung (căn hộ, toà nhà...)"
                        />

                        {/* Province + District */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Tỉnh / Thành phố */}
                            <select
                                value={form.province}
                                onChange={(e) => {
                                    const provinceName = e.target.value;
                                    const province = provinces.find(
                                        (p) => p.name === provinceName
                                    );

                                    setForm({
                                        ...form,
                                        province: provinceName,
                                        district: "",
                                        ward: "",
                                    });

                                    if (province) {
                                        setSelectedProvinceCode(province.code);
                                        fetchDistricts(province.code);
                                    } else {
                                        setSelectedProvinceCode("");
                                    }
                                }}
                                className="rounded-lg border px-3 py-2 bg-white"
                                required
                            >
                                <option value="">
                                    {loadingProvince
                                        ? "Đang tải..."
                                        : "-- Chọn tỉnh/thành --"}
                                </option>
                                {provinces.map((p) => (
                                    <option key={p.code} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            {/* Quận / Huyện */}
                            <select
                                value={form.district}
                                onChange={(e) => {
                                    const districtName = e.target.value;
                                    const district = districts.find(
                                        (d) => d.name === districtName
                                    );

                                    setForm({
                                        ...form,
                                        district: districtName,
                                        ward: "",
                                    });

                                    if (district && selectedProvinceCode) {
                                        // gọi giống checkout: provinceCode + districtCode
                                        fetchWards(selectedProvinceCode, district.code);
                                    }
                                }}
                                disabled={!form.province}
                                className="rounded-lg border px-3 py-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                required
                            >
                                <option value="">
                                    {!form.province
                                        ? "Chọn tỉnh trước"
                                        : loadingDistrict
                                            ? "Đang tải..."
                                            : "-- Chọn quận/huyện --"}
                                </option>
                                {districts.map((d) => (
                                    <option key={d.code} value={d.name}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ward + Phone */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Phường / Xã */}
                            <select
                                value={form.ward}
                                onChange={(e) =>
                                    setForm({ ...form, ward: e.target.value })
                                }
                                disabled={!form.district}
                                className="rounded-lg border px-3 py-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                required
                            >
                                <option value="">
                                    {!form.district
                                        ? "Chọn quận trước"
                                        : loadingWard
                                            ? "Đang tải..."
                                            : "-- Chọn phường/xã --"}
                                </option>
                                {wards.map((w) => (
                                    <option key={w.code} value={w.name}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>

                            {/* Số điện thoại */}
                            <input
                                value={form.phone || ""}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="rounded-lg border px-3 py-2"
                                placeholder="Số điện thoại"
                            />
                        </div>

                        {/* Mặc định */}
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={!!form.is_default}
                                onChange={(e) =>
                                    setForm({ ...form, is_default: e.target.checked })
                                }
                            />
                            Đặt làm địa chỉ mặc định
                        </label>

                        {addressError && (
                            <div className="text-xs text-red-500">{addressError}</div>
                        )}

                        <div className="pt-2 text-right space-x-2">
                            <button
                                type="button"
                                onClick={() => setShow(false)}
                                className="px-3 py-2 rounded-lg border"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-2 rounded-lg bg-red-600 text-white"
                            >
                                {editing ? "Cập nhật" : "Thêm"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
