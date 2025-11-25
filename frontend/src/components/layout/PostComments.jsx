import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux"; 
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/vi";
import { FiSend, FiTrash2, FiMessageSquare } from "react-icons/fi"; 
import summaryApi, { authHeaders } from "../../common";
import { setUserDetails } from "../../store/userSlice"; 

function parseJwt(token) {
    if (!token) return null;
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
  const dispatch = useDispatch();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const reduxUser = useSelector((state) => state.user?.data);
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  // Tự động lấy thông tin user nếu thiếu
  useEffect(() => {
    if (token && !reduxUser) {
        fetch(summaryApi.url(summaryApi.auth.me), {
            method: 'GET',
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(json => {
            if (json.success) {
                dispatch(setUserDetails(json.data));
            }
        })
        .catch(err => console.log("Silent fetch user failed", err));
    }
  }, [token, reduxUser, dispatch]);

  // Tính toán user hiện tại (kết hợp Token và Redux)
  const effectiveUser = useMemo(() => {
    if (reduxUser) {
        return {
            ...reduxUser,
            displayName: reduxUser.name || "User"
        };
    }
    
    if (token) {
        const decoded = parseJwt(token);
        if (decoded) {
            return {
                id: decoded.sub || decoded.id,
                role: decoded.role, 
                displayName: decoded.name || "User",
                isTemp: true 
            };
        }
    }
    return null;
  }, [reduxUser, token]);

  const isLoggedIn = !!effectiveUser;

  // Check quyền Admin
  const isAdmin = (() => {
    if (!effectiveUser) return false;
    
    const userReal = effectiveUser.user || effectiveUser; 
    const roleObj = userReal.role;

    let roleSlug = "";
    let roleId = 0;

    if (typeof roleObj === 'object' && roleObj !== null) {
        roleSlug = (roleObj.slug || roleObj.name || "").toLowerCase();
        roleId = Number(roleObj.id);
    } else {
        roleSlug = String(roleObj || userReal.role_slug || userReal.role_name || "").toLowerCase();
        roleId = Number(userReal.role_id);
    }

    const validRoles = ["admin", "quản trị viên", "super_admin", "manager", "root"];
    if (validRoles.includes(roleSlug)) return true;
    if (roleId === 1) return true;

    return false;
  })();

  moment.locale('vi');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!isLoggedIn) return toast.info("Vui lòng đăng nhập");

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

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!isLoggedIn) return toast.info("Vui lòng đăng nhập");

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

  const handleDelete = async (id) => {
    if (!confirm("Xóa bình luận này?")) return;
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
    const currentUserId = effectiveUser ? (effectiveUser.id || effectiveUser.sub) : null;
    const isOwner = currentUserId && (String(currentUserId) === String(comment.user_id));
    const canDelete = isOwner || isAdmin;

    const commentAvatar = comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name || "User"}&background=random`;

    return (
      <div className={`flex gap-3 group ${isReply ? "mt-4" : "mt-6"}`}>
        <img 
            src={commentAvatar} 
            className={`${isReply ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0 border border-gray-100`}
            alt={comment.user_name}
        />
        
        <div className="flex-1">
            <div className={`bg-gray-50 p-3 rounded-2xl rounded-tl-none ${isReply ? "bg-gray-100" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-sm">{comment.user_name}</span>
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

            {replyingTo === comment.id && (
                <div className="mt-3 animate-fade-in-down">
                    <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="relative">
                        <textarea
                             autoFocus
                             value={replyContent}
                             onChange={(e) => setReplyContent(e.target.value)}
                             placeholder={`Trả lời ${comment.user_name}...`}
                             className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px] pr-12"
                        />
                        <button type="submit" className="absolute bottom-3 right-3 text-blue-600">
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

      <div className="mb-10">
        {isLoggedIn ? (
            <form onSubmit={handleSubmit}>
                <div>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        // Đổi placeholder cố định, không phụ thuộc loading nữa
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