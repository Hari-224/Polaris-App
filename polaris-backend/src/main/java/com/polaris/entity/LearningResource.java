package com.polaris.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "learning_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningResource {

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

    @Column(name = "resource_type", length = 50)
    private String resourceType; // YouTube, Documentation

    @Column(name = "video_id", length = 100)
    private String videoId;

    @Column(name = "resource_url", columnDefinition = "TEXT")
    private String resourceUrl; // watchUrl e.g. https://youtube.com/watch?v=VIDEO_ID

    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl; // e.g. https://youtube.com/watch?v=VIDEO_ID&t=143

    @Column(name = "current_position")
    @Builder.Default
    private Integer currentPosition = 0;

    @Column(name = "duration")
    @Builder.Default
    private Integer duration = 0;

    @Column(name = "watch_percentage")
    @Builder.Default
    private Integer watchPercentage = 0;

    @Column(name = "completion_status", length = 30)
    @Builder.Default
    private String completionStatus = "NOT_STARTED"; // NOT_STARTED, LEARNING, NEEDS_REVISION, MASTERED

    @Column(name = "last_visited")
    private LocalDateTime lastVisited;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(length = 255)
    private String channel;

    @Column(columnDefinition = "TEXT")
    private String thumbnail;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.lastVisited = LocalDateTime.now();
    }
}
