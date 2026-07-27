package com.polaris.ai;

import com.polaris.exception.BadRequestException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Service
public class GroqProvider implements AIProvider {

    private final GroqConfiguration config;
    private final RestTemplate restTemplate;

    public GroqProvider(GroqConfiguration config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String generateRoadmap(String topic, int numberOfDays, int dailyStudyHours) {
        if (config.getApiKey() == null || config.getApiKey().trim().isEmpty() || config.getApiKey().equals("mock_key")) {
            throw new BadRequestException("AI Provider API Key is not configured. Please set the groq.api.key property.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + config.getApiKey());

        List<GroqRequest.Message> messages = new ArrayList<>();
        messages.add(GroqRequest.Message.builder()
                .role("system")
                .content(PromptBuilder.buildSystemPrompt())
                .build());
        messages.add(GroqRequest.Message.builder()
                .role("user")
                .content(PromptBuilder.buildUserPrompt(topic, numberOfDays, dailyStudyHours))
                .build());

        GroqRequest request = GroqRequest.builder()
                .model(config.getModel())
                .temperature(0.2)
                .messages(messages)
                .build();

        HttpEntity<GroqRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<GroqResponse> responseEntity = restTemplate.postForEntity(
                    config.getBaseUrl(),
                    entity,
                    GroqResponse.class
            );

            GroqResponse response = responseEntity.getBody();
            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new BadRequestException("AI Provider returned an empty response.");
            }

            return response.getChoices().get(0).getMessage().getContent();

        } catch (HttpClientErrorException.Unauthorized e) {
            throw new BadRequestException("AI Provider authentication failed. Please check your API key.");
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new BadRequestException("AI Provider rate limit exceeded. Please try again later.");
        } catch (HttpClientErrorException e) {
            throw new BadRequestException("AI Provider error: " + e.getResponseBodyAsString());
        } catch (ResourceAccessException e) {
            throw new BadRequestException("AI Provider connection timed out or is unreachable: " + e.getMessage());
        } catch (Exception e) {
            throw new BadRequestException("Unexpected failure calling AI Provider: " + e.getMessage());
        }
    }
}
