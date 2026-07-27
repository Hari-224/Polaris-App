# Polaris Development Rules

These rules must be followed throughout the project.

---

# General Rules

- Follow Clean Layered Architecture.
- Write production-ready code.
- Write clean and readable code.
- Follow SOLID principles where appropriate.
- Avoid unnecessary complexity.
- Do not generate placeholder code unless requested.
- Do not generate unused classes.
- Keep modules independent.

---

# Backend Rules

Technology

- Java 21
- Spring Boot 3
- Maven (pom.xml only)
- application.properties only
- MySQL
- Spring Security
- Spring Data JPA

Architecture

Controller

↓

Service

↓

Repository

↓

Database

Never skip layers.

---

# Package Structure

com.polaris

config

controller

service

service.impl

repository

entity

dto

mapper

exception

security

util

common

---

# Coding Rules

- Use constructor injection only.
- Never use field injection.
- Never expose Entity classes through REST APIs.
- Always use DTOs.
- Validate request DTOs.
- Return meaningful HTTP status codes.
- Keep business logic inside Service classes.
- Repository should contain only database operations.
- Avoid duplicate code.
- Use meaningful class and method names.

---

# Exception Handling

Use centralized Global Exception Handling.

Never use try-catch blocks in Controllers unless absolutely necessary.

Return consistent error responses.

---

# Database Rules

- Use MySQL.
- Use JPA.
- Use proper relationships.
- Use lazy loading where appropriate.
- Use UUID or auto-generated IDs consistently (choose one and keep it consistent).
- Avoid unnecessary tables.

---

# Security Rules

- JWT Authentication
- Password encryption using BCrypt
- Role-based Authorization
- Never hardcode secrets
- Never expose sensitive information

---

# Frontend Rules

Technology

- React
- JavaScript
- Vite
- Tailwind CSS
- Axios
- React Router

Use

- Functional Components
- React Hooks
- Reusable Components

Do not use

- Class Components
- Redux unless requested

---

# API Rules

REST API only.

Use proper HTTP methods.

GET

Retrieve data

POST

Create

PUT

Update

DELETE

Delete

---

# Folder Structure

Backend and frontend should remain organized.

Do not create unnecessary folders.

Follow existing project structure.

---

# Chrome Extension Rules

Use

Manifest Version 3

Track only during active Focus Sessions.

Never monitor users continuously.

Never collect sensitive user data.

---

# AI Rules

When generating code

- Read PROJECT_CONTEXT.md first.
- Follow these rules strictly.
- Implement only the requested phase.
- Never modify completed modules unless instructed.
- Explain changes before modifying existing files.
- Reuse existing code whenever possible.
- Keep the codebase consistent.

---

# Development Workflow

For every phase

1. Analyze the requirement.
2. Explain the implementation approach.
3. Generate backend.
4. Generate frontend.
5. Explain how to test.
6. Wait for the next phase.

Never implement future phases automatically.

Only implement the current requested module.