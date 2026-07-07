# Sample Project

Cyber Security | MaibornWolff

ThreatSea by MaibornWolff

**2025-01-15**

*intern*

This is the project description.

It spans multiple paragraphs.  
With line breaks.

---

## Inhaltsverzeichnis

1. [Die 4x6 Methodik](#chapter-methodExplanation)
2. [Erklärung der Wahrscheinlichkeits- und Schadensskala](#chapter-explanationScale)
3. [Risiko Matrizen](#chapter-matrix)
4. [Komponenten](#chapter-componentsDetails)
5. [Assets](#chapter-assetsDetails)
6. [Maßnahmen](#chapter-measuresDetails)
7. [Auflistung der Bedrohungen](#chapter-riskList)
8. [Bedrohungen](#chapter-riskDetails)

---

## <a id="chapter-methodExplanation"></a>Die 4x6 Methodik

Die 4x6 Methodik basiert auf einer Matrix, die für jedes IT-System, das auf sechs Klassen von Angriffspunkten abstrahiert wird, für die vier Klassen von Angreifern jede erdenkliche Bedrohung wiedergibt.

| | Dritte | Systembenutzer | Anwendungsbenutzer | (Technische) Administratoren |
|---|---|---|---|---|
| Benutzerschnittstelle | Physischer Oberflächenzugriff |  | Schädliche Oberflächennutzung |  |
| Ausführungsinfrastruktur | Physischer Angriff auf die Ausführung | Übergriff in der Ausführung |  | Privilegienmissbrauch in der Ausführung |
| Datenablagestruktur | Physischer Speichermedien-Zugriff | Übergriff auf Speichermedien |  | Privilegienmissbrauch auf Speichermedien |
| Kommunikationsinfrastruktur | Physischer Angriff auf die Übertragung | Übergriff in der Übertragung |  | Privilegienmissbrauch in der Übertragung |
| Kommunikationsschnittstelle | Physischer Angriff auf Schnittstellen | Übergriff über Schnittstellenzugriff | Schädliche Schnittstellennutzung |  |
| Benutzerverhalten | Täuschung |  |  |  |

**Angreifer:**

- **Dritte:** Einheiten, die keinerlei Bezug zu und insbesondere keine Rechte auf dem betrachteten System haben
- **Systembenutzer:** Benutzer, die von der betrachteten Anwendung genutzte Ressourcen berechtigterweise mitbenutzen, ohne auf der Anwendung selbst Rechte zu haben
- **Anwendungsbenutzer:** Benutzer, die berechtigt mit der betrachteten Anwendung arbeiten
- **(Technische) Administratoren:** Benutzer, die der Anwendung zugrundeliegende Infrastrukturen mit entsprechenden erweiterten Berechtigungen verwalten

**Angriffspunkte:**

- **Benutzerschnittstelle:** Orte und Programme, an und mit denen Benutzer mit dem System interagieren, meist per Bildschirm und Eingabegerät, z.B. Browser am PC
- **Ausführungsinfrastruktur:** Orte der Programmausführung - im Prinzip alles, was einen Prozessor und keine absolut unveränderliche Programmierung hat, z.B. auch Datenbankserver, wo die Abfragen verarbeitet werden
- **Datenablagestruktur:** Orte, wo Daten physisch dauerhaft abgelegt werden - Festplatten, persistente Halbleiterspeicher, etc.
- **Kommunikationsinfrastruktur:** Physische Übertragung von Daten über Kabel oder Funk
- **Kommunikationsschnittstelle:** Anschlüsse an die Kommunikationsverbindungen auf allen OSI-Schichten: Netzschnittstellen, Funkantennen, TCP-Ports, APIs ...
- **Benutzerverhalten:** Das Verhalten eines Benutzers (Menschen)

Die Matrix ist zunächst unabhängig von konkreten Angriffstechniken oder Angriffszielen. Im Laufe einer Bedrohungsanalyse wird diese abstrahierte Matrix auf eine konkrete Systemarchitektur, die gemäß der obigen Vorgabe abstrahiert wurde, angewendet. Daraus werden unmittelbar konkrete Angriffsszenarien in einer überschaubaren, aber dennoch vollständigen Sicht entwickelt.

---

## <a id="chapter-explanationScale"></a>Erklärung der Wahrscheinlichkeits- und Schadensskala

**Wahrscheinlichkeit**

**1 – extrem unwahrscheinlich**

Die Bedrohung ist nur Angreifern auf dem Niveau eines Geheimdienstes zugänglich oder es müssen zahlreiche oder extrem unwahrscheinliche Ereignisse, die nicht vom Angreifer kontrolliert werden können, zusammentreffen.

**2 – eher unwahrscheinlich**

Nur Angreifern mit viel Zeit und/oder Geld können die Bedrohung realisieren oder es müssen nicht vom Angreifer kontrollierbare, unwahrscheinliche Ereignisse eintreten.

**3 – möglich**

Die Bedrohung kann nur von ernsthaften Angreifern mit erheblicher krimineller Energie und fundierten Kenntnissen realisiert werden.

**4 – wahrscheinlich**

Außer Absicht benötigt ein Angreifer höchsten Kenntnisse, die er sich über eine Internet-Recherche leicht aneignen kann (Niveau "Script Kiddies").

**5 – nahezu sicher**

Die Bedrohung kann bereits unbeabsichtigt (z.B. bei der regulären Tätigkeit eines gutwilligen Benutzers) eintreten.

**Schaden**

**1 – sehr geringfügig**



**2 – bemerkbar**

Kann leicht kompensiert werden (z.B. innerhalb der Organisation ohne ein dediziertes Projekt, ohne nennenswerte Einschränkungen bei anderen Aktivitäten, mit begrenztem finanziellen Aufwand, ...)

**3 – deutlich spürbar**

Kann nur mit Aufwand kompensiert werden (z.B. durch Verschiebung anderer Projekte, mit erheblichen finanziellen Mitteln oder Zeitaufwand, ...)

**4 – bedrohlich**

Für die Marktposition des Unternehmens

**5 – existenzbedrohend**

Für die Existenz des Unternehmens


---

## <a id="chapter-matrix"></a>Risiko Matrizen


---

## <a id="chapter-componentsDetails"></a>Komponenten

### <a id="component-C.1"></a>C.1 Database Server

**Beschreibung:**

Central PostgreSQL database storing all customer and order records.

### <a id="component-C.2"></a>C.2 Login Form

**Beschreibung:**

Public-facing web form handling user authentication.


---

## <a id="chapter-assetsDetails"></a>Assets

### <a id="asset-A-01"></a>A-01 Customer Database

*ID: 1*

| Vertraulichkeit | Integrität | Verfügbarkeit |
|---|---|---|
| 4 | 3 | 2 |

**Beschreibung:**

Stores all customer PII data.

**Begründung für Vertraulichkeit:**

Contains names, addresses and payment data.

**Begründung für Integrität:**

Data must be accurate for billing.

**Begründung für Verfügbarkeit:**

Required during business hours.

### <a id="asset-A-02"></a>A-02 Authentication Service

*ID: 2*

| Vertraulichkeit | Integrität | Verfügbarkeit |
|---|---|---|
| 5 | 5 | 4 |

**Beschreibung:**

Manages user sessions and tokens.

**Begründung für Vertraulichkeit:**

Holds credentials and session secrets.

**Begründung für Integrität:**

Tampered tokens grant unauthorised access.

**Begründung für Verfügbarkeit:**

Login must always be reachable.


---

## <a id="chapter-measuresDetails"></a>Maßnahmen

### <a id="measure-M-01"></a>M-01 Input Validation

*ID: 1*

*2024-06-01*

**Beschreibung:**

Use parameterised queries and input sanitisation to prevent injection attacks.

**Bedrohungen:**

- [1 SQL Injection](#threat-T-01)


---

## <a id="chapter-riskList"></a>Auflistung der Bedrohungen

| ID | Name | Komponente |
|----|---------|-----------|
| 1 | [SQL Injection](#threat-T-01) | Database Server |
| 2 | [Brute Force Login](#threat-T-02) | Login Form |


---

## <a id="chapter-riskDetails"></a>Bedrohungen

### <a id="threat-T-01"></a>T-01 SQL Injection

*ID: 1*

*Vertraulichkeit, Integrität*

| | Wahrscheinlichkeit | Schaden | Risiko |
|---|---|---|---|
| brutto | 3 | 4 | 12 |
| netto | 2 | 4 | 8 |

**Komponente:** [C.1 Database Server](#component-C.1)

**Angreifer:** Dritte

**Angriffspunkte:** Datenablagestruktur

**Beschreibung:**

An attacker injects SQL commands via unvalidated input.  
This can lead to data exfiltration or destruction.

**Assets:**

- [A-01 Customer Database](#asset-A-01)

**Maßnahmen:**

- [M-01 Input Validation](#measure-M-01)<br>*Parameterised queries have been added to all database calls.*

### <a id="threat-T-02"></a>T-02 Brute Force Login

*ID: 2*

*Vertraulichkeit*

| | Wahrscheinlichkeit | Schaden | Risiko |
|---|---|---|---|
| brutto | 4 | 3 | 12 |
| netto | 2 | 3 | 6 |

**Komponente:** [C.2 Login Form](#component-C.2)

**Angreifer:** Dritte

**Angriffspunkte:** Benutzerschnittstelle

**Beschreibung:**

Repeated login attempts to guess credentials.

**Assets:**

- [A-02 Authentication Service](#asset-A-02)
