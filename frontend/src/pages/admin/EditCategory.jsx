import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryForm from "../../components/admin/CategoryForm";


export default function EditCategory() {
    const { id } = useParams();
    const nav = useNavigate();
    const [category, setCategory] = useState(null);

    useEffect(() => {
        // TODO: fetch chi tiết danh mục
        // (ví dụ)
        // fetch(`/admin/categories/${id}`)
        //   .then(r => r.json())
        //   .then(setCategory);

        // Mock để demo UI
        setCategory({
            id,
            name: "Lập trình",
            slug: "lap-trinh",
            description: "Sách code",
            image_url: "https://example.com/cat.png",
        });
    }, [id]);

    const handleUpdate = async (fd) => {
        // TODO: gọi API thật — PUT/PATCH multipart/form-data
        // await fetch(`/admin/categories/${id}`, { method: "PUT", body: fd });
        nav("/admin/categories");
    };

    if (!category) return null; // hoặc skeleton

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-bold">Sửa danh mục</h1>
            <CategoryForm mode="edit" initialValues={category} onSubmit={handleUpdate} />
        </div>
    );
}
