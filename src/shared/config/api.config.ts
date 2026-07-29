/** Базовый путь API из OpenAPI-схемы (`servers[0].url`). */
export const API_BASE_URL = '/api/v1';

/**
 * Задержка ответов моков, мс. Нужна, чтобы skeleton'ы и pending-состояния
 * были видимы при проверке, а не проскакивали мгновенно.
 */
export const MOCK_DELAY_MS = { min: 300, max: 600 } as const;
