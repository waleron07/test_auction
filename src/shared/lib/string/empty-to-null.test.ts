import { describe, expect, it } from 'vitest';

import { emptyToNull } from './empty-to-null.util';
import { NBSP } from './typography.const';

describe('emptyToNull (⑫)', () => {
  it('пустую строку схемы приводит к null', () => {
    // contact_phone, organization_name, cancel_reason: схема пишет туда '',
    // а не null. Без нормализации UI показывал бы пустые подписи.
    expect(emptyToNull('')).toBeNull();
  });

  it('строку из пробелов тоже считает незаданной', () => {
    expect(emptyToNull('   ')).toBeNull();
  });

  it('управляющие пробелы — тоже пустое значение', () => {
    expect(emptyToNull('\n\t')).toBeNull();
  });

  it('неразрывные пробелы — тоже пустое значение', () => {
    // Может прилететь из UI и из выгрузок: визуально поле выглядит пустым,
    // и вести себя оно обязано так же.
    expect(emptyToNull(`${NBSP}${NBSP}`)).toBeNull();
  });

  it('осмысленное значение отдаёт без изменений и без обрезки', () => {
    expect(emptyToNull('ООО «Ромашка»')).toBe('ООО «Ромашка»');
  });

  it('не обрезает пробелы вокруг значимого значения', () => {
    // Ключевой кейс: он отличает текущую реализацию от «упрощения»
    // `return value.trim() || null`, которое молча правило бы данные.
    expect(emptyToNull('  ООО «Ромашка»  ')).toBe('  ООО «Ромашка»  ');
  });

  it('null и undefined остаются null', () => {
    expect(emptyToNull(null)).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
  });
});
