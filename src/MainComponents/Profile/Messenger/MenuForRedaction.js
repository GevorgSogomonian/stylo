import React, { useState } from 'react';
import $api from "../../../http/middleware";
import {useDispatch, useSelector} from "react-redux";
import {delete_id} from "../../../Reducers/deleteReducer";

const MenuForRedaction = ({ msg }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const createNewChat = useSelector((state) => state.example.value); // Доступ к состоянию
    const dispatch = useDispatch();// Вызов действий
    const handleRightClick = (e) => {
        e.preventDefault();
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setIsMenuOpen(true);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };
    const  handleDeleteMessage = async (id) => {
        try {
            const response = await $api.delete(`/apiChats/delete_message/${id}`, {

            });

            console.log(response.status)
            if(response.status===200)
                dispatch(delete_id(id))

        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <>
            {/* Меню */}
            {isMenuOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${menuPosition.y}px`,
                        left: `${menuPosition.x}px`,
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        zIndex: 1000,
                        padding: '10px',
                    }}
                >
                    <button
                        onClick={() => {
                            handleDeleteMessage(msg.id) // Удалить сообщение
                            closeMenu(); // Закрыть меню
                        }}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: 'red',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                        }}
                    >
                        Удалить сообщение
                    </button>
                </div>
            )}

            {/* Закрытие меню при клике в другое место */}
            {isMenuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 999,
                    }}
                    onClick={closeMenu}
                />
            )}
        </>
    );
};

export default MenuForRedaction;
