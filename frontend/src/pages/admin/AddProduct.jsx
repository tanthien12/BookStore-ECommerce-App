import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/admin/ProductForm";
import summaryApi from "../../common";
import { toast } from "react-toastify";

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

    // Lấy danh mục
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
                toast.error("Không tải được danh mục");
            } finally {
                setLoadingCats(false);
            }
        })();
        return () => { ignore = true; };
    }, []);

    // Submit tạo sách
    const handleCreate = async (formData) => {
        try {
            const fd = formData instanceof FormData ? formData : new FormData();

            // 1) category_ids
            let category_ids = [];
            if (fd.has("category_ids_json")) {
                try { category_ids = JSON.parse(fd.get("category_ids_json")) || []; } catch { category_ids = []; }
            }

            // 2) ảnh giữ lại (thường create = rỗng)
            let keep_image_urls = [];
            if (fd.has("keep_image_urls_json")) {
                try { keep_image_urls = JSON.parse(fd.get("keep_image_urls_json")) || []; } catch { keep_image_urls = []; }
            }

            // 3) upload nhiều ảnh mới
            const files = fd.getAll("images").filter(Boolean);
            let uploadedUrls = [];
            if (files.length > 0) {
                const upFd = new FormData();
                files.forEach((f) => upFd.append("files", f)); // BE: array('files', 10)
                const upRes = await fetch(summaryApi.url(summaryApi.upload.product.multiple), {
                    method: "POST",
                    body: upFd,
                });
                if (!upRes.ok) throw new Error(`Upload images failed: ${upRes.status}`);
                const upJson = await upRes.json();
                const arr = upJson?.data || upJson?.urls || [];
                uploadedUrls = arr.map((x) => x.url || x).filter(Boolean);
            }

            // 4) gộp ảnh
            const allImageUrls = [...keep_image_urls, ...uploadedUrls];

            // 5) fields khác
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

            // 6) payload — luôn gửi gallery_urls là mảng
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
                image_url: allImageUrls[0] || undefined,   // ảnh đại diện
                gallery_urls: allImageUrls,                 // ✅ luôn là array
                category_ids,                               // UUID[]
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
            //test
            // console.log('payload:', payload);

            toast.success("Đã tạo sách thành công");
            nav("/admin/products");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Lỗi tạo sách");
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
