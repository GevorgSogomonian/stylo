// NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';


const NotFoundPage = () => {
  const navigate = useNavigate();

  const redirectToHome = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <button onClick={redirectToHome} className="button">
        Go to Home
      </button>
    </div>
  );
};

export default NotFoundPage;
