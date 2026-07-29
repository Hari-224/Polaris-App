package com.polaris.service.impl;

import com.polaris.dto.EndFocusRequest;
import com.polaris.dto.FocusSessionResponse;
import com.polaris.dto.StartFocusRequest;
import com.polaris.dto.TrackingActivityRequest;
import com.polaris.dto.TrackingResourceRequest;
import com.polaris.dto.TrackingSessionRequest;
import com.polaris.entity.FocusSession;
import com.polaris.entity.LearningPlanDay;
import com.polaris.entity.LearningResource;
import com.polaris.entity.TrackingActivity;
import com.polaris.entity.User;
import com.polaris.exception.ResourceNotFoundException;
import com.polaris.mapper.LearningPlanMapper;
import com.polaris.repository.FocusSessionRepository;
import com.polaris.repository.LearningPlanDayRepository;
import com.polaris.repository.LearningResourceRepository;
import com.polaris.repository.TrackingActivityRepository;
import com.polaris.repository.UserRepository;
import com.polaris.service.FocusTrackingService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FocusTrackingServiceImpl implements FocusTrackingService {

    private static final Logger log = LoggerFactory.getLogger(FocusTrackingServiceImpl.class);

    private final FocusSessionRepository focusSessionRepository;
    private final TrackingActivityRepository trackingActivityRepository;
    private final LearningPlanDayRepository learningPlanDayRepository;
    private final com.polaris.repository.LearningPlanRepository learningPlanRepository;
    private final UserRepository userRepository;
    private final LearningResourceRepository learningResourceRepository;

    public FocusTrackingServiceImpl(FocusSessionRepository focusSessionRepository,
                                    TrackingActivityRepository trackingActivityRepository,
                                    LearningPlanDayRepository learningPlanDayRepository,
                                    com.polaris.repository.LearningPlanRepository learningPlanRepository,
                                    UserRepository userRepository,
                                    LearningResourceRepository learningResourceRepository) {
        this.focusSessionRepository = focusSessionRepository;
        this.trackingActivityRepository = trackingActivityRepository;
        this.learningPlanDayRepository = learningPlanDayRepository;
        this.learningPlanRepository = learningPlanRepository;
        this.userRepository = userRepository;
        this.learningResourceRepository = learningResourceRepository;
    }

    @Override
    public FocusSessionResponse startFocusSession(StartFocusRequest request, String userEmail) {
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Optional<FocusSession> existingSession = focusSessionRepository
                    .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");

            LearningPlanDay requestedDay = null;
            if (request != null && request.getDayId() != null) {
                requestedDay = learningPlanDayRepository.findById(request.getDayId()).orElse(null);
            }

            if (existingSession.isPresent()) {
                FocusSession session = existingSession.get();
                if (requestedDay != null) {
                    boolean dayChanged = session.getLearningPlanDay() == null || !requestedDay.getId().equals(session.getLearningPlanDay().getId());
                    session.setLearningPlanDay(requestedDay);
                    if (dayChanged) {
                        session.setVideoId(requestedDay.getVideoId());
                        session.setCurrentResourceUrl(LearningPlanMapper.cleanseUrl(requestedDay.getSelectedResourceUrl()));
                        session.setResumeUrl(requestedDay.getResumeUrl());
                        session.setWatchPercentage(requestedDay.getWatchPercentage() != null ? requestedDay.getWatchPercentage() : 0);
                        session.setLastPlaybackPosition(requestedDay.getLastWatchPosition());
                        if (requestedDay.getResourceType() != null) {
                            session.setResourceType(requestedDay.getResourceType());
                        }
                    }
                    session = focusSessionRepository.save(session);
                }
                return toResponse(session);
            }

            LearningPlanDay day = requestedDay;
            if (day == null) {
                List<com.polaris.entity.LearningPlan> plans = learningPlanRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
                if (!plans.isEmpty() && plans.get(0).getDays() != null && !plans.get(0).getDays().isEmpty()) {
                    day = plans.get(0).getDays().stream()
                            .filter(d -> d != null && (d.getCompleted() == null || !d.getCompleted()))
                            .findFirst()
                            .orElse(plans.get(0).getDays().get(0));
                }
            }

            String rawUrl = request != null ? LearningPlanMapper.cleanseUrl(request.getCurrentResourceUrl()) : null;
            if (rawUrl == null && day != null) {
                rawUrl = LearningPlanMapper.cleanseUrl(day.getSelectedResourceUrl());
            }

            FocusSession session = FocusSession.builder()
                    .user(user)
                    .learningPlanDay(day)
                    .startTime(LocalDateTime.now())
                    .status("ACTIVE")
                    .totalDurationSeconds(0)
                    .focusScore(100.0)
                    .currentResourceUrl(rawUrl)
                    .resourceType(request != null && request.getResourceType() != null ? request.getResourceType() : (day != null && day.getResourceType() != null ? day.getResourceType() : "GENERAL"))
                    .watchPercentage(day != null && day.getWatchPercentage() != null ? day.getWatchPercentage() : 0)
                    .videoId(day != null ? day.getVideoId() : null)
                    .lastPlaybackPosition(day != null ? day.getLastWatchPosition() : null)
                    .resumeUrl(day != null ? day.getResumeUrl() : null)
                    .build();

            FocusSession saved = focusSessionRepository.save(session);
            return toResponse(saved);
        } catch (Exception e) {
            log.error("Error starting focus session for user: {}", userEmail, e);
            throw e;
        }
    }

    @Override
    public FocusSessionResponse endFocusSession(EndFocusRequest request, String userEmail) {
        FocusSession session = null;
        if (request != null && request.getSessionId() != null) {
            session = focusSessionRepository.findById(request.getSessionId()).orElse(null);
        }

        if (session == null) {
            Optional<FocusSession> activeOpt = focusSessionRepository
                    .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");
            if (activeOpt.isPresent()) {
                session = activeOpt.get();
            }
        }

        if (session == null) {
            throw new ResourceNotFoundException("No active focus session found to end.");
        }

        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());

        if (session.getStartTime() != null) {
            long seconds = Duration.between(session.getStartTime(), session.getEndTime()).getSeconds();
            session.setTotalDurationSeconds((int) seconds);
        }

        if (request != null && request.getFocusScore() != null) {
            session.setFocusScore(request.getFocusScore());
        }

        FocusSession saved = focusSessionRepository.save(session);

        if (saved.getLearningPlanDay() != null) {
            LearningPlanDay day = saved.getLearningPlanDay();

            if (saved.getWatchPercentage() != null) {
                int currentDayWatch = day.getWatchPercentage() != null ? day.getWatchPercentage() : 0;
                int newWatch = Math.max(currentDayWatch, saved.getWatchPercentage());
                day.setWatchPercentage(newWatch);

                String calculatedStatus = computeStatus(newWatch, day.getQuizCompleted() != null && day.getQuizCompleted());
                day.setStatus(calculatedStatus);
                boolean isMastered = "MASTERED".equals(calculatedStatus);
                day.setCompleted(isMastered);
                day.setCompletedAt(isMastered ? LocalDateTime.now() : null);
            }
            if (saved.getVideoId() != null) {
                day.setVideoId(saved.getVideoId());
            }
            if (saved.getLastPlaybackPosition() != null) {
                day.setLastWatchPosition(saved.getLastPlaybackPosition());
            }
            learningPlanDayRepository.save(day);
        }

        return toResponse(saved);
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

        // Resolve dayId: explicit -> active session -> smart title/videoId match -> fallback uncompleted day
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

        // Smart Day Resolution by Video ID or Title Matching across ALL plans of user if dayId is not resolved yet
        if (dayId == null) {
            List<com.polaris.entity.LearningPlan> plans = learningPlanRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
            if (plans != null && !plans.isEmpty()) {
                // 1. Try matching videoId first across ALL plans
                if (request.getVideoId() != null && !request.getVideoId().trim().isEmpty()) {
                    for (com.polaris.entity.LearningPlan plan : plans) {
                        if (plan.getDays() != null) {
                            Optional<LearningPlanDay> videoMatch = plan.getDays().stream()
                                    .filter(d -> d != null && request.getVideoId().equals(d.getVideoId()))
                                    .findFirst();
                            if (videoMatch.isPresent()) {
                                dayId = videoMatch.get().getId();
                                break;
                            }
                        }
                    }
                }

                // 2. Try matching Title keywords across ALL plans if dayId not matched by videoId
                if (dayId == null && request.getResourceTitle() != null && !request.getResourceTitle().trim().isEmpty()) {
                    String reqTitleLower = request.getResourceTitle().toLowerCase();
                    for (com.polaris.entity.LearningPlan plan : plans) {
                        if (plan.getDays() != null) {
                            Optional<LearningPlanDay> titleMatch = plan.getDays().stream()
                                    .filter(d -> d != null && d.getTitle() != null &&
                                            (reqTitleLower.contains(d.getTitle().toLowerCase()) || d.getTitle().toLowerCase().contains(reqTitleLower)))
                                    .findFirst();
                            if (titleMatch.isPresent()) {
                                dayId = titleMatch.get().getId();
                                break;
                            }
                        }
                    }
                }

                // 3. Fallback to first uncompleted day of current plan ONLY IF no dayId was found anywhere
                if (dayId == null && plans.get(0).getDays() != null && !plans.get(0).getDays().isEmpty()) {
                    dayId = plans.get(0).getDays().stream()
                            .filter(d -> d != null && (d.getCompleted() == null || !d.getCompleted()))
                            .findFirst()
                            .map(LearningPlanDay::getId)
                            .orElse(plans.get(0).getDays().get(0).getId());
                }
            }
        }

        LearningPlanDay day = dayId != null ? learningPlanDayRepository.findById(dayId).orElse(null) : null;

        // If an active focus session exists and has NO learningPlanDay assigned, set it to resolved day
        if (day != null) {
            Optional<FocusSession> activeOpt = focusSessionRepository
                    .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");
            if (activeOpt.isPresent()) {
                FocusSession session = activeOpt.get();
                if (session.getLearningPlanDay() == null) {
                    session.setLearningPlanDay(day);
                    focusSessionRepository.save(session);
                }
            }
        }

        // Upsert LearningResource
        String rawUrl = LearningPlanMapper.cleanseUrl(request.getResourceUrl());
        String watchUrl = request.getVideoId() != null && !request.getVideoId().trim().isEmpty()
                ? "https://www.youtube.com/watch?v=" + request.getVideoId()
                : rawUrl;

        final String resumeUrl = (watchUrl != null && request.getCurrentPosition() != null && request.getCurrentPosition() > 0)
                ? watchUrl + "&t=" + request.getCurrentPosition()
                : watchUrl;

        if (watchUrl != null) {
            Optional<LearningResource> resourceOpt = Optional.empty();
            if (request.getVideoId() != null && !request.getVideoId().trim().isEmpty()) {
                resourceOpt = learningResourceRepository.findByUserEmailAndVideoId(userEmail, request.getVideoId());
            }
            if (resourceOpt.isEmpty()) {
                resourceOpt = learningResourceRepository.findByUserEmailAndResourceUrl(userEmail, watchUrl);
            }

            LearningResource resource = resourceOpt.orElseGet(() -> LearningResource.builder()
                    .user(user)
                    .learningPlanDay(day)
                    .resourceUrl(watchUrl)
                    .build());

            resource.setVideoId(request.getVideoId());
            resource.setTitle(request.getResourceTitle());
            resource.setChannel(request.getChannelName());
            resource.setDuration(request.getDuration());
            resource.setCurrentPosition(request.getCurrentPosition());
            resource.setResumeUrl(resumeUrl);
            resource.setLastVisited(LocalDateTime.now());

            if (request.getWatchPercentage() != null) {
                int oldPct = resource.getWatchPercentage() != null ? resource.getWatchPercentage() : 0;
                int newPct = Math.max(oldPct, request.getWatchPercentage());
                resource.setWatchPercentage(newPct);

                boolean quizPassed = day != null && day.getQuizCompleted() != null && day.getQuizCompleted();
                String resourceStatus = computeStatus(newPct, quizPassed);
                resource.setCompletionStatus(resourceStatus);
            }

            learningResourceRepository.save(resource);
        }

        // Compute dynamic status
        int newWatchPct = request.getWatchPercentage() != null ? request.getWatchPercentage() : 0;
        if (day != null && day.getWatchPercentage() != null) {
            newWatchPct = Math.max(day.getWatchPercentage(), newWatchPct);
        }
        boolean quizPassed = day != null && day.getQuizCompleted() != null && day.getQuizCompleted();
        String calculatedStatus = computeStatus(newWatchPct, quizPassed);

        // Update Active FocusSession
        if (request.getSessionId() != null) {
            focusSessionRepository.findById(request.getSessionId()).ifPresent(session -> {
                session.setCurrentResourceUrl(watchUrl);
                session.setResumeUrl(resumeUrl);
                session.setWatchPercentage(request.getWatchPercentage());
                if (request.getResourceType() != null) {
                    session.setResourceType(request.getResourceType());
                }
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
            });
        }

        // Update LearningPlanDay
        if (day != null) {
            if (watchUrl != null && !watchUrl.trim().isEmpty()) {
                day.setSelectedResourceUrl(watchUrl);
            }
            if (resumeUrl != null && !resumeUrl.trim().isEmpty()) {
                day.setResumeUrl(resumeUrl);
            }
            if (request.getResourceTitle() != null && !request.getResourceTitle().trim().isEmpty()) {
                day.setSelectedResourceTitle(request.getResourceTitle());
            }
            if (request.getResourceType() != null) {
                day.setResourceType(request.getResourceType());
            }
            day.setWatchPercentage(newWatchPct);
            if (newWatchPct >= 90) {
                day.setVideoCompleted(true);
            }
            if (request.getVideoId() != null && !request.getVideoId().trim().isEmpty()) {
                day.setVideoId(request.getVideoId());
            }
            if (request.getCurrentPosition() != null) {
                day.setLastWatchPosition(request.getCurrentPosition());
            }
            day.setLastAccessTime(LocalDateTime.now());

            // Enforce computed status rules
            day.setStatus(calculatedStatus);
            boolean isMastered = "MASTERED".equals(calculatedStatus);
            day.setCompleted(isMastered);
            day.setCompletedAt(isMastered ? LocalDateTime.now() : null);

            learningPlanDayRepository.save(day);
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
        try {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return com.polaris.dto.ExtensionContextResponse.builder()
                        .connectionStatus("DISCONNECTED")
                        .focusStatus("IDLE")
                        .build();
            }

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

            Optional<FocusSession> activeSessionOpt = focusSessionRepository
                    .findFirstByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, "ACTIVE");

            if (activeSessionOpt.isPresent()) {
                FocusSession session = activeSessionOpt.get();
                builder.activeSessionId(session.getId());
                builder.focusStatus("ACTIVE");
                if (session.getFocusScore() != null) {
                    builder.focusScore(session.getFocusScore());
                }

                if (session.getLearningPlanDay() != null) {
                    LearningPlanDay day = session.getLearningPlanDay();
                    builder.dayId(day.getId());
                    builder.dayNumber(day.getDayNumber());
                    builder.dayTitle(day.getTitle());
                    builder.estimatedStudyMinutes(day.getEstimatedStudyMinutes());

                    if (day.getLearningPlan() != null) {
                        builder.planId(day.getLearningPlan().getId());
                        builder.planTopic(day.getLearningPlan().getTopic());
                    }

                    // Prefer session telemetry if active, fallback to day's recorded resource
                    String videoId = session.getVideoId() != null ? session.getVideoId() : day.getVideoId();
                    String currentResUrl = session.getCurrentResourceUrl() != null ? LearningPlanMapper.cleanseUrl(session.getCurrentResourceUrl()) : LearningPlanMapper.cleanseUrl(day.getSelectedResourceUrl());
                    Integer watchPct = session.getWatchPercentage() != null && session.getWatchPercentage() > 0 ? session.getWatchPercentage() : (day.getWatchPercentage() != null ? day.getWatchPercentage() : 0);
                    Integer lastPos = session.getLastPlaybackPosition() != null && session.getLastPlaybackPosition() > 0 ? session.getLastPlaybackPosition() : day.getLastWatchPosition();

                    builder.currentResourceUrl(currentResUrl);
                    builder.videoId(videoId);
                    builder.channelName(session.getChannelName());
                    builder.lastPlaybackPosition(lastPos);
                    builder.videoDuration(session.getVideoDuration());
                    builder.watchPercentage(watchPct);

                    if (videoId != null && !videoId.trim().isEmpty()) {
                        String wUrl = "https://www.youtube.com/watch?v=" + videoId;
                        builder.watchUrl(wUrl);
                        String rUrl = session.getResumeUrl() != null ? session.getResumeUrl() :
                                (day.getResumeUrl() != null ? day.getResumeUrl() :
                                        (lastPos != null && lastPos > 0 ? wUrl + "&t=" + lastPos : wUrl));
                        builder.resumeUrl(rUrl);
                    }
                }
            }

            com.polaris.dto.ExtensionContextResponse ctx = builder.build();

            if (ctx.getPlanId() == null || ctx.getDayId() == null) {
                List<com.polaris.entity.LearningPlan> plans = learningPlanRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
                if (plans != null && !plans.isEmpty()) {
                    com.polaris.entity.LearningPlan plan = plans.get(0);
                    if (plan != null) {
                        if (ctx.getPlanId() == null) {
                            ctx.setPlanId(plan.getId());
                            ctx.setPlanTopic(plan.getTopic());
                        }
                        if (ctx.getDayId() == null && plan.getDays() != null && !plan.getDays().isEmpty()) {
                            LearningPlanDay day = plan.getDays().stream()
                                    .filter(d -> d != null && (d.getCompleted() == null || !d.getCompleted()))
                                    .findFirst()
                                    .orElse(plan.getDays().get(0));

                            if (day != null) {
                                ctx.setDayId(day.getId());
                                ctx.setDayNumber(day.getDayNumber());
                                ctx.setDayTitle(day.getTitle());
                                ctx.setEstimatedStudyMinutes(day.getEstimatedStudyMinutes());
                                if (ctx.getCurrentResourceUrl() == null) {
                                    ctx.setCurrentResourceUrl(LearningPlanMapper.cleanseUrl(day.getSelectedResourceUrl()));
                                }
                                if (ctx.getVideoId() == null && day.getVideoId() != null && !day.getVideoId().trim().isEmpty()) {
                                    ctx.setVideoId(day.getVideoId());
                                    ctx.setLastPlaybackPosition(day.getLastWatchPosition());
                                    ctx.setWatchPercentage(day.getWatchPercentage());
                                    String wUrl = "https://www.youtube.com/watch?v=" + day.getVideoId();
                                    ctx.setWatchUrl(wUrl);
                                    ctx.setResumeUrl(day.getResumeUrl() != null ? day.getResumeUrl() :
                                            (day.getLastWatchPosition() != null && day.getLastWatchPosition() > 0 ? wUrl + "&t=" + day.getLastWatchPosition() : wUrl));
                                }
                            }
                        }
                    }
                }
            }

            return ctx;
        } catch (Exception e) {
            log.error("Error generating extension context for user: {}", userEmail, e);
            return com.polaris.dto.ExtensionContextResponse.builder()
                    .email(userEmail)
                    .connectionStatus("CONNECTED")
                    .focusStatus("IDLE")
                    .build();
        }
    }

    private String computeStatus(int watchPercentage, boolean quizPassed) {
        if (watchPercentage >= 100 && quizPassed) {
            return "MASTERED";
        }
        if (watchPercentage >= 80) {
            return "NEEDS_REVISION";
        }
        if (watchPercentage >= 1) {
            return "LEARNING";
        }
        return "NOT_STARTED";
    }

    private FocusSessionResponse toResponse(FocusSession session) {
        if (session == null) return null;
        String resUrl = LearningPlanMapper.cleanseUrl(session.getCurrentResourceUrl());
        if (resUrl == null && session.getLearningPlanDay() != null) {
            resUrl = LearningPlanMapper.cleanseUrl(session.getLearningPlanDay().getSelectedResourceUrl());
        }

        String watchUrl = null;
        if (session.getVideoId() != null && !session.getVideoId().trim().isEmpty()) {
            watchUrl = "https://www.youtube.com/watch?v=" + session.getVideoId();
        } else {
            watchUrl = resUrl;
        }

        String resumeUrl = session.getResumeUrl();
        if ((resumeUrl == null || resumeUrl.trim().isEmpty()) && session.getVideoId() != null && !session.getVideoId().trim().isEmpty()) {
            resumeUrl = watchUrl;
            if (session.getLastPlaybackPosition() != null && session.getLastPlaybackPosition() > 0) {
                resumeUrl += "&t=" + session.getLastPlaybackPosition();
            }
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
                .watchUrl(watchUrl)
                .resumeUrl(resumeUrl)
                .build();
    }
}
