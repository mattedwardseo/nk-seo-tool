/**
 * Quick test to see if the dev server is responding
 */

async function main() {
  console.log('Testing connection to http://localhost:3000...')

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch('http://localhost:3000/api/health', {
      signal: controller.signal
    })

    clearTimeout(timeout)

    const data = await response.json()
    console.log('✓ Server responded!')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('✗ Request timed out after 5 seconds')
    } else {
      console.log('✗ Error:', error instanceof Error ? error.message : 'Unknown')
    }
  }
}

main()
