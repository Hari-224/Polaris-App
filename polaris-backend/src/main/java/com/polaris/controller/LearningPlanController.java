package com.polaris.controller;

import com.polaris.common.ApiResponse;
import com.polaris.dto.CompleteDayRequest;
import com.polaris.dto.CreateDayRequest;
import com.polaris.dto.CreateLearningPlanRequest;
import com.polaris.dto.LearningPlanDayResponse;
import com.polaris.dto.LearningPlanResponse;
import com.polaris.dto.UpdateLearningPlanRequest;
import com.polaris.dto.UpdateResourceRequest;
import com.polaris.service.LearningPlanService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class LearningPlanController {

    private final LearningPlanService learningPlanService;

    public LearningPlanController(LearningPlanService learningPlanService) {
        this.learningPlanService = learningPlanService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LearningPlanResponse>> createPlan(
            @Valid @RequestBody CreateLearningPlanRequest request,
            Authentication authentication
    ) {
        LearningPlanResponse response = learningPlanService.createPlan(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Learning plan created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LearningPlanResponse>>> getUserPlans(Authentication authentication) {
        List<LearningPlanResponse> response = learningPlanService.getUserPlans(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("User plans retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LearningPlanResponse>> getPlanDetails(
            @PathVariable Long id,
            Authentication authentication
    ) {
        LearningPlanResponse response = learningPlanService.getPlanDetails(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Plan details retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LearningPlanResponse>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLearningPlanRequest request,
            Authentication authentication
    ) {
        LearningPlanResponse response = learningPlanService.updatePlan(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Learning plan updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(
            @PathVariable Long id,
            Authentication authentication
    ) {
        learningPlanService.deletePlan(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Learning plan deleted successfully"));
    }

    @PostMapping("/{id}/days")
    public ResponseEntity<ApiResponse<LearningPlanDayResponse>> addDay(
            @PathVariable Long id,
            @Valid @RequestBody CreateDayRequest request,
            Authentication authentication
    ) {
        LearningPlanDayResponse response = learningPlanService.addDay(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Day added successfully", response));
    }

    @PutMapping("/{id}/days/{dayId}")
    public ResponseEntity<ApiResponse<LearningPlanDayResponse>> updateDay(
            @PathVariable Long id,
            @PathVariable Long dayId,
            @Valid @RequestBody CreateDayRequest request,
            Authentication authentication
    ) {
        LearningPlanDayResponse response = learningPlanService.updateDay(id, dayId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Day updated successfully", response));
    }

    @PutMapping("/{id}/days/{dayId}/complete")
    public ResponseEntity<ApiResponse<LearningPlanResponse>> markDayCompleted(
            @PathVariable Long id,
            @PathVariable Long dayId,
            @Valid @RequestBody CompleteDayRequest request,
            Authentication authentication
    ) {
        LearningPlanResponse response = learningPlanService.markDayCompleted(id, dayId, request.getCompleted(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Day completion status updated", response));
    }

    @DeleteMapping("/{id}/days/{dayId}")
    public ResponseEntity<ApiResponse<Void>> deleteDay(
            @PathVariable Long id,
            @PathVariable Long dayId,
            Authentication authentication
    ) {
        learningPlanService.deleteDay(id, dayId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Day deleted successfully"));
    }

    // Phase 6 Extensions
    @PutMapping("/{id}/days/{dayId}/resource")
    public ResponseEntity<ApiResponse<LearningPlanDayResponse>> updateDayResource(
            @PathVariable Long id,
            @PathVariable Long dayId,
            @Valid @RequestBody UpdateResourceRequest request,
            Authentication authentication
    ) {
        LearningPlanDayResponse response = learningPlanService.updateDayResource(id, dayId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Day resource and watch progress updated", response));
    }
}
