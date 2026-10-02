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
Secret name – resolves to either the chart-managed secret or the user-supplied one.
*/}}
{{- define "threatsea.secretName" -}}
{{- if .Values.secret.create }}
{{- include "threatsea.fullname" . }}
{{- else }}
{{- required "secret.existingSecret must be set when secret.create=false" .Values.secret.existingSecret }}
{{- end }}
{{- end }}

{{/*
Bundled PostgreSQL resource name. The app fullname is truncated to 52 characters
before the 11-character suffix is appended, so the result never exceeds 63 and
never equals the app fullname.
*/}}
{{- define "threatsea.postgresql.fullname" -}}
{{- printf "%s-postgresql" (include "threatsea.fullname" . | trunc 52 | trimSuffix "-") }}
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
Database password secret reference.
*/}}
{{- define "threatsea.databasePasswordSecretName" -}}
{{- if .Values.postgresql.auth.existingSecret }}
{{- .Values.postgresql.auth.existingSecret }}
{{- else if .Values.postgresql.enabled }}
{{- include "threatsea.postgresql.fullname" . }}
{{- else }}
{{- include "threatsea.secretName" . }}
{{- end }}
{{- end }}

{{- define "threatsea.databasePasswordSecretKey" -}}
{{- if .Values.postgresql.auth.existingSecret }}
{{- .Values.postgresql.auth.existingSecretPasswordKey }}
{{- else if .Values.postgresql.enabled }}
{{- print "password" }}
{{- else }}
{{- .Values.secret.keys.databasePassword }}
{{- end }}
{{- end }}

{{/*
Image tag – falls back to appVersion.
*/}}
{{- define "threatsea.imageTag" -}}
{{- .Values.image.tag | default .Chart.AppVersion }}
{{- end }}
