package com.polaris.repository;

import com.polaris.entity.LearningSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningSessionRepository extends JpaRepository<LearningSession, Long> {
    List<LearningSession> findByUserEmailOrderByCreatedAtDesc(String email);
    List<LearningSession> findByLearningPlanDayId(Long learningPlanDayId);
}
