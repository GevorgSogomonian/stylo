package com.example.stylo.service;

import com.example.stylo.entity.User;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MannequinDresserService {

  private static final String MODEL_NAME = "gemini-3-pro-image-preview";
  private static final String GENERATED_IMAGE_CATEGORY = "generated-vto";


  private final MinioService imageService;
  private final String apiKey;

  public MannequinDresserService(MinioService imageService,
      @Value("${stylo.ai.google-key}") String apiKey) {
    this.imageService = imageService;
    this.apiKey = apiKey;
  }

  public byte[] processVirtualTryOn(String mannequinImageName, List<String> clothingImageNames, User user) {
    try (Client client = Client.builder().apiKey(apiKey).build()) {

      // 1. Конфигурация
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("IMAGE") // Только картинка на выходе
          .temperature(0.4f) // Точность важнее креативности
          .build();

      // 2. Сборка частей запроса (List<Part>)
      List<Part> requestParts = new ArrayList<>();

      // A. Промпт (Инструкция)
      // Добавляем уточнение про PNG и прозрачность
      String promptText = "You are a professional digital fashion stylist. " +
          "Task: Dress the mannequin shown in [MANNEQUIN] with the clothing items provided. " +
          "Input details: The clothing items have transparent backgrounds (PNG). " +
          "Requirements: " +
          "1. Retain the mannequin's exact pose, body shape, and lighting. " +
          "2. Realistic layering: put items in logical order (e.g. jacket over t-shirt). " +
          "3. High fidelity: keep the texture and details of the clothing exactly as shown. " +
          "4. Output: A single high-quality photo of the dressed mannequin.";

      requestParts.add(Part.fromText(promptText));

      // B. Манекен
      byte[] mannequinBytes = loadBytesFromService(mannequinImageName);
      requestParts.add(Part.fromText("[MANNEQUIN]:"));
      requestParts.add(Part.fromBytes(mannequinBytes, "image/png")); // Допустим, манекен тоже PNG

      // C. Одежда (Цикл)
      for (int i = 0; i < clothingImageNames.size(); i++) {
        String clothName = clothingImageNames.get(i);
        byte[] clothBytes = loadBytesFromService(clothName);

        // Добавляем текстовую метку и само изображение
        requestParts.add(Part.fromText("[CLOTHING_ITEM_" + (i + 1) + "]:"));
        requestParts.add(Part.fromBytes(clothBytes, "image/png")); // Ваши файлы с прозрачным фоном
      }

      // 3. Правильное создание Content из List<Part>
      Content content = Content.builder()
          .parts(requestParts)
          .build();

      // 4. Вызов API
      System.out.println("Отправка запроса с " + clothingImageNames.size() + " предметами...");
      GenerateContentResponse response = client.models.generateContent(
          MODEL_NAME,
          content,
          config);

      // 5. Обработка результата
      return saveResultToMinio(response, user, mannequinImageName);

    } catch (Exception e) {
      System.err.println("Ошибка в процессе примерки: " + e.getMessage());
      e.printStackTrace();
      return null;
    }
  }

  private byte[] saveResultToMinio(GenerateContentResponse response, User user, String originalFilename) throws Exception {
    // Проверяем, есть ли части в ответе
    if (response.parts() == null || response.parts().isEmpty()) {
      System.out.println("Ответ пустой.");
      return null;
    }

    for (Part part : response.parts()) {
      // Проверяем наличие бинарных данных (картинки)
      if (part.inlineData().isPresent()) {
        var blob = part.inlineData().get();
        if (blob.data().isPresent()) {
          byte[] imageBytes = blob.data().get();
          String newFilename = "vto_result_" + originalFilename;
          imageService.uploadImage(imageBytes, newFilename, user, GENERATED_IMAGE_CATEGORY);
          System.out.println("Результат сохранен в Minio: " + newFilename);
          return imageBytes;
        }
      }
    }
    return null;
  }

  private byte[] loadBytesFromService(String objectName) throws IOException {
    // Выносим получение потока из заголовка try-with-resources,
    // чтобы можно было обернуть именно этот вызов в try-catch
    InputStream is;
    try {
      is = imageService.downloadImage(objectName);
    } catch (Exception e) {
      // Оборачиваем общее Exception в IOException или RuntimeException,
      // чтобы сигнатура метода оставалась чистой
      throw new IOException("Failed to download image from service: " + objectName, e);
    }

    // Теперь используем try-with-resources для гарантированного закрытия потока
    try (is) {
      if (is == null) {
        throw new IOException("ImageService returned null for: " + objectName);
      }
      return is.readAllBytes();
    }
  }
}