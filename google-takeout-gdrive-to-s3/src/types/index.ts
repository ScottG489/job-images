export interface FileMeta {
    id: string;
    name: string;
}

export interface SecretsConfig {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URL: string;
    REFRESH_TOKEN: string;
    AWS_CREDENTIALS_FILE_BASE64: string;
}
