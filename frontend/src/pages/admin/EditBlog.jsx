import React, { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MdSave, MdCloudUpload, MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";

export default function BlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);

    // Form State
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [blogCategoryId, setBlogCategoryId] = useState("");
    const [status, setStatus] = useState("draft");
    
    const [thumbnail, setThumbnail] = useState(""); 
    const [previewUrl, setPreviewUrl] = useState(""); 
    const [imageFile, setImageFile] = useState(null);
    const fileRef = useRef(null);

    // Load Categories & Data
    useEffect(() => {
        // 1. Lấy danh mục trước
        fetch(summaryApi.url(summaryApi.blogCategories.list))
            .then(res => res.json())
            .then(json => {
                if(json.success) {
                    setCategories(json.items);
                    if(!isEdit && json.items.length > 0) setBlogCategoryId(json.items[0].id);
                }
            });

        // 2. Nếu Edit, lấy chi tiết bài viết
        if (isEdit) {
            setLoading(true);
            fetch(summaryApi.url(summaryApi.posts.detail(id)))
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data) {
                        const p = json.data;
                        setTitle(p.title); setSlug(p.slug); setDescription(p.description || "");
                        setContent(p.content || ""); 
                        setBlogCategoryId(p.blog_category_id || "");
                        setStatus(p.status || "draft"); setThumbnail(p.thumbnail || "");
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const handleTitleChange = (e) => {
        const val = e.target.value;
        setTitle(val);
        if (!isEdit) {
            setSlug(val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'));
        }
    };

    const handleImageChange = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("File phải là ảnh");
        setImageFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Upload ảnh nếu có
            let finalThumbnail = thumbnail;
            if (imageFile) {
                const fd = new FormData();
                fd.append("file", imageFile);
                const upRes = await fetch(summaryApi.url(summaryApi.upload.post.single), { 
                    method: "POST", 
                    headers: { ...authHeaders() }, 
                    body: fd 
                });
                const upJson = await upRes.json();
                if (upJson.success) finalThumbnail = upJson.url || upJson.data?.url;
            }

            const payload = { title, slug, description, content, blog_category_id: blogCategoryId, status, thumbnail: finalThumbnail };
            const url = isEdit ? summaryApi.posts.update(id) : summaryApi.posts.create;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(summaryApi.url(url), {
                method, headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Thành công");
                navigate("/admin/blog");
            } else toast.error(json.message);
        } catch (err) { toast.error("Lỗi"); } 
        finally { setSubmitting(false); }
    };

    const modules = { toolbar: [[{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline', 'blockquote'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link', 'image'], ['clean']] };

    if (loading) return <div>Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "Sửa bài viết" : "Viết bài mới"}</h1>
                <div className="flex gap-2">
                    <Link to="/admin/blog" className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-700">Hủy</Link>
                    <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70">
                        <MdSave /> {submitting ? "Đang lưu..." : "Lưu bài viết"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-200 space-y-4">
                        <div><label className="text-sm font-medium">Tiêu đề</label><input value={title} onChange={handleTitleChange} className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"/></div>
                        <div><label className="text-sm font-medium">Slug</label><input value={slug} onChange={e => setSlug(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50"/></div>
                        <div><label className="text-sm font-medium">Mô tả ngắn</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"/></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
                        <label className="text-sm font-medium mb-2 block">Nội dung</label>
                        <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-96 mb-12" />
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-200 space-y-4">
                        <h3 className="font-semibold border-b pb-2">Cấu hình</h3>
                        <div>
                            <label className="text-sm font-medium">Trạng thái</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg">
                                <option value="draft">Bản nháp</option><option value="published">Công khai</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Danh mục</label>
                            <select value={blogCategoryId} onChange={e => setBlogCategoryId(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg">
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
                        <h3 className="font-semibold border-b pb-2 mb-4">Ảnh đại diện</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50" onClick={() => fileRef.current.click()}>
                            {previewUrl || thumbnail ? (
                                <div className="relative w-full h-40"><img src={previewUrl || thumbnail} className="w-full h-full object-cover rounded-lg"/><button type="button" className="absolute top-1 right-1 bg-white p-1 rounded-full shadow text-red-500" onClick={(e) => {e.stopPropagation(); setPreviewUrl(""); setThumbnail(""); setImageFile(null);}}><MdClose/></button></div>
                            ) : (
                                <div className="text-center py-8 text-gray-500"><MdCloudUpload className="mx-auto text-4xl mb-2"/><p className="text-sm">Click tải ảnh</p></div>
                            )}
                            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])}/>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}