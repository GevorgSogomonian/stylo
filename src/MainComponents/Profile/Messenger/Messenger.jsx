import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';
import React, {useContext, useEffect, useRef, useState} from 'react';
import styles from './Messenger.module.css';
import {jwtDecode} from 'jwt-decode';
import {ChatCon} from '../../../HelperModuls/ChatContext';
import $api from '../../../http/middleware';
import {Theme} from '../../../HelperModuls/ThemeContext';
import ImageMerger from "../Chats/Images/ImageMerger";
import MenuForRedaction from "./MenuForRedaction";
import {useSelector} from "react-redux";
import {throttle} from "lodash";


const Messenger = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [, setName] = useState(1);
    const [, setIsConnected] = useState(false);
    const [client, setClient] = useState(null);

    const messagesEndRef = useRef(null);
    const [decoded, setDecoded] = useState('');
    const token = localStorage.getItem('jwtToken');
    const [tittle, setTittle] = useState('Чат');
    const [avatar, setAvatar] = useState('Чат');
    const [imageMerger, setImageMerger] = useState(false);
    const [chatOverView, ] = useState(true);
    const [files, setFiles] = useState([]);
    const [ids, setIds] = useState([]);
    const [id, setId] = useState([]);
    const [contexMenuVisible, setcontexMenuVisible] = useState(false);
    const [page,setPage ] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const { setUpdateValue, setIdUpdatedValue, chatId } = useContext(ChatCon);
    const { color } = useContext(Theme);

    const deletedId = useSelector((state) => state.delete_mes.value); // Доступ к состоянию

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState('');

    const chatContainerRef = useRef(null);
    const fetchData = async () => {
        try {
            const response = await $api.get(`/api/getid`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const user = await response.data;
            setName(user.id);
        } catch (error) {
            console.error('Error:', error);
        }
    };


    useEffect(() => {
        console.log("Следующая страница: " +page)
        const container = chatContainerRef.current;
        if(page!==1)
            loadMessages(page).then(r => {


           });
    }, [page]);

    useEffect(() => {

            console.log("сообщение на удаление дошло " + deletedId)
            setMessages(prevMessages =>
                prevMessages.filter(message => message.id !== deletedId)
            );

    }, [deletedId]);
    const  loadMessagesFirst = async ()=>{
        try {
            const response = await $api.get(`/apiChats/get_first_messages?chatId=${chatId}`);

            const data = await response.data;


                setMessages(data.reverse());


        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }
    const loadMessages = async (page) => {
        try {
            const lastID = messages && messages.length > 0 ? messages[0].id : 0;
            const response = await $api.get(`/apiChats/get_part_messages?chatId=${chatId}&lastId=${lastID}`,{
            headers: {
                'Content-Type': 'application/json'
            }});

            const data = await response.data;
            if (data.length === 0) {
                setHasMore(false)}
            else {
                setHasMore(true)
                setMessages((prev) => [...data, ...prev]);
            }

        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    };

    async function sendFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await $api.post(`/api/chat_files`, formData, {
                headers: {
                    ChatId: chatId.toString(),
                },
            });

            console.log('File uploaded successfully:', response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
        }

        setFiles([]);
    }

   /* const fetchMessages = async () => {
        try {
            const response = await $api.get(`/apiChats/getMessages/${chatId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const user = await response.data;
            setMessages(user);
        } catch (error) {
            console.error('Error:', error);
        }
    };*/

    useEffect(() => {
        if (chatId) {
            const stompClient = new Client({
                webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: () => {
                    stompClient.subscribe(`/message/chatGet/${chatId}`, (message) => {
                        const parsedMessage = JSON.parse(message.body);
                        setUpdateValue(true);
                        setIdUpdatedValue(parsedMessage.chat.id);
                        setMessages((prevMessages) => [...prevMessages, parsedMessage]);
                    });
                    setIsConnected(true);
                },
            });

            stompClient.activate();
            setClient(stompClient);

            return () => {
                if (stompClient && stompClient.active) {
                    stompClient.deactivate();
                }
            };
        }
    }, [chatId]);

    useEffect(() => {
        fetchData();
        //fetchMessages();
        decodeToken();
    }, []);

    useEffect(() => {
        if (chatId !== 0) {
            fetchData();
            //fetchMessages();


            setPage(1)
            loadMessagesFirst();
            decodeToken();
            tittleImgAndData();
        }
    }, [chatId]);



    function decodeToken() {
        try {
            setDecoded(jwtDecode(token));
            return jwtDecode(token);
        } catch (error) {
            console.error('Ошибка декодирования токена:', error);
            return null;
        }
    }

    const sendMessage = () => {
        if (inputMessage && client.connected && files.length === 0) {
            setUpdateValue(true);
            setIdUpdatedValue(chatId);

            const payload = {
                data: inputMessage,
                id: chatId,
                token: token,
            };

            client.publish({
                destination: '/app/chat',
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json',
                    Authentication: `Bearer ${token}`,
                    ChatId: chatId.toString(),
                },
            });

            setInputMessage('');
        }

        else if (client && client.connected && files.length !== 0) {
            sendFile(files[0]);
        }
    };

    const tittleImgAndData = async () => {
        const response = await $api.get(`/apiChats/getChats/${chatId}`);
        const dat = await response.data;
        if(dat.image!==null) {
            setAvatar(dat.image)
            setImageMerger(false)
        }
        else {
            setImageMerger(true)
            setIds(dat.participants)
        }
        setTittle(dat.name);
    };
 /*  useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);*/
    const handleScroll = () => {
        const chatContainer = chatContainerRef.current;

        if (chatContainer.scrollTop <= 4 && hasMore ) {
            const currentScrollHeight = chatContainer.scrollHeight;

            // Загрузить старые сообщения
            loadMessages().then(() => {
                // Сохранить текущую позицию прокрутки
                chatContainer.scrollTop = chatContainer.scrollHeight - currentScrollHeight;
            });
        }
    };

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);





    const openImageModal = (imageSrc) => {
        setModalImageSrc(imageSrc);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setModalImageSrc('');
    };
    const  handleRightClick=(id)=>{
       setcontexMenuVisible(true);
       setId(id);
    }

    return (
        <div  className={styles.chatContainer}>
            {chatOverView ? (
                <div>
                    <div  className={styles.chatHeader}>
                        { imageMerger? <ImageMerger chatIds={ids} stylesFrom={true}/>: <img className={styles.img_сhat} src={avatar} alt={"Photo"}/>}
                        <strong className={styles.title_chat}>{tittle}</strong>
                        </div>
                    <div ref={chatContainerRef} className={!color ? styles.chatWindow : styles.chatWindowLight}>

                        {messages.length > 0 ? (
                            messages.map((msg, index) => {
                                const currentDate = new Date(msg.timestamp).toLocaleDateString('ru-RU');
                                const prevDate =
                                    index > 0
                                        ? new Date(messages[index - 1].timestamp).toLocaleDateString('ru-RU')
                                        : null;

                                const isNewDay = currentDate !== prevDate;
                                return (
                                    <React.Fragment key={index}>
                                        {isNewDay && (
                                            <div className={styles.dateDivider}>
                                                <span>{currentDate}</span>
                                            </div>
                                        )}
                                        <div
                                            className={`${styles.chatMessage} ${
                                                msg.sender === decoded.id ? styles.user : styles.other
                                            }`}
                                            onContextMenu={(e) => {
                                                e.preventDefault(); // Отключить стандартное контекстное меню
                                                handleRightClick(msg.id); // Ваша функция
                                            }}
                                        >{contexMenuVisible && msg.id ===id ?<MenuForRedaction msg={msg} styles={styles}/>:<div/>}
                                            <strong className={`${styles.senderOther}`}>
                                                {msg.sender === decoded.id && msg ? '' : msg.nameUser + ':'}
                                            </strong>
                                            <div className={styles.messageContent}>
                                                {msg.links && msg.links.length > 0 ? (
                                                    <div className={styles.imageFrame}>
                                                        <img
                                                            src={`${backendUrl}/api/chat/get_file/${msg.links[0]}`}
                                                            alt="Uploaded file"
                                                            className={styles.chatImage}
                                                            onClick={() =>
                                                                openImageModal(
                                                                    `${backendUrl}/api/chat/get_file/${msg.links[0]}`
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    msg.content || <i>No content</i>
                                                )}
                                            </div>
                                            <div className={styles.messageTimestamp}>
                                                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}

                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <div></div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {chatId !== 0 && (
                        <div className={styles.chatInput}>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Введите сообщение..."
                                className={styles.messageInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />

                            <label htmlFor="file" className={styles.fileInputLabel}>
                                <img
                                    src="https://avatars.mds.yandex.net/i?id=81fe73c0f89760990c5cf80119d4c8a226060f9a-4936013-images-thumbs&n=13"
                                    alt="Upload"
                                    className={styles.fileIcon}
                                />
                            </label>
                            <input
                                type="file"
                                id="file"
                                className={styles.hiddenInput}
                                onChange={(e) =>
                                    setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files)])
                                }
                            />

                            <button onClick={sendMessage} className={styles.sendButton}>
                                Отправить
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div></div>
            )}

            {isImageModalOpen && (
                <div className={styles.modalOverlay} onClick={closeImageModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={modalImageSrc}
                            alt="Original size"
                            className={styles.modalImage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messenger;
