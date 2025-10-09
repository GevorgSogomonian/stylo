import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL;
export const API_URL = backendUrl

const $api = axios.create({
    withCredentials: true,
    baseURL: API_URL
})

$api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('jwtToken')}`
    return config;
})

$api.interceptors.response.use(
    (config) => {
        return config;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && error.config && !error.config._isRetry) {
            originalRequest._isRetry = true;
            try {
                // Получаем refreshToken из localStorage
                const refreshToken = localStorage.getItem('refreshToken');

                // Выполняем запрос на обновление токена
                const response = await axios.post(
                    `${API_URL}/refresh-token`,
                    { token: refreshToken }, // Тело запроса
                    { withCredentials: true } // Обязательно для кук
                );

                // Сохраняем новый токен в localStorage
                localStorage.setItem('jwtToken', response.data.token);

                // Повторяем оригинальный запрос с новым токеном
                return $api.request(originalRequest);
            } catch (e) {
                console.log('НЕ АВТОРИЗОВАН');
            }
        }
        throw error;
    }
);

export default $api;