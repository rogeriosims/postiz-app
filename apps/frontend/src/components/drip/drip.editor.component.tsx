'use client';

import { FC, useState, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { Input } from '@gitroom/react/form/input';

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
    const maxDay = items.reduce((max, item) => Math.max(max, item.day), 0);
    setItems([
      ...items,
      {
        day: maxDay + 1,
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
      alert(t('saved_successfully', 'Saved successfully'));
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

  if (!sequence) return <div className="p-[20px]">Loading...</div>;

  return (
    <div className="flex flex-col gap-[20px] p-[20px]">
      <div className="flex justify-between items-center mb-[20px]">
        <div className="flex items-center gap-[15px]">
          <Link href="/drip" className="text-textColor hover:text-white">&larr; {t('back', 'Back')}</Link>
          <h1 className="text-2xl font-bold">{sequence.name}</h1>
        </div>
        
        <div className="flex bg-newBgColorInner rounded-[8px] p-[4px]">
          <button 
            className={`px-[16px] py-[8px] rounded-[6px] transition-all ${activeTab === 'editor' ? 'bg-btnPrimary text-white' : 'text-textColor hover:text-white'}`}
            onClick={() => setActiveTab('editor')}
          >
            {t('editor', 'Editor')}
          </button>
          <button 
            className={`px-[16px] py-[8px] rounded-[6px] transition-all ${activeTab === 'subscribers' ? 'bg-btnPrimary text-white' : 'text-textColor hover:text-white'}`}
            onClick={() => setActiveTab('subscribers')}
          >
            {t('subscribers', 'Subscribers')}
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[20px]">
            {items.map((item, index) => (
              <div key={index} className="bg-newBgColorInner p-[20px] rounded-[8px] flex flex-col gap-[15px] relative group">
                <button 
                  onClick={() => removeItem(index)}
                  className="absolute top-[10px] right-[10px] text-textColor hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
                <div className="flex items-center gap-[10px]">
                  <span className="font-bold">Day</span>
                  <input 
                    type="number" 
                    value={item.day}
                    onChange={(e) => updateItem(index, 'day', parseInt(e.target.value) || 0)}
                    className="bg-transparent border border-tableBorder rounded-[4px] px-[10px] py-[5px] w-[80px] text-textColor focus:outline-none"
                  />
                </div>
                
                <textarea 
                  value={item.message}
                  onChange={(e) => updateItem(index, 'message', e.target.value)}
                  placeholder="Enter message content..."
                  className="bg-transparent border border-tableBorder rounded-[4px] px-[15px] py-[10px] min-h-[100px] w-full text-textColor focus:outline-none focus:border-btnPrimary resize-y"
                />
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Media URL (Optional)</label>
                  <input
                    className="bg-transparent border border-tableBorder rounded-[4px] px-[15px] py-[10px] w-full text-textColor focus:outline-none focus:border-btnPrimary"
                    name={`media-${index}`}
                    value={item.mediaUrl || ''}
                    onChange={(e) => updateItem(index, 'mediaUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex flex-wrap gap-[20px] items-center pt-[5px]">
                  <Checkbox
                    disableForm={true}
                    variant="hollow"
                    label={t('drip_protect_content', 'Protect Content (anti-leak / no copy / no forward)')}
                    checked={item.protectContent !== false}
                    onChange={(e) => updateItem(index, 'protectContent', e.target.value)}
                  />
                  <Checkbox
                    disableForm={true}
                    variant="hollow"
                    label={t('drip_has_spoiler', 'Spoiler Effect (blur on photo/video)')}
                    checked={!!item.hasSpoiler}
                    onChange={(e) => updateItem(index, 'hasSpoiler', e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-[10px] items-center">
                  <div className="flex-1 w-full">
                    <Input
                      disableForm={true}
                      name={`btn-text-${index}`}
                      label={t('drip_button_text', 'Inline Button Text (Optional)')}
                      placeholder={t('drip_button_text_placeholder', 'e.g. 💎 VIP Access / Checkout')}
                      value={item.buttonText || ''}
                      onChange={(e) => updateItem(index, 'buttonText', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <Input
                      disableForm={true}
                      name={`btn-url-${index}`}
                      label={t('drip_button_url', 'Button URL (Optional)')}
                      placeholder="https://t.me/..."
                      value={item.buttonUrl || ''}
                      onChange={(e) => updateItem(index, 'buttonUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-[20px] border-t border-tableBorder mt-[10px]">
            <Button secondary onClick={addItem}>{t('add_item', 'Add Item')}</Button>
            <Button onClick={saveSequence}>{t('save_sequence', 'Save Sequence')}</Button>
          </div>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="flex flex-col gap-[20px]">
          <div className="bg-newBgColorInner p-[20px] rounded-[8px] flex flex-col gap-[15px]">
            <h2 className="text-xl font-bold">{t('enroll_subscriber', 'Enroll Subscriber')}</h2>
            <div className="flex gap-[10px] items-end">
              <div className="flex-1">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t('subscriber_id_or_email', 'Subscriber ID / Email')}</label>
                  <input 
                    className="bg-transparent border border-tableBorder rounded-[4px] px-[15px] py-[10px] w-full text-textColor focus:outline-none focus:border-btnPrimary"
                    name="subscriber"
                    value={newSubscriber}
                    onChange={(e) => setNewSubscriber(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <Button onClick={enrollSubscriber}>{t('enroll', 'Enroll')}</Button>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto bg-newBgColorInner rounded-[8px] p-[20px]">
            <h2 className="text-xl font-bold mb-[15px]">{t('enrolled_subscribers', 'Enrolled Subscribers')}</h2>
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="p-[10px] border-b border-tableBorder">{t('identifier', 'Identifier')}</th>
                  <th className="p-[10px] border-b border-tableBorder">{t('enrolled_at', 'Enrolled At')}</th>
                  <th className="p-[10px] border-b border-tableBorder">{t('status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub: any, idx: number) => (
                  <tr key={sub.id || idx}>
                    <td className="p-[10px] border-b border-tableBorder font-medium">
                      <div className="flex flex-col">
                        <span>{sub.chatId || sub.email || sub.identifier || 'Unknown'}</span>
                        {sub.deliveries && sub.deliveries.length > 0 && (
                          <div className="mt-2 text-xs text-textColor/70">
                            <strong>Deliveries:</strong>
                            <ul className="list-disc ml-4">
                              {sub.deliveries.map((del: any, i: number) => (
                                <li key={del.id || i}>
                                  Day {del.item?.day ?? del.day ?? 'N/A'} ({del.status}) - {new Date(del.deliveredAt || del.createdAt).toLocaleString()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-[10px] border-b border-tableBorder text-textColor align-top">
                      {sub.enrolledAt
                        ? new Date(sub.enrolledAt).toLocaleString()
                        : (sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A')}
                    </td>
                    <td className="p-[10px] border-b border-tableBorder align-top">
                      <span className="bg-btnPrimary text-white px-[8px] py-[2px] rounded-full text-xs">Active</span>
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-[20px] text-center text-textColor">
                      {t('no_subscribers', 'No subscribers enrolled yet.')}
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
