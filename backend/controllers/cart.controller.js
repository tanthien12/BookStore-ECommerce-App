// controllers/cart.controller.js
const CartService = require("../services/cart.service");

async function list(req, res) {
  if (!req.user || !req.user.id) {
    return res.json({ items: [], total: 0 });
  }

  const userId = req.user.id; // 👈 lấy từ middleware
  const cart = await CartService.getCart(userId);

  return res.json(cart);
}

async function add(req, res) {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Bạn phải đăng nhập", success: false });
  }

  const userId = req.user.id;
  const { book_id, quantity } = req.body;

  const cart = await CartService.addToCart(userId, book_id, quantity);
  return res.status(201).json(cart);
}

async function update(req, res) {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Bạn phải đăng nhập", success: false });
  }
  const userId = req.user.id;
  const itemId = req.params.id;
  const { quantity } = req.body;

  const cart = await CartService.updateItem(userId, itemId, quantity);
  return res.json(cart);
}

async function remove(req, res) {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Bạn phải đăng nhập", success: false });
  }
  const userId = req.user.id;
  const itemId = req.params.id;

  const cart = await CartService.removeItem(userId, itemId);
  return res.json(cart);
}

async function clear(req, res) {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Bạn phải đăng nhập", success: false });
  }
  const userId = req.user.id;

  await CartService.clearCart(userId);
  return res.json({ success: true });
}

module.exports = {
  list,
  add,
  update,
  remove,
  clear,
};
