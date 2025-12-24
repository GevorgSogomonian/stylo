package com.example.stylo.service;

import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.google.genai.Client;
import com.google.genai.types.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class MannequinDresserService {

  private static final String MODEL_NAME = "gemini-2.5-flash-image";
  private static final String GENERATED_IMAGE_CATEGORY = "generated-vto";

  private final MinioService imageService;
  private final String apiKey;
  private final String baseUrl;
  private final String promptText;

  public MannequinDresserService(MinioService imageService,
                                 @Value("${stylo.ai.google-key}") String apiKey,
                                 @Value("${stylo.ai.base-url}") String baseUrl,
                                 @Value("${stylo.ai.prompt}") String promptText) {
    this.imageService = imageService;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.promptText = promptText;
  }

  public Photo processVirtualTryOn(String mannequinImageName, List<String> clothingImageNames, User user) {
    HttpOptions httpOptions = HttpOptions.builder()
        .baseUrl(baseUrl)
        .build();

    try (Client client = Client.builder()
        .apiKey(apiKey)
        .httpOptions(httpOptions)
        .build()) {

      // 1. Конфигурация
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("IMAGE") // Только картинка на выходе
          .temperature(0.4f) // Точность важнее креативности
          .imageConfig(ImageConfig.builder()
              .aspectRatio("3:4") // Журнальное соотношение сторон
              .build())
          .build();

      // 2. Сборка частей запроса (List<Part>)
      List<Part> requestParts = new ArrayList<>();

      // A. Промпт (Инструкция)
      requestParts.add(Part.fromText(promptText));

      // B. Манекен
      byte[] mannequinBytes = loadBytesFromService(mannequinImageName);
      requestParts.add(Part.fromText("[MANNEQUIN]:"));
      requestParts.add(Part.fromBytes(mannequinBytes, "image/png"));

      // C. Одежда (Цикл)
      for (int i = 0; i < clothingImageNames.size(); i++) {
        String clothName = clothingImageNames.get(i);
        byte[] clothBytes = loadBytesFromService(clothName);

        requestParts.add(Part.fromText("[CLOTHING_ITEM_" + (i + 1) + "]:"));
        requestParts.add(Part.fromBytes(clothBytes, "image/png"));
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

  private Photo saveResultToMinio(GenerateContentResponse response, User user, String originalFilename)
      throws Exception {
    if (response.parts() == null || response.parts().isEmpty()) {
      System.out.println("Ответ пустой.");
      return null;
    }

    for (Part part : response.parts()) {
      if (part.inlineData().isPresent()) {
        var blob = part.inlineData().get();
        if (blob.data().isPresent()) {
          byte[] imageBytes = blob.data().get();
          String newFilename = "vto_result_" + originalFilename;
          return imageService.uploadImage(imageBytes, newFilename, user, GENERATED_IMAGE_CATEGORY);
        }
      }
    }
    return null;
  }

  private byte[] loadBytesFromService(String objectName) throws IOException {
    InputStream is;
    try {
      is = imageService.downloadImage(objectName);
    } catch (Exception e) {
      throw new IOException("Failed to download image from service: " + objectName, e);
    }

    try (is) {
      if (is == null) {
        throw new IOException("ImageService returned null for: " + objectName);
      }
      return is.readAllBytes();
    }
  }
}