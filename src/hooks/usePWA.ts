'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSSafari, setIsIOSSafari] = useState(false)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }

    checkStandalone()

    const ua = navigator.userAgent
    // iPadOS 13+ reports as "Macintosh" in the UA string but exposes multi-touch,
    // unlike a real Mac. Detect it via maxTouchPoints to avoid missing iPads.
    const isIPadOS13Plus = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
    const isIOSDevice = (/iPad|iPhone|iPod/.test(ua) || isIPadOS13Plus) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Any other iOS browser (Chrome, Firefox, Edge) uses Safari's WebKit engine
    // under the hood but appends its own token, which we use to exclude it here.
    const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS/.test(ua)
    setIsIOSSafari(isIOSDevice && !isOtherIOSBrowser)

    // In-app browsers (social apps' embedded WebViews) block the install prompt
    // and often hide Safari's share sheet, so we detect them to guide users out.
    const inAppMarkers = /Instagram|FBAN|FBAV|WhatsApp|Line|TikTok/i.test(ua)
    const isIOSWebView = isIOSDevice && /\bwv\b/.test(ua)
    setIsInAppBrowser(inAppMarkers || isIOSWebView)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkStandalone)

    setIsReady(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', checkStandalone)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
    return outcome === 'accepted'
  }

  return {
    isInstalled,
    isStandalone,
    canInstall: !!installPrompt,
    isIOS,
    isIOSSafari,
    isInAppBrowser,
    isReady,
    promptInstall
  }
}
