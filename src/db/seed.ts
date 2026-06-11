import db from './index.js';
import { summaries } from './schema.js';

export async function runSeed() {
  await db.insert(summaries).values({
    idsummary:                   'd1923479-e084-4ade-b18c-0c2262b8fb6a',
    domain_name:                 'cybersonar.demo',
    risk_score:                  99,
    creation_date:               '2024-03-07 18:08:41',
    last_edit:                   '2024-03-08 14:09:44',
    summary_text:                'Il dominio "cybersonar.demo" attualmente presenta una situazione di sicurezza altamente critica, con un punteggio di rischio di 99 su 100.',
    summary_text_en:             'The domain "cybersonar.demo" currently has a highly critical security situation, with a risk score of 99 out of 100.',
    servizi_esposti_score:       99,
    dataleak_score:              100,
    rapporto_leak_email_score:   50,
    spoofing_score:              50,
    open_ports_score:            1,
    blacklist_score:             70,
    vulnerability_score_active:  54,
    vulnerability_score_passive: 99,
    certificate_score:           61,
    n_cert_attivi:               15,
    n_cert_scaduti:              18,
    n_asset:                     102,
    n_similar_domains:           13,
    unique_ipv4:                 30,
    unique_ipv6:                 23,
    n_port:         { "53": { n: 3 }, "80": { n: 68 }, "443": { n: 42 }, "6667": { n: 9 }, "6697": { n: 9 }, "8080": { n: 6 }, "8800": { n: 21 } },
    email_security: { spoofable: 'Spoofing possible.', dmarc_policy: 'quarantine', blacklist_detections: 0, blacklist_total_list: 60, blacklist_detected_list: [] },
    n_dataleak: {
      total:      { vip: 0, domain_stealer: 1, potential_stealer: 826, other_stealer: 11, general_leak: 0 },
      resolved:   { vip: 0, domain_stealer: 0, potential_stealer: 0,   other_stealer: 0,  general_leak: 0 },
      unresolved: { vip: 0, domain_stealer: 1, potential_stealer: 826, other_stealer: 11, general_leak: 0 },
      enumeration: 2,
    },
    n_vulns: {
      total:   { critical: 2, high: 18, medium: 52, low: 0, info: 90 },
      active:  { critical: 2, high: 0,  medium: 3,  low: 0, info: 90 },
      passive: { critical: 0, high: 18, medium: 49, low: 0, info: 0  },
    },
    waf: { count: 4, assets: ['128f92aa-85c1-486f-acbf-c1b43e8b33ba', 'ec87e3bd-3de2-477c-b52b-b93a70814ed0', 'b909c3b2-56e6-40e5-98c1-814fa0b85bb7', '175e40e8-33af-4db3-9617-a3be04103d6f'] },
    cdn: { count: 0, assets: [] },
  }).onConflictDoNothing();

  console.log('Seed completato');
}

// eseguito solo se chiamato direttamente: tsx src/db/seed.ts
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
