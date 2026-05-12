'use client';

import { UserPlus } from 'lucide-react';
import PageHeader from '../layout/PageHeader';

interface MemberHeaderProps {
  onSearch?: (query: string) => void;
}

const MemberHeader = ({ onSearch }: MemberHeaderProps) => (
  <PageHeader
    searchPlaceholder='Search operatives...'
    onSearch={onSearch}
    actionLabel='Invite Member'
    actionIcon={UserPlus}
  />
);

export default MemberHeader;
