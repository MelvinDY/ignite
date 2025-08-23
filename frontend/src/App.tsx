import { useState } from 'react'
import './App.css'
import UserList from './components/UserList'
import AddUser from './components/AddUser'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUserAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="App">
      <h1>Full Stack App</h1>
      <p>React + Vite frontend with TypeScript backend and Supabase</p>
      <AddUser onUserAdded={handleUserAdded} />
      <UserList key={refreshKey} />
    </div>
  )
}

export default App
