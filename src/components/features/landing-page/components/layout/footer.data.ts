/** Footer link columns and brand copy. */

export const footerBrand = {
  tagline: ['Intelligence, Surveillance & Reconnaissance.', 'Always watching. Always ahead.'],
} as const;

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export const footerColumns: FooterColumn[] = [
  {
    heading: 'Capabilities',
    links: [
      { label: 'ROW Pipeline & Powerline Patrols', href: '#' },
      { label: 'AI Threat & Encroachment Detection', href: '#' },
      { label: 'Gas-Leak & Hydrocarbon Sensing', href: '#' },
      { label: 'Thermal Anomaly Mapping', href: '#' },
      { label: 'Perimeter & Compound Surveillance', href: '#' },
      { label: 'Maritime & Coastal ISR', href: '#' },
      { label: 'Border & Boundary Monitoring', href: '#' },
      { label: 'Multi-Drone Command & Control', href: '#' },
    ],
  },
  {
    heading: 'Industries',
    links: [
      { label: 'Oil & Gas', href: '#' },
      { label: 'Defence & Security', href: '#' },
      { label: 'Power Sector', href: '#' },
      { label: 'Telecom Carriers', href: '#' },
      { label: 'Ports & Coastal Authorities', href: '#' },
      { label: 'Critical Infrastructure', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Platform Overview', href: '#' },
      { label: 'Mission Reporting', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Request a Demo', href: '#' },
      { label: 'Contact Sales', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
];

export const copyright = '© 2026 Loctiva — All rights reserved.';
