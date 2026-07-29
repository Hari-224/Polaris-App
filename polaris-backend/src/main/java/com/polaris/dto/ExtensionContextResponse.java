package com.polaris.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtensionContextResponse {
    private String studentName;
    private String role;
    private String email;
    private String connectionStatus;

    private Long planId;
    private String planTopic;

    private Long dayId;
    private Integer dayNumber;
    private String dayTitle;
    private Integer estimatedStudyMinutes;

    private Integer todayStudyTimeSeconds;
    private Double focusScore;

    private Long activeSessionId;
    private String focusStatus;
    private String currentResourceUrl;
    private Boolean learningActive;
    private String trackingStatus;

    private String videoId;
    private String channelName;
    private Integer lastPlaybackPosition;
    private Integer videoDuration;
    private String watchUrl;
    private String resumeUrl;
    private Integer watchPercentage;
}
