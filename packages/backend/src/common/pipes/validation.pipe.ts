import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid ID parameter');
    }
    return id;
  }
}
