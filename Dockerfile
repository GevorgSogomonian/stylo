# Этап 1: Сборка приложения с Maven (JDK для компиляции)
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /opt/app

# Копируем wrapper, pom и .mvn для кэширования зависимостей
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# Копируем исходники и собираем JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Этап 2: Runtime (JRE для запуска, копируем JAR из builder)
FROM eclipse-temurin:21-jre
WORKDIR /opt/app

# Копируем собранный JAR
COPY --from=builder /opt/app/target/*.jar app.jar

# Экспонируем порт, запускаем приложение
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
