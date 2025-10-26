// import React from 'react'
// import Header from './components/Header'
// import { Outlet } from 'react-router-dom'
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { CartProvider } from './context/CartContext';
// import ChatLauncher from './components/chatbot/ChatLauncher';


// const App = () => {
//   return (
//     <>
//       <CartProvider>
//         <ToastContainer />
//         <Header />
//         <ChatLauncher />
//         <Outlet />
//         <ToastContainer position="top-right" autoClose={2000} />
//       </CartProvider>

//     </>
//   )
// }

// export default App

import React from "react";
import Header from "./components/Header";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CartProvider } from "./context/CartContext";
import ChatLauncher from "./components/chatbot/ChatLauncher";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        {/* ToastContainer: chỉ để 1 nơi, cấu hình dùng chung toàn app */}
        <ToastContainer position="top-right" autoClose={2000} newestOnTop />

        <Header />
        <ChatLauncher />
        <Outlet />
      </CartProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
