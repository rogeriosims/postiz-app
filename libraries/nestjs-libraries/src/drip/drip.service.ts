import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateSequenceDto } from './dtos/create-sequence.dto';
import { AddSequenceItemDto } from './dtos/add-sequence-item.dto';
import { EnrollSubscriberDto } from './dtos/enroll-subscriber.dto';
import { TemporalService } from 'nestjs-temporal-core';

@Injectable()
export class DripService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalService: TemporalService
  ) {}

  async getSequences() {
    return this.prisma.dripSequence.findMany({
      include: {
        items: true,
        subscribers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSequence(id: string) {
    const sequence = await this.prisma.dripSequence.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            day: 'asc',
          },
        },
        subscribers: true,
      },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID ${id} not found`);
    }

    return sequence;
  }

  async getSequenceItems(sequenceId: string) {
    return this.prisma.dripSequenceItem.findMany({
      where: { sequenceId },
      orderBy: { day: 'asc' },
    });
  }

  async createSequence(createSequenceDto: CreateSequenceDto) {
    return this.prisma.dripSequence.create({
      data: {
        name: createSequenceDto.name,
      },
    });
  }

  async addSequenceItem(sequenceId: string, addSequenceItemDto: AddSequenceItemDto) {
    const sequence = await this.prisma.dripSequence.findUnique({
      where: { id: sequenceId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID ${sequenceId} not found`);
    }

    const content = addSequenceItemDto.content ?? addSequenceItemDto.message ?? '';
    const media = addSequenceItemDto.media ?? addSequenceItemDto.mediaUrl ?? null;
    const hasSpoiler = addSequenceItemDto.hasSpoiler !== undefined ? !!addSequenceItemDto.hasSpoiler : false;
    const protectContent = addSequenceItemDto.protectContent !== undefined ? !!addSequenceItemDto.protectContent : true;
    const buttonText = addSequenceItemDto.buttonText ?? null;
    const buttonUrl = addSequenceItemDto.buttonUrl ?? null;

    if (addSequenceItemDto.id) {
      const existing = await this.prisma.dripSequenceItem.findFirst({
        where: { id: addSequenceItemDto.id, sequenceId },
      });
      if (existing) {
        return this.prisma.dripSequenceItem.update({
          where: { id: addSequenceItemDto.id },
          data: {
            day: addSequenceItemDto.day,
            content,
            media,
            hasSpoiler,
            protectContent,
            buttonText,
            buttonUrl,
          },
        });
      }
    }

    return this.prisma.dripSequenceItem.create({
      data: {
        sequenceId,
        day: addSequenceItemDto.day,
        content,
        media,
        hasSpoiler,
        protectContent,
        buttonText,
        buttonUrl,
      },
    });
  }

  async deleteSequenceItem(sequenceId: string, itemId: string) {
    return this.prisma.dripSequenceItem.deleteMany({
      where: {
        id: itemId,
        sequenceId,
      },
    });
  }

  async getSubscribers(sequenceId?: string) {
    return this.prisma.dripSubscriber.findMany({
      where: sequenceId ? { sequenceId } : undefined,
      include: {
        deliveries: {
          include: {
            item: true,
          },
          orderBy: {
            deliveredAt: 'desc',
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async enrollSubscriber(enrollSubscriberDto: EnrollSubscriberDto) {
    const sequence = await this.prisma.dripSequence.findUnique({
      where: { id: enrollSubscriberDto.sequenceId },
      include: {
        items: true,
      }
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID ${enrollSubscriberDto.sequenceId} not found`);
    }

    const chatId = enrollSubscriberDto.chatId || enrollSubscriberDto.email;
    if (!chatId) {
      throw new NotFoundException('Chat ID is required to enroll subscriber');
    }

    const subscriber = await this.prisma.dripSubscriber.create({
      data: {
        chatId,
        sequenceId: enrollSubscriberDto.sequenceId,
      },
    });

    try {
      await this.temporalService.client
        .getRawClient()
        ?.workflow.start('dripSubscriberSequenceWorkflow', {
        taskQueue: 'main',
        workflowId: `drip-subscriber-${subscriber.id}`,
        args: [
          {
            subscriberId: subscriber.id,
            chatId: subscriber.chatId,
            sequenceId: sequence.id,
            items: sequence.items.map(item => ({
              id: item.id,
              day: item.day,
              content: item.content,
              media: item.media,
            })),
          },
        ],
      });
    } catch (error) {
      console.error('Failed to start temporal workflow for drip subscriber:', error);
    }

    return subscriber;
  }

  async getSubscriberDeliveries(subscriberId: string) {
    const subscriber = await this.prisma.dripSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${subscriberId} not found`);
    }

    return this.prisma.dripDelivery.findMany({
      where: { subscriberId },
      include: {
        item: true,
      },
      orderBy: {
        deliveredAt: 'desc',
      },
    });
  }
}
