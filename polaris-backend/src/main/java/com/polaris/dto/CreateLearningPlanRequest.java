package com.polaris.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateLearningPlanRequest {

    @NotBlank(message = "Topic is required")
    @Size(min = 3, max = 200, message = "Topic must be between 3 and 200 characters")
    private String topic;

    @NotNull(message = "Number of days is required")
    @Min(value = 1, message = "Number of days must be at least 1")
    @Max(value = 365, message = "Number of days cannot exceed 365")
    private Integer numberOfDays;

    @NotNull(message = "Daily study hours is required")
    @Min(value = 1, message = "Daily study hours must be at least 1")
    @Max(value = 12, message = "Daily study hours cannot exceed 12")
    private Integer dailyStudyHours;
}
