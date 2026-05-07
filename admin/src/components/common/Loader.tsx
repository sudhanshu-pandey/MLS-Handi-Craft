interface LoaderProps {
  message?: string
  fullPage?: boolean
}

export default function Loader({ message = 'Loading...', fullPage = false }: LoaderProps) {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 border-r-primary-600 animate-spin" />
      </div>
      {message && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-950 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-24 card rounded-xl">
      {spinnerContent}
    </div>
  )
}
