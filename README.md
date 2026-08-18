# Smart Property Maintenance & Rental Operations System

## Project Overview

This project is developed for the SE3090 Software Engineering Frameworks module.

The system manages property rental operations, tenant management, maintenance requests, maintenance workers, work orders, and Agentic AI-assisted maintenance coordination.

## Technology Stack

### Backend
- C#
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL

### Web Application
- React
- Vite

### Mobile Application
- Flutter
- Dart

### Agentic AI
The system includes four distinct Agentic AI responsibilities integrated through the ASP.NET Core backend.

### Development Tools
- Git
- GitHub
- GitHub Actions
- Swagger / OpenAPI

## User Roles

The system contains four main roles:

- Site Admin
- Property Owner
- Tenant
- Maintenance Worker

## Main Business Components

### Member 1
Property & Unit Management

Agent:
Property Maintenance Planner & Coordinator

### Member 2
Tenant & Tenancy Management

Includes:
- Tenant creation
- Tenancy management
- Tenant activation PIN workflow

Agent:
Visual Maintenance Analysis & Responsibility

### Member 3
Maintenance Request Management

Includes:
- Maintenance request submission
- Photo upload
- Request status
- Maintenance history

Agent:
Technician Matching & Scheduling

### Member 4
Worker & Work Order Management

Includes:
- Worker registration
- Worker verification
- Availability
- Work orders
- Scheduling

Agent:
Validation, Safety & Approval Guard

## Repository Structure

```text
backend/
    SmartProperty.Api/
    SmartProperty.Tests/

web/
    smart-property-web/

mobile/
    smart_property_mobile/

docs/

.github/
    workflows/

    after `workflows/`. We can improve the README later.
