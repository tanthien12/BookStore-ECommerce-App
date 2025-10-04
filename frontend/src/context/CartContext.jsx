// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
    readCart, writeCart,
    addItem, updateItemQty, removeItem, clearCart as clearAll,
    countItems, subtotalOf
} from "../helpers/cartHelper";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => readCart());

    useEffect(() => { writeCart(cart); }, [cart]);

    // Các action dùng helper 
    const addToCart = useCallback((product, qty = 1) => {
        setCart((prev) => addItem(prev, product, qty));
    }, []);

    const updateQty = useCallback((productId, qty) => {
        setCart((prev) => updateItemQty(prev, productId, qty));
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart((prev) => removeItem(prev, productId));
    }, []);

    const clearCart = useCallback(() => setCart(clearAll()), []);

    const count = useMemo(() => countItems(cart), [cart]);
    const subtotal = useMemo(() => subtotalOf(cart), [cart]);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, count, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}