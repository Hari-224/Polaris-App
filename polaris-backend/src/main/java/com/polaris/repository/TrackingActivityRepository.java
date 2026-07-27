package com.polaris.repository;

import com.polaris.entity.TrackingActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingActivityRepository extends JpaRepository<TrackingActivity, Long> {
    List<TrackingActivity> findByUserEmailOrderByCreatedAtDesc(String email);
    List<TrackingActivity> findByFocusSessionId(Long focusSessionId);
}
