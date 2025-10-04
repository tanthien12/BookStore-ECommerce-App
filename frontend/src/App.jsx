import React from 'react'
import Header from './components/Header'
import { Outlet } from 'react-router-dom'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CartProvider } from './context/CartContext';


const App = () => {
  return (
    <>
      <CartProvider>
        <ToastContainer />
        <Header />
        <Outlet />
        <ToastContainer position="top-right" autoClose={2000} />
      </CartProvider>

    </>
  )
}

export default App