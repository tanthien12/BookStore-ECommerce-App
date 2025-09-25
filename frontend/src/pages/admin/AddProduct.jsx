import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/admin/ProductForm";

export default function AddProduct() {
    const nav = useNavigate();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // TODO: gọi API thật
        setCategories([{ id: "c1", name: "Programming" }, { id: "c2", name: "Database" }]);
    }, []);

    const handleCreate = async (formData) => {
        // ví dụ gọi API multipart:
        // await fetch("/admin/books", { method: "POST", body: formData });
        nav("/admin/products");
    };

    return <ProductForm mode="create" allCategories={categories} onSubmit={handleCreate} />;
}
