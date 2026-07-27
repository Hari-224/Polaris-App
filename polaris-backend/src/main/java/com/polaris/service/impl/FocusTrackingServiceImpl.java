package com.polaris.service.impl;

import com.polaris.dto.EndFocusRequest;
import com.polaris.dto.FocusSessionResponse;
import com.polaris.dto.StartFocusRequest;
import com.polaris.dto.TrackingActivityRequest;
import com.polaris.dto.TrackingResourceRequest;
import com.polaris.dto.TrackingSessionRequest;
import com.polaris.entity.FocusSession;
import com.polaris.entity.LearningPlanDay;
import com.polaris.entity.TrackingActivity;
import com.polaris.entity.User;
import com.polaris.exception.ResourceNotFoundException;
import com.polaris.repository.FocusSessionRepository;
import com.polaris.repository.LearningPlanDayRepository;
import com.polaris.repository.TrackingActivityRepository;
import com.polaris.repository.UserRepository;
import com.polaris.service.FocusTrackingService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FocusTrackingServiceImpl implements FocusTrackingService {

    private final FocusSessionRepository focusSessionRepository;
    private final TrackingActivityRepository trackingActivityRepository;
    private final LearningPlanDayRepository learningPlanDayRepository;
    private final com.polaris.repository.LearningPlanRepository learningPlanRepository;
    private final UserRepository userRepository;

    public FocusTrackingServiceImpl(FocusSessionRepository focusSessionRepository,
                                    TrackingActivityRepository trackingActivityRepository,
                                    LearningPlanDayRepository learningPlanDayRepository,
                                    com.polaris.repository.LearningPlanRepository learningPlanRepository,
                                    UserRepository userRepository) {
        this.focusSessionRepository = focusSessionRepository;
        this.trackingActivityRepository = trackingActivityRepository;
        this.learningPlanDayRepository = learningPlanDayRepository;
        this.learningPlanRepository = learningPlanRepository;
        this.userRepository = userRepository;
    }

    @Override
    public FocusSessionResponse startFocusSession(StartFocusRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Close any currently running active focus session
        Optional<FocusSession> activeSessionOpt = focusSessionRepository
                .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");
        activeSessionOpt.ifPresent(session -> {
            session.setStatus("COMPLETED");
            session.setEndTime(LocalDateTime.now());
            session.setTotalDurationSeconds((int) Duration.between(session.getStartTime(), session.getEndTime()).getSeconds());
            focusSessionRepository.save(session);
        });

        LearningPlanDay day = null;
        if (request != null && request.getDayId() != null) {
            day = learningPlanDayRepository.findById(request.getDayId()).orElse(null);
        }

        String initialResourceUrl = day != null ? day.getSelectedResourceUrl() : null;
        String initialResourceType = day != null ? day.getResourceType() : null;

        FocusSession session = FocusSession.builder()
                .user(user)
                .learningPlanDay(day)
                .startTime(LocalDateTime.now())
                .status("ACTIVE")
                .totalDurationSeconds(0)
                .focusScore(100.0)
                .currentResourceUrl(initialResourceUrl)
                .resourceType(initialResourceType)
                .build();

        session = focusSessionRepository.save(session);
        return toResponse(session);
    }

    @Override
    public FocusSessionResponse endFocusSession(EndFocusRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FocusSession session = null;
        if (request != null && request.getSessionId() != null) {
            session = focusSessionRepository.findById(request.getSessionId()).orElse(null);
        }
        if (session == null) {
            session = focusSessionRepository.findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE")
                    .orElseThrow(() -> new ResourceNotFoundException("No active focus session found to stop"));
        }

        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());
        session.setTotalDurationSeconds((int) Duration.between(session.getStartTime(), session.getEndTime()).getSeconds());
        session = focusSessionRepository.save(session);

        return toResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public FocusSessionResponse getActiveFocusSession(String userEmail) {
        Optional<FocusSession> sessionOpt = focusSessionRepository
                .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");
        return sessionOpt.map(this::toResponse).orElse(null);
    }

    @Override
    public void trackSession(TrackingSessionRequest request, String userEmail) {
        if (request == null) return;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return;

        // Optionally update focus score or session telemetry
        if (request.getSessionId() != null) {
            focusSessionRepository.findById(request.getSessionId()).ifPresent(session -> {
                int activeSecs = request.getActiveTimeSeconds() != null ? request.getActiveTimeSeconds() : 0;
                int idleSecs = request.getIdleTimeSeconds() != null ? request.getIdleTimeSeconds() : 0;
                int totalSecs = activeSecs + idleSecs;
                if (totalSecs > 0) {
                    double currentScore = ((double) activeSecs / totalSecs) * 100.0;
                    session.setFocusScore(Math.round(currentScore * 10.0) / 10.0);
                    session.setTotalDurationSeconds(session.getTotalDurationSeconds() + activeSecs);
                    focusSessionRepository.save(session);
                }
            });
        }
    }

    @Override
    public void trackResource(TrackingResourceRequest request, String userEmail) {
        if (request == null) return;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return;

        // Resolve dayId: request → session → active session
        Long dayId = request.getDayId();
        if (dayId == null && request.getSessionId() != null) {
            FocusSession session = focusSessionRepository.findById(request.getSessionId()).orElse(null);
            if (session != null && session.getLearningPlanDay() != null) {
                dayId = session.getLearningPlanDay().getId();
            }
        }
        if (dayId == null) {
            Optional<FocusSession> activeOpt = focusSessionRepository
                    .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");
            if (activeOpt.isPresent() && activeOpt.get().getLearningPlanDay() != null) {
                dayId = activeOpt.get().getLearningPlanDay().getId();
            }
        }

        // Update FocusSession with resource and video tracking data
        if (request.getSessionId() != null) {
            FocusSession session = focusSessionRepository.findById(request.getSessionId()).orElse(null);
            if (session != null) {
                if (request.getResourceUrl() != null && !request.getResourceUrl().trim().isEmpty()) {
                    session.setCurrentResourceUrl(request.getResourceUrl());
                    session.setLastVisitedUrl(request.getResourceUrl());
                }
                if (request.getResourceType() != null) {
                    session.setResourceType(request.getResourceType());
                }
                if (request.getWatchPercentage() != null) {
                    session.setWatchPercentage(request.getWatchPercentage());
                }
                // Store video-specific fields for resume support
                if (request.getVideoId() != null && !request.getVideoId().trim().isEmpty()) {
                    session.setVideoId(request.getVideoId());
                }
                if (request.getChannelName() != null && !request.getChannelName().trim().isEmpty()) {
                    session.setChannelName(request.getChannelName());
                }
                if (request.getDuration() != null) {
                    session.setVideoDuration(request.getDuration());
                }
                if (request.getCurrentPosition() != null) {
                    session.setLastPlaybackPosition(request.getCurrentPosition());
                }
                focusSessionRepository.save(session);
            }
        }

        // Update LearningPlanDay with resource tracking data
        if (dayId != null) {
            LearningPlanDay day = learningPlanDayRepository.findById(dayId).orElse(null);
            if (day != null) {
                if (request.getResourceUrl() != null && !request.getResourceUrl().trim().isEmpty()) {
                    day.setSelectedResourceUrl(request.getResourceUrl());
                }
                if (request.getResourceTitle() != null && !request.getResourceTitle().trim().isEmpty()) {
                    day.setSelectedResourceTitle(request.getResourceTitle());
                }
                if (request.getResourceType() != null) {
                    day.setResourceType(request.getResourceType());
                }
                if (request.getWatchPercentage() != null) {
                    day.setWatchPercentage(request.getWatchPercentage());
                    if (request.getWatchPercentage() >= 90) {
                        day.setVideoCompleted(true);
                    }
                }
                if (request.getVideoId() != null && !request.getVideoId().trim().isEmpty()) {
                    day.setVideoId(request.getVideoId());
                }
                if (request.getCurrentPosition() != null) {
                    day.setLastWatchPosition(request.getCurrentPosition());
                }
                day.setLastAccessTime(LocalDateTime.now());

                if ("NOT_STARTED".equals(day.getStatus())) {
                    day.setStatus("LEARNING");
                }
                learningPlanDayRepository.save(day);
            }
        }
    }

    @Override
    public void trackActivity(TrackingActivityRequest request, String userEmail) {
        if (request == null) return;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return;

        FocusSession session = null;
        if (request.getSessionId() != null) {
            session = focusSessionRepository.findById(request.getSessionId()).orElse(null);
            if (session != null && request.getUrl() != null) {
                session.setLastVisitedUrl(request.getUrl());
                focusSessionRepository.save(session);
            }
        }

        TrackingActivity activity = TrackingActivity.builder()
                .user(user)
                .focusSession(session)
                .website(request.getWebsite() != null ? request.getWebsite() : "unknown")
                .url(request.getUrl())
                .pageTitle(request.getPageTitle())
                .activeTimeSeconds(request.getActiveTimeSeconds() != null ? request.getActiveTimeSeconds() : 0)
                .idleTimeSeconds(request.getIdleTimeSeconds() != null ? request.getIdleTimeSeconds() : 0)
                .tabSwitches(request.getTabSwitches() != null ? request.getTabSwitches() : 0)
                .scrollDepth(request.getScrollDepth() != null ? request.getScrollDepth() : 0)
                .activityType(request.getActivityType() != null ? request.getActivityType() : "GENERAL")
                .build();

        trackingActivityRepository.save(activity);
    }

    @Override
    public void trackActivityBatch(List<TrackingActivityRequest> requests, String userEmail) {
        if (requests == null || requests.isEmpty()) return;
        for (TrackingActivityRequest request : requests) {
            trackActivity(request, userEmail);
        }
    }

    @Override
    public void trackResourceBatch(List<TrackingResourceRequest> requests, String userEmail) {
        if (requests == null || requests.isEmpty()) return;
        for (TrackingResourceRequest request : requests) {
            trackResource(request, userEmail);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public com.polaris.dto.ExtensionContextResponse getExtensionContext(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String studentName = (user.getFirstName() != null ? user.getFirstName() : "") +
                (user.getLastName() != null ? " " + user.getLastName() : "");
        if (studentName.trim().isEmpty()) {
            studentName = user.getEmail();
        }

        String roleStr = user.getRole() != null ? user.getRole().name() : "STUDENT";

        com.polaris.dto.ExtensionContextResponse.ExtensionContextResponseBuilder builder =
                com.polaris.dto.ExtensionContextResponse.builder()
                        .studentName(studentName.trim())
                        .role(roleStr)
                        .email(user.getEmail())
                        .connectionStatus("CONNECTED")
                        .todayStudyTimeSeconds(0)
                        .focusScore(85.0)
                        .focusStatus("IDLE");

        // Active Focus Session
        Optional<FocusSession> activeSessionOpt = focusSessionRepository
                .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");

        if (activeSessionOpt.isPresent()) {
            FocusSession session = activeSessionOpt.get();
            builder.activeSessionId(session.getId());
            builder.focusStatus("ACTIVE");
            builder.currentResourceUrl(session.getCurrentResourceUrl());
            if (session.getFocusScore() != null) {
                builder.focusScore(session.getFocusScore());
            }

            // Video resume fields
            builder.videoId(session.getVideoId());
            builder.channelName(session.getChannelName());
            builder.lastPlaybackPosition(session.getLastPlaybackPosition());
            builder.videoDuration(session.getVideoDuration());
            builder.watchPercentage(session.getWatchPercentage());
            if (session.getVideoId() != null) {
                builder.watchUrl("https://www.youtube.com/watch?v=" + session.getVideoId());
            }

            if (session.getLearningPlanDay() != null) {
                LearningPlanDay day = session.getLearningPlanDay();
                builder.dayId(day.getId());
                builder.dayNumber(day.getDayNumber());
                builder.dayTitle(day.getTitle());
                builder.estimatedStudyMinutes(day.getEstimatedStudyMinutes());
                if (session.getCurrentResourceUrl() == null) {
                    builder.currentResourceUrl(day.getSelectedResourceUrl());
                }

                // Fallback video resume from LearningPlanDay if session has none
                if (session.getVideoId() == null && day.getVideoId() != null) {
                    builder.videoId(day.getVideoId());
                    builder.lastPlaybackPosition(day.getLastWatchPosition());
                    builder.watchPercentage(day.getWatchPercentage());
                    builder.watchUrl("https://www.youtube.com/watch?v=" + day.getVideoId());
                }

                if (day.getLearningPlan() != null) {
                    builder.planId(day.getLearningPlan().getId());
                    builder.planTopic(day.getLearningPlan().getTopic());
                }
            }
        }

        com.polaris.dto.ExtensionContextResponse ctx = builder.build();
        if (ctx.getPlanId() == null || ctx.getDayId() == null) {
            List<com.polaris.entity.LearningPlan> plans = learningPlanRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
            if (!plans.isEmpty()) {
                com.polaris.entity.LearningPlan plan = plans.get(0);
                if (ctx.getPlanId() == null) {
                    ctx.setPlanId(plan.getId());
                    ctx.setPlanTopic(plan.getTopic());
                }
                if (ctx.getDayId() == null && plan.getDays() != null && !plan.getDays().isEmpty()) {
                    LearningPlanDay day = plan.getDays().stream()
                            .filter(d -> d.getCompleted() == null || !d.getCompleted())
                            .findFirst()
                            .orElse(plan.getDays().get(0));
                    ctx.setDayId(day.getId());
                    ctx.setDayNumber(day.getDayNumber());
                    ctx.setDayTitle(day.getTitle());
                    ctx.setEstimatedStudyMinutes(day.getEstimatedStudyMinutes());
                    if (ctx.getCurrentResourceUrl() == null) {
                        ctx.setCurrentResourceUrl(day.getSelectedResourceUrl());
                    }
                    // Video resume from day
                    if (ctx.getVideoId() == null && day.getVideoId() != null) {
                        ctx.setVideoId(day.getVideoId());
                        ctx.setLastPlaybackPosition(day.getLastWatchPosition());
                        ctx.setWatchPercentage(day.getWatchPercentage());
                        ctx.setWatchUrl("https://www.youtube.com/watch?v=" + day.getVideoId());
                    }
                }
            }
        }

        return ctx;
    }

    private FocusSessionResponse toResponse(FocusSession session) {
        if (session == null) return null;
        String resUrl = session.getCurrentResourceUrl();
        if (resUrl == null && session.getLearningPlanDay() != null) {
            resUrl = session.getLearningPlanDay().getSelectedResourceUrl();
        }
        return FocusSessionResponse.builder()
                .id(session.getId())
                .dayId(session.getLearningPlanDay() != null ? session.getLearningPlanDay().getId() : null)
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .totalDurationSeconds(session.getTotalDurationSeconds())
                .focusScore(session.getFocusScore())
                .currentResourceUrl(resUrl)
                .resourceType(session.getResourceType())
                .lastVisitedUrl(session.getLastVisitedUrl())
                .watchPercentage(session.getWatchPercentage() != null ? session.getWatchPercentage() :
                        (session.getLearningPlanDay() != null ? session.getLearningPlanDay().getWatchPercentage() : 0))
                .videoId(session.getVideoId())
                .channelName(session.getChannelName())
                .videoDuration(session.getVideoDuration())
                .lastPlaybackPosition(session.getLastPlaybackPosition())
                .build();
    }
}
