#!/bin/bash
set -e

set +x
#readonly MINT_USERNAME=$(echo -n $1 | jq -r .MINT_USERNAME)
#readonly MINT_PASSWORD=$(echo -n $1 | jq -r .MINT_PASSWORD)
#readonly MINT_MFA_TOKEN=$(echo -n $1 | jq -r .MINT_MFA_TOKEN)

readonly UNLOCK_SECRETS_CREDENTIALS_STORED=$(echo -n $1 | jq -r .UNLOCK_SECRETS_CREDENTIALS)
readonly UNLOCK_SECRETS_CREDENTIALS_GIVEN=$(cat /run/build/secrets/secrets | jq --raw-output .UNLOCK_SECRETS_CREDENTIALS)

[[ "$UNLOCK_SECRETS_CREDENTIALS_STORED" == "$UNLOCK_SECRETS_CREDENTIALS_GIVEN" ]] \
    || (echo "Incorrect secret unlock credentials" && exit 1)

readonly MINT_USERNAME=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_USERNAME)
readonly MINT_PASSWORD=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_PASSWORD)
readonly MINT_MFA_TOKEN=$(cat /run/build/secrets/secrets | jq --raw-output .MINT_MFA_TOKEN)
set -x

mintapi --headless --mfa-method soft-token --mfa-token "MINT_MFA_TOKEN" "MINT_USERNAME" "MINT_PASSWORD" --credit-score 
