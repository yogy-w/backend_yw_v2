import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  mime: string;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  alt_text: string;

  @CreateDateColumn()
  created_at: Date;
}
