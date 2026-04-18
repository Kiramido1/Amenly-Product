import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uSpread;
  varying vec2 vUv;

  float Hash(vec2 p) {
    vec3 p2 = vec3(p.xy, 1.0);
    return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
  }

  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0 - 2.0 * f);
    return mix(
      mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),
      mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    v += noise(p * 1.0) * 0.5;
    v += noise(p * 2.0) * 0.25;
    v += noise(p * 4.0) * 0.125;
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 centeredUv = (uv - 0.5) * vec2(aspect, 1.0);
    
    float dissolveEdge = uv.y - uProgress * 1.2;
    float noiseValue = fbm(centeredUv * 15.0);
    float d = dissolveEdge + noiseValue * uSpread;
    
    float pixelSize = 1.0 / uResolution.y;
    float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);
    
    gl_FragColor = vec4(uColor, alpha);
  }
`

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.17, g: 0.45, b: 0.7 }
}

const DissolveCanvas = ({ 
  color = '#2c74b3', 
  spread = 0.5, 
  speed = 1,
  sectionId = 'home'
}) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const materialRef = useRef(null)
  const animationFrameRef = useRef(null)
  const scrollProgressRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const section = document.getElementById(sectionId)
    if (!section) return

    // Setup Three.js
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    })

    sceneRef.current = scene
    rendererRef.current = renderer

    const resize = () => {
      const width = section.offsetWidth
      const height = section.offsetHeight
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(width, height)
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Create shader material
    const rgb = hexToRgb(color)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(section.offsetWidth, section.offsetHeight),
        },
        uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
        uSpread: { value: spread },
      },
      transparent: true,
    })

    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Animation loop
    const animate = () => {
      material.uniforms.uProgress.value = scrollProgressRef.current
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Scroll handler
    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight
      const windowHeight = window.innerHeight
      
      // Calculate scroll progress based on section position
      const scrollStart = -rect.top
      const maxScroll = sectionHeight - windowHeight
      
      if (scrollStart <= 0) {
        scrollProgressRef.current = 0
      } else if (scrollStart >= maxScroll) {
        scrollProgressRef.current = 1.1
      } else {
        scrollProgressRef.current = Math.min((scrollStart / maxScroll) * speed, 1.1)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', handleScroll)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [color, spread, speed, sectionId])

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}

export default DissolveCanvas
