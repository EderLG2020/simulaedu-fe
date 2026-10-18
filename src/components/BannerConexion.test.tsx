import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useConexionStore } from '../stores/conexionStore'
import BannerConexion from './BannerConexion'

describe('BannerConexion', () => {
  afterEach(() => {
    cleanup()
    useConexionStore.setState({ sinConexion: false, peticionesLentas: 0 })
  })

  it('no muestra nada con conexion normal', () => {
    render(<BannerConexion />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('avisa cuando el navegador pierde la conexion y se oculta al volver', () => {
    render(<BannerConexion />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('status').textContent).toContain('Sin conexión a internet')

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('avisa cuando hay peticiones lentas', () => {
    useConexionStore.setState({ peticionesLentas: 1 })
    render(<BannerConexion />)
    expect(screen.getByRole('status').textContent).toContain('conexión está lenta')
  })
})
