import { motion, type HTMLMotionProps } from 'motion/react'

type RevealProps = HTMLMotionProps<'div'> & { delayMs?: number }

/** Fade + slide-up la primera vez que el elemento entra al viewport (scroll reveal). */
export default function Reveal({ children, delayMs = 0, transition, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: delayMs / 1000, ...transition }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
