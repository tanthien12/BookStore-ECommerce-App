import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import App from '../App.jsx';
import Home from '../components/Home.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';
import CategoryPage from "../pages/CategoryPage";
import CartPage from '../pages/CartPage.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: '/product/:id',   
                element: <ProductDetail />
            },
            {
                path: '/category/:categoryId/:subSlug?',
                element: <CategoryPage/>
            },
            {
                path: '/cart',
                element: <CartPage/>
            }
        ]
    }
])

export default router;
