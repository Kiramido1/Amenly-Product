import { useState } from 'react'

// Interactive 3D Logo
const Hero3DScene = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -15
    const rotateY = ((x - centerX) / centerX) * 15
    
    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="logo-3d-interactive"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
        }}
      >
        <img 
          src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
          alt="Amenly Logo"
          className="logo-image-interactive"
          draggable="false"
        />
      </div>
    </div>
  )
}

export default Hero3DScene
