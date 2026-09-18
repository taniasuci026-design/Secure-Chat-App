import { useEffect, useRef, useCallback } from 'react'

const IS_PRODUCTION = import.meta.env.PROD
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function useWebSocket(userId, onMessage) {
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const pollingRef = useRef(null)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (!userId) return
    const token = localStorage.getItem('token')
    if (!token) return

    if (IS_PRODUCTION) {
      // Vercel tidak support WebSocket — skip saja, chat tetap jalan via REST
      console.log('Production mode: WebSocket dinonaktifkan (Vercel serverless)')
      return
    }

    // Development: pakai WebSocket normal
    const wsUrl = `${WS_BASE_URL}/ws/${userId}?token=${token}`
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket terhubung')
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current)
          reconnectRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessageRef.current?.(data)
        } catch (e) {
          console.error('WebSocket parse error:', e)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket terputus, reconnect dalam 3 detik...')
        reconnectRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        console.warn('WebSocket error — fitur real-time tidak tersedia')
      }
    } catch (e) {
      console.warn('WebSocket gagal:', e)
    }
  }, [userId])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
    // Di production, pesan dikirim via REST API di ChatWindow — tidak perlu WS
  }, [])

  const ping = useCallback(() => {
    send({ type: 'ping' })
  }, [send])

  return { send, ping, wsRef }
}