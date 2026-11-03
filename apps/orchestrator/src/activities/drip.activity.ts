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
      if (media) {
        const isVideo = media.match(/\.(mp4|webm|mov)$/i);
        if (isVideo) {
          await this.telegramBot.sendVideo(chatId, media, { caption: content, parse_mode: 'HTML' });
        } else {
          await this.telegramBot.sendPhoto(chatId, media, { caption: content, parse_mode: 'HTML' });
        }
      } else {
        await this.telegramBot.sendMessage(chatId, content, { parse_mode: 'HTML' });
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
