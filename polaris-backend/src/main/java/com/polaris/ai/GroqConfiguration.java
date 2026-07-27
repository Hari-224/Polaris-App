package com.polaris.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GroqConfiguration {

    @Value("${groq.api.key:mock_key}")
    private String apiKey;

    @Value("${groq.base.url:https://api.groq.com/openai/v1/chat/completions}")
    private String baseUrl;

    @Value("${groq.model:llama3-8b-8192}")
    private String model;

    public String getApiKey() {
        return apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getModel() {
        return model;
    }
}
