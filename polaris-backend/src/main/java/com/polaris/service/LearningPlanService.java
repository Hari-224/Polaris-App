package com.polaris.service;

import com.polaris.dto.CreateDayRequest;
import com.polaris.dto.CreateLearningPlanRequest;
import com.polaris.dto.LearningPlanDayResponse;
import com.polaris.dto.LearningPlanResponse;
import com.polaris.dto.UpdateLearningPlanRequest;
import com.polaris.dto.UpdateResourceRequest;
import java.util.List;

public interface LearningPlanService {

    LearningPlanResponse createPlan(CreateLearningPlanRequest request, String userEmail);

    List<LearningPlanResponse> getUserPlans(String userEmail);

    LearningPlanResponse getPlanDetails(Long planId, String userEmail);

    LearningPlanResponse updatePlan(Long planId, UpdateLearningPlanRequest request, String userEmail);

    void deletePlan(Long planId, String userEmail);

    LearningPlanDayResponse addDay(Long planId, CreateDayRequest request, String userEmail);

    LearningPlanDayResponse updateDay(Long planId, Long dayId, CreateDayRequest request, String userEmail);

    LearningPlanResponse markDayCompleted(Long planId, Long dayId, boolean completed, String userEmail);

    void deleteDay(Long planId, Long dayId, String userEmail);

    // Phase 6 Extensions
    LearningPlanDayResponse updateDayResource(Long planId, Long dayId, UpdateResourceRequest request, String userEmail);
}
