import { Box, Container } from '@mui/material';

export interface PageLayoutProps {
  /** Содержимое страницы. */
  children: React.ReactNode;
}

/**
 * Общий контейнер страницы. Контент центрируется и не растягивается шире
 * 1440px: дальше растут поля, а не колонки — читать строку в 2000px нельзя
 * (PLAN 0.7).
 */
export const PageLayout = ({ children }: PageLayoutProps) => (
  <Box component="main" sx={{ py: { xs: 2, md: 3 } }}>
    <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
      {children}
    </Container>
  </Box>
);
