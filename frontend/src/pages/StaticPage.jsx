import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import summaryApi from "../common";

export default function StaticPage({ targetSlug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    
    // Gọi API lấy bài viết
    fetch(summaryApi.url(summaryApi.posts.detail(targetSlug)))
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPost(json.data);
        else setPost(null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [targetSlug]);

  if (loading) {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <p className="text-gray-500">Đang tải...</p>
        </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-bold text-gray-800">Nội dung đang cập nhật</h2>
        <Link to="/" className="text-blue-600 hover:underline mt-2">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16 font-sans">
      
      {/* 1. Breadcrumb (Sạch sẽ: Trang chủ > Tên bài) */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link> 
            <span>›</span>
            {/* Chỉ hiện tiêu đề trang, không hiện danh mục */}
            <span className="text-gray-900 font-medium">{post.title}</span>
        </div>
      </div>

      {/* 2. Nội dung chính */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
        
        {/* Header: CHỈ CÓ TIÊU ĐỀ */}
        <div className="text-center mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {post.title}
            </h1>
        </div>

        {/* Ảnh Banner (Nếu có) */}
        {post.thumbnail && (
            <div className="mb-10 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img 
                    src={post.thumbnail} 
                    alt={post.title} 
                    className="w-full h-auto object-cover max-h-[500px]" 
                />
            </div>
        )}

        {/* Nội dung HTML */}
        <div className="prose prose-lg prose-slate max-w-none 
            prose-headings:text-gray-900 
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 hover:prose-a:text-blue-800
            prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
            prose-strong:text-gray-900">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

      </div>
    </div>
  );
}