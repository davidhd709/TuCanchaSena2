import { Paginated, PaginationDto } from '../dto/pagination.dto';

export function pageParams(p: PaginationDto): { skip: number; take: number; page: number; pageSize: number } {
  const page = p.page ?? 1;
  const pageSize = p.pageSize ?? 20;
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function buildPaginated<T>(data: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { data, total, page, pageSize };
}
