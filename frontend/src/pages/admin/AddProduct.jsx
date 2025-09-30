// src/pages/admin/AddProduct.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/admin/ProductForm";
import summaryApi from "../../common"; // summaryApi.url(...)
// import { toast } from "react-toastify";

export default function AddProduct() {
    const nav = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);

    const toInt = (v, d = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.trunc(n) : d;
    };
    const toNum = (v, d = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
    };

    // 1) Lấy danh mục
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoadingCats(true);
                const res = await fetch(summaryApi.url(summaryApi.category.list));
                if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
                const data = await res.json();
                if (!ignore) {
                    setCategories((data.items || []).map((c) => ({ id: c.id, name: c.name })));
                }
            } catch (err) {
                console.error(err);
                // toast?.error?.("Không tải được danh mục");
            } finally {
                setLoadingCats(false);
            }
        })();
        return () => { ignore = true; };
    }, []);

    // 2) Submit tạo sách
    const handleCreate = async (formData) => {
        try {
            const fd = formData instanceof FormData ? formData : new FormData();

            // 2.1 Upload ảnh nếu có
            let image_url = fd.get("image_url") || "";
            const file = fd.get("image");
            if (file && file.size > 0 && file.type?.startsWith("image/")) {
                const upFd = new FormData();
                upFd.append("file", file);
                const upRes = await fetch(summaryApi.url(summaryApi.upload.product.single), {
                    method: "POST",
                    body: upFd,
                });
                if (!upRes.ok) throw new Error(`Upload image failed: ${upRes.status}`);
                const upJson = await upRes.json();
                // ✅ Tương thích cả 2 dạng { success, url } hoặc { success, data: { url } }
                image_url = upJson?.url || upJson?.data?.url || image_url || "";
            }

            // 2.2 Lấy fields
            const title = fd.get("title") || "";
            const author = fd.get("author") || "";
            const isbn = fd.get("isbn") || "";
            const publisher = fd.get("publisher") || "";
            const published_year = fd.get("published_year") ? toInt(fd.get("published_year")) : null;
            const language = fd.get("language") || "";
            const format = fd.get("format") || "";
            const price = toNum(fd.get("price"), 0);
            const stock = toInt(fd.get("stock"), 0);
            const description = fd.get("description") || "";

            // 2.2.1 category_ids: đọc từ category_ids_json (đã chuẩn hóa ở Form)
            let category_ids = [];
            if (fd.has("category_ids_json")) {
                try { category_ids = JSON.parse(fd.get("category_ids_json")) || []; } catch { category_ids = []; }
            } else if (fd.has("category_ids")) {
                // fallback: nếu có nhiều option được append theo từng value
                category_ids = fd.getAll("category_ids");
                // Nếu lỡ gửi 1 chuỗi JSON (["id"]) vào category_ids:
                if (category_ids.length === 1 && /^\s*\[.*\]\s*$/.test(category_ids[0])) {
                    try { category_ids = JSON.parse(category_ids[0]) || []; } catch { category_ids = []; }
                }
            } else if (fd.has("category_ids_csv")) {
                const raw = (fd.get("category_ids_csv") || "").trim();
                category_ids = raw ? raw.split(",").map((s) => s.trim()) : [];
            }

            const payload = {
                title,
                author: author || null,
                isbn: isbn || null,
                publisher: publisher || null,
                published_year: published_year ?? null,
                language: language || null,
                format: format || null,
                price,
                stock,
                description: description || null,
                image_url: image_url || undefined, // để qua zod.optional()
                category_ids, // UUID[]
            };

            const res = await fetch(summaryApi.url(summaryApi.book.create), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                const msg = errJson?.message || `Tạo sách thất bại (${res.status})`;
                throw new Error(msg);
            }

            // toast?.success?.("Đã tạo sách thành công");
            nav("/admin/products");
        } catch (err) {
            console.error(err);
            // toast?.error?.(err.message || "Lỗi tạo sách");
            alert(err.message || "Lỗi tạo sách");
        }
    };

    return (
        <ProductForm
            mode="create"
            allCategories={categories}
            categoriesLoading={loadingCats}
            onSubmit={handleCreate}
        />
    );
}
