module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      
      staticDistDir: 'dist/The-Garrison-System',
      url: ['/index.html'],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.80 }],
        'categories:seo': ['warn', { minScore: 0.80 }],
        'categories:best-practices': ['warn', { minScore: 0.80 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
