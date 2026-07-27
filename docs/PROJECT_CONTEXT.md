# Polaris - AI-Powered Learning Guidance Platform

## Project Name

Polaris – AI-Powered Learning Guidance Platform

---

# Vision

Polaris is an AI-powered Learning Guidance Platform that helps students organize, track, and improve their self-learning journey.

Polaris is NOT a Learning Management System (LMS).

Polaris does NOT teach students.

Polaris does NOT replace YouTube, ChatGPT, Udemy, Coursera, or other educational platforms.

Instead, Polaris guides students to learn effectively using their preferred educational resources.

---

# Mission

Help students become disciplined, focused, and consistent self-learners.

---

# Product Philosophy

Students already know WHERE to learn.

Polaris helps them know

- What to learn
- When to learn
- How much to learn
- Whether they understood the topic
- What to revise next

Learning Flow

Plan

↓

Focus

↓

Learn

↓

Track

↓

Assess

↓

Improve

↓

Repeat

---

# Target Users

Primary Users

- Students

Secondary Users

- Parents

Future Users

- Faculty
- Educational Institutions

---

# Problem Statement

Students learn from multiple online resources such as

- YouTube
- Documentation
- Blogs
- Online Courses
- Books

Current problems include

- No structured learning roadmap
- Easily distracted while studying
- Difficulty resuming previous learning
- No centralized learning progress
- No productivity tracking
- No personalized study guidance

Polaris solves these problems without replacing existing learning resources.

---

# Core Modules

## Authentication

Roles

- Student
- Parent

Features

- Registration
- Login
- JWT Authentication
- Parent-Student Connection

---

## AI Learning Planner

Student enters

- Learning Topic
- Number of Study Days

Polaris generates

- Day-wise learning roadmap

The planner organizes learning.

It does not teach the content.

---

## Learning Resource Manager

Students choose their preferred learning resources.

Examples

- YouTube
- Documentation
- Books
- Online Courses

Features

- Save selected learning resource
- Resume learning later
- Track completed topics

Students always choose their own instructor and learning source.

---

## Focus Shield

Students manually start a Focus Session.

During Focus Session

- Chrome Extension becomes active
- Strict Focus blocks distracting websites
- Educational websites remain accessible
- Study duration is recorded

Tracking stops automatically when the Focus Session ends.

No background monitoring.

---

## Learning Analytics

Generate

- Daily Study Hours
- Weekly Reports
- Monthly Reports
- Focus Score
- Productivity Score
- Learning Consistency

Display meaningful learning insights instead of browsing history.

---

## Adaptive Quiz

After completing learning topics

Students can generate quizzes.

Features

- Topic-based MCQs
- Quiz Results
- Weak Concept Identification

---

## AI Recommendation Engine

Generate personalized recommendations using

- Learning Progress
- Quiz Performance
- Study Consistency

Examples

- Topics to revise
- Next learning topic
- Daily priorities

---

## Dashboard

Display

- Learning Progress
- Study Statistics
- Roadmap Progress
- Quiz Performance
- Recommendations
- Focus Reports
- Gamification

---

## Gamification

Features

- XP
- Badges
- Levels
- Streaks
- Achievements
- Leaderboard

Purpose

Encourage consistent learning.

---

## Parent Dashboard

Parents can view

- Weekly Study Reports
- Goal Completion
- Overall Progress
- Learning Consistency

Parents cannot view detailed browsing history.

---

# Privacy Principles

Polaris follows a privacy-first design.

Only track activities while the student has an active Focus Session.

Never collect

- Passwords
- Keyboard input
- Personal messages
- Banking information
- Personal files
- Email contents

Students explicitly start and stop every Focus Session.

---

# Technology Stack

Backend

- Java 21
- Spring Boot 3
- Maven
- Spring Security
- Spring Data JPA
- MySQL
- JWT

Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Axios
- React Router

Extension

- Chrome Extension
- Manifest V3

---

# Development Strategy

The application will be built incrementally.

Each phase should produce a stable working application.

Do not implement future modules until requested.

Always preserve existing functionality.

---

# AI Instructions

This document is the single source of truth for Polaris.

When implementing features

- Never redesign the application architecture.
- Implement only the requested module.
- Do not generate unrelated features.
- Keep the architecture modular.
- Maintain consistency throughout the project.
- Explain required changes before modifying existing files.