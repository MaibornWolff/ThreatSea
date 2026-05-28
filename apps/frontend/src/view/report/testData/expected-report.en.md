# Sample Project

Cyber Security | MaibornWolff

ThreatSea by MaibornWolff

**2025-01-15**

*internal*

This is the project description.

It spans multiple paragraphs.  
With line breaks.

---

## Table of Contents

1. [The 4x6 Methodology](#chapter-methodExplanation)
2. [Explanation of Probability and Damage Scale](#chapter-explanationScale)
3. [Risk Matrices](#chapter-matrix)
4. [Assets](#chapter-assetsDetails)
5. [Measures](#chapter-measuresDetails)
6. [List of Threats](#chapter-riskList)
7. [Threats](#chapter-riskDetails)

---

## <a id="chapter-methodExplanation"></a>The 4x6 Methodology

The 4x6 methodology is based on a matrix that specifies every conceivable threat from the four classes of attackers for any IT system abstracted to six classes of attack points.

| | Unauthorised Parties | System Users | Application Users | (Technical) Administrators |
|---|---|---|---|---|
| User Interface | Physical UI access |  | Detrimental UI usage |  |
| Processing Infrastructure | Physical attack on processing | Internal breach during processing |  | Privilege abuse on processing |
| Data Storage Infrastructure | Physical data storage access | Internal breach on data storage |  | Privilege abuse on data storage |
| Communication Infrastructure | Physical attack on transmission | Internal breach on transmission |  | Privilege abuse on transmission |
| Communication Interfaces | Physical interface attack | Breach via interface access | Detrimental interface usage |  |
| User Behaviour | Deception |  |  |  |

**Attackers:**

- **Unauthorised Parties:** Entities with no tie to and especially no authorisation on the system under consideration
- **System Users:** Users being authorised to share use of resources with the application under consideration but not having authorisation on the application itself
- **Application Users:** Users being authorised to work with the application under consideration
- **(Technical) Administrators:** Users with elevated privileges who manage the infrastructure used by the application

**Points Of Attack:**

- **User Interface:** the places and programs, where and by which users interact with the system, usually via screen and input device, e.g. a browser on a PC
- **Processing Infrastructure:** places of program execution - in principle everything which has a processor and its programming is not absolutely fixed, e.g. including database servers, where queries are processed
- **Data Storage Infrastructure:** places where data is stored durably - hard disks, non-volatile semiconductor memory, ...
- **Communication Infrastructure:** physical transport of data via cable or wireless
- **Communication Interfaces:** the connection to the means of communication on all OSI layers: network interfaces, wireless antenna, TCP Ports, APIs, ...
- **User Behaviour:** The behaviour of an user (human)

The matrix is initially independent of specific attack techniques or attack targets. In the course of a threat analysis, this abstracted matrix is applied to a specific system architecture that was abstracted according to the above specification. From this, concrete attack scenarios are immediately developed in a manageable but nevertheless complete view.

---

## <a id="chapter-explanationScale"></a>Explanation of Probability and Damage Scale

**Probability**

**1 – extremely unlikely**

Only attackers on the level of state secret services can realise the attack or several highly unlikely events not under control of the attacker have to occur together.

**2 – rather unlikely**

Only attackers with much time and/or money can realise the threat or unlikely events not under control of the attacker need to occur.

**3 – possible**

The threat can only be realised by serious attackers with considerable criminal energy and in-depth knowledge.

**4 – probable**

An attacker needs only intent, but no more knowledge than what can be derived from internet research (alike "script kiddies").

**5 – almost certain**

The threat can occur unintentionally, e.g. during regular usage by a non-malicious user.

**Damage**

**1 – very neglectable**



**2 – noticeable**

Can easily be compensated (e.g. within the organisation not using a dedicated project, without noteworthy cutback in other activities, with limited financial effort, ...).

**3 – quite noticeable**

Can only be compensated with effort (e.g. by postponing other projects, with considerable financial resources or expenditure of time, ...)

**4 – threatening**

For the market position of the company

**5 – very threatening**

For the existence of the company


---

## <a id="chapter-matrix"></a>Risk Matrices


---

## <a id="chapter-assetsDetails"></a>Assets

### <a id="asset-A-01"></a>A-01 Customer Database

*ID: 1*

| Confidentiality | Integrity | Availability |
|---|---|---|
| 4 | 3 | 2 |

**Description:**

Stores all customer PII data.

**Justification for Confidentiality:**

Contains names, addresses and payment data.

**Justification for Integrity:**

Data must be accurate for billing.

**Justification for Availability:**

Required during business hours.

### <a id="asset-A-02"></a>A-02 Authentication Service

*ID: 2*

| Confidentiality | Integrity | Availability |
|---|---|---|
| 5 | 5 | 4 |

**Description:**

Manages user sessions and tokens.

**Justification for Confidentiality:**

Holds credentials and session secrets.

**Justification for Integrity:**

Tampered tokens grant unauthorised access.

**Justification for Availability:**

Login must always be reachable.


---

## <a id="chapter-measuresDetails"></a>Measures

### <a id="measure-M-01"></a>M-01 Input Validation

*ID: 1*

*2024-06-01*

**Description:**

Use parameterised queries and input sanitisation to prevent injection attacks.

**Threats:**

- [1 SQL Injection](#threat-T-01)


---

## <a id="chapter-riskList"></a>List of Threats

| ID | Name | Component |
|----|---------|-----------|
| 1 | [SQL Injection](#threat-T-01) | Database Server |
| 2 | [Brute Force Login](#threat-T-02) | Login Form |


---

## <a id="chapter-riskDetails"></a>Threats

### <a id="threat-T-01"></a>T-01 SQL Injection

*ID: 1*

*Confidentiality, Integrity*

| | Probability | Damage | Risk |
|---|---|---|---|
| gross | 3 | 4 | 12 |
| net | 2 | 4 | 8 |

**Component:** Database Server

**Attackers:** Unauthorised Parties

**Points Of Attack:** Data Storage Infrastructure

**Description:**

An attacker injects SQL commands via unvalidated input.  
This can lead to data exfiltration or destruction.

**Assets:**

- [A-01 Customer Database](#asset-A-01)

**Measures:**

- [M-01 Input Validation](#measure-M-01)<br>*Parameterised queries have been added to all database calls.*

### <a id="threat-T-02"></a>T-02 Brute Force Login

*ID: 2*

*Confidentiality*

| | Probability | Damage | Risk |
|---|---|---|---|
| gross | 4 | 3 | 12 |
| net | 2 | 3 | 6 |

**Component:** Login Form

**Attackers:** Unauthorised Parties

**Points Of Attack:** User Interface

**Description:**

Repeated login attempts to guess credentials.

**Assets:**

- [A-02 Authentication Service](#asset-A-02)
