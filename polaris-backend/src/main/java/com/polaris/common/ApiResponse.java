package com.polaris.common;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private LocalDateTime timestamp;
    private T data;

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<T>(
                true,
                message,
                LocalDateTime.now(),
                data
        );
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<T>(
                true,
                message,
                LocalDateTime.now(),
                null
        );
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<T>(
                false,
                message,
                LocalDateTime.now(),
                null
        );
    }
}