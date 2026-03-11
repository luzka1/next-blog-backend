import { PickType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePostDto extends PickType(CreatePostDto, [
  'title',
  'coverImageUrl',
  'content',
  'excerpt',
]) {
  @IsOptional()
  @IsBoolean({ message: 'Campo de publicação de post precisa ser boolean' })
  published?: boolean;
}
