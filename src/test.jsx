// Simple test component to verify React is working
function Test() {
  return (
    <div style={{ 
      background: 'black', 
      color: 'white', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '48px', color: '#2C74B3' }}>Amenly Test Page</h1>
      <p>If you see this, React is working! ✅</p>
      <a href="/" style={{ color: '#2C74B3', textDecoration: 'underline' }}>
        Go to Landing Page
      </a>
    </div>
  )
}

export default Test
