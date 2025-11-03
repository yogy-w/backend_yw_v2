// src/kajian/entities/kajian.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Media } from '../../media/media.entity';

@Entity('kajian')
export class Kajian {
  @PrimaryColumn('text')
  id: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  pemateri?: string | null;

  @Column({ type: 'text', nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  jadwal?: string | null;

  @ManyToOne(() => Media, { nullable: true, cascade: false })
  @JoinColumn({ name: 'media_id' })
  media?: Media | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;
}
