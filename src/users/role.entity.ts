import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles') // nama tabel di database
export class Role {
  @PrimaryGeneratedColumn('uuid') // id otomatis UUID
  id: string;

  @Column({ unique: true }) // nama role unik (admin, user, dsb)
  name: string;

  // Relasi One-to-Many → satu role bisa dimiliki banyak user
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
