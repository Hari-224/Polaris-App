package com.polaris.service;

import com.polaris.dto.CreateSessionRequest;
import com.polaris.dto.LearningSessionResponse;
import java.util.List;

public interface LearningSessionService {

    LearningSessionResponse recordSession(Long dayId, CreateSessionRequest request, String userEmail);

    List<LearningSessionResponse> getSessionsByDay(Long dayId, String userEmail);

    List<LearningSessionResponse> getUserSessions(String userEmail);
}
