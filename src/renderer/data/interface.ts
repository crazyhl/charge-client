export interface AddAccountFormState {
  name: string;
  hasCredit: boolean;
  cash: number;
  credit: number;
  sort: number;
}

export interface EditAccountFormState {
  id: number;
  name: string;
  hasCredit: boolean;
  cash: number;
  credit: number;
  sort: number;
}

export interface AddCategoryFormStat {
  name: string;
  type: number[];
  sort: number;
}

export interface EditCategoryFormStat {
  id: number;
  type: number;
  name: string;
  sort: number;
}

export interface CategoryDetail extends EditCategoryFormStat {}

export interface AddChargetDetailFormStat {
  accountId: number;
  type: number;
  categoryId: number;
  money: number;
  description: string;
  repayAccountId: number;
  transferAccountId: number;
  repaidDetailIds: number[];
}
