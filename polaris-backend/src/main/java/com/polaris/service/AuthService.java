package com.polaris.service;

import com.polaris.dto.AuthenticationResponse;
import com.polaris.dto.LoginRequest;
import com.polaris.dto.RegisterRequest;
import com.polaris.dto.UserResponseDto;

public interface AuthService {

    AuthenticationResponse register(RegisterRequest request);

    AuthenticationResponse login(LoginRequest request);

    UserResponseDto getCurrentUser(String email);
}
