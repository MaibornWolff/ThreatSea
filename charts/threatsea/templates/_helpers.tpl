{{- define "threatsea.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

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

{{- define "threatsea.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "threatsea.labels" -}}
helm.sh/chart: {{ include "threatsea.chart" . }}
{{ include "threatsea.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "threatsea.selectorLabels" -}}
app.kubernetes.io/name: {{ include "threatsea.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "threatsea.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "threatsea.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

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

{{- define "threatsea.postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "threatsea.name" . | trunc 52 | trimSuffix "-" }}-postgresql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

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

{{- define "threatsea.postgresql.image" -}}
{{- printf "%s:%s" .Values.postgresql.image.repository .Values.postgresql.image.tag }}
{{- end }}

{{- define "threatsea.postgresql.port" -}}
5432
{{- end }}

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

{{- define "threatsea.imageTag" -}}
{{- .Values.image.tag | default .Chart.AppVersion }}
{{- end }}

{{- /* Kubernetes silently keeps the last duplicate env name, so reject collisions. */ -}}
{{- define "threatsea.checkExtraEnv" -}}
{{- $managed := list }}
{{- range .env }}
{{- $managed = append $managed .name }}
{{- end }}
{{- range .extraEnv }}
{{- if has .name $managed }}
{{- fail (printf "extraEnv must not redefine the chart-managed variable %s" .name) }}
{{- end }}
{{- end }}
{{- end }}

{{- define "threatsea.env" -}}
- name: PORT
  value: {{ .Values.service.containerPort | quote }}
- name: LOG_LEVEL
  value: {{ .Values.config.logLevel | toString | quote }}
- name: ORIGIN_APP
  value: {{ required "config.originApp is required" .Values.config.originApp | quote }}
- name: ORIGIN_BACKEND
  value: {{ required "config.originBackend is required" .Values.config.originBackend | quote }}
- name: AUTH_METHOD
  value: {{ .Values.config.authMethod | quote }}
{{- if eq .Values.config.authMethod "oidc" }}
- name: OIDC_ISSUER_URL
  value: {{ required "config.oidc.issuerUrl is required when authMethod=oidc" .Values.config.oidc.issuerUrl | quote }}
- name: OIDC_CLIENT_ID
  value: {{ required "config.oidc.clientId is required when authMethod=oidc" .Values.config.oidc.clientId | quote }}
- name: OIDC_ALLOW_HTTP
  value: {{ .Values.config.oidc.allowHttp | toString | quote }}
- name: OIDC_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . }}
      key: {{ .Values.secret.keys.oidcClientSecret }}
{{- end }}
- name: COOKIES_SECURE_OPTION
  value: {{ ternary "enabled" "disabled" .Values.config.cookies.secure | quote }}
- name: USE_PROXY
  value: {{ .Values.config.useProxy | toString | quote }}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . }}
      key: {{ .Values.secret.keys.jwtSecret }}
- name: EXPRESS_SESSION_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . }}
      key: {{ .Values.secret.keys.sessionSecret }}
- name: DATABASE_HOST
  value: {{ include "threatsea.databaseHost" . | quote }}
- name: DATABASE_PORT
  value: {{ include "threatsea.databasePort" . | quote }}
- name: DATABASE_NAME
  value: {{ .Values.database.name | quote }}
- name: DATABASE_USER
  value: {{ .Values.database.user | quote }}
- name: DATABASE_TLS
  value: {{ include "threatsea.databaseTls" . | quote }}
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      {{- include "threatsea.databasePasswordSecretKeyRef" . | nindent 6 }}
{{- end }}

{{- define "threatsea.validateRouting" -}}
{{- if and .Values.ingress.enabled .Values.gateway.enabled -}}
{{- fail "ingress.enabled and gateway.enabled are mutually exclusive; enable only one" -}}
{{- end -}}
{{- end }}
