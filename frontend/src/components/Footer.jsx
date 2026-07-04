import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const Footer = () => {
  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Top border glow */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ background: 'linear-gradient(to right, transparent, #2C74B3, transparent)', transformOrigin: 'left' }}
      />

      {/* Glow orb with animation */}
      <motion.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#2C74B3]/8 rounded-full blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

        {/* Main content */}
        <div className="py-16 flex flex-col lg:flex-row lg:justify-between gap-12">

          {/* Brand */}
          <motion.div
            className="max-w-xs"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
          >
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <motion.img
                src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
                alt="Amenly Logo"
                className="h-10 w-auto"
                style={{ filter: 'drop-shadow(0 0 8px rgba(44,116,179,0.5))' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              />
              <span className="text-xl font-bold text-white tracking-wide group-hover:text-[#2C74B3] transition-colors">Amenly</span>
            </Link>
            <motion.p 
              className="text-gray-500 text-sm leading-relaxed mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              AI-powered compliance platform that streamlines security governance through intelligent document retrieval and automated workflows.
            </motion.p>
            <div className="flex gap-2">
              {[
                { icon: <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>, label: 'Twitter' },
                { icon: <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>, label: 'GitHub' },
                { icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>, label: 'LinkedIn' },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href="#"
                  aria-label={social.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                  whileHover={{ 
                    scale: 1.15, 
                    borderColor: 'rgba(44,116,179,0.6)',
                    backgroundColor: 'rgba(44,116,179,0.1)',
                    rotate: [0, -5, 5, 0]
                  }}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-500 hover:text-[#2C74B3] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">{social.icon}</svg>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          <div className="flex gap-16 lg:gap-24">
            {/* Product */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={1}
            >
              <motion.p 
                className="text-[#2C74B3] text-xs font-semibold uppercase tracking-[0.15em] mb-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Product
              </motion.p>
              <ul className="space-y-3.5">
                {[
                  { label: 'Why Amenly', to: '/' },
                  { label: 'AI Compliance', to: '/ai-compliance' },
                  { label: 'Dashboard', to: '/dashboard' },
                  { label: 'Pricing', href: '#pricing' },
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                  >
                    {item.to
                      ? <Link to={item.to} className="text-gray-500 hover:text-white transition-colors text-sm">{item.label}</Link>
                      : <a href={item.href} className="text-gray-500 hover:text-white transition-colors text-sm">{item.label}</a>
                    }
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* About Us */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={2}
            >
              <motion.p 
                className="text-[#2C74B3] text-xs font-semibold uppercase tracking-[0.15em] mb-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                About Us
              </motion.p>
              <ul className="space-y-3.5">
                {[
                  { label: 'Our Team', to: '/about' },
                  { label: 'Careers', href: '#careers' },
                  { label: 'Terms of Service', href: '#terms' },
                  { label: 'Contact', href: '#contact' },
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                  >
                    {item.to
                      ? <Link to={item.to} className="text-gray-500 hover:text-white transition-colors text-sm">{item.label}</Link>
                      : <a href={item.href} className="text-gray-500 hover:text-white transition-colors text-sm">{item.label}</a>
                    }
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="py-5 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.p 
            className="text-gray-500 text-xs"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            © {new Date().getFullYear()} Amenly. All rights reserved.
          </motion.p>
          <motion.a 
            href="#docs" 
            className="text-gray-500 hover:text-[#2C74B3] transition-colors text-xs"
            whileHover={{ scale: 1.05, x: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            Documentation →
          </motion.a>
        </motion.div>

      </div>
    </footer>
  )
}

export default Footer
