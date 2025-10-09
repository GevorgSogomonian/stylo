import React, {useContext} from "react";
import {Theme} from "../../../HelperModuls/ThemeContext";
import {useSelector} from "react-redux";


const Friends = ()=>{

    const { color, setColorTheme } = useContext(Theme);
    const active =useSelector((state) => state.menu_red.value);

    return (
        <div className={active ? !color ? "menu active light" : "menu active" : !color ? "menu light" : "menu"}>


            <ul>

                <li className={color ?"liMenu":"liMenu light"}><a
                    >Друзей пока нет</a></li>
            </ul>
        </div>


    )
}
export default Friends;