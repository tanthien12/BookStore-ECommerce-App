import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../helpers/productHelper";
import { FiTrash2 } from "react-icons/fi";

export default function CartPage() {
    const navigate = useNavigate();

    const {
        cart,
        cartCount,
        updateQty,
        removeFromCart,
        clearCart,

        selectedProductIds,
        toggleSelect,
        selectAll,
        getSelectedItems,
    } = useCart();

    const isAllSelected =
        cart.length > 0 && selectedProductIds.length === cart.length;

    // Tính tạm tính hiển thị ở footer
    const displaySubtotal = useMemo(() => {
        // Nếu có chọn ít nhất 1 sản phẩm -> cộng tiền những sản phẩm đó
        if (selectedProductIds.length > 0) {
            const chosenItems = cart.filter((item) =>
                selectedProductIds.includes(item.productId)
            );
            return chosenItems.reduce(
                (acc, it) => acc + it.price * it.qty,
                0
            );
        }

        // Nếu chưa chọn gì -> dùng tổng giỏ hàng như cũ
        return 0;
    }, [cart, selectedProductIds]);

    // Khi click "Thanh toán": chỉ gửi sản phẩm đã tick
    const handleCheckout = () => {
        let itemsToCheckout = getSelectedItems();
        if (!itemsToCheckout.length) {
            itemsToCheckout = cart;
        }
        sessionStorage.setItem(
            "checkout_items",
            JSON.stringify(itemsToCheckout)
        );
        navigate("/checkout");
    };

    if (!cart.length) {
        return (
            <div className="mx-auto max-w-5xl px-3 md:px-4 py-6">
                <h1 className="text-xl font-bold mb-4">
                    GIỎ HÀNG{" "}
                    <span className="text-gray-500 text-sm">
                        (0 sản phẩm)
                    </span>
                </h1>

                <div className="rounded-xl border border-gray-300 bg-white p-10 flex flex-col items-center justify-center">
                    <img
                        src="https://static.thenounproject.com/png/1282247-200.png"
                        alt="empty"
                        className="w-28 h-28 opacity-70"
                    />
                    <p className="mt-4 text-gray-600">
                        Chưa có sản phẩm trong giỏ hàng của bạn.
                    </p>
                    <Link
                        to="/"
                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
                    >
                        MUA SẮM NGAY
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-3 md:px-4 py-6">
            {/* Title */}
            <h1 className="text-xl font-bold mb-4 text-gray-900">
                GIỎ HÀNG{" "}
                <span className="text-gray-600 text-sm font-normal">
                    ({cartCount} sản phẩm)
                </span>
            </h1>

            {/* Wrapper */}
            <div className="rounded-xl border border-gray-300 bg-white overflow-hidden">
                {/* Header row */}
                <div className="flex flex-wrap items-center bg-gray-100 border-b border-gray-300 px-4 py-3 text-sm font-medium text-gray-800">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={isAllSelected}
                            onChange={selectAll}
                        />
                        <span className="truncate">
                            Chọn tất cả ({cart.length} sản phẩm)
                        </span>
                    </div>

                    <div className="w-[220px] flex items-center justify-between text-gray-800">
                        <span className="text-center flex-1">Số lượng</span>
                        <span className="text-right flex-1">Thành tiền</span>
                    </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200 bg-white">
                    {cart.map((item) => {
                        const isChecked = selectedProductIds.includes(
                            item.productId
                        );
                        const lineTotal = item.price * item.qty;

                        return (
                            <div
                                key={item.productId}
                                className="px-4 py-4 flex flex-col gap-4 md:flex-row md:items-start md:gap-4"
                            >
                                {/* LEFT: checkbox + image + info */}
                                <div className="flex flex-1 min-w-0 gap-3">
                                    <div className="flex-shrink-0 pt-1">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5"
                                            checked={isChecked}
                                            onChange={() =>
                                                toggleSelect(item.productId)
                                            }
                                        />
                                    </div>

                                    <div className="flex-shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-[90px] h-[110px] object-contain border border-gray-300 rounded"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 text-sm text-gray-800">
                                        <div className="font-medium text-gray-900 leading-snug">
                                            {item.title}
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-baseline gap-2">
                                            <div className="text-red-600 font-semibold text-base">
                                                {money(item.price)}
                                            </div>

                                            {item.oldPrice ? (
                                                <div className="text-gray-400 line-through text-sm">
                                                    {money(item.oldPrice)}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: quantity [- 1 +] | total price | trash */}
                                <div className="w-full md:w-[220px] flex items-start md:items-center md:justify-between gap-4 text-sm">
                                    {/* cụm [- qty +] */}
                                    <QuantityInline
                                        value={item.qty}
                                        onDecrease={() =>
                                            updateQty(
                                                item.productId,
                                                item.qty - 1
                                            )
                                        }
                                        onIncrease={() =>
                                            updateQty(
                                                item.productId,
                                                item.qty + 1
                                            )
                                        }
                                        onManual={(val) =>
                                            updateQty(
                                                item.productId,
                                                Number(val)
                                            )
                                        }
                                    />

                                    {/* giá tổng (màu đỏ) */}
                                    <div className="text-red-600 font-semibold text-base min-w-[80px] text-right">
                                        {money(lineTotal)}
                                    </div>

                                    {/* nút xóa */}
                                    <button
                                        onClick={() =>
                                            removeFromCart(item.productId)
                                        }
                                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                                        title="Xóa sản phẩm"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4 border-t border-gray-300 bg-gray-50 text-sm">
                    <button
                        onClick={clearCart}
                        className="text-gray-700 hover:underline text-sm w-fit"
                    >
                        Xóa toàn bộ
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 w-full md:w-auto text-right md:text-left">
                        <div className="text-base text-gray-700">
                            Tạm tính:{" "}
                            <span className="text-red-600 font-bold text-lg">
                                {money(displaySubtotal)}
                            </span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2 text-white text-base font-semibold hover:bg-red-700"
                        >
                            Thanh toán
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * cụm [- qty +] inline
 */
function QuantityInline({ value, onDecrease, onIncrease, onManual }) {
    const handleInputChange = (e) => {
        const raw = e.target.value;
        if (!raw) return onManual(1);
        const parsed = parseInt(raw, 10);
        if (Number.isNaN(parsed) || parsed < 1) {
            onManual(1);
        } else {
            onManual(parsed);
        }
    };

    return (
        <div className="inline-flex items-stretch border border-gray-300 rounded text-gray-700 text-base overflow-hidden">
            <button
                type="button"
                className="px-2 py-2 leading-none select-none"
                onClick={onDecrease}
            >
                −
            </button>

            <input
                className="w-8 text-center outline-none text-sm border-l border-r border-gray-300 py-2"
                value={value}
                onChange={handleInputChange}
            />

            <button
                type="button"
                className="px-2 py-2 leading-none select-none"
                onClick={onIncrease}
            >
                +
            </button>
        </div>
    );
}
