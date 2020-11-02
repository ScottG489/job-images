#!/bin/bash
set -e
set +x

#readonly MINT_USERNAME=$(echo -n $1 | jq -r .MINT_USERNAME)
#readonly MINT_PASSWORD=$(echo -n $1 | jq -r .MINT_PASSWORD)
#readonly MINT_MFA_TOKEN=$(echo -n $1 | jq -r .MINT_MFA_TOKEN)
[[ -f "/run/build/secrets/secrets" ]] \
    || (echo "Incorrect credentials" && exit 1)

readonly UNLOCK_SECRETS_CREDENTIALS_STORED=$(echo -n $1 | jq -r .UNLOCK_SECRETS_CREDENTIALS)
readonly UNLOCK_SECRETS_CREDENTIALS_GIVEN=$(cat /run/build/secrets/secrets | jq --raw-output .UNLOCK_SECRETS_CREDENTIALS)
[[ -n "$UNLOCK_SECRETS_CREDENTIALS_STORED" ]] \
    || (echo "Incorrect credentials" && exit 1)
[[ -n "$UNLOCK_SECRETS_CREDENTIALS_GIVEN" ]] \
    || (echo "Incorrect credentials" && exit 1)

[[ "$UNLOCK_SECRETS_CREDENTIALS_STORED" == "$UNLOCK_SECRETS_CREDENTIALS_GIVEN" ]] \
    || (echo "Incorrect credentials" && exit 1)

readonly MINT_USERNAME=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_USERNAME)
readonly MINT_PASSWORD=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_PASSWORD)
readonly MINT_MFA_TOKEN=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_MFA_TOKEN)
[[ -n "$MINT_USERNAME" ]] \
    || (echo "Incorrect credentials" && exit 1)
[[ -n "$MINT_PASSWORD" ]] \
    || (echo "Incorrect credentials" && exit 1)
[[ -n "$MINT_MFA_TOKEN" ]] \
    || (echo "Incorrect credentials" && exit 1)

mintapi --headless --mfa-method soft-token --mfa-token "$MINT_MFA_TOKEN" "$MINT_USERNAME" "$MINT_PASSWORD" --credit-score
