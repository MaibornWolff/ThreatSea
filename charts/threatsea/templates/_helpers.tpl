{{/*
Expand the name of the chart.
*/}}
{{- define "threatsea.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "threatsea.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label value.
*/}}
{{- define "threatsea.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "threatsea.labels" -}}
helm.sh/chart: {{ include "threatsea.chart" . }}
{{ include "threatsea.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "threatsea.selectorLabels" -}}
app.kubernetes.io/name: {{ include "threatsea.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "threatsea.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "threatsea.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Secret name – the user-supplied Secret when secret.existingSecret is set, otherwise the chart-managed one.
*/}}
{{- define "threatsea.secretName" -}}
{{- if .Values.secret.existingSecret }}
{{- .Values.secret.existingSecret }}
{{- else }}
{{- include "threatsea.fullname" . }}
{{- end }}
{{- end }}

{{/*
Bundled PostgreSQL resource name. The app fullname is truncated to 41 characters
before the 11-character suffix is appended, so the result never exceeds 52 and
never equals the app fullname. 52 (not 63) because the StatefulSet controller
adds pod labels such as controller-revision-hash (<sts-name>-<hash>) that must
stay within 63 characters; longer StatefulSet names yield no pods
(kubernetes/kubernetes#64023).
*/}}
{{- define "threatsea.postgresql.fullname" -}}
{{- printf "%s-postgresql" (include "threatsea.fullname" . | trunc 41 | trimSuffix "-") }}
{{- end }}

{{/*
Bundled PostgreSQL selector labels.
*/}}
{{- define "threatsea.postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "threatsea.name" . | trunc 52 | trimSuffix "-" }}-postgresql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Database host – the bundled Service when postgresql.enabled=true, else database.host.
*/}}
{{- define "threatsea.databaseHost" -}}
{{- if .Values.postgresql.enabled }}
{{- if .Values.database.host }}
{{- fail "database.host must not be set when postgresql.enabled=true" }}
{{- end }}
{{- include "threatsea.postgresql.fullname" . }}
{{- else }}
{{- required "database.host must be set when postgresql.enabled=false" .Values.database.host }}
{{- end }}
{{- end }}

{{/*
Bundled PostgreSQL image reference.
*/}}
{{- define "threatsea.postgresql.image" -}}
{{- printf "%s:%s" .Values.postgresql.image.repository .Values.postgresql.image.tag }}
{{- end }}

{{/*
Bundled PostgreSQL listen port, shared by the container, the Service and the database port.
*/}}
{{- define "threatsea.postgresql.port" -}}
5432
{{- end }}

{{/*
Database port – the bundled Service always listens on 5432, else database.port.
*/}}
{{- define "threatsea.databasePort" -}}
{{- if .Values.postgresql.enabled }}
{{- include "threatsea.postgresql.port" . }}
{{- else }}
{{- .Values.database.port }}
{{- end }}
{{- end }}

{{/*
Bundled PostgreSQL readiness check. Connects over TCP (-h 127.0.0.1): without -h
pg_isready probes the Unix socket, which the image's temporary initdb server also
serves, so the probe could pass during first-time initialisation.
*/}}
{{- define "threatsea.postgresql.isReady" -}}
- pg_isready
- -h
- 127.0.0.1
- -U
- {{ .Values.database.user | quote }}
- -d
- {{ .Values.database.name | quote }}
{{- end }}

{{/*
DATABASE_TLS literal read by the backend. The bundled database serves plaintext.
*/}}
{{- define "threatsea.databaseTls" -}}
{{- if .Values.postgresql.enabled }}
{{- print "disabled" }}
{{- else }}
{{- ternary "enabled" "disabled" .Values.database.tls }}
{{- end }}
{{- end }}

{{/*
Name and key of the Secret holding the database password, for use under secretKeyRef.
postgresql.auth.* only describes the bundled database, so it is rejected when that is off
rather than silently ignored.
*/}}
{{- define "threatsea.databasePasswordSecretKeyRef" -}}
{{- if .Values.postgresql.enabled }}
{{- if .Values.postgresql.auth.existingSecret }}
name: {{ .Values.postgresql.auth.existingSecret }}
key: {{ .Values.postgresql.auth.existingSecretPasswordKey }}
{{- else }}
name: {{ include "threatsea.postgresql.fullname" . }}
key: password
{{- end }}
{{- else if .Values.postgresql.auth.existingSecret }}
{{- fail "postgresql.auth.existingSecret is only used when postgresql.enabled=true; set secret.existingSecret or secret.values.databasePassword for an external database password" }}
{{- else }}
name: {{ include "threatsea.secretName" . }}
key: {{ .Values.secret.keys.databasePassword }}
{{- end }}
{{- end }}

{{/*
Image tag – falls back to appVersion.
*/}}
{{- define "threatsea.imageTag" -}}
{{- .Values.image.tag | default .Chart.AppVersion }}
{{- end }}

{{/*
Reject extraEnv entries that redefine a variable the chart already sets; Kubernetes
would silently keep the last duplicate. The list mirrors the env block in
deployment.yaml and must be updated whenever a variable is added or removed there.
*/}}
{{- define "threatsea.checkExtraEnv" -}}
{{- $managed := list "PORT" "LOG_LEVEL" "ORIGIN_APP" "ORIGIN_BACKEND" "AUTH_METHOD" "OIDC_ISSUER_URL" "OIDC_CLIENT_ID" "OIDC_ALLOW_HTTP" "OIDC_CLIENT_SECRET" "COOKIES_SECURE_OPTION" "USE_PROXY" "JWT_SECRET" "EXPRESS_SESSION_SECRET" "DATABASE_HOST" "DATABASE_PORT" "DATABASE_NAME" "DATABASE_USER" "DATABASE_TLS" "DATABASE_PASSWORD" -}}
{{- range .Values.extraEnv }}
{{- if has .name $managed }}
{{- fail (printf "extraEnv must not redefine the chart-managed variable %s" .name) }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Fail when both routing options are enabled.
*/}}
{{- define "threatsea.validateRouting" -}}
{{- if and .Values.ingress.enabled .Values.gateway.enabled -}}
{{- fail "ingress.enabled and gateway.enabled are mutually exclusive; enable only one" -}}
{{- end -}}
{{- end }}
