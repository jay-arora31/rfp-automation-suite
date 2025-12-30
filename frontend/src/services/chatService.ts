import api from './api'
import type { ChatMessage, ChatResponse } from '@/types/rfp'

/**
 * Chat Service
 * API calls for conversational RFP creation
 */
export const chatService = {
    /**
     * Send chat message for RFP creation
     * @param messages - Conversation history
     * @returns AI response with status and collected data
     */
    async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
        const response = await api.post<ChatResponse>('/api/chat/rfp', { messages })
        return response.data
    }
}
