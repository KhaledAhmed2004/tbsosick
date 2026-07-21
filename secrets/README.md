# Application Secrets

This directory is mounted at `/app/secrets` within the Docker container.
The application will not start until all required files are present.

**Place the following files here:**
- `apple-key.p8` (Apple Private Key)
- `google-service-account.json` (Google Cloud Credentials)
- `apple-root-certs/AppleIncRootCertificate.cer`
- `apple-root-certs/AppleRootCA-G3.cer`

**Security Warning:**
Never commit sensitive keys or credentials to this repository. This directory is ignored by Git, except for this README file.
