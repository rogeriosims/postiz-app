import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateSequenceDto } from './dtos/create-sequence.dto';
import { AddSequenceItemDto } from './dtos/add-sequence-item.dto';
import { EnrollSubscriberDto } from './dtos/enroll-subscriber.dto';

@Injectable()
export class DripService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.dripSequenceItem.create({
      data: {
        sequenceId,
        day: addSequenceItemDto.day,
        content: addSequenceItemDto.content,
        media: addSequenceItemDto.media,
      },
    });
  }

  async enrollSubscriber(enrollSubscriberDto: EnrollSubscriberDto) {
    const sequence = await this.prisma.dripSequence.findUnique({
      where: { id: enrollSubscriberDto.sequenceId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID ${enrollSubscriberDto.sequenceId} not found`);
    }

    return this.prisma.dripSubscriber.create({
      data: {
        chatId: enrollSubscriberDto.chatId,
        sequenceId: enrollSubscriberDto.sequenceId,
      },
    });
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
