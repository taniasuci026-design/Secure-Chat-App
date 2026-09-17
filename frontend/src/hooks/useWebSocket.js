import { useEffect, useRef, useCallback } from 'react'

export function useWebSocket(userId, onMessage) {
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    if (!userId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const wsUrl = `ws://localhost:8000/ws/${userId}?token=${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket terhubung')
      if (reconnectRef.current) {
        clearInterval(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket terputus, reconnect dalam 3 detik...')
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }, [userId, onMessage])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const ping = useCallback(() => {
    send({ type: 'ping' })
  }, [send])

  return { send, ping }
}
