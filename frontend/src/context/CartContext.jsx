import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

function readCartFromStorage() {
    try {
        const raw = localStorage.getItem("cart_items");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeCartToStorage(cart) {
    localStorage.setItem("cart_items", JSON.stringify(cart));
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => readCartFromStorage());

    // các item đang được tick chọn trong giỏ để xóa hàng loạt / thanh toán chọn
    // lưu theo productId
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    // sync localStorage mỗi khi cart đổi
    useEffect(() => {
        writeCartToStorage(cart);
        // nếu sản phẩm bị xóa khỏi giỏ thì bỏ luôn khỏi selected
        setSelectedProductIds((prev) =>
            prev.filter((id) => cart.some((item) => item.productId === id))
        );
    }, [cart]);

    // tổng tiền tạm tính của toàn bộ giỏ
    const subtotal = cart.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
    );

    // tổng số lượng trong giỏ (để show badge ở Header)
    const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

    // thêm vào giỏ
    const addToCart = (product, quantity = 1) => {
        setCart((prev) => {
            const existing = prev.find(
                (p) =>
                    p.productId === product.id ||
                    p.productId === product.productId
            );

            if (existing) {
                return prev.map((p) =>
                    p.productId === existing.productId
                        ? { ...p, qty: p.qty + quantity }
                        : p
                );
            }

            return [
                ...prev,
                {
                    productId: product.id ?? product.productId,
                    title: product.title,
                    price: product.price,
                    oldPrice: product.oldPrice || null,
                    image: Array.isArray(product.images)
                        ? product.images[0]
                        : product.image || product.img || "",
                    qty: quantity,
                },
            ];
        });

        return true; // báo cho UI biết là thêm thành công
    };

    // cập nhật số lượng
    const updateQty = (productId, newQty) => {
        const safeQty = newQty < 1 ? 1 : newQty;
        setCart((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, qty: safeQty }
                    : item
            )
        );
    };

    // xóa 1 item
    const removeFromCart = (productId) => {
        setCart((prev) =>
            prev.filter((item) => item.productId !== productId)
        );
    };

    // xóa toàn bộ giỏ
    const clearCart = () => {
        setCart([]);
        setSelectedProductIds([]);
    };

    // --- phần chọn tick ---
    // toggle chọn 1 sản phẩm
    const toggleSelect = (productId) => {
        setSelectedProductIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    // chọn tất cả hoặc bỏ chọn tất cả
    const selectAll = () => {
        if (selectedProductIds.length === cart.length) {
            // đang chọn hết -> bỏ chọn hết
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(cart.map((item) => item.productId));
        }
    };

    // xóa tất cả sản phẩm đã chọn
    const removeSelected = () => {
        setCart((prev) =>
            prev.filter(
                (item) => !selectedProductIds.includes(item.productId)
            )
        );
        setSelectedProductIds([]);
    };

    // bỏ chọn hết
    const clearSelected = () => {
        setSelectedProductIds([]);
    };

    // lấy danh sách item đã tick (dùng cho checkout và tính tạm tính theo tick)
    const getSelectedItems = () => {
        return cart.filter((item) =>
            selectedProductIds.includes(item.productId)
        );
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                cartCount,
                subtotal,

                addToCart,
                updateQty,
                removeFromCart,
                clearCart,

                selectedProductIds,
                toggleSelect,
                selectAll,
                removeSelected,
                clearSelected,

                getSelectedItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
