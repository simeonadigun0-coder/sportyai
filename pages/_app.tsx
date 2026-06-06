import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(err => console.log('SW registration failed:', err))
    }
  }, [])

  return <Component {...pageProps} />
}