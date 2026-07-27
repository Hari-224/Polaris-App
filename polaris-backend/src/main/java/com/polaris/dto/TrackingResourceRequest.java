package com.polaris.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingResourceRequest {
    private Long dayId;
    private Long sessionId;
    private String resourceUrl;
    private String resourceTitle;
    private String channelName;
    private String videoId;
    private Integer duration;
    private Integer currentPosition;
    private Integer watchPercentage;
    private String resourceType; // YouTube, Documentation
}
