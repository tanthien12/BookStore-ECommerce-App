import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../helpers/productHelper";
import { FiTrash2 } from "react-icons/fi";

export default function CartPage() {
    const { cart, updateQty, removeFromCart, clearCart, subtotal } = useCart();

    if (!cart.length) {
        return (
            <div className="mx-auto max-w-5xl px-3 md:px-4 py-6">
                <h1 className="text-xl font-bold mb-4">GIỎ HÀNG <span className="text-gray-500 text-sm">(0 sản phẩm)</span></h1>
                <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center">
                    <img src="https://static.thenounproject.com/png/1282247-200.png" alt="empty" className="w-28 h-28 opacity-70" />
                    <p className="mt-4 text-gray-600">Chưa có sản phẩm trong giỏ hàng của bạn.</p>
                    <Link to="/" className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700">
                        MUA SẮM NGAY
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-3 md:px-4 py-6">
            <h1 className="text-xl font-bold mb-4">GIỎ HÀNG <span className="text-gray-500 text-sm">({cart.length} sản phẩm)</span></h1>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3 text-left">Sản phẩm</th>
                            <th className="p-3 w-28 text-left">Số lượng</th>
                            <th className="p-3 w-32 text-right">Đơn giá</th>
                            <th className="p-3 w-32 text-right">Thành tiền</th>
                            <th className="p-3 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                            <tr key={item.productId} className="border-t">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={item.image} alt={item.title} className="w-12 h-16 object-contain" />
                                        <div>
                                            <div className="font-medium">{item.title}</div>
                                            {item.oldPrice ? (
                                                <div className="text-xs text-gray-500 line-through">{money(item.oldPrice)}</div>
                                            ) : null}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.qty}
                                        onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                                        className="w-16 rounded border border-gray-300 px-2 py-1"
                                    />
                                </td>
                                <td className="p-3 text-right">{money(item.price)}</td>
                                <td className="p-3 text-right">{money(item.price * item.qty)}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-600 hover:text-red-700">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50">
                    <button onClick={clearCart} className="text-gray-600 hover:underline">Xóa toàn bộ</button>
                    <div className="flex items-center gap-4">
                        <div className="text-lg">
                            Tạm tính: <span className="font-bold text-red-600">{money(subtotal)}</span>
                        </div>
                        <Link to="/checkout" className="rounded-lg bg-red-600 px-5 py-2 text-white font-semibold hover:bg-red-700">
                            Thanh toán
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}