'use client';

import MemberHeader from '../components/member-components/MemberHeader';
import MemberTable from '../components/member-components/MemberTable';

export default function Member() {
  return (
    <>
      <div className='mt-10'>
        <MemberHeader />
      </div>
      <main className='p-4'>
        <MemberTable />
      </main>
    </>
  );
}
