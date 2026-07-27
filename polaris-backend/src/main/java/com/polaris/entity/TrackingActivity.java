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

@Entity
@Table(name = "tracking_activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "focus_session_id")
    private FocusSession focusSession;

    @Column(nullable = false)
    private String website;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @Column(name = "page_title")
    private String pageTitle;

    @Column(name = "active_time_seconds")
    @Builder.Default
    private Integer activeTimeSeconds = 0;

    @Column(name = "idle_time_seconds")
    @Builder.Default
    private Integer idleTimeSeconds = 0;

    @Column(name = "tab_switches")
    @Builder.Default
    private Integer tabSwitches = 0;

    @Column(name = "scroll_depth")
    @Builder.Default
    private Integer scrollDepth = 0;

    @Column(name = "activity_type")
    private String activityType; // YOUTUBE, DOCUMENTATION, ARTICLE

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
