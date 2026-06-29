import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { IsNotEmpty, MinLength, IsArray, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, Ingredient } from '@kochrezepte/shared';
import { UserEntity } from '../user/user.entity';

/** Validiert eine einzelne Zutat (name nicht leer). */
class IngredientValidate implements Ingredient {
  @IsNotEmpty({ message: 'Zutaten-Name darf nicht leer sein' })
  name: string;

  @IsOptional()
  amount?: string;
}

@Entity('recipes')
export class RecipeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  @IsNotEmpty({ message: 'Titel darf nicht leer sein' })
  @MinLength(1, { message: 'Titel muss mindestens 1 Zeichen haben' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string | null;

  /** Zutaten als JSON-Array [{ name, amount }] */
  @Column({ type: 'simple-json' })
  @IsArray({ message: 'Zutaten muss ein Array sein' })
  @ValidateNested({ each: true })
  @Type(() => IngredientValidate)
  ingredients: Ingredient[];

  /** Zubereitungsschritte als JSON-Array von Strings */
  @Column({ type: 'simple-json' })
  @IsArray({ message: 'Schritte muss ein Array sein' })
  steps: string[];

  /** Kochzeit in Minuten (muss > 0) */
  @Column({ type: 'int' })
  @Min(1, { message: 'Kochzeit muss mindestens 1 Minute betragen' })
  cookingTimeInMinutes: number;

  /** Schwierigkeitsgrad: easy | medium | hard */
  @Column({ type: 'varchar', enum: ['easy', 'medium', 'hard'] })
  difficulty: Difficulty;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  imageUrl?: string | null;

  // --- Relations ---

  /** Rezept gehoert zu einem User (ManyToOne) */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  /** Fremdschluessel-Spalte (UUID des Users) */
  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  // --- Timestamps ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
