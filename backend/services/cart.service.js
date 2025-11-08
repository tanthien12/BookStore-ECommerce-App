// services/cart.service.js
const CartModel = require("../models/cart.model");

function sumTotal(items) {
  return items.reduce((sum, it) => sum + Number(it.price_snapshot) * Number(it.quantity), 0);
}

async function getCart(userId) {
  const cart = await CartModel.getOrCreateActiveCart(userId);
  const items = await CartModel.listItemsOfUser(userId);
  const total = sumTotal(items);

  return {
    success: true,
    cart_id: cart.id,
    items,
    total,
  };
}

async function addToCart(userId, bookId, quantity = 1) {
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
    return { success: false, message: "Số lượng không hợp lệ" };
  }

  const cart = await CartModel.getOrCreateActiveCart(userId);
  // để priceSnapshot = null để Model tự chốt giá hiệu lực (sale_price ?? price)
  const item = await CartModel.upsertCartItem(cart.id, bookId, Number(quantity), null);

  const items = await CartModel.listItemsOfUser(userId);
  const total = sumTotal(items);

  return {
    success: true,
    message: "Đã thêm sản phẩm vào giỏ hàng",
    data: {
      cart_id: cart.id,
      added_item: item,
      total,
    },
  };
}

async function updateItem(userId, itemId, quantity) {
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
    return { success: false, message: "Số lượng không hợp lệ" };
  }

  const items = await CartModel.listItemsOfUser(userId);
  const item = items.find((i) => i.cart_item_id === itemId);
  if (!item) {
    return { success: false, message: "Sản phẩm không tồn tại trong giỏ" };
  }

  const updated = await CartModel.updateCartItemQuantity(itemId, Number(quantity));
  const updatedItems = await CartModel.listItemsOfUser(userId);
  const total = sumTotal(updatedItems);

  return {
    success: true,
    message: "Đã cập nhật số lượng sản phẩm",
    data: {
      updated,
      total,
    },
  };
}

async function removeItem(userId, itemId) {
  const items = await CartModel.listItemsOfUser(userId);
  const item = items.find((i) => i.cart_item_id === itemId);
  if (!item) {
    return { success: false, message: "Không tìm thấy sản phẩm để xóa" };
  }

  await CartModel.deleteCartItem(itemId);

  const updatedItems = await CartModel.listItemsOfUser(userId);
  const total = sumTotal(updatedItems);

  return {
    success: true,
    message: "Đã xóa sản phẩm khỏi giỏ",
    data: { total },
  };
}

async function clearCart(userId) {
  await CartModel.clearCartOfUser(userId);
  return { success: true, message: "Đã xóa toàn bộ giỏ hàng" };
}

module.exports = {
  getCart,
  addToCart,
  updateItem,
  removeItem,
  clearCart,
};

//code goc
// const CartModel = require("../models/cart.model");

// async function getCart(userId) {
//   // lấy hoặc tạo cart active
//   const cart = await CartModel.getOrCreateActiveCart(userId);
//   const items = await CartModel.listItemsOfUser(userId);

//   const total = items.reduce(
//     (sum, item) => sum + item.price_snapshot * item.quantity,
//     0
//   );

//   return {
//     success: true,
//     cart_id: cart.id,
//     items,
//     total,
//   };
// }

// async function addToCart(userId, bookId, quantity = 1) {
//   const cart = await CartModel.getOrCreateActiveCart(userId);
//   const item = await CartModel.upsertCartItem(cart.id, bookId, quantity, null);

//   const items = await CartModel.listItemsOfUser(userId);
//   const total = items.reduce(
//     (sum, item) => sum + item.price_snapshot * item.quantity,
//     0
//   );

//   return {
//     success: true,
//     message: "Đã thêm sản phẩm vào giỏ hàng",
//     data: {
//       cart_id: cart.id,
//       added_item: item,
//       total,
//     },
//   };
// }

// async function updateItem(userId, itemId, quantity) {
//   const items = await CartModel.listItemsOfUser(userId);
//   const item = items.find((i) => i.cart_item_id === itemId);

//   if (!item) {
//     return { success: false, message: "Sản phẩm không tồn tại trong giỏ" };
//   }

//   const updated = await CartModel.updateCartItemQuantity(itemId, quantity);
//   const updatedItems = await CartModel.listItemsOfUser(userId);

//   const total = updatedItems.reduce(
//     (sum, item) => sum + item.price_snapshot * item.quantity,
//     0
//   );

//   return {
//     success: true,
//     message: "Đã cập nhật số lượng sản phẩm",
//     data: {
//       updated,
//       total,
//     },
//   };
// }

// async function removeItem(userId, itemId) {
//   const items = await CartModel.listItemsOfUser(userId);
//   const item = items.find((i) => i.cart_item_id === itemId);

//   if (!item) {
//     return { success: false, message: "Không tìm thấy sản phẩm để xóa" };
//   }

//   await CartModel.deleteCartItem(itemId);

//   const updatedItems = await CartModel.listItemsOfUser(userId);
//   const total = updatedItems.reduce(
//     (sum, item) => sum + item.price_snapshot * item.quantity,
//     0
//   );

//   return {
//     success: true,
//     message: "Đã xóa sản phẩm khỏi giỏ",
//     data: {
//       total,
//     },
//   };
// }

// async function clearCart(userId) {
//   await CartModel.clearCartOfUser(userId);
//   return {
//     success: true,
//     message: "Đã xóa toàn bộ giỏ hàng",
//   };
// }

// module.exports = {
//   getCart,
//   addToCart,
//   updateItem,
//   removeItem,
//   clearCart,
// };
