package com.polaris.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import lombok.Data;
import org.springframework.stereotype.Component;

@Component
public class JsonResponseParser {

    private final ObjectMapper objectMapper;

    public JsonResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public RoadmapJson parseRoadmap(String rawResponse) {
        if (rawResponse == null) {
            throw new IllegalArgumentException("Response from AI provider was empty");
        }

        String sanitized = rawResponse.trim();
        
        // Strip markdown block markers if any (e.g. ```json ... ```)
        if (sanitized.startsWith("```")) {
            int firstNewline = sanitized.indexOf('\n');
            if (firstNewline != -1) {
                sanitized = sanitized.substring(firstNewline + 1);
            } else {
                sanitized = sanitized.substring(3);
            }
            if (sanitized.endsWith("```")) {
                sanitized = sanitized.substring(0, sanitized.length() - 3);
            }
            sanitized = sanitized.trim();
        }

        try {
            return objectMapper.readValue(sanitized, RoadmapJson.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("AI response JSON parsing failed: " + e.getMessage(), e);
        }
    }

    @Data
    public static class RoadmapJson {
        private String topic;
        private List<DayJson> days;
    }

    @Data
    public static class DayJson {
        private int day;
        private String title;
        private String description;
        private List<String> objectives;
        private Integer estimatedStudyMinutes;
        private String difficulty;
    }
}
