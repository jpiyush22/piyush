export type SectionId = 'overview' | 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8' | 's9';

export interface SectionMeta {
  id: SectionId;
  num: string;
  title: string;
  /** One-line preview shown in the inbox-style navigation. */
  preview: string;
  icon: string;
  color: string;
  tag?: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: 'overview', num: '★', title: 'Overview', preview: 'The answer in one screen: the leak, the system, the tool', icon: 'home', color: '#0d1230' },
  { id: 's1', num: '1', title: 'Read the funnel', preview: 'SSF adoption 41.0% vs Sales-led 55.1%', icon: 'funnel', color: '#3b5bfd' },
  { id: 's2', num: '2', title: 'Dig into the leak', preview: 'Account A events, detection at scale, schema gaps', icon: 'search', color: '#4f55f5' },
  { id: 's3', num: '3', title: 'Your first week', preview: 'Lead quality vs the adoption leak', icon: 'flag', color: '#6350f7' },
  { id: 's4', num: '4', title: 'Design the system', preview: 'Early-warning system: flows, timing, last mile', icon: 'layers', color: '#7651fa' },
  { id: 's5', num: '5', title: 'The data model', preview: 'Beauty Lounge, verified Companies, safe rollout', icon: 'db', color: '#8a55fc' },
  { id: 's6', num: '6', title: 'When it breaks', preview: 'workflow_edited semantic drift', icon: 'bolt', color: '#9b58fe', tag: 'optional' },
  { id: 's7', num: '7', title: 'Build the tool', preview: 'Signal Desk: a live, clickable prototype', icon: 'desk', color: '#a35bff' },
  { id: 's8', num: '8', title: 'Show your working', preview: 'Video walkthrough', icon: 'video', color: '#c05bd8' },
  { id: 's9', num: '9', title: 'Feedback', preview: 'Candid notes on the challenge', icon: 'chat', color: '#d0609c', tag: 'not graded' },
];
