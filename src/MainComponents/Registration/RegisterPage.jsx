import React, {useState} from 'react';
import './Registr.css';
import {useNavigate} from 'react-router-dom';


const UserForm = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const [file, setFile] = useState(null);
    const [visible, setVisible] = useState(true);
    const [check, setCheck] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate();
    const redirectTo = (url) => {
        navigate(url);
    };
    const handleSubmit = async (event) => {
        event.preventDefault(); // предотвращаем стандартное поведение отправки формы

        const formData = new FormData();
        formData.append('name', name);
        formData.append('password', password);
        formData.append('file', file);
        const dataForLogin = {
            name: name,
            password: password
        };

           const response =  await fetch(`${backendUrl}/signup`, {
                method: 'POST',
                body: formData,
            });


        if (response.ok) {
            const data = await response.json();
            const token = data.token;  // Предположим, что сервер возвращает объект с полем token
            localStorage.setItem('jwtToken', token);  // Сохраняем токен в localStorage
            // Handle successful login, e.g., save token, redirect
            console.log('Login successful', localStorage.getItem('jwtToken'));
            redirectTo('/profile'); // Redirect after successful login
        } else {
            // Handle errors, e.g., wrong credentials
           console.log("bad registr")
        }


    };

    const checking = async (name) => {
        try {
            console.log(name)
            const Url = `${backendUrl}/api/checking`;
            console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
            const response = await fetch(Url, {
                method: 'POST',
                body: JSON.stringify({ name }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                setCheck(false);
            } else {
                setCheck(true);
            }
        } catch (error) {
            console.error('Error:', error);
            setCheck(true);
        }
    };

    const handleNameChange = async (events) => {
        const newName = events.target.value;
        setName(newName);
        await checking(newName);
    };
    const Visible = ()=>{
        setVisible(!visible)
        if(visible){
            document.getElementById("password").setAttribute("type","text")
        }
        else{
            document.getElementById("password").setAttribute("type","password")
        }

    }

    return (
        <div className="form-container">
            <h1>Регистрация</h1>
            <form id="userForm" onSubmit={handleSubmit} encType="multipart/form-data">
                <input
                    className={check ? 'input-valid' : 'input-invalid'}
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Введите имя"
                    value={name}
                    onChange={handleNameChange}
                    required
                />
                <a className={check ? 'Nevalid' : 'Valid'}>This name is already taken</a>
                <input
                    className={"input_password"}
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <img className={"imgVisible"} src={"https://img.freepik.com/premium-vector/password-hidding-icon-icon-for-data-privacy-and-sensitive-content-mark-vector-illustration_499431-1267.jpg?size=626&ext=jpg"} onClick={()=>Visible()}/>
                <div className="file-input-container">
                    <label className="file-input-label" htmlFor="file">Выберите аватар</label>
                    <input
                        type="file"
                        id="file"
                        name="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                </div>
                <button id="but" className={check?'send':'unsent'} type="submit">Отправить</button>
            </form>
            <button className="Back" onClick={() => navigate('/')}>Назад</button>
        </div>
    );
};

export default UserForm;
