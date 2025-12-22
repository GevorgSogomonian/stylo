package com.example.stylo;

import com.example.stylo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.boot.test.mock.mockito.MockBean;

import io.minio.MinioClient;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;


@ActiveProfiles("test")
@SpringBootTest
class StyloApplicationTests {

	@MockBean
	private MinioClient minioClient;
	@MockBean
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

}