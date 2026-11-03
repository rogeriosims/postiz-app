'use client';

import { FC, useState, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';

import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { ModalWrapperComponent } from '@gitroom/frontend/components/new-launch/modal.wrapper.component';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const DripComponent: FC = () => {
  const [sequences, setSequences] = useState<any[]>([]);
  const fetch = useFetch();
  const router = useRouter();
  const { openModal, closeAll } = useModals();
  const t = useT();

  const loadSequences = async () => {
    try {
      const response = await fetch('/drip/sequences');
      if (response.ok) {
        const data = await response.json();
        setSequences(data);
      }
    } catch (err) {
      console.error('Failed to load sequences', err);
    }
  };

  useEffect(() => {
    loadSequences();
  }, []);

  const openCreateModal = () => {
    openModal({
      title: t('new_sequence', 'New Sequence'),
      classNames: { modal: 'text-textColor bg-newBgColorInner' },
      children: (
        <ModalWrapperComponent title={t('new_sequence', 'New Sequence')}>
          <CreateSequenceModal 
            onSuccess={(seq) => {
              closeAll();
              router.push(`/drip/${seq.id}`);
            }} 
          />
        </ModalWrapperComponent>
      )
    });
  };

  return (
    <div className="flex flex-col gap-[20px] p-[20px]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('drip_sequences', 'Drip Sequences')}</h1>
        <Button onClick={openCreateModal}>{t('create_sequence', 'Create Sequence')}</Button>
      </div>

      <div className="w-full overflow-x-auto bg-newBgColorInner rounded-[8px] p-[20px]">
        <table className="w-full text-left table-auto">
          <thead>
            <tr>
              <th className="p-[10px] border-b border-tableBorder">{t('name', 'Name')}</th>
              <th className="p-[10px] border-b border-tableBorder">{t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sequences.map(seq => (
              <tr key={seq.id}>
                <td className="p-[10px] border-b border-tableBorder font-medium">
                  {seq.name}
                </td>
                <td className="p-[10px] border-b border-tableBorder">
                  <Link href={`/drip/${seq.id}`}>
                    <Button secondary className="h-[30px] !text-sm">{t('edit', 'Edit')}</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {sequences.length === 0 && (
              <tr>
                <td colSpan={2} className="p-[20px] text-center text-textColor">
                  {t('no_sequences_found', 'No sequences found. Create one to get started.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CreateSequenceModal: FC<{ onSuccess: (seq: any) => void }> = ({ onSuccess }) => {
  const [newSequenceName, setNewSequenceName] = useState('');
  const fetch = useFetch();
  const t = useT();

  const createSequence = async () => {
    if (!newSequenceName.trim()) return;
    try {
      const response = await fetch('/drip/sequences', {
        method: 'POST',
        body: JSON.stringify({ name: newSequenceName })
      });
      if (response.ok) {
        const sequence = await response.json();
        onSuccess(sequence);
      }
    } catch (err) {
      console.error('Failed to create sequence', err);
    }
  };

  return (
    <div className="flex flex-col gap-[20px] min-w-[300px]">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t('sequence_name', 'Sequence Name')}</label>
        <input 
          className="bg-transparent border border-tableBorder rounded-[4px] px-[15px] py-[10px] w-full text-textColor focus:outline-none focus:border-btnPrimary"
          name="sequenceName"
          value={newSequenceName}
          onChange={e => setNewSequenceName(e.target.value)}
        />
      </div>
      <Button onClick={createSequence} className="w-full">
        {t('create', 'Create')}
      </Button>
    </div>
  );
};
