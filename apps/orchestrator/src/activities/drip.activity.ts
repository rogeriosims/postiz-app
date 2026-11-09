import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class DripActivity {
  private telegramBot: TelegramBot | undefined;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.TELEGRAM_TOKEN) {
      this.telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN);
    }
  }

  async sendTelegramDripMessageActivity(
    chatId: string,
    content: string,
    media: string | null,
    subscriberId: string,
    itemId: string
  ): Promise<void> {
    if (!this.telegramBot) {
      console.warn('TELEGRAM_TOKEN is not set, skipping Telegram drip message');
      return;
    }

    try {
      let hasSpoiler = false;
      let protectContent = true;
      let replyMarkup: any = undefined;

      if (itemId) {
        const item = await this.prisma.dripSequenceItem.findUnique({
          where: { id: itemId },
        });
        if (item) {
          hasSpoiler = (item as any).hasSpoiler ?? false;
          protectContent = (item as any).protectContent ?? true;
          if ((item as any).buttonText && (item as any).buttonUrl) {
            replyMarkup = {
              inline_keyboard: [
                [
                  {
                    text: (item as any).buttonText,
                    url: (item as any).buttonUrl,
                  },
                ],
              ],
            };
          }
        }
      }

      if (media) {
        const isVideo = media.match(/\.(mp4|webm|mov)$/i);
        const options: any = {
          caption: content,
          parse_mode: 'HTML',
          protect_content: protectContent,
          has_spoiler: hasSpoiler,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        };
        if (isVideo) {
          await this.telegramBot.sendVideo(chatId, media, options);
        } else {
          await this.telegramBot.sendPhoto(chatId, media, options);
        }
      } else {
        await this.telegramBot.sendMessage(chatId, content, {
          parse_mode: 'HTML',
          protect_content: protectContent,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        });
      }

      await this.prisma.dripDelivery.create({
        data: {
          subscriberId,
          itemId,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error('Failed to send Telegram drip message:', error);
      await this.prisma.dripDelivery.create({
        data: {
          subscriberId,
          itemId,
          status: 'FAILED',
        },
      });
      throw error;
    }
  }
}
