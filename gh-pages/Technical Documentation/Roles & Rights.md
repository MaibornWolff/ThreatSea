# Project-level permissions
The following table lists the permissions of the three project roles (viewer, editor, owner) on the different objects used in projects in a r(ead), w(rite), a(dd), d(elete) notion.  

|Object|Viewer|Editor|Owner|
|:-----|:-----:|:-----:|:-----:|
|Project properties (Name, description, used catalog, confidentiality level)|r|r|rwad|
|System Components|r|rwad|rwad|
|Assets|r|rwad|rwad
|Threats|r|rwad|rwad|
|Risks|r|rwad|rwad|
|Measures|r|rwad|rwad|
|Members|-|r|rwad|

The following table lists the permissions of the three project roles (viewer, editor, owner) on the different actions that can be triggered in projects in a (e)x(ecute) notion.  

|Action|Viewer|Editor|Owner|
|:-----|:-----:|:-----:|:-----:|
|Export Project (as json)|-|-|x|
|Create PDF Report|x|x|x|
|Create Excel Report|x|x|x|

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
