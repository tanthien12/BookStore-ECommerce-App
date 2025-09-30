// src/pages/admin/AddCategory.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import CategoryForm from "../../components/admin/CategoryForm";
import summaryApi from "../../common";
import { toast } from "react-toastify";

export default function AddCategory() {
    const nav = useNavigate();

    const handleCreate = async (fd) => {
        try {
            // === 1. Upload ảnh nếu có ===
            let image_url = "";
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
                image_url = upJson?.url || upJson?.data?.url || "";
            }

            // === 2. Tạo category ===
            const payload = {
                name: (fd.get("name") || "").trim(),
                slug: (fd.get("slug") || "").trim(),
                description: (fd.get("description") || "").trim(),
                image_url: image_url || undefined, // optional
            };

            const res = await fetch(summaryApi.url(summaryApi.category.create), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || `Tạo danh mục thất bại (${res.status})`);
            }

            toast?.success?.("Đã tạo danh mục");
            nav("/admin/categories");
        } catch (e) {
            console.error(e);
            alert(e.message || "Lỗi tạo danh mục");
            toast?.error?.(e.message || "Lỗi tạo danh mục");
        }
    };

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-bold">Thêm danh mục</h1>
            <CategoryForm mode="create" onSubmit={handleCreate} />
        </div>
    );
}
