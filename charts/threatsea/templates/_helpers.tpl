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

{{- define "threatsea.databaseName" -}}
{{- .Values.database.name | default "threatsea" }}
{{- end }}

{{- define "threatsea.databaseUser" -}}
{{- .Values.database.user | default "threatsea" }}
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
- {{ include "threatsea.databaseUser" . | quote }}
- -d
- {{ include "threatsea.databaseName" . | quote }}
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
postgresql.auth.* only describes the bundled database, so it is rejected when that is off
rather than silently ignored.
*/}}
{{- define "threatsea.databasePasswordSecretKeyRef" -}}
{{- if .Values.postgresql.enabled -}}
{{- if .Values.postgresql.auth.existingSecret -}}
name: {{ .Values.postgresql.auth.existingSecret | quote }}
key: {{ .Values.postgresql.auth.existingSecretPasswordKey | quote }}
{{- else -}}
name: {{ include "threatsea.postgresql.fullname" . | quote }}
key: password
{{- end }}
{{- else if .Values.postgresql.auth.existingSecret -}}
{{- fail "postgresql.auth.existingSecret is only used when postgresql.enabled=true; set secret.existingSecret or secret.values.databasePassword for an external database password" }}
{{- else -}}
name: {{ include "threatsea.secretName" . | quote }}
key: {{ .Values.secret.keys.databasePassword | quote }}
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

{{/*
Env entry read from secret.existingSecret when a secret.configKeys key is set,
otherwise from the plain value. Expects a dict with ctx, name, key, value and an
optional required message, checked only when the plain value is used.
*/}}
{{- define "threatsea.configEnv" -}}
- name: {{ .name }}
{{- if .key }}
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" .ctx | quote }}
      key: {{ .key | quote }}
{{- else if .required }}
  value: {{ required .required .value | quote }}
{{- else }}
  value: {{ .value | quote }}
{{- end }}
{{- end }}

{{/*
secret.configKeys can only point into an existing Secret, the bundled database is
created from the plain database.name and database.user, and a key set together with
its plain value would silently ignore one of them, so all three misuses are rejected.
*/}}
{{- define "threatsea.validateConfigKeys" -}}
{{- $keys := .Values.secret.configKeys -}}
{{- $databaseKeysSet := or $keys.databaseHost $keys.databaseName $keys.databaseUser -}}
{{- if and (not .Values.secret.existingSecret) (or $keys.oidcIssuerUrl $keys.oidcClientId $databaseKeysSet) -}}
{{- fail "secret.configKeys requires secret.existingSecret; the chart-created Secret holds only secret.values" -}}
{{- end -}}
{{- if and .Values.postgresql.enabled $databaseKeysSet -}}
{{- fail "secret.configKeys.database* must be empty when postgresql.enabled=true; the bundled database is created from database.name and database.user" -}}
{{- end -}}
{{- $plainValues := dict
  "oidcIssuerUrl" (list "config.oidc.issuerUrl" .Values.config.oidc.issuerUrl)
  "oidcClientId" (list "config.oidc.clientId" .Values.config.oidc.clientId)
  "databaseHost" (list "database.host" .Values.database.host)
  "databaseName" (list "database.name" .Values.database.name)
  "databaseUser" (list "database.user" .Values.database.user)
-}}
{{- range $keyName, $plainValue := $plainValues -}}
{{- if and (get $keys $keyName) (index $plainValue 1) -}}
{{- fail (printf "%s must be empty when secret.configKeys.%s is set; the key replaces it" (index $plainValue 0) $keyName) -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
Database host, port, name and user env entries, shared by the app and the connection
test. Expects a dict with ctx and names: "app" for DATABASE_*, "libpq" for PG*.
*/}}
{{- define "threatsea.databaseEnv" -}}
{{- $ctx := .ctx }}
{{- $nameSets := dict
  "app" (dict "host" "DATABASE_HOST" "port" "DATABASE_PORT" "name" "DATABASE_NAME" "user" "DATABASE_USER")
  "libpq" (dict "host" "PGHOST" "port" "PGPORT" "name" "PGDATABASE" "user" "PGUSER")
}}
{{- $names := get $nameSets .names }}
{{- if not $names }}
{{- fail (printf "threatsea.databaseEnv: unknown names %q" .names) }}
{{- end }}
{{- $keys := $ctx.Values.secret.configKeys }}
{{- $host := "" }}
{{- if not $keys.databaseHost }}
{{- $host = include "threatsea.databaseHost" $ctx }}
{{- end }}
{{- include "threatsea.configEnv" (dict "ctx" $ctx "name" $names.host "key" $keys.databaseHost "value" $host) }}
- name: {{ $names.port }}
  value: {{ include "threatsea.databasePort" $ctx | quote }}
{{ include "threatsea.configEnv" (dict "ctx" $ctx "name" $names.name "key" $keys.databaseName "value" (include "threatsea.databaseName" $ctx)) }}
{{ include "threatsea.configEnv" (dict "ctx" $ctx "name" $names.user "key" $keys.databaseUser "value" (include "threatsea.databaseUser" $ctx)) }}
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
  value: "oidc"
{{ include "threatsea.configEnv" (dict "ctx" . "name" "OIDC_ISSUER_URL" "key" .Values.secret.configKeys.oidcIssuerUrl "value" .Values.config.oidc.issuerUrl "required" "config.oidc.issuerUrl is required") }}
{{ include "threatsea.configEnv" (dict "ctx" . "name" "OIDC_CLIENT_ID" "key" .Values.secret.configKeys.oidcClientId "value" .Values.config.oidc.clientId "required" "config.oidc.clientId is required") }}
- name: OIDC_ALLOW_HTTP
  value: {{ .Values.config.oidc.allowHttp | toString | quote }}
- name: OIDC_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . | quote }}
      key: {{ .Values.secret.keys.oidcClientSecret | quote }}
- name: COOKIES_SECURE_OPTION
  value: {{ ternary "enabled" "disabled" .Values.config.cookies.secure | quote }}
- name: USE_PROXY
  value: {{ .Values.config.useProxy | toString | quote }}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . | quote }}
      key: {{ .Values.secret.keys.jwtSecret | quote }}
- name: EXPRESS_SESSION_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "threatsea.secretName" . | quote }}
      key: {{ .Values.secret.keys.sessionSecret | quote }}
{{ include "threatsea.databaseEnv" (dict "ctx" . "names" "app") }}
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
