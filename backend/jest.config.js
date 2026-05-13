/** @type {import('jest').Config} */
module.exports = {
  // Le decimos a Jest que use ts-jest para leer archivos TypeScript
  // Sin esto, Jest no entiende la sintaxis de TS (decoradores, tipos, etc.)
  preset: 'ts-jest',

  // El entorno donde corren los tests: 'node' es el correcto para backends
  // (alternativa sería 'jsdom' que se usa en frontends con DOM)
  testEnvironment: 'node',

  // Dónde buscar los archivos de test:
  // Busca cualquier archivo *.spec.ts o *.test.ts dentro de src/
  roots: ['<rootDir>/src'],

  // Patrón de nombres de archivos de test
  testRegex: '.*\\.spec\\.ts$',

  // Qué extensiones de archivo puede importar Jest
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Configuración de ts-jest: le pasamos el tsconfig del proyecto
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Qué archivos ignorar (node_modules y la carpeta de build)
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Configuración para el reporte de cobertura de código
  // Cuando se ejecute con --coverage, mostrará qué % del código está cubierto
  coverageDirectory: '../coverage/backend',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',         // Excluimos el punto de entrada
    '!src/**/*.module.ts',  // Excluimos los módulos (son solo inyección de dependencias)
    '!src/**/*.dto.ts',     // Excluimos los DTOs (son solo interfaces de datos)
  ],
};
