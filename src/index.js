import React, {StrictMode} from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import store from "./store";
import {Provider} from "react-redux";


// Находим корневой элемент в HTML
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Provider store={store}>
        <App />
    </Provider>
);
// Создаем корень и рендерим в него приложение
//const root = createRoot(container);
//root.render(<App />);
