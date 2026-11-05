import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { DripEditorComponent } from '@gitroom/frontend/components/drip/drip.editor.component';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Drip Content Editor`,
  description: '',
};

export default async function Page({ params }: { params: { id: string } }) {
  return <DripEditorComponent id={params.id} />
}
