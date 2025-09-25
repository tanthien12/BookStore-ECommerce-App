import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import App from '../App.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import AuthRecover from '../pages/AuthRecover.jsx';
import AdminLayout from '../pages/admin/AdminLayout.jsx';
import AllProducts from '../pages/admin/AllProducts.jsx';
import CategoryList from '../pages/admin/CategoryList.jsx';
import OrderList from '../pages/admin/OrderList.jsx';
// import AddProduct from '../components/admin/AddProduct.jsx';
import EditProduct from '../pages/admin/EditProduct.jsx';
import AddProduct from '../pages/admin/AddProduct.jsx';
import AddCategory from '../pages/admin/AddCategory.jsx';
import EditCategory from '../pages/admin/EditCategory.jsx';
import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            // {
            //     path: "forgot-password",
            //     element: <ForgotPassword />
            // },
            {
                path: "forgot-password",
                element: <AuthRecover />
            },           // email form
            {
                path: "reset-password",
                element: <AuthRecover />
            },

            // ========== Admin Routes ==========
            {
                path: "admin",
                element: <AdminLayout />,
                children: [
                    { index: true, element: <DashboardAdmin /> }, // /admin
                    { path: "products", element: <AllProducts /> }, // /admin/products
                    { path: "products-add", element: <AddProduct /> }, // /admin/products-add
                    { path: "products-edit/:id", element: <EditProduct /> }, // /admin/products-edit/:id

                    { path: "categories", element: <CategoryList /> }, // /admin/categories
                    { path: "categories-add", element: <AddCategory /> }, // /admin/categories-add
                    { path: "categories-edit/:id", element: <EditCategory /> }, // /admin/categories-edit/:id

                    { path: "orders", element: <OrderList /> }, // /admin/orders

                    // { path: "users", element: <UserList /> }, // /admin/users
                ],
            },
        ]
    }
])

export default router;
