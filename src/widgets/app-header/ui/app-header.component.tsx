import { AppBar, Box, Toolbar } from '@mui/material';
import { Link } from '@tanstack/react-router';

/**
 * Шапка приложения — единственная сквозная навигация (PLAN 0.7).
 *
 * Без неё с детальной страницы, истории ставок и формы ставки не было ходу
 * назад к списку ничем, кроме кнопки браузера: карточка ведёт в глубину, а
 * обратных ссылок ни на одном экране не было.
 *
 * **Активное состояние — по `exact`, а не по префиксу.** По умолчанию роутер
 * считает ссылку на `/auctions` активной и на `/auctions/$uuid`, то есть
 * подсветка горела бы всегда и ничего не сообщала. С `exact` таб подсвечен
 * ровно на списке («вы здесь»), а на вложенных экранах гаснет — и тем самым
 * читается как дорога назад. Разметку активности проставляет сам роутер
 * (`data-status="active"`), поэтому состояние не дублируется в компоненте.
 *
 * **`includeSearch: false` обязателен.** Список синхронизирует фильтры в
 * адресную строку, поэтому реальный URL всегда содержит `?page=1&perPage=20…`,
 * а ссылка таба — нет. При стандартном `includeSearch: true` совпадения не
 * происходит, и таб не подсвечивается **никогда**. Раздел не должен зависеть
 * от применённых фильтров: с фильтром и без него пользователь всё там же.
 *
 * Бургер-меню, заложенное в карту ширин для `xs`, не делается: пункт
 * назначения один, и меню из одного элемента добавляет нажатие вместо того,
 * чтобы его убрать. Высота таба — 44px даже на узких экранах (0.7, правило 3).
 *
 * Ссылка — обычный `<Link>`, стилизованный через `sx` родителя: полиморфный
 * `component` MUI и generic-тип `Link` не выводят друг друга (разобрано в
 * фазе 6, там же — `RouterButton` через `createLink` для кнопок).
 */
export const AppHeader = () => (
  <AppBar component="header" position="static" color="default" elevation={0} variant="outlined">
    <Toolbar
      component="nav"
      // Ландмарков `navigation` на странице списка два — этот и пагинация.
      // Без различимых имён они неразличимы для скринридера, а `getByRole`
      // в тестах становится неоднозначным (что и поймал тест списка).
      aria-label="Основная навигация"
      sx={{
        gap: 1,
        '& a': {
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 44,
          px: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          color: 'text.secondary',
          textDecoration: 'none',
          borderBottom: '2px solid transparent',
        },
        '& a:hover': { color: 'text.primary' },
        '& a[data-status="active"]': {
          color: 'primary.main',
          borderBottomColor: 'primary.main',
        },
      }}
    >
      <Box>
        <Link
          to="/auctions"
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{ 'aria-current': 'page' }}
        >
          Грузовые аукционы
        </Link>
      </Box>
    </Toolbar>
  </AppBar>
);
