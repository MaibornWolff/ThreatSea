# OpenID Connect Setup

This guide explains how to setup ThreaSea to use your preferred OpenID Connect Provider. An example is given below using KeyCloak as an OpenID Connect Provider.

## Setup an OIDC client

- Refer to your OpenID Connect Provider on how to setup an OpenID Connect client for your specific OpenID Connect Provider.
- Use your backend URL as a valid redirect URI. It is set in the .env file as "ORIGIN_BACKEND", for a local environment it is http://localhost:8000. Expand it by "/api/auth/redirect".

## Configure .env file

- Set PASSPORT_Strategy to "oidc"
- Set OIDC_ISSUER_URL to the URL given by your provider
- Set OIDC_CLIENT_ID to the id given by your provider
- Set OIDC_CLIENT_SECRET to the secret given by your provider

## Example with KeyCloak:

### 1. Start Keycloak

Start a local Keycloak instance, e.g. via Docker:

```
docker run -p 9090:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

Access the admin console at http://localhost:9090/admin and log in with admin / admin.

### 2. Create a Realm

1. Click the dropdown in the top-left corner (it says "Keycloak" by default)
2. Click Create realm
3. Give the realm a name, e.g. ThreatSea-Realm
4. Click Create

### 3. Create a Client

1. In the left menu, click Clients
2. Click Create client
3. Choose OpenID Connect as Client type
4. Set a Client ID, e.g. threatsea-client
5. Click Next
6. Enable Client authentication (this generates a client secret)
7. Click Next
8. Set Valid redirect URIs to http://localhost:8000/api/auth/redirect
9. Click Save

### 4. Retrieve the Client Secret

1. Go to Clients → threatsea-client
2. Click the Credentials tab
3. Copy the Client secret

### 5. Create a Test User

1. In the left menu, click Users
2. Click Create user
3. Set Username, Email, First name and Last name
4. Click Create
5. Go to the Credentials tab
6. Click Set password
7. Enter a password and disable Temporary (so you don't have to change it on first login)
8. Click Save

### 6. Configure .env

Set the .env variables as seen below, change the realm and client name if you used different ones. Keep in mind that your client secret is different.

```
ORIGIN_BACKEND=http://localhost:8000
PASSPORT_STRATEGY=oidc
OIDC_ISSUER_URL=http://localhost:9090/realms/ThreatSea-Realm
OIDC_CLIENT_ID=threatsea-client
OIDC_CLIENT_SECRET=dFeUP5wA5j0sztucuzhxGToPIq0eYrx2
```

### 7. Start the Application

Start the backend. The application will automatically discover all OIDC endpoints from the Keycloak realm via the /.well-known/openid-configuration URL.
