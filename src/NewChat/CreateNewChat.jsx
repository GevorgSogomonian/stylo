import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Theme } from "../HelperModuls/ThemeContext";
import "./CreateNewChat.css";

import $api from "../http/middleware";
import { ChatCon } from "../HelperModuls/ChatContext";
import {useDispatch, useSelector} from "react-redux";
import {increment, nullcrement} from "../Reducers/counterReducer";

const CreateNewChat = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [query, setQuery] = useState("");
    const { color } = useContext(Theme);
   // const { setIsCreateChat } = useContext(ThemeMenu);
    const active =useSelector((state) => state.menu_red.value);
    const dispatch = useDispatch();
    const createNewChat = useSelector((state) => state.example.value);
    const { setActiveChatValue, setChatIdValue } = useContext(ChatCon);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Получение всех пользователей
    const getUsersList = useCallback(async () => {
        try {
            const response = await $api.get(`/api/getUsers`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.status === 200) {
                const userList = await response.data;
                setUsers(userList);
                setFilteredUsers(userList);
            }
        } catch (error) {
            console.error("Error fetching users list:", error);
        }
    }, []);

    // Поиск пользователей
    const searchUsers = useCallback(async (query) => {
        try {
            const response = await $api.get(`/apiChats/users_search?query=${query}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.status === 200) {
                const searchResults = await response.data;
                setFilteredUsers(searchResults);
            }
        } catch (error) {
            console.error("Error searching users:", error);
            setFilteredUsers([]);
        }
    }, []);

    // Выбор пользователя
    const handleUserSelection = (id) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    // Создание чата
    const createChat = useCallback(async () => {
        try {
            const response = await $api.post(`/apiChats/createChat`, selectedUsers, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("id чата: "+response.data)
                setChatIdValue(response.data);
                setActiveChatValue(response.data);
                dispatch(nullcrement());

        } catch (error) {
            console.error("Error creating chat:", error);
        }
    }, [selectedUsers,dispatch]);

    // Обновление отображения пользователей при изменении запроса
    useEffect(() => {
        if (query.trim()) {
            searchUsers(query);
        } else {
            setFilteredUsers(users);
        }
    }, [query, users, searchUsers]);

    // Загрузка всех пользователей при монтировании
    useEffect(() => {
        getUsersList();
    }, [getUsersList]);

    const renderedUsers = useMemo(
        () =>
            filteredUsers.slice().reverse().map((user) => (
                <li key={user.id} className="item">
                    <img
                        className={
                            selectedUsers.includes(user.id)
                                ? "track-image-newChat-aprove"
                                : "track-image-newChat"
                        }
                        onClick={() => handleUserSelection(user.id)}
                        src={`${backendUrl}/api/images/${user.id}`}
                        alt="User"
                        loading="lazy"
                    />
                    <div className="newChat-container">
                        <div className={color ? "name-newChat" : "name-playlist light"}>
                            {user.name}
                        </div>
                    </div>
                </li>
            )),
        [filteredUsers, selectedUsers, backendUrl, color]
    );

    return (
        <div className={active ? (!color ? "menu active light" : "menu active") : !color ? "menu light" : "menu"}>
            <ul>
                <div style={{ width: "100%", maxWidth: "400px", margin: "5px auto", textAlign: "center" }}>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: "85%",
                            padding: "5px",
                            fontSize: "16px",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            color: "white",

                        }}
                    />
                </div>
                {filteredUsers.length > 0 ? renderedUsers : <li>No users available</li>}
                <li className="Create" onClick={createChat}>
                    Создать чат
                </li>
            </ul>
        </div>
    );
};

export default CreateNewChat;
