package com.polaris.service.impl;

import com.polaris.ai.AIProvider;
import com.polaris.ai.JsonResponseParser;
import com.polaris.dto.CreateDayRequest;
import com.polaris.dto.CreateLearningPlanRequest;
import com.polaris.dto.LearningPlanDayResponse;
import com.polaris.dto.LearningPlanResponse;
import com.polaris.dto.UpdateLearningPlanRequest;
import com.polaris.dto.UpdateResourceRequest;
import com.polaris.entity.LearningPlan;
import com.polaris.entity.LearningPlanDay;
import com.polaris.entity.User;
import com.polaris.exception.BadRequestException;
import com.polaris.exception.ResourceNotFoundException;
import com.polaris.mapper.LearningPlanMapper;
import com.polaris.repository.LearningPlanDayRepository;
import com.polaris.repository.LearningPlanRepository;
import com.polaris.repository.LearningSessionRepository;
import com.polaris.repository.UserRepository;
import com.polaris.service.LearningPlanService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LearningPlanServiceImpl implements LearningPlanService {

    private final LearningPlanRepository learningPlanRepository;
    private final LearningPlanDayRepository learningPlanDayRepository;
    private final UserRepository userRepository;
    private final LearningSessionRepository learningSessionRepository;
    private final AIProvider aiProvider;
    private final JsonResponseParser jsonResponseParser;

    public LearningPlanServiceImpl(LearningPlanRepository learningPlanRepository,
                                   LearningPlanDayRepository learningPlanDayRepository,
                                   UserRepository userRepository,
                                   LearningSessionRepository learningSessionRepository,
                                   AIProvider aiProvider,
                                   JsonResponseParser jsonResponseParser) {
        this.learningPlanRepository = learningPlanRepository;
        this.learningPlanDayRepository = learningPlanDayRepository;
        this.userRepository = userRepository;
        this.learningSessionRepository = learningSessionRepository;
        this.aiProvider = aiProvider;
        this.jsonResponseParser = jsonResponseParser;
    }

    @Override
    public LearningPlanResponse createPlan(CreateLearningPlanRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Call AI Provider to generate roadmap content
        String rawResponse = aiProvider.generateRoadmap(
                request.getTopic(),
                request.getNumberOfDays(),
                request.getDailyStudyHours()
        );

        // Parse JSON response
        JsonResponseParser.RoadmapJson parsedRoadmap = jsonResponseParser.parseRoadmap(rawResponse);

        LearningPlan plan = LearningPlan.builder()
                .user(user)
                .topic(request.getTopic())
                .numberOfDays(request.getNumberOfDays())
                .dailyStudyHours(request.getDailyStudyHours())
                .status("ACTIVE")
                .completionPercentage(0.0)
                .days(new ArrayList<>())
                .build();

        plan = learningPlanRepository.save(plan);

        // Populate days using parsed AI response with Objectives and metrics
        if (parsedRoadmap.getDays() != null) {
            for (JsonResponseParser.DayJson dayJson : parsedRoadmap.getDays()) {
                String objectivesStr = "";
                if (dayJson.getObjectives() != null) {
                    objectivesStr = String.join("\n", dayJson.getObjectives());
                }

                LearningPlanDay day = LearningPlanDay.builder()
                        .learningPlan(plan)
                        .dayNumber(dayJson.getDay())
                        .title(dayJson.getTitle() != null ? dayJson.getTitle() : "Day " + dayJson.getDay())
                        .description(dayJson.getDescription() != null ? dayJson.getDescription() : "Study details for day " + dayJson.getDay())
                        .completed(false)
                        .learningObjectives(objectivesStr)
                        .estimatedStudyMinutes(dayJson.getEstimatedStudyMinutes() != null ? dayJson.getEstimatedStudyMinutes() : 60)
                        .difficulty(dayJson.getDifficulty() != null ? dayJson.getDifficulty() : "Medium")
                        .status("NOT_STARTED")
                        .videoCompleted(false)
                        .quizCompleted(false)
                        .watchPercentage(0)
                        .build();
                plan.getDays().add(day);
            }
        }

        plan = learningPlanRepository.save(plan);
        return LearningPlanMapper.toResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningPlanResponse> getUserPlans(String userEmail) {
        List<LearningPlan> plans = learningPlanRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        return plans.stream()
                .map(LearningPlanMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPlanResponse getPlanDetails(Long planId, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        return LearningPlanMapper.toResponse(plan);
    }

    @Override
    public LearningPlanResponse updatePlan(Long planId, UpdateLearningPlanRequest request, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        plan.setTopic(request.getTopic());
        plan.setDailyStudyHours(request.getDailyStudyHours());
        plan = learningPlanRepository.save(plan);
        return LearningPlanMapper.toResponse(plan);
    }

    @Override
    public void deletePlan(Long planId, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        learningPlanRepository.delete(plan);
    }

    @Override
    public LearningPlanDayResponse addDay(Long planId, CreateDayRequest request, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        
        int nextDayNumber = plan.getDays().size() + 1;
        LearningPlanDay day = LearningPlanDay.builder()
                .learningPlan(plan)
                .dayNumber(nextDayNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .completed(false)
                .status("NOT_STARTED")
                .videoCompleted(false)
                .quizCompleted(false)
                .watchPercentage(0)
                .build();

        day = learningPlanDayRepository.save(day);
        plan.getDays().add(day);
        
        plan.setNumberOfDays(plan.getDays().size());
        updatePlanCompletion(plan);
        
        return LearningPlanMapper.toDayResponse(day);
    }

    @Override
    public LearningPlanDayResponse updateDay(Long planId, Long dayId, CreateDayRequest request, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        LearningPlanDay day = getValidatedDay(plan, dayId);

        day.setTitle(request.getTitle());
        day.setDescription(request.getDescription());
        day = learningPlanDayRepository.save(day);

        return LearningPlanMapper.toDayResponse(day);
    }

    @Override
    public LearningPlanResponse markDayCompleted(Long planId, Long dayId, boolean completed, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        LearningPlanDay day = getValidatedDay(plan, dayId);

        if (completed) {
            // Validate Polaris Product Vision for mastering a task
            if (day.getSelectedResourceUrl() == null) {
                throw new BadRequestException("You must select and watch a resource before mastering this task.");
            }
            boolean hasSession = !learningSessionRepository.findByLearningPlanDayId(dayId).isEmpty();
            if (!hasSession) {
                throw new BadRequestException("You must record at least one learning study session before mastering this task.");
            }
            day.setStatus("MASTERED");
            day.setCompleted(true);
            day.setCompletedAt(LocalDateTime.now());
            day.setWatchPercentage(100);
            day.setVideoCompleted(true);
        } else {
            day.setStatus("NOT_STARTED");
            day.setCompleted(false);
            day.setCompletedAt(null);
            day.setWatchPercentage(0);
            day.setVideoCompleted(false);
        }
        learningPlanDayRepository.save(day);

        updatePlanCompletion(plan);
        return LearningPlanMapper.toResponse(plan);
    }

    @Override
    public void deleteDay(Long planId, Long dayId, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        LearningPlanDay day = getValidatedDay(plan, dayId);

        plan.getDays().remove(day);
        learningPlanDayRepository.delete(day);

        List<LearningPlanDay> remainingDays = plan.getDays();
        for (int i = 0; i < remainingDays.size(); i++) {
            remainingDays.get(i).setDayNumber(i + 1);
            learningPlanDayRepository.save(remainingDays.get(i));
        }

        plan.setNumberOfDays(remainingDays.size());
        updatePlanCompletion(plan);
    }

    @Override
    public LearningPlanDayResponse updateDayResource(Long planId, Long dayId, UpdateResourceRequest request, String userEmail) {
        LearningPlan plan = getValidatedPlan(planId, userEmail);
        LearningPlanDay day = getValidatedDay(plan, dayId);

        day.setSelectedResourceUrl(request.getResourceUrl());
        day.setSelectedResourceTitle(request.getResourceTitle());
        day.setResourceType(request.getResourceType() != null ? request.getResourceType() : "YouTube");

        if (request.getWatchPercentage() != null) {
            day.setWatchPercentage(request.getWatchPercentage());
        }

        if (request.getVideoCompleted() != null) {
            day.setVideoCompleted(request.getVideoCompleted());
        }

        // Handle status mapping
        if (request.getStatus() != null) {
            String newStatus = request.getStatus().toUpperCase();
            if ("MASTERED".equals(newStatus)) {
                if (day.getSelectedResourceUrl() == null) {
                    throw new BadRequestException("You must select and watch a resource before mastering this task.");
                }
                boolean hasSession = !learningSessionRepository.findByLearningPlanDayId(dayId).isEmpty();
                if (!hasSession) {
                    throw new BadRequestException("You must record at least one learning study session before mastering this task.");
                }
            }
            day.setStatus(newStatus);
        } else {
            if (day.getVideoCompleted() || day.getWatchPercentage() >= 90) {
                // Do not auto-master, default to In Progress (LEARNING) if studied
                // Mastered status must be set manually by clicking "I Understood" or status dropdown
                day.setStatus("LEARNING");
            } else if (day.getWatchPercentage() > 0) {
                day.setStatus("LEARNING");
            } else {
                day.setStatus("NOT_STARTED");
            }
        }

        // Sync completed checkbox status based on day status
        boolean isMastered = "MASTERED".equals(day.getStatus());
        day.setCompleted(isMastered);
        day.setCompletedAt(isMastered ? LocalDateTime.now() : null);

        day = learningPlanDayRepository.save(day);
        updatePlanCompletion(plan);

        return LearningPlanMapper.toDayResponse(day);
    }

    private LearningPlan getValidatedPlan(Long planId, String userEmail) {
        LearningPlan plan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning plan not found"));

        if (!plan.getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("Access denied to this learning plan");
        }
        return plan;
    }

    private LearningPlanDay getValidatedDay(LearningPlan plan, Long dayId) {
        return plan.getDays().stream()
                .filter(d -> d.getId().equals(dayId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Day not found in this learning plan"));
    }

    private void updatePlanCompletion(LearningPlan plan) {
        List<LearningPlanDay> days = plan.getDays();
        if (days.isEmpty()) {
            plan.setCompletionPercentage(0.0);
            plan.setStatus("ACTIVE");
        } else {
            long completedCount = days.stream().filter(LearningPlanDay::getCompleted).count();
            double percentage = ((double) completedCount / days.size()) * 100.0;
            percentage = Math.round(percentage * 10.0) / 10.0;
            plan.setCompletionPercentage(percentage);
            
            if (completedCount == days.size()) {
                plan.setStatus("COMPLETED");
            } else {
                plan.setStatus("ACTIVE");
            }
        }
        learningPlanRepository.save(plan);
    }
}
