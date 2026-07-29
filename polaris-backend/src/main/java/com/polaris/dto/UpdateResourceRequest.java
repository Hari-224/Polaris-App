package com.polaris.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResourceRequest {

    private String resourceUrl;

    private String resourceTitle;

    private String resourceType; // e.g. YouTube

    private Integer watchPercentage;

    private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED

    private Boolean videoCompleted;
}
