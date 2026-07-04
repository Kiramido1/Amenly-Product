import { memo } from 'react'

const countryIcons = {
  egypt: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="4" fill="#CE1126" />
      <rect x="3" y="9" width="18" height="6" fill="#FFFFFF" />
      <rect x="3" y="15" width="18" height="4" fill="#000000" />
      <path d="M12 10.5L13.5 13.5H10.5L12 10.5Z" fill="#C09300" stroke="#C09300" strokeWidth="0.5" />
    </svg>
  ),
  saudi: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" fill="#165B33" rx="1" />
      <path d="M8 12h8M12 9v6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 10.5c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
    </svg>
  ),
  eu: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" fill="#003399" rx="1" />
      <circle cx="12" cy="7" r="0.5" fill="#FFCC00" />
      <circle cx="14.5" cy="7.5" r="0.5" fill="#FFCC00" />
      <circle cx="16" cy="9" r="0.5" fill="#FFCC00" />
      <circle cx="16.5" cy="11" r="0.5" fill="#FFCC00" />
      <circle cx="16" cy="13" r="0.5" fill="#FFCC00" />
      <circle cx="14.5" cy="14.5" r="0.5" fill="#FFCC00" />
      <circle cx="12" cy="15" r="0.5" fill="#FFCC00" />
      <circle cx="9.5" cy="14.5" r="0.5" fill="#FFCC00" />
      <circle cx="8" cy="13" r="0.5" fill="#FFCC00" />
      <circle cx="7.5" cy="11" r="0.5" fill="#FFCC00" />
      <circle cx="8" cy="9" r="0.5" fill="#FFCC00" />
      <circle cx="9.5" cy="7.5" r="0.5" fill="#FFCC00" />
    </svg>
  ),
  uae: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="4" height="14" fill="#FF0000" />
      <rect x="7" y="5" width="14" height="4.67" fill="#00732F" />
      <rect x="7" y="9.67" width="14" height="4.66" fill="#FFFFFF" />
      <rect x="7" y="14.33" width="14" height="4.67" fill="#000000" />
    </svg>
  ),
}

const CountryIcon = ({ country, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {countryIcons[country] || (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" fill="rgba(255,255,255,0.1)" rx="1" />
          <path d="M12 9v6M9 12h6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

export default memo(CountryIcon)
