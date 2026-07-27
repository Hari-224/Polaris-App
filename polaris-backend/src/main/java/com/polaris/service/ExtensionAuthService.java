package com.polaris.service;

import com.polaris.dto.AuthorizeExtensionRequest;
import com.polaris.dto.ExtensionAuthStatusResponse;

public interface ExtensionAuthService {
    ExtensionAuthStatusResponse authorizeExtension(AuthorizeExtensionRequest request, String userEmail);
    ExtensionAuthStatusResponse checkAuthStatus(String deviceId);
}
