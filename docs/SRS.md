# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
SPMS centralizes campus placement activities. It provides a shared workflow for students, placement officers and recruiters, reducing spreadsheet-based coordination and improving visibility into recruitment progress.

### 1.2 Scope
The system supports student profiles, role-based access, placement-drive publication, eligibility rules, student applications and application-status tracking. The initial implementation is a web application responsive to desktop and mobile browsers.

### 1.3 Stakeholders
- Students: maintain profiles, discover drives and apply.
- Placement officers: monitor students and coordinate placement activities.
- Company/recruiter users: publish opportunities and review applicants.
- Institution administrators: govern access, data policy and system configuration.

## 2. Overall description

### 2.1 Product perspective
A browser-based, three-tier application: Next.js presentation and API layer, MongoDB persistence, and external hosting/managed database services.

### 2.2 User classes
| Role | Permissions |
|---|---|
| Student | Manage own profile (profile editing extension), browse drives, apply, view own applications |
| Placement officer | View student directory, create drives, view applications; status management is a planned extension |
| Company | Create drives and view applicants; recruiter workflow is a planned extension |

### 2.3 Operating environment
Node.js 20+, Next.js 14, TypeScript, MongoDB, modern Chromium/Firefox/Safari browser, HTTPS hosting.

## 3. Functional requirements

- **FR-01 Authentication:** users can register and sign in with valid credentials.
- **FR-02 Authorization:** protected resources require a valid session and role checks.
- **FR-03 Student registration:** public registration creates student accounts only.
- **FR-04 Student directory:** placement officers can view registered student academic summaries.
- **FR-05 Drive publication:** officers and company users can create drives with title, employer, description, package, deadline and eligibility rules.
- **FR-06 Drive discovery:** authenticated users can retrieve currently open drives.
- **FR-07 Eligibility validation:** applications are accepted only when student CGPA, backlog count, department and graduation year satisfy the drive rules.
- **FR-08 Application submission:** students can submit one application per drive.
- **FR-09 Application tracking:** students can view their own application status; officers can view all applications.
- **FR-10 Dashboard:** users see summary counts relevant to their role.

## 4. Non-functional requirements

- **NFR-01 Security:** passwords are hashed using bcrypt; sessions use signed, HTTP-only cookies; privileged routes enforce role checks.
- **NFR-02 Privacy:** collect only necessary academic/contact data; restrict access by role; use synthetic data for demonstrations.
- **NFR-03 Performance:** common dashboard/API requests should target under 2 seconds under normal academic-demo load.
- **NFR-04 Availability:** production deployment should use managed hosting and database backups.
- **NFR-05 Usability:** responsive layout, clear validation and readable status indicators.
- **NFR-06 Maintainability:** modular routes, models, shared authentication helpers and documented setup.
- **NFR-07 Compatibility:** current evergreen desktop and mobile browsers.

## 5. Data requirements

- User: name, email, password hash, role, roll number, department, graduation year, CGPA, backlogs, contact and verification state.
- Job: title, company, description, location, package, eligibility rules, deadline, status and creator.
- Application: student reference, job reference, status, notes and timestamps.

## 6. Constraints and assumptions

- MongoDB connectivity and deployment environment variables are available.
- Student eligibility information is entered accurately and verified by the institution.
- Public sign-up cannot assign privileged roles.
- This academic starter does not claim to be production-ready for real student records without institutional security/privacy review.

## 7. Acceptance criteria

1. A student can register, sign in and sign out.
2. An unauthenticated visitor cannot access the dashboard or application APIs.
3. A student cannot create a placement drive.
4. An officer can create a drive through the protected API.
5. A student meeting eligibility criteria can apply once.
6. An ineligible student and duplicate application are rejected.
7. Student application history is limited to their own records.
8. Officer dashboard and directory load successfully from MongoDB.
