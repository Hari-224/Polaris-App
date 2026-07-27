package com.polaris.repository;

import com.polaris.entity.LearningPlanDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningPlanDayRepository extends JpaRepository<LearningPlanDay, Long> {
}
