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

export interface Category {
  id: number;
  type: number;
  name: string;
  sort: number;
}
