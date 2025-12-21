import './MainComponent.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from "html2canvas";
import AvatarMenu from "./AvatarMenu";

const MainComponent = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const draggingRef = useRef(null);
    const resizingRef = useRef(null);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const workspaceRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
    const[isOpen,setOpen] = useState(false)
    const menuRef = useRef(null);
    // изображения для категорий
    const [hatsImages,setHatsImages] = useState(['https://avatars.mds.yandex.net/i?id=379e00382a52704e50959e83e7a35b773dd9fe4a-5883354-images-thumbs&n=13','https://avatars.mds.yandex.net/i?id=379e00382a52704e50959e83e7a35b773dd9fe4a-5883354-images-thumbs&n=13','https://avatars.mds.yandex.net/i?id=379e00382a52704e50959e83e7a35b773dd9fe4a-5883354-images-thumbs&n=13','https://avatars.mds.yandex.net/i?id=379e00382a52704e50959e83e7a35b773dd9fe4a-5883354-images-thumbs&n=13'])
    const [shoesImages,setShoesImages] = useState(['https://avatars.mds.yandex.net/i?id=e892295c09a217ed083585e15ec2c4cdb1cb1fb1-16477815-images-thumbs&n=13'])
    const [legsImages,setLegsImages] = useState(['https://avatars.mds.yandex.net/i?id=320896406a365bed5c2225ce304ea8fecf76ed7e-4727286-images-thumbs&n=13'])
    const [torsoImages,setTorsoImages] = useState(['https://avatars.mds.yandex.net/i?id=251b3c35cc09dcf26e710ddc131864bffcacea73-10125837-images-thumbs&n=13'])
    const [outerwearImages,setOuterwearImages] = useState(['https://avatars.mds.yandex.net/i?id=fc5d185e779c00b91105e62815d090abecb6882c-5869170-images-thumbs&n=13'])
    //манекен
    const [maneken,setManeken] = useState('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOPr51KmVupb-yWDvSU98FVVyoM_5peYepxw&s')
    const [carouselStates, setCarouselStates] = useState({
        hats: { currentIndex: 0 },
        outerwear: { currentIndex: 0 },
        torso: { currentIndex: 0 },
        legs: { currentIndex: 0 },
        shoes: { currentIndex: 0 }
    });
    // обработчик перетаскивания картинок в категории
    const handleDragStartEditorImage = (e, image) => {
        e.dataTransfer.setData("type", "editor-image");
        e.dataTransfer.setData("imageId", image.id);
        e.dataTransfer.setData("src", image.src);
    };
    // определитель категории при перетакскивании из editor area
    const handleDropToCategory = (eOrId, category) => {
        let id, src;
        if (typeof eOrId === 'object' && eOrId.dataTransfer) {
            // старый вызов через drag-and-drop
            id = eOrId.dataTransfer.getData("imageId");
            src = images.find(img => img.id === +id)?.src;
        } else {
            // вызов через контекстное меню, передаём id напрямую
            id = eOrId;
            src = images.find(img => img.id === id)?.src;
        }

        if (!src) return;

        // удаляем из редактора
        setImages(prev => prev.filter(img => img.id !== +id));

        // добавляем в категорию
        switch (category) {
            case "hats":
                setHatsImages(prev => [...prev, src]);
                break;
            case "outerwear":
                setOuterwearImages(prev => [...prev, src]);
                break;
            case "torso":
                setTorsoImages(prev => [...prev, src]);
                break;
            case "legs":
                setLegsImages(prev => [...prev, src]);
                break;
            case "shoes":
                setShoesImages(prev => [...prev, src]);
                break;
            default:
                break;
        }
    };

// для перемещения фото из категорий
    const [draggedImage, setDraggedImage] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

// Функции для drag-and-drop
    const handleDragStart = (e, imageUrl, category) => {
        e.dataTransfer.setData('imageUrl', imageUrl);
        e.dataTransfer.setData('category', category);
        setDraggedImage({ imageUrl, category });
        e.target.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedImage(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    useEffect(() => {
        const handleGlobalDrop = async (e) => {
            e.preventDefault();
            const imageUrl = e.dataTransfer.getData('imageUrl');
            const category = e.dataTransfer.getData('category');
            if (!imageUrl) return;

            // тут можно вычислить категорию по координатам мыши
            // или использовать e.target.closest('.category-section')
            const categoryElement = e.target.closest('.category-section');
            if (categoryElement) {
                const category = categoryElement.dataset.category; // добавь data-category
                handleDropToCategory(e, category);
            }
        };

        window.addEventListener('dragover', (e) => e.preventDefault());
        window.addEventListener('drop', handleGlobalDrop);

        return () => {
            window.removeEventListener('dragover', (e) => e.preventDefault());
            window.removeEventListener('drop', handleGlobalDrop);
        };
    }, []);

// Добавьте эту функцию в ваш компонент MainComponent
    const removeWhiteBackground = (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;

            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Проходим по всем пикселям
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Если пиксель почти белый — делаем прозрачным
                    if (r > 240 && g > 240 && b > 240) {
                        data[i + 3] = 0; // прозрачность
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                // Конвертируем canvas обратно в data URL
                const newSrc = canvas.toDataURL();
                resolve(newSrc);
            };

            img.onerror = () => resolve(src); // В случае ошибки возвращаем исходное изображение
        });
    };
    const manekenUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const imgSrc = e.target.result; // base64
            setManeken(imgSrc);             // устанавливаем как maneken
        };

        reader.readAsDataURL(file);
    };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const imageUrl = e.dataTransfer.getData('imageUrl');
        const category = e.dataTransfer.getData('category');

        if (imageUrl) {
            const workspaceRect = workspaceRef.current.getBoundingClientRect();
            const x = e.clientX - workspaceRect.left - 75;
            const y = e.clientY - workspaceRect.top - 75;

            // Удаляем белый фон перед добавлением
            const processedImageUrl = await removeWhiteBackground(imageUrl);

            const newImg = {
                id: Date.now(),
                src: processedImageUrl,
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: 150,
                height: 150,
                category: category
            };

            setImages((prev) => [...prev, newImg]);
        }

        setDraggedImage(null);
    };
// Функция для прокрутки карусели
    const scrollCarousel = (category, direction) => {
        setCarouselStates(prev => {
            const currentIndex = prev[category]?.currentIndex || 0;
            const imagesCount = {
                hats: hatsImages.length,
                outerwear: outerwearImages.length,
                torso: torsoImages.length,
                legs: legsImages.length,
                shoes: shoesImages.length
            }[category];

            const maxIndex = Math.ceil(imagesCount / 3) - 1;
            let newIndex = currentIndex + direction;

            // Ограничиваем индекс в допустимых пределах
            newIndex = Math.max(0, Math.min(newIndex, maxIndex));

            return {
                ...prev,
                [category]: { currentIndex: newIndex }
            };
        });
    };

    // === Поиск ===
    const handleSearchChange = (e) => {
        const value = e.target.value.trim();
        setQuery(value);
        if (value.length > 2) {
            const results = Array.from({ length: 5 }).map((_, i) => ({
                id: Date.now() + i,
                src: `https://picsum.photos/120?random=${Math.floor(Math.random() * 1000)}`
            }));
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };
    const handleSaveLook = async () => {
        if (!workspaceRef.current) return;

        // 1. Создаем временный контейнер
        const tempContainer = document.createElement("div");
        // Используем те же стили, что и у editor-area для корректного рендеринга
        tempContainer.style.width = workspaceRef.current.offsetWidth + "px";
        tempContainer.style.height = workspaceRef.current.offsetHeight + "px";
        tempContainer.style.position = "absolute";
        tempContainer.style.top = "0";
        tempContainer.style.left = "-9999px"; // Скрываем его за пределами экрана
        tempContainer.style.backgroundColor = "#ffffff";
        document.body.appendChild(tempContainer);

        // 2. Копируем манекен
        const originalMannequin = workspaceRef.current.querySelector(".mannequin");
        if (!originalMannequin) {
            document.body.removeChild(tempContainer);
            return;
        }
        const clonedMannequin = originalMannequin.cloneNode(true);
        tempContainer.appendChild(clonedMannequin);

        // 3. Копируем все перемещаемые картинки
        const imageWrappers = workspaceRef.current.querySelectorAll(".image-wrapper");

        // Отключаем рамки и элементы интерфейса перед снимком на оригинальных элементах
        const resizeHandles = workspaceRef.current.querySelectorAll(".resize-handle");
        resizeHandles.forEach((el) => (el.style.display = "none"));

        imageWrappers.forEach((wrapper) => {
            const clonedWrapper = wrapper.cloneNode(true);
            // Удаляем рукоятки ресайза из клона, чтобы они не попали на снимок
            const clonedResizeHandle = clonedWrapper.querySelector(".resize-handle");
            if (clonedResizeHandle) {
                clonedResizeHandle.remove();
            }
            tempContainer.appendChild(clonedWrapper);
        });

        try {
            // 4. Используем html2canvas для снимка временного контейнера
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: "#ffffff",
                useCORS: true,
                scale: 2,
            });

            // Включаем рамки обратно на оригинальных элементах
            resizeHandles.forEach((el) => (el.style.display = "block"));

            // 💡 Копируем как PNG
            const blobPng = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png", 1.0)
            );

            if (!blobPng) return;

            // Пытаемся скопировать в буфер
            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": blobPng,
                }),
            ]);
            alert("Изображение скопировано в буфер обмена!");
        } catch (err) {
            console.error("Ошибка при сохранении:", err);
            // Всегда включаем рамки обратно, даже если произошла ошибка
            resizeHandles.forEach((el) => (el.style.display = "block"));
        } finally {
            // 5. Удаляем временный контейнер
            document.body.removeChild(tempContainer);
        }
    };

    // === Добавление картинки ===
    const handleAddImage = (imgSrc) => {
        const newImg = {
            id: Date.now(),
            src: imgSrc,
            x: 200 + Math.random() * 150,
            y: 150 + Math.random() * 150,
            width: 150,
            height: 150,
        };
        setImages((prev) => [...prev, newImg]);
    };

    // === Загрузка файлов ===
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const originalDataUrl = ev.target.result;
                // Удаляем белый фон перед добавлением
                const processedImageUrl = await removeWhiteBackground(originalDataUrl);
                handleAddImage(processedImageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const handlePaste = async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        const originalDataUrl = ev.target.result;
                        // Удаляем белый фон перед добавлением
                        const processedImageUrl = await removeWhiteBackground(originalDataUrl);
                        handleAddImage(processedImageUrl);
                    };
                    reader.readAsDataURL(file);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);
    // === Вставка из буфера обмена ===
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (ev) => handleAddImage(ev.target.result);
                    reader.readAsDataURL(file);
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // === Контекстное меню ===
    const handleContextMenu = (e, id) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId: id,
        });
    };

    const handleDeleteImage = () => {
        setImages((prev) => prev.filter((img) => img.id !== contextMenu.targetId));
        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // === Перемещение и ресайз ===
    const bringToFront = (id) => {
        setImages((prev) => {
            const idx = prev.findIndex((p) => p.id === id);
            if (idx === -1) return prev;
            const item = prev[idx];
            const rest = prev.filter((p) => p.id !== id);
            return [...rest, item];
        });
    };

    const handlePointerDownImage = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        bringToFront(id);
        const workspaceRect = workspaceRef.current.getBoundingClientRect();
        const elRect = e.currentTarget.getBoundingClientRect();
        draggingRef.current = {
            id,
            offsetX: e.clientX - elRect.left,
            offsetY: e.clientY - elRect.top,
            workspaceRect,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { }
    };

    const handlePointerDownResize = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        bringToFront(id);
        const workspaceRect = workspaceRef.current.getBoundingClientRect();
        const img = images.find((x) => x.id === id);
        if (!img) return;
        resizingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: img.width,
            startHeight: img.height,
            workspaceRect,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { }
    };

    useEffect(() => {
        const onPointerMove = (e) => {
            if (draggingRef.current) {
                const { id, offsetX, offsetY, workspaceRect } = draggingRef.current;
                const nextX = e.clientX - workspaceRect.left - offsetX;
                const nextY = e.clientY - workspaceRect.top - offsetY;
                setImages((prev) =>
                    prev.map((img) => (img.id === id ? { ...img, x: nextX, y: nextY } : img))
                );
            }
            if (resizingRef.current) {
                const { id, startX, startY, startWidth, startHeight } = resizingRef.current;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === id
                            ? {
                                ...img,
                                width: Math.max(20, startWidth + deltaX),
                                height: Math.max(20, startHeight + deltaY),
                            }
                            : img
                    )
                );
            }
        };



        const onPointerUp = () => {
            draggingRef.current = null;
            resizingRef.current = null;
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, []);

    return (
        <div className="main-container">

            <aside className="sidebar">
                <label className="upload-btn">
                    Загрузить фото из своей галереи
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        style={{display: 'none'}}
                    />
                </label>
                <label className="redact_maneken_but">
                    Изменить манекена
                    <input
                        type="file"
                        accept="image/*"
                        onChange={manekenUpload}
                        style={{display: 'none'}}
                    />

                </label>

                {/* Секция головных уборов */}
                <div className="category-section" onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => handleDropToCategory(e, 'hats')}>
                <div className="category-header">
                        <h3>Головные уборы</h3>
                        <div className="carousel-controls">
                            <button
                                className="nav-btn prev-btn"
                                onClick={() => scrollCarousel('hats', -1)}
                                disabled={carouselStates.hats?.currentIndex === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="nav-btn next-btn"
                                onClick={() => scrollCarousel('hats', 1)}
                                disabled={carouselStates.hats?.currentIndex >= Math.ceil(hatsImages.length / 3) - 1}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="carousel-container">
                        <div
                            className="carousel-track"
                            style={{transform: `translateX(-${(carouselStates.hats?.currentIndex || 0) * 100}%)`}}
                        >
                            {Array.from({length: Math.ceil(hatsImages.length / 3)}).map((_, groupIndex) => (
                                <div key={groupIndex} className="carousel-slide">
                                    {hatsImages.slice(groupIndex * 3, groupIndex * 3 + 3).map((imageUrl, index) => (
                                        <img
                                            key={groupIndex * 3 + index}
                                            src={imageUrl}
                                            alt={`Головной убор ${groupIndex * 3 + index + 1}`}
                                            className="gallery-item draggable"
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, imageUrl, 'hats')}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Секция верхней одежды */}
                <div className="category-section" onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => handleDropToCategory(e, 'outerwear')}>
                    <div className="category-header">
                        <h3>Верхняя одежда</h3>
                        <div className="carousel-controls">
                            <button
                                className="nav-btn prev-btn"
                                onClick={() => scrollCarousel('outerwear', -1)}
                                disabled={carouselStates.outerwear?.currentIndex === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="nav-btn next-btn"
                                onClick={() => scrollCarousel('outerwear', 1)}
                                disabled={carouselStates.outerwear?.currentIndex >= Math.ceil(outerwearImages.length / 3) - 1}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="carousel-container">
                        <div
                            className="carousel-track"
                            style={{transform: `translateX(-${(carouselStates.outerwear?.currentIndex || 0) * 100}%)`}}
                        >
                            {Array.from({length: Math.ceil(outerwearImages.length / 3)}).map((_, groupIndex) => (
                                <div key={groupIndex} className="carousel-slide">
                                    {outerwearImages.slice(groupIndex * 3, groupIndex * 3 + 3).map((imageUrl, index) => (
                                        <img
                                            key={groupIndex * 3 + index}
                                            src={imageUrl}
                                            alt={`Верхняя одежда ${groupIndex * 3 + index + 1}`}
                                            className="gallery-item"
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, imageUrl, 'outerwear')}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}

                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Остальные секции по аналогии */}
                {/* Секция туловища */}
                <div className="category-section" onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => handleDropToCategory(e, 'torso')}>
                    <div className="category-header">
                        <h3>Туловище</h3>
                        <div className="carousel-controls">
                            <button
                                className="nav-btn prev-btn"
                                onClick={() => scrollCarousel('torso', -1)}
                                disabled={carouselStates.torso?.currentIndex === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="nav-btn next-btn"
                                onClick={() => scrollCarousel('torso', 1)}
                                disabled={carouselStates.torso?.currentIndex >= Math.ceil(torsoImages.length / 3) - 1}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="carousel-container">
                        <div
                            className="carousel-track"
                            style={{transform: `translateX(-${(carouselStates.torso?.currentIndex || 0) * 100}%)`}}
                        >
                            {Array.from({length: Math.ceil(torsoImages.length / 3)}).map((_, groupIndex) => (
                                <div key={groupIndex} className="carousel-slide">

                                    {torsoImages.slice(groupIndex * 3, groupIndex * 3 + 3).map((imageUrl, index) => (
                                        <img
                                            key={groupIndex * 3 + index}
                                            src={imageUrl}
                                            alt={`Одежда для туловища ${groupIndex * 3 + index + 1}`}
                                            className="gallery-item"
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, imageUrl, 'torso')}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Секция ног */}
                <div className="category-section"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropToCategory(e, 'legs')}

                    >
                    <div className="category-header">
                        <h3>Ноги</h3>
                        <div className="carousel-controls">
                            <button
                                className="nav-btn prev-btn"
                                onClick={() => scrollCarousel('legs', -1)}
                                disabled={carouselStates.legs?.currentIndex === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="nav-btn next-btn"
                                onClick={() => scrollCarousel('legs', 1)}
                                disabled={carouselStates.legs?.currentIndex >= Math.ceil(legsImages.length / 3) - 1}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="carousel-container">
                        <div
                            className="carousel-track"
                            style={{transform: `translateX(-${(carouselStates.legs?.currentIndex || 0) * 100}%)`}}
                        >
                            {Array.from({length: Math.ceil(legsImages.length / 3)}).map((_, groupIndex) => (
                                <div key={groupIndex} className="carousel-slide">
                                    {legsImages.slice(groupIndex * 3, groupIndex * 3 + 3).map((imageUrl, index) => (
                                        <img
                                            key={groupIndex * 3 + index}
                                            src={imageUrl}
                                            alt={`Одежда для ног ${groupIndex * 3 + index + 1}`}
                                            className="gallery-item"
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, imageUrl, 'legs')}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                    {/* Секция обуви */}
                <div className="category-section" onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => handleDropToCategory(e, 'shoes')}>
                    <div className="category-header">
                        <h3>Обувь</h3>
                        <div className="carousel-controls">
                            <button
                                className="nav-btn prev-btn"
                                onClick={() => scrollCarousel('shoes', -1)}
                                disabled={carouselStates.shoes?.currentIndex === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="nav-btn next-btn"
                                onClick={() => scrollCarousel('shoes', 1)}
                                disabled={carouselStates.shoes?.currentIndex >= Math.ceil(shoesImages.length / 3) - 1}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="carousel-container">
                        <div
                            className="carousel-track"
                            style={{transform: `translateX(-${(carouselStates.shoes?.currentIndex || 0) * 100}%)`}}
                        >
                            {Array.from({length: Math.ceil(shoesImages.length / 3)}).map((_, groupIndex) => (
                                <div key={groupIndex} className="carousel-slide">

                                    {shoesImages.slice(groupIndex * 3, groupIndex * 3 + 3).map((imageUrl, index) => (
                                        <img
                                            key={groupIndex * 3 + index}
                                            src={imageUrl}
                                            alt={`Обувь ${groupIndex * 3 + index + 1}`}
                                            className="gallery-item"
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, imageUrl, 'shoes')}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>


            <div className="content">
                <nav className="top-navi">
                    <div className="logo">Stylo</div>
                    <AvatarMenu/>


                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="🔍 Поиск изображений..."
                            className="search-input"
                            value={query}
                            onChange={handleSearchChange}
                        />
                        {searchResults.length > 0 && (
                            <div className="search-panel">
                                {searchResults.map((res) => (
                                    <img
                                        key={res.id}
                                        src={res.src}
                                        alt=""
                                        className="search-result-img"
                                        onClick={() => handleAddImage(res.src)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>


                </nav>


                <div
                    className={`editor-area ${isDragOver ? 'drag-over' : ''}`}
                    ref={workspaceRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Манекен */}
                    <img
                        src= {maneken}
                        alt="mannequin"
                        className="mannequin"
                    />

                    {/* Картинки */}
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="image-wrapper plain-image"
                            style={{
                                left: img.x,
                                top: img.y,
                                width: img.width,
                                height: img.height,
                            }}
                            onContextMenu={(e) => handleContextMenu(e, img.id)}
                        >
                            <img
                                src={img.src}
                                alt=""
                                className="draggable-img"
                                style={{width: '100%', height: '100%', objectFit: 'contain'}}
                                onPointerDown={(e) => handlePointerDownImage(e, img.id)}
                                draggable={true}
                                onDragStart={(e) => handleDragStartEditorImage(e, img)}

                            />
                            <div
                                className="resize-handle"
                                onPointerDown={(e) => handlePointerDownResize(e, img.id)}
                            />
                        </div>
                    ))}

                    <button className="save-btn" onClick={handleSaveLook}>💾 Save look</button>
                </div>
            </div>

            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: '#222',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        zIndex: 9999,
                        cursor: 'default',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        userSelect: 'none',
                        minWidth: '160px',
                    }}
                >
                    {/* Удаление */}
                    <div
                        className="context-item"
                        onClick={handleDeleteImage}
                    >
                         Удалить
                    </div>

                    <div style={{borderTop: '1px solid #555', margin: '4px 0'}}></div>

                    {/* Добавить в категорию */}
                    <div className="context-item has-submenu">
                        Добавить в категорию
                        <div className="submenu">
                            {['hats', 'outerwear', 'torso', 'legs', 'shoes'].map(cat => (
                                <div
                                    key={cat}
                                    className="submenu-item"
                                    onClick={() => {
                                        handleDropToCategory(contextMenu.targetId, cat);
                                        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {cat}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default MainComponent;
