import React, {useContext, useEffect, useRef, useState} from 'react';
import './Chats.css'
import {Theme} from "../../../HelperModuls/ThemeContext";
import ImageMerger from "./Images/ImageMerger";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {ChatCon} from "../../../HelperModuls/ChatContext";
import $api from "../../../http/middleware";
import { useSelector} from "react-redux";


const Chats = () => {
    const [chats, setChats] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('jwtToken');
    const {color} = useContext(Theme);
    const {activeChat,setActiveChatValue, chatId, setChatIdValue } = useContext(ChatCon)
   // const {createNewChat,setIsCreateChat} =useContext(ThemeMenu)
    const createNewChat = useSelector((state) => state.example.value);
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);
    const responseForChats = async () => {
        setIsLoading(true)
        const response = await $api.get(`/apiChats/getChats`, {
            method: 'GET',
            headers: {// Добавляем токен в заголовок
                'Content-Type': 'application/json',
            },
        })
        const data = await response.data
        setChats(data);
        setIsLoading(false)

    }
    // Деструктурируем setDat

    const handleClick = (id) => {
        setChatIdValue(id);
        console.log(chatId + " chats")
        setActiveChatValue(id);

        // Правильно вызываем setDat
    };
    useEffect(() => {
        if(createNewChat===0) {
            responseForChats();
        }
    }, [createNewChat]);

    useEffect(() => {
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket');
                stompClient.subscribe(`/message/chatUpdated`, (message) => {
                    const parsedMessage = JSON.parse(message.body);
                    console.log("chat", parsedMessage);

                    if (chats.some(chat => chat.id === parsedMessage.id)) {
                        setChats(prevChats =>
                            prevChats.map(chat =>
                                chat.id === parsedMessage.id
                                    ? { ...chat, lastMessage: parsedMessage.lastMessage }
                                    : chat
                            )
                        );
                    }
                },
                    {
                        Authorization: `Bearer ${token}`, // Передаем токен или другой заголовок
                        ChatId: chatId.toString(),
                    }  );
                setIsConnected(true);
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame.headers['message']);
                setIsConnected(false);
            },
            onWebSocketError: (error) => {
                console.error('WebSocket Error:', error);
                setIsConnected(false);
            },
        });

        clientRef.current = stompClient;
        stompClient.activate();

        return () => {
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
                console.log('Disconnected from WebSocket');
            }
        };
    }, [backendUrl, chats, setChats]);





    return (
        <div>
            <div>
                <div style={{
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0px ", /* Центрирование с меньшими отступами сверху и снизу */
                    padding: "0 10px",
                    left:"30px"/* Уменьшение отступа слева и справа */
                }}>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        style={{
                            width: "100%",
                            padding: "5px 15px", /* Более приятные внутренние отступы */
                            fontSize: "16px",
                            borderRadius: "8px", /* Скругленные углы */
                            border: "1px solid #ccc",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", /* Легкая тень */
                            backgroundColor: "#2c2f33", /* Тёмный фон для контраста */
                            color: "white",
                            outline: "none", /* Убираем стандартную рамку при фокусе */
                            transition: "border-color 0.3s", /* Анимация на изменение границы */
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#4a90e2"} /* Изменение границы при фокусе */
                        onBlur={(e) => e.target.style.borderColor = "#ccc"} /* Возврат цвета границы */
                    />
                </div>
            </div>

            <div className={color ? "menu-items" : "menu-items light"}>

                {isLoading ? (
                    Array.from({length: 5}).map((_, index) => (
                        <li key={index} className="skeleton-track-item">
                            <div className="skeleton-image1"></div>
                            <div className="skeleton-text1"></div>
                        </li>
                    ))
                ) : chats && chats.length > 0 ? (
                    chats.slice().reverse().map((chat, index) => (
                        <li key={index} className={activeChat === chat.id ? "item active" : "item"}
                            onClick={() => handleClick(chat.id)}>{
                            chat.image===null?(<ImageMerger chatIds={chat.participants} stylesFrom={false}/>):(<img className={"img_avatar"} src={chat.image} alt={"изображение"}/>)
                        }

                            <div className="playlist-container">
                                <div className={color ? "name-playlist" : "name-playlist light"}
                                >{chat.name}</div>
                                <div
                                    className={color ? "author-playlist" : "author-playlist light"}>{chat.lastMessage !== null && chat.lastMessage.length > 20 ? chat.lastMessage.substring(0, 20) + '...' : chat.lastMessage}</div>
                            </div>

                        </li>
                    ))
                ) : (
                    <li>Чаты не найдены</li>
                )}

            </div>
        </div>

    );
};
export default Chats;





