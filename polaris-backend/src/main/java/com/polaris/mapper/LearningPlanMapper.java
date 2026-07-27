package com.polaris.mapper;

import com.polaris.dto.LearningPlanDayResponse;
import com.polaris.dto.LearningPlanResponse;
import com.polaris.entity.LearningPlan;
import com.polaris.entity.LearningPlanDay;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class LearningPlanMapper {

    private LearningPlanMapper() {
    }

    public static LearningPlanResponse toResponse(LearningPlan plan) {
        if (plan == null) {
            return null;
        }

        List<LearningPlanDayResponse> dayResponses = new ArrayList<>();
        if (plan.getDays() != null) {
            dayResponses = plan.getDays().stream()
                    .map(LearningPlanMapper::toDayResponse)
                    .collect(Collectors.toList());
        }

        return LearningPlanResponse.builder()
                .id(plan.getId())
                .topic(plan.getTopic())
                .numberOfDays(plan.getNumberOfDays())
                .dailyStudyHours(plan.getDailyStudyHours())
                .status(plan.getStatus())
                .completionPercentage(plan.getCompletionPercentage())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .days(dayResponses)
                .build();
    }

    public static LearningPlanDayResponse toDayResponse(LearningPlanDay day) {
        if (day == null) {
            return null;
        }

        List<String> objectivesList = new ArrayList<>();
        if (day.getLearningObjectives() != null && !day.getLearningObjectives().trim().isEmpty()) {
            objectivesList = Arrays.asList(day.getLearningObjectives().split("\n"));
        }

        return LearningPlanDayResponse.builder()
                .id(day.getId())
                .dayNumber(day.getDayNumber())
                .title(day.getTitle())
                .description(day.getDescription())
                .completed(day.getCompleted())
                .completedAt(day.getCompletedAt())
                .learningObjectives(objectivesList)
                .estimatedStudyMinutes(day.getEstimatedStudyMinutes())
                .difficulty(day.getDifficulty())
                .resourceType(day.getResourceType())
                .selectedResourceUrl(day.getSelectedResourceUrl())
                .selectedResourceTitle(day.getSelectedResourceTitle())
                .videoCompleted(day.getVideoCompleted())
                .quizCompleted(day.getQuizCompleted())
                .status(day.getStatus())
                .watchPercentage(day.getWatchPercentage())
                .videoId(day.getVideoId())
                .lastWatchPosition(day.getLastWatchPosition())
                .lastAccessTime(day.getLastAccessTime())
                .build();
    }
}
