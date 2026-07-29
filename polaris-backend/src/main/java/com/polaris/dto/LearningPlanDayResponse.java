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
public class LearningPlanDayResponse {
    private Long id;
    private Integer dayNumber;
    private String title;
    private String description;
    private Boolean completed;
    private LocalDateTime completedAt;

    // Phase 6 Extensions
    private List<String> learningObjectives;
    private Integer estimatedStudyMinutes;
    private String difficulty;
    private String resourceType;
    private String selectedResourceUrl;
    private String selectedResourceTitle;
    private String resumeUrl;
    private Boolean videoCompleted;
    private Boolean quizCompleted;
    private String status;
    private Integer watchPercentage;
    private String videoId;
    private Integer lastWatchPosition;
    private LocalDateTime lastAccessTime;
}
