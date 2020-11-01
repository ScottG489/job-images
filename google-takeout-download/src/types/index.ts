export interface FileMeta {
    id: string;
    name: string;
}

export interface SecretsConfig {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    refreshToken: string;
}
