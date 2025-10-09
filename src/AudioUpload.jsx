import React, {useState} from "react";
import {useNavigate} from "react-router-dom";

export const AudioUpload =()=>{
    const navigate = useNavigate();
    const[file,setFile]=useState()
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const handleSubmit = async (event) => {
        event.preventDefault(); // предотвращаем стандартное поведение отправки формы

        const formData = new FormData();

        formData.append('file', file);

        try {
           await fetch(`${backendUrl}/api/audio`, {
                method: 'POST',
                body: formData
            });


            navigate('/');

        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка при отправке данных');
        }
    };
    return (
        <div className="form-container">
            <h1>Загрузить трек</h1>
            <form id="userForm" onSubmit={handleSubmit} encType="application/octet-stream">

                <div className="file-input-container">
                    <label className="file-input-label" htmlFor="file">Выберите музон</label>
                    <input
                        type="file"
                        id="file"
                        name="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                </div>

            </form>
            <button className="Back" onClick={() => navigate('/home')}>Назад</button>
            <button id="but"  type="submit" onClick={handleSubmit}>Send</button>
        </div>
    );
};