import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <>
      <Login />
    </>
  )
}

export default App

