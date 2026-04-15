const SectionContainer = ({ 
  children, 
  className = '', 
  background = 'transparent',
  padding = 'py-20 lg:py-24'
}) => {
  return (
    <section className={`relative ${background} ${padding} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {children}
      </div>
    </section>
  )
}

export default SectionContainer