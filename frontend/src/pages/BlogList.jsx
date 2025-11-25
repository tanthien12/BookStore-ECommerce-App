import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import moment from "moment";
import "moment/locale/vi"; 
import summaryApi from "../common";

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // State để lưu tên danh mục hiện tại
  const [categoryName, setCategoryName] = useState(""); 
  
  const categoryId = searchParams.get("category_id");
  
  moment.locale('vi');

  // 1. Effect lấy tên danh mục
  useEffect(() => {
    if (categoryId) {
        const fetchCategoryName = async () => {
            try {
                const res = await fetch(summaryApi.url(summaryApi.blogCategories.list));
                const json = await res.json();
                if (json.success) {
                    const found = (json.items || []).find(c => c.id === categoryId);
                    if (found) setCategoryName(found.name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategoryName();
    } else {
        setCategoryName("");
    }
  }, [categoryId]);

  // 2. Effect lấy bài viết
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // List bài viết chính
        const url = new URL(summaryApi.url(summaryApi.posts.list));
        url.searchParams.set("status", "published");
        if (categoryId) url.searchParams.set("category_id", categoryId);
        
        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.success) {
            const hiddenSlugs = [
                "about-us", 
                "return-policy", 
                "privacy-policy",
                "shipping-policy"
            ];
            const validPosts = (json.items || []).filter(p => !hiddenSlugs.includes(p.slug));
            setPosts(validPosts);
        }

        // Sidebar: Bài viết mới nhất
        const urlRecent = new URL(summaryApi.url(summaryApi.posts.list));
        urlRecent.searchParams.set("status", "published");
        urlRecent.searchParams.set("limit", "5");
        urlRecent.searchParams.set("sort", "newest");
        
        const resRecent = await fetch(urlRecent.toString());
        const jsonRecent = await resRecent.json();
        if (jsonRecent.success) {
            const hiddenSlugs = ["about-us", "return-policy", "privacy-policy"];
             const validRecent = (jsonRecent.items || []).filter(p => !hiddenSlugs.includes(p.slug));
             setRecentPosts(validRecent);
        }

      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchData();
  }, [categoryId]);

  return (
    <div className="bg-white min-h-screen pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="py-4 text-sm text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link> 
            <span>›</span>
            {/* Đã đổi thành màu đen (gray-900) */}
            <span className="font-medium text-gray-900">
                {categoryName || "Review sách của độc giả"}
            </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
            
            {/* === CỘT TRÁI (MAIN CONTENT) === */}
            <div className="w-full lg:w-3/4">
                {/* Tiêu đề chính: Màu đen */}
                <h1 className="text-3xl font-bold text-gray-900 mb-8 uppercase">
                    {categoryName || "Review sách của độc giả"}
                </h1>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg">
                        Chưa có bài viết nào trong mục này.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                        {posts.map((post) => (
                            <div key={post.id} className="group flex flex-col h-full">
                                {/* Ảnh Thumbnail */}
                                <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-md mb-3">
                                    <div className="aspect-[3/2] w-full overflow-hidden bg-gray-100">
                                        <img 
                                            src={post.thumbnail || "https://via.placeholder.com/400x300"} 
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                </Link>
                                
                                {/* Nội dung */}
                                <div className="flex flex-col flex-1">
                                    {/* Tiêu đề bài viết: Mặc định đen, hover hơi sáng lên 1 chút hoặc giữ nguyên */}
                                    <h3 className="text-base font-bold text-gray-900 mb-2 uppercase leading-snug group-hover:text-gray-600 transition-colors line-clamp-3">
                                        <Link to={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <div className="mt-auto text-sm text-gray-500">
                                        {moment(post.created_at).format("dddd, DD/MM/YYYY")}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* === CỘT PHẢI (SIDEBAR) === */}
            <div className="w-full lg:w-1/4 space-y-8">
                {/* Widget Danh mục tin */}
                <div>
                    {/* Tiêu đề sidebar: Màu đen */}
                    <h3 className="text-xl font-bold text-gray-900 uppercase border-b-2 border-gray-100 pb-2 mb-6">
                        BÀI VIẾT MỚI
                    </h3>
                    
                    <div className="space-y-6">
                        {recentPosts.map((post) => (
                            <div key={post.id} className="flex gap-4 group">
                                {/* Ảnh nhỏ bên trái */}
                                <Link to={`/blog/${post.slug}`} className="shrink-0 w-28 h-20 overflow-hidden rounded bg-gray-100">
                                    <img 
                                        src={post.thumbnail || "https://via.placeholder.com/150"} 
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </Link>
                                
                                {/* Text bên phải */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase leading-snug mb-1 line-clamp-3 group-hover:text-gray-600 transition">
                                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                                    </h4>
                                    <div className="text-xs text-gray-400">
                                        {moment(post.created_at).format("dddd, DD/MM/YYYY")}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}