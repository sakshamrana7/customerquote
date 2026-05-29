// Real TELUS SMB product data sourced from telus.com/en/business
// Last verified: May 2026

export const PRODUCTS = {
  internet: {
    id: 'internet',
    name: 'Business Internet',
    category: 'Internet',
    icon: '📡',
    description: 'TELUS PureFibre Internet with Business Wi-Fi',
    tiers: [
      {
        id: 'internet_1500',
        name: 'PureFibre 1.5G + Business Wi-Fi',
        speed: '1500 Mbps download / 940 Mbps upload',
        price: 120,
        term: 36,
        features: [
          '1500 Mbps download speed',
          '940 Mbps upload speed',
          'Business Wi-Fi access point included',
          'Wi-Fi 6 enabled',
          'Up to 4 separate networks',
        ],
        note: 'Available with TELUS Business Bundles on a 3-year term',
      },
    ],
    contractOptions: [
      { months: 36, label: '3-Year Term', discount: 0 },
    ],
  },

  mobility: {
    id: 'mobility',
    name: 'Business Mobility',
    category: 'Mobile',
    icon: '📱',
    description: 'TELUS 5G business plans for your team',
    tiers: [
      {
        id: 'mob_standard',
        name: 'Business 5G Standard',
        data: '100GB',
        coverage: 'Canada',
        price: 60,
        features: [
          '100GB at up to 250 Mbps',
          'Unlimited data at reduced speed',
          'Unlimited talk & text in Canada',
          'Easy Roam from $14–16/day',
          'TELUS Health Virtual Care included',
          'BYOD activations',
        ],
        note: 'Not eligible for TELUS multi-line discounts',
        multiLineDiscount: 0,
      },
      {
        id: 'mob_complete',
        name: 'Business 5G+ Complete',
        data: '100GB',
        coverage: 'Canada',
        price: 45,
        features: [
          '100GB at speeds up to 2 Gbps',
          'Unlimited data at reduced speed',
          'Unlimited talk & text in Canada',
          'Easy Roam from $5/day',
          'Small Business Cybersecurity included',
          'TELUS Online Security included',
          'TELUS Health Virtual Pharmacy included',
          '5-Year Rate Plan Price Lock',
        ],
        note: 'Includes $10 pre-authorized payment discount + $20 multi-line discount',
        multiLineDiscount: 20,
      },
      {
        id: 'mob_complete_canus',
        name: 'Business 5G+ Complete CAN-US',
        data: '200GB',
        coverage: 'Canada + US',
        price: 55,
        features: [
          '200GB at speeds up to 2 Gbps',
          'Unlimited talk & text in Canada and US',
          'Easy Roam from $5/day',
          'Exclusive TELUS Preventive Health Bundle',
          'Small Business Cybersecurity included',
          '5-Year Rate Plan Price Lock',
        ],
        note: 'Includes $10 pre-authorized payment discount + $20 multi-line discount',
        multiLineDiscount: 20,
      },
      {
        id: 'mob_unlimited',
        name: 'Business 5G+ Complete Unlimited',
        data: 'Unlimited',
        coverage: 'Canada',
        price: 85,
        features: [
          'Unlimited premium data at 5G+ speeds',
          'Unlimited talk & text in Canada',
          'Easy Roam from $5/day',
          'Small Business Cybersecurity included',
          'TELUS Health Virtual Pharmacy included',
          '5-Year Rate Plan Price Lock',
        ],
        note: 'Includes $10 pre-authorized payment discount + $20 multi-line discount',
        multiLineDiscount: 20,
      },
    ],
    lineOptions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },

  security: {
    id: 'security',
    name: 'Business Security',
    category: 'Security',
    icon: '🔒',
    description: 'TELUS Secure Business monitoring and protection',
    tiers: [
      {
        id: 'sec_camera',
        name: 'Smart Camera',
        price: 20,
        bundledPrice: 20,
        features: [
          'Video-only, self-monitored service',
          '24/7 video recording (SD Card or SVR required)',
          'Event-based recording',
          'People, Vehicle and Animal detection',
          'Indoor or outdoor camera choice',
        ],
        addons: [
          { name: 'Business Activity Analytics', price: 5 },
        ],
      },
      {
        id: 'sec_monitor',
        name: 'Monitor',
        price: 50,
        bundledPrice: 40,
        features: [
          'Intrusion detection with sensors',
          '24/7 Professional Monitoring',
          'Security Panel included',
          '1 motion sensor + 2 door/window sensors',
        ],
        addons: [
          { name: 'Guard Response', price: 12 },
        ],
      },
      {
        id: 'sec_protect',
        name: 'Protect',
        price: 60,
        bundledPrice: 50,
        features: [
          'Advanced security with professional monitoring',
          'Cameras and sensors included',
          '24/7 video recording',
          '24/7 Professional Monitoring',
          'Supports automation devices',
        ],
        addons: [
          { name: 'Business Activity Analytics', price: 5 },
          { name: 'Guard Response', price: 12 },
        ],
      },
    ],
  },
};

// Promotional rules - sourced from TELUS business website
export const PROMOS = {
  bundleDiscount: {
    id: 'bundle_discount',
    name: 'Business Bundle Discount',
    description: 'Save when you combine Internet + Mobility',
    condition: (cart) => cart.internet && cart.mobility,
    discount: 10, // $10/mo off internet when bundled with mobility
    label: 'Bundle Savings',
  },
  securityBundle: {
    id: 'security_bundle',
    name: 'Security Bundle Savings',
    description: 'Save $10/mo on security when bundled with TELUS Business services',
    condition: (cart) => cart.security && (cart.internet || cart.mobility),
    discountFn: (cart) => {
      // Security bundled pricing is already applied in bundledPrice
      // This surfaces the savings clearly
      if (!cart.security) return 0;
      const tier = PRODUCTS.security.tiers.find(t => t.id === cart.security.tierId);
      if (!tier) return 0;
      return tier.price - tier.bundledPrice;
    },
    label: 'Security Bundle Savings',
  },
  priorityQueue: {
    id: 'priority_queue',
    name: 'Priority Queue + Dedicated Success Manager',
    description: 'Get premium support with Priority Queue when you bundle 3 or more TELUS Business products',
    condition: (cart) => {
      const count = [cart.internet, cart.mobility, cart.security].filter(Boolean).length;
      return count >= 2;
    },
    discount: 0,
    label: 'Priority Support Included',
    isPerk: true,
  },
};
