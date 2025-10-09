// ContextForAudio.js
import React, { useState } from 'react';
import '../MainComponents/Profile/Menu/Menu.css';

export const MyContext = React.createContext();

const ContextForAudio = (props) => {
    const [data, setData] = useState(1);

    const info = {
        data,
        setDat(d) {
            setData(d); // Устанавливаем данные
        }
    };

    console.log(data); // Для отладки

    return (
        <MyContext.Provider value={info}>
            {props.children}
        </MyContext.Provider>
    );
};

export default ContextForAudio;