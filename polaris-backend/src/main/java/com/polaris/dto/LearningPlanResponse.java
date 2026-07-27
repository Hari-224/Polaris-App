package com.polaris.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanResponse {
    private Long id;
    private String topic;
    private Integer numberOfDays;
    private Integer dailyStudyHours;
    private String status;
    private Double completionPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LearningPlanDayResponse> days;
}
