import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes/index.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store/store.js';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <RouterProvider router={router} />
  // </StrictMode>
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
