# Используем официальный образ Node.js в качестве базового
FROM node:20 AS build

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта в рабочую директорию
COPY . .

# Собираем проект (опционально)
# RUN npm run build

# Открываем порт 3000 для доступа к приложению
EXPOSE 3000

# Запускаем React-приложение
CMD ["npm", "start"]
