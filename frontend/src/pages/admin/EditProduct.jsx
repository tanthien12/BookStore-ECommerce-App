import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductForm from "../../components/admin/ProductForm";

export default function EditProduct() {
    const { id } = useParams();
    const nav = useNavigate();
    const [categories, setCategories] = useState([]);
    const [product, setProduct] = useState(null);

    useEffect(() => {
        // TODO: fetch categories + product detail
        setCategories([{ id: "c1", name: "Programming" }, { id: "c2", name: "Database" }]);

        // ví dụ product trả về từ API:
        // GET /admin/books/:id -> { id, title, ..., image_url, category_ids: ["c1","c2"] }
        setProduct({
            id, title: "Clean Code", author: "Robert C. Martin",
            price: 199000, stock: 12, description: "...", language: "vi",
            format: "paperback", published_year: 2020, image_url: "https://...",
            category_ids: ["c1"]
        });
    }, [id]);

    const handleUpdate = async (formData) => {
        // ví dụ:
        // await fetch(`/admin/books/${id}`, { method: "PUT", body: formData });
        nav("/admin/products");
    };

    if (!product) return null; // hoặc skeleton
    return (
        <ProductForm
            mode="edit"
            initialValues={product}
            allCategories={categories}
            onSubmit={handleUpdate}
        />
    );
}
