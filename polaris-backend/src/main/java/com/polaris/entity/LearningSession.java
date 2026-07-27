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
@Table(name = "learning_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningSession {

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

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "active_learning_time", nullable = false)
    private Integer activeLearningTime; // in seconds or minutes

    @Column(name = "idle_time")
    private Integer idleTime;

    @Column(name = "focused_time")
    private Integer focusedTime;

    @Column(nullable = false)
    private String website;

    @Column(name = "resource_url", columnDefinition = "TEXT")
    private String resourceUrl;

    @Column(name = "learning_topic")
    private String learningTopic;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
