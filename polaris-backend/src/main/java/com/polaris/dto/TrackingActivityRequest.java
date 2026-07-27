package com.polaris.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingActivityRequest {
    private Long sessionId;
    private String website;
    private String url;
    private String pageTitle;
    private Integer activeTimeSeconds;
    private Integer idleTimeSeconds;
    private Integer tabSwitches;
    private Integer scrollDepth;
    private String activityType; // YOUTUBE, DOCUMENTATION, ARTICLE
}
