import { useState, useEffect } from 'react';

const useAuth = () => {
    const [auth, setAuth] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    useEffect(key => {
        const fetchAuth =  () => {

                if (localStorage.getItem('jwtToken')!==null) {
                    setAuth(true);
                } else {
                    setAuth(false);
                }
            }


        fetchAuth();
    }, []);

    return { auth };
};

export default useAuth;
