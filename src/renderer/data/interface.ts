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
