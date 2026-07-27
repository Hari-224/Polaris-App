package com.polaris.repository;

import com.polaris.entity.FocusSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findByUserEmailOrderByCreatedAtDesc(String email);
    Optional<FocusSession> findFirstByUserEmailAndStatusOrderByCreatedAtDesc(String email, String status);
}
