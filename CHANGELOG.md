# Changelog: CampusConnect v1.0.0

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-07-19

### Added
- Created a fully responsive **Flutter Cross-Platform Client** (Android, iOS, Web) supporting Material 3 adaptive drawer layouts, responsive grids, and Google Drive links.
- Created `docker-compose.yml` for database containerization.
- Created `VERSION` and `RELEASE_NOTES.md` documents.

### Fixed
- Fixed Gemini API 400 Bad Request by wrapping the system instruction parameter in a structured `Content` object (rather than raw strings) for the `startChat` query.
- Cleaned leading whitespace in the `GEMINI_API_KEY` configuration inside `.env` and added defensive `.trim()` checks across all API requests in `geminiService.js`.
- Corrected the configured `GEMINI_MODEL` to use the active and supported `gemini-3.5-flash` model.
- Restructured `AcademicTools.jsx` GPA calculation blocks to fix compiler div tag wrapping syntax errors.
- Hardened SRM email verification check regex to enforce case-insensitive ending domain checks (`@srmist.edu.in`).

### Security
- Verified CSRF security rules, helmet routing, and strict rate-limiting on sensitive authentication endpoints.
