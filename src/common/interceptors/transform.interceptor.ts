import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | StreamableFile> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        return {
          data: data ?? null,
          message: 'OK',
          success: true,
        };
      }),
    );
  }
}
