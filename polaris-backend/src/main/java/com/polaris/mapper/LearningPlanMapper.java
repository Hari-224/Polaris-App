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

    public static String cleanseUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        if (url.contains("youtube.com/results") || url.contains("search_query=")) {
            return null;
        }
        return url.trim();
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

        String resourceUrl = cleanseUrl(day.getSelectedResourceUrl());
        String resumeUrl = cleanseUrl(day.getResumeUrl());

        if (resumeUrl == null && day.getVideoId() != null && !day.getVideoId().trim().isEmpty()) {
            resumeUrl = "https://www.youtube.com/watch?v=" + day.getVideoId();
            if (day.getLastWatchPosition() != null && day.getLastWatchPosition() > 0) {
                resumeUrl += "&t=" + day.getLastWatchPosition();
            }
        } else if (resumeUrl == null) {
            resumeUrl = resourceUrl;
        }

        if (resourceUrl == null && day.getVideoId() != null && !day.getVideoId().trim().isEmpty()) {
            resourceUrl = "https://www.youtube.com/watch?v=" + day.getVideoId();
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
                .selectedResourceUrl(resourceUrl)
                .selectedResourceTitle(day.getSelectedResourceTitle())
                .resumeUrl(resumeUrl)
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
