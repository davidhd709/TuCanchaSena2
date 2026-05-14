import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Normalize role for legacy support (bussines -> business)
    const normalizeRole = (role: string): Role => {
      return (role === 'bussines' ? 'business' : role) as Role;
    };
    
    const normalizedUserRole = normalizeRole(user?.role);
    
    if (!user || !required.includes(normalizedUserRole)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
