import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-amenly-darkest/50 border border-amenly-dark rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-silver mb-6">
              The page encountered an error. Please refresh to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-amenly-light text-white rounded-lg hover:bg-amenly-medium transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-silver cursor-pointer hover:text-white">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
