package com.example.stylo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application entry point for the Stylo web application.
 * Responsible for bootstrapping the Spring application context.
 */
@SpringBootApplication
public class StyloApplication {

/**
   * Bootstrap the Spring Boot application.
   *
   * @param args application arguments passed from the command line
   */
  public static void main(String[] args) {
    SpringApplication.run(StyloApplication.class, args);
  }

}
