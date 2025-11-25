import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { MdSearch, MdAdd, MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";
import moment from "moment";

export default function AdminBlog() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const page = parseInt(searchParams.get("page") || "1");
    const query = searchParams.get("q") || "";
    const [localSearch, setLocalSearch] = useState(query);

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(summaryApi.url(summaryApi.posts.list));
            url.searchParams.set("page", page);
            url.searchParams.set("limit", 10);
            if (query) url.searchParams.set("q", query);

            const res = await fetch(url.toString(), { headers: authHeaders() });
            const json = await res.json();
            if (json.success) {
                setPosts(json.items || []);
                setTotal(json.total || 0);
            }
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [page, query]);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`?q=${localSearch}&page=1`);
    };

    const handleDelete = async (id) => {
        if (!confirm("Xóa bài viết này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.posts.delete(id)), {
                method: "DELETE", headers: authHeaders()
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Đã xóa");
                fetchData();
            }
        } catch { toast.error("Lỗi"); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <h1 className="text-2xl font-bold">Quản lý Blog</h1>
                <Link to="/admin/blog-add" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    <MdAdd /> Viết bài mới
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
                    <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Tìm tiêu đề..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Hình ảnh</th>
                                <th className="p-3 text-left">Tiêu đề</th>
                                <th className="p-3 text-left">Danh mục</th>
                                <th className="p-3 text-left">Trạng thái</th>
                                <th className="p-3 text-left">Ngày tạo</th>
                                <th className="p-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {posts.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-3"><img src={p.thumbnail || "https://via.placeholder.com/50"} className="w-16 h-10 object-cover rounded border"/></td>
                                    <td className="p-3"><div className="font-medium line-clamp-1">{p.title}</div><div className="text-xs text-gray-500 line-clamp-1">{p.slug}</div></td>
                                    <td className="p-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{p.category_name}</span></td>
                                    <td className="p-3">{p.status === 'published' ? <span className="text-green-600 font-medium">Công khai</span> : <span className="text-gray-500">Nháp</span>}</td>
                                    <td className="p-3">{moment(p.created_at).format("DD/MM/YYYY")}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/blog/${p.slug}`} target="_blank" className="p-2 border rounded hover:bg-gray-100"><MdVisibility/></Link>
                                            <Link to={`/admin/blog-edit/${p.id}`} className="p-2 border rounded hover:bg-gray-100 text-blue-600"><MdEdit/></Link>
                                            <button onClick={() => handleDelete(p.id)} className="p-2 border rounded hover:bg-gray-100 text-red-600"><MdDelete/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}