package com.polaris.controller;

import com.polaris.common.ApiResponse;
import com.polaris.dto.EndFocusRequest;
import com.polaris.dto.FocusSessionResponse;
import com.polaris.dto.StartFocusRequest;
import com.polaris.dto.TrackingActivityRequest;
import com.polaris.dto.TrackingResourceRequest;
import com.polaris.dto.TrackingSessionRequest;
import com.polaris.service.FocusTrackingService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FocusTrackingController {

    private final FocusTrackingService focusTrackingService;

    public FocusTrackingController(FocusTrackingService focusTrackingService) {
        this.focusTrackingService = focusTrackingService;
    }

    @PostMapping("/focus/start")
    public ResponseEntity<ApiResponse<FocusSessionResponse>> startFocusSession(
            @RequestBody(required = false) StartFocusRequest request,
            Authentication authentication
    ) {
        FocusSessionResponse response = focusTrackingService.startFocusSession(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Focus Session started successfully", response));
    }

    @PostMapping("/focus/end")
    public ResponseEntity<ApiResponse<FocusSessionResponse>> endFocusSession(
            @RequestBody(required = false) EndFocusRequest request,
            Authentication authentication
    ) {
        FocusSessionResponse response = focusTrackingService.endFocusSession(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Focus Session ended successfully", response));
    }

    @GetMapping("/focus/active")
    public ResponseEntity<ApiResponse<FocusSessionResponse>> getActiveFocusSession(
            Authentication authentication
    ) {
        FocusSessionResponse response = focusTrackingService.getActiveFocusSession(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Active Focus Session retrieved", response));
    }

    @GetMapping("/extension/context")
    public ResponseEntity<ApiResponse<com.polaris.dto.ExtensionContextResponse>> getExtensionContext(
            Authentication authentication
    ) {
        com.polaris.dto.ExtensionContextResponse response = focusTrackingService.getExtensionContext(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Extension context retrieved", response));
    }

    @PostMapping("/tracking/session")
    public ResponseEntity<ApiResponse<Void>> trackSession(
            @RequestBody TrackingSessionRequest request,
            Authentication authentication
    ) {
        focusTrackingService.trackSession(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Session tracking data recorded"));
    }

    @PostMapping("/tracking/resource")
    public ResponseEntity<ApiResponse<Void>> trackResource(
            @RequestBody TrackingResourceRequest request,
            Authentication authentication
    ) {
        focusTrackingService.trackResource(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Resource tracking data recorded"));
    }

    @PostMapping("/tracking/activity")
    public ResponseEntity<ApiResponse<Void>> trackActivity(
            @RequestBody TrackingActivityRequest request,
            Authentication authentication
    ) {
        focusTrackingService.trackActivity(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Activity tracking data recorded"));
    }

    @PostMapping("/tracking/activity/batch")
    public ResponseEntity<ApiResponse<Void>> trackActivityBatch(
            @RequestBody List<TrackingActivityRequest> requests,
            Authentication authentication
    ) {
        focusTrackingService.trackActivityBatch(requests, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Batch activity tracking data recorded"));
    }

    @PostMapping("/tracking/resource/batch")
    public ResponseEntity<ApiResponse<Void>> trackResourceBatch(
            @RequestBody List<TrackingResourceRequest> requests,
            Authentication authentication
    ) {
        focusTrackingService.trackResourceBatch(requests, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Batch resource tracking data recorded"));
    }
}
