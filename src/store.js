import { configureStore } from '@reduxjs/toolkit';

import counterReducer from "./Reducers/counterReducer";
import menuReducer from "./Reducers/menuReducer";
import deleteReducer from "./Reducers/deleteReducer"; // Импорт редьюсера

const store = configureStore({
    reducer: {
        example: counterReducer,
        menu_red: menuReducer,
        delete_mes: deleteReducer// Добавьте ваш редьюсер сюда
    },
});

export default store;
