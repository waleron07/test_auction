import { Box, Typography } from '@mui/material';

export interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

/**
 * Строка «подпись — значение», единый вид для всех секций детальной страницы.
 *
 * Раздельные секции (груз, оплата, торги) показывают одни и те же по форме
 * пары «подпись: значение» — свой компонент для каждой секции дал бы шесть
 * слегка разных реализаций одной идеи, ровно тот класс расхождений, который
 * уже один раз ломал вёрстку карточек списка.
 */
export const FieldRow = ({ label, value }: FieldRowProps) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" component="div" sx={{ textAlign: 'right' }}>
      {value}
    </Typography>
  </Box>
);
