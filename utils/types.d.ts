import type { BigNumber } from "ethers";

export type ClawLoan = {
  pricePerDay: BigNumber;
  totalBorrow: BigNumber;
};

declare enum AssignState {
  DEFAULT,
  BY_OWNER,
  BY_BORROWER,
}

export type ClawBorrow = {
  deadline: BigNumber;
  totalAmount: BigNumber;
  totalBorrow: BigNumber;
  totalAssign: BigNumber;
  caller: string;
  borrower: string;
  assignState: AssignState;
};
