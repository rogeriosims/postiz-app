import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DripService } from './drip.service';
import { CreateSequenceDto } from './dtos/create-sequence.dto';
import { AddSequenceItemDto } from './dtos/add-sequence-item.dto';
import { EnrollSubscriberDto } from './dtos/enroll-subscriber.dto';

@ApiTags('Drip')
@Controller('drip')
export class DripController {
  constructor(private readonly dripService: DripService) {}

  @Get('sequences')
  @ApiOperation({ summary: 'Get all drip sequences' })
  @ApiResponse({ status: 200, description: 'List of all drip sequences.' })
  async getSequences() {
    return this.dripService.getSequences();
  }

  @Get('sequences/:id')
  @ApiOperation({ summary: 'Get sequence details' })
  @ApiResponse({ status: 200, description: 'The sequence details.' })
  async getSequence(@Param('id') sequenceId: string) {
    return this.dripService.getSequence(sequenceId);
  }

  @Get('sequences/:id/items')
  @ApiOperation({ summary: 'Get all items for a sequence' })
  @ApiResponse({ status: 200, description: 'List of sequence items.' })
  async getSequenceItems(@Param('id') sequenceId: string) {
    return this.dripService.getSequenceItems(sequenceId);
  }

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

  @Delete('sequences/:id/items/:itemId')
  @ApiOperation({ summary: 'Delete a sequence item' })
  @ApiResponse({ status: 200, description: 'The sequence item has been deleted.' })
  async deleteSequenceItem(
    @Param('id') sequenceId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.dripService.deleteSequenceItem(sequenceId, itemId);
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Get subscribers, optionally filtered by sequenceId' })
  @ApiQuery({ name: 'sequenceId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of subscribers.' })
  async getSubscribers(@Query('sequenceId') sequenceId?: string) {
    return this.dripService.getSubscribers(sequenceId);
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
