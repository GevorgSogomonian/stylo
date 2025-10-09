import { createSlice } from '@reduxjs/toolkit';

const deleteSlice = createSlice({
    name: 'example',
    initialState: {
        value: 0,
    },
    reducers: {
        delete_id: (state, action) => {
            state.value = action.payload; // Используем action.payload для установки нужного значения
            console.log("удалено сообщение"+state.value);
        },
    },
});

export const { delete_id } = deleteSlice.actions; // Экспортируем действия
export default deleteSlice.reducer; // Экспортируем редьюсер
