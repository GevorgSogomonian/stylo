import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuth2Callback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('jwtToken', token);
            // Navigate to the main app page
            navigate('/stylo'); 
        } else {
            // Handle error or missing token
            console.error('No token found in URL');
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>Authenticating...</h2>
        </div>
    );
};

export default OAuth2Callback;
