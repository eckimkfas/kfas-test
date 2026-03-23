import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        applicant: './applicant.html',
        admin: './admin.html'
      }
    }
  }
});
