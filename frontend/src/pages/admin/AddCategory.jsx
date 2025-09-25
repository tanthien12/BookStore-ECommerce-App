import React from "react";
import { useNavigate } from "react-router-dom";
import CategoryForm from "../../components/admin/CategoryForm";

export default function AddCategory() {
    const nav = useNavigate();

    const handleCreate = async (fd) => {
        // TODO: gọi API thật — backend nhận multipart/form-data
        // await fetch("/admin/categories", { method: "POST", body: fd });
        nav("/admin/categories");
    };

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-bold">Thêm danh mục</h1>
            <CategoryForm mode="create" onSubmit={handleCreate} />
        </div>
    );
}
