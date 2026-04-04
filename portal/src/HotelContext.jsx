import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './utils/api'

const HotelContext = createContext({ habboConnected: true, hotelStatus: { loading: true, socket_online: false } })

export function HotelProvider({ children, me }) {
  const habboConnected = me ? (me.habboConnected ?? true) : true

  const [hotelStatus, setHotelStatus] = useState({ loading: true, socket_online: false, reason: '', checked_url: '' })

  useEffect(() => {
    if (!habboConnected) {
      setHotelStatus({ loading: false, socket_online: false, reason: 'Hotel integration not enabled', checked_url: '' })
      return
    }

    let mounted = true
    async function loadStatus() {
      try {
        const data = await api('/api/hotel/status')
        if (!mounted) return
        setHotelStatus({ loading: false, socket_online: !!data.socket_online, reason: data.reason || '', checked_url: data.checked_url || '' })
      } catch (err) {
        if (!mounted) return
        setHotelStatus({ loading: false, socket_online: false, reason: err.message, checked_url: '' })
      }
    }

    loadStatus()
    const id = setInterval(loadStatus, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [habboConnected])

  return (
    <HotelContext.Provider value={{ habboConnected, hotelStatus }}>
      {children}
    </HotelContext.Provider>
  )
}

export function useHotel() {
  return useContext(HotelContext)
}
