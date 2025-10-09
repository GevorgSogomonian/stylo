
import './Menu.css';
import CreateNewChat from "../../../NewChat/CreateNewChat";

import MainMenu from "./MainMenu";
import Settings from "./Settings";

import Friends from "./Friends";
import {useSelector} from "react-redux";

const Menu = () => {


    const createNewChat = useSelector((state) => state.example.value);




    const renderActiveView = () => {
        switch (createNewChat) {
            case 0:
                return <MainMenu/>;
            case 1:
                return <CreateNewChat   />;
            case 2:
                return <Settings   />
            case 3:
                return <Friends />
            default:
                return null;
        }
    };

    return (
        <div>
            {renderActiveView()}
        </div>

    );
};

export default Menu;
