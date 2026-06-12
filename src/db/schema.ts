import { integer, pgTable, varchar, text, json, uuid, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().unique().notNull(),
  password: text().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const summaries = pgTable("summaries", {
  idsummary:                  varchar({ length: 255 }).primaryKey(),
  domain_name:                varchar({ length: 255 }).notNull(),
  risk_score:                 integer().notNull(),
  creation_date:              varchar({ length: 50 }).notNull(),
  last_edit:                  varchar({ length: 50 }).notNull(),
  summary_text:               text().notNull(),
  summary_text_en:            text().notNull(),
  servizi_esposti_score:      integer().notNull(),
  dataleak_score:             integer().notNull(),
  rapporto_leak_email_score:  integer().notNull(),
  spoofing_score:             integer().notNull(),
  open_ports_score:           integer().notNull(),
  blacklist_score:            integer().notNull(),
  vulnerability_score_active: integer().notNull(),
  vulnerability_score_passive:integer().notNull(),
  certificate_score:          integer().notNull(),
  n_cert_attivi:              integer().notNull(),
  n_cert_scaduti:             integer().notNull(),
  n_asset:                    integer().notNull(),
  n_similar_domains:          integer().notNull(),
  unique_ipv4:                integer().notNull(),
  unique_ipv6:                integer().notNull(),
  n_port:                     json().notNull(),
  email_security:             json().notNull(),
  n_dataleak:                 json().notNull(),
  n_vulns:                    json().notNull(),
  waf:                        json().notNull(),
  cdn:                        json().notNull(),
});
