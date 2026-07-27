package com.polaris.repository;

import com.polaris.entity.ExtensionPairing;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtensionPairingRepository extends JpaRepository<ExtensionPairing, Long> {
    Optional<ExtensionPairing> findByDeviceId(String deviceId);
    void deleteByDeviceId(String deviceId);
}
