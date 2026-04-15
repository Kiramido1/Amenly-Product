import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const FuturisticFooter = () => {
  const footerLinks = {
    Product: ['Features', 'Security', 'Integrations', 'Pricing', 'Changelog'],
    Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
    Resources: ['Documentation', 'Help Center', 'Community', 'Contact', 'Status'],
    Legal: ['Privacy', 'Terms', 'Security', 'Compliance', 'Cookies'],
  }

  return (
    <footer className="relative bg-black border-t border-white/10 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)' }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent)' }}
        animate={{
          y: [0, 30, 0],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-6">
              <img
                src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
                alt="Amenly Logo"
                className="h-12 w-auto"
              />
              <span className="text-2xl font-bold text-white ml-2">Amenly</span>
            </Link>

            <p className="text-gray-400 mb-6 leading-relaxed">
              Next-generation cybersecurity powered by AI. Protecting organizations
              with quantum-safe, autonomous security solutions.
            </p>

            {/* Social links */}
            <div className="flex gap-4">
              {['twitter', 'linkedin', 'github', 'discord'].map((social, i) => (
                <motion.a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(59,130,246,0)',
                        '0 0 20px rgba(59,130,246,0.5)',
                        '0 0 0px rgba(59,130,246,0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {social[0].toUpperCase()}
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                      whileHover={{ x: 5 }}
                    >
                      <motion.span
                        className="w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={{
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="py-12 border-t border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Stay Updated with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Future Tech
              </span>
            </h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates on AI security, quantum computing, and cybersecurity trends.
            </p>

            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-300"
              />
              <motion.button
                className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © 2060 Amenly. All rights reserved. Built for the future.
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <motion.div
              className="flex items-center gap-2"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>All Systems Operational</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </footer>
  )
}

export default FuturisticFooter
