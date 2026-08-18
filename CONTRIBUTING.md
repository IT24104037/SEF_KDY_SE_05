
# Contributing Guide

## Branching Strategy

This project uses two main branches:

- `main` - stable and deployable version
- `develop` - integration branch for completed features

Do not normally push directly to `main` or `develop`.

Create a feature branch from `develop`, for example:

- `feature/property-registration`
- `feature/tenant-activation-pin`
- `feature/maintenance-request`
- `feature/worker-availability`
- `chore/project-foundation`

## Development Workflow

1. Pull the latest `develop` branch.
2. Create a new feature branch.
3. Work only on the assigned feature or task.
4. Commit changes using meaningful commit messages.
5. Push the feature branch to GitHub.
6. Create a Pull Request into `develop`.
7. Another group member reviews the Pull Request.
8. Fix any requested changes.
9. Merge only after review and successful CI checks.

## Commit Guidelines

Use meaningful commit messages such as:

- `feat: add property registration endpoint`
- `feat: implement tenant activation PIN`
- `fix: validate worker availability`
- `test: add tenancy service tests`
- `docs: update database design`
- `chore: configure project foundation`

Avoid vague messages such as:

- `update`
- `changes`
- `final`
- `work done`

## Generated Files

Do not commit generated or local files such as:

- `bin/`
- `obj/`
- `node_modules/`
- `dist/`
- `.dart_tool/`
- `build/`
- `android/local.properties`

## Secrets

Never commit:

- database passwords
- JWT secret keys
- API keys
- AI provider keys
- access tokens

Use environment variables and example configuration files instead.

## Team Responsibilities

Each member must contribute to:

- ASP.NET Core backend
- PostgreSQL / EF Core
- React web application
- Flutter mobile application
- testing
- Git and Pull Requests
- documentation
- their assigned Agentic AI contribution

All work should be visible through meaningful commits and Pull Requests.