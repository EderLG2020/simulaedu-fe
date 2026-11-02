import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'

/** Anima el numero contando desde 0 hasta `value` cuando el valor real llega (carga desde la API). */
export default function RollingNumber({ value, className = '' }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString('es-PE'))
  const prefiereMenosMovimiento = useReducedMotion()

  useEffect(() => {
    if (prefiereMenosMovimiento) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefiereMenosMovimiento])

  return (
    <motion.span
      className={`inline-block tabular-nums ${className}`.trim()}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {rounded}
    </motion.span>
  )
}
