import { useState, useEffect, useRef, useCallback } from 'react'
import { getAccessToken, WS_BASE_URL } from '../api/client'

export const useWebSocket = (sessionId, onMessage, onTyping, onConnected, onError, onComplete) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const connect = useCallback(() => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const wsUrl = `${WS_BASE_URL}/assessments/${sessionId}/chat?token=${encodeURIComponent(token)}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttemptsRef.current = 0
        onConnected?.()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log('WebSocket connected:', data)
          } else if (data.type === 'history') {
            onMessage?.(data.messages, true)
          } else if (data.type === 'message') {
            onMessage?.([data], false)
          } else if (data.type === 'typing') {
            onTyping?.(data.is_typing)
          } else if (data.type === 'complete') {
            onComplete?.(data.metadata || {})
          } else if (data.type === 'error') {
            onError?.(data.message)
          } else if (data.type === 'pong') {
            // Heartbeat response
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 2000 * reconnectAttemptsRef.current) // Exponential backoff
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.('WebSocket connection error')
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setIsConnecting(false)
      onError?.(error.message)
    }
  }, [sessionId, isConnecting, isConnected, onMessage, onTyping, onConnected, onError, onComplete])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttemptsRef.current = 0
  }, [])

  const sendMessage = useCallback((message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: message,
      }))
    }
  }, [isConnected])

  const sendPing = useCallback(() => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [isConnected])

  // Heartbeat to keep connection alive
  useEffect(() => {
    let heartbeatInterval
    
    if (isConnected) {
      heartbeatInterval = setInterval(() => {
        sendPing()
      }, 30000) // Ping every 30 seconds
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    }
  }, [isConnected, sendPing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
  }
}
