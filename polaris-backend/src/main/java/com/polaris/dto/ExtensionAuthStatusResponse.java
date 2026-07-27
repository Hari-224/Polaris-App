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
    private String email;
    private String studentName;
    private String role;
}
