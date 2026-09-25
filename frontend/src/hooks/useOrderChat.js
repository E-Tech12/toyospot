import { useCallback, useEffect, useRef, useState } from 'react'
import { orderApi } from '../lib/endpoints'
import { getTokens, getWsBaseUrl } from '../lib/api'

const RECONNECT_DELAY_MS = 2000

/**
 * Backfills chat history over REST, then opens a WebSocket for live
 * delivery of new messages. Sending goes through the socket only (not
 * REST) so the sender's own message arrives via the same broadcast
 * everyone else gets, rather than being added twice (once optimistically,
 * once from the server).
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
        // Reconnect unless the component has unmounted (guarded by mountedRef)
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
