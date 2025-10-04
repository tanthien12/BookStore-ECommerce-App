import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import App from '../App.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import AuthRecover from '../pages/AuthRecover.jsx';
import AdminLayout from '../pages/admin/AdminLayout.jsx';
import ProductList from '../pages/admin/ProductList.jsx';
import CategoryList from '../pages/admin/CategoryList.jsx';
import OrderList from '../pages/admin/OrderList.jsx';
// import AddProduct from '../components/admin/AddProduct.jsx';
import EditProduct from '../pages/admin/EditProduct.jsx';
import AddProduct from '../pages/admin/AddProduct.jsx';
import AddCategory from '../pages/admin/AddCategory.jsx';
import EditCategory from '../pages/admin/EditCategory.jsx';
import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx';
import OrderDetail from '../pages/admin/OrderDetail.jsx';
import EditOrder from '../pages/admin/EditOrder.jsx';
import AddOrder from '../pages/admin/AddOrder.jsx';
import UserList from '../pages/admin/UserList.jsx';
import AddUser from '../pages/admin/AddUser.jsx';
import EditUser from '../pages/admin/EditUser.jsx';

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
                    { path: "products", element: <ProductList /> }, // /admin/products
                    { path: "products-add", element: <AddProduct /> }, // /admin/products-add
                    { path: "products-edit/:id", element: <EditProduct /> }, // /admin/products-edit/:id

                    { path: "categories", element: <CategoryList /> }, // /admin/categories
                    { path: "categories-add", element: <AddCategory /> }, // /admin/categories-add
                    { path: "categories-edit/:id", element: <EditCategory /> }, // /admin/categories-edit/:id

                    { path: "orders", element: <OrderList /> },
                    { path: "orders-add", element: <AddOrder /> },
                    { path: "orders-edit/:id", element: <EditOrder /> },
                    { path: "orders-detail/:id", element: <OrderDetail /> },

                    { path: "users", element: <UserList /> }, // /admin/users
                    { path: "users-add", element: <AddUser /> }, // /admin/users-add
                    { path: "users-edit/:id", element: <EditUser /> }, // /admin/users-edit/:id

                    // { path: "users", element: <UserList /> }, // /admin/users
                ],
            },
        ]
    }
])

export default router;
