import React, {useContext, useEffect, useState} from 'react';
import './Profile.css';

import Menu from './Menu/Menu';

import Chats from "./Chats/Chats";
import Messenger from "./Messenger/Messenger";
import {ChatCon} from "../../HelperModuls/ChatContext";
import {useDispatch, useSelector} from "react-redux";
import {increment} from "../../Reducers/counterReducer";
import {falsecrement, truecrement} from "../../Reducers/menuReducer";

const Profile = () => {

    const createNewChat = useSelector((state) => state.example.value); // Доступ к состоянию
    const dispatch = useDispatch(); // Вызов действий

    const menuActive =useSelector((state) => state.menu_red.value);
   // const {createNewChat,setIsCreateChat} =useContext(ThemeMenu)
    const [showMessenger, setShowMessenger] = useState(true);
    const [showChats, setShowChats] = useState(true);
    const { chatId} = useContext(ChatCon)
    // Функция для проверки ширины окна
    const checkWindowSize = () => {
        if (window.innerWidth <= 868 && chatId===0) {
            console.log(chatId +"first")
            setShowChats(true)
            setShowMessenger(false)

        }

        else if (window.innerWidth <= 868 && chatId!==0){
            console.log(chatId +"second")
            setShowChats(false)
            setShowMessenger(true)
        }


        else {
            console.log(chatId +"third")
            setShowChats(true);
            setShowMessenger(true)
        }
    };



    useEffect(() => {
        // Проверить размер окна при загрузке компонента

        // Добавить обработчик события изменения размера окна
        window.addEventListener('resize', checkWindowSize);

        // Очистить обработчик при размонтировании компонента
        return () => {
            window.removeEventListener('resize', checkWindowSize);
        };
    });


    useEffect(() => {
        if(createNewChat===null)
            dispatch(falsecrement())
        console.log("меню стало " + menuActive)
    }, [createNewChat]);
    const activeMenu =()=>{
        if(menuActive)
            dispatch(falsecrement())
        else
            dispatch(truecrement())
            // Второе действие: переключаем состояние создания нового чата
            dispatch(increment())
      // Задержка в миллисекундах (1000ms = 1 секунда)
    }
    useEffect(() => {
        if(menuActive===false)
            dispatch(increment())
        console.log("текущий menuActive " + menuActive)
    }, [menuActive]);

   const changer = ()=>{
       setShowChats(!showChats)
       setShowMessenger(!showMessenger)

   }

    return (
        <div>
            <nav>
                <strong className={"nameTag"}>На связи</strong>
                <div className='burger-btn' onClick={() => dispatch(menuActive?falsecrement():truecrement())}>
                    <span className={menuActive ? 'line1 active' : 'line1'}/>
                    <span className={menuActive ? 'line2 active' : 'line2'}/>
                    <span className={menuActive ? 'line3 active' : 'line3'}/>
                </div>
            </nav>
            <div className={menuActive ? 'blur active' : 'blur'} onClick={() => activeMenu()}/>
            <Menu/>
            {showChats && (
                <div className="chats-container">
                    <Chats />
                </div>
            )}
            {showMessenger && (
                <div className="messanger-container">
                    <Messenger />
                </div>
            )}
            {((!showMessenger && showChats) || (showMessenger && !showChats)) && (
                <button className="back_up" onClick={() => changer()}></button>
            )}

        </div>
    );
};

export default Profile;
