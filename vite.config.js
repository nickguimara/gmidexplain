import { defineConfig } from 'vite';

// Caminhos relativos para funcionar tanto em GitHub Pages
// (nickguimara.github.io/<repo>/) quanto em domínio próprio.
export default defineConfig({
  base: './',
});
