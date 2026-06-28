import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Ungültiges E-Mail-Format' })
  email: string;

  @Column()
  @IsNotEmpty({ message: 'Passwort-Hash darf nicht leer sein' })
  passwordHash: string;

  @Column()
  @IsNotEmpty({ message: 'Name darf nicht leer sein' })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
