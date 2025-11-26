package com.example.stylo.util.image;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.minio.MinioClient;
import io.minio.GetObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.MinioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

  private final MinioClient minioClient;

  @Value("${minio.bucketName}")
  private String bucketName;

  /**
   * Upload a pre-processed image provided as bytes to MinIO and return the
   * generated object name.
   * The image is stored with contentType image/png.
   *
   * @param data             image bytes (expected PNG)
   * @param originalFilename original filename used to compose stored name
   * @return object name stored in MinIO
   * @throws Exception on MinIO errors
   */
  public String uploadImage(byte[] data, String originalFilename) throws Exception {
    // Normalize filename to use .png extension because processed images are PNG
    String baseName = (originalFilename != null) ? originalFilename : "image";
    int idx = baseName.lastIndexOf('.');
    if (idx > 0) {
      baseName = baseName.substring(0, idx);
    }
    String fileName = UUID.randomUUID() + "-" + baseName + ".png";

    try (ByteArrayInputStream bais = new ByteArrayInputStream(data)) {
      log.info(String.format("Storing processed image: size=%d name=%s", data.length, fileName));
      minioClient.putObject(
          PutObjectArgs.builder()
              .bucket(bucketName)
              .object(fileName)
              .stream(bais, data.length, -1)
              .contentType("image/png")
              .build());
    }

    return fileName;
  }

  /**
   * Download an object from MinIO as an InputStream.
   *
   * @param objectName object name in the configured bucket
   * @return InputStream of the object's data
   * @throws Exception on MinIO errors
   */
  public InputStream downloadImage(String objectName) throws Exception {
    return minioClient.getObject(
        GetObjectArgs.builder()
            .bucket(bucketName)
            .object(objectName)
            .build());
  }

  /**
   * Retrieve the stored content type for an object in MinIO.
   *
   * @param objectName object name in the configured bucket
   * @return MIME content type as stored in MinIO or null if not available
   * @throws Exception on MinIO errors
   */
  public String getContentType(String objectName) throws Exception {
    return minioClient.statObject(
        StatObjectArgs.builder()
            .bucket(bucketName)
            .object(objectName)
            .build())
        .contentType();
  }

  /**
   * Remove an object from MinIO.
   * Note: this method accepts a bucketName parameter allowing removal from
   * non-default buckets.
   *
   * @param bucketName the bucket containing the object
   * @param objecUrl   the object name to remove
   */
  public void deleteImage(String bucketName, String objecUrl) {
    try {
      minioClient.removeObject(RemoveObjectArgs.builder()
          .bucket(bucketName)
          .object(objecUrl)
          .build());
      System.out.println("Изображение успешно удалено из MinIO: " + objecUrl);
    } catch (MinioException e) {
      e.printStackTrace();
      System.err.println("Ошибка при удалении изображения из MinIO: " + e.getMessage());
    } catch (Exception e) {
      e.printStackTrace();
      System.err.println("Неизвестная ошибка при удалении изображения из MinIO.");
    }
  }
}
