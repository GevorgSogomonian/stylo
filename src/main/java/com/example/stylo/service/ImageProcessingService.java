package com.example.stylo.service;

import net.coobird.thumbnailator.Thumbnails;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ImageProcessingService {
  private final RestClient restClient;
  private final Integer maxFileSize;

  // Внедряем URL из конфига: rembg.url=http://rembg:5000
  public ImageProcessingService(@Value("${rembg.url}") String rembgUrl,
      @Value("${thumbnailator.max-image-size}") Integer maxFileSize) {
    this.maxFileSize = maxFileSize;
    this.restClient = RestClient.builder()
        .baseUrl(rembgUrl)
        .build();
  }

  public byte[] removeBackground(byte[] originalImageBytes) {
    // Формируем multipart/form-data
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", new ByteArrayResource(originalImageBytes) {
      @Override
      public String getFilename() {
        // Имя файла должно быть, иначе rembg может отвергнуть запрос
        return "image.png";
      }
    });
    // Можно добавить параметры, например, model для выбора u2netp
    body.add("model", "u2netp");

    return restClient.post()
        .uri("/api/remove")
        .contentType(MediaType.MULTIPART_FORM_DATA)
        .body(body)
        .retrieve()
        .body(byte[].class);
  }

  /**
   * Принимает любой формат (JPG, WebP, BMP), конвертирует в PNG
   * и уменьшает, если изображение слишком большое.
   */
  public byte[] prepareImageForRembg(byte[] inputBytes, int targetMaxSize) {
    try (ByteArrayInputStream bais = new ByteArrayInputStream(inputBytes);
        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      // Создаем билдер
      var builder = Thumbnails.of(bais);

      // 1. Принудительная конвертация в PNG (нужен для прозрачности)
      builder.outputFormat("png");

      // 2. Считываем метаданные без полной загрузки картинки, чтобы узнать размер
      // (Thumbnailator делает это лениво, но для логики scale/size лучше задать явно)
      // В простом варианте можно просто задать size - библиотека не растянет,
      // если картинка меньше, но для надежности:

      // Просто указываем .size().
      // Thumbnailator по умолчанию НЕ увеличивает картинку (upscaling выключен),
      // если она меньше targetMaxSize. Он просто сохранит её 1:1.
      builder.size(targetMaxSize, targetMaxSize);

      // 3. Запись в поток
      builder.toOutputStream(baos);

      return baos.toByteArray();

    } catch (IOException e) {
      throw new RuntimeException("Ошибка обработки изображения: возможно поврежденный файл или неподдерживаемый формат",
          e);
    }
  }

  public byte[] processUserImage(byte[] rawBytes) {
    // 1. Нормализация: любой формат -> PNG + Resize
    byte[] normalizedPng = prepareImageForRembg(rawBytes, maxFileSize);

    // 2. Удаление фона (отправляем чистый PNG)
    return removeBackground(normalizedPng);
  }
}
