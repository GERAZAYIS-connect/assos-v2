import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // AuthGuard('jwt') should have populated request.user
    const user = request.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('Utilisateur non authentifié.');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { platformRole: true, email: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    if (dbUser.platformRole !== 'SUPER_ADMIN' && dbUser.platformRole !== 'CO_ADMIN') {
      throw new ForbiddenException(
        `Accès refusé. Le compte ${dbUser.email} ne possède pas les privilèges d'administration de la plateforme.`
      );
    }

    return true;
  }
}
