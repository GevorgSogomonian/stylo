import React, { useState } from 'react';

export const ChatCon = React.createContext({
    activeChat:0,
    updated: false,
    chatId: 0,
    id: 0,// Установить значение по умолчанию, соответствующее типу string
   // Указываем, что функция принимает аргумент
    setUpdateValue: (updated) => {},    // Указываем, что функция принимает аргумент
    setChatIdValue: (chatId) => {},    // Указываем, что функция принимает аргумент
    setIdUpdatedValue: (id) => {},    // Указываем, что функция принимает аргумент
});

const ChatContext = (props) => {
    // Состояния для разных переменных
    const [activeChat, setActiveChat] = useState(0)
    const [updated, setUpdated] = useState(false); // ID
    const [chatId, setChatId] = useState(0); // Задать начальное значение как строку
    const [idUpdated, setIdUpdated] = useState(0); // Задать начальное значение как строку

    // Функции для обновления состояний
    const setActiveChatValue = (newest) => setActiveChat(newest)
    const setUpdateValue = (updated) => setUpdated(updated);
    const setChatIdValue = (chatId) => setChatId(chatId);
    const setIdUpdatedValue = (idUpdated) => setIdUpdated(idUpdated);

    // Объект, который содержит все данные и функции для их обновления
    const info = {
        activeChat,
        setActiveChatValue,
        updated,
        setUpdateValue,
        chatId,
        setChatIdValue,
        idUpdated,
        setIdUpdatedValue
    };

    return (
        <ChatCon.Provider value={info}>
            {props.children}
        </ChatCon.Provider>
    );
};

export default ChatContext;
