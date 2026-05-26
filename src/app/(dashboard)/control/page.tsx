import { MainLayout } from '@/components/layout/main-layout';
import ControlPage from '@/components/features/control/Control';

export default function AssetsControl() {
  return (
    <MainLayout title='Control' subtitle='Asset command & control operations'>
      <div className='-m-6'>
        <ControlPage />
      </div>
    </MainLayout>
  );
}
