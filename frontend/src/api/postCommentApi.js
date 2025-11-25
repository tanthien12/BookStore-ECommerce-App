import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux"; 
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/vi";
import { FiSend, FiTrash2, FiMessageSquare } from "react-icons/fi";

// Import file API vừa tạo
import postCommentApi from "../../api/postCommentApi"; 

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Lấy thông tin user từ Redux (khớp với file userSlice.js bạn đã gửi)
  const currentUser = useSelector((state) => state.user?.data);

  // Thiết lập ngôn ngữ tiếng Việt cho thời gian
  moment.locale('vi');

  // 1. Load danh sách comment khi vào bài viết
  useEffect(() => {
    if (!postId) return;
    
    const fetchComments = async () => {
      try {
        const data = await postCommentApi.getList(postId);
        setComments(data);
      } catch (err) { 
        console.error("Lỗi tải comment:", err);
      }
    };
    
    fetchComments();
  }, [postId]);

  // 2. Xử lý gửi bình luận
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    // Check kỹ user trước khi gửi
    if (!currentUser) {
        toast.info("Vui lòng đăng nhập để bình luận");
        return;
    }

    setSubmitting(true);
    try {
      const newComment = await postCommentApi.create({ 
          content, 
          post_id: postId 
      });
      
      // Thêm comment mới lên đầu danh sách ngay lập tức
      setComments([newComment, ...comments]);
      setContent(""); // Xóa ô nhập
      toast.success("Đã gửi bình luận");
      
    } catch (err) { 
        toast.error(err.message || "Lỗi kết nối"); 
    } finally { 
        setSubmitting(false); 
    }
  };

  // 3. Xử lý xóa bình luận
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    
    try {
      await postCommentApi.delete(id);
      // Lọc bỏ comment đã xóa khỏi danh sách hiện tại
      setComments(comments.filter(c => c.id !== id));
      toast.success("Đã xóa bình luận");
    } catch (err) { 
      toast.error(err.message || "Không thể xóa"); 
    }
  };

  return (
    <div className="mt-16 pt-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FiMessageSquare /> Bình luận ({comments.length})
      </h3>

      {/* --- FORM NHẬP LIỆU --- */}
      <div className="mb-10">
        {currentUser ? (
            <form onSubmit={handleSubmit} className="flex gap-4 items-start">
                <img 
                    src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                    alt="avatar"
                />
                <div className="flex-1">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Bình luận với tên ${currentUser.name}...`}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-sm resize-none shadow-sm transition-all"
                    />
                    <div className="mt-2 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={submitting || !content.trim()}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {submitting ? "Đang gửi..." : <><FiSend /> Gửi bình luận</>}
                        </button>
                    </div>
                </div>
            </form>
        ) : (
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200 shadow-sm">
                <p className="text-gray-600 text-sm">
                    Bạn cần <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link> để tham gia thảo luận.
                </p>
            </div>
        )}
      </div>

      {/* --- DANH SÁCH COMMENT --- */}
      <div className="space-y-6">
        {comments.length > 0 ? comments.map((c) => (
            <div key={c.id} className="flex gap-4 group animate-fade-in-up">
                <img 
                    src={c.user_avatar || `https://ui-avatars.com/api/?name=${c.user_name}&background=random`} 
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                    alt={c.user_name}
                />
                <div className="flex-1">
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-transparent hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900 text-sm">{c.user_name}</span>
                            <span className="text-xs text-gray-400" title={moment(c.created_at).format('LLLL')}>
                                {moment(c.created_at).fromNow()}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                    
                    {/* Các nút hành động (Chỉ hiện nếu là chính chủ) */}
                    {currentUser && currentUser.id === c.user_id && (
                        <div className="mt-1 ml-2 flex items-center gap-4 text-xs font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleDelete(c.id)} 
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                            >
                                <FiTrash2 /> Xóa
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )) : (
            <div className="text-center py-8">
                <p className="text-gray-400 text-sm italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            </div>
        )}
      </div>
    </div>
  );
}