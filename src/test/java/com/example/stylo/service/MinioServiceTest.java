package com.example.stylo.service;

import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.repository.PhotoRepository;
import io.minio.*;
import io.minio.errors.MinioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MinioServiceTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private PhotoRepository photoRepository;

    @InjectMocks
    private MinioService minioService;

    private final String testBucketName = "test-bucket";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(minioService, "bucketName", testBucketName);
    }

    @Test
    void uploadImage_shouldUploadAndSavePhotoMetadata() throws Exception {
        byte[] imageData = "test_image_data".getBytes();
        User testUser = new User();
        testUser.setId(1L);
        String originalFilename = "my_image.jpg";
        String category = "test-category";

        when(minioClient.putObject(any(PutObjectArgs.class))).thenReturn(mock(ObjectWriteResponse.class));

        String resultFileName = minioService.uploadImage(imageData, originalFilename, testUser, category);

        assertNotNull(resultFileName);
        // Verify putObject call
        ArgumentCaptor<PutObjectArgs> putObjectArgsCaptor = ArgumentCaptor.forClass(PutObjectArgs.class);
        verify(minioClient, times(1)).putObject(putObjectArgsCaptor.capture());
        PutObjectArgs capturedPutObjectArgs = putObjectArgsCaptor.getValue();
        assertEquals(testBucketName, capturedPutObjectArgs.bucket());
        assertEquals("image/png", capturedPutObjectArgs.contentType());
        assertNotNull(capturedPutObjectArgs.object());

        // Verify photoRepository.save call
        ArgumentCaptor<Photo> photoCaptor = ArgumentCaptor.forClass(Photo.class);
        verify(photoRepository, times(1)).save(photoCaptor.capture());
        Photo capturedPhoto = photoCaptor.getValue();
        assertEquals(testUser, capturedPhoto.getUser());
        assertEquals(category, capturedPhoto.getCategory());
        assertEquals(resultFileName, capturedPhoto.getFilename());
    }

    @Test
    void downloadImage_shouldReturnInputStream() throws Exception {
        String objectName = "test-object.png";
        
        // Mock GetObjectResponse
        GetObjectResponse mockGetObjectResponse = mock(GetObjectResponse.class);
        
        when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(mockGetObjectResponse);

        InputStream resultStream = minioService.downloadImage(objectName);

        assertNotNull(resultStream);
        assertEquals(mockGetObjectResponse, resultStream); // Should return the same mock stream
        verify(minioClient, times(1)).getObject(any(GetObjectArgs.class));
    }

    @Test
    void getContentType_shouldReturnCorrectContentType() throws Exception {
        String objectName = "test-object.png";
        StatObjectResponse mockStatResponse = mock(StatObjectResponse.class);

        when(mockStatResponse.contentType()).thenReturn("image/png");
        when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(mockStatResponse);

        String contentType = minioService.getContentType(objectName);

        assertEquals("image/png", contentType);
        verify(minioClient, times(1)).statObject(any(StatObjectArgs.class));
    }

    @Test
    void deleteImage_shouldRemoveObject() throws Exception {
        String objectName = "test-object.png";
        String bucket = "my-bucket";

        // Mock nothing, as removeObject returns void
        minioService.deleteImage(bucket, objectName);

        // Verify removeObject call
        ArgumentCaptor<RemoveObjectArgs> removeObjectArgsCaptor = ArgumentCaptor.forClass(RemoveObjectArgs.class);
        verify(minioClient, times(1)).removeObject(removeObjectArgsCaptor.capture());
        RemoveObjectArgs capturedRemoveObjectArgs = removeObjectArgsCaptor.getValue();
        assertEquals(bucket, capturedRemoveObjectArgs.bucket());
        assertEquals(objectName, capturedRemoveObjectArgs.object());
    }
}