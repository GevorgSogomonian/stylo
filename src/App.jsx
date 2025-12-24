import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Loginpage from './MainComponents/Entry/Loginpage';
import OAuth2Callback from './MainComponents/Entry/OAuth2Callback';
import SpaceSelection from '../../../Downloads/stylo-front/src/MainComponents/SpaceSelection/SpaceSelection';
import NotFoundPage from '../../../Downloads/stylo-front/src/MainComponents/NotFound/NotFoundPage';

import UserForm from '../../../Downloads/stylo-front/src/MainComponents/Registration/RegisterPage';
import PrivateRoute from '../../../Downloads/stylo-front/src/PrivateRoutes/PrivateRoute';
import Home from "../../../Downloads/stylo-front/src/MainComponents/Home/Home";

import Update from "../../../Downloads/stylo-front/src/Update/Update";
import MainComponent from "../../../Downloads/stylo-front/src/MainComponents/MainComponent/MainComponent";
import { Navigate } from 'react-router-dom';

const SpaceGuard = ({ children }) => {
    const activeSpaceId = localStorage.getItem('activeSpaceId');
    if (!activeSpaceId) {
        return <Navigate to="/spaces" />;
    }
    return children;
};

const App = () => {

    return (
            <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Loginpage />} />
                        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
                        <Route path="/reg" element={<UserForm />} />
                        <Route element={<PrivateRoute />}>
                            <Route path="/spaces" element={<SpaceSelection />} />
                            <Route path="/stylo" element={<SpaceGuard><MainComponent /></SpaceGuard>} />
                            <Route path="/update" element={<Update/>} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
            </Router>
    );
};

export default App;
