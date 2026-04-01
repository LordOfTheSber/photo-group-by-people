import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

type Job = {
  id: number
  job_type: string
  status: string
  total_items: number
  processed_items: number
  error_count: number
  message?: string | null
  created_at: string
  updated_at: string
}

type PersonCluster = {
  id: number
  name: string
  face_count: number
  image_count: number
  cover_face_thumbnail_url?: string | null
  created_at: string
}

type PersonDetail = {
  id: number
  name: string
  created_at: string
  cover_face_thumbnail_url?: string | null
  faces: Array<{ id: number; image_id: number; thumbnail_url?: string | null }>
  images: Array<{ id: number; file_name: string; preview_url: string }>
}

type ClusterMutationResponse = {
  status: string
  affected_cluster_ids: number[]
  moved_face_count: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

const toAssetUrl = (path?: string | null) => (path ? `${API_BASE}${path}` : '')

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function HomePage() {
  const [folderPath, setFolderPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startScan = async () => {
    setLoading(true)
    setError('')
    try {
      await api('/scan', {
        method: 'POST',
        body: JSON.stringify({ folder_path: folderPath }),
      })
      window.location.hash = '#/progress'
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2>Start processing</h2>
      <p>Start a new scan or continue with existing clusters.</p>
      <input
        value={folderPath}
        onChange={(e) => setFolderPath(e.target.value)}
        placeholder="/absolute/path/to/photos"
        style={{ width: 360, marginRight: 8 }}
      />
      <button onClick={startScan} disabled={!folderPath || loading}>
        {loading ? 'Starting...' : 'Start scan'}
      </button>
      <button onClick={() => (window.location.hash = '#/progress')} style={{ marginLeft: 8 }}>
        Processing status
      </button>
      <button onClick={() => (window.location.hash = '#/people')} style={{ marginLeft: 8 }}>
        Open clusters
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

function ProgressPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api<{ items: Job[]; total: number }>('/jobs?limit=50')
      setJobs(data.items)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const trigger = async (path: string) => {
    try {
      await api(path, { method: 'POST' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const runFullPipeline = async () => {
    try {
      await api('/faces/detect', { method: 'POST' })
      await api('/faces/embed', { method: 'POST' })
      await api('/faces/cluster', { method: 'POST' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const [exportPath, setExportPath] = useState('')
  const [exportStrategy, setExportStrategy] = useState<'copy' | 'symlink' | 'hardlink'>('copy')
  const triggerExport = async () => {
    try {
      await api('/export', {
        method: 'POST',
        body: JSON.stringify({ output_dir: exportPath, strategy: exportStrategy, include_report: true }),
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section>
      <h2>Processing progress</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={runFullPipeline}>Run full pipeline</button>
        <button onClick={() => trigger('/faces/detect')} style={{ marginLeft: 8 }}>Run face detection</button>
        <button onClick={() => trigger('/faces/embed')} style={{ marginLeft: 8 }}>
          Run embeddings
        </button>
        <button onClick={() => trigger('/faces/cluster')} style={{ marginLeft: 8 }}>
          Run clustering
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          value={exportPath}
          onChange={(e) => setExportPath(e.target.value)}
          placeholder="/absolute/path/to/export"
          style={{ width: 320, marginRight: 8 }}
        />
        <select value={exportStrategy} onChange={(e) => setExportStrategy(e.target.value as 'copy' | 'symlink' | 'hardlink')}>
          <option value="copy">copy</option>
          <option value="symlink">symlink</option>
          <option value="hardlink">hardlink</option>
        </select>
        <button onClick={triggerExport} disabled={!exportPath} style={{ marginLeft: 8 }}>
          Run export
        </button>
      </div>
      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            #{job.id} {job.job_type} — <strong>{job.status}</strong> ({job.processed_items}/{job.total_items})
            {job.message ? <div style={{ color: '#555', fontSize: 12 }}>{job.message}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function PeoplePage() {
  const [clusters, setClusters] = useState<PersonCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ items: PersonCluster[]; total: number }>('/people?limit=100')
      .then((res) => setClusters(res.items))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h2>People clusters</h2>
      {loading && <p>Loading clusters...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {clusters.map((cluster) => (
          <article key={cluster.id} style={{ border: '1px solid #ddd', padding: 8 }}>
            {cluster.cover_face_thumbnail_url && (
              <img src={toAssetUrl(cluster.cover_face_thumbnail_url)} alt={cluster.name} style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }} />
            )}
            <h3 style={{ marginBottom: 4 }}>{cluster.name}</h3>
            <p style={{ margin: 0 }}>{cluster.face_count} faces / {cluster.image_count} images</p>
            <button onClick={() => (window.location.hash = `#/people/${cluster.id}`)}>Review</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function PersonDetailPage({ clusterId }: { clusterId: number }) {
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFaceIds, setSelectedFaceIds] = useState<number[]>([])
  const [destinationName, setDestinationName] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [allClusters, setAllClusters] = useState<PersonCluster[]>([])
  const [mutationMessage, setMutationMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api<PersonDetail>(`/people/${clusterId}`)
      setDetail(data)
      setName(data.name)
      setError('')
      setSelectedFaceIds([])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    api<{ items: PersonCluster[]; total: number }>('/people?limit=300')
      .then((res) => setAllClusters(res.items))
      .catch(() => undefined)
  }, [clusterId])

  const rename = async () => {
    try {
      await api(`/people/${clusterId}`, { method: 'PATCH', body: JSON.stringify({ name }) })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeFace = async (faceId: number) => {
    try {
      await api(`/people/${clusterId}/faces/${faceId}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const toggleFaceSelection = (faceId: number) => {
    setSelectedFaceIds((prev) => (prev.includes(faceId) ? prev.filter((id) => id !== faceId) : [...prev, faceId]))
  }

  const splitSelectedFaces = async () => {
    if (!selectedFaceIds.length) return
    try {
      const result = await api<ClusterMutationResponse>('/people/split', {
        method: 'POST',
        body: JSON.stringify({
          source_cluster_id: clusterId,
          face_ids: selectedFaceIds,
          destination_cluster_name: destinationName || undefined,
        }),
      })
      setMutationMessage(`Split complete: moved ${result.moved_face_count} faces`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const createClusterFromFaces = async () => {
    if (!selectedFaceIds.length) return
    try {
      const result = await api<ClusterMutationResponse>('/people/create-from-faces', {
        method: 'POST',
        body: JSON.stringify({ face_ids: selectedFaceIds, cluster_name: destinationName || undefined }),
      })
      setMutationMessage(`Created cluster from ${result.moved_face_count} faces`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const mergeIntoTarget = async () => {
    const target = Number(mergeTargetId)
    if (!target) return
    try {
      const result = await api<ClusterMutationResponse>('/people/merge', {
        method: 'POST',
        body: JSON.stringify({ source_cluster_ids: [clusterId], target_cluster_id: target }),
      })
      setMutationMessage(`Merged into cluster ${target}, moved ${result.moved_face_count} faces`)
      window.location.hash = `#/people/${target}`
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) return <p>Loading person details...</p>
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (!detail) return <p>Cluster not found.</p>

  return (
    <section>
      <button onClick={() => (window.location.hash = '#/people')}>← Back to clusters</button>
      <h2>{detail.name}</h2>
      {detail.cover_face_thumbnail_url && <img src={toAssetUrl(detail.cover_face_thumbnail_url)} alt={detail.name} style={{ width: 120, borderRadius: 8 }} />}
      <p>{detail.faces.length} faces · {detail.images.length} images</p>

      <div style={{ marginBottom: 16 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={rename} style={{ marginLeft: 8 }}>Rename cluster</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          placeholder="Name for new cluster (optional)"
          style={{ width: 280 }}
        />
        <button onClick={splitSelectedFaces} disabled={!selectedFaceIds.length} style={{ marginLeft: 8 }}>
          Split selected faces
        </button>
        <button onClick={createClusterFromFaces} disabled={!selectedFaceIds.length} style={{ marginLeft: 8 }}>
          Create cluster from selected
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)}>
          <option value="">Merge current into...</option>
          {allClusters
            .filter((cluster) => cluster.id !== clusterId)
            .map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.id} — {cluster.name}
              </option>
            ))}
        </select>
        <button onClick={mergeIntoTarget} disabled={!mergeTargetId} style={{ marginLeft: 8 }}>
          Merge cluster
        </button>
      </div>
      {mutationMessage && <p style={{ color: 'green' }}>{mutationMessage}</p>}

      <h3>Face crops (remove incorrect)</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {detail.faces.map((face) => (
          <div key={face.id} style={{ border: '1px solid #ddd', padding: 6 }}>
            <label style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                checked={selectedFaceIds.includes(face.id)}
                onChange={() => toggleFaceSelection(face.id)}
              />{' '}
              Select
            </label>
            {face.thumbnail_url && <img src={toAssetUrl(face.thumbnail_url)} alt={`Face ${face.id}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />}
            <button onClick={() => removeFace(face.id)} style={{ width: '100%', marginTop: 6 }}>Remove</button>
          </div>
        ))}
      </div>

      <h3>Related photos</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {detail.images.map((image) => (
          <figure key={image.id} style={{ margin: 0 }}>
            <img src={toAssetUrl(image.preview_url)} alt={image.file_name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
            <figcaption style={{ fontSize: 12 }}>{image.file_name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function App() {
  const hash = useHashRoute()
  const view = useMemo(() => {
    if (hash.startsWith('#/people/')) {
      const id = Number(hash.replace('#/people/', ''))
      return Number.isFinite(id) ? <PersonDetailPage clusterId={id} /> : <PeoplePage />
    }
    if (hash === '#/progress') return <ProgressPage />
    if (hash === '#/people') return <PeoplePage />
    return <HomePage />
  }, [hash])

  return (
    <main style={{ fontFamily: 'sans-serif', margin: '0 auto', maxWidth: 980, padding: 16 }}>
      <h1>Face Photo Sorter</h1>
      <nav style={{ marginBottom: 16 }}>
        <a href="#/">Home</a> · <a href="#/progress">Progress</a> · <a href="#/people">People</a>
      </nav>
      {view}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
