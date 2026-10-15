package com.meridian.sam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SamApplication {
    public static void main(String[] args) {
        SpringApplication.run(SamApplication.class, args);
    }
}
