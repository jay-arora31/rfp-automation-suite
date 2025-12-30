export interface GmailStatus {
    connected: boolean;
    email?: string;
}

export interface DisconnectResponse {
    success: boolean;
    message: string;
}
