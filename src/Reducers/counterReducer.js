import { createSlice } from '@reduxjs/toolkit';

const exampleSlice = createSlice({
    name: 'example',
    initialState: {
        value: 0,
    },
    reducers: {
        increment: (state) => {
            state.value =0;
        },
        twocrement: (state) => {
            state.value = 1;
        },
        threecrement: (state, action) => {
            state.value = 2;
        },
        fourcrement: (state, action) => {
            state.value = 3;
        },
        nullcrement: (state, action) => {
            state.value = null;
        },
    },
});

export const { increment,  twocrement,threecrement, fourcrement,nullcrement} = exampleSlice.actions; // Экспортируем действия
export default exampleSlice.reducer; // Экспортируем редьюсер
