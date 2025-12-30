import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const domains = await prisma.domains.findMany({
    include: {
      domain_settings: true,
      seo_calculations: true,
      audits: true,
      site_audit_scans: true,
      local_campaigns: true,
      tracked_keywords: true,
    },
  });

  console.log(`\nTotal domains: ${domains.length}\n`);

  for (const domain of domains) {
    console.log(`${domain.name}`);
    console.log(`   Domain: ${domain.domain}`);
    console.log(`   Business: ${domain.business_name || 'N/A'}`);
    console.log(`   Location: ${domain.city}, ${domain.state}`);
    console.log(`   Status: ${domain.status}`);
    console.log(`   Settings: ${domain.domain_settings ? 'Yes' : 'No'}`);
    console.log(`   SEO Calculations: ${domain.seo_calculations.length}`);
    console.log(`   Audits: ${domain.audits.length}`);
    console.log(`   Site Scans: ${domain.site_audit_scans.length}`);
    console.log(`   Local Campaigns: ${domain.local_campaigns.length}`);
    console.log(`   Tracked Keywords: ${domain.tracked_keywords.length}`);
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
