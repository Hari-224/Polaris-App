package com.polaris.mapper;

import com.polaris.dto.LearningSessionResponse;
import com.polaris.entity.LearningSession;

public class LearningSessionMapper {

    private LearningSessionMapper() {
    }

    public static LearningSessionResponse toResponse(LearningSession session) {
        if (session == null) {
            return null;
        }

        return LearningSessionResponse.builder()
                .id(session.getId())
                .dayId(session.getLearningPlanDay() != null ? session.getLearningPlanDay().getId() : null)
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .activeLearningTime(session.getActiveLearningTime())
                .idleTime(session.getIdleTime())
                .focusedTime(session.getFocusedTime())
                .website(session.getWebsite())
                .resourceUrl(session.getResourceUrl())
                .learningTopic(session.getLearningTopic())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
