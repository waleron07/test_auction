/** Ширина «десктопа» по умолчанию: больше брейкпоинта md (900px) темы MUI. */
const DEFAULT_WIDTH = 1280;

let currentWidth = DEFAULT_WIDTH;

/**
 * Ставит заглушку `matchMedia`, которой нет в jsdom.
 *
 * Без неё `useMediaQuery` всегда возвращает `false`, то есть весь адаптивный
 * интерфейс в тестах живёт в мобильной ветке: панель фильтров уезжает в
 * закрытый drawer, и половина элементов просто отсутствует в DOM. Тест при
 * этом падает с «элемент не найден» — сообщение, по которому причину не
 * угадать.
 *
 * Заглушка разбирает `min-width` и `max-width` — этого достаточно для
 * брейкпоинтов MUI и позволяет тесту явно выбрать ширину.
 */
export const installMatchMedia = (): void => {
  window.matchMedia = (query: string): MediaQueryList => {
    const min = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/u.exec(query);
    const max = /\(max-width:\s*(\d+(?:\.\d+)?)px\)/u.exec(query);
    const matchesMin = min === null || currentWidth >= Number(min[1]);
    const matchesMax = max === null || currentWidth <= Number(max[1]);

    return {
      matches: matchesMin && matchesMax,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    };
  };
};

/**
 * Задаёт ширину окна для последующих рендеров.
 * @param width Ширина в пикселях.
 */
export const setViewportWidth = (width: number): void => {
  currentWidth = width;
};

/** Возвращает ширину по умолчанию — вызывается между тестами. */
export const resetViewportWidth = (): void => {
  currentWidth = DEFAULT_WIDTH;
};
