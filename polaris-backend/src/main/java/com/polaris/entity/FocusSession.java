package com.polaris.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "focus_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "learning_plan_day_id")
    @ToString.Exclude
    private LearningPlanDay learningPlanDay;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, COMPLETED, CANCELLED

    @Column(name = "total_duration_seconds")
    @Builder.Default
    private Integer totalDurationSeconds = 0;

    @Column(name = "focus_score")
    @Builder.Default
    private Double focusScore = 100.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "current_resource_url", columnDefinition = "TEXT")
    private String currentResourceUrl;

    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl;

    @Column(name = "resource_type", length = 50)
    private String resourceType;

    @Column(name = "last_visited_url", columnDefinition = "TEXT")
    private String lastVisitedUrl;

    @Column(name = "watch_percentage")
    @Builder.Default
    private Integer watchPercentage = 0;

    @Column(name = "video_id", length = 100)
    private String videoId;

    @Column(name = "channel_name")
    private String channelName;

    @Column(name = "video_duration")
    private Integer videoDuration;

    @Column(name = "last_playback_position")
    private Integer lastPlaybackPosition;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.startTime == null) {
            this.startTime = LocalDateTime.now();
        }
    }
}
