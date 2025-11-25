import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/vi"; 
import summaryApi from "../common";
import PostComments from "../components/layout/PostComments";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  moment.locale('vi');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(summaryApi.url(summaryApi.posts.detail(slug)))
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPost(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="py-20 text-center text-gray-500">Đang tải nội dung...</div>;
  if (!post) return <div className="py-20 text-center text-gray-500">Bài viết không tồn tại.</div>;

  return (
    <div className="bg-white min-h-screen pb-16 font-sans">
      {/* CONTAINER CHÍNH: max-w-7xl giống hệt BlogList để đồng bộ lề trái/phải */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Breadcrumb: Nền trắng, chữ xám, nằm thẳng hàng với nội dung */}
        <div className="py-4 text-sm text-gray-500 flex items-center gap-2 border-b border-gray-100 mb-8">
            <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link> 
            <span>›</span>
            <Link 
                to={`/blog?category_id=${post.blog_category_id}`} 
                className="hover:text-black transition-colors"
            >
                {post.category_name || "Blog"}
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md">
                {post.title}
            </span>
        </div>

        {/* 2. Nội dung bài viết */}
        {/* Dùng max-w-4xl và mx-auto để nội dung không bị quá bè ra hai bên, dễ đọc hơn, nhưng vẫn nằm trong khung 7xl */}
        <div className="max-w-4xl mx-auto">
            
            {/* Header bài viết */}
            <div className="mb-8 text-center">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 block">
                    {post.category_name}
                </span>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug mb-4">
                    {post.title}
                </h1>
                
                <div className="flex items-center justify-center text-gray-500 text-sm gap-3">
                    <span className="capitalize">
                        {moment(post.created_at).format("dddd, DD/MM/YYYY")}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>Bởi <strong className="text-gray-900">{post.author_name || "Admin"}</strong></span>
                </div>
            </div>

            {/* Nội dung HTML từ Editor */}
            <div className="prose prose-lg prose-slate max-w-none 
                prose-headings:text-gray-900 
                prose-p:text-gray-700
                prose-a:text-blue-600 hover:prose-a:text-blue-800
                prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto
                prose-strong:text-gray-900">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            <PostComments postId={post.id} />

            {/* Footer bài viết */}
            <div className="mt-12 pt-8 border-t border-gray-100">
                <Link 
                    to="/blog"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
                >
                    ← Quay lại danh sách
                </Link>
            </div>

        </div>
      </div>
    </div>
  );
}