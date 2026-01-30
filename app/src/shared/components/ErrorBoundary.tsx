import { Component, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary component that catches JavaScript errors in child components,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<div>Something went wrong</div>}
 *   onError={(error, errorInfo) => console.error('Error:', error, errorInfo)}
 * >
 *   <GameScreen />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="bp-error-boundary">
          <div className="bp-error-boundary-content">
            <h2 className="bp-error-boundary-title">Something went wrong</h2>
            <p className="bp-error-boundary-message">
              An unexpected error occurred. Don't worry, your progress is safe.
            </p>
            {this.state.error && (
              <details className="bp-error-boundary-details">
                <summary>Error details</summary>
                <pre className="bp-error-boundary-stack">{this.state.error.stack}</pre>
              </details>
            )}
            <div className="bp-error-boundary-actions">
              <button onClick={this.handleReset} className="bp-error-boundary-button">
                Try Again
              </button>
              <button onClick={this.handleReload} className="bp-error-boundary-button bp-error-boundary-button--primary">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children as ReactNode
  }
}

