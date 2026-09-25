import { useCallback, useEffect, useRef, useState } from 'react'
import { orderApi } from '../lib/endpoints'
import { getTokens, getWsBaseUrl } from '../lib/api'

const RECONNECT_DELAY_MS = 2000

/**
 * Same hook as the customer app's (kept as a separate copy since the two
 * frontends are independent deployables -- see the customer app's
 * src/hooks/useOrderChat.js for the full explanation). Backfills history
 * over REST, then a WebSocket carries live messages both ways.
 */
export function useOrderChat(orderId) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!orderId) return

    orderApi
      .listMessages(orderId)
      .then((history) => mountedRef.current && setMessages(history))
      .catch(() => {})

    const connect = () => {
      const { accessToken } = getTokens()
      if (!accessToken) return

      const ws = new WebSocket(`${getWsBaseUrl()}/ws/orders/${orderId}/chat?token=${encodeURIComponent(accessToken)}`)
      wsRef.current = ws

      ws.onopen = () => mountedRef.current && setConnected(true)

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (mountedRef.current) setMessages((prev) => [...prev, message])
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [orderId])

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim()
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false
    wsRef.current.send(JSON.stringify({ text: trimmed }))
    return true
  }, [])

  return { messages, connected, sendMessage }
}
