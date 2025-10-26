import React, { useState } from "react";
import RatingStars from "./RatingStars";
import { reviewApi } from "../../api/reviewApi";
import { toast } from "react-toastify";

function ReplyEditor({ initial = "", onSubmit, onCancel }) {
  const [text, setText] = useState(initial);

  const save = async () => {
    if (!text.trim()) return;
    await onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="mt-2">
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Phản hồi..."
      />
      <div className="flex gap-2 mt-1 text-xs">
        <button
          className="bg-gray-800 text-white px-3 py-1 rounded"
          onClick={save}
        >
          Gửi
        </button>
        {onCancel && (
          <button className="text-gray-500" onClick={onCancel}>
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}

function ReplyItem({ reply, currentUser, reload }) {
  const [editing, setEditing] = useState(false);

  const canModifyReply =
    currentUser &&
    (
      String(currentUser.id) === String(reply.owner_id) ||
      currentUser.role === "admin" ||
      currentUser.role === "ADMIN"
    );

  async function handleUpdate(newText) {
    try {
      await reviewApi.updateReply(reply.id, newText);
      toast.success("Đã cập nhật phản hồi");
      setEditing(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Xóa phản hồi này?")) return;
    try {
      await reviewApi.deleteAny(reply.id);
      toast.success("Đã xóa phản hồi");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="border-l pl-3 mb-3">
      <div className="flex items-start gap-2">
        <img
          src={reply.avatar_url || "/user.png"}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            <span>{reply.user_name}</span>
            <span className="text-xs text-gray-400">
              {new Date(reply.created_at).toLocaleString()}
            </span>
          </div>

          {editing ? (
            <ReplyEditor
              initial={reply.content}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="text-sm text-gray-700 mt-1">{reply.content}</div>
          )}

          {canModifyReply && !editing && (
            <div className="flex gap-3 text-[11px] text-gray-500 mt-1">
              <button onClick={() => setEditing(true)}>Sửa</button>
              <button onClick={handleDelete}>Xóa</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewCard({ review, currentUser, reload }) {
  const [replyMode, setReplyMode] = useState(false);

  const isOwner =
    currentUser &&
    String(currentUser.id) === String(review.owner_id);

  const isAdmin =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "ADMIN");

  const canReply = isOwner || isAdmin;

  async function sendReply(text) {
    try {
      await reviewApi.addReply(review.id, text);
      toast.success("Đã gửi phản hồi");
      setReplyMode(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deleteReview() {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await reviewApi.deleteAny(review.id);
      toast.success("Đã xóa đánh giá");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white mb-4">
      {/* Review chính */}
      <div className="flex items-start gap-3">
        <img
          src={review.avatar_url || "/user.png"}
          className="w-10 h-10 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-sm">{review.user_name}</div>
            <RatingStars value={review.rating} size={14} />
            <div className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleString()}
            </div>
          </div>

          <div className="text-sm text-gray-800 mt-1">
            {review.content}
          </div>

          {(isOwner || isAdmin) && (
            <div className="text-[12px] text-gray-500 flex gap-4 mt-2">
              {canReply && (
                <button onClick={() => setReplyMode(true)}>Phản hồi</button>
              )}
              <button onClick={deleteReview}>Xóa đánh giá</button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {review.replies?.length > 0 && (
        <div className="mt-3 pl-4 border-l">
          {review.replies.map((rep) => (
            <ReplyItem
              key={rep.id}
              reply={rep}
              currentUser={currentUser}
              reload={reload}
            />
          ))}
        </div>
      )}

      {/* Reply box */}
      {canReply && replyMode && (
        <ReplyEditor
          onSubmit={sendReply}
          onCancel={() => setReplyMode(false)}
        />
      )}
    </div>
  );
}
