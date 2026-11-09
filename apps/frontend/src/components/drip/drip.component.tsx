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
      <div className="flex justify-between items-start flex-wrap gap-[15px]">
        <div>
          <h1 className="text-2xl font-bold">{t('drip_sequences', 'Campanhas Drip Content')}</h1>
          <p className="text-sm text-textColor/70 mt-[4px]">
            {t('drip_sequences_description', 'Automatize a entrega progressiva de conteúdos exclusivos, brindes e ofertas de renovação ao longo dos dias de assinatura no Telegram.')}
          </p>
        </div>
        <Button onClick={openCreateModal}>{t('create_sequence', '+ Nova Campanha')}</Button>
      </div>

      <div className="w-full overflow-x-auto bg-newBgColorInner rounded-[8px] p-[20px]">
        <table className="w-full text-left table-auto">
          <thead>
            <tr>
              <th className="p-[12px] border-b border-tableBorder">{t('name', 'Nome da Campanha')}</th>
              <th className="p-[12px] border-b border-tableBorder">{t('steps_count', 'Disparos')}</th>
              <th className="p-[12px] border-b border-tableBorder">{t('active_subscribers', 'Assinantes')}</th>
              <th className="p-[12px] border-b border-tableBorder text-right">{t('actions', 'Ações')}</th>
            </tr>
          </thead>
          <tbody>
            {sequences.map(seq => (
              <tr key={seq.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-[12px] border-b border-tableBorder font-semibold text-white">
                  {seq.name}
                </td>
                <td className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm">
                  <span className="bg-white/5 border border-tableBorder px-[8px] py-[3px] rounded-full text-xs font-medium">
                    {seq.items?.length || 0} {t('steps_count', 'Disparos')}
                  </span>
                </td>
                <td className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-[8px] py-[3px] rounded-full text-xs font-medium">
                    {seq.subscribers?.length || 0} {t('active_subscribers', 'Assinantes')}
                  </span>
                </td>
                <td className="p-[12px] border-b border-tableBorder text-right">
                  <Link href={`/drip/${seq.id}`}>
                    <Button secondary className="h-[32px] !text-xs">{t('configure_sequence', 'Gerenciar Régua')}</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {sequences.length === 0 && (
              <tr>
                <td colSpan={4} className="p-[30px] text-center text-textColor/70">
                  {t('no_sequences_found', 'Nenhuma campanha de Drip encontrada. Crie sua primeira esteira para fidelizar assinantes!')}
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
        <label className="text-sm font-medium">{t('sequence_name', 'Nome da Campanha')}</label>
        <input
          className="bg-transparent border border-tableBorder rounded-[4px] px-[15px] py-[10px] w-full text-textColor focus:outline-none focus:border-btnPrimary"
          name="sequenceName"
          placeholder="Ex: Esteira VIP Natasha - Boas-vindas & Retenção"
          value={newSequenceName}
          onChange={e => setNewSequenceName(e.target.value)}
        />
      </div>
      <Button onClick={createSequence} className="w-full">
        {t('create', 'Criar Campanha')}
      </Button>
    </div>
  );
};
