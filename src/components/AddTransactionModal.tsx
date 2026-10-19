import React from 'react';
import {
  TransactionModal,
  TransactionModalProps,
} from './TransactionModal';
import { NewTransactionInput } from '../types/transaction';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveTransaction: (input: NewTransactionInput) => Promise<void>;
}

/**
 * Backwards-compatible wrapper reusing the unified TransactionModal for adding transactions.
 */
export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSaveTransaction,
}) => {
  return (
    <TransactionModal
      visible={visible}
      transaction={null}
      onClose={onClose}
      onSave={async (data) => {
        await onSaveTransaction(data as NewTransactionInput);
      }}
    />
  );
};
