# Application-level permissions
ThreatSea distinguishes two application-level permissions, ***privileged*** and ***non-privileged***. They differ only in one permission:  
Privileged users can create their own projects, while non-privileged users can only work with projects to which they have been added explicitly as members. At MaibornWolff, we currently realize this differentiation by using two different EntraID groups, one for non-privileged users and one for privileged users (see also *TODO: Link*)

# Project-level permissions
The following table lists the permissions of the three project roles (viewer, editor, owner) on the different objects used in projects in a r(ead), w(rite), a(dd), d(elete) notion.  

|Object|Viewer|Editor|Owner|
|:-----|:-----:|:-----:|:-----:|
|Project properties (Name, description, used catalog, confidentiality level)|r|r|rwad|
|System sketch|r|rwad|rwad|
|Components|r|rwad|rwad|
|Custom Component Types|r|rwad|rwad|
|Attack Points|r|rwad|rwad|
|Assets|r|rwad|rwad
|Threats|r|rwad|rwad|
|Risks|r|rwad|rwad|
|Line of Tolerance|r|rw|rw|
|Measures|r|rwad|rwad|
|Members|-|r|rwad|

The following table lists the permissions of the three project roles (viewer, editor, owner) on the different actions that can be triggered in projects in a (e)x(ecute) notion.  

|Action|Viewer|Editor|Owner|
|:-----|:-----:|:-----:|:-----:|
|Export Project (as json)|-|-|x|
|Create PDF Report|x|x|x|
|Create Excel Report|x|x|x|
|Export System Image|x|x|x|

# Catalog-level permissions
The following table lists the permissions of the three catalog roles (viewer, editor, owner) on the different objects used in catalogs in a r(ead), w(rite), a(dd), d(elete) notion.  

|Object|Viewer|Editor|Owner|
|:-----|:-----:|:-----:|:-----:|
|Catalog properties (Name)|r|r|rwad|
|Threats|r|r|rwad|
|Measures|r|r|rwad|
|Members|-|r|rwad|  

*TODO: Change Editor permissions on threats and measures to RWAD as part of catalog rework*

**To use a catalog within a project, the project owner needs read permission on the respective catalog (i.e. at least viewer).**
