import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  filename: string;

  @Column({ type: 'text', nullable: false })
  url: string;

  @Column({ type: 'text', nullable: true })
  storage_bucket?: string | null;

  @Column({ type: 'text', nullable: true })
  storage_path?: string | null;

  @Column({ type: 'text', nullable: true })
  mime?: string | null;

  @Column({ type: 'int', nullable: true })
  width?: number | null;

  @Column({ type: 'int', nullable: true })
  height?: number | null;

  @Column({ type: 'bigint', nullable: true })
  size?: number | null;

  @Column({ type: 'text', nullable: true })
  alt_text?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  variants?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by?: string | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;
}
