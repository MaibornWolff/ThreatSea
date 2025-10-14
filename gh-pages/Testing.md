
# Testing Strategy
This page aims at providing a common understanding which test methods we are doing for which purpose and in which manner for ThreatSea.
It also defines some relevant target KPIs in regards to testing.  
MaibornWolff internally uses a three stage environment approach (dev, staging, prod) for which different kinds of tests are applied, indicated by the respective labels. In general, every developer SHOULD use the full amount of provided tests within their local environment at their own discretion.

## Linting
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>LOCAL_BUILD</strong>
</container>  

- We use linting to achieve a good and consistent code style.
- Linting SHALL by default be activated for frontend and backend.
- **TODO: Which style convention exactly** Finetune linting rules to a commonly agreed style convention.

## Unit Tests
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>LOCAL_BUILD</strong>
</container>
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>DEV</strong>
</container>  

- We use unit tests to achieve a good, consistent and reliable code quality in the backend
- Unit Tests SHALL run with each local build and on dev.
- We are aiming for an 80% statement coverage for unit tests
- For new features, unit tests SHALL be implemented by the developer that is responsible for the feature ticket. This is covered by the Definition of Done.
- We use **TODO: Update** Jest for unit testing
  - Jest is able to generate a list of the existing unit tests
  - For each unit test, an explanation of its purpose SHALL be given.
- We implement unit tests in accordance with the guidelines and best practices **TODO: which (public) guidelines and best practices** 

## Bug Tests
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>DEV</strong>
</container>
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>STAGING</strong>
</container>  

*TO BE DISCUSSED*

- We use bug tests to confirm the absence of known bugs in the long run
- Bug tests SHALL be implemented by the developer that is responsible for the respective bug ticket. This is covered by the Definition of Done **TODO: link DoD**.
- For bugfixes we use a test-driven approach, i.e., before we start working on a bug fix, we implement a test case for the expected behaviour.
- Depending on the complexity of the bugtest, bug tests SHALL run on dev or staging.
- Documentation of the bug tests SHALL be created in the respective bug ticket.

## E2E Tests
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>LOCAL_BUILD</strong>
</container>
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>STAGING</strong>
</container>  

*WORK IN PROGRESS*

- We use automated end-to-end-tests to verify that the main features of the software are still functioning and no regressions were introduced by recent changes.
- Also, these tests provide quality assurance for the frontend
- Every developer SHOULD use the provided E2E tests in their local environment to assure the absence of regressions in their code
- All E2E tests MUST pass in the staging environment before a new software version is deployed to production
- The E2E tests SHALL be adapted if changes to the use flow were introduced
- New E2E tests SHALL be implemented by the developer if new features are introduced
- E2E tests SHOULD include negative tests making sure that explicitely undesireable behaviour does not occur. Especially after fixing major bugs in E2E behaviour or in the frontend, according E2E tests
to rule out regressions SHALL be implemented.
- We use **TODO: Update** Cypress as test framework

## Security Tests
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>DEV</strong>
</container>  

*WORK IN PROGRESS*

**TODO: open for dicsussion - how can we handle vulnerabilities with a community when managing them in an access-restricted system**
- We use the following security tests to validate the security of ThreatSea. For details on their purpose see the following blog article: https://www.maibornwolff.de/know-how/vulnerability-management-von-diesen-5-schritten-profitieren-projekte/#no-1-vulnerabilities-vermeiden-ist-der-erste-schritt-des-vulnerability-managements
  - trivy
  - Semgrep OSS
  - KICS
  - Checkov
  - Gitleaks
  - DrHeader
- We manage and document the findings of these tests in SecObserve in accordance with  internal guidelines on vulnerability management.
- Security tests SHALL run with each build on dev AND in regular intervals independently of build times

## Smoke Tests
<container style="background-color:rgba(35,60,87,.75);color:white;">
  <strong>PROD</strong>
</container>  

*WORK IN PROGRESS*

- Smoke tests are used to verify that a new software version recently deployed to production is actually running.
- They cover the main functionality of a "happy path" in end-to-end fashion.
- Smoke test SHALL run after every deployment to production
