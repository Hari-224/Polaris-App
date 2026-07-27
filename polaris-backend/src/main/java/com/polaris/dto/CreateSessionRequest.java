package com.polaris.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Active learning time is required")
    private Integer activeLearningTime;

    private Integer idleTime;

    private Integer focusedTime;

    @NotBlank(message = "Website is required")
    private String website;

    private String resourceUrl;

    private String learningTopic;
}
