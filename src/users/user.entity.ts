import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('users') // nama tabel di database
export class User {
  @PrimaryGeneratedColumn('uuid') // id otomatis UUID
  id: string;

  @Column({ unique: true }) // email harus unik
  email: string;

  @Column() // password disimpan hash
  password: string;

  // Relasi Many-to-One → banyak user bisa punya satu role
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' }) // foreign key role_id
  role: Role;
}
