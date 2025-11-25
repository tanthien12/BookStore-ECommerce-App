// src/pages/admin/FlashsaleList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdFilterList,
  MdMenu,
} from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";

// Helpers
const dateVN = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const statusBadge = (startTime, endTime, isActive) => {
  const now = new Date();
  const start = startTime ? new Date(startTime) : null;
  const end = endTime ? new Date(endTime) : null;

  if (!isActive)
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Tạm ẩn</span>;
  if (start && now < start)
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Sắp diễn ra</span>;
  if (end && now > end)
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Đã kết thúc</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đang diễn ra</span>;
};

const COL_KEY = "admin.flashsales.table.columns";

export default function FlashsaleList() {
  // Search + Filter
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '' | 'active' | 'inactive'
  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [filterDraft, setFilterDraft] = useState({ status: "" });

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
    const onEsc = (e) => e.key === "Escape" && setOpenFilter(false);
    window.addEventListener("click", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [openFilter]);

  useEffect(() => {
    if (openFilter) setFilterDraft({ status: statusFilter });
  }, [openFilter, statusFilter]);

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

  // Column chooser (đồng bộ)
  const [showCols, setShowCols] = useState(() => {
    const saved = localStorage.getItem(COL_KEY);
    return saved
      ? JSON.parse(saved)
      : { name: true, status: true, start: true, end: true };
  });
  useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

  const [openColMenu, setOpenColMenu] = useState(false);
  const colBtnRef = useRef(null);
  const colMenuRef = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        openColMenu &&
        colMenuRef.current &&
        !colMenuRef.current.contains(e.target) &&
        colBtnRef.current &&
        !colBtnRef.current.contains(e.target)
      ) {
        setOpenColMenu(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setOpenColMenu(false);
    window.addEventListener("click", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [openColMenu]);

  // Data + Pagination
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const loadFlashsales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim()); // BE có thể bỏ qua nếu chưa hỗ trợ
      if (statusFilter) params.set("status", statusFilter); // 'active'|'inactive'
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sort", "newest");

      const url = `${summaryApi.url(summaryApi.flashsale.list)}?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { ...authHeaders() },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || "Không tải được danh sách flash sale");
      }

      const list = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data)
        ? data.data
        : [];

      setItems(list);
      setTotal(
        Number(
          data.total ??
            data?.meta?.total ??
            data?.count ??
            list.length
        ) || 0
      );
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlashsales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadFlashsales();
  };

  // Selection + bulk delete (đồng bộ)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const headerCbRef = useRef(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [items, statusFilter, page, query]);

  useEffect(() => {
    const idsOnPage = items.map((x) => x.id);
    const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
    if (headerCbRef.current) {
      headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
      headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
    }
  }, [items, selectedIds]);

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
    if (!confirm("Bạn chắc chắn muốn xóa chiến dịch này?")) return;
    try {
      const res = await fetch(summaryApi.url(summaryApi.flashsale.delete(id)), {
        method: "DELETE",
        headers: { ...authHeaders() },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || "Xóa thất bại");
      toast.success("Đã xóa chiến dịch");
      const remain = items.length - 1;
      if (remain === 0 && page > 1) setPage((p) => Math.max(1, p - 1));
      else loadFlashsales();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Xóa thất bại");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.info("Chưa chọn chiến dịch nào.");
      return;
    }
    if (!confirm(`Xóa ${ids.length} chiến dịch đã chọn?`)) return;

    try {
      let ok = 0;
      for (const id of ids) {
        const res = await fetch(summaryApi.url(summaryApi.flashsale.delete(id)), {
          method: "DELETE",
          headers: { ...authHeaders() },
          credentials: "include",
        });
        if (res.ok) ok++;
      }
      toast.success(`Đã xóa ${ok}/${ids.length} chiến dịch`);
      const after = items.length - ok;
      if (after <= 0 && page > 1) setPage((p) => Math.max(1, p - 1));
      else loadFlashsales();
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi khi xóa hàng loạt");
    }
  };

  // Table calc
  const columnCount =
    1 + // checkbox
    (showCols.name ? 1 : 0) +
    (showCols.status ? 1 : 0) +
    (showCols.start ? 1 : 0) +
    (showCols.end ? 1 : 0) +
    1; // actions

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + items.length);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Quản lý Flash Sale</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50"
            disabled={selectedIds.size === 0}
            title="Xóa các chiến dịch đã chọn"
          >
            <MdDelete /> Xóa đã chọn ({selectedIds.size})
          </button>

          <Link
            to="/admin/flashsales-add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <MdAdd /> Tạo chiến dịch mới
          </Link>
        </div>
      </div>

      {/* Search + Filters + Column chooser */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MdSearch />
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên chiến dịch…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button hidden type="submit">Search</button>
        </form>

        <div className="flex items-center gap-2">
          {/* Filter popover */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              onClick={() => setOpenFilter((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              aria-expanded={openFilter}
            >
              <MdFilterList /> Filters
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
                className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Trạng thái</label>
                  <select
                    value={filterDraft.status}
                    onChange={(e) => setFilterDraft((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Đang kích hoạt</option>
                    <option value="inactive">Đã tắt</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Xóa lọc
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenFilter(false)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Column chooser */}
          <div className="relative">
            <button
              ref={colBtnRef}
              onClick={() => setOpenColMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              title="Chọn cột hiển thị"
              aria-expanded={openColMenu}
            >
              <MdMenu />
            </button>
            {openColMenu && (
              <div
                ref={colMenuRef}
                className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
              >
                <div className="font-medium mb-2">Toggle Columns</div>
                <div className="space-y-2">
                  {[
                    { key: "name", label: "Tên chiến dịch" },
                    { key: "status", label: "Trạng thái" },
                    { key: "start", label: "Bắt đầu" },
                    { key: "end", label: "Kết thúc" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="w-12 p-0">
                  <div className="h-12 flex items-center justify-center">
                    <input
                      ref={headerCbRef}
                      type="checkbox"
                      className="accent-blue-600"
                      onChange={toggleSelectAllOnPage}
                    />
                  </div>
                </th>
                {showCols.name && <th className="p-3 text-left">Tên chiến dịch</th>}
                {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                {showCols.start && <th className="p-3 text-left">Bắt đầu</th>}
                {showCols.end && <th className="p-3 text-left">Kết thúc</th>}
                <th className="w-24 p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="p-8 text-center text-gray-500">Đang tải…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="p-8 text-center text-gray-500">Chưa có chiến dịch nào.</td>
                </tr>
              ) : (
                items.map((c) => {
                  const checked = selectedIds.has(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="w-12 p-0">
                        <div className="h-16 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={checked}
                            onChange={() => toggleRow(c.id)}
                          />
                        </div>
                      </td>

                      {showCols.name && <td className="p-3 font-medium">{c.name}</td>}
                      {showCols.status && (
                        <td className="p-3">
                          {statusBadge(c.start_time, c.end_time, c.is_active)}
                        </td>
                      )}
                      {showCols.start && <td className="p-3">{dateVN(c.start_time)}</td>}
                      {showCols.end && <td className="p-3">{dateVN(c.end_time)}</td>}

                      <td className="p-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/flashsales-edit/${c.id}`}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                            title="Sửa và thêm sản phẩm"
                          >
                            <MdEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
                            title="Xóa"
                          >
                            <MdDelete />
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {total > 0 ? (
              <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
            ) : (
              <>Không có dữ liệu</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ←
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
            <button
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


//code goc
// // src/pages/admin/FlashsaleList.jsx
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// // Helper
// const dateVN = (iso) => {
//     try {
//         const d = new Date(iso);
//         return d.toLocaleString("vi-VN", {
//             day: "2-digit", month: "2-digit", year: "numeric",
//             hour: "2-digit", minute: "2-digit",
//         });
//     } catch { return "-"; }
// };

// const statusLabel = (startTime, endTime, isActive) => {
//     if (!isActive) return { text: "Tạm ẩn", color: "text-gray-500 bg-gray-100" };
//     const now = new Date();
//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     if (now < start) return { text: "Sắp diễn ra", color: "text-blue-600 bg-blue-100" };
//     if (now > end) return { text: "Đã kết thúc", color: "text-red-600 bg-red-100" };
//     return { text: "Đang diễn ra", color: "text-emerald-600 bg-emerald-100" };
// };

// export default function FlashsaleList() {
//     const [items, setItems] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(false);

//     const fetchCampaigns = async () => {
//         try {
//             setLoading(true);
//             const url = summaryApi.url(summaryApi.flashsale.list); // GET /api/flashsales
//             const res = await fetch(url);
//             if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
//             const data = await res.json();
            
//             setItems(Array.isArray(data.data) ? data.data : []);
//             setTotal(data.total || data.data?.length || 0);
//         } catch (e) {
//             toast.error(e.message || "Không tải được danh sách");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchCampaigns();
//     }, []);

//     const handleDelete = async (id) => {
//         if (!confirm("Bạn chắc chắn muốn xóa chiến dịch này? Mọi sản phẩm sale kèm theo cũng sẽ bị xóa (ON DELETE CASCADE).")) return;
//         try {
//             const res = await fetch(summaryApi.url(summaryApi.flashsale.delete(id)), {
//                 method: "DELETE",
//             });
//             if (!res.ok) throw new Error("Xóa thất bại");
//             toast.success("Đã xóa chiến dịch");
//             fetchCampaigns(); // Tải lại danh sách
//         } catch (e) {
//             toast.error(e.message);
//         }
//     };
    
//     return (
//         <div className="space-y-5">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <h1 className="text-2xl font-bold">Quản lý Flash Sale</h1>
//                 <Link
//                     to="/admin/flashsales-add"
//                     className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                 >
//                     <MdAdd /> Tạo chiến dịch mới
//                 </Link>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 <th className="p-3 text-left">Tên chiến dịch</th>
//                                 <th className="p-3 text-left">Trạng thái</th>
//                                 <th className="p-3 text-left">Bắt đầu</th>
//                                 <th className="p-3 text-left">Kết thúc</th>
//                                 <th className="w-24 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y">
//                             {loading ? (
//                                 <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải…</td></tr>
//                             ) : items.length === 0 ? (
//                                 <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có chiến dịch nào.</td></tr>
//                             ) : (
//                                 items.map((c) => {
//                                     const status = statusLabel(c.start_time, c.end_time, c.is_active);
//                                     return (
//                                         <tr key={c.id} className="hover:bg-gray-50">
//                                             <td className="p-3 font-medium">{c.name}</td>
//                                             <td className="p-3">
//                                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
//                                                     {status.text}
//                                                 </span>
//                                             </td>
//                                             <td className="p-3">{dateVN(c.start_time)}</td>
//                                             <td className="p-3">{dateVN(c.end_time)}</td>
//                                             <td className="p-3 align-middle">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     <Link
//                                                         to={`/admin/flashsales-edit/${c.id}`}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                         title="Sửa và thêm sản phẩm"
//                                                     >
//                                                         <MdEdit />
//                                                     </Link>
//                                                     <button
//                                                         onClick={() => handleDelete(c.id)}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
//                                                         title="Xóa"
//                                                     >
//                                                         <MdDelete />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }