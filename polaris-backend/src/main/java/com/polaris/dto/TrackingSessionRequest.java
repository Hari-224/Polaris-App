package com.polaris.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingSessionRequest {
    private Long sessionId;
    private Long dayId;
    private String website;
    private String url;
    private Integer activeTimeSeconds;
    private Integer idleTimeSeconds;
}
