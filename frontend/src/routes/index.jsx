import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import App from '../App.jsx';
import Home from '../components/Home.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <Home />
            }
        ]
    }
])

export default router;
