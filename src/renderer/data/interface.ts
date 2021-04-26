/* eslint-disable camelcase */
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

export interface AccountDetail {
  id: number;
  name: string;
  has_credit: boolean;
  cash: number;
  credit: number;
  sort: number;
  create_at: string;
  update_at: string;
  change_at: string
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
  account_id: number;
  type: number;
  category_id: number;
  money: number;
  description: string;
  repay_account_id: number;
  transfer_account_id: number;
  repay_detail_ids: number[];
}

export interface repaidChargeDetail {
  id: number;
  account_id: number;
  type: number;
  category: CategoryDetail;
  money: number;
  description: string;
  create_at: string;
  update_at: string;
  change_at: string
}

export interface unpaidChargeDetail extends repaidChargeDetail{}

export interface chargeDetail {
  id: number;
  account: AccountDetail;
  type: number;
  category: CategoryDetail;
  money: number;
  description: string;
  repaid_detail: repaidChargeDetail;
  repay_account: AccountDetail;
  transfer_account: AccountDetail;
  create_at: string;
  update_at: string;
  change_at: string
}
