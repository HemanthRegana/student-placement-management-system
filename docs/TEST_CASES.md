# Test Plan and Test Cases

## Test strategy

- Unit: eligibility decision rules, validation and helper functions (add automated unit test framework in next iteration).
- API: authentication, authorization, validation, duplicate application and error responses.
- Integration: Next.js routes with MongoDB models.
- UI: registration/login, responsive dashboard, job discovery and application tracking.
- UAT: representative student, placement officer and recruiter walkthroughs.

## Test cases

| ID | Scenario | Steps / input | Expected result | Priority |
|---|---|---|---|---|
| TC-01 | Student registration | Valid name, email, password and academic details | Account created with STUDENT role | High |
| TC-02 | Duplicate registration | Register same email again | HTTP 409; duplicate account not created | High |
| TC-03 | Invalid password | Login with wrong password | HTTP 401; no session issued | High |
| TC-04 | Protected route | Open dashboard while signed out | Redirect to login | High |
| TC-05 | Student creates drive | Student POSTs `/api/jobs` | HTTP 403 | High |
| TC-06 | Officer creates drive | Officer sends valid drive payload | HTTP 201 and drive persisted | High |
| TC-07 | Browse open drives | GET `/api/jobs` | Only open, non-expired drives returned | High |
| TC-08 | Eligible application | CGPA/backlogs/dept/year satisfy rules | Application created | High |
| TC-09 | Low CGPA | Student CGPA below minimum | HTTP 403; no application created | High |
| TC-10 | Excess backlogs | Student backlogs above maximum | HTTP 403 | High |
| TC-11 | Duplicate application | Apply twice to same drive | Second request rejected | High |
| TC-12 | Application privacy | Student requests applications endpoint | Only own applications returned | High |
| TC-13 | Officer directory | Officer opens students page | Student list visible | Medium |
| TC-14 | Student directory restriction | Student opens `/dashboard/students` | Redirect to dashboard | High |
| TC-15 | Invalid drive data | Missing title / invalid deadline | Validation error | Medium |
| TC-16 | Mobile layout | Open pages at 375px width | No horizontal overflow on primary flows | Medium |

## Release exit criteria

- All high-priority test cases pass.
- Production build completes successfully.
- Environment variables are configured outside source control.
- No test or demo data contains real student personal information.
