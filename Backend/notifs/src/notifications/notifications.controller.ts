import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DevolucionNotificationDto } from './dto/devolucion-notification.dto';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('devolucion')
  async handleDevolucionNotification(@Body() notification: DevolucionNotificationDto) {
    this.logger.log(`Notificación de devolución recibida: ${notification.tipo} - ${notification.devolucionId}`);
    
    return this.notificationsService.processDevolucionNotification(notification);
  }
}
