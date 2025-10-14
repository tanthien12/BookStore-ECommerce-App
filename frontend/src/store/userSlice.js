import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data: null,     // thông tin người dùng hiện tại
    status: "idle", // idle | loading | success | error
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserDetails(state, action) {
            state.data = action.payload;
            state.status = "success";
        },
        clearUser(state) {
            state.data = null;
            state.status = "idle";
        },
        setUserStatus(state, action) {
            state.status = action.payload || "idle";
        }
    }
});

export const { setUserDetails, clearUser, setUserStatus } = userSlice.actions;
export default userSlice.reducer;
