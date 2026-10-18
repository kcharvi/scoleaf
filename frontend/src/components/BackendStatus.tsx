import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const BackendStatus = () => {
  const { checkBackendStatus } = useAppStore()

  useEffect(() => {
    // Check status immediately on mount
    checkBackendStatus()

    // Set up periodic status checking every 30 seconds
    const interval = setInterval(() => {
      checkBackendStatus()
    }, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [checkBackendStatus])

  // This component doesn't render anything - it just manages backend status
  return null
}

export default BackendStatus 