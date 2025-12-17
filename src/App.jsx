import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Loginpage from './MainComponents/Entry/Loginpage';
import NotFoundPage from './MainComponents/NotFound/NotFoundPage';

import UserForm from './MainComponents/Registration/RegisterPage';
import PrivateRoute from './PrivateRoutes/PrivateRoute';
import Home from "./MainComponents/Home/Home";

import Update from "./Update/Update";
import MainComponent from "./MainComponents/MainComponent/MainComponent";

const App = () => {

    return (


            <Router>
                    <Routes>
                        <Route path="/login" element={<Loginpage />} />
                        <Route path="*" element={<NotFoundPage />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/reg" element={<UserForm />} />
                        <Route path="/stylo" element={<MainComponent />} />
                        <Route element={<PrivateRoute />}>
                            <Route path="/update" element={<Update/>} />
                        </Route>
                    </Routes>
            </Router>



    );
};

export default App;