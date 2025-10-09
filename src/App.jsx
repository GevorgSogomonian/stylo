import React from 'react';
import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom';

import Loginpage from './MainComponents/Entry/Loginpage';
import NotFoundPage from './MainComponents/NotFound/NotFoundPage';
import Profile from './MainComponents/Profile/Profile';
import UserForm from './MainComponents/Registration/RegisterPage';
import PrivateRoute from './PrivateRoutes/PrivateRoute';
import Home from "./MainComponents/Home/Home";
import ThemeContext from "./HelperModuls/ThemeContext";
import ContextForMenu from "./NewChat/ContextForMenu/ContextForMenu";
import Update from "./Update/Update";
import ChatContext from "./HelperModuls/ChatContext";
import MainComponent from "./MainComponents/MainComponent/MainComponent";

const App = () => {

    return (

            <ThemeContext>
            <Router>
                    <Routes>
                        <Route path="/login" element={<Loginpage />} />
                        <Route path="*" element={<NotFoundPage />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/reg" element={<UserForm />} />
                        <Route path="/stylo" element={<MainComponent />} />
                        <Route element={<PrivateRoute />}>
                            <Route path="/update" element={<Update/>} />
                            <Route path="/profile" element={<ContextForMenu><ChatContext> <Profile /> </ChatContext>  </ContextForMenu>} />
                        </Route>
                    </Routes>
            </Router>
            </ThemeContext>


    );
};

export default App;