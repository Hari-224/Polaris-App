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
public class FocusSessionResponse {
    private Long id;
    private Long dayId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer totalDurationSeconds;
    private Double focusScore;
    private String currentResourceUrl;
    private String resourceType;
    private String lastVisitedUrl;
    private Integer watchPercentage;
    private String videoId;
    private String channelName;
    private Integer videoDuration;
    private Integer lastPlaybackPosition;
    private String watchUrl;
    private String resumeUrl;
}
