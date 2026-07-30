import { type OperationTypeDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/** Тип операции на точке маршрута: погрузка или выгрузка. */
export const OPERATION_TYPE_DICT: EnumDict<NonNullable<OperationTypeDto>> = {
  Loading: { label: 'Погрузка', color: 'primary' },
  Unloading: { label: 'Выгрузка', color: 'secondary' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};
