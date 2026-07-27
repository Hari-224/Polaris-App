package com.polaris.controller;

import com.polaris.common.ApiResponse;
import com.polaris.dto.CreateSessionRequest;
import com.polaris.dto.LearningSessionResponse;
import com.polaris.service.LearningSessionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LearningSessionController {

    private final LearningSessionService learningSessionService;

    public LearningSessionController(LearningSessionService learningSessionService) {
        this.learningSessionService = learningSessionService;
    }

    @PostMapping("/plans/days/{dayId}/sessions")
    public ResponseEntity<ApiResponse<LearningSessionResponse>> recordSession(
            @PathVariable Long dayId,
            @Valid @RequestBody CreateSessionRequest request,
            Authentication authentication
    ) {
        LearningSessionResponse response = learningSessionService.recordSession(dayId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Learning session recorded successfully", response));
    }

    @GetMapping("/plans/days/{dayId}/sessions")
    public ResponseEntity<ApiResponse<List<LearningSessionResponse>>> getSessionsByDay(
            @PathVariable Long dayId,
            Authentication authentication
    ) {
        List<LearningSessionResponse> response = learningSessionService.getSessionsByDay(dayId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Day study sessions retrieved successfully", response));
    }

    @GetMapping("/plans/sessions")
    public ResponseEntity<ApiResponse<List<LearningSessionResponse>>> getUserSessions(Authentication authentication) {
        List<LearningSessionResponse> response = learningSessionService.getUserSessions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("User learning sessions retrieved successfully", response));
    }
}
