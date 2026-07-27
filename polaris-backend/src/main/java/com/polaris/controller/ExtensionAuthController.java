package com.polaris.controller;

import com.polaris.common.ApiResponse;
import com.polaris.dto.AuthorizeExtensionRequest;
import com.polaris.dto.ExtensionAuthStatusResponse;
import com.polaris.service.ExtensionAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/extension")
public class ExtensionAuthController {

    private final ExtensionAuthService extensionAuthService;

    public ExtensionAuthController(ExtensionAuthService extensionAuthService) {
        this.extensionAuthService = extensionAuthService;
    }

    @PostMapping("/authorize")
    public ResponseEntity<ApiResponse<ExtensionAuthStatusResponse>> authorizeExtension(
            @Valid @RequestBody AuthorizeExtensionRequest request,
            Authentication authentication
    ) {
        ExtensionAuthStatusResponse response = extensionAuthService.authorizeExtension(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Extension authorized successfully", response));
    }

    @GetMapping("/auth-status")
    public ResponseEntity<ApiResponse<ExtensionAuthStatusResponse>> checkAuthStatus(
            @RequestParam(name = "deviceId", required = false) String deviceId
    ) {
        ExtensionAuthStatusResponse response = extensionAuthService.checkAuthStatus(deviceId);
        return ResponseEntity.ok(ApiResponse.success("Auth status retrieved", response));
    }
}
