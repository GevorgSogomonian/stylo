import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
    name: 'example',
    initialState: {
        value: false,
    },
    reducers: {
        truecrement: (state) => {
            state.value =true;
        },
        falsecrement: (state) => {
            state.value = false;
        }

    },
});

export const {  falsecrement,  truecrement} = menuSlice.actions; // Экспортируем действия
export default menuSlice.reducer; // Экспортируем редьюсер
