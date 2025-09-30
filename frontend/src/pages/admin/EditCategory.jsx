
// src/pages/admin/EditCategory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CategoryForm from "../../components/admin/CategoryForm";
import summaryApi from "../../common";

export default function EditCategory() {
    const nav = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [init, setInit] = useState(null); // { id, name, slug, description, image_url }
    const [fetchErr, setFetchErr] = useState("");

    // Tải chi tiết category
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(summaryApi.url(summaryApi.category.detail(id)));
                if (res.status === 404) {
                    throw new Error("Danh mục không tồn tại hoặc đã bị xoá.");
                }
                if (!res.ok) {
                    throw new Error(`Không tải được danh mục (HTTP ${res.status})`);
                }
                const json = await res.json();
                if (ignore) return;
                setInit(json?.data || null);
            } catch (e) {
                console.error(e);
                setFetchErr(e.message || "Lỗi tải dữ liệu danh mục");
                toast.error(e.message || "Lỗi tải dữ liệu danh mục");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, [id]);

    // onSubmit từ CategoryForm
    const handleUpdate = async (fd) => {
        try {
            if (!init) return;

            // 1) Upload ảnh nếu người dùng chọn ảnh mới
            let image_url = init.image_url || "";
            const file = fd.get("image");
            if (file && file.size > 0 && file.type?.startsWith("image/")) {
                const upFd = new FormData();
                upFd.append("file", file);
                const upRes = await fetch(summaryApi.url(summaryApi.upload.category.single), {
                    method: "POST",
                    body: upFd,
                });
                if (!upRes.ok) throw new Error(`Upload image failed: ${upRes.status}`);
                const upJson = await upRes.json();
                image_url = upJson?.url || upJson?.data?.url || image_url || "";
            }

            // 2) Payload PUT /categories/:id
            const payload = {
                name: (fd.get("name") || "").trim(),
                slug: (fd.get("slug") || "").trim(),
                description: (fd.get("description") || "").trim(),
                image_url: image_url || undefined, // optional
            };

            const res = await fetch(summaryApi.url(summaryApi.category.update(id)), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || `Cập nhật danh mục thất bại (${res.status})`);
            }

            toast.success("Đã cập nhật danh mục");
            nav("/admin/categories");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Lỗi cập nhật danh mục");
        }
    };

    // Khi đang tải: render trạng thái nhẹ
    if (loading) {
        return (
            <div className="space-y-5">
                <h1 className="text-2xl font-bold">Sửa danh mục</h1>
                <div className="p-4 bg-white rounded-xl border animate-pulse">
                    Đang tải dữ liệu…
                </div>
            </div>
        );
    }

    if (fetchErr) {
        return (
            <div className="space-y-5">
                <h1 className="text-2xl font-bold">Sửa danh mục</h1>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {fetchErr}
                </div>
            </div>
        );
    }

    // initialValues truyền cho CategoryForm (bản đã fix không tự reset khi gõ)
    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-bold">Sửa danh mục</h1>
            <CategoryForm
                mode="edit"
                initialValues={init}
                onSubmit={handleUpdate}
            />
        </div>
    );
}
