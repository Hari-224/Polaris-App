package com.polaris.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtensionAuthStatusResponse {
    private boolean authorized;
    private String token;
    private String refreshToken;
    private String email;
    private String studentName;
    private Long studentId;
    private String deviceId;
    private String role;
    private String authTimestamp;
}
