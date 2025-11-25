import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux"; 
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/vi";
import { FiSend, FiTrash2, FiMessageSquare } from "react-icons/fi"; 
import summaryApi, { authHeaders } from "../../common";

// Hàm giải mã Token (JWT) để lấy thông tin user ngay lập tức
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // State cho phần Reply
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // 1. Lấy user từ Redux (Ưu tiên 1)
  const reduxUser = useSelector((state) => state.user?.data);
  
  // 2. Lấy token và giải mã User từ Token (Phương án dự phòng khi Redux null)
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  
  // User gộp: Nếu Redux có thì dùng Redux, nếu không thì dùng thông tin từ Token
  const effectiveUser = useMemo(() => {
    if (reduxUser) return reduxUser;
    if (token) {
        const decoded = parseJwt(token);
        if (decoded) {
            // Token thường chứa: { sub: userId, role: "admin", email: ... }
            return {
                id: decoded.sub || decoded.id,
                role: decoded.role,
                // Các trường khác giả lập để không bị lỗi
                name: decoded.name || "User",
                avatar_url: null 
            };
        }
    }
    return null;
  }, [reduxUser, token]);

  const isLoggedIn = !!effectiveUser; // Có user (từ nguồn nào cũng được) là đã đăng nhập

  // --- LOGIC CHECK ADMIN (Cập nhật: Hỗ trợ cả Redux User và Token User) ---
  const isAdmin = (() => {
    if (!effectiveUser) return false;
    
    // Log để kiểm tra xem đang dùng user từ nguồn nào
    // console.log("Current User Source:", effectiveUser);

    // Xử lý trường hợp object lồng nhau (nếu có)
    const userReal = effectiveUser.user || effectiveUser; 
    
    // Lấy role từ nhiều nguồn có thể
    const roleObj = userReal.role;
    let roleSlug = "";
    let roleId = 0;

    if (typeof roleObj === 'object' && roleObj !== null) {
        // Redux thường trả về object: { id, name, slug }
        roleSlug = (roleObj.slug || roleObj.name || "").toLowerCase();
        roleId = Number(roleObj.id);
    } else {
        // Token thường trả về string: "admin"
        // Hoặc Redux trả về string role_slug
        roleSlug = String(roleObj || userReal.role_slug || userReal.role_name || "").toLowerCase();
        roleId = Number(userReal.role_id);
    }

    const validRoles = ["admin", "quản trị viên", "super_admin", "manager", "root"];
    
    // Check theo tên
    if (validRoles.includes(roleSlug)) return true;
    
    // Check theo ID
    if (roleId === 1) return true;

    return false;
  })();
  // -------------------------------------------------------------

  moment.locale('vi');

  // Load comments
  useEffect(() => {
    if (!postId) return;
    const fetchComments = async () => {
      try {
        const res = await fetch(summaryApi.url(summaryApi.postComments.list(postId)));
        const json = await res.json();
        if (json.success) setComments(json.data);
      } catch (err) { console.error(err); }
    };
    fetchComments();
  }, [postId]);

  // Gửi comment gốc
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!isLoggedIn) return toast.info("Vui lòng đăng nhập để bình luận");

    setSubmitting(true);
    try {
      const res = await fetch(summaryApi.url(summaryApi.postComments.create), {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content, post_id: postId, parent_id: null }),
      });
      const json = await res.json();
      
      if (json.success) {
        setComments([json.data, ...comments]); 
        setContent("");
        toast.success("Đã gửi bình luận");
      } else {
        toast.error(json.message);
      }
    } catch (err) { toast.error("Lỗi kết nối"); } 
    finally { setSubmitting(false); }
  };

  // Gửi Reply
  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!isLoggedIn) return toast.info("Vui lòng đăng nhập để trả lời");

    setReplySubmitting(true);
    try {
      const res = await fetch(summaryApi.url(summaryApi.postComments.create), {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, post_id: postId, parent_id: parentId }),
      });
      const json = await res.json();
      
      if (json.success) {
        setComments([json.data, ...comments]); 
        setReplyContent("");
        setReplyingTo(null);
        toast.success("Đã trả lời");
      } else {
        toast.error(json.message);
      }
    } catch (err) { toast.error("Lỗi kết nối"); } 
    finally { setReplySubmitting(false); }
  };

  // Xóa comment
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      const res = await fetch(summaryApi.url(summaryApi.postComments.delete(id)), {
        method: "DELETE", headers: authHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setComments(comments.filter(c => c.id !== id));
        toast.success("Đã xóa");
      } else {
        toast.error(json.message || "Không thể xóa");
      }
    } catch (err) { toast.error("Lỗi xóa"); }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => {
    return comments
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const CommentItem = ({ comment, isReply = false }) => {
    // Check quyền sở hữu: So sánh ID từ effectiveUser (có thể là sub từ token hoặc id từ redux)
    const currentUserId = effectiveUser ? (effectiveUser.id || effectiveUser.sub) : null;
    
    // Ép kiểu String để so sánh an toàn
    const isOwner = currentUserId && (String(currentUserId) === String(comment.user_id));
    
    // Nút Xóa hiện khi: Là chủ sở hữu HOẶC Là Admin
    const canDelete = isOwner || isAdmin;

    return (
      <div className={`flex gap-3 group ${isReply ? "mt-4" : "mt-6"}`}>
        <img 
            src={comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name || "User"}&background=random`} 
            className={`${isReply ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0 border border-gray-100`}
            alt={comment.user_name}
        />
        
        <div className="flex-1">
            <div className={`bg-gray-50 p-3 rounded-2xl rounded-tl-none ${isReply ? "bg-gray-100" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-sm">
                        {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-400">{moment(comment.created_at).fromNow()}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
            
            <div className="mt-1 ml-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                {isLoggedIn && !isReply && (
                    <button 
                        onClick={() => {
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                            setReplyContent("");
                        }}
                        className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                        Trả lời
                    </button>
                )}

                {canDelete && (
                    <button 
                        onClick={() => handleDelete(comment.id)} 
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                        <FiTrash2 className="text-sm" /> Xóa
                    </button>
                )}
            </div>

            {/* Form Reply */}
            {replyingTo === comment.id && (
                <div className="mt-3 flex gap-3 animate-fade-in-down">
                    <img 
                        src={effectiveUser?.avatar_url || `https://ui-avatars.com/api/?name=${effectiveUser?.name || "Me"}&background=random`} 
                        className="w-8 h-8 rounded-full opacity-50" 
                        alt="me"
                    />
                    <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex-1 relative">
                        <textarea
                             autoFocus
                             value={replyContent}
                             onChange={(e) => setReplyContent(e.target.value)}
                             placeholder={`Trả lời ${comment.user_name}...`}
                             className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px] pr-12"
                        />
                        <button 
                            type="submit"
                            disabled={replySubmitting || !replyContent.trim()} 
                            className="absolute bottom-3 right-3 text-blue-600 hover:text-blue-800 disabled:opacity-30"
                        >
                            <FiSend />
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-16 pt-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FiMessageSquare /> Bình luận ({comments.length})
      </h3>

      {/* --- DEBUG PANEL (Sẽ tự hiển thị thông tin chính xác) --- */}
      <div className="bg-black text-white p-4 text-xs rounded mb-4 overflow-auto max-h-40 font-mono hidden">
        <p className="font-bold text-yellow-400">--- DEBUG INFO ---</p>
        <p>Is Logged In: {isLoggedIn ? "YES" : "NO"}</p>
        <p>Is Admin: {isAdmin ? "TRUE" : "FALSE"}</p>
        <p>User Source: {reduxUser ? "REDUX" : (token ? "TOKEN" : "NONE")}</p>
        <pre>{JSON.stringify(effectiveUser, null, 2)}</pre>
      </div>

      {/* Form nhập liệu gốc */}
      <div className="mb-10">
        {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="flex gap-4 items-start">
                <img 
                    src={effectiveUser?.avatar_url || `https://ui-avatars.com/api/?name=${effectiveUser?.name || "User"}&background=random`} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                    alt="avatar"
                />
                <div className="flex-1">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Chia sẻ suy nghĩ của bạn..."
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-sm resize-none shadow-sm"
                    />
                    <div className="mt-2 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={submitting || !content.trim()}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <FiSend /> {submitting ? "Đang gửi..." : "Gửi bình luận"}
                        </button>
                    </div>
                </div>
            </form>
        ) : (
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                <p className="text-gray-600 text-sm">
                    Bạn cần <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link> để tham gia thảo luận.
                </p>
            </div>
        )}
      </div>

      <div className="space-y-2">
        {rootComments.length > 0 ? rootComments.map((rootComment) => (
            <div key={rootComment.id}>
                <CommentItem comment={rootComment} />
                <div className="ml-12 border-l-2 border-gray-100 pl-4 space-y-4">
                    {getReplies(rootComment.id).map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply={true} />
                    ))}
                </div>
            </div>
        )) : (
            <p className="text-center text-gray-400 text-sm py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </div>
  );
}