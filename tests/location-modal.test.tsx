import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocationModal } from '@/components/app/LocationModal'

type GeolocationSuccess = Parameters<Geolocation['getCurrentPosition']>[0]
type GeolocationError = Parameters<Geolocation['getCurrentPosition']>[1]

const permissionDeniedError = {
  code: 1,
  message: 'User denied Geolocation',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3
} as GeolocationPositionError

const position = {
  coords: {
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: 40.7209,
    longitude: -73.9872,
    speed: null,
    toJSON: () => ({})
  },
  timestamp: 1,
  toJSON: () => ({})
} satisfies GeolocationPosition

const mockBrowserLocation = ({
  permissionState = 'prompt',
  positionError,
  positionSuccess = position
}: {
  permissionState?: PermissionState
  positionError?: GeolocationPositionError
  positionSuccess?: GeolocationPosition
} = {}) => {
  const getCurrentPosition = vi.fn((success: GeolocationSuccess, error?: GeolocationError) => {
    if (positionError) {
      error?.(positionError)
      return
    }

    success(positionSuccess)
  })

  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true
  })
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn(async () => ({ state: permissionState }))
    }
  })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  })

  return { getCurrentPosition }
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('location modal', () => {
  it('explains when browser location permission is already blocked before requesting coordinates', async () => {
    const { getCurrentPosition } = mockBrowserLocation({ permissionState: 'denied' })

    render(<LocationModal onUseBrowserLocation={vi.fn()} onUseDemo={vi.fn()} />)

    expect(await screen.findByText(/location is blocked in this browser/i)).toBeInTheDocument()
    expect(screen.getByText(/site control center/i)).toBeInTheDocument()
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('explains a denied geolocation callback and keeps retry available', async () => {
    mockBrowserLocation({ positionError: permissionDeniedError })

    render(<LocationModal onUseBrowserLocation={vi.fn()} onUseDemo={vi.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Use my location' }))

    expect(await screen.findByText(/location is blocked in this browser/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use my location' })).toBeEnabled())
  })

  it('stores browser coordinates after location sharing succeeds', async () => {
    mockBrowserLocation()
    const onUseBrowserLocation = vi.fn()

    render(<LocationModal onUseBrowserLocation={onUseBrowserLocation} onUseDemo={vi.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Use my location' }))

    await waitFor(() => expect(onUseBrowserLocation).toHaveBeenCalledWith({ lat: 40.7209, lng: -73.9872 }))
    expect(window.localStorage.getItem('besttime.location-choice')).toBe('browser')
    expect(window.localStorage.getItem('besttime.location-coordinates')).toBe(JSON.stringify({
      lat: 40.7209,
      lng: -73.9872
    }))
  })
})
