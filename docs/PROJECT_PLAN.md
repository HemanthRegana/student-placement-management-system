# Software Project Management Plan

## Project charter
**Project:** Student Placement Management System (SPMS)  
**Objective:** Deliver a secure, role-based web platform to coordinate campus placement drives and student applications.  
**Sponsor / customer:** Institution placement cell (academic project assumption).  
**Project lead:** Student project team (to be filled by the team).  
**Methodology:** Iterative Agile development with weekly review and GitHub issue tracking.

## Work Breakdown Structure (WBS)

| WBS | Work package | Deliverable |
|---|---|---|
| 1.0 | Initiation | Charter, problem statement, stakeholders |
| 2.0 | Requirements | SRS, use cases, acceptance criteria |
| 3.0 | Design | Architecture, ER model, UML, UI wireframes |
| 4.0 | Development | Authentication, roles, drives, applications, dashboards |
| 5.0 | Verification | Unit, API, integration and user-acceptance tests |
| 6.0 | Release | GitHub repository, environment configuration, Vercel deployment |
| 7.0 | Closure | User guide, final report, presentation and retrospective |

## Indicative 6-week schedule

| Week | Planned work | Milestone |
|---|---|---|
| 1 | Problem definition, stakeholder analysis, SRS | Requirements baseline |
| 2 | Architecture, schema, UML and UI design | Design review |
| 3 | Authentication, database models and dashboards | Core foundation |
| 4 | Placement drives, eligibility and applications | Feature complete |
| 5 | Testing, fixes, security review and documentation | QA sign-off |
| 6 | Deployment, demo rehearsal and final report | Project handover |

## Team responsibilities (adapt to actual team)

| Role | Responsibility |
|---|---|
| Project manager | Scope, schedule, meetings, risk and status reporting |
| Frontend developer | Pages, forms, responsive design and accessibility |
| Backend developer | APIs, authentication, validation and business rules |
| Database / QA | Schema, test data, test cases and defect tracking |
| DevOps / documentation | Git workflow, CI/deployment and project records |

For a small team, members may hold multiple responsibilities. Replace role labels with actual names.

## Communication plan

- Weekly 15–30 minute progress meeting.
- GitHub Issues for defects and feature tasks.
- Pull requests for reviewed code changes.
- README and docs folder as the source of truth.
- Escalate schedule or security blockers to the project lead within one working day.

## Change control

1. Raise a GitHub issue with rationale and acceptance criteria.
2. Project lead assesses scope, effort, risk and schedule impact.
3. Approve/reject and update backlog and project plan.
4. Implement in a feature branch and review via pull request.
5. Update tests and documentation before merging.

## Definition of done

- Acceptance criteria pass.
- No known critical/high security defect remains.
- Changes are reviewed and merged.
- Automated checks/build pass.
- User-facing and technical documentation is updated.
