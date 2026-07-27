package com.polaris.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "learning_plan_days")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "learning_plan_id", nullable = false)
    @ToString.Exclude
    private LearningPlan learningPlan;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean completed;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Phase 6 Extensions
    @Column(name = "learning_objectives", columnDefinition = "TEXT")
    private String learningObjectives; // Newline-separated objectives

    @Column(name = "estimated_study_minutes")
    private Integer estimatedStudyMinutes;

    @Column(length = 20)
    private String difficulty; // Easy, Medium, Hard

    @Column(name = "resource_type", length = 30)
    private String resourceType; // YouTube, Documentation, Blog

    @Column(name = "selected_resource_url", columnDefinition = "TEXT")
    private String selectedResourceUrl;

    @Column(name = "selected_resource_title", columnDefinition = "TEXT")
    private String selectedResourceTitle;

    @Column(name = "video_completed")
    @Builder.Default
    private Boolean videoCompleted = false;

    @Column(name = "quiz_completed")
    @Builder.Default
    private Boolean quizCompleted = false;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED

    @Column(name = "watch_percentage")
    @Builder.Default
    private Integer watchPercentage = 0;

    @Column(name = "video_id", length = 100)
    private String videoId;

    @Column(name = "last_watch_position")
    private Integer lastWatchPosition;

    @Column(name = "last_access_time")
    private LocalDateTime lastAccessTime;
}
