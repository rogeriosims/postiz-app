import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DripService } from './drip.service';
import { CreateSequenceDto } from './dtos/create-sequence.dto';
import { AddSequenceItemDto } from './dtos/add-sequence-item.dto';
import { EnrollSubscriberDto } from './dtos/enroll-subscriber.dto';

@ApiTags('Drip')
@Controller('api/drip')
export class DripController {
  constructor(private readonly dripService: DripService) {}

  @Post('sequences')
  @ApiOperation({ summary: 'Create a new drip sequence' })
  @ApiResponse({ status: 201, description: 'The sequence has been successfully created.' })
  async createSequence(@Body() createSequenceDto: CreateSequenceDto) {
    return this.dripService.createSequence(createSequenceDto);
  }

  @Post('sequences/:id/items')
  @ApiOperation({ summary: 'Add a day item to a sequence' })
  @ApiResponse({ status: 201, description: 'The sequence item has been successfully created.' })
  async addSequenceItem(
    @Param('id') sequenceId: string,
    @Body() addSequenceItemDto: AddSequenceItemDto,
  ) {
    return this.dripService.addSequenceItem(sequenceId, addSequenceItemDto);
  }

  @Post('subscribers')
  @ApiOperation({ summary: 'Enroll a subscriber in a sequence' })
  @ApiResponse({ status: 201, description: 'The subscriber has been successfully enrolled.' })
  async enrollSubscriber(@Body() enrollSubscriberDto: EnrollSubscriberDto) {
    return this.dripService.enrollSubscriber(enrollSubscriberDto);
  }

  @Get('subscribers/:id/deliveries')
  @ApiOperation({ summary: 'Audit deliveries for a subscriber' })
  @ApiResponse({ status: 200, description: 'List of deliveries for the subscriber.' })
  async getSubscriberDeliveries(@Param('id') subscriberId: string) {
    return this.dripService.getSubscriberDeliveries(subscriberId);
  }
}
