import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProductForm from "../../components/admin/ProductForm";
import summaryApi from "../../common";

export default function EditProduct() {
    const { id } = useParams();
    const nav = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [product, setProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(true);

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
                toast.error("Không tải được danh mục");
            } finally {
                setLoadingCats(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    // 2) Lấy thông tin sách
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoadingProduct(true);
                const res = await fetch(summaryApi.url(summaryApi.book.detail(id)));
                if (!res.ok) throw new Error(`Fetch book failed: ${res.status}`);
                const data = await res.json();
                if (!ignore) {
                    if (data.data) {
                        const book = data.data;
                        setProduct({
                            ...book,
                            category_ids: (book.categories || []).map((c) => c.id), // ✅ map ra array id
                        });
                    } else {
                        setProduct(null);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Không tải được dữ liệu sách");
            } finally {
                setLoadingProduct(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    // 3) Submit cập nhật
    const handleUpdate = async (formData) => {
        try {
            const fd = formData instanceof FormData ? formData : new FormData();

            // category_ids
            let category_ids = [];
            if (fd.has("category_ids_json")) {
                try {
                    category_ids = JSON.parse(fd.get("category_ids_json")) || [];
                } catch {
                    category_ids = [];
                }
            }

            // giữ ảnh cũ
            let keep_image_urls = [];
            if (fd.has("keep_image_urls_json")) {
                try {
                    keep_image_urls = JSON.parse(fd.get("keep_image_urls_json")) || [];
                } catch {
                    keep_image_urls = [];
                }
            }

            // upload ảnh mới
            const files = fd.getAll("images").filter(Boolean);
            let uploadedUrls = [];
            if (files.length > 0) {
                const upFd = new FormData();
                files.forEach((f) => upFd.append("files", f));
                const upRes = await fetch(summaryApi.url(summaryApi.upload.product.multiple), {
                    method: "POST",
                    body: upFd,
                });
                if (!upRes.ok) throw new Error(`Upload images failed: ${upRes.status}`);
                const upJson = await upRes.json();
                const arr = upJson?.data || upJson?.urls || [];
                uploadedUrls = arr.map((x) => x.url || x).filter(Boolean);
            }

            // gộp ảnh
            const allImageUrls = [...keep_image_urls, ...uploadedUrls];

            // fields khác
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

            // NEW: sale_price (tùy chọn)
            let sale_price = null;
            if (fd.has("sale_price")) {
                const raw = fd.get("sale_price");
                if (raw !== "" && raw !== null) {
                    sale_price = toNum(raw, null);
                }
            }
            if (sale_price !== null && sale_price > price) {
                throw new Error("Giá bán (khuyến mãi) phải ≤ Giá.");
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
                image_url: allImageUrls[0] || undefined,
                gallery_urls: allImageUrls, // ✅ luôn là array
                category_ids,
            };
            if (sale_price !== null && !Number.isNaN(sale_price)) {
                payload.sale_price = sale_price;
            }

            const res = await fetch(summaryApi.url(summaryApi.book.update(id)), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                const msg = errJson?.message || `Cập nhật thất bại (${res.status})`;
                throw new Error(msg);
            }

            toast.success("Đã cập nhật sách thành công");
            nav("/admin/products");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Lỗi cập nhật sách");
        }
    };

    if (loadingProduct) return <div className="p-4">Đang tải dữ liệu…</div>;
    if (!product) return <div className="p-4 text-red-600">Không tìm thấy sách.</div>;

    return (
        <ProductForm
            mode="edit"
            initialValues={product}
            allCategories={categories}
            categoriesLoading={loadingCats}
            onSubmit={handleUpdate}
        />
    );
}

// code goc
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import ProductForm from "../../components/admin/ProductForm";
// import summaryApi from "../../common";

// export default function EditProduct() {
//     const { id } = useParams();
//     const nav = useNavigate();

//     const [categories, setCategories] = useState([]);
//     const [loadingCats, setLoadingCats] = useState(false);
//     const [product, setProduct] = useState(null);
//     const [loadingProduct, setLoadingProduct] = useState(true);

//     const toInt = (v, d = 0) => {
//         const n = Number(v);
//         return Number.isFinite(n) ? Math.trunc(n) : d;
//     };
//     const toNum = (v, d = 0) => {
//         const n = Number(v);
//         return Number.isFinite(n) ? n : d;
//     };

//     // 1) Lấy danh mục
//     useEffect(() => {
//         let ignore = false;
//         (async () => {
//             try {
//                 setLoadingCats(true);
//                 const res = await fetch(summaryApi.url(summaryApi.category.list));
//                 if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
//                 const data = await res.json();
//                 if (!ignore) {
//                     setCategories((data.items || []).map((c) => ({ id: c.id, name: c.name })));
//                 }
//             } catch (err) {
//                 console.error(err);
//                 toast.error("Không tải được danh mục");
//             } finally {
//                 setLoadingCats(false);
//             }
//         })();
//         return () => { ignore = true; };
//     }, []);

//     // 2) Lấy thông tin sách
//     useEffect(() => {
//         let ignore = false;
//         (async () => {
//             try {
//                 setLoadingProduct(true);
//                 const res = await fetch(summaryApi.url(summaryApi.book.detail(id)));
//                 if (!res.ok) throw new Error(`Fetch book failed: ${res.status}`);
//                 const data = await res.json();
//                 if (!ignore) {
//                     if (data.data) {
//                         const book = data.data;
//                         setProduct({
//                             ...book,
//                             category_ids: (book.categories || []).map(c => c.id), // ✅ map ra array id
//                         });
//                     } else {
//                         setProduct(null);
//                     }
//                 }
//             } catch (err) {
//                 console.error(err);
//                 toast.error("Không tải được dữ liệu sách");
//             } finally {
//                 setLoadingProduct(false);
//             }
//         })();
//         return () => { ignore = true; };
//     }, [id]);

//     // 3) Submit cập nhật
//     const handleUpdate = async (formData) => {
//         try {
//             const fd = formData instanceof FormData ? formData : new FormData();

//             // category_ids
//             let category_ids = [];
//             if (fd.has("category_ids_json")) {
//                 try { category_ids = JSON.parse(fd.get("category_ids_json")) || []; } catch { category_ids = []; }
//             }

//             // giữ ảnh cũ
//             let keep_image_urls = [];
//             if (fd.has("keep_image_urls_json")) {
//                 try { keep_image_urls = JSON.parse(fd.get("keep_image_urls_json")) || []; } catch { keep_image_urls = []; }
//             }

//             // upload ảnh mới
//             const files = fd.getAll("images").filter(Boolean);
//             let uploadedUrls = [];
//             if (files.length > 0) {
//                 const upFd = new FormData();
//                 files.forEach((f) => upFd.append("files", f));
//                 const upRes = await fetch(summaryApi.url(summaryApi.upload.product.multiple), {
//                     method: "POST",
//                     body: upFd,
//                 });
//                 if (!upRes.ok) throw new Error(`Upload images failed: ${upRes.status}`);
//                 const upJson = await upRes.json();
//                 const arr = upJson?.data || upJson?.urls || [];
//                 uploadedUrls = arr.map((x) => x.url || x).filter(Boolean);
//             }

//             // gộp ảnh
//             const allImageUrls = [...keep_image_urls, ...uploadedUrls];

//             // fields khác
//             const title = fd.get("title") || "";
//             const author = fd.get("author") || "";
//             const isbn = fd.get("isbn") || "";
//             const publisher = fd.get("publisher") || "";
//             const published_year = fd.get("published_year") ? toInt(fd.get("published_year")) : null;
//             const language = fd.get("language") || "";
//             const format = fd.get("format") || "";
//             const price = toNum(fd.get("price"), 0);
//             const stock = toInt(fd.get("stock"), 0);
//             const description = fd.get("description") || "";

//             const payload = {
//                 title,
//                 author: author || null,
//                 isbn: isbn || null,
//                 publisher: publisher || null,
//                 published_year: published_year ?? null,
//                 language: language || null,
//                 format: format || null,
//                 price,
//                 stock,
//                 description: description || null,
//                 image_url: allImageUrls[0] || undefined,
//                 gallery_urls: allImageUrls,       // ✅ luôn là array
//                 category_ids,
//             };

//             const res = await fetch(summaryApi.url(summaryApi.book.update(id)), {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload),
//             });

//             if (!res.ok) {
//                 const errJson = await res.json().catch(() => null);
//                 const msg = errJson?.message || `Cập nhật thất bại (${res.status})`;
//                 throw new Error(msg);
//             }

//             toast.success("Đã cập nhật sách thành công");
//             nav("/admin/products");
//         } catch (err) {
//             console.error(err);
//             toast.error(err.message || "Lỗi cập nhật sách");
//         }
//     };

//     if (loadingProduct) return <div className="p-4">Đang tải dữ liệu…</div>;
//     if (!product) return <div className="p-4 text-red-600">Không tìm thấy sách.</div>;

//     return (
//         <ProductForm
//             mode="edit"
//             initialValues={product}
//             allCategories={categories}
//             categoriesLoading={loadingCats}
//             onSubmit={handleUpdate}
//         />
//     );
// }
