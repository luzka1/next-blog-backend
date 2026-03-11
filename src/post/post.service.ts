import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/user/entities/user.entity';
import { createSlugFromText } from 'src/common/utils/create-slug-from-text';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(dto: CreatePostDto, author: User) {
    const post = this.postRepository.create({
      slug: createSlugFromText(dto.title),
      author,
      title: dto.title,
      excerpt: dto.excerpt,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
    });

    const created = await this.postRepository
      .save(post)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          this.logger.error('Erro ao criar post', err.stack);
        }

        throw new BadRequestException('Erro ao criar o post!');
      });

    return created;
  }

  async findAll(postData: Partial<Post>) {
    const posts = await this.postRepository.find({
      where: postData,
      order: {
        createdAt: 'DESC',
      },
      relations: ['author'],
    });
    return posts;
  }

  async findOneOrfail(postData: Partial<Post>) {
    const post = await this.findOne(postData);

    if (!post) {
      throw new NotFoundException('Post não encontrado!');
    }
    return post;
  }

  async findOne(postData: Partial<Post>) {
    const post = await this.postRepository.findOne({
      where: postData,
      relations: ['author'],
    });
    return post;
  }

  async findOneOwnedOrFail(postData: Partial<Post>, author: User) {
    const post = await this.findOneOwned(postData, author);

    if (!post) {
      throw new NotFoundException('Post não encontrado!');
    }
    return post;
  }

  async findOneOwned(postData: Partial<Post>, author: User) {
    const post = await this.postRepository.findOne({
      where: {
        ...postData,
        author: { id: author.id },
      },
      relations: ['author'],
    });
    return post;
  }

  async findAllOwned(author: User) {
    const posts = await this.postRepository.find({
      where: {
        author: { id: author.id },
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['author'],
    });
    return posts;
  }

  async update(postData: Partial<Post>, dto: UpdatePostDto, author: User) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Dados não enviados!');
    }

    const post = await this.findOneOwnedOrFail(postData, author);

    post.title = dto.title ?? post.title;
    post.content = dto.content ?? post.content;
    post.excerpt = dto.excerpt ?? post.excerpt;
    post.coverImageUrl = dto.coverImageUrl ?? post.coverImageUrl;
    post.published = dto.published ?? post.published;

    const updated = await this.postRepository.save(post);

    return updated;
  }

  async remove(postData: Partial<Post>, author: User) {
    const post = await this.findOneOrfail(postData);
    await this.postRepository.delete({
      ...postData,
      author: { id: author.id },
    });
    return post;
  }
}
