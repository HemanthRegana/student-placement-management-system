# Risk Register

Scores: Probability (P) and Impact (I) are rated 1–5; exposure = P × I.

| ID | Risk | P | I | Exposure | Mitigation / response | Owner |
|---|---|---:|---:|---:|---|---|
| R1 | MongoDB outage or invalid URI | 3 | 4 | 12 | Validate env locally; managed DB health checks; backups | Backend |
| R2 | Unauthorized access to student data | 2 | 5 | 10 | Role checks, least privilege, secure cookies, security review | Security lead |
| R3 | Privileged account self-registration | 2 | 5 | 10 | Public registration restricted to STUDENT; controlled provisioning | Project lead |
| R4 | Scope creep | 4 | 3 | 12 | Baseline MVP; change-control process; prioritize must-haves | PM |
| R5 | Schedule slippage | 3 | 4 | 12 | Weekly milestones, buffer, early integration | PM |
| R6 | Incorrect student eligibility data | 3 | 4 | 12 | Officer verification and test boundary conditions | Placement cell |
| R7 | Deployment configuration error | 3 | 3 | 9 | Staging build, env checklist, rollback plan | DevOps |
| R8 | Exposure of secrets in Git | 2 | 5 | 10 | .gitignore, secret scanning, rotate leaked credentials | All developers |
| R9 | Duplicate or race-condition applications | 3 | 3 | 9 | Unique compound index and duplicate error handling | Backend |
| R10 | Low adoption / usability issues | 3 | 3 | 9 | Student/officer demo feedback and usability testing | UX/PM |

Review risks at each weekly project meeting and update probability, impact, owner and response status.
