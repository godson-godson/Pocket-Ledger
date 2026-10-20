import { getDatabase } from './database';
import {
  WalletItem,
  WalletItemInput,
  WalletItemType,
} from '../types/wallet';

interface WalletRow {
  id: string;
  type: WalletItemType;
  name: string;
  issuer: string | null;
  holder_name: string | null;
  identifier: string | null;
  expiry_date: string | null;
  color: string;
  is_pinned: number;
  created_at: number;
  updated_at: number;
  note: string | null;
}

function mapRowToWalletItem(row: WalletRow): WalletItem {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    issuer: row.issuer || undefined,
    holderName: row.holder_name || undefined,
    identifier: row.identifier || undefined,
    expiryDate: row.expiry_date || undefined,
    color: row.color,
    isPinned: row.is_pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    note: row.note || undefined,
  };
}

export interface WalletQueryFilters {
  type?: string; // 'all' or specific WalletItemType
  searchQuery?: string;
}

/**
 * Fetches cards and passes from SQLite using parameterized queries.
 * Results are sorted with pinned items first, then most recently updated.
 */
export async function getWalletItems(
  filters: WalletQueryFilters = {}
): Promise<WalletItem[]> {
  const db = await getDatabase();
  const { type = 'all', searchQuery } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (type && type !== 'all') {
    conditions.push('type = ?');
    params.push(type);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    conditions.push(
      '(name LIKE ? OR (issuer IS NOT NULL AND issuer LIKE ?) OR (identifier IS NOT NULL AND identifier LIKE ?) OR (holder_name IS NOT NULL AND holder_name LIKE ?))'
    );
    params.push(term, term, term, term);
  }

  const query = `
    SELECT * FROM wallet_items 
    WHERE ${conditions.join(' AND ')} 
    ORDER BY is_pinned DESC, updated_at DESC, created_at DESC;
  `;

  const rows = await db.getAllAsync<WalletRow>(query, params);
  return rows.map(mapRowToWalletItem);
}

/**
 * Fetches a single wallet item by its unique ID.
 */
export async function getWalletItemById(id: string): Promise<WalletItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WalletRow>(
    'SELECT * FROM wallet_items WHERE id = ?;',
    [id]
  );
  return row ? mapRowToWalletItem(row) : null;
}

/**
 * Inserts or updates a wallet item in SQLite using parameterized queries.
 * Enforces privacy rules: Payment cards only allow up to 4 digits for identifier.
 */
export async function upsertWalletItem(input: WalletItemInput): Promise<WalletItem> {
  const db = await getDatabase();

  const name = input.name.trim();
  if (!name) {
    throw new Error('Card or pass name cannot be empty.');
  }

  const validTypes: WalletItemType[] = [
    'payment',
    'id_card',
    'membership',
    'loyalty',
    'transit',
    'custom',
  ];
  if (!validTypes.includes(input.type)) {
    throw new Error(`Invalid card/pass type: ${input.type}`);
  }

  let cleanIdentifier = input.identifier?.trim() || null;
  if (input.type === 'payment' && cleanIdentifier) {
    // Strictly enforce last 4 digits only (no full card numbers, CVVs, or PINs)
    cleanIdentifier = cleanIdentifier.replace(/\D/g, '');
    if (cleanIdentifier.length > 4) {
      throw new Error(
        'For security reasons, only enter the last 4 digits of a payment card reference. Full card numbers, CVVs, and PINs are not allowed.'
      );
    }
  }

  const issuer = input.issuer?.trim() || null;
  const holderName = input.holderName?.trim() || null;
  const expiryDate = input.expiryDate?.trim() || null;
  const color = input.color.trim() || 'onyx';
  const isPinned = input.isPinned ? 1 : 0;
  const note = input.note?.trim() || null;
  const now = Date.now();

  if (input.id) {
    // Update existing item
    const result = await db.runAsync(
      `UPDATE wallet_items SET
        type = ?,
        name = ?,
        issuer = ?,
        holder_name = ?,
        identifier = ?,
        expiry_date = ?,
        color = ?,
        is_pinned = ?,
        updated_at = ?,
        note = ?
      WHERE id = ?;`,
      [
        input.type,
        name,
        issuer,
        holderName,
        cleanIdentifier,
        expiryDate,
        color,
        isPinned,
        now,
        note,
        input.id,
      ]
    );

    if (result.changes === 0) {
      throw new Error(`Wallet item with ID "${input.id}" not found.`);
    }

    const updated = await getWalletItemById(input.id);
    if (!updated) {
      throw new Error('Failed to retrieve updated wallet item.');
    }
    return updated;
  } else {
    // Insert new item
    const id = `wlt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await db.runAsync(
      `INSERT INTO wallet_items (
        id, type, name, issuer, holder_name, identifier, expiry_date, color, is_pinned, created_at, updated_at, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.type,
        name,
        issuer,
        holderName,
        cleanIdentifier,
        expiryDate,
        color,
        isPinned,
        now,
        now,
        note,
      ]
    );

    const saved = await getWalletItemById(id);
    if (!saved) {
      throw new Error('Failed to retrieve saved wallet item.');
    }
    return saved;
  }
}

/**
 * Toggles the pinned/favorite status of a card or pass.
 */
export async function togglePinWalletItem(
  id: string,
  isPinned: boolean
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE wallet_items SET is_pinned = ?, updated_at = ? WHERE id = ?;',
    [isPinned ? 1 : 0, Date.now(), id]
  );
  return result.changes > 0;
}

/**
 * Deletes a single wallet card or pass by ID.
 */
export async function deleteWalletItem(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM wallet_items WHERE id = ?;',
    [id]
  );
  return result.changes > 0;
}

/**
 * Retrieves counts grouped by type for filter badges.
 */
export async function getWalletTypeCounts(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ type: WalletItemType; count: number }>(
    'SELECT type, COUNT(*) as count FROM wallet_items GROUP BY type;'
  );

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.type] = r.count;
  }
  return counts;
}
