package com.polaris.service.impl;

import com.polaris.dto.CreateSessionRequest;
import com.polaris.dto.LearningSessionResponse;
import com.polaris.entity.LearningPlanDay;
import com.polaris.entity.LearningSession;
import com.polaris.entity.User;
import com.polaris.exception.BadRequestException;
import com.polaris.exception.ResourceNotFoundException;
import com.polaris.mapper.LearningSessionMapper;
import com.polaris.repository.LearningPlanDayRepository;
import com.polaris.repository.LearningSessionRepository;
import com.polaris.repository.UserRepository;
import com.polaris.service.LearningSessionService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LearningSessionServiceImpl implements LearningSessionService {

    private final LearningSessionRepository learningSessionRepository;
    private final LearningPlanDayRepository learningPlanDayRepository;
    private final UserRepository userRepository;

    public LearningSessionServiceImpl(LearningSessionRepository learningSessionRepository,
                                     LearningPlanDayRepository learningPlanDayRepository,
                                     UserRepository userRepository) {
        this.learningSessionRepository = learningSessionRepository;
        this.learningPlanDayRepository = learningPlanDayRepository;
        this.userRepository = userRepository;
    }

    @Override
    public LearningSessionResponse recordSession(Long dayId, CreateSessionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LearningPlanDay day = learningPlanDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning task not found"));

        if (!day.getLearningPlan().getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("Access denied to this learning task");
        }

        LearningSession session = LearningSession.builder()
                .user(user)
                .learningPlanDay(day)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .activeLearningTime(request.getActiveLearningTime())
                .idleTime(request.getIdleTime())
                .focusedTime(request.getFocusedTime())
                .website(request.getWebsite())
                .resourceUrl(request.getResourceUrl())
                .learningTopic(request.getLearningTopic())
                .build();

        session = learningSessionRepository.save(session);

        // If the task status is "NOT_STARTED", transition to "LEARNING" since active studying was recorded
        if ("NOT_STARTED".equals(day.getStatus())) {
            day.setStatus("LEARNING");
            learningPlanDayRepository.save(day);
        }

        // Auto-increment watchPercentage if watch info is provided
        if (request.getResourceUrl() != null && request.getResourceUrl().equals(day.getSelectedResourceUrl())) {
            // E.g., if chrome extension reports watch percentage, we can sync it or mock incremental progress
            int minutesStudied = request.getActiveLearningTime() / 60;
            int totalMins = day.getEstimatedStudyMinutes() != null ? day.getEstimatedStudyMinutes() : 60;
            int newPercentage = Math.min(100, day.getWatchPercentage() + (int) (((double) minutesStudied / totalMins) * 100.0));
            day.setWatchPercentage(newPercentage);
            if (newPercentage >= 95) {
                day.setVideoCompleted(true);
            }
            learningPlanDayRepository.save(day);
        }

        // Award XP to user based on focused study time
        // Formula: study minutes * (focus score percentage)
        double focusScore = request.getFocusedTime() != null && request.getActiveLearningTime() > 0 
                ? ((double) request.getFocusedTime() / request.getActiveLearningTime()) * 100.0 
                : 100.0;
        int studyMinutes = request.getActiveLearningTime() / 60;
        int newXp = (int) (studyMinutes * (focusScore / 100.0));
        
        // Save user XP
        if (user.getXp() == null) {
            user.setXp(newXp);
        } else {
            user.setXp(user.getXp() + newXp);
        }
        userRepository.save(user);

        return LearningSessionMapper.toResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningSessionResponse> getSessionsByDay(Long dayId, String userEmail) {
        LearningPlanDay day = learningPlanDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning task not found"));

        if (!day.getLearningPlan().getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("Access denied");
        }

        List<LearningSession> sessions = learningSessionRepository.findByLearningPlanDayId(dayId);
        return sessions.stream()
                .map(LearningSessionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningSessionResponse> getUserSessions(String userEmail) {
        List<LearningSession> sessions = learningSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        return sessions.stream()
                .map(LearningSessionMapper::toResponse)
                .collect(Collectors.toList());
    }
}
