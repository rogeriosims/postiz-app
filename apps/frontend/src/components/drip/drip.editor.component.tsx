'use client';

import { FC, useState, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { Input } from '@gitroom/react/form/input';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';

import { useT } from '@gitroom/react/translation/get.transation.service.client';
import Link from 'next/link';

interface DripEditorProps {
  id: string;
}

interface DripItem {
  id?: string;
  day: number;
  message: string;
  mediaUrl?: string;
  hasSpoiler?: boolean;
  protectContent?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  isDeleted?: boolean;
}

const QUICK_MILESTONES = [
  { day: 0, label: '⚡ D0 (Imediato)' },
  { day: 1, label: 'D+1' },
  { day: 2, label: 'D+2' },
  { day: 3, label: 'D+3' },
  { day: 7, label: 'D+7 (1ª Sem)' },
  { day: 14, label: 'D+14' },
  { day: 21, label: 'D+21' },
  { day: 28, label: 'D+28 (Renovação)' },
  { day: 30, label: 'D+30' },
];

export const DripEditorComponent: FC<DripEditorProps> = ({ id }) => {
  const [items, setItems] = useState<DripItem[]>([]);
  const [sequence, setSequence] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [newSubscriber, setNewSubscriber] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'subscribers'>('editor');

  const fetch = useFetch();
  const t = useT();

  useEffect(() => {
    if (id) {
      loadSequence();
      loadSubscribers();
    }
  }, [id]);

  const loadSequence = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/drip/sequences/${id}`);
      if (response.ok) {
        const seq = await response.json();
        setSequence(seq);

        if (seq.items && Array.isArray(seq.items)) {
          setItems(
            seq.items.map((item: any) => ({
              id: item.id,
              day: item.day,
              message: item.content || item.message || '',
              mediaUrl: item.media || item.mediaUrl || '',
              hasSpoiler: item.hasSpoiler ?? false,
              protectContent: item.protectContent ?? true,
              buttonText: item.buttonText || '',
              buttonUrl: item.buttonUrl || '',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load sequence', err);
    }
  };

  const loadSubscribers = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/drip/subscribers?sequenceId=${id}`);
      if (response && response.ok) {
        const subs = await response.json();
        setSubscribers(Array.isArray(subs) ? subs : []);
      }
    } catch (err) {
      console.error('Failed to load subscribers', err);
    }
  };

  const addItem = () => {
    const existingDays = items.map((i) => i.day);
    const milestones = [0, 1, 2, 3, 5, 7, 10, 14, 21, 28, 30];
    let nextDay = 0;
    if (items.length > 0) {
      const maxCurrent = Math.max(...existingDays);
      const found = milestones.find((m) => m > maxCurrent);
      nextDay = found !== undefined ? found : maxCurrent + 1;
    }

    setItems([
      ...items,
      {
        day: nextDay,
        message: '',
        hasSpoiler: false,
        protectContent: true,
        buttonText: '',
        buttonUrl: '',
      },
    ]);
  };

  const updateItem = (index: number, field: keyof DripItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const target = items[index];
    const dayLabel = target.day === 0 ? 'D0 (Imediato)' : `Dia ${target.day}`;
    if (!confirm(`Deseja realmente remover o disparo do ${dayLabel}?`)) {
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const saveSequence = async () => {
    if (!id) return;
    try {
      const currentRes = await fetch(`/drip/sequences/${id}/items`).catch(() => null);
      let currentItems: any[] = [];
      if (currentRes && currentRes.ok) {
        currentItems = await currentRes.json();
      }

      const currentIds = currentItems.map((i: any) => i.id).filter(Boolean);
      const activeIds = items.map((i) => i.id).filter(Boolean);
      const toDelete = currentIds.filter((cid: string) => !activeIds.includes(cid));

      for (const delId of toDelete) {
        await fetch(`/drip/sequences/${id}/items/${delId}`, { method: 'DELETE' });
      }

      for (const item of items) {
        await fetch(`/drip/sequences/${id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            day: item.day,
            content: item.message,
            media: item.mediaUrl || undefined,
            hasSpoiler: !!item.hasSpoiler,
            protectContent: item.protectContent !== undefined ? !!item.protectContent : true,
            buttonText: item.buttonText || undefined,
            buttonUrl: item.buttonUrl || undefined,
          })
        });
      }
      alert(t('saved_successfully', 'Campanha salva com sucesso!'));
      loadSequence();
    } catch (err) {
      console.error('Failed to save sequence', err);
    }
  };

  const enrollSubscriber = async () => {
    if (!newSubscriber.trim() || !id) return;
    try {
      const response = await fetch(`/drip/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequenceId: id, chatId: newSubscriber.trim() })
      });
      if (response.ok) {
        setNewSubscriber('');
        loadSubscribers();
      }
    } catch (err) {
      console.error('Failed to enroll subscriber', err);
    }
  };

  if (!sequence) {
    return (
      <div className="p-[30px] flex items-center justify-center text-textColor/70">
        <span className="animate-pulse">Carregando campanha de Drip...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px] p-[20px]">
      {/* Header com Navegação e Tabs */}
      <div className="flex justify-between items-center mb-[10px] flex-wrap gap-[15px]">
        <div className="flex items-center gap-[15px]">
          <Link
            href="/drip"
            className="text-textColor/70 hover:text-white flex items-center gap-[6px] text-sm font-medium transition-colors"
          >
            &larr; {t('back_to_campaigns', 'Voltar para Campanhas')}
          </Link>
          <div className="w-[1px] h-[20px] bg-tableBorder" />
          <h1 className="text-2xl font-bold text-white">{sequence.name}</h1>
          <span className="bg-white/5 border border-tableBorder text-xs px-[8px] py-[2px] rounded-full text-textColor/70">
            {items.length} {items.length === 1 ? 'disparo' : 'disparos'}
          </span>
        </div>

        <div className="flex bg-newBgColorInner rounded-[8px] p-[4px] border border-tableBorder">
          <button
            className={`px-[16px] py-[8px] rounded-[6px] text-sm font-semibold transition-all ${activeTab === 'editor' ? 'bg-btnPrimary text-white shadow-sm' : 'text-textColor/70 hover:text-white'}`}
            onClick={() => setActiveTab('editor')}
          >
            {t('editor_tab', 'Régua de Disparos')}
          </button>
          <button
            className={`px-[16px] py-[8px] rounded-[6px] text-sm font-semibold transition-all ${activeTab === 'subscribers' ? 'bg-btnPrimary text-white shadow-sm' : 'text-textColor/70 hover:text-white'}`}
            onClick={() => setActiveTab('subscribers')}
          >
            {t('subscribers_tab', 'Assinantes Inscritos')} ({subscribers.length})
          </button>
        </div>
      </div>

      {/* ABA 1: RÉGUA DE DISPAROS */}
      {activeTab === 'editor' && (
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[20px]">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-newBgColorInner border border-tableBorder p-[22px] rounded-[12px] flex flex-col gap-[18px] relative group hover:border-tableBorder/80 transition-colors shadow-sm"
              >
                {/* Cabeçalho do Card: Seletor Inteligente de Dias + Botão Excluir */}
                <div className="flex flex-col gap-[10px]">
                  <div className="flex justify-between items-center gap-[10px]">
                    <div className="flex items-center gap-[8px]">
                      <span className="w-[24px] h-[24px] rounded-full bg-btnPrimary/20 text-btnPrimary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-textColor/60 uppercase tracking-wider">
                        Passo {index + 1} da Esteira
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-[10px] py-[5px] rounded-[6px] transition-colors flex items-center gap-[4px]"
                    >
                      <span>🗑️</span> {t('delete_step', 'Excluir disparo')}
                    </button>
                  </div>

                  {/* Barra Interativa de Dias "À prova de idiotas" */}
                  <div className="flex flex-wrap items-center justify-between gap-[12px] bg-newBgColor p-[14px] rounded-[8px] border border-tableBorder">
                    <div className="flex items-center gap-[12px] flex-wrap">
                      <div className="flex items-center gap-[6px]">
                        <span className="text-sm font-semibold text-white">
                          {t('send_at_day', 'Momento do Envio:')}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItem(index, 'day', Math.max(0, item.day - 1))}
                          className="w-[30px] h-[30px] rounded-[6px] bg-newBgColorInner border border-tableBorder text-textColor hover:bg-white/10 flex items-center justify-center font-bold text-base transition-colors"
                          title="Diminuir 1 dia"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={item.day}
                          onChange={(e) => updateItem(index, 'day', Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-newBgColorInner border border-tableBorder rounded-[6px] px-[8px] py-[4px] w-[58px] text-center font-bold text-white focus:outline-none focus:border-btnPrimary"
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(index, 'day', item.day + 1)}
                          className="w-[30px] h-[30px] rounded-[6px] bg-newBgColorInner border border-tableBorder text-textColor hover:bg-white/10 flex items-center justify-center font-bold text-base transition-colors"
                          title="Aumentar 1 dia"
                        >
                          +
                        </button>
                      </div>

                      {/* Badge Visual Explicativo */}
                      {item.day === 0 ? (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-[10px] py-[4px] rounded-full flex items-center gap-[5px]">
                          <span>⚡</span> {t('immediate_on_subscription', 'Disparo Imediato (ao assinar)')}
                        </span>
                      ) : item.day === 1 ? (
                        <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-semibold px-[10px] py-[4px] rounded-full flex items-center gap-[5px]">
                          <span>⏱️</span> 1 dia após assinatura (+24h)
                        </span>
                      ) : item.day === 28 ? (
                        <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-semibold px-[10px] py-[4px] rounded-full flex items-center gap-[5px]">
                          <span>💎</span> Teaser de Renovação VIP (D+28)
                        </span>
                      ) : (
                        <span className="bg-white/5 text-textColor/90 border border-tableBorder text-xs font-medium px-[10px] py-[4px] rounded-full flex items-center gap-[5px]">
                          <span>📅</span> {item.day} dias após assinatura (+{item.day * 24}h)
                        </span>
                      )}
                    </div>

                    {/* Chips de Atalhos Rápidos */}
                    <div className="flex flex-wrap items-center gap-[5px]">
                      <span className="text-xs text-textItemBlur mr-[2px]">
                        {t('quick_shortcuts', 'Atalhos:')}
                      </span>
                      {QUICK_MILESTONES.map((qd) => (
                        <button
                          key={qd.day}
                          type="button"
                          onClick={() => updateItem(index, 'day', qd.day)}
                          className={`px-[8px] py-[3px] rounded-[5px] text-xs font-medium transition-all ${
                            item.day === qd.day
                              ? 'bg-btnPrimary text-white shadow-sm font-bold'
                              : 'bg-newBgColorInner text-textColor/70 hover:text-white hover:bg-white/10 border border-tableBorder'
                          }`}
                        >
                          {qd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Textarea da Mensagem */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Mensagem do Telegram</span>
                    <span className="text-xs font-normal text-textItemBlur">
                      Suporta HTML: &lt;b&gt;, &lt;i&gt;, &lt;tg-spoiler&gt;, links
                    </span>
                  </label>
                  <textarea
                    value={item.message}
                    onChange={(e) => updateItem(index, 'message', e.target.value)}
                    placeholder={t('message_placeholder', 'Digite a mensagem do Telegram (ex: Oi amor, preparei esse mimo exclusivo para você hoje...)...')}
                    className="bg-newBgColor border border-tableBorder rounded-[6px] px-[15px] py-[12px] min-h-[110px] w-full text-white placeholder-textItemBlur focus:outline-none focus:border-btnPrimary resize-y font-normal"
                  />
                </div>

                {/* Mídia com Integração Nativa à Biblioteca do Postiz */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-white">
                    Mídia Anexa (Foto ou Vídeo)
                  </label>

                  {item.mediaUrl ? (
                    <div className="flex items-start gap-[15px] p-[12px] bg-newBgColor border border-tableBorder rounded-[8px]">
                      <div className="w-[110px] h-[90px] rounded-[6px] overflow-hidden bg-black/40 border border-tableBorder flex items-center justify-center shrink-0">
                        {item.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={item.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.mediaUrl} alt="Mídia" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between h-[90px]">
                        <div className="truncate text-xs text-textColor/80 font-mono">
                          {item.mediaUrl}
                        </div>
                        <div className="flex gap-[8px]">
                          <Button
                            secondary
                            className="!text-xs !py-[4px] !px-[10px]"
                            onClick={() => showMediaBox((m) => updateItem(index, 'mediaUrl', m.path))}
                          >
                            <span>🖼️</span> {t('change_media', 'Trocar Mídia')}
                          </Button>
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'mediaUrl', '')}
                            className="text-xs text-red-400 hover:text-red-300 px-[8px] py-[4px] rounded-[4px] hover:bg-red-500/10 transition-colors"
                          >
                            {t('remove_media', 'Remover')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-[10px] items-stretch sm:items-center p-[12px] bg-newBgColor border border-dashed border-tableBorder rounded-[8px]">
                      <Button
                        secondary
                        onClick={() => showMediaBox((m) => updateItem(index, 'mediaUrl', m.path))}
                        className="!text-sm flex items-center justify-center gap-[6px] shrink-0"
                      >
                        <span>🖼️</span> {t('select_from_library', 'Escolher da Biblioteca de Mídia')}
                      </Button>
                      <span className="text-xs text-textItemBlur hidden sm:inline">
                        {t('or_paste_url', 'ou link externo:')}
                      </span>
                      <input
                        className="bg-newBgColorInner border border-tableBorder rounded-[6px] px-[12px] py-[7px] text-xs flex-1 text-white focus:outline-none focus:border-btnPrimary"
                        value={item.mediaUrl || ''}
                        onChange={(e) => updateItem(index, 'mediaUrl', e.target.value)}
                        placeholder="https://... (ou cole o link da foto/vídeo)"
                      />
                    </div>
                  )}
                </div>

                {/* Opções de Proteção e Spoiler */}
                <div className="flex flex-wrap gap-[25px] items-center pt-[5px] border-t border-tableBorder/50">
                  <Checkbox
                    disableForm={true}
                    variant="hollow"
                    label={t('drip_protect_content', 'Proteger Conteúdo (anti-cópia, anti-print e sem encaminhamento)')}
                    checked={item.protectContent !== false}
                    onChange={(e) => updateItem(index, 'protectContent', e.target.value)}
                  />
                  <Checkbox
                    disableForm={true}
                    variant="hollow"
                    label={t('drip_has_spoiler', 'Efeito Spoiler (desfoque / blur na foto ou vídeo)')}
                    checked={!!item.hasSpoiler}
                    onChange={(e) => updateItem(index, 'hasSpoiler', e.target.value)}
                  />
                </div>

                {/* Botão Inline de Call-To-Action */}
                <div className="flex flex-col md:flex-row gap-[12px] items-center bg-newBgColor/50 p-[12px] rounded-[8px] border border-tableBorder/60">
                  <div className="flex-1 w-full">
                    <Input
                      disableForm={true}
                      name={`btn-text-${index}`}
                      label={t('drip_button_text', 'Texto do Botão Inline (Opcional)')}
                      placeholder={t('drip_button_text_placeholder', 'Ex: 💎 Acesso VIP / Renovar Pix')}
                      value={item.buttonText || ''}
                      onChange={(e) => updateItem(index, 'buttonText', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <Input
                      disableForm={true}
                      name={`btn-url-${index}`}
                      label={t('drip_button_url', 'URL do Botão (Opcional)')}
                      placeholder="https://t.me/seubot?start=renovar"
                      value={item.buttonUrl || ''}
                      onChange={(e) => updateItem(index, 'buttonUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Ações: Adicionar Dia e Salvar */}
          <div className="flex justify-between items-center pt-[10px] mt-[10px] flex-wrap gap-[15px]">
            <Button secondary onClick={addItem} className="flex items-center gap-[6px]">
              <span>+</span> {t('add_day', '+ Adicionar Dia na Régua')}
            </Button>
            <Button onClick={saveSequence} className="font-bold">
              💾 {t('save_sequence', 'Salvar Campanha Drip')}
            </Button>
          </div>
        </div>
      )}

      {/* ABA 2: ASSINANTES & AUDITORIA DE ENTREGAS */}
      {activeTab === 'subscribers' && (
        <div className="flex flex-col gap-[20px]">
          {/* Card de Inscrição Manual */}
          <div className="bg-newBgColorInner border border-tableBorder p-[20px] rounded-[10px] flex flex-col gap-[15px]">
            <h2 className="text-lg font-bold text-white">
              {t('enroll_subscriber', 'Inscrever Assinante na Régua')}
            </h2>
            <div className="flex gap-[12px] items-end flex-wrap sm:flex-nowrap">
              <div className="flex-1 w-full">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-textColor/90">
                    {t('subscriber_chat_id', 'Chat ID do Telegram (ou identificador)')}
                  </label>
                  <input
                    className="bg-newBgColor border border-tableBorder rounded-[6px] px-[15px] py-[10px] w-full text-white placeholder-textItemBlur focus:outline-none focus:border-btnPrimary font-mono text-sm"
                    name="subscriber"
                    value={newSubscriber}
                    onChange={(e) => setNewSubscriber(e.target.value)}
                    placeholder="Ex: 123456789"
                  />
                </div>
              </div>
              <Button onClick={enrollSubscriber} className="shrink-0 h-[42px]">
                {t('enroll_now', 'Inscrever Assinante')}
              </Button>
            </div>
          </div>

          {/* Tabela de Assinantes */}
          <div className="w-full overflow-x-auto bg-newBgColorInner border border-tableBorder rounded-[10px] p-[20px]">
            <div className="flex justify-between items-center mb-[15px]">
              <h2 className="text-lg font-bold text-white">
                {t('enrolled_subscribers_title', 'Assinantes Ativos nesta Campanha')}
              </h2>
              <span className="text-xs text-textColor/60">
                Total: {subscribers.length}
              </span>
            </div>
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm font-semibold">
                    {t('identifier_col', 'Identificador (Chat ID)')}
                  </th>
                  <th className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm font-semibold">
                    {t('enrolled_at_col', 'Data de Inscrição')}
                  </th>
                  <th className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm font-semibold">
                    {t('status_col', 'Status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub: any, idx: number) => (
                  <tr key={sub.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-[12px] border-b border-tableBorder font-medium">
                      <div className="flex flex-col">
                        <span className="font-mono text-white text-sm">
                          {sub.chatId || sub.email || sub.identifier || 'Desconhecido'}
                        </span>
                        {sub.deliveries && sub.deliveries.length > 0 && (
                          <div className="mt-2 text-xs text-textColor/70 bg-newBgColor p-[8px] rounded-[6px] border border-tableBorder">
                            <strong className="text-textColor/90">{t('deliveries_trail', 'Disparos Realizados:')}</strong>
                            <ul className="list-disc ml-4 mt-1 space-y-1">
                              {sub.deliveries.map((del: any, i: number) => (
                                <li key={del.id || i}>
                                  Dia {del.item?.day ?? del.day ?? 'N/A'} — Status:{' '}
                                  <span className={del.status === 'SENT' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                                    {del.status}
                                  </span>{' '}
                                  em {new Date(del.deliveredAt || del.createdAt).toLocaleString()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-[12px] border-b border-tableBorder text-textColor/80 text-sm align-top">
                      {sub.enrolledAt
                        ? new Date(sub.enrolledAt).toLocaleString()
                        : (sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A')}
                    </td>
                    <td className="p-[12px] border-b border-tableBorder align-top">
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-[10px] py-[3px] rounded-full text-xs font-semibold">
                        {t('active_status', 'Ativo')}
                      </span>
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-[30px] text-center text-textColor/60 text-sm">
                      {t('no_subscribers_enrolled', 'Nenhum assinante inscrito nesta campanha ainda.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
