import React from 'react';
import {
  TransactionModal,
} from './TransactionModal';
import { Transaction, UpdateTransactionInput } from '../types/transaction';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateTransaction: (input: UpdateTransactionInput) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

/**
 * Reuses the unified TransactionModal for viewing, editing, and deleting existing transactions.
 */
export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  return (
    <TransactionModal
      visible={visible}
      transaction={transaction}
      onClose={onClose}
      onSave={async (data) => {
        await onUpdateTransaction(data as UpdateTransactionInput);
      }}
      onDelete={onDeleteTransaction}
    />
  );
};
