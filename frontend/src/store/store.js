import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
});

// optional: typed hooks hoặc selectors nếu bạn muốn
export const selectCurrentUser = (state) => state.user.data;
