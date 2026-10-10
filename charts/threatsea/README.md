# threatsea

![Version: 0.0.0](https://img.shields.io/badge/Version-0.0.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.0.0](https://img.shields.io/badge/AppVersion-0.0.0-informational?style=flat-square)

A Helm chart for ThreatSea - an open-source threat modeling tool

**Homepage:** <https://github.com/MaibornWolff/ThreatSea>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| MaibornWolff GmbH |  | <https://www.maibornwolff.de/en> |

## Source Code

* <https://github.com/MaibornWolff/ThreatSea>

## Installing

The chart is published as an OCI artifact and signed with cosign. Its version is the same as the ThreatSea release it deploys.

```bash
helm install threatsea oci://ghcr.io/maibornwolff/charts/threatsea --version <version> \
  --namespace threatsea --create-namespace \
  --values my-values.yaml
```

Verify the signature before installing:

```bash
cosign verify ghcr.io/maibornwolff/charts/threatsea:<version> \
  --certificate-identity-regexp '^https://github\.com/MaibornWolff/ThreatSea/\.github/workflows/release\.yml@refs/heads/(main|next)$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Pre-releases are published from the `next` branch. Pass `--devel` (or an explicit pre-release `--version`) to install one.

## Required values

| Value | Description |
| ----- | ----------- |
| `config.originApp` | Origin of the frontend, for example `https://threatsea.example.com` |
| `config.originBackend` | Externally reachable origin of the backend, used to build the OIDC callback URL |
| `config.oidc.issuerUrl` | OIDC issuer URL |
| `config.oidc.clientId` | OIDC client ID |
| `secret.values.jwtSecret` | JWT signing secret |
| `secret.values.sessionSecret` | Express session secret |
| `secret.values.oidcClientSecret` | OIDC client secret |
| `secret.values.databasePassword` | Password for `database.user` on the external database |
| `database.host` | Hostname of the external PostgreSQL server (not needed with the bundled database) |

Rendering fails with a message naming the missing value. When `secret.existingSecret` is set, the `secret.values.*` entries are not needed.

## Secrets

There are two ways to supply the secrets:

1. **Through values.** Set `secret.values.*` and the chart creates the Secret.
2. **Through an existing Secret.** Set `secret.existingSecret` to the name of a Secret you manage. The chart then creates no Secret and reads the entries named by `secret.keys` (by default `jwt-secret`, `session-secret`, `oidc-client-secret` and `database-password`).

> [!WARNING]
> Secrets passed through values are stored in plaintext in the Helm release Secret. They are visible to anyone who can read Secrets in the namespace or run `helm get values`. Use `secret.existingSecret` to avoid this, for example with a Secret managed by External Secrets Operator or Sealed Secrets.

The chart cannot look inside an existing Secret. If one of the keys is missing, the pod starts and then crash-loops with `Environment variable ... has to be defined`.

With `postgresql.enabled=true` the `database-password` key is not read. The bundled database's password comes from `postgresql.auth.*`.

```bash
kubectl create secret generic threatsea-secrets \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=session-secret="$(openssl rand -hex 32)" \
  --from-literal=oidc-client-secret='<client secret>' \
  --from-literal=database-password='<database password>'

helm install threatsea oci://ghcr.io/maibornwolff/charts/threatsea --version <version> \
  --set secret.existingSecret=threatsea-secrets \
  --values my-values.yaml
```

## External database

An external PostgreSQL server is the documented production setup. Point the chart at it with the `database.*` values:

```yaml
database:
  host: postgres.example.com
  port: 5432
  name: threatsea
  user: threatsea
  tls: true
```

`database.tls` is `true` by default. If the server certificate is signed by a private CA, mount the CA bundle with `extraVolumes` and `extraVolumeMounts` and point Node.js at it with `NODE_EXTRA_CA_CERTS`. The root filesystem is read-only, so the bundle has to come from a volume:

```yaml
extraVolumes:
  - name: db-ca
    secret:
      secretName: my-db-ca
extraVolumeMounts:
  - name: db-ca
    mountPath: /etc/ssl/db-ca
    readOnly: true
extraEnv:
  - name: NODE_EXTRA_CA_CERTS
    value: /etc/ssl/db-ca/ca.crt
```

`extraEnv` cannot redefine variables the chart manages itself, such as `DATABASE_TLS` or `PORT`; rendering fails if you try.

## Bundled database

> [!WARNING]
> `postgresql.enabled: true` deploys a PostgreSQL StatefulSet for **evaluation only**. It runs a single replica, has no backups, serves plaintext connections (no TLS), and has no supported upgrade path between PostgreSQL major versions. For production use an external database, for example a managed service or [CloudNativePG](https://cloudnative-pg.io/).

```yaml
postgresql:
  enabled: true
  auth:
    password: change-me
```

With the bundled database enabled, `database.host` is not used and `database.tls` is forced off. The app always connects to port 5432 of the bundled Service, so `database.port` is ignored.

Things to know before relying on it, even for an evaluation:

- **Credentials are fixed on first start.** PostgreSQL initialises the data directory once. Changing `postgresql.auth.password`, `database.name` or `database.user` afterwards has no effect on the existing PVC. A changed password only breaks the app's login.
- **The PVC survives `helm uninstall`.** Reinstalling with a different password then fails authentication. Delete the PVC (`kubectl delete pvc -l app.kubernetes.io/instance=<release>`) to start fresh, which also deletes the data.
- **Storage settings are immutable.** `postgresql.persistence.enabled`, `size` and `storageClass` end up in the StatefulSet's `volumeClaimTemplates`, which Kubernetes does not allow to change on upgrade.

## Authentication

`config.authMethod` defaults to `oidc`. Any other value means fixed-profile authentication with hardcoded test users. That mode is for development only and must never be exposed to real users.

## Testing the release

`helm test <release>` runs a pod that checks, with `pg_isready`, that the configured database is reachable. It checks reachability only and does not verify the credentials.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Affinity rules |
| config.authMethod | string | `"oidc"` | Authentication method, `oidc` or `fixed`. `fixed` enables fixed-profile authentication with hardcoded test users and is for development only. |
| config.cookies.secure | bool | `true` | Send cookies with the Secure flag (boolean). Set to false only in development (non-HTTPS). |
| config.logLevel | int | `3` | Log level as an integer: 0 (debug), 1 (info), 2 (warning), 3 (error) |
| config.oidc.allowHttp | bool | `false` | Allow plain HTTP for OIDC (boolean, never enable in production) |
| config.oidc.clientId | string | `""` | OIDC client ID |
| config.oidc.issuerUrl | string | `""` | OIDC issuer URL (required when authMethod=oidc) |
| config.originApp | string | `""` | Origin of the frontend (used for CORS and as the post-login redirect target) |
| config.originBackend | string | `""` | Origin of the backend (used to build the OIDC redirect/callback URL). Must be the externally reachable backend URL, otherwise OIDC login fails. |
| config.useProxy | bool | `true` | Set to true (boolean) when behind a reverse proxy / ingress (enables trust proxy) |
| containerSecurityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Container-level security context. The root filesystem is read-only; use `extraVolumes` for any path the container must write to. |
| database.host | string | `""` | Hostname of an external PostgreSQL server. Required unless postgresql.enabled=true. |
| database.name | string | `"threatsea"` | Database name. Also the database the bundled PostgreSQL creates. |
| database.port | int | `5432` | Port of the PostgreSQL server |
| database.tls | bool | `true` | Connect over TLS (boolean). Forced off when postgresql.enabled=true, which serves plaintext. |
| database.user | string | `"threatsea"` | Database user. Also the user the bundled PostgreSQL creates. |
| extraEnv | list | `[]` | Extra environment variables to inject into the container |
| extraEnvFrom | list | `[]` | Extra environment sources (configMapRef / secretRef) added to the container's `envFrom` |
| extraVolumeMounts | list | `[]` | Extra volume mounts added to the container; each must match a volume in `extraVolumes` |
| extraVolumes | list | `[]` | Extra volumes added to the pod, e.g. to mount a private CA bundle (the root filesystem is read-only) |
| fullnameOverride | string | `""` | Override the full resource name prefix |
| gateway.annotations | object | `{}` | Annotations for the HTTPRoute |
| gateway.enabled | bool | `false` | Create an HTTPRoute attached to an existing Gateway |
| gateway.gatewayName | string | `""` | Name of the Gateway to attach the HTTPRoute to |
| gateway.gatewayNamespace | string | `""` | Namespace of the Gateway. Release namespace when empty. |
| gateway.hostnames | list | `["threatsea.example.com"]` | Hostnames matched by the HTTPRoute |
| gateway.sectionName | string | `""` | Name of the Gateway listener (sectionName) to attach to. All listeners when empty. |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy |
| image.repository | string | `"ghcr.io/maibornwolff/threatsea"` | ThreatSea container image repository |
| image.tag | string | `""` | Image tag. Defaults to the chart's appVersion when empty. |
| imagePullSecrets | list | `[]` | Secrets for pulling the image from a private registry |
| ingress.annotations | object | `{}` | Annotations for the Ingress |
| ingress.className | string | `""` | IngressClass name |
| ingress.enabled | bool | `false` | Create an Ingress |
| ingress.hosts | list | `[{"host":"threatsea.example.com","paths":[{"path":"/","pathType":"Prefix"}]}]` | Ingress hosts and paths |
| ingress.tls | list | `[]` | Ingress TLS configuration |
| livenessProbe | object | `{"failureThreshold":3,"httpGet":{"path":"/api/health","port":"http"},"periodSeconds":30,"timeoutSeconds":5}` | Liveness probe of the ThreatSea container |
| nameOverride | string | `""` | Override the chart name used in resource names |
| nodeSelector | object | `{}` | Node selector |
| podAnnotations | object | `{}` | Annotations added to the pods |
| podLabels | object | `{}` | Labels added to the pods |
| podSecurityContext | object | `{"runAsNonRoot":true,"seccompProfile":{"type":"RuntimeDefault"}}` | Pod-level security context |
| postgresql.auth.existingSecret | string | `""` | Existing Secret holding the bundled database's password, instead of auth.password. Rendering fails when this is set and enabled=false. |
| postgresql.auth.existingSecretPasswordKey | string | `"password"` | Key inside `postgresql.auth.existingSecret` that holds the password |
| postgresql.auth.password | string | `""` | Password for database.user. Required when enabled=true and existingSecret is empty. |
| postgresql.enabled | bool | `false` | Deploy a single-replica PostgreSQL StatefulSet. EVALUATION ONLY: no backups, no replication, no TLS, and no supported upgrade path between major versions. |
| postgresql.image.pullPolicy | string | `"IfNotPresent"` | Bundled PostgreSQL image pull policy |
| postgresql.image.repository | string | `"postgres"` | Bundled PostgreSQL image repository (also used by the `helm test` hook) |
| postgresql.image.tag | string | `"18.6-alpine"` | Bundled PostgreSQL image tag |
| postgresql.persistence.enabled | bool | `true` | Persist data on a PersistentVolumeClaim. When false, data is lost on pod restart. |
| postgresql.persistence.size | string | `"8Gi"` | Size of the PersistentVolumeClaim |
| postgresql.persistence.storageClass | string | `""` | StorageClass of the PersistentVolumeClaim. Cluster default when empty. |
| postgresql.resources | object | `{"limits":{"memory":"1Gi"},"requests":{"cpu":"100m","memory":"256Mi"}}` | Resource requests and limits of the bundled PostgreSQL container |
| readinessProbe | object | `{"failureThreshold":3,"httpGet":{"path":"/api/health","port":"http"},"periodSeconds":10,"timeoutSeconds":5}` | Readiness probe of the ThreatSea container |
| replicaCount | int | `1` | Number of replicas. Sessions are stored in PostgreSQL and survive across replicas, but whether other in-process state prevents horizontal scaling has not been verified, so `1` is the tested configuration. |
| resources | object | `{"limits":{"memory":"512Mi"},"requests":{"cpu":"100m","memory":"256Mi"}}` | Resource requests and limits of the ThreatSea container |
| secret.existingSecret | string | `""` | Name of an existing Secret to use. When empty, the chart creates a Secret from secret.values. When set, the chart creates none and the Secret must contain the keys defined in secret.keys. |
| secret.keys | object | `{"databasePassword":"database-password","jwtSecret":"jwt-secret","oidcClientSecret":"oidc-client-secret","sessionSecret":"session-secret"}` | Key names of the four secret entries. The chart uses these names both in the Secret it creates and when reading an existing Secret, so an existing Secret must contain exactly these keys. |
| secret.values | object | `{"databasePassword":"","jwtSecret":"","oidcClientSecret":"","sessionSecret":""}` | Values for the chart-created Secret (used only when existingSecret is empty) |
| secret.values.databasePassword | string | `""` | Database password (used only when postgresql.enabled=false and secret.existingSecret is empty) |
| secret.values.jwtSecret | string | `""` | Secret used to sign JWTs |
| secret.values.oidcClientSecret | string | `""` | OIDC client secret (only required when config.authMethod=oidc) |
| secret.values.sessionSecret | string | `""` | Secret used to sign Express session cookies |
| service.annotations | object | `{}` | Annotations for the Service |
| service.containerPort | int | `8000` | Port the ThreatSea container listens on |
| service.port | int | `80` | Service port |
| service.type | string | `"ClusterIP"` | Service type |
| serviceAccount.annotations | object | `{}` | Annotations for the ServiceAccount |
| serviceAccount.automountServiceAccountToken | bool | `false` | Mount the ServiceAccount API token into the pods (ThreatSea does not need it) |
| serviceAccount.create | bool | `false` | Create a ServiceAccount for the pods |
| serviceAccount.name | string | `""` | ServiceAccount name. Generated from the fullname when empty and create=true. |
| startupProbe | object | `{"failureThreshold":30,"httpGet":{"path":"/api/health","port":"http"},"initialDelaySeconds":5,"periodSeconds":5}` | Startup probe of the ThreatSea container |
| strategy | object | `{}` | Deployment update strategy. Kubernetes default (RollingUpdate) when empty. |
| tolerations | list | `[]` | Tolerations |
