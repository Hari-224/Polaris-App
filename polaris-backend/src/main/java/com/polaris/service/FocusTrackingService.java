package com.polaris.service;

import com.polaris.dto.EndFocusRequest;
import com.polaris.dto.FocusSessionResponse;
import com.polaris.dto.StartFocusRequest;
import com.polaris.dto.TrackingActivityRequest;
import com.polaris.dto.TrackingResourceRequest;
import com.polaris.dto.TrackingSessionRequest;
import java.util.List;

public interface FocusTrackingService {

    FocusSessionResponse startFocusSession(StartFocusRequest request, String userEmail);

    FocusSessionResponse endFocusSession(EndFocusRequest request, String userEmail);

    FocusSessionResponse getActiveFocusSession(String userEmail);

    void trackSession(TrackingSessionRequest request, String userEmail);

    void trackResource(TrackingResourceRequest request, String userEmail);

    void trackActivity(TrackingActivityRequest request, String userEmail);

    void trackActivityBatch(List<TrackingActivityRequest> requests, String userEmail);

    void trackResourceBatch(List<TrackingResourceRequest> requests, String userEmail);

    com.polaris.dto.ExtensionContextResponse getExtensionContext(String userEmail);
}
