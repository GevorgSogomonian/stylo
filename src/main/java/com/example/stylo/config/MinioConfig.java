package com.example.stylo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class MinioConfig {

  @Value("${minio.url}")
  private String url;

  @Value("${minio.accessKey}")
  private String accessKey;

  @Value("${minio.secretKey}")
  private String secretKey;

  @Value("${minio.bucketName}")
  private String bucketName;

  @Bean
  public MinioClient minioClient() {

    log.info(url);
    MinioClient minioClient = MinioClient.builder()
        .endpoint(url)
        .credentials(accessKey, secretKey)
        .build();

    ensureBucketExists(minioClient, bucketName);

    return minioClient;
  }

  private void ensureBucketExists(MinioClient minioClient, String bucketName) {
    try {
      boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
          .bucket(bucketName)
          .build());

      if (!bucketExists) {
        minioClient.makeBucket(MakeBucketArgs.builder()
            .bucket(bucketName)
            .build());
        System.out.println("Bucket '" + bucketName + "' created successfully.");
      } else {
        System.out.println("Bucket '" + bucketName + "' already exists.");
      }
    } catch (Exception e) {
      System.err.println("Error occurred while ensuring bucket existence: " + e.getMessage());
      e.printStackTrace();
    }
  }
}
