import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite — the source of truth for everything the UI renders.
 *
 * Three rules this schema exists to enforce:
 *
 *  1. Ids are generated on the device, before anything touches the network, so an
 *     offline record has a stable identity from the moment it is saved.
 *  2. Nothing is ever hard-deleted. `deletedAt` only.
 *  3. Every write also appends to `outbox`, in the same transaction as the write
 *     itself. If the row exists locally, its sync is already guaranteed.
 *
 * Timestamps are ISO-8601 UTC strings rather than epoch integers: they sort
 * correctly as text, survive the JSON round-trip to Postgres unchanged, and are
 * legible when you are staring at a raw row trying to work out what happened.
 */

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  businessType: text('business_type', {
    enum: ['clothing', 'salon', 'property', 'other'],
  }).notNull().default('other'),
  locale: text('locale').notNull().default('en'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** The signed-in staff member. Mirrors `members` on the server. */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  phoneE164: text('phone_e164'),
  role: text('role', { enum: ['owner', 'staff'] }).notNull().default('staff'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    name: text('name').notNull(),
    /** Always normalised. This column, scoped by business, IS the customer's identity. */
    phone: text('phone').notNull(),
    city: text('city'),
    notes: text('notes'),
    createdBy: text('created_by'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
    deletedAt: text('deleted_at'),

    /** Denormalised haystack: name, phone, city, interest labels, location labels.
     *  Kept fresh on write so search is one indexed scan instead of five joins. */
    searchBlob: text('search_blob').notNull().default(''),
    /** 1 until the server has confirmed this row. Drives the pending count in the badge. */
    dirty: integer('dirty').notNull().default(1),
  },
  (t) => [
    // The backbone of the product, enforced locally too — not just on the server.
    // Partial, so a soft-deleted row does not hold a phone number hostage.
    uniqueIndex('customers_biz_phone_uq')
      .on(t.businessId, t.phone)
      .where(sql`${t.deletedAt} is null`),
    index('customers_biz_seen_idx').on(t.businessId, t.lastSeenAt),
    index('customers_dirty_idx').on(t.dirty),
  ]
);

export const interests = sqliteTable(
  'interests',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    archived: integer('archived').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    dirty: integer('dirty').notNull().default(1),
  },
  (t) => [index('interests_biz_idx').on(t.businessId, t.archived, t.sortOrder)]
);

export const locations = sqliteTable(
  'locations',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    label: text('label').notNull(),
    archived: integer('archived').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    dirty: integer('dirty').notNull().default(1),
  },
  (t) => [index('locations_biz_idx').on(t.businessId, t.archived)]
);

/**
 * Append-only. A visit is a fact that happened at a moment; it is never edited and
 * never conflicts, which is what lets two offline staff merge without a fight.
 */
export const visits = sqliteTable(
  'visits',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    customerId: text('customer_id').notNull(),
    locationId: text('location_id'),
    /** Display snapshot, so renaming a location never rewrites history. */
    locationLabel: text('location_label').notNull().default(''),
    note: text('note'),
    visitedAt: text('visited_at').notNull(),
    createdBy: text('created_by'),
    createdAt: text('created_at').notNull(),
    dirty: integer('dirty').notNull().default(1),
  },
  (t) => [
    index('visits_customer_idx').on(t.customerId, t.visitedAt),
    index('visits_biz_time_idx').on(t.businessId, t.visitedAt),
    index('visits_dirty_idx').on(t.dirty),
  ]
);

export const customerInterests = sqliteTable(
  'customer_interests',
  {
    customerId: text('customer_id').notNull(),
    interestId: text('interest_id').notNull(),
    businessId: text('business_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.interestId] })]
);

export const visitInterests = sqliteTable(
  'visit_interests',
  {
    visitId: text('visit_id').notNull(),
    interestId: text('interest_id').notNull(),
    businessId: text('business_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.visitId, t.interestId] })]
);

/**
 * The outbox. Every local write appends one row here inside the same transaction as
 * the write, so a saved record can never be a record that will not sync.
 *
 * `attempts` and `nextAttemptAt` implement the backoff; `lastError` is what you read
 * when a row refuses to drain and you need to know why.
 */
export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    entity: text('entity', {
      enum: ['customer', 'visit', 'interest', 'location', 'customer_interest', 'visit_interest'],
    }).notNull(),
    entityId: text('entity_id').notNull(),
    op: text('op', { enum: ['insert', 'update', 'delete'] }).notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: text('next_attempt_at').notNull(),
    lastError: text('last_error'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('outbox_ready_idx').on(t.nextAttemptAt, t.createdAt)]
);

/** Pull cursors and other sync bookkeeping. One row per key. */
export const syncMeta = sqliteTable('sync_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/**
 * Records a customer id that lost a server-side merge. When two staff add the same
 * phone number offline they generate two ids; the server picks a winner and this maps
 * the loser to it, so every device converges on one customer instead of quietly
 * keeping a duplicate.
 */
export const idMerges = sqliteTable('id_merges', {
  losingId: text('losing_id').primaryKey(),
  winningId: text('winning_id').notNull(),
  entity: text('entity').notNull(),
  createdAt: text('created_at').notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
