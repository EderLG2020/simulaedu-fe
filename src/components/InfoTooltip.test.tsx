import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import InfoTooltip from './InfoTooltip'

afterEach(cleanup)

describe('InfoTooltip', () => {
  it('no muestra el texto hasta interactuar', () => {
    render(<InfoTooltip etiqueta="Navegación">Explicación de navegación</InfoTooltip>)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más información: Navegación' })).toBeInTheDocument()
  })

  it('muestra el texto al pasar el mouse y lo oculta al salir', () => {
    render(<InfoTooltip etiqueta="Navegación">Explicación de navegación</InfoTooltip>)
    const boton = screen.getByRole('button')
    fireEvent.mouseEnter(boton)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Explicación de navegación')
    fireEvent.mouseLeave(boton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('se abre con el foco del teclado, se describe accesiblemente y cierra con Escape', () => {
    render(<InfoTooltip etiqueta="Navegación">Explicación de navegación</InfoTooltip>)
    const boton = screen.getByRole('button')
    fireEvent.focus(boton)
    expect(boton).toHaveAccessibleDescription('Explicación de navegación')
    fireEvent.keyDown(boton, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('alterna con clic (uso en pantallas táctiles)', () => {
    render(<InfoTooltip etiqueta="Navegación">Explicación de navegación</InfoTooltip>)
    const boton = screen.getByRole('button')
    fireEvent.click(boton)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.click(boton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
