import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <main>
      <h1>Face Photo Sorter</h1>
      <p>Frontend scaffold is ready.</p>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
