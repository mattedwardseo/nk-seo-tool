/**
 * Seed script for Phase 12: Domain-Centric Architecture
 * Creates sample domain records with settings for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding domains...');

  // Get test user (or create one)
  let testUser = await prisma.users.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!testUser) {
    console.log('Creating test user...');
    testUser = await prisma.users.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // "password123"
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`User: ${testUser.email}`);

  // Create sample domains
  const domains = [
    {
      id: 'domain-1',
      name: 'The Dental SEO Company',
      domain: 'fielderparkdental.com',
      business_name: 'Fielder Park Dental',
      city: 'Arlington',
      state: 'TX',
    },
    {
      id: 'domain-2',
      name: 'Main Street Dental Practice',
      domain: 'mainstreetdental.com',
      business_name: 'Main Street Dental',
      city: 'Dallas',
      state: 'TX',
    },
    {
      id: 'domain-3',
      name: 'Smile Bright Dentistry',
      domain: 'smilebright.com',
      business_name: 'Smile Bright Dentistry',
      city: 'Austin',
      state: 'TX',
    },
  ];

  for (const domainData of domains) {
    // Check if domain already exists
    const existing = await prisma.domains.findUnique({
      where: {
        user_id_domain: {
          user_id: testUser.id,
          domain: domainData.domain,
        },
      },
    });

    if (existing) {
      console.log(`Domain already exists: ${domainData.name}`);
      continue;
    }

    // Create domain
    const domain = await prisma.domains.create({
      data: {
        id: domainData.id,
        user_id: testUser.id,
        name: domainData.name,
        domain: domainData.domain,
        business_name: domainData.business_name,
        city: domainData.city,
        state: domainData.state,
        status: 'ACTIVE',
      },
    });

    console.log(`Created domain: ${domain.name} (${domain.domain})`);

    // Create domain settings with defaults
    await prisma.domain_settings.create({
      data: {
        domain_id: domain.id,
        // SEO Calculator defaults
        seo_default_ctr_scenario: 'average',
        seo_default_website_conv_rate: 0.15,
        seo_default_reception_rate: 0.66,
        seo_default_attendance_rate: 0.85,
        seo_default_referral_rate: 0.25,
        seo_default_marketing_invest: 5000,
        seo_default_stv: 1000,
        seo_default_ltv: 10000,
        seo_default_local_ctr: 0.35,
        // Google Ads Calculator defaults
        ads_default_daily_budget: 100,
        ads_default_avg_cpc: 5.0,
        ads_default_impression_share: 0.25,
        // Capacity Calculator defaults
        cap_default_operatories: 4,
        cap_default_days_open: 5,
        cap_default_hours_per_day: 8.0,
        cap_default_appt_duration: 60,
        // Site Audit defaults
        site_audit_max_pages: 100,
        site_audit_enable_javascript: true,
        // Local SEO defaults
        local_seo_grid_size: 7,
        local_seo_radius_miles: 5,
      },
    });

    console.log(`  Created settings for ${domain.name}`);

    // Create a sample SEO calculation
    await prisma.seo_calculations.create({
      data: {
        domain_id: domain.id,
        user_id: testUser.id,
        name: 'Initial Projection',
        keywords_snapshot: [
          { keyword: 'dentist arlington tx', searchVolume: 1200, cpc: 8.5, position: 5 },
          { keyword: 'dental implants arlington', searchVolume: 800, cpc: 12.0, position: 8 },
        ],
        combined_search_volume: 2000,
        ctr_scenario: 'average',
        ctr_percentage: 0.15,
        website_conv_rate: 0.15,
        reception_rate: 0.66,
        attendance_rate: 0.85,
        referral_rate: 0.25,
        marketing_investment: 5000,
        avg_short_term_value: 1000,
        avg_lifetime_value: 10000,
        // Calculated values
        organic_traffic: 300,
        local_traffic: 0,
        total_traffic: 300,
        prospects: 45,
        np_bookings: 29.7,
        actual_nps: 25.25,
        np_referrals: 6.31,
        adjusted_nps: 31.56,
        cost_per_acquisition: 158.43,
        short_term_return: 31560,
        short_term_roi: 6.31,
        lifetime_return: 315600,
        lifetime_roi: 63.12,
        notes: 'Initial calculation based on average case scenario',
      },
    });

    console.log(`  Created sample SEO calculation for ${domain.name}`);
  }

  console.log('\nDomain seeding complete!');
  console.log(`Created ${domains.length} domains with settings and SEO calculations`);
}

main()
  .catch((e) => {
    console.error('Error seeding domains:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
