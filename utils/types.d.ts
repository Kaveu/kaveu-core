import type { BigNumber } from "ethers";

declare enum AssignState {
  DEFAULT,
  BY_OWNER,
  BY_BORROWER,
}

export type BorrowData = {
  deadline: BigNumber;
  totalAmount: BigNumber;
  totalBorrow: BigNumber;
  caller: string;
  borrower: string;
  assignState: AssignState;
};

export type Claw = {
  pricePerDay: BigNumber;
  totalBorrow: BigNumber;
  totalAssign: BigNumber;
  totalClaw: BigNumber;
};
