# google-takeout-gdrive-to-s3

## Updating refresh token
Every so often the refresh token may need to be updated. Right now this is a manual process.
In order to do this you'll need a file that looks like this below which I believe can be retrieved by logging into the
google cloud console. I don't remember exactly what it's called.

`google-api-access-oauth.json`
```json
{
  "installed": {
    "client_id": "abc123.apps.googleusercontent.com",
    "project_id": "api-access-abc123",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "abc123",
    "redirect_uris": [
      "urn:ietf:wg:oauth:2.0:oob",
      "http://localhost"
    ]
  }
}
```

You'll also need `oauth2l`. Then run the following:

```bash
oauth2l fetch --output_format json --credentials google-api-access-oauth.json --scope drive
```

This will output a number of things including the refresh token.
