package com.polaris.controller;

import com.polaris.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Void>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success("Polaris Backend Running"));
    }
}
