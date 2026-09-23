import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  capNumber: integer("cap_number"),
  role: text("role", { enum: ["igrac", "trener"] }).notNull().default("igrac"),
  pinHash: text("pin_hash"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const trainings = sqliteTable("trainings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  durationMin: integer("duration_min").notNull().default(90),
  location: text("location").notNull().default("Bazen Beograd"),
  kind: text("kind", { enum: ["trening", "utakmica", "teretana"] })
    .notNull()
    .default("trening"),
  checkinOpensMin: integer("checkin_opens_min").notNull().default(60),
  checkinClosesMin: integer("checkin_closes_min").notNull().default(30),
  canceled: integer("canceled", { mode: "boolean" }).notNull().default(false),
});

export const participation = sqliteTable(
  "participation",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    trainingId: integer("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    rsvp: text("rsvp", { enum: ["dolazim", "ne_dolazim", "mozda"] }),
    rsvpAt: integer("rsvp_at", { mode: "timestamp" }),
    present: integer("present", { mode: "boolean" }),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
    markedBy: text("marked_by", { enum: ["igrac", "trener"] }),
  },
  (t) => ({
    parUnikatan: uniqueIndex("participation_training_player_idx").on(
      t.trainingId,
      t.playerId,
    ),
  }),
);

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  body: text("body").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  sentBy: integer("sent_by")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
});

export const notificationReads = sqliteTable(
  "notification_reads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    notificationId: integer("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    readAt: integer("read_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    parUnikatan: uniqueIndex("notification_reads_notification_player_idx").on(
      t.notificationId,
      t.playerId,
    ),
  }),
);

export type Player = typeof players.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Participation = typeof participation.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationRead = typeof notificationReads.$inferSelect;
