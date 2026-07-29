import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ContactService, CreateContactMessageDto } from '../../application/contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContactForm(@Body() dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }

  // Future use: Only for admins. For now, just exposed without guard or you can add a guard later.
  @Get()
  async getMessages() {
    return this.contactService.getMessages();
  }
}
