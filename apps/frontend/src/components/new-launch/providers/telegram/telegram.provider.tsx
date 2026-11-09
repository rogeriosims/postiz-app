'use client';

import {
  PostComment,
  withProvider,
} from '@gitroom/frontend/components/new-launch/providers/high.order.provider';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { Input } from '@gitroom/react/form/input';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useSettings } from '@gitroom/frontend/components/launches/helpers/use.values';
import { TelegramDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/telegram.dto';

const TelegramSettings = () => {
  const t = useT();
  const { register } = useSettings();

  return (
    <div className="mb-[20px] flex flex-col gap-[12px]">
      <Checkbox
        variant="hollow"
        label={t('telegram_protect_content', 'Protect Content (anti-copy / anti-forward)')}
        {...register('protect_content', {
          value: true,
        })}
      />
      <Checkbox
        variant="hollow"
        label={t('telegram_has_spoiler', 'Spoiler Effect (blur on photos/videos)')}
        {...register('has_spoiler', {
          value: false,
        })}
      />
      <div className="flex gap-[10px] items-center mt-[4px]">
        <div className="flex-1">
          <Input
            label={t('telegram_button_text', 'Inline Button Text (Optional)')}
            placeholder={t('telegram_button_text_placeholder', 'e.g. 💎 VIP Access / Checkout')}
            {...register('button_text')}
          />
        </div>
        <div className="flex-1">
          <Input
            label={t('telegram_button_url', 'Button URL (Optional)')}
            placeholder="https://t.me/..."
            {...register('button_url')}
          />
        </div>
      </div>
    </div>
  );
};

export default withProvider<TelegramDto>({
  postComment: PostComment.COMMENT,
  minimumCharacters: [],
  SettingsComponent: TelegramSettings,
  CustomPreviewComponent: undefined,
  dto: TelegramDto,
  maximumCharacters: 4096,
});
