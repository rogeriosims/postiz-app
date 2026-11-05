import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { DripComponent } from '@gitroom/frontend/components/drip/drip.component';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Drip Content`,
  description: '',
};

export default async function Page() {
  return <DripComponent />
}
