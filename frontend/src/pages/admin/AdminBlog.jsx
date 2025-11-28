import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdMenu,
  MdArticle,
  MdImage,
  MdFilterList
} from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";
import moment from "moment";
import "moment/locale/vi";

// Key lưu cấu hình cột
const COL_KEY = "admin.blog.table.columns";

export default function AdminBlog() {
  moment.locale("vi");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- 1. STATE & CONFIG ---
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialQuery = searchParams.get("q") || "";

  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  // Status filter state
  const [statusFilter, setStatusFilter] = useState(""); 
  const pageSize = 10;

  // --- 2. FILTER MENU STATE (Mới) ---
  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [filterDraft, setFilterDraft] = useState({ status: "" });

  // Sync filter draft khi mở menu
  useEffect(() => {
    if (openFilter) setFilterDraft({ status: statusFilter });
  }, [openFilter, statusFilter]);

  // Đóng filter khi click ra ngoài
  useEffect(() => {
    if (!openFilter) return;
    const onClickOutside = (e) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setOpenFilter(false);
      }
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [openFilter]);

  const applyFilters = (e) => {
    e.preventDefault();
    setStatusFilter(filterDraft.status || "");
    setPage(1);
    setOpenFilter(false);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setFilterDraft({ status: "" });
    setPage(1);
    setOpenFilter(false);
  };

  const activeFilterCount = useMemo(() => (statusFilter ? 1 : 0), [statusFilter]);

  // --- 3. COLUMN CHOOSER ---
  const [showCols, setShowCols] = useState(() => {
    const saved = localStorage.getItem(COL_KEY);
    return saved
      ? JSON.parse(saved)
      : { image: true, title: true, category: true, status: true, date: true };
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

  // --- 4. SELECTION ---
  const [selectedIds, setSelectedIds] = useState(new Set());
  const headerCbRef = useRef(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [posts]);

  useEffect(() => {
    const idsOnPage = posts.map((p) => p.id);
    const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
    if (headerCbRef.current) {
      headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
      headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
    }
  }, [posts, selectedIds]);

  // --- 5. API CALL ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(summaryApi.url(summaryApi.posts.list));
      url.searchParams.set("page", page);
      url.searchParams.set("limit", pageSize);
      if (query) url.searchParams.set("q", query);
      // Gửi thêm status filter nếu có (Backend cần hỗ trợ params 'status')
      if (statusFilter) url.searchParams.set("status", statusFilter);

      setSearchParams({ page, q: query });

      const res = await fetch(url.toString(), { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setPosts(json.items || []);
        setTotal(json.total || 0);
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]); // Reload khi đổi trang hoặc đổi filter

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  // --- 6. ACTIONS ---
  const toggleSelectAllOnPage = (e) => {
    const checked = e.target.checked;
    const idsOnPage = posts.map((p) => p.id);
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
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      const res = await fetch(summaryApi.url(summaryApi.posts.delete(id)), {
        method: "DELETE", headers: authHeaders()
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã xóa bài viết");
        fetchData();
      } else {
        toast.error(json.message);
      }
    } catch { toast.error("Lỗi xóa bài viết"); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return toast.info("Chưa chọn bài viết nào.");
    if (!confirm(`Xóa ${ids.length} bài viết đã chọn?`)) return;

    try {
      let ok = 0;
      for (const id of ids) {
        const res = await fetch(summaryApi.url(summaryApi.posts.delete(id)), {
          method: "DELETE", headers: authHeaders()
        });
        const json = await res.json();
        if (json.success) ok++;
      }
      toast.success(`Đã xóa ${ok}/${ids.length} bài viết`);
      fetchData();
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi khi xóa hàng loạt");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + posts.length);
  
  const columnCount = 1 + (showCols.image ? 1 : 0) + (showCols.title ? 1 : 0) + (showCols.category ? 1 : 0) + (showCols.status ? 1 : 0) + (showCols.date ? 1 : 0) + 1;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            Blog
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors shadow-sm"
            disabled={selectedIds.size === 0}
            title="Xóa các mục đã chọn"
          >
            <MdDelete /> Xóa ({selectedIds.size})
          </button>

          <Link 
            to="/admin/blog-add" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <MdAdd /> Viết bài mới
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MdSearch />
          </span>
          <input
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if(e.target.value === "") { 
                    setPage(1);
                    setTimeout(fetchData, 0); // Reload ngay khi xóa hết
                }
            }}
            placeholder="Tìm theo tiêu đề bài viết..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button hidden type="submit">Search</button>
        </form>

        <div className="flex items-center gap-2">
          {/* FILTER BUTTON */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              onClick={() => setOpenFilter((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              aria-expanded={openFilter}
            >
              <MdFilterList /> Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {openFilter && (
              <form
                ref={filterMenuRef}
                onSubmit={applyFilters}
                className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-20 space-y-3 animate-fade-in-down"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={filterDraft.status}
                    onChange={(e) => setFilterDraft((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="published">Công khai</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Xóa lọc
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenFilter(false)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* COLUMN BUTTON */}
          <div className="relative">
            <button
              ref={colBtnRef}
              onClick={() => setOpenColMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              title="Chọn cột hiển thị"
            >
              <MdMenu /> Cột
            </button>
            
            {openColMenu && (
              <div
                ref={colMenuRef}
                className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl p-3 z-10 animate-fade-in-down"
              >
                <div className="font-medium mb-2 text-sm text-gray-700">Hiển thị cột</div>
                <div className="space-y-2">
                  {[
                    { key: "image", label: "Hình ảnh" },
                    { key: "title", label: "Tiêu đề" },
                    { key: "category", label: "Danh mục" },
                    { key: "status", label: "Trạng thái" },
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

      {/* TABLE */}
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
                {showCols.image && <th className="p-3 text-left">Hình ảnh</th>}
                {showCols.title && <th className="p-3 text-left">Tiêu đề</th>}
                {showCols.category && <th className="p-3 text-left">Danh mục</th>}
                {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                {showCols.date && <th className="p-3 text-left">Ngày tạo</th>}
                <th className="w-24 p-3 text-center">Hành động</th>
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
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="p-10 text-center text-gray-500 flex-col">
                    <MdArticle className="w-10 h-10 mx-auto mb-2 text-gray-300"/>
                    Chưa có bài viết nào.
                  </td>
                </tr>
              ) : (
                posts.map((p) => {
                  const checked = selectedIds.has(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${checked ? 'bg-blue-50' : ''}`}>
                      <td className="p-0 text-center">
                        <div className="h-16 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="accent-blue-600 w-4 h-4 rounded border-gray-300 cursor-pointer"
                            checked={checked}
                            onChange={() => toggleRow(p.id)}
                          />
                        </div>
                      </td>

                      {showCols.image && (
                        <td className="p-3">
                            {p.thumbnail ? (
                                <img src={p.thumbnail} className="w-16 h-10 object-cover rounded border border-gray-200" alt="thumb"/>
                            ) : (
                                <div className="w-16 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400">
                                    <MdImage />
                                </div>
                            )}
                        </td>
                      )}

                      {showCols.title && (
                        <td className="p-3 max-w-xs">
                            <div className="font-medium line-clamp-1 text-gray-900" title={p.title}>{p.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{p.slug}</div>
                        </td>
                      )}

                      {showCols.category && (
                        <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-1 rounded-full font-medium">
                                {p.category_name || "Chưa phân loại"}
                            </span>
                        </td>
                      )}

                      {showCols.status && (
                        <td className="p-3">
                            {p.status === 'published' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Công khai
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">
                                    Nháp
                                </span>
                            )}
                        </td>
                      )}

                      {showCols.date && (
                        <td className="p-3 text-gray-500 whitespace-nowrap">
                            {moment(p.created_at).format("DD/MM/YYYY")}
                        </td>
                      )}

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Link 
                                to={`/blog/${p.slug}`} 
                                target="_blank" 
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Xem bài viết"
                            >
                                <MdVisibility/>
                            </Link>
                            <Link 
                                to={`/admin/blog-edit/${p.id}`} 
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Sửa"
                            >
                                <MdEdit/>
                            </Link>
                            <button 
                                onClick={() => handleDelete(p.id)} 
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Xóa"
                            >
                                <MdDelete/>
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
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