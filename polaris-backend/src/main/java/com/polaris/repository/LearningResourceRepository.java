package com.polaris.repository;

import com.polaris.entity.LearningResource;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningResourceRepository extends JpaRepository<LearningResource, Long> {

    Optional<LearningResource> findByLearningPlanDayId(Long learningPlanDayId);

    Optional<LearningResource> findByUserIdAndVideoId(Long userId, String videoId);

    Optional<LearningResource> findByUserEmailAndResourceUrl(String userEmail, String resourceUrl);

    Optional<LearningResource> findByUserEmailAndVideoId(String userEmail, String videoId);

    List<LearningResource> findByUserIdOrderByLastVisitedDesc(Long userId);
}
