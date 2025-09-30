import React from 'react'
import Header from './components/Header'
import { Outlet } from 'react-router-dom'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const App = () => {
  return (
    <>
      <ToastContainer />
      <Header />
      <Outlet />
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  )
}

export default App