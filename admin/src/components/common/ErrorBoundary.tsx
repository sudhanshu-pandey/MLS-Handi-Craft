import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">💥</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="btn-primary mx-auto">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
