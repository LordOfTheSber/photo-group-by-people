import { useEffect, useState } from 'react'
import { ClusterDetailPage } from '../../pages/cluster-detail/ClusterDetailPage'
import { DashboardPage } from '../../pages/dashboard/DashboardPage'

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash || '#/dashboard')
  useEffect(() => {
    const update = () => setHash(window.location.hash || '#/dashboard')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return hash
}

export const AppRouter = () => {
  const hash = useHash()

  if (hash.startsWith('#/cluster/')) {
    const id = Number(hash.replace('#/cluster/', ''))
    return <ClusterDetailPage clusterId={Number.isFinite(id) ? id : 1} />
  }

  return <DashboardPage />
}
