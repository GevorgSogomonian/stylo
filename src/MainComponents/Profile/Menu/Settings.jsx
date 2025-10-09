
import React, {useContext} from "react";
import $api from "../../../http/middleware";
import {useNavigate} from "react-router-dom";
import {Theme} from "../../../HelperModuls/ThemeContext";
import {useSelector} from "react-redux";

const Settings = ()=>{
    const navigate = useNavigate();
    const { color,  } = useContext(Theme);
    const active =useSelector((state) => state.menu_red.value);

    const deleteUserAccount = async () => {
        try {
            if (window.confirm('Are you sure you want to delete your account?')) {
                const response = await $api.delete(`/api/user`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.status===200) window.location.replace(`/`);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account.');
        }
    };
    const redirectTo = (url) => navigate(url);
    const redirectToLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken')
        navigate('/');
    };

    return (
        <div className={active ? !color ? "menu active light" : "menu active" : !color ? "menu light" : "menu"}>


            <ul>

                <li className={color ? "liMenuNotPoint" : "liMenuNotPoint light"}><a
                    onClick={() => redirectTo('/update')}>Обновить данные</a></li>
                <li className="exit"><a onClick={() => deleteUserAccount()}>Удалить аккаунт</a></li>
                <li className='exit'><a className="exit" onClick={redirectToLogout}>Выйти</a></li>
            </ul>
        </div>


    )
}

export default Settings;