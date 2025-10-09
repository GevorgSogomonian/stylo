import React, { useRef, useState, useEffect } from 'react';

const ImageMerger = ({ chatIds,stylesFrom }) => {
    const canvasRef = useRef(null);
    const [filteredChatIds, setFilteredChatIds] = useState(chatIds); // Храним отфильтрованные chatIds
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('jwtToken');
    const [style,setStyle]=useState()
    // Декодирование токена
    const decodeToken = (token) => {
        const payloadBase64 = token.split(".")[1]; // Берем вторую часть, которая является полезной нагрузкой
        const payloadDecoded = atob(payloadBase64); // Декодируем base64 строку
        return JSON.parse(payloadDecoded); // Преобразуем строку в объект JSON
    };

    // Обновляем filteredChatIds при изменении chatIds или token
    useEffect(() => {
        if(stylesFrom===true){
        setStyle({ width: '50px', height: '50px', position: 'absolute',
            left: '30px',
            top:'7px',
            borderRadius:  '50%',
            overflow:'hidden',
            objectFit: 'cover',   })}
        else{
            setStyle({ width: '50px', height: '50px'})
        }

        let updatedChatIds = [...chatIds]; // Копируем chatIds, чтобы не мутировать оригинальный массив

        // Проверяем, есть ли токен и фильтруем chatIds, исключая id из токена
        if (token) {
            const payload = decodeToken(token);
            updatedChatIds = updatedChatIds.filter((item) => item !== payload.id); // Убираем id из массива
        }

        setFilteredChatIds(updatedChatIds); // Обновляем состояние с фильтрованными id
    }, [chatIds, token]); // Зависят от chatIds и token

    // Загружаем изображения и рисуем их на канвасе
    useEffect(() => {
        if (!filteredChatIds || filteredChatIds.length === 0) return;

        const canvas = canvasRef.current;

        // Проверяем, существует ли canvasRef
        if (canvas &&chatIds.length !==2) {
            const ctx = canvas.getContext('2d');

            if (filteredChatIds.length !== 2) {
                const images = filteredChatIds.slice(0, 4).map(id => `${backendUrl}/api/images/${id}`);

                const loadImages = async () => {
                    try {
                        const loadedImages = await Promise.all(
                            images.map(src => new Promise((resolve, reject) => {
                                const img = new Image();
                                img.src = src;
                                img.onload = () => resolve(img);
                                img.onerror = reject;
                            }))
                        );

                        // Очистка холста
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Установка размеров холста
                        canvas.width = 50;
                        canvas.height = 50;

                        // Настройка отрисовки изображений
                        const imageSize = 25; // Размер каждого изображения
                        loadedImages.forEach((img, index) => {
                            const x = (index % 2) * imageSize;
                            const y = Math.floor(index / 2) * imageSize;
                            ctx.drawImage(img, x, y, imageSize, imageSize);
                        });
                    } catch (error) {
                        console.error('Ошибка загрузки изображений:', error);
                    }
                };

                loadImages();
            }
        }
    }, [filteredChatIds]); // Зависят только от filteredChatIds

    // Если chatIds содержит ровно 2 элемента, рендерим только <img>
    if (chatIds.length === 2) {

        return <img src={`${backendUrl}/api/images/${filteredChatIds[0]}`} alt="Single" style={style} />;
    }

    // Если chatIds больше 2-х, отображаем холст
    return <canvas ref={canvasRef} style={style}></canvas>;
};

export default ImageMerger;
