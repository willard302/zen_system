/**
 * 帳務狀態枚舉
 */
export enum TransactionStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUCCESS = 'success', // 舊資料相容
  SETTLED = 'settled' // 舊資料相容
}

/**
 * 交易類型枚舉
 */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

/**
 * 資料庫交易記錄（對應 ledger table）
 */
export interface DatabaseTransaction {
  id: string
  amount: number
  category: string
  created_at: string | null
  date: string
  finance_id: string
  icon: string
  is_approved: boolean | null
  receipt_path: string | null
  requester_id: string
  status: string
  title: string
  type: string
  updated_at: string | null
}

/**
 * 前端使用的交易記錄（基於資料庫模型增強）
 */
export interface Transaction extends Omit<DatabaseTransaction, 'finance_id' | 'requester_id'> {
  /** 顯示用的金額文字（含符號，e.g., "+$100.00" 或 "-$50.00"） */
  amountDisplay?: string
  /** 請款人ID / 負責人ID */
  requesterId: string
  /** 財務長ID */
  financeId: string
}

/**
 * 交易表單輸入（用於新建/編輯） */
export interface TransactionFormData {
  title: string
  date: string
  amount: number
  type: TransactionType | 'income' | 'expense'
  category: string
  icon: string
  status: TransactionStatus | string
  requesterId: string
  financeId?: string
  isApproved?: boolean
  receiptPath?: string
}

/**
 * 帳本摘要
 */
export interface LedgerSummary {
  clubBalance: string
  monthIn: string
  monthOut: string
}
