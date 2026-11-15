# UML Use Cases

```mermaid
flowchart LR
  Student([Student])
  Officer([Placement Officer])
  Company([Company Recruiter])
  System((SPMS))
  Student --> A[Register / Sign in]
  Student --> B[Maintain academic profile]
  Student --> C[Browse placement drives]
  Student --> D[Apply to eligible drive]
  Student --> E[Track application]
  Officer --> F[View student directory]
  Officer --> G[Create placement drive]
  Officer --> H[Monitor placement statistics]
  Company --> I[Create placement opportunity]
  Company --> J[Review applicants - planned]
  A --> System
  B --> System
  C --> System
  D --> System
  E --> System
  F --> System
  G --> System
  H --> System
  I --> System
  J --> System
```

## Use case: Apply to placement drive

- **Primary actor:** Student
- **Precondition:** Student is authenticated and has a student role; drive is open and before deadline.
- **Main flow:** Student opens a drive → system loads eligibility requirements → student submits application → system validates CGPA, backlog count, department and graduation year → application is saved → confirmation is returned.
- **Alternative flows:** Ineligible student receives a clear rejection; duplicate application is rejected; closed/expired drive cannot accept applications.
- **Postcondition:** One application record exists for the student-drive pair.
