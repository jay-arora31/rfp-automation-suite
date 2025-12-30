import api from './api';
import type { GmailStatus, DisconnectResponse } from '@/types/auth';

const API_BASE = import.meta.env.VITE_API_URL ;

export const authService = {
    /**
     * Get Gmail connection status
     */
    async getGmailStatus(): Promise<GmailStatus> {
        const { data } = await api.get<GmailStatus>('/api/auth/status');
        return data;
    },

    /**
     * Initiate Gmail OAuth flow
     * Redirects to Google OAuth consent screen
     */
    connectGmail(): void {
        window.location.href = `${API_BASE}/api/auth/google`;
    },

    /**
     * Disconnect Gmail account
     */
    async disconnectGmail(): Promise<DisconnectResponse> {
        const { data } = await api.post<DisconnectResponse>('/api/auth/disconnect');
        return data;
    },
};
