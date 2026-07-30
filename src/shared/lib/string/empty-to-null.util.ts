/**
 * Нормализует «пустую строку вместо null» — сквозной приём этой схемы (⑫).
 *
 * `contact_phone`, `organization_name` и `cancel_reason` описаны как «пустая
 * строка, если не задано». Без нормализации на границе маппера каждый компонент
 * проверял бы и `null`, и `''`, и рано или поздно один из них проверку забыл бы.
 * @param value Значение из DTO.
 * @returns Непустая строка либо `null`.
 */
export const emptyToNull = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;

  return value.trim() === '' ? null : value;
};
