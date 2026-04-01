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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
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

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section>
      <h2>Processing progress</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => trigger('/faces/detect')}>Run face detection</button>
        <button onClick={() => trigger('/faces/embed')} style={{ marginLeft: 8 }}>
          Run embeddings
        </button>
        <button onClick={() => trigger('/faces/cluster')} style={{ marginLeft: 8 }}>
          Run clustering
        </button>
      </div>
      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            #{job.id} {job.job_type} — <strong>{job.status}</strong> ({job.processed_items}/{job.total_items})
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

  const load = async () => {
    setLoading(true)
    try {
      const data = await api<PersonDetail>(`/people/${clusterId}`)
      setDetail(data)
      setName(data.name)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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

      <h3>Face crops (remove incorrect)</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {detail.faces.map((face) => (
          <div key={face.id} style={{ border: '1px solid #ddd', padding: 6 }}>
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
