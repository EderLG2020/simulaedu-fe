import { describe, expect, it } from 'vitest'
import { htmlSeguro } from './html'

describe('htmlSeguro', () => {
  it('quita scripts, manejadores on y enlaces javascript', () => {
    const limpio = htmlSeguro('<p>Hola<script>alert(1)</script></p><img src="https://x/a.png" onerror="alert(2)"><a href="javascript:alert(3)">x</a>')

    expect(limpio).not.toContain('script')
    expect(limpio).not.toContain('onerror')
    expect(limpio).not.toContain('javascript:')
    expect(limpio).toContain('<img src="https://x/a.png">')
  })

  it('conserva codigo y audio', () => {
    const html = '<pre><code>SELECT *\n  FROM t WHERE a &lt; 5;</code></pre><audio controls="" preload="none" src="https://x/a.mp3"></audio>'

    expect(htmlSeguro(html)).toBe(html)
  })
})
