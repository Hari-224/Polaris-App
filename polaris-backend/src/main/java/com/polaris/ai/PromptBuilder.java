package com.polaris.ai;

public class PromptBuilder {

    private PromptBuilder() {
    }

    public static String buildSystemPrompt() {
        return "You are an expert personalized education AI planner. "
                + "You generate strict JSON roadmap learning plans. "
                + "Your output must be VALID JSON ONLY. "
                + "Do NOT wrap it in markdown code blocks like ```json. "
                + "Do NOT write conversational text, introductions, descriptions outside JSON, or summaries. "
                + "Strictly follow the JSON schema structure in your output.";
    }

    public static String buildUserPrompt(String topic, int numberOfDays, int dailyStudyHours) {
        return String.format(
                "Generate a step-by-step day-by-day learning plan roadmap for the topic: \"%s\".\n"
                + "Duration: %d days.\n"
                + "Daily study hours: %d hours per day.\n\n"
                + "Return a JSON object matching this exact structure:\n"
                + "{\n"
                + "  \"topic\": \"The topic name\",\n"
                + "  \"days\": [\n"
                + "    {\n"
                + "      \"day\": 1,\n"
                + "      \"title\": \"Title of study topic for Day 1\",\n"
                + "      \"description\": \"Short action-oriented study task details for Day 1.\",\n"
                + "      \"objectives\": [\n"
                + "        \"Objective 1 details\",\n"
                + "        \"Objective 2 details\"\n"
                + "      ],\n"
                + "      \"estimatedStudyMinutes\": 90,\n"
                + "      \"difficulty\": \"Easy\"\n"
                + "    }\n"
                + "  ]\n"
                + "}\n\n"
                + "Guidelines:\n"
                + "1. Ensure you generate exactly %d elements in the days array, numbered 1 to %d in order.\n"
                + "2. Map difficulty to values like 'Easy', 'Medium', or 'Hard'.\n"
                + "3. Set estimatedStudyMinutes to a realistic study duration (e.g. 30 to 120 minutes) fitting the daily target.",
                topic, numberOfDays, dailyStudyHours, numberOfDays, numberOfDays
        );
    }
}
