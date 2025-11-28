import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdDelete,
  MdSearch,
  MdMenu,
  MdComment,
  MdOpenInNew
} from "react-icons/md";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/vi";
import summaryApi, { authHeaders } from "../../common";

// Key lưu cấu hình cột vào localStorage (để F5 không bị mất)
const COL_KEY = "admin.comments.table.columns";

export default function AdminCommentList() {
  moment.locale("vi");

  // --- 1. STATE & CONFIG ---
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- 2. COLUMN CHOOSER (Ẩn/Hiện cột) ---
  const [showCols, setShowCols] = useState(() => {
    const saved = localStorage.getItem(COL_KEY);
    return saved
      ? JSON.parse(saved)
      : { user: true, content: true, post: true, date: true };
  });
  useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

  const [openColMenu, setOpenColMenu] = useState(false);
  const colBtnRef = useRef(null);
  const colMenuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (openColMenu && colMenuRef.current && !colMenuRef.current.contains(e.target) && !colBtnRef.current.contains(e.target)) {
        setOpenColMenu(false);
      }
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [openColMenu]);

  // --- 3. SELECTION (Chọn hàng loạt) ---
  const [selectedIds, setSelectedIds] = useState(new Set());
  const headerCbRef = useRef(null);

  // Reset khi data đổi
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items, page, query]);

  // Xử lý checkbox header (Indeterminate)
  useEffect(() => {
    const idsOnPage = items.map((x) => x.id);
    const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
    if (headerCbRef.current) {
      headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
      headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
    }
  }, [items, selectedIds]);

  // --- 4. API CALL ---
  const loadComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`${summaryApi.url(summaryApi.postComments.adminList)}?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();

      if (json.success) {
        setItems(json.items || []); // Backend trả về items
        setTotal(json.total || 0);  // Backend trả về total
      } else {
        toast.error(json.message || "Lỗi tải dữ liệu");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadComments();
  };

  // --- 5. ACTIONS ---
  const toggleSelectAllOnPage = (e) => {
    const checked = e.target.checked;
    const idsOnPage = items.map((x) => x.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) idsOnPage.forEach((id) => next.add(id));
      else idsOnPage.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa bình luận này?")) return;
    try {
      const res = await fetch(summaryApi.url(summaryApi.postComments.delete(id)), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã xóa bình luận");
        loadComments();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Lỗi xóa bình luận");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return toast.info("Chưa chọn bình luận nào.");
    if (!confirm(`Xóa ${ids.length} bình luận đã chọn?`)) return;

    try {
      let ok = 0;
      // Loop delete (vì API hiện tại xóa từng cái)
      for (const id of ids) {
        const res = await fetch(summaryApi.url(summaryApi.postComments.delete(id)), {
          method: "DELETE",
          headers: authHeaders(),
        });
        const json = await res.json();
        if (json.success) ok++;
      }
      toast.success(`Đã xóa ${ok}/${ids.length} bình luận`);
      loadComments();
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi khi xóa hàng loạt");
    }
  };

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + items.length);
  
  // Colspan cho dòng loading/empty
  const columnCount = 1 + (showCols.user ? 1 : 0) + (showCols.content ? 1 : 0) + (showCols.post ? 1 : 0) + (showCols.date ? 1 : 0) + 1;

  return (
    <div className="space-y-5">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <MdComment /> Quản lý Bình luận
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors shadow-sm"
            disabled={selectedIds.size === 0}
            title="Xóa các mục đã chọn"
          >
            <MdDelete /> Xóa đã chọn ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MdSearch />
          </span>
          <input
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if(e.target.value === "") { // Tự load lại khi xóa text
                    setPage(1);
                    setTimeout(loadComments, 0); 
                }
            }}
            placeholder="Tìm theo nội dung, người dùng..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button hidden type="submit">Search</button>
        </form>

        <div className="flex items-center gap-2">
          {/* Column Button */}
          <div className="relative">
            <button
              ref={colBtnRef}
              onClick={() => setOpenColMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              title="Chọn cột hiển thị"
            >
              <MdMenu /> Cột
            </button>
            
            {/* Dropdown Menu */}
            {openColMenu && (
              <div
                ref={colMenuRef}
                className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl p-3 z-10 animate-fade-in-down"
              >
                <div className="font-medium mb-2 text-sm text-gray-700">Hiển thị cột</div>
                <div className="space-y-2">
                  {[
                    { key: "user", label: "Người dùng" },
                    { key: "content", label: "Nội dung" },
                    { key: "post", label: "Bài viết" },
                    { key: "date", label: "Ngày tạo" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="accent-blue-600 w-4 h-4 rounded border-gray-300"
                        checked={!!showCols[key]}
                        onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="w-12 p-0 text-center">
                  <div className="h-12 flex items-center justify-center">
                    <input
                      ref={headerCbRef}
                      type="checkbox"
                      className="accent-blue-600 w-4 h-4 rounded border-gray-300 cursor-pointer"
                      onChange={toggleSelectAllOnPage}
                    />
                  </div>
                </th>
                {showCols.user && <th className="p-3 text-left">Người dùng</th>}
                {showCols.content && <th className="p-3 text-left">Nội dung</th>}
                {showCols.post && <th className="p-3 text-left">Bài viết</th>}
                {showCols.date && <th className="p-3 text-left">Ngày tạo</th>}
                <th className="w-20 p-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="p-10 text-center text-gray-500 flex-col">
                    <MdComment className="w-10 h-10 mx-auto mb-2 text-gray-300"/>
                    Chưa có bình luận nào.
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const checked = selectedIds.has(c.id);
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${checked ? 'bg-blue-50' : ''}`}>
                      <td className="p-0 text-center">
                        <div className="h-16 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="accent-blue-600 w-4 h-4 rounded border-gray-300 cursor-pointer"
                            checked={checked}
                            onChange={() => toggleRow(c.id)}
                          />
                        </div>
                      </td>

                      {showCols.user && (
                        <td className="p-3">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={c.user_avatar || `https://ui-avatars.com/api/?name=${c.user_name || "User"}`} 
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                    alt=""
                                />
                                <div>
                                    <div className="font-medium text-gray-900">{c.user_name || "Khách"}</div>
                                    <div className="text-xs text-gray-500">{c.user_email}</div>
                                </div>
                            </div>
                        </td>
                      )}

                      {showCols.content && (
                        <td className="p-3 max-w-xs">
                            <p className="text-gray-700 line-clamp-2" title={c.content}>{c.content}</p>
                        </td>
                      )}

                      {showCols.post && (
                        <td className="p-3 max-w-xs">
                            <Link 
                                to={`/blog/${c.post_slug}`} 
                                target="_blank" 
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium truncate"
                            >
                                {c.post_title} <MdOpenInNew className="text-xs"/>
                            </Link>
                        </td>
                      )}

                      {showCols.date && (
                        <td className="p-3 text-gray-500 whitespace-nowrap">
                            {moment(c.created_at).format("DD/MM/YYYY HH:mm")}
                        </td>
                      )}

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Xóa bình luận này"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between bg-gray-50">
          <div>
            {total > 0 ? (
              <>Hiển thị <b>{pageStart}</b>–<b>{pageEnd}</b> trên tổng <b>{total}</b></>
            ) : (
              <>Không có dữ liệu</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium min-w-[32px] text-center shadow-sm">
                {page}
            </span>
            <button
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}