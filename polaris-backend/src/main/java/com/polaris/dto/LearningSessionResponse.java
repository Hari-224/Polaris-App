package com.polaris.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningSessionResponse {
    private Long id;
    private Long dayId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer activeLearningTime;
    private Integer idleTime;
    private Integer focusedTime;
    private String website;
    private String resourceUrl;
    private String learningTopic;
    private LocalDateTime createdAt;
}
