// src/pages/admin/EditFlashsale.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdDelete, MdSearch } from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi from "../../common";
import FlashsaleForm from "../../components/admin/FlashsaleForm";
import { money } from "../../helpers/productHelper"; // Import hàm money

const toVND = money; // Dùng hàm money của bạn

export default function EditFlashsale() {
    const { id } = useParams();
    const nav = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [items, setItems] = useState([]); // Sản phẩm trong sale
    const [loadingCampaign, setLoadingCampaign] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    
    // State cho Form Thêm Sản Phẩm
    const [bookSearch, setBookSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [salePrice, setSalePrice] = useState("");
    const [saleQuantity, setSaleQuantity] = useState("");

    // Tải chi tiết chiến dịch (gồm campaign + items)
    const fetchCampaignDetails = useCallback(async () => {
        try {
            setLoadingCampaign(true);
            const url = summaryApi.url(summaryApi.flashsale.detail(id)); // GET /api/flashsales/:id
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const data = await res.json();
            
            if (data.success) {
                setCampaign(data.data);
                setItems(Array.isArray(data.data.items) ? data.data.items : []);
            }
        } catch (e) {
            toast.error(e.message || "Không tải được chi tiết chiến dịch");
            nav("/admin/flashsales");
        } finally {
            setLoadingCampaign(false);
        }
    }, [id, nav]);

    useEffect(() => {
        fetchCampaignDetails();
    }, [fetchCampaignDetails]);

    // Xử lý cập nhật thông tin chiến dịch
    const handleUpdate = async (payload) => {
        try {
            setLoadingCampaign(true);
            const res = await fetch(summaryApi.url(summaryApi.flashsale.update(id)), { // PUT /api/flashsales/:id
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Cập nhật thất bại");
            toast.success("Đã cập nhật chiến dịch");
            fetchCampaignDetails(); // Tải lại
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoadingCampaign(false);
        }
    };

    // Xử lý tìm kiếm sách để thêm
    const handleBookSearch = async () => {
        if (!bookSearch.trim()) return;
        try {
            const url = new URL(summaryApi.url(summaryApi.book.list));
            url.searchParams.set("q", bookSearch);
            url.searchParams.set("limit", 5); // Chỉ lấy 5 kết quả
            const res = await fetch(url);
            const data = await res.json();
            setSearchResults(data.items || []);
        } catch (e) {
            toast.error("Tìm sách thất bại");
        }
    };
    
    // Xử lý thêm sản phẩm vào sale
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!selectedBook || !salePrice || !saleQuantity) {
            toast.error("Vui lòng chọn sách, nhập giá và số lượng sale");
            return;
        }
        
        const payload = {
            flashsale_id: id,
            book_id: selectedBook.id,
            sale_price: Number(salePrice),
            sale_quantity: Number(saleQuantity),
        };
        
        if (payload.sale_price >= selectedBook.price) {
            toast.error("Giá sale phải nhỏ hơn giá gốc");
            return;
        }

        try {
            setLoadingItems(true);
            const res = await fetch(summaryApi.url(summaryApi.flashsale.addItem), { // POST /api/flashsales/items
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Thêm sản phẩm thất bại");
            
            toast.success(`Đã thêm/cập nhật ${selectedBook.title}`);
            fetchCampaignDetails(); // Tải lại
            
            // Reset form
            setSelectedBook(null);
            setBookSearch("");
            setSearchResults([]);
            setSalePrice("");
            setSaleQuantity("");
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoadingItems(false);
        }
    };
    
    // Xử lý xóa sản phẩm khỏi sale
    const handleRemoveItem = async (itemId, bookTitle) => {
        if (!confirm(`Xóa "${bookTitle}" khỏi chiến dịch này?`)) return;
        
        try {
            setLoadingItems(true);
            const res = await fetch(summaryApi.url(summaryApi.flashsale.removeItem(itemId)), { // DELETE /api/flashsales/items/:id
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Xóa thất bại");
            
            toast.success(`Đã xóa ${bookTitle}`);
            fetchCampaignDetails(); // Tải lại
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoadingItems(false);
        }
    };

    if (loadingCampaign || !campaign) {
        return <div className="p-6">Đang tải chi tiết chiến dịch...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Chỉnh sửa Flash Sale: {campaign.name}</h1>
            
            {/* Form chỉnh sửa thông tin */}
            <FlashsaleForm
                mode="edit"
                initialData={campaign}
                onSubmit={handleUpdate}
                loading={loadingCampaign}
            />

            {/* Quản lý sản phẩm */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <h3 className="text-base font-semibold p-4 border-b">Quản lý sản phẩm</h3>
                
                {/* Form thêm sản phẩm */}
                <form onSubmit={handleAddItem} className="p-4 border-b space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Cột 1: Tìm kiếm */}
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">1. Tìm sách</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="text"
                                    value={bookSearch}
                                    onChange={(e) => setBookSearch(e.target.value)}
                                    placeholder="Tìm theo tên sách..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                                <button type="button" onClick={handleBookSearch} className="rounded-lg bg-gray-200 px-3 py-2">
                                    <MdSearch />
                                </button>
                            </div>
                            {/* Kết quả tìm kiếm */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 border rounded-lg max-h-40 overflow-auto">
                                    {searchResults.map(book => (
                                        <button
                                            type="button"
                                            key={book.id}
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setBookSearch(book.title);
                                                setSearchResults([]);
                                            }}
                                            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                                        >
                                            {book.title} ({toVND(book.price)})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Cột 2 & 3: Nhập giá/số lượng */}
                        {selectedBook && (
                            <>
                                <div className="md:col-span-1">
                                    <label className="text-sm font-medium">2. Giá Sale* (Giá gốc: {toVND(selectedBook.price)})</label>
                                    <input
                                        type="number"
                                        value={salePrice}
                                        onChange={(e) => setSalePrice(e.target.value)}
                                        placeholder="Giá bán khuyến mãi"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-sm font-medium">3. Số lượng bán*</label>
                                    <input
                                        type="number"
                                        value={saleQuantity}
                                        onChange={(e) => setSaleQuantity(e.target.value)}
                                        placeholder="Số lượng cho phép bán"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {selectedBook && (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loadingItems}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                <MdAdd /> {items.find(it => it.book_id === selectedBook.id) ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                            </button>
                        </div>
                    )}
                </form>
                
                {/* Bảng sản phẩm đã có */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Sản phẩm</th>
                                <th className="p-3 text-left">Giá gốc</th>
                                <th className="p-3 text-left">Giá Sale</th>
                                <th className="p-3 text-left">SL Sale</th>
                                <th className="p-3 text-left">Đã bán</th>
                                <th className="w-20 p-3 text-right">Xóa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loadingItems ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có sản phẩm nào trong chiến dịch.</td></tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{item.title}</td>
                                        <td className="p-3">{toVND(item.original_price)}</td>
                                        <td className="p-3 font-semibold text-red-600">{toVND(item.sale_price)}</td>
                                        <td className="p-3">{item.sale_quantity}</td>
                                        <td className="p-3">{item.sold_quantity}</td>
                                        <td className="p-3 align-middle text-right">
                                            <button
                                                onClick={() => handleRemoveItem(item.id, item.title)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-red-600"
                                                title="Xóa"
                                            >
                                                <MdDelete />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}