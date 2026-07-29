package com.polaris.service.impl;

import com.polaris.dto.AuthorizeExtensionRequest;
import com.polaris.dto.ExtensionAuthStatusResponse;
import com.polaris.entity.ExtensionPairing;
import com.polaris.entity.User;
import com.polaris.exception.ResourceNotFoundException;
import com.polaris.repository.ExtensionPairingRepository;
import com.polaris.repository.UserRepository;
import com.polaris.security.CustomUserDetailsService;
import com.polaris.security.JwtUtil;
import com.polaris.service.ExtensionAuthService;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExtensionAuthServiceImpl implements ExtensionAuthService {

    private final ExtensionPairingRepository extensionPairingRepository;
    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    public ExtensionAuthServiceImpl(ExtensionPairingRepository extensionPairingRepository,
                                    UserRepository userRepository,
                                    CustomUserDetailsService userDetailsService,
                                    JwtUtil jwtUtil) {
        this.extensionPairingRepository = extensionPairingRepository;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public ExtensionAuthStatusResponse authorizeExtension(AuthorizeExtensionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
        String extensionToken = jwtUtil.generateToken(userDetails);

        Optional<ExtensionPairing> pairingOpt = extensionPairingRepository.findByDeviceId(request.getDeviceId());
        ExtensionPairing pairing;
        if (pairingOpt.isPresent()) {
            pairing = pairingOpt.get();
            pairing.setUser(user);
            pairing.setExtensionToken(extensionToken);
            pairing.setStatus("AUTHORIZED");
            pairing.setCreatedAt(LocalDateTime.now());
        } else {
            pairing = ExtensionPairing.builder()
                    .deviceId(request.getDeviceId())
                    .user(user)
                    .extensionToken(extensionToken)
                    .status("AUTHORIZED")
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        pairing = extensionPairingRepository.save(pairing);

        String studentName = (user.getFirstName() != null ? user.getFirstName() : "") +
                (user.getLastName() != null ? " " + user.getLastName() : "");
        if (studentName.trim().isEmpty()) {
            studentName = user.getEmail();
        }

        return ExtensionAuthStatusResponse.builder()
                .authorized(true)
                .token(extensionToken)
                .email(user.getEmail())
                .studentName(studentName.trim())
                .studentId(user.getId())
                .deviceId(request.getDeviceId())
                .role(user.getRole() != null ? user.getRole().name() : "STUDENT")
                .authTimestamp(pairing.getCreatedAt() != null ? pairing.getCreatedAt().toString() : java.time.LocalDateTime.now().toString())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ExtensionAuthStatusResponse checkAuthStatus(String deviceId) {
        if (deviceId == null || deviceId.trim().isEmpty()) {
            return ExtensionAuthStatusResponse.builder().authorized(false).build();
        }

        Optional<ExtensionPairing> pairingOpt = extensionPairingRepository.findByDeviceId(deviceId.trim());
        if (pairingOpt.isPresent()) {
            ExtensionPairing pairing = pairingOpt.get();
            if ("AUTHORIZED".equalsIgnoreCase(pairing.getStatus())) {
                User user = pairing.getUser();
                String studentName = (user.getFirstName() != null ? user.getFirstName() : "") +
                        (user.getLastName() != null ? " " + user.getLastName() : "");
                if (studentName.trim().isEmpty()) {
                    studentName = user.getEmail();
                }

                return ExtensionAuthStatusResponse.builder()
                        .authorized(true)
                        .token(pairing.getExtensionToken())
                        .email(user.getEmail())
                        .studentName(studentName.trim())
                        .studentId(user.getId())
                        .deviceId(pairing.getDeviceId())
                        .role(user.getRole() != null ? user.getRole().name() : "STUDENT")
                        .authTimestamp(pairing.getCreatedAt() != null ? pairing.getCreatedAt().toString() : java.time.LocalDateTime.now().toString())
                        .build();
            }
        }

        return ExtensionAuthStatusResponse.builder().authorized(false).build();
    }
}
