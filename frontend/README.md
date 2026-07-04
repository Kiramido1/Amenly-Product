# Amenly - Premium Cybersecurity SaaS Landing Page

Modern, dark-themed landing page for Amenly, the first Arabic platform for intelligent governance, risk, and compliance.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Three Fiber
- Three.js
- React Router DOM

## Features

- Premium dark futuristic cybersecurity design
- 3D animated hero section with GLB model support
- Glassmorphism UI components with blue glow effects
- Smooth scroll-based animations with Framer Motion
- Animated cyber grid and network nodes background
- Responsive design (desktop, tablet & mobile)
- Reusable component architecture
- Premium typography and spacing

## Brand Colors

- `#0A2647` - Darkest (amenly-darkest)
- `#144272` - Dark (amenly-dark)
- `#205295` - Medium (amenly-medium)
- `#2C74B3` - Light (amenly-light)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Project Assets

Move the following files to the `public/` folder:

- `sample_2026-03-07T022130.860.glb` - 3D model for hero section
- `flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png` - Transparent logo
- `flux-2-max-20251222_b_Enhance_the.jpeg` - Full logo (optional reference)

Your public folder should look like:
```
public/
├── sample_2026-03-07T022130.860.glb
├── flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png
└── flux-2-max-20251222_b_Enhance_the.jpeg
```

### 3. Run Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx                    - Transparent navbar with blur on scroll
│   ├── Footer.jsx                    - Footer with logo and links
│   ├── Button.jsx                    - Reusable button with variants
│   ├── GlassCard.jsx                 - Glassmorphism card component
│   ├── Hero3DScene.jsx               - 3D model viewer with React Three Fiber
│   ├── HeroSection.jsx               - Full-screen hero with animations
│   ├── FeaturesSection.jsx           - 4 feature cards with icons
│   ├── HowItWorksSection.jsx         - 4-step timeline
│   ├── PlatformPreviewSection.jsx    - Dashboard preview cards
│   └── CTASection.jsx                - Call-to-action section
├── pages/
│   ├── LandingPage.jsx               - Main landing page
│   ├── LoginPage.jsx                 - Login page
│   └── SignupPage.jsx                - Signup page
├── App.jsx                           - Router configuration
├── main.jsx                          - App entry point
└── index.css                         - Global styles & animations
```

## Pages

- `/` - Landing page with all sections
- `/login` - Login page with email/password
- `/signup` - Signup page with organization details

## Key Features

### Hero Section
- Animated 3D model with React Three Fiber
- Floating and rotating GLB model
- Parallax scrolling effects
- Animated cyber grid background
- Diagonal reflective stripes
- Floating network nodes
- Subtle logo watermark

### Features Section
- 4 glassmorphism cards with SVG icons
- Hover animations with glow effects
- Smooth entrance animations

### How It Works
- 4-step timeline with alternating layout
- Animated number badges
- Icon-enhanced step cards

### Platform Preview
- 4 dashboard metric cards
- Animated mini charts
- Trend indicators
- Color-coded gradients

### CTA Section
- Animated gradient background
- Floating glow orbs
- Trust indicators

## Animations

All animations use Framer Motion for smooth, professional effects:
- Fade-in on scroll
- Parallax scrolling
- Hover scale effects
- Gradient animations
- Floating elements
- Staggered entrances

## Design Philosophy

Inspired by premium SaaS platforms like:
- Stripe - Clean spacing and typography
- Vercel - Dark theme with subtle accents
- Linear - Smooth animations
- CrowdStrike - Cybersecurity aesthetic

## Customization

### Changing Colors
Edit `tailwind.config.js` to modify the Amenly color palette:

```js
colors: {
  amenly: {
    darkest: '#0A2647',
    dark: '#144272',
    medium: '#205295',
    light: '#2C74B3',
  },
}
```

### 3D Model
The `Hero3DScene` component loads the GLB model from `/public`. Replace the model file to use your own 3D asset. The component includes:
- Auto-rotation
- Floating animation
- Blue lighting setup
- Glow effects

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized 3D rendering with React Three Fiber
- Lazy loading for images
- Efficient animation with Framer Motion
- Minimal bundle size with Vite

## License

All rights reserved - Amenly 2026
